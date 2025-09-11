import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, User, Bot, Award, Clock, CheckCircle, Phone, Users, Bus, ServerCog, Crown, Volume2, VolumeX, AlertTriangle, Target, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InterviewSessionWithScenario, InterviewMessage } from "@shared/schema";
import { integratedVoiceService, type VoiceServiceStatus, type TranscriptionResult, type TTSResult } from "@/services/integrated-voice-service";
import VoiceControls from "@/components/prepare-ai/VoiceControls";

const STAGE_ICONS = {
  'phone-screening': Phone,
  'functional-team': Users,
  'hiring-manager': Bus,
  'subject-matter': ServerCog,
  'executive-final': Crown,
};

interface ChatMessage {
  id: string;
  messageType: "ai_question" | "user_response";
  content: string;
  timestamp: Date;
  questionNumber?: number;
}

export default function InterviewPractice() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(25); // Dynamic based on session config
  const [showEndInterviewWarning, setShowEndInterviewWarning] = useState(false);
  
  // Voice-related state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceServiceStatus>('initializing');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [transcriptionActive, setTranscriptionActive] = useState(false);
  const voiceInitializedRef = useRef(false);

  // Fetch session data
  const { data: session, isLoading: sessionLoading } = useQuery<InterviewSessionWithScenario>({
    queryKey: [`/api/practice/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch messages - using the existing API that returns messages in session.messages
  const messages = session?.messages || [];

  // Update maxQuestions from session data
  useEffect(() => {
    if (session?.totalQuestions) {
      setMaxQuestions(session.totalQuestions);
    }
  }, [session?.totalQuestions]);

  // Auto-generate first question when session loads with no messages
  useEffect(() => {
    if (session && messages.length === 0 && session.status !== 'completed' && !generateAiResponseMutation.isPending) {
      console.log('🎯 Auto-generating first AI question for new session');
      generateAiResponseMutation.mutate();
    }
  }, [session, messages.length]);

  // Send message mutation (adapted to work with existing Practice API)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, voiceMetadata }: { content: string; voiceMetadata?: any }) => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/user-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          content,
          questionNumber: currentQuestionNumber,
          questionContext: messages.filter(m => m.messageType === 'ai_question').slice(-1)[0]?.content || "",
          inputMethod: voiceMetadata ? 'voice' : 'text',
          voiceMetadata: voiceMetadata ? {
            transcriptionMethod: voiceMetadata.method,
            confidence: voiceMetadata.confidence,
            processingTime: voiceMetadata.processingTime,
            audioMetrics: voiceMetadata.audioMetrics
          } : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/practice/sessions/${sessionId}`] });
      // Trigger AI response
      setTimeout(() => {
        generateAiResponseMutation.mutate();
      }, 500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate AI response mutation (using existing Practice API)
  const generateAiResponseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/ai-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userResponse: message }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/practice/sessions/${sessionId}`] });
      
      // Speak the AI response if voice is enabled
      if (voiceEnabled && data.content) {
        speakAIResponse(data.content);
      }
      
      const questionCount = session?.currentQuestion || currentQuestionNumber;
      
      if (data.isCompleted || questionCount >= maxQuestions) {
        setIsCompleted(true);
        toast({
          title: "Interview Completed!",
          description: `You answered ${questionCount} questions. Your comprehensive AI evaluation is being generated...`,
        });
        // Redirect to assessment after a short delay
        setTimeout(() => {
          window.location.href = `/practice/assessment/${sessionId}`;
        }, 3000);
      } else {
        setCurrentQuestionNumber(prev => prev + 1);
        
        // Show warning when approaching end
        if (questionCount >= maxQuestions - 5) {
          toast({
            title: "Nearly Finished!",
            description: `Only ${maxQuestions - questionCount} questions remaining.`,
            variant: "default",
          });
        }
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete interview mutation (using existing Practice API)
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/practice/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to complete interview");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsCompleted(true);
      const questionCount = session?.currentQuestion || currentQuestionNumber;
      toast({
        title: "Interview Ended Early!",
        description: `Session completed with ${questionCount} questions. Generating comprehensive AI evaluation...`,
      });
      setTimeout(() => {
        window.location.href = `/practice/assessment/${sessionId}`;
      }, 3000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Voice event handlers
  const handleTranscriptionResult = (result: TranscriptionResult) => {
    setTranscriptionActive(false);
    setIsRecording(false);
    setIsListening(false);
    
    if (result.text.trim()) {
      setMessage(result.text);
      // Auto-submit voice transcription with metadata
      sendVoiceMessage(result.text.trim(), result);
    }
  };
  
  const handleTTSComplete = (result: TTSResult) => {
    setIsSpeaking(false);
    if (!result.success) {
      console.error('TTS failed:', result.error);
    }
  };
  
  const handleVoiceError = (error: string, service: string) => {
    toast({
      title: "Voice Error",
      description: `${service}: ${error}`,
      variant: "destructive"
    });
    setIsRecording(false);
    setIsListening(false);
    setIsSpeaking(false);
  };
  
  // Voice control handlers
  const handleStartRecording = async () => {
    if (isRecording || transcriptionActive) return;
    
    setTranscriptionActive(true);
    setIsListening(true);
    
    const started = await integratedVoiceService.startRecording();
    if (started) {
      setIsRecording(true);
    } else {
      setTranscriptionActive(false);
      setIsListening(false);
    }
  };
  
  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    setIsListening(false);
    await integratedVoiceService.stopRecording();
    setIsRecording(false);
  };
  
  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      integratedVoiceService.stopSpeech();
    }
  };
  
  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
  };
  
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
  };
  
  const handleStopSpeech = () => {
    integratedVoiceService.stopSpeech();
    setIsSpeaking(false);
  };
  
  const handleTestVoice = async () => {
    const language = session?.interviewLanguage || 'en';
    await integratedVoiceService.testVoice(language === 'en' ? 'en-US' : `${language}-MY`);
  };
  
  // Speak AI response function
  const speakAIResponse = async (text: string) => {
    if (!voiceEnabled || isSpeaking) return;
    
    setIsSpeaking(true);
    const language = session?.interviewLanguage || 'en';
    const voiceLanguage = language === 'en' ? 'en-US' : `${language}-MY`;
    
    try {
      await integratedVoiceService.speak(text, {
        language: voiceLanguage,
        rate: speechRate,
        voice: selectedVoice || undefined
      });
    } catch (error) {
      console.error('TTS failed:', error);
      setIsSpeaking(false);
    }
  };
  
  // Send voice message with metadata
  const sendVoiceMessage = (content: string, transcriptionResult: TranscriptionResult) => {
    if (!content.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ content: content.trim(), voiceMetadata: transcriptionResult });
  };
  
  // Send text message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ content: message.trim() });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize voice service
  useEffect(() => {
    if (!voiceInitializedRef.current) {
      voiceInitializedRef.current = true;
      
      // Configure voice service for the session language
      const language = session?.interviewLanguage || 'en';
      const voiceLanguage = language === 'en' ? 'en-US' : `${language}-MY`;
      
      integratedVoiceService.updateConfig({
        language: voiceLanguage,
        enableWhisperFallback: true,
        enableQualityMonitoring: true,
        autoSelectTTSVoice: true
      });
      
      // Set up voice event handlers
      integratedVoiceService.setEventHandlers({
        onStatusChange: setVoiceStatus,
        onTranscriptionResult: handleTranscriptionResult,
        onTTSComplete: handleTTSComplete,
        onError: handleVoiceError
      });
    }
  }, [session?.interviewLanguage]);
  
  // Generate initial AI question if no messages exist
  useEffect(() => {
    if (session && messages.length === 0) {
      generateAiResponseMutation.mutate();
    }
  }, [session?.id, messages.length]);
  
  // Auto-speak latest AI message when messages change
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.messageType === 'ai_question' && !isSpeaking) {
        // Add a small delay to ensure the UI has updated
        setTimeout(() => {
          speakAIResponse(latestMessage.content);
        }, 500);
      }
    }
  }, [messages.length, voiceEnabled]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Session not found.</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                AI Interview Practice in Progress
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  {session?.userJobPosition || 'Interview Practice'} {session?.userCompanyName && `at ${session.userCompanyName}`}
                </span>
                <Badge variant="outline" className="bg-white flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Question {session?.currentQuestion || currentQuestionNumber} of {maxQuestions}
                </Badge>
                {session?.interviewLanguage && (
                  <Badge variant="outline" className="bg-white">
                    {session.interviewLanguage.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right space-y-2">
              {/* Progress Indicator */}
              <div className="flex items-center justify-end space-x-2 mb-2">
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Progress: {Math.round(((session?.currentQuestion || currentQuestionNumber) / maxQuestions) * 100)}%
                </div>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.min(((session?.currentQuestion || currentQuestionNumber) / maxQuestions) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* End Interview Button */}
              {!showEndInterviewWarning ? (
                <Button
                  variant={currentQuestionNumber >= 5 ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowEndInterviewWarning(true)}
                  disabled={completeInterviewMutation.isPending || isCompleted}
                  className="mb-2"
                  data-testid="button-end-interview"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      End Interview Early
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    ⚠️ End interview now? You'll get evaluation based on {currentQuestionNumber} questions.
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => completeInterviewMutation.mutate()}
                      disabled={completeInterviewMutation.isPending}
                      data-testid="button-confirm-end"
                    >
                      Yes, End Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEndInterviewWarning(false)}
                      data-testid="button-cancel-end"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                {formatTime(Math.floor((Date.now() - new Date(session?.startedAt || Date.now()).getTime()) / 1000))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Interview Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 pb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                      <p className="text-lg font-medium mb-2">Welcome to your AI Interview Practice!</p>
                      <p>Your AI interviewer will begin shortly with questions tailored to your scenario.</p>
                    </div>
                  )}
                  
                  {messages.map((msg: InterviewMessage) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.messageType === "user_response" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          msg.messageType === "user_response"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {msg.messageType === "user_response" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-75">
                            {msg.messageType === "user_response" ? "You" : "AI Interviewer"}
                          </span>
                          {msg.questionNumber && (
                            <Badge variant="outline" className="text-xs">
                              Q{msg.questionNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(sendMessageMutation.isPending || generateAiResponseMutation.isPending) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Speech-First Input Interface */}
              <div className="border-t p-4 space-y-4">
                {voiceEnabled ? (
                  <>
                    {/* Primary Voice Input */}
                    <div className="text-center">
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        onMouseDown={handleStartRecording}
                        onMouseUp={handleStopRecording}
                        onTouchStart={handleStartRecording}
                        onTouchEnd={handleStopRecording}
                        disabled={sendMessageMutation.isPending || isCompleted || isSpeaking}
                        className="px-8 py-6 text-lg font-medium min-w-[280px]"
                        data-testid="button-voice-record"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-6 h-6 mr-3 animate-pulse" />
                            Release to Stop Recording
                          </>
                        ) : transcriptionActive ? (
                          <>
                            <div className="w-6 h-6 mr-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing Speech...
                          </>
                        ) : (
                          <>
                            <Mic className="w-6 h-6 mr-3" />
                            Hold to Speak Your Response
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Voice Status Indicators */}
                    {(isRecording || transcriptionActive || isSpeaking) && (
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        {isRecording && (
                          <div className="flex items-center text-red-600">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2" />
                            Recording...
                          </div>
                        )}
                        {transcriptionActive && (
                          <div className="flex items-center text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2" />
                            Processing speech...
                          </div>
                        )}
                        {isSpeaking && (
                          <div className="flex items-center text-green-600">
                            <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                            AI Speaking...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleStopSpeech}
                              className="ml-2 text-green-600"
                              data-testid="button-stop-speech"
                            >
                              Stop
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Fallback Text Input */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 text-center">
                        Having trouble with voice? Use text input instead
                      </summary>
                      <div className="mt-2">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your response here..."
                            disabled={sendMessageMutation.isPending || isCompleted}
                            className="flex-1"
                            data-testid="input-text-message"
                          />
                          <Button
                            type="submit"
                            disabled={!message.trim() || sendMessageMutation.isPending || isCompleted}
                            data-testid="button-send-text"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </details>
                  </>
                ) : (
                  /* Text Input When Voice Disabled */
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your response here..."
                      disabled={sendMessageMutation.isPending || isCompleted}
                      className="flex-1"
                      data-testid="input-text-message"
                    />
                    <Button
                      type="submit"
                      disabled={!message.trim() || sendMessageMutation.isPending || isCompleted}
                      data-testid="button-send-text"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voice Controls */}
          <VoiceControls
            isRecording={isRecording}
            isListening={isListening}
            isSpeaking={isSpeaking}
            voiceEnabled={voiceEnabled}
            speechRate={speechRate}
            selectedVoice={selectedVoice}
            language={session?.interviewLanguage || 'en'}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onToggleVoice={handleToggleVoice}
            onSpeechRateChange={handleSpeechRateChange}
            onVoiceChange={handleVoiceChange}
            onStopSpeech={handleStopSpeech}
            onTestVoice={handleTestVoice}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Scenario:</span>
                <p>{session?.scenario?.title || 'Interview Practice'}</p>
              </div>
              {session?.scenario?.interviewStage && (
                <div>
                  <span className="font-medium text-gray-600">Stage:</span>
                  <p>{session.scenario.interviewStage.replace('-', ' ')}</p>
                </div>
              )}
              {session?.userJobPosition && (
                <div>
                  <span className="font-medium text-gray-600">Position:</span>
                  <p>{session.userJobPosition}</p>
                </div>
              )}
              {session?.userCompanyName && (
                <div>
                  <span className="font-medium text-gray-600">Company:</span>
                  <p>{session.userCompanyName}</p>
                </div>
              )}
              {session?.interviewLanguage && (
                <div>
                  <span className="font-medium text-gray-600">Language:</span>
                  <p>{session.interviewLanguage.toUpperCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Use the STAR method for behavioral questions</p>
              <p>• Be specific with examples and metrics</p>
              <p>• Ask clarifying questions when needed</p>
              <p>• The AI will provide real-time coaching</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}