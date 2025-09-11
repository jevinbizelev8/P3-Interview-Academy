// WebSocket Service for AI Prepare Module
// Real-time communication for voice input, question delivery, and evaluation feedback

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { PrepareAIService } from "./prepare-ai-service.js";
import { FreeVoiceService } from "./free-voice-service.js";
import { registerPrepareIO } from "./realtime-gateway.js";

interface SocketUserData {
  userId: string;
  sessionId?: string;
  currentQuestionId?: string;
}

interface AudioChunk {
  sessionId: string;
  questionId: string;
  audioData: ArrayBuffer;
  isLastChunk: boolean;
  chunkIndex: number;
}

interface VoiceTranscriptionResult {
  transcription: string;
  confidence: number;
  language: string;
  duration: number;
}

interface SessionMessage {
  type: 'question' | 'response' | 'evaluation' | 'progress' | 'error' | 'system';
  sessionId: string;
  questionId?: string;
  responseId?: string;
  data: any;
  timestamp: number;
}

export class PrepareWebSocketService {
  private io: SocketIOServer;
  private prepareService: PrepareAIService;
  private voiceService: FreeVoiceService;
  private activeUsers: Map<string, SocketUserData>;
  private audioBuffers: Map<string, Buffer[]>; // For collecting audio chunks

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://yourdomain.com"] 
          : ["http://localhost:3001", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.prepareService = new PrepareAIService();
    this.voiceService = new FreeVoiceService();
    this.activeUsers = new Map();
    this.audioBuffers = new Map();

    this.setupSocketHandlers();
    
    // Register this Socket.IO server with the RealtimeGateway
    registerPrepareIO(this.io);
    
    console.log("🔌 WebSocket Service initialized for AI Prepare Module");
  }

  /**
   * Setup all socket event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Authentication and session management
      socket.on('prepare:authenticate', this.handleAuthentication.bind(this, socket));
      socket.on('prepare:join-session', this.handleJoinSession.bind(this, socket));
      socket.on('prepare:leave-session', this.handleLeaveSession.bind(this, socket));

      // Session lifecycle
      socket.on('prepare:create-session', this.handleCreateSession.bind(this, socket));
      socket.on('prepare:get-next-question', this.handleGetNextQuestion.bind(this, socket));
      socket.on('prepare:submit-response', this.handleSubmitResponse.bind(this, socket));

      // Voice processing
      socket.on('prepare:voice-start', this.handleVoiceStart.bind(this, socket));
      socket.on('prepare:voice-chunk', this.handleVoiceChunk.bind(this, socket));
      socket.on('prepare:voice-end', this.handleVoiceEnd.bind(this, socket));
      socket.on('prepare:voice-cancel', this.handleVoiceCancel.bind(this, socket));

      // Audio playback
      socket.on('prepare:request-audio', this.handleRequestAudio.bind(this, socket));
      socket.on('prepare:audio-played', this.handleAudioPlayed.bind(this, socket));

      // Session control
      socket.on('prepare:pause-session', this.handlePauseSession.bind(this, socket));
      socket.on('prepare:resume-session', this.handleResumeSession.bind(this, socket));
      socket.on('prepare:end-session', this.handleEndSession.bind(this, socket));

      // Disconnection
      socket.on('disconnect', this.handleDisconnection.bind(this, socket));

      // Error handling
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
        this.sendError(socket, 'connection-error', 'Connection error occurred');
      });
    });
  }

  /**
   * Handle user authentication
   */
  private async handleAuthentication(socket: any, data: { userId: string, token?: string }): Promise<void> {
    try {
      // In a real implementation, verify the token
      // For now, we'll accept the userId
      this.activeUsers.set(socket.id, {
        userId: data.userId
      });

      socket.join(`user:${data.userId}`);
      
      this.sendMessage(socket, {
        type: 'system',
        sessionId: '',
        data: { 
          status: 'authenticated',
          userId: data.userId,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      console.log(`✅ User authenticated: ${data.userId} (${socket.id})`);

    } catch (error) {
      console.error('❌ Authentication error:', error);
      this.sendError(socket, 'auth-failed', 'Authentication failed');
    }
  }

  /**
   * Handle joining a session
   */
  private async handleJoinSession(socket: any, data: { sessionId: string }): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData) {
        this.sendError(socket, 'not-authenticated', 'User not authenticated');
        return;
      }

      // Verify session exists and belongs to user
      const session = await this.prepareService.getSession(data.sessionId);
      if (session.userId !== userData.userId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      // Update user data and join session room
      userData.sessionId = data.sessionId;
      socket.join(`session:${data.sessionId}`);

      // Send session state
      const progress = await this.prepareService.getSessionProgress(data.sessionId);
      
      this.sendMessage(socket, {
        type: 'system',
        sessionId: data.sessionId,
        data: {
          status: 'joined-session',
          session: session,
          progress: progress,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      console.log(`✅ User joined session: ${userData.userId} -> ${data.sessionId}`);

    } catch (error) {
      console.error('❌ Join session error:', error);
      this.sendError(socket, 'join-failed', 'Failed to join session');
    }
  }

  /**
   * Handle creating new session
   */
  private async handleCreateSession(socket: any, data: any): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData) {
        this.sendError(socket, 'not-authenticated', 'User not authenticated');
        return;
      }

      const session = await this.prepareService.createSession(userData.userId, data.config);
      userData.sessionId = session.id;
      
      socket.join(`session:${session.id}`);

      this.sendMessage(socket, {
        type: 'system',
        sessionId: session.id,
        data: {
          status: 'session-created',
          session: session,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      console.log(`✅ Session created: ${session.id} for user ${userData.userId}`);

    } catch (error) {
      console.error('❌ Create session error:', error);
      this.sendError(socket, 'create-failed', 'Failed to create session');
    }
  }

  /**
   * Handle getting next question
   */
  private async handleGetNextQuestion(socket: any, data: { sessionId: string }): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== data.sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      const question = await this.prepareService.generateNextQuestion({
        sessionId: data.sessionId,
        userId: userData.userId,
        adaptiveDifficulty: true
      });

      userData.currentQuestionId = question.id;

      // Send question to client
      this.sendMessage(socket, {
        type: 'question',
        sessionId: data.sessionId,
        questionId: question.id,
        data: {
          question: question,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      // Generate audio if voice is enabled
      const session = await this.prepareService.getSession(data.sessionId);
      if (session.voiceEnabled) {
        this.generateQuestionAudio(socket, question, session);
      }

      console.log(`✅ Question generated: ${question.id} for session ${data.sessionId}`);

    } catch (error) {
      console.error('❌ Generate question error:', error);
      this.sendError(socket, 'question-failed', 'Failed to generate question');
    }
  }

  /**
   * Handle text response submission
   */
  private async handleSubmitResponse(socket: any, data: {
    sessionId: string;
    questionId: string;
    responseText: string;
    inputMethod: 'text' | 'voice';
    metadata?: any;
  }): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== data.sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      const response = await this.prepareService.processResponse(
        data.sessionId,
        data.questionId,
        data.responseText,
        {
          responseLanguage: data.metadata?.language || 'en',
          inputMethod: data.inputMethod,
          audioDuration: data.metadata?.audioDuration,
          transcriptionConfidence: data.metadata?.confidence
        }
      );

      // Send evaluation results
      this.sendMessage(socket, {
        type: 'evaluation',
        sessionId: data.sessionId,
        questionId: data.questionId,
        responseId: response.id,
        data: {
          response: response,
          evaluation: {
            starScores: response.starScores,
            detailedFeedback: response.detailedFeedback,
            modelAnswer: response.modelAnswer,
            relevanceScore: response.relevanceScore,
            communicationScore: response.communicationScore,
            completenessScore: response.completenessScore
          },
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      // Send updated progress
      const progress = await this.prepareService.getSessionProgress(data.sessionId);
      this.sendMessage(socket, {
        type: 'progress',
        sessionId: data.sessionId,
        data: { progress, timestamp: Date.now() },
        timestamp: Date.now()
      });

      console.log(`✅ Response processed: ${response.id} for session ${data.sessionId}`);

    } catch (error) {
      console.error('❌ Submit response error:', error);
      this.sendError(socket, 'response-failed', 'Failed to process response');
    }
  }

  /**
   * Handle voice recording start
   */
  private handleVoiceStart(socket: any, data: { sessionId: string, questionId: string }): void {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== data.sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      // Initialize audio buffer for this recording
      const bufferKey = `${socket.id}:${data.questionId}`;
      this.audioBuffers.set(bufferKey, []);

      this.sendMessage(socket, {
        type: 'system',
        sessionId: data.sessionId,
        data: {
          status: 'voice-recording-started',
          questionId: data.questionId,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      console.log(`🎤 Voice recording started: ${data.questionId} for session ${data.sessionId}`);

    } catch (error) {
      console.error('❌ Voice start error:', error);
      this.sendError(socket, 'voice-failed', 'Failed to start voice recording');
    }
  }

  /**
   * Handle voice audio chunks
   */
  private handleVoiceChunk(socket: any, chunk: AudioChunk): void {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== chunk.sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      const bufferKey = `${socket.id}:${chunk.questionId}`;
      const audioBuffer = this.audioBuffers.get(bufferKey) || [];
      
      // Convert ArrayBuffer to Buffer and store
      audioBuffer[chunk.chunkIndex] = Buffer.from(chunk.audioData);
      this.audioBuffers.set(bufferKey, audioBuffer);

      // Send acknowledgment
      socket.emit('prepare:voice-chunk-received', {
        chunkIndex: chunk.chunkIndex,
        received: true
      });

    } catch (error) {
      console.error('❌ Voice chunk error:', error);
      this.sendError(socket, 'voice-failed', 'Failed to process audio chunk');
    }
  }

  /**
   * Handle voice recording end and transcription
   */
  private async handleVoiceEnd(socket: any, data: {
    sessionId: string;
    questionId: string;
    totalChunks: number;
  }): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== data.sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      const bufferKey = `${socket.id}:${data.questionId}`;
      const audioChunks = this.audioBuffers.get(bufferKey) || [];
      
      if (audioChunks.length === 0) {
        this.sendError(socket, 'voice-failed', 'No audio data received');
        return;
      }

      // Combine audio chunks
      const completeAudio = Buffer.concat(audioChunks);
      this.audioBuffers.delete(bufferKey);

      // Send processing status
      this.sendMessage(socket, {
        type: 'system',
        sessionId: data.sessionId,
        data: {
          status: 'voice-processing',
          questionId: data.questionId,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      // Transcribe audio
      const session = await this.prepareService.getSession(data.sessionId);
      const transcriptionResult = await this.voiceService.transcribeAudio(completeAudio, {
        language: session.preferredLanguage,
        audioFormat: 'webm'
      });

      // Send transcription result
      this.sendMessage(socket, {
        type: 'system',
        sessionId: data.sessionId,
        data: {
          status: 'voice-transcribed',
          questionId: data.questionId,
          transcription: transcriptionResult,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      // Auto-submit response
      await this.handleSubmitResponse(socket, {
        sessionId: data.sessionId,
        questionId: data.questionId,
        responseText: transcriptionResult.transcription,
        inputMethod: 'voice',
        metadata: {
          language: transcriptionResult.language,
          audioDuration: transcriptionResult.duration,
          confidence: transcriptionResult.confidence.toString()
        }
      });

      console.log(`🎤 Voice transcribed: ${data.questionId} -> "${transcriptionResult.transcription}"`);

    } catch (error) {
      console.error('❌ Voice end error:', error);
      this.sendError(socket, 'voice-failed', 'Failed to process voice recording');
    }
  }

  /**
   * Generate and send question audio
   */
  private async generateQuestionAudio(socket: any, question: any, session: any): Promise<void> {
    try {
      const audioResult = await this.voiceService.synthesizeSpeech(
        question.questionTextTranslated || question.questionText,
        {
          language: session.preferredLanguage,
          rate: parseFloat(session.speechRate || '1.0'),
          voice: 'default'
        }
      );

      this.sendMessage(socket, {
        type: 'system',
        sessionId: session.id,
        data: {
          status: 'question-audio-ready',
          questionId: question.id,
          audioData: audioResult.audioData.toString('base64'),
          audioFormat: audioResult.format,
          duration: audioResult.duration,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

    } catch (error) {
      console.warn('⚠️ Audio generation failed:', error instanceof Error ? error.message : 'Unknown error');
      // Audio generation failure shouldn't block the question
    }
  }

  /**
   * Handle various session control events
   */
  private async handlePauseSession(socket: any, data: { sessionId: string }): Promise<void> {
    await this.updateSessionStatus(socket, data.sessionId, 'paused');
  }

  private async handleResumeSession(socket: any, data: { sessionId: string }): Promise<void> {
    await this.updateSessionStatus(socket, data.sessionId, 'active');
  }

  private async handleEndSession(socket: any, data: { sessionId: string }): Promise<void> {
    await this.updateSessionStatus(socket, data.sessionId, 'completed');
  }

  private async updateSessionStatus(socket: any, sessionId: string, status: string): Promise<void> {
    try {
      const userData = this.activeUsers.get(socket.id);
      if (!userData || userData.sessionId !== sessionId) {
        this.sendError(socket, 'unauthorized', 'Session access denied');
        return;
      }

      await this.prepareService.updateSessionStatus(sessionId, status as any);
      
      this.sendMessage(socket, {
        type: 'system',
        sessionId: sessionId,
        data: {
          status: `session-${status}`,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

      console.log(`✅ Session ${status}: ${sessionId}`);

    } catch (error) {
      console.error(`❌ Update session status error:`, error);
      this.sendError(socket, 'status-failed', `Failed to ${status} session`);
    }
  }

  /**
   * Handle other events
   */
  private handleVoiceCancel(socket: any, data: { sessionId: string, questionId: string }): void {
    const bufferKey = `${socket.id}:${data.questionId}`;
    this.audioBuffers.delete(bufferKey);
    
    this.sendMessage(socket, {
      type: 'system',
      sessionId: data.sessionId,
      data: {
        status: 'voice-cancelled',
        questionId: data.questionId,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  private handleLeaveSession(socket: any, data: { sessionId: string }): void {
    socket.leave(`session:${data.sessionId}`);
    const userData = this.activeUsers.get(socket.id);
    if (userData) {
      userData.sessionId = undefined;
      userData.currentQuestionId = undefined;
    }
  }

  private handleRequestAudio(socket: any, data: { questionId: string }): void {
    // Client requesting audio playback - track for analytics
    console.log(`🔊 Audio playback requested: ${data.questionId}`);
  }

  private handleAudioPlayed(socket: any, data: { questionId: string, duration: number }): void {
    // Client finished playing audio - track for analytics
    console.log(`🔊 Audio playback completed: ${data.questionId} (${data.duration}ms)`);
  }

  private handleDisconnection(socket: any): void {
    const userData = this.activeUsers.get(socket.id);
    if (userData) {
      console.log(`🔌 User disconnected: ${userData.userId} (${socket.id})`);
      
      // Clean up audio buffers for this socket
      Array.from(this.audioBuffers.keys()).forEach(key => {
        if (key.startsWith(socket.id)) {
          this.audioBuffers.delete(key);
        }
      });
      
      this.activeUsers.delete(socket.id);
    } else {
      console.log(`🔌 Anonymous client disconnected: ${socket.id}`);
    }
  }

  /**
   * Utility methods
   */
  private sendMessage(socket: any, message: SessionMessage): void {
    socket.emit('prepare:message', message);
  }

  private sendError(socket: any, code: string, message: string): void {
    socket.emit('prepare:error', {
      code,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast message to all clients in a session
   */
  public broadcastToSession(sessionId: string, message: SessionMessage): void {
    this.io.to(`session:${sessionId}`).emit('prepare:message', message);
  }

  /**
   * Get active session stats
   */
  public getActiveSessionStats(): {
    totalConnections: number;
    activeSessions: number;
    activeUsers: string[];
  } {
    const activeSessions = new Set();
    const activeUserIds = new Set();
    
    this.activeUsers.forEach(userData => {
      activeUserIds.add(userData.userId);
      if (userData.sessionId) {
        activeSessions.add(userData.sessionId);
      }
    });

    return {
      totalConnections: this.activeUsers.size,
      activeSessions: activeSessions.size,
      activeUsers: Array.from(activeUserIds) as string[]
    };
  }
}