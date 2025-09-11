/**
 * Whisper.cpp WebAssembly Service
 * Provides offline speech-to-text capabilities as fallback for Web Speech API
 */

interface WhisperModel {
  name: string;
  size: string;
  url: string;
  languages: string[];
}

interface WhisperWasmInstance {
  init: (modelBuffer: ArrayBuffer) => Promise<void>;
  transcribe: (audioBuffer: Float32Array) => Promise<string>;
  free: () => void;
}

interface TranscriptionOptions {
  language?: string;
  temperature?: number;
  maxTokens?: number;
  wordTimestamps?: boolean;
}

class WhisperWasmService {
  private instance: WhisperWasmInstance | null = null;
  private modelLoaded = false;
  private isLoading = false;
  private currentModel: WhisperModel | null = null;

  // Available Whisper models (smaller models for web deployment)
  private readonly models: WhisperModel[] = [
    {
      name: 'whisper-tiny',
      size: '37MB',
      url: 'https://cdn.jsdelivr.net/gh/ggerganov/whisper.cpp@master/models/ggml-tiny.bin',
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'th', 'vi', 'ms', 'id']
    },
    {
      name: 'whisper-base',
      size: '141MB', 
      url: 'https://cdn.jsdelivr.net/gh/ggerganov/whisper.cpp@master/models/ggml-base.bin',
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'th', 'vi', 'ms', 'id']
    }
  ];

  private readonly wasmUrl = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@latest/dist/whisper.wasm';

  /**
   * Check if Whisper.cpp WASM is supported in current browser
   */
  isSupported(): boolean {
    return (
      typeof WebAssembly !== 'undefined' &&
      typeof SharedArrayBuffer !== 'undefined' &&
      typeof Worker !== 'undefined'
    );
  }

  /**
   * Initialize Whisper WASM with specified model
   */
  async initialize(modelName: string = 'whisper-tiny'): Promise<boolean> {
    if (this.modelLoaded) return true;
    if (this.isLoading) return false;
    if (!this.isSupported()) {
      console.warn('Whisper WASM not supported in this browser');
      return false;
    }

    this.isLoading = true;

    try {
      // Find requested model
      const model = this.models.find(m => m.name === modelName);
      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      console.log(`Loading Whisper model: ${model.name} (${model.size})`);

      // Load WASM module
      const wasmModule = await this.loadWasmModule();
      if (!wasmModule) {
        throw new Error('Failed to load WASM module');
      }

      // Load model data
      const modelBuffer = await this.downloadModel(model);
      
      // Initialize Whisper instance
      this.instance = await this.createWhisperInstance(wasmModule, modelBuffer);
      await this.instance.init(modelBuffer);

      this.currentModel = model;
      this.modelLoaded = true;
      
      console.log(`Whisper model ${model.name} loaded successfully`);
      return true;

    } catch (error) {
      console.error('Failed to initialize Whisper WASM:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Transcribe audio using Whisper WASM
   */
  async transcribe(audioData: Float32Array, options: TranscriptionOptions = {}): Promise<string> {
    if (!this.modelLoaded || !this.instance) {
      throw new Error('Whisper WASM not initialized. Call initialize() first.');
    }

    try {
      // Ensure audio is in the correct format (16kHz mono)
      const processedAudio = this.preprocessAudio(audioData);
      
      // Transcribe using Whisper
      const result = await this.instance.transcribe(processedAudio);
      
      return result.trim();

    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models for current language
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
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  /**
   * Get loading status
   */
  isModelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.instance) {
      this.instance.free();
      this.instance = null;
    }
    this.modelLoaded = false;
    this.currentModel = null;
  }

  /**
   * Convert audio buffer to format expected by Whisper
   */
  private preprocessAudio(audioData: Float32Array): Float32Array {
    // Whisper expects 16kHz sample rate
    const targetSampleRate = 16000;
    
    // For now, return as-is. In production, you'd implement resampling
    // This is a simplified implementation
    return audioData;
  }

  /**
   * Load WASM module
   */
  private async loadWasmModule(): Promise<any> {
    try {
      // In a real implementation, you'd load the actual Whisper.cpp WASM module
      // This is a placeholder for the WASM loading logic
      
      // For now, return a mock module
      console.log('Loading Whisper WASM module...');
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        // Mock WASM module
        ready: true
      };

    } catch (error) {
      console.error('Error loading WASM module:', error);
      return null;
    }
  }

  /**
   * Download model from CDN
   */
  private async downloadModel(model: WhisperModel): Promise<ArrayBuffer> {
    try {
      console.log(`Downloading model ${model.name} (${model.size})...`);
      
      // In production, you'd actually download the model
      // For now, return mock data
      const mockModelSize = model.name === 'whisper-tiny' ? 37 * 1024 * 1024 : 141 * 1024 * 1024;
      
      // Simulate download with progress
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock ArrayBuffer
      return new ArrayBuffer(mockModelSize);

    } catch (error) {
      console.error('Error downloading model:', error);
      throw error;
    }
  }

  /**
   * Create Whisper instance
   */
  private async createWhisperInstance(wasmModule: any, modelBuffer: ArrayBuffer): Promise<WhisperWasmInstance> {
    // Mock Whisper instance for development
    // In production, this would create actual Whisper.cpp WASM instance
    
    return {
      init: async (buffer: ArrayBuffer) => {
        console.log('Initializing Whisper instance...');
        await new Promise(resolve => setTimeout(resolve, 500));
      },
      
      transcribe: async (audioBuffer: Float32Array): Promise<string> => {
        // Mock transcription - returns placeholder text
        // In production, this would call the actual Whisper transcription
        console.log('Transcribing audio with Whisper WASM...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock transcription
        return "This is a mock transcription from Whisper WASM. In production, this would be the actual transcribed text.";
      },
      
      free: () => {
        console.log('Freeing Whisper resources...');
      }
    };
  }
}

// Export singleton instance
export const whisperWasm = new WhisperWasmService();

// Export types for use in other files
export type { WhisperModel, TranscriptionOptions };