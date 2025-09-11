/**
 * Integrated Voice Service
 * Unified wrapper that combines all voice services with intelligent fallback system
 */

import { whisperWasm, type WhisperModel, type TranscriptionOptions } from './whisper-wasm';
import { voiceQualityDetector, type AudioQualityMetrics, type QualityStatus } from './voice-quality-detector';
import { enhancedTTS, type TTSVoice, type TTSOptions, type LanguageConfig } from './enhanced-tts';
import { audioProcessor, type AudioMetrics, type ProcessingOptions } from './audio-processor';

// Speech Recognition API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface VoiceServiceConfig {
  language: string;
  enableWhisperFallback: boolean;
  enableQualityMonitoring: boolean;
  enableAudioProcessing: boolean;
  autoSelectTTSVoice: boolean;
  whisperModel?: string;
  processingOptions?: ProcessingOptions;
  ttsOptions?: Partial<TTSOptions>;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  method: 'web-speech' | 'whisper-wasm';
  processingTime: number;
  audioMetrics?: AudioMetrics;
  qualityMetrics?: AudioQualityMetrics;
}

interface TTSResult {
  success: boolean;
  duration?: number;
  voice?: TTSVoice;
  error?: string;
}

type VoiceServiceStatus = 'initializing' | 'ready' | 'recording' | 'processing' | 'speaking' | 'error';

class IntegratedVoiceService {
  private config: VoiceServiceConfig;
  private status: VoiceServiceStatus = 'initializing';
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recognitionFallbackCount = 0;
  private readonly maxFallbackAttempts = 2;

  // Web Speech API
  private recognition: SpeechRecognition | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;

  // Event handlers
  private onStatusChange?: (status: VoiceServiceStatus) => void;
  private onTranscriptionResult?: (result: TranscriptionResult) => void;
  private onTTSComplete?: (result: TTSResult) => void;
  private onError?: (error: string, service: string) => void;
  private onQualityUpdate?: (quality: QualityStatus, metrics: AudioQualityMetrics) => void;

  constructor(config: Partial<VoiceServiceConfig> = {}) {
    this.config = {
      language: 'en-US',
      enableWhisperFallback: true,
      enableQualityMonitoring: true,
      enableAudioProcessing: true,
      autoSelectTTSVoice: true,
      whisperModel: 'whisper-tiny',
      ...config
    };
    
    this.initialize();
  }

  /**
   * Initialize all voice services
   */
  private async initialize(): Promise<void> {
    try {
      this.setStatus('initializing');

      // Initialize Web Speech API
      this.initializeWebSpeechAPI();

      // Initialize TTS service
      if (enhancedTTS.isSupported()) {
        console.log('Enhanced TTS service ready');
      }

      // Initialize audio processor
      if (this.config.enableAudioProcessing) {
        await audioProcessor.initialize();
        console.log('Audio processor initialized');
      }

      // Initialize Whisper fallback if enabled
      if (this.config.enableWhisperFallback && whisperWasm.isSupported()) {
        console.log('Initializing Whisper WASM fallback...');
        const initialized = await whisperWasm.initialize(this.config.whisperModel);
        if (initialized) {
          console.log('Whisper WASM fallback ready');
        } else {
          console.warn('Whisper WASM fallback failed to initialize');
        }
      }

      this.setStatus('ready');
      console.log('Integrated voice service initialized');

    } catch (error) {
      console.error('Voice service initialization failed:', error);
      this.setStatus('error');
      this.onError?.('Initialization failed', 'voice-service');
    }
  }

  /**
   * Start voice recording with intelligent fallback
   */
  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return false;
    }

    try {
      this.setStatus('recording');
      
      // Get microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Start quality monitoring
      if (this.config.enableQualityMonitoring) {
        const qualityInitialized = await voiceQualityDetector.initialize(this.mediaStream);
        if (qualityInitialized) {
          voiceQualityDetector.startMonitoring(
            (quality, metrics) => this.handleQualityUpdate(quality, metrics),
            (reason) => this.handleQualityFallback(reason)
          );
        }
      }

      // Try Web Speech API first
      const webSpeechStarted = this.startWebSpeechRecognition();
      if (webSpeechStarted) {
        this.isRecording = true;
        return true;
      }

      // Fallback to manual recording for Whisper
      if (this.config.enableWhisperFallback) {
        const manualRecordingStarted = this.startManualRecording();
        if (manualRecordingStarted) {
          this.isRecording = true;
          return true;
        }
      }

      throw new Error('No recording method available');

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError?.('Failed to start recording', 'recording');
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop voice recording
   */
  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    this.setStatus('processing');
    this.isRecording = false;

    try {
      // Stop Web Speech recognition
      if (this.recognition) {
        this.recognition.stop();
      }

      // Stop manual recording
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      // Stop quality monitoring
      voiceQualityDetector.stopMonitoring();

      // Clean up stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
      this.onError?.('Error stopping recording', 'recording');
    }
  }

  /**
   * Speak text using enhanced TTS
   */
  async speak(text: string, options: Partial<TTSOptions> = {}): Promise<TTSResult> {
    if (!enhancedTTS.isSupported()) {
      return { success: false, error: 'TTS not supported' };
    }

    try {
      this.setStatus('speaking');
      
      const ttsOptions: TTSOptions = {
        language: this.config.language,
        autoSelectVoice: this.config.autoSelectTTSVoice,
        ...this.config.ttsOptions,
        ...options
      };

      const startTime = Date.now();
      
      // Get recommended voice for language
      let selectedVoice: TTSVoice | null = null;
      if (ttsOptions.autoSelectVoice) {
        selectedVoice = enhancedTTS.getRecommendedVoice(ttsOptions.language || this.config.language);
        if (selectedVoice) {
          ttsOptions.voice = selectedVoice.id;
        }
      }

      await enhancedTTS.speak(text, ttsOptions);
      
      const duration = Date.now() - startTime;
      
      this.setStatus('ready');
      
      const result: TTSResult = {
        success: true,
        duration,
        voice: selectedVoice || undefined
      };

      this.onTTSComplete?.(result);
      return result;

    } catch (error) {
      console.error('TTS error:', error);
      const result: TTSResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.setStatus('ready');
      this.onTTSComplete?.(result);
      this.onError?.('TTS failed', 'tts');
      
      return result;
    }
  }

  /**
   * Stop current TTS
   */
  stopSpeech(): void {
    enhancedTTS.stop();
    if (this.status === 'speaking') {
      this.setStatus('ready');
    }
  }

  /**
   * Test voice functionality
   */
  async testVoice(language?: string): Promise<boolean> {
    const testLanguage = language || this.config.language;
    
    try {
      const sampleTexts: Record<string, string> = {
        'en': 'This is a voice test. Can you hear me clearly?',
        'ms': 'Ini adalah ujian suara. Bolehkah anda mendengar saya dengan jelas?',
        'id': 'Ini adalah tes suara. Bisakah Anda mendengar saya dengan jelas?',
        'th': 'นี่คือการทดสอบเสียง คุณได้ยินฉันชัดเจนไหม?',
        'vi': 'Đây là bài kiểm tra giọng nói. Bạn có nghe tôi rõ ràng không?'
      };

      const langCode = testLanguage.split('-')[0];
      const testText = sampleTexts[langCode] || sampleTexts['en'];
      
      const result = await this.speak(testText, { language: testLanguage });
      return result.success;

    } catch (error) {
      console.error('Voice test failed:', error);
      return false;
    }
  }

  /**
   * Get current service status
   */
  getStatus(): {
    status: VoiceServiceStatus;
    isRecording: boolean;
    isSpeaking: boolean;
    capabilities: {
      webSpeech: boolean;
      whisperFallback: boolean;
      tts: boolean;
      qualityMonitoring: boolean;
      audioProcessing: boolean;
    };
  } {
    return {
      status: this.status,
      isRecording: this.isRecording,
      isSpeaking: enhancedTTS.getStatus().isSpeaking,
      capabilities: {
        webSpeech: this.isWebSpeechSupported(),
        whisperFallback: whisperWasm.isSupported(),
        tts: enhancedTTS.isSupported(),
        qualityMonitoring: voiceQualityDetector.isSupported(),
        audioProcessing: audioProcessor !== null
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VoiceServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if language changed
    if (newConfig.language && newConfig.language !== this.config.language) {
      this.initialize();
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onStatusChange?: (status: VoiceServiceStatus) => void;
    onTranscriptionResult?: (result: TranscriptionResult) => void;
    onTTSComplete?: (result: TTSResult) => void;
    onError?: (error: string, service: string) => void;
    onQualityUpdate?: (quality: QualityStatus, metrics: AudioQualityMetrics) => void;
  }): void {
    this.onStatusChange = handlers.onStatusChange;
    this.onTranscriptionResult = handlers.onTranscriptionResult;
    this.onTTSComplete = handlers.onTTSComplete;
    this.onError = handlers.onError;
    this.onQualityUpdate = handlers.onQualityUpdate;
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.stopRecording();
    this.stopSpeech();
    voiceQualityDetector.cleanup();
    whisperWasm.cleanup();
    audioProcessor.cleanup();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.setStatus('ready');
  }

  /**
   * Initialize Web Speech API
   */
  private initializeWebSpeechAPI(): void {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      if (this.recognition) {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.config.language;

        this.recognition.onresult = (event) => {
          this.handleWebSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
          this.handleWebSpeechError(event);
        };

        this.recognition.onend = () => {
          this.handleWebSpeechEnd();
        };
      }
    }

    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Start Web Speech recognition
   */
  private startWebSpeechRecognition(): boolean {
    if (!this.recognition) return false;

    try {
      this.recognition.lang = this.config.language;
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Web Speech recognition failed to start:', error);
      return false;
    }
  }

  /**
   * Start manual recording for Whisper processing
   */
  private startManualRecording(): boolean {
    if (!this.mediaStream) return false;

    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: this.getOptimalMimeType()
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await this.processAudioWithWhisper(audioBlob);
      };

      this.mediaRecorder.start();
      return true;

    } catch (error) {
      console.error('Manual recording failed to start:', error);
      return false;
    }
  }

  /**
   * Process audio with Whisper WASM
   */
  private async processAudioWithWhisper(audioBlob: Blob): Promise<void> {
    const startTime = Date.now();

    try {
      // Process audio for optimal recognition
      let processedBlob = audioBlob;
      let audioMetrics: AudioMetrics | undefined;

      if (this.config.enableAudioProcessing) {
        const result = await audioProcessor.optimizeForSpeechRecognition(audioBlob);
        processedBlob = result;
        // audioMetrics = result.metrics; // If processAudioBlob returned metrics
      }

      // Convert to format expected by Whisper
      const audioBuffer = await this.audioBufferFromBlob(processedBlob);
      const audioData = audioBuffer.getChannelData(0);

      // Transcribe with Whisper
      const transcriptionOptions: TranscriptionOptions = {
        language: this.config.language.split('-')[0],
        temperature: 0.0,
        maxTokens: 1000
      };

      const text = await whisperWasm.transcribe(audioData, transcriptionOptions);
      const processingTime = Date.now() - startTime;

      const result: TranscriptionResult = {
        text: text.trim(),
        confidence: 0.8, // Whisper doesn't provide confidence scores directly
        method: 'whisper-wasm',
        processingTime,
        audioMetrics
      };

      this.onTranscriptionResult?.(result);
      this.setStatus('ready');

    } catch (error) {
      console.error('Whisper transcription failed:', error);
      this.onError?.('Transcription failed', 'whisper');
      this.setStatus('ready');
    }
  }

  /**
   * Handle Web Speech recognition result
   */
  private handleWebSpeechResult(event: SpeechRecognitionEvent): void {
    const result = event.results[0];
    if (result.isFinal) {
      const transcriptionResult: TranscriptionResult = {
        text: result[0].transcript,
        confidence: result[0].confidence,
        method: 'web-speech',
        processingTime: 0 // Web Speech API doesn't provide processing time
      };

      this.onTranscriptionResult?.(transcriptionResult);
      this.setStatus('ready');
    }
  }

  /**
   * Handle Web Speech recognition error
   */
  private handleWebSpeechError(event: SpeechRecognitionErrorEvent): void {
    console.error('Web Speech recognition error:', event.error);
    
    // Try Whisper fallback if available and not too many attempts
    if (this.config.enableWhisperFallback && 
        this.recognitionFallbackCount < this.maxFallbackAttempts &&
        (event.error === 'no-speech' || event.error === 'audio-capture')) {
      
      console.log('Falling back to Whisper WASM...');
      this.recognitionFallbackCount++;
      this.startManualRecording();
    } else {
      this.onError?.(event.error, 'web-speech');
      this.setStatus('ready');
    }
  }

  /**
   * Handle Web Speech recognition end
   */
  private handleWebSpeechEnd(): void {
    if (this.isRecording) {
      // Recognition ended unexpectedly, try fallback
      if (this.config.enableWhisperFallback && 
          this.recognitionFallbackCount < this.maxFallbackAttempts) {
        this.startManualRecording();
      } else {
        this.setStatus('ready');
      }
    }
  }

  /**
   * Handle quality update from detector
   */
  private handleQualityUpdate(quality: QualityStatus, metrics: AudioQualityMetrics): void {
    this.onQualityUpdate?.(quality, metrics);
  }

  /**
   * Handle quality fallback trigger
   */
  private handleQualityFallback(reason: string): void {
    console.log(`Quality fallback triggered: ${reason}`);
    
    if (this.config.enableWhisperFallback && this.isRecording) {
      // Switch to Whisper for better quality
      if (this.recognition) {
        this.recognition.stop();
      }
      this.startManualRecording();
    }
  }

  /**
   * Set status and notify handlers
   */
  private setStatus(status: VoiceServiceStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange?.(status);
    }
  }

  /**
   * Check if Web Speech API is supported
   */
  private isWebSpeechSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Get optimal MIME type for recording
   */
  private getOptimalMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return ''; // Let browser decide
  }

  /**
   * Convert audio blob to AudioBuffer
   */
  private async audioBufferFromBlob(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.decodeAudioData(arrayBuffer);
  }
}

// Export singleton instance
export const integratedVoiceService = new IntegratedVoiceService();

// Export types
export type { 
  VoiceServiceConfig, 
  TranscriptionResult, 
  TTSResult, 
  VoiceServiceStatus 
};