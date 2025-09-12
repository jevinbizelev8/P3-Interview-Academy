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
import type { PracticeSessionWithMessages, PracticeMessage } from "@shared/schema";
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
  const [interimTranscript, setInterimTranscript] = useState(''); // For real-time transcription display
  const voiceInitializedRef = useRef(false);

  // Fetch session data
  const { data: sessionResponse, isLoading: sessionLoading } = useQuery<{ success: boolean; data: PracticeSessionWithMessages }>({
    queryKey: [`/api/practice/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Extract session and messages from API response
  const session = sessionResponse?.data;
  const messages = session?.messages || [];

  // Update maxQuestions from session data
  useEffect(() => {
    if (session?.totalQuestions) {
      setMaxQuestions(session.totalQuestions);
    }
  }, [session?.totalQuestions]);

  // Auto-generate first question when session loads with no messages (only once)
  useEffect(() => {
    if (session && messages.length === 0 && session.status !== 'completed' && !generateAiResponseMutation.isPending && session.currentQuestionNumber === 1) {
      console.log('🎯 Auto-generating first AI question for new session');
      generateAiResponseMutation.mutate();
    }
  }, [session?.id]); // Only depend on session.id to prevent loops

  // Send message mutation (adapted to work with existing Practice API)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, voiceMetadata }: { content: string; voiceMetadata?: any }) => {
      console.log('🔍 SEND-MESSAGE-MUTATION: Starting with content:', content);
      console.log('🔍 SEND-MESSAGE-MUTATION: voiceMetadata:', voiceMetadata);
      console.log(`🔍 SEND-MESSAGE-MUTATION: sessionId: ${sessionId}, questionNumber: ${currentQuestionNumber}`);
      
      const requestBody = { 
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
      };
      console.log('📤 SEND-MESSAGE-MUTATION: Request body:', requestBody);
      
      const response = await fetch(`/api/practice/sessions/${sessionId}/user-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      console.log(`📥 SEND-MESSAGE-MUTATION: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error('❌ SEND-MESSAGE-MUTATION: Request failed with status:', response.status);
        throw new Error("Failed to send message");
      }
      
      const result = await response.json();
      console.log('✅ SEND-MESSAGE-MUTATION: Success response:', result);
      return result;
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
      
      const questionCount = session?.currentQuestionNumber || currentQuestionNumber;
      
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
      const questionCount = session?.currentQuestionNumber || currentQuestionNumber;
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
    console.log('🔍 INTERVIEW-PRACTICE: handleTranscriptionResult called with result:', result);
    console.log(`🎯 INTERVIEW-PRACTICE: Transcription method: ${result.method}, text: "${result.text}", confidence: ${result.confidence}`);
    
    // Reset all voice states
    setTranscriptionActive(false);
    setIsRecording(false);
    setIsListening(false);
    setInterimTranscript(''); // Clear interim transcript
    
    if (result.text.trim()) {
      console.log(`✅ INTERVIEW-PRACTICE: Valid transcription text found: "${result.text.trim()}"`);
      console.log('🔍 INTERVIEW-PRACTICE: Setting message state for user review (no auto-submit)');
      setMessage(result.text.trim());
    } else {
      console.warn('❌ INTERVIEW-PRACTICE: No valid transcription text found');
    }
  };

  // Handle interim transcription results (real-time display)
  const handleInterimTranscription = (interimText: string) => {
    console.log('🔍 INTERIM-TRANSCRIPTION:', interimText);
    setInterimTranscript(interimText);
    // Update the message field with interim + existing text for real-time feedback
    setMessage(prev => {
      const baseText = prev.replace(interimTranscript, '').trim(); // Remove previous interim
      return baseText + (baseText && interimText ? ' ' : '') + interimText;
    });
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
    // Reset all voice states on error
    setIsRecording(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscriptionActive(false);
    setInterimTranscript('');
  };
  
  // Voice control handlers - Toggle recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      console.log('🛑 STOPPING recording...');
      setIsListening(false);
      await integratedVoiceService.stopRecording();
      // Force reset all states
      setIsRecording(false);
      setTranscriptionActive(false);
      setInterimTranscript('');
      console.log('✅ Recording stopped and states reset');
    } else {
      // Start recording - force cleanup first
      console.log('🎤 STARTING recording...');
      
      // Force stop any previous recording first
      await integratedVoiceService.stopRecording();
      
      // Reset all states completely
      setIsRecording(false);
      setTranscriptionActive(false);
      setIsListening(false);
      setInterimTranscript('');
      
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now start fresh
      setTranscriptionActive(true);
      setIsListening(true);
      
      const started = await integratedVoiceService.startRecording();
      if (started) {
        setIsRecording(true);
        console.log('✅ Recording started successfully');
      } else {
        console.error('❌ Failed to start recording');
        setTranscriptionActive(false);
        setIsListening(false);
        setInterimTranscript('');
      }
    }
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
    const language = session?.preferredLanguage || 'en';
    
    // Use the same language mapping as speakAIResponse
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'th': 'th-TH',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'vi': 'vi-VN',
      'tl': 'fil-PH'
    };
    
    const voiceLanguage = languageMap[language] || 'en-US';
    await integratedVoiceService.testVoice(voiceLanguage);
  };
  
  // Speak AI response function
  const speakAIResponse = async (text: string) => {
    if (!voiceEnabled || isSpeaking) return;
    
    setIsSpeaking(true);
    const language = session?.preferredLanguage || 'en';
    
    // Map language codes to proper TTS locale codes with ASEAN fallback
    const getVoiceLanguage = (lang: string): string => {
      const languageMap: Record<string, string> = {
        'en': 'en-US',
        'th': 'th-TH',
        'id': 'id-ID',
        'ms': 'ms-MY',
        'vi': 'vi-VN',
        'tl': 'fil-PH'
      };
      
      const targetLang = languageMap[lang] || 'en-US';
      
      // Check if voices are available for target language
      const voices = typeof window !== 'undefined' ? window.speechSynthesis?.getVoices() || [] : [];
      const hasTargetVoice = voices.some(v => v.lang.toLowerCase().startsWith(lang));
      
      if (!hasTargetVoice && lang === 'th') {
        // Thai fallback: try Indonesian first, then other ASEAN languages
        const fallbackOrder = ['id', 'ms', 'vi', 'tl', 'en'];
        for (const fallbackLang of fallbackOrder) {
          const hasFallbackVoice = voices.some(v => v.lang.toLowerCase().startsWith(fallbackLang));
          if (hasFallbackVoice) {
            console.log(`🎙️ Thai voice not available, falling back to ${fallbackLang.toUpperCase()}`);
            return languageMap[fallbackLang] || 'en-US';
          }
        }
      }
      
      return targetLang;
    };
    
    const voiceLanguage = getVoiceLanguage(language);
    
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
    console.log('🔍 SEND-VOICE-MESSAGE: Called with content:', content);
    console.log('🔍 SEND-VOICE-MESSAGE: Transcription result:', transcriptionResult);
    console.log(`🔍 SEND-VOICE-MESSAGE: Content length: ${content.trim().length}, mutation pending: ${sendMessageMutation.isPending}`);
    
    if (!content.trim() || sendMessageMutation.isPending) {
      console.warn('❌ SEND-VOICE-MESSAGE: Aborting - empty content or mutation pending');
      return;
    }
    
    console.log('📤 SEND-VOICE-MESSAGE: Calling sendMessageMutation.mutate...');
    sendMessageMutation.mutate({ content: content.trim(), voiceMetadata: transcriptionResult });
    console.log('✅ SEND-VOICE-MESSAGE: Mutation called successfully');
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
      const language = session?.preferredLanguage || 'en';
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
        onInterimTranscription: handleInterimTranscription, // Add interim handler
        onTTSComplete: handleTTSComplete,
        onError: handleVoiceError
      });
    }
  }, [session?.preferredLanguage]);
  
  
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

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'ms': 'Malay',
      'id': 'Indonesian', 
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tl': 'Filipino',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao',
      'si': 'Sinhala'
    };
    return languages[code] || code.toUpperCase();
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
                  {session?.jobPosition || 'Interview Practice'} {session?.companyName && `at ${session.companyName}`}
                </span>
                <Badge variant="outline" className="bg-white flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Question {messages.filter(m => m.messageType === 'ai_question').length || 1} of {maxQuestions}
                </Badge>
                {session?.preferredLanguage && (
                  <Badge variant="outline" className="bg-white">
                    {getLanguageName(session.preferredLanguage)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right space-y-2">
              {/* Progress Indicator */}
              <div className="flex items-center justify-end space-x-2 mb-2">
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Progress: {Math.round(((messages.filter(m => m.messageType === 'ai_question').length || 1) / maxQuestions) * 100)}%
                </div>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.min(((messages.filter(m => m.messageType === 'ai_question').length || 1) / maxQuestions) * 100, 100)}%` }}
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
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 320px)' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Interview Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 pb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg mb-2">Ready to start your interview practice</p>
                      <p className="text-sm">Your AI interviewer will generate personalized questions</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        {/* Message Bubble */}
                        <div className={`flex ${message.messageType === 'user_response' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-4 ${
                            message.messageType === 'ai_question'
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-green-50 border border-green-200'
                          }`}>
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  message.messageType === 'ai_question' ? 'bg-blue-500' : 'bg-green-500'
                                }`}>
                                  {message.messageType === 'ai_question' ? (
                                    <Bot className="w-4 h-4 text-white" />
                                  ) : (
                                    <User className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <span className="font-medium text-sm">
                                  {message.messageType === 'ai_question' ? 'AI Interviewer' : 'You'}
                                </span>
                                {(message as any).inputMethod === 'voice' && (
                                  <Badge variant="outline" className="text-xs">
                                    <Mic className="w-3 h-3 mr-1" />
                                    Voice
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Just now'}
                                </span>
                                {message.messageType === 'ai_question' && voiceEnabled && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => speakAIResponse(message.content)}
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="text-gray-800 leading-relaxed">
                              {message.questionNumber && (
                                <div className="text-xs text-gray-500 mb-2">
                                  {message.messageType === 'ai_question' 
                                    ? `Question ${message.questionNumber}`
                                    : `Response to Question ${message.questionNumber - 1}`
                                  }
                                </div>
                              )}
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
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
              
              {/* Text-First Input Interface */}
              <div className="border-t p-4 space-y-4">
                {/* Primary Text Input */}
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response here..."
                    disabled={sendMessageMutation.isPending || isCompleted}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending || isCompleted}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>

                {voiceEnabled && (
                  <>
                    {/* Voice Dictation Helper */}
                    <div className="text-center">
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        size="lg"
                        onClick={handleToggleRecording}
                        disabled={sendMessageMutation.isPending || isCompleted || isSpeaking}
                        className="px-8 py-4 text-base font-medium min-w-[280px]"
                        data-testid="button-voice-dictate"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-5 h-5 mr-3 animate-pulse" />
                            Stop Recording
                          </>
                        ) : transcriptionActive ? (
                          <>
                            <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            Processing Speech...
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5 mr-3" />
                            Start Voice Dictation
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
                    
                    {/* Real-time transcription indicator */}
                    {(interimTranscript || isRecording) && (
                      <div className="text-center">
                        <p className="text-sm text-blue-600">
                          {isRecording ? '🎤 Listening... speak now' : '✍️ Processing transcription...'}
                        </p>
                        {interimTranscript && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            "{interimTranscript}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 text-center">
                      Click to start/stop voice dictation. Speech will appear in text field for review.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Mode</span>
                <Button
                  variant={voiceEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleVoice}
                  className="h-8 px-3"
                  data-testid="button-toggle-voice"
                >
                  {voiceEnabled ? "On" : "Off"}
                </Button>
              </div>

              {voiceEnabled && (
                <>
                  {/* Speech Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Speech Speed</span>
                      <span className="text-xs text-gray-500">{speechRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      data-testid="slider-speech-rate"
                    />
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Voice</span>
                    <select
                      value={selectedVoice}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="select-voice"
                    >
                      <option value="">Default Voice</option>
                      {typeof window !== 'undefined' && window.speechSynthesis?.getVoices()
                        .filter((voice) => {
                          const voiceLang = voice.lang.toLowerCase();
                          // Only show Southeast Asian and English voices
                          return voiceLang.startsWith('en') || 
                                 voiceLang.startsWith('th') || 
                                 voiceLang.startsWith('id') || 
                                 voiceLang.startsWith('ms') || 
                                 voiceLang.startsWith('vi') || 
                                 voiceLang.startsWith('fil') || 
                                 voiceLang.startsWith('tl');
                        })
                        .map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Test Voice Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestVoice}
                    disabled={isSpeaking}
                    className="w-full"
                    data-testid="button-test-voice"
                  >
                    {isSpeaking ? "Speaking..." : "Test Voice"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Scenario:</span>
                <p>{session?.scenarioId || 'Interview Practice'}</p>
              </div>
              {session?.interviewStage && (
                <div>
                  <span className="font-medium text-gray-600">Stage:</span>
                  <p>{session.interviewStage.replace('-', ' ')}</p>
                </div>
              )}
              {session?.jobPosition && (
                <div>
                  <span className="font-medium text-gray-600">Position:</span>
                  <p>{session.jobPosition}</p>
                </div>
              )}
              {session?.companyName && (
                <div>
                  <span className="font-medium text-gray-600">Company:</span>
                  <p>{session.companyName}</p>
                </div>
              )}
              {session?.preferredLanguage && (
                <div>
                  <span className="font-medium text-gray-600">Language:</span>
                  <p>{getLanguageName(session.preferredLanguage)}</p>
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