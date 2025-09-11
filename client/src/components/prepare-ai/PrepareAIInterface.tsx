import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';

interface Message {
  id: string;
  type: 'question' | 'response';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  evaluation?: {
    starScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
}

interface SessionData {
  id: string;
  jobPosition: string;
  companyName: string;
  interviewStage: string;
  preferredLanguage: string;
  voiceEnabled: boolean;
  currentQuestionId?: string;
}

interface PrepareAIInterfaceProps {
  initialSession?: Partial<SessionData>;
  onSessionChange?: (session: SessionData) => void;
  sessionConfig?: any;
}

export default function PrepareAIInterface({ 
  initialSession, 
  onSessionChange,
  sessionConfig
}: PrepareAIInterfaceProps) {
  // Get current authenticated user
  const { user } = useAuth();
  
  // Core state
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'active' | 'paused' | 'completed'>('idle');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Helper function to get language display name
  const getLanguageName = (code: string) => {
    const languageNames: Record<string, string> = {
      'ms': 'Bahasa Malaysia',
      'id': 'Bahasa Indonesia', 
      'th': 'ภาษาไทย',
      'vi': 'Tiếng Việt',
      'tl': 'Filipino',
      'my': 'မြန်မာဘာသာ',
      'km': 'ភាសាខ្មែរ',
      'lo': 'ພາສາລາວ',
      'bn': 'বাংলা'
    };
    return languageNames[code] || code.toUpperCase();
  };

  // WebSocket and audio refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session) return;

    const socket = io('/');
    socketRef.current = socket;

    // Socket event listeners
    socket.on('connect', () => {
      console.log('WebSocket connected for AI prepare session');
      
      // Step 1: Authenticate with the WebSocket service
      if (user?.id) {
        socket.emit('prepare:authenticate', { 
          userId: user.id
        });
      } else {
        console.error('❌ No user ID available for WebSocket authentication');
      }
    });

    socket.on('prepare:message', (message: any) => {
      if (message.type === 'system' && message.data.status === 'authenticated') {
        console.log('✅ WebSocket authenticated, joining session...');
        // Step 2: Join the session room
        socket.emit('prepare:join-session', { sessionId: session.id });
      } else if (message.type === 'system' && message.data.status === 'joined-session') {
        console.log('✅ Joined session room, ready for questions');
      }
    });

    socket.on('question-generated', (data: { question: string; questionId: string }) => {
      console.log('✅ Received question via WebSocket:', data);
      
      const newMessage: Message = {
        id: crypto.randomUUID(),
        type: 'question',
        content: data.question,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setSession(prev => prev ? { ...prev, currentQuestionId: data.questionId } : null);
      
      // Speak question if voice enabled
      if (voiceEnabled && session.voiceEnabled) {
        speakText(data.question);
      }
    });

    // Handle voice transcription results
    socket.on('prepare:message', (message: any) => {
      if (message.type === 'system') {
        if (message.data.status === 'authenticated') {
          console.log('✅ WebSocket authenticated, joining session...');
          socket.emit('prepare:join-session', { sessionId: session.id });
        } else if (message.data.status === 'joined-session') {
          console.log('✅ Joined session room, ready for questions');
        } else if (message.data.status === 'voice-transcription-complete') {
          // Update the transcribing message with actual transcription
          const transcription = message.data.transcription;
          console.log('✅ Voice transcription complete:', transcription);
          
          setMessages(prev => prev.map(msg => 
            msg.content === 'Voice response (transcribing...)' 
              ? { ...msg, content: transcription || 'Voice response transcribed' }
              : msg
          ));
          
          // Now submit the transcribed text via REST API for evaluation
          if (transcription && session?.currentQuestionId) {
            submitVoiceResponseForEvaluation(transcription, session.currentQuestionId);
          }
        } else if (message.data.status === 'voice-processing') {
          console.log('🎤 Voice processing started...');
        }
      }
    });

    socket.on('response-evaluated', (data: { 
      evaluation: Message['evaluation'];
      nextQuestion?: string;
      nextQuestionId?: string;
    }) => {
      // Update last response with evaluation
      setMessages(prev => prev.map(msg => {
        if (msg.type === 'response' && !msg.evaluation) {
          return { ...msg, evaluation: data.evaluation };
        }
        return msg;
      }));

      // Add next question if available
      if (data.nextQuestion) {
        const nextMessage: Message = {
          id: crypto.randomUUID(),
          type: 'question',
          content: data.nextQuestion,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, nextMessage]);
        setSession(prev => prev ? { ...prev, currentQuestionId: data.nextQuestionId } : null);
        
        if (voiceEnabled && session.voiceEnabled) {
          speakText(data.nextQuestion);
        }
      }
    });

    socket.on('session-completed', () => {
      setSessionStatus('completed');
      speakText("Great job! Your interview preparation session is now complete. You can review your performance and feedback.");
    });

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [session, voiceEnabled]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Session creation
  const createSession = async (sessionData: Partial<SessionData>) => {
    setIsLoading(true);
    try {
      // Use sessionConfig if available, otherwise fall back to sessionData or defaults
      const config = sessionConfig || sessionData;
      
      const response = await fetch('/api/prepare-ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosition: config.jobPosition || config.jobTitle || 'Software Engineer',
          companyName: config.companyName || 'Tech Company',
          interviewStage: config.interviewStage || 'phone-screening',
          experienceLevel: config.experienceLevel || 'intermediate',
          preferredLanguage: config.preferredLanguage || config.language || 'en',
          voiceEnabled: config.voiceEnabled ?? true,
          speechRate: config.speechRate || '1.0',
          difficultyLevel: config.difficultyLevel || 'intermediate',
          focusAreas: config.focusAreas || ['behavioral', 'situational'],
          questionCategories: config.questionCategories || ['general']
        })
      });

      if (!response.ok) throw new Error('Failed to create session');
      
      const result = await response.json();
      const newSession = result.data || result; // Handle both wrapped and unwrapped responses
      setSession(newSession);
      setSessionStatus('active');
      onSessionChange?.(newSession);

      // Generate first question
      await generateFirstQuestion(newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate first question
  const generateFirstQuestion = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/prepare-ai/sessions/${sessionId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to generate question');
    } catch (error) {
      console.error('Error generating first question:', error);
    }
  };

  // Text-to-speech functionality
  const speakText = (text: string) => {
    if (!speechSynthesis.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.lang = session?.preferredLanguage === 'en' ? 'en-US' : session?.preferredLanguage || 'en-US';
    
    if (selectedVoice) {
      const voices = speechSynthesis.current.getVoices();
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtteranceRef.current = utterance;
    speechSynthesis.current.speak(utterance);
  };

  // Stop speech
  const stopSpeech = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceResponse(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process voice response using WebSocket workflow
  const processVoiceResponse = async (audioBlob: Blob) => {
    if (!session?.id || !session?.currentQuestionId || !socketRef.current) return;

    setIsLoading(true);
    
    try {
      console.log('🎤 Processing voice response via WebSocket...');
      
      // Add user's voice message immediately
      const voiceMessage: Message = {
        id: crypto.randomUUID(),
        type: 'response',
        content: 'Voice response (transcribing...)',
        timestamp: new Date(),
        isAudio: true
      };
      setMessages(prev => [...prev, voiceMessage]);
      
      // Use the WebSocket voice workflow as the backend expects
      const socket = socketRef.current;
      
      // Start voice recording session
      socket.emit('prepare:voice-start', {
        sessionId: session.id,
        questionId: session.currentQuestionId
      });
      
      // Convert blob to array buffer and send as chunks
      const arrayBuffer = await audioBlob.arrayBuffer();
      const chunkSize = 1024; // 1KB chunks
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
      
      // Send audio in chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
        const chunk = arrayBuffer.slice(start, end);
        
        socket.emit('prepare:voice-chunk', {
          sessionId: session.id,
          questionId: session.currentQuestionId,
          audioData: chunk,
          chunkIndex: i,
          isLastChunk: i === totalChunks - 1
        });
      }
      
      // Signal end of recording
      socket.emit('prepare:voice-end', {
        sessionId: session.id,
        questionId: session.currentQuestionId,
        totalChunks: totalChunks
      });
      
      console.log(`✅ Voice data sent via WebSocket: ${totalChunks} chunks`);
      
    } catch (error) {
      console.error('Error processing voice response:', error);
      
      // Update the message to show error
      setMessages(prev => prev.map(msg => 
        msg.content === 'Voice response (transcribing...)' 
          ? { ...msg, content: 'Voice response (transcription failed)' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Text response submission
  const submitTextResponse = async () => {
    if (!currentResponse.trim() || !session?.id || !session?.currentQuestionId) return;

    const responseMessage: Message = {
      id: crypto.randomUUID(),
      type: 'response',
      content: currentResponse,
      timestamp: new Date(),
      isAudio: false
    };

    setMessages(prev => [...prev, responseMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/prepare-ai/sessions/${session.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: session.currentQuestionId,
          responseText: currentResponse,
          responseLanguage: session.preferredLanguage || 'en',
          inputMethod: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Response submission failed:', errorData);
        throw new Error(`Failed to submit response: ${errorData.error}`);
      }
      
      const result = await response.json();
      console.log('✅ Response submitted successfully:', result);
      
      // Process the evaluation results from backend
      if (result.success && result.data) {
        const evaluationData = result.data;
        
        // Add evaluation feedback as system message
        const feedbackMessage: Message = {
          id: crypto.randomUUID(),
          type: 'response',
          content: `Feedback: ${evaluationData.detailedFeedback?.feedback || 'Good response!'}`,
          timestamp: new Date(),
          evaluation: {
            starScore: evaluationData.starScores?.overall || 0,
            feedback: evaluationData.detailedFeedback?.feedback || '',
            strengths: evaluationData.detailedFeedback?.strengths || [],
            improvements: evaluationData.detailedFeedback?.suggestions || []
          }
        };
        
        setMessages(prev => [...prev, feedbackMessage]);
        
        // Add model answer
        if (evaluationData.modelAnswer) {
          const modelAnswerMessage: Message = {
            id: crypto.randomUUID(), 
            type: 'question',
            content: `Model Answer: ${evaluationData.modelAnswer}`,
            timestamp: new Date()
          };
          
          setTimeout(() => {
            setMessages(prev => [...prev, modelAnswerMessage]);
          }, 1000);
        }
        
        // Generate next question after showing evaluation
        setTimeout(() => {
          generateNextQuestion();
        }, 2000);
      }
      
      setCurrentResponse('');
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit voice response for evaluation after transcription
  const submitVoiceResponseForEvaluation = async (transcription: string, questionId: string) => {
    if (!session?.id) return;

    try {
      const response = await fetch(`/api/prepare-ai/sessions/${session.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questionId,
          responseText: transcription,
          responseLanguage: session.preferredLanguage || 'en',
          inputMethod: 'voice'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Voice response evaluation failed:', errorData);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Voice response evaluated successfully:', result);
      
      // Process the evaluation results (same as text response)
      if (result.success && result.data) {
        const evaluationData = result.data;
        
        // Add evaluation feedback as system message
        const feedbackMessage: Message = {
          id: crypto.randomUUID(),
          type: 'response',
          content: `Feedback: ${evaluationData.detailedFeedback?.feedback || 'Good response!'}`,
          timestamp: new Date(),
          evaluation: {
            starScore: evaluationData.starScores?.overall || 0,
            feedback: evaluationData.detailedFeedback?.feedback || '',
            strengths: evaluationData.detailedFeedback?.strengths || [],
            improvements: evaluationData.detailedFeedback?.suggestions || []
          }
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, feedbackMessage]);
        }, 1000);
        
        // Add model answer
        if (evaluationData.modelAnswer) {
          const modelAnswerMessage: Message = {
            id: crypto.randomUUID(),
            type: 'question', 
            content: `Model Answer: ${evaluationData.modelAnswer}`,
            timestamp: new Date()
          };
          
          setTimeout(() => {
            setMessages(prev => [...prev, modelAnswerMessage]);
          }, 2000);
        }
        
        // Generate next question after showing evaluation
        setTimeout(() => {
          generateNextQuestion();
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error evaluating voice response:', error);
    }
  };

  // Generate next question
  const generateNextQuestion = async () => {
    if (!session?.id) return;
    
    try {
      const response = await fetch(`/api/prepare-ai/sessions/${session.id}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('Failed to generate next question');
        return;
      }
      
      console.log('✅ Next question generation requested');
    } catch (error) {
      console.error('Error generating next question:', error);
    }
  };

  // Start new session
  const handleStartSession = () => {
    const defaultSession = {
      jobTitle: 'Software Engineer',
      companyName: 'Tech Company', 
      interviewStage: 'phone-screening',
      language: 'en',
      voiceEnabled: true,
      ...initialSession
    };
    createSession(defaultSession);
  };

  // Auto-start session if sessionConfig is provided
  useEffect(() => {
    if (sessionConfig && !session) {
      createSession({});
    }
  }, [sessionConfig]);

  // Restart session
  const handleRestartSession = () => {
    setMessages([]);
    setCurrentResponse('');
    setSessionStatus('idle');
    setSession(null);
    stopSpeech();
  };

  if (!session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Start AI Interview Preparation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Begin your personalized AI-powered interview practice with voice interaction and real-time feedback.
            </p>
            <Button 
              onClick={handleStartSession}
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating Session...' : 'Start AI Interview Practice'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{session.jobPosition}</CardTitle>
                <p className="text-gray-600">
                  {session.companyName} • {session.interviewStage}
                  {session.preferredLanguage && session.preferredLanguage !== 'en' && (
                    <span className="ml-2">
                      • <span className="text-blue-600 font-medium">
                        {getLanguageName(session.preferredLanguage)}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={sessionStatus === 'active' ? 'default' : 'secondary'}>
                {sessionStatus}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRestartSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Voice Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={voiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                Voice {voiceEnabled ? 'On' : 'Off'}
              </Button>
              
              {isSpeaking && (
                <Button variant="outline" size="sm" onClick={stopSpeech}>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Speaking
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Messages: {messages.length} • Voice: {voiceEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Interview Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for AI to generate your first question...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'response' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.type === 'question'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'question' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {message.type === 'question' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {message.type === 'question' ? 'AI Interviewer' : 'You'}
                        {message.isAudio && ' (Voice)'}
                      </p>
                      <p className="text-gray-800">{message.content}</p>
                      
                      {/* STAR Evaluation */}
                      {message.evaluation && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">STAR Score</span>
                            <Badge variant={message.evaluation.starScore >= 4 ? 'default' : 
                                           message.evaluation.starScore >= 3 ? 'secondary' : 'destructive'}>
                              {message.evaluation.starScore}/5
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{message.evaluation.feedback}</p>
                          
                          {message.evaluation.strengths.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-green-700">Strengths:</p>
                              <ul className="text-sm text-green-600 ml-4">
                                {message.evaluation.strengths.map((strength, i) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {message.evaluation.improvements.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-amber-700">Improvements:</p>
                              <ul className="text-sm text-amber-600 ml-4">
                                {message.evaluation.improvements.map((improvement, i) => (
                                  <li key={i}>• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 text-gray-500">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>AI is processing...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Input */}
      {sessionStatus === 'active' && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-4">
              {/* Voice Input */}
              {voiceEnabled && (
                <div className="flex justify-center">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    disabled={isLoading}
                    className="px-8"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2 animate-pulse" />
                        Release to Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Hold to Speak
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Separator className="my-4" />

              {/* Text Input */}
              <div className="space-y-2">
                <Textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[100px] resize-none"
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {currentResponse.length} characters
                  </span>
                  <Button
                    onClick={submitTextResponse}
                    disabled={!currentResponse.trim() || isLoading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Response
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Complete */}
      {sessionStatus === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Session Complete!
            </h3>
            <p className="text-green-700 mb-4">
              Great job! Review your responses and feedback above, then start a new session to continue practicing.
            </p>
            <Button onClick={handleRestartSession} className="bg-green-600 hover:bg-green-700">
              Start New Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}