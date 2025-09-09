import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

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
    modelAnswer?: string;
    categories?: {
      relevance: number;
      structure: number;
      evidence: number;
      alignment: number;
      outcome: number;
    };
  };
  isProcessing?: boolean;
}

interface SessionConfig {
  jobTitle: string;
  companyName: string;
  interviewStage: string;
  language: string;
  voiceEnabled: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  industry?: string;
}

interface SessionData {
  sessionId: string;
  jobTitle: string;
  companyName: string;
  interviewStage: string;
  language: string;
  voiceEnabled: boolean;
  currentQuestionId?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

interface UsePrepareAIReturn {
  // Session state
  session: SessionData | null;
  sessionStatus: 'idle' | 'creating' | 'active' | 'paused' | 'completed';
  messages: Message[];
  currentResponse: string;
  isLoading: boolean;
  error: string | null;

  // Voice state
  isRecording: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  speechRate: number;
  selectedVoice: string;

  // WebSocket state
  isConnected: boolean;
  connectionError: string | null;

  // Actions
  createSession: (config: SessionConfig) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: () => Promise<void>;
  
  // Response handling
  setCurrentResponse: (response: string) => void;
  submitTextResponse: () => Promise<void>;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => Promise<void>;
  
  // Voice controls
  toggleVoice: () => void;
  setSpeechRate: (rate: number) => void;
  setSelectedVoice: (voiceId: string) => void;
  speakText: (text: string) => void;
  stopSpeech: () => void;
  testVoice: () => void;

  // Utility
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

export const usePrepareAI = (): UsePrepareAIReturn => {
  // Core session state
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'creating' | 'active' | 'paused' | 'completed'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('');

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // WebSocket connection
  const {
    isConnected,
    error: connectionError,
    emit,
    on,
    off
  } = useWebSocket({
    query: session ? { sessionId: session.sessionId } : {},
    autoConnect: !!session
  });

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Question generated
    const handleQuestionGenerated = (data: { question: string; questionId: string }) => {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        type: 'question',
        content: data.question,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setSession(prev => prev ? { ...prev, currentQuestionId: data.questionId } : null);
      
      // Speak question if voice enabled
      if (voiceEnabled && session?.voiceEnabled) {
        speakText(data.question);
      }
    };

    // Response evaluated
    const handleResponseEvaluated = (data: { 
      evaluation: Message['evaluation'];
      nextQuestion?: string;
      nextQuestionId?: string;
    }) => {
      // Update last response with evaluation
      setMessages(prev => prev.map(msg => {
        if (msg.type === 'response' && !msg.evaluation) {
          return { ...msg, evaluation: data.evaluation, isProcessing: false };
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
        
        if (voiceEnabled && session?.voiceEnabled) {
          speakText(data.nextQuestion);
        }
      }

      setIsLoading(false);
    };

    // Session completed
    const handleSessionCompleted = () => {
      setSessionStatus('completed');
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
      speakText("Great job! Your interview preparation session is now complete. You can review your performance and feedback.");
    };

    // WebSocket error
    const handleWebSocketError = (error: any) => {
      console.error('WebSocket error:', error);
      setError(`WebSocket error: ${error.message || error}`);
    };

    // Attach event listeners
    on('question-generated', handleQuestionGenerated);
    on('response-evaluated', handleResponseEvaluated);
    on('session-completed', handleSessionCompleted);
    on('error', handleWebSocketError);

    return () => {
      off('question-generated', handleQuestionGenerated);
      off('response-evaluated', handleResponseEvaluated);
      off('session-completed', handleSessionCompleted);
      off('error', handleWebSocketError);
    };
  }, [isConnected, voiceEnabled, session, on, off]);

  // Create new session
  const createSession = useCallback(async (config: SessionConfig) => {
    setSessionStatus('creating');
    setError(null);
    
    try {
      const response = await fetch('/api/prepare-ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }
      
      const newSession = await response.json();
      setSession({ ...newSession, status: 'active' });
      setSessionStatus('active');
      setVoiceEnabled(config.voiceEnabled);
      
      // Generate first question
      await generateFirstQuestion(newSession.sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      setSessionStatus('idle');
      console.error('Error creating session:', err);
    }
  }, []);

  // Generate first question
  const generateFirstQuestion = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/prepare-ai/sessions/${sessionId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate first question');
      }
    } catch (err) {
      console.error('Error generating first question:', err);
      setError('Failed to generate first question');
    }
  }, []);

  // Session control
  const pauseSession = useCallback(async () => {
    if (!session) return;

    try {
      await fetch(`/api/prepare-ai/sessions/${session.sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' })
      });
      
      setSessionStatus('paused');
      setSession(prev => prev ? { ...prev, status: 'paused' } : null);
    } catch (err) {
      console.error('Error pausing session:', err);
      setError('Failed to pause session');
    }
  }, [session]);

  const resumeSession = useCallback(async () => {
    if (!session) return;

    try {
      await fetch(`/api/prepare-ai/sessions/${session.sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      
      setSessionStatus('active');
      setSession(prev => prev ? { ...prev, status: 'active' } : null);
    } catch (err) {
      console.error('Error resuming session:', err);
      setError('Failed to resume session');
    }
  }, [session]);

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      await fetch(`/api/prepare-ai/sessions/${session.sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      setSessionStatus('completed');
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    }
  }, [session]);

  // Text response submission
  const submitTextResponse = useCallback(async () => {
    if (!currentResponse.trim() || !session?.sessionId) return;

    const responseMessage: Message = {
      id: crypto.randomUUID(),
      type: 'response',
      content: currentResponse,
      timestamp: new Date(),
      isAudio: false,
      isProcessing: true
    };

    setMessages(prev => [...prev, responseMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/prepare-ai/sessions/${session.sessionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: currentResponse,
          responseMethod: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      setCurrentResponse('');
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to submit response');
      setIsLoading(false);
      
      // Remove processing state from message
      setMessages(prev => prev.map(msg => 
        msg.id === responseMessage.id ? { ...msg, isProcessing: false } : msg
      ));
    }
  }, [currentResponse, session]);

  // Voice recording
  const startVoiceRecording = useCallback(async () => {
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
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Process voice response
  const processVoiceResponse = useCallback(async (audioBlob: Blob) => {
    if (!session?.sessionId) return;

    setIsLoading(true);
    
    const responseMessage: Message = {
      id: crypto.randomUUID(),
      type: 'response',
      content: 'Processing voice response...',
      timestamp: new Date(),
      isAudio: true,
      isProcessing: true
    };
    
    setMessages(prev => [...prev, responseMessage]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', session.sessionId);

      const response = await fetch(`/api/prepare-ai/sessions/${session.sessionId}/respond`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process voice response');
      }
      
      const result = await response.json();
      
      // Update message with transcription
      setMessages(prev => prev.map(msg => 
        msg.id === responseMessage.id 
          ? { ...msg, content: result.transcription || 'Voice response processed' }
          : msg
      ));
      
      setCurrentResponse('');
    } catch (err) {
      console.error('Error processing voice response:', err);
      setError('Failed to process voice response');
      setIsLoading(false);
      
      // Remove processing message on error
      setMessages(prev => prev.filter(msg => msg.id !== responseMessage.id));
    }
  }, [session]);

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if (!speechSynthesis.current || !voiceEnabled) return;

    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.lang = session?.language === 'en' ? 'en-US' : session?.language || 'en-US';
    
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
  }, [voiceEnabled, speechRate, selectedVoice, session?.language]);

  const stopSpeech = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const testVoice = useCallback(() => {
    const testText = "This is a test of your voice settings. Your AI interviewer will speak questions using these settings.";
    speakText(testText);
  }, [speakText]);

  // Voice controls
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
    if (isSpeaking) {
      stopSpeech();
    }
  }, [isSpeaking, stopSpeech]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/prepare-ai/sessions/${session.sessionId}`);
      if (!response.ok) throw new Error('Failed to refresh session');
      
      const updatedSession = await response.json();
      setSession(updatedSession);
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Failed to refresh session data');
    }
  }, [session]);

  return {
    // Session state
    session,
    sessionStatus,
    messages,
    currentResponse,
    isLoading,
    error,

    // Voice state
    isRecording,
    isSpeaking,
    voiceEnabled,
    speechRate,
    selectedVoice,

    // WebSocket state
    isConnected,
    connectionError,

    // Actions
    createSession,
    pauseSession,
    resumeSession,
    endSession,
    
    // Response handling
    setCurrentResponse,
    submitTextResponse,
    startVoiceRecording,
    stopVoiceRecording,
    
    // Voice controls
    toggleVoice,
    setSpeechRate,
    setSelectedVoice,
    speakText,
    stopSpeech,
    testVoice,

    // Utility
    clearError,
    refreshSession
  };
};