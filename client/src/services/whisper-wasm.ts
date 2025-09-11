/**
 * OpenAI Whisper Service
 * Provides real speech-to-text capabilities using OpenAI Whisper API via backend
 */

import { apiRequest } from '@/lib/queryClient';

interface WhisperModel {
  name: string;
  size: string;
  url: string;
  languages: string[];
}

interface TranscriptionOptions {
  language?: string;
  temperature?: number;
  maxTokens?: number;
  wordTimestamps?: boolean;
}

interface TranscriptionResult {
  success: boolean;
  transcription: string;
  originalTranscription: string;
  language: string;
  model: string;
  confidence: number;
  duration: number;
  segments?: any[];
  timestamp: string;
  error?: string;
}

class WhisperService {
  private initialized = false;
  private currentModel: WhisperModel | null = null;

  // Available Whisper models (from OpenAI)
  private readonly models: WhisperModel[] = [
    {
      name: 'whisper-1',
      size: 'OpenAI hosted',
      url: 'openai-api',
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'th', 'vi', 'ms', 'id', 'fil', 'my', 'km', 'lo']
    }
  ];

  /**
   * Check if OpenAI Whisper is supported (always true if we have network)
   */
  isSupported(): boolean {
    return (
      typeof fetch !== 'undefined' &&
      typeof FormData !== 'undefined' &&
      typeof Blob !== 'undefined'
    );
  }

  /**
   * Initialize Whisper service (OpenAI API doesn't require model loading)
   */
  async initialize(modelName: string = 'whisper-1'): Promise<boolean> {
    if (this.initialized) return true;
    if (!this.isSupported()) {
      console.warn('OpenAI Whisper not supported in this environment');
      return false;
    }

    try {
      console.log(`Initializing OpenAI Whisper service with model: ${modelName}`);

      // Find requested model
      const model = this.models.find(m => m.name === modelName) || this.models[0];
      this.currentModel = model;
      this.initialized = true;
      
      console.log(`OpenAI Whisper service initialized successfully with model: ${model.name}`);
      return true;

    } catch (error) {
      console.error('Failed to initialize OpenAI Whisper service:', error);
      return false;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API via backend
   */
  async transcribe(audioData: Float32Array, options: TranscriptionOptions = {}): Promise<string> {
    console.log(`🔍 WHISPER TRANSCRIBE CALLED - audioData length: ${audioData.length}, options:`, options);
    
    if (!this.initialized || !this.currentModel) {
      console.error('❌ WHISPER NOT INITIALIZED - initialized:', this.initialized, 'currentModel:', this.currentModel);
      throw new Error('OpenAI Whisper service not initialized. Call initialize() first.');
    }

    try {
      console.log(`🎤 Starting OpenAI Whisper transcription (${audioData.length} samples)`);
      
      // Convert Float32Array to audio blob
      console.log('🔄 Converting audio data to blob...');
      const audioBlob = await this.audioDataToBlob(audioData);
      console.log(`✅ Audio blob created - size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('language', options.language || 'en');
      formData.append('model', this.currentModel.name);
      console.log(`📤 FormData prepared - language: ${options.language || 'en'}, model: ${this.currentModel.name}`);

      // Call backend STT endpoint
      console.log('🌐 Making API call to /api/voice-services/stt...');
      const response = await fetch('/api/voice-services/stt', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      console.log(`📥 API response received - status: ${response.status}, statusText: ${response.statusText}`);

      if (!response.ok) {
        console.error(`❌ API request failed - status: ${response.status}`);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error response data:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Transcription request failed'}`);
      }

      console.log('📋 Parsing response JSON...');
      const result: TranscriptionResult = await response.json();
      console.log('📋 Full transcription result:', result);
      
      if (!result.success) {
        console.error('❌ Transcription failed:', result.error);
        throw new Error(result.error || 'Transcription failed');
      }

      console.log(`✅ OpenAI Whisper transcription successful: "${result.transcription.substring(0, 100)}..."`);
      console.log(`🎯 RETURNING TRANSCRIPTION: "${result.transcription}"`);
      return result.transcription;

    } catch (error) {
      console.error('❌ OpenAI Whisper transcription error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(language?: string): WhisperModel[] {
    if (!language) return this.models;
    
    return this.models.filter(model => 
      model.languages.includes(language) || 
      model.languages.includes(language.split('-')[0])
    );
  }

  /**
   * Get current model info
   */
  getCurrentModel(): WhisperModel | null {
    return this.currentModel;
  }

  /**
   * Check if model is loaded (always true for API-based service)
   */
  isModelLoaded(): boolean {
    return this.initialized;
  }

  /**
   * Get loading status (always false for API-based service)
   */
  isModelLoading(): boolean {
    return false;
  }

  /**
   * Clean up resources (no cleanup needed for API-based service)
   */
  cleanup(): void {
    this.initialized = false;
    this.currentModel = null;
    console.log('OpenAI Whisper service cleaned up');
  }

  /**
   * Convert Float32Array audio data to WAV blob for API upload
   */
  private async audioDataToBlob(audioData: Float32Array): Promise<Blob> {
    try {
      const sampleRate = 16000; // OpenAI Whisper expects 16kHz
      const numChannels = 1; // Mono
      const bytesPerSample = 2; // 16-bit
      
      // Create WAV header
      const header = this.createWavHeader(audioData.length, sampleRate, numChannels, bytesPerSample);
      
      // Convert Float32Array to 16-bit PCM
      const pcmData = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
      }
      
      // Combine header and data
      const wavBuffer = new ArrayBuffer(header.length + pcmData.length * 2);
      const wavView = new Uint8Array(wavBuffer);
      
      wavView.set(header, 0);
      wavView.set(new Uint8Array(pcmData.buffer), header.length);
      
      return new Blob([wavBuffer], { type: 'audio/wav' });

    } catch (error) {
      console.error('Error converting audio data to blob:', error);
      throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create WAV file header
   */
  private createWavHeader(numSamples: number, sampleRate: number, numChannels: number, bytesPerSample: number): Uint8Array {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    const dataLength = numSamples * numChannels * bytesPerSample;
    
    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample
    
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true); // Subchunk2Size
    
    return new Uint8Array(header);
  }
}

// Export singleton instance
export const whisperWasm = new WhisperService();

// Export types for use in other files
export type { WhisperModel, TranscriptionOptions };