/**
 * Audio Processing Optimization Service
 * Handles audio enhancement, noise reduction, and format optimization for voice features
 */

interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

interface ProcessingOptions {
  noiseReduction?: boolean;
  autoGainControl?: boolean;
  echoCancellation?: boolean;
  normalize?: boolean;
  targetVolume?: number;
  highpassFilter?: number;
  lowpassFilter?: number;
}

interface AudioMetrics {
  duration: number;
  sampleRate: number;
  channels: number;
  peakAmplitude: number;
  rmsLevel: number;
  dynamicRange: number;
  signalToNoise: number;
}

class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private workletInitialized = false;

  // Default configurations
  private readonly defaultConfig: AudioConfig = {
    sampleRate: 16000,  // Whisper prefers 16kHz
    channels: 1,        // Mono for speech
    bitDepth: 16
  };

  private readonly defaultProcessingOptions: ProcessingOptions = {
    noiseReduction: true,
    autoGainControl: true,
    echoCancellation: true,
    normalize: true,
    targetVolume: 0.5,
    highpassFilter: 80,   // Remove low-frequency noise
    lowpassFilter: 8000   // Remove high-frequency noise above speech range
  };

  /**
   * Initialize audio processor
   */
  async initialize(): Promise<boolean> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Initialize audio worklet for advanced processing
      if (this.audioContext.audioWorklet && !this.workletInitialized) {
        try {
          await this.initializeWorklet();
        } catch (error) {
          console.warn('Audio worklet not available, using fallback processing');
        }
      }

      console.log('Audio processor initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      return false;
    }
  }

  /**
   * Process audio blob with optimization
   */
  async processAudioBlob(
    audioBlob: Blob, 
    options: ProcessingOptions = {}
  ): Promise<{ processedBlob: Blob; metrics: AudioMetrics }> {
    if (!this.audioContext) {
      await this.initialize();
    }

    const config = { ...this.defaultProcessingOptions, ...options };
    
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Extract audio metrics
      const metrics = this.calculateMetrics(audioBuffer);
      
      // Process audio
      const processedBuffer = await this.processAudioBuffer(audioBuffer, config);
      
      // Convert back to blob
      const processedBlob = await this.audioBufferToBlob(processedBuffer);
      
      return {
        processedBlob,
        metrics: this.calculateMetrics(processedBuffer)
      };
      
    } catch (error) {
      console.error('Audio processing failed:', error);
      // Return original blob with basic metrics
      const metrics = await this.calculateBasicMetrics(audioBlob);
      return { processedBlob: audioBlob, metrics };
    }
  }

  /**
   * Process MediaStream in real-time
   */
  async processMediaStream(
    inputStream: MediaStream,
    options: ProcessingOptions = {}
  ): Promise<MediaStream> {
    if (!this.audioContext) {
      await this.initialize();
    }

    const config = { ...this.defaultProcessingOptions, ...options };

    try {
      // Create audio nodes
      const source = this.audioContext!.createMediaStreamSource(inputStream);
      const destination = this.audioContext!.createMediaStreamDestination();
      
      // Build processing chain
      let currentNode: AudioNode = source;

      // High-pass filter (remove low-frequency noise)
      if (config.highpassFilter) {
        const highpass = this.audioContext!.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = config.highpassFilter;
        currentNode.connect(highpass);
        currentNode = highpass;
      }

      // Low-pass filter (remove high-frequency noise)
      if (config.lowpassFilter) {
        const lowpass = this.audioContext!.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = config.lowpassFilter;
        currentNode.connect(lowpass);
        currentNode = lowpass;
      }

      // Dynamics compressor (normalize volume)
      if (config.normalize) {
        const compressor = this.audioContext!.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        currentNode.connect(compressor);
        currentNode = compressor;
      }

      // Gain node for volume control
      if (config.targetVolume !== undefined) {
        const gainNode = this.audioContext!.createGain();
        gainNode.gain.value = config.targetVolume;
        currentNode.connect(gainNode);
        currentNode = gainNode;
      }

      // Connect to destination
      currentNode.connect(destination);

      return destination.stream;

    } catch (error) {
      console.error('Real-time audio processing failed:', error);
      return inputStream; // Return original stream as fallback
    }
  }

  /**
   * Convert audio to optimal format for speech recognition
   */
  async optimizeForSpeechRecognition(audioBlob: Blob): Promise<Blob> {
    const { processedBlob } = await this.processAudioBlob(audioBlob, {
      noiseReduction: true,
      autoGainControl: true,
      echoCancellation: true,
      normalize: true,
      highpassFilter: 100,
      lowpassFilter: 8000,
      targetVolume: 0.7
    });

    return processedBlob;
  }

  /**
   * Resample audio to target sample rate
   */
  async resampleAudio(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext || audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }

    const ratio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.round(audioBuffer.length * ratio);
    const newBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        const srcIndex = i / ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
        const fraction = srcIndex - srcIndexFloor;
        
        outputData[i] = inputData[srcIndexFloor] * (1 - fraction) + 
                       inputData[srcIndexCeil] * fraction;
      }
    }

    return newBuffer;
  }

  /**
   * Calculate comprehensive audio metrics
   */
  calculateMetrics(audioBuffer: AudioBuffer): AudioMetrics {
    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length;
    
    // Peak amplitude
    let peakAmplitude = 0;
    let sumSquares = 0;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.abs(channelData[i]);
      peakAmplitude = Math.max(peakAmplitude, sample);
      sumSquares += channelData[i] * channelData[i];
    }

    // RMS level
    const rmsLevel = Math.sqrt(sumSquares / length);
    
    // Dynamic range (simplified)
    const dynamicRange = 20 * Math.log10(peakAmplitude / (rmsLevel + 1e-10));
    
    // Signal-to-noise ratio (simplified estimation)
    const signalToNoise = this.estimateSignalToNoise(channelData);

    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      peakAmplitude,
      rmsLevel,
      dynamicRange,
      signalToNoise
    };
  }

  /**
   * Get recommended processing settings for language
   */
  getLanguageOptimizedSettings(language: string): ProcessingOptions {
    const baseSettings = { ...this.defaultProcessingOptions };

    switch (language.split('-')[0].toLowerCase()) {
      case 'th':
      case 'vi':
      case 'km':
        // Tonal languages - preserve more frequency range
        return {
          ...baseSettings,
          highpassFilter: 60,
          lowpassFilter: 10000,
          targetVolume: 0.6
        };
      
      case 'ms':
      case 'id':
        // Similar to English but with some adjustments
        return {
          ...baseSettings,
          highpassFilter: 70,
          lowpassFilter: 8500
        };
        
      case 'my':
      case 'bn':
        // Languages with complex phonetics
        return {
          ...baseSettings,
          noiseReduction: true,
          normalize: true,
          highpassFilter: 50,
          lowpassFilter: 9000
        };
        
      default:
        return baseSettings;
    }
  }

  /**
   * Check if audio quality is suitable for processing
   */
  isAudioQualityAcceptable(metrics: AudioMetrics): boolean {
    return (
      metrics.duration > 0.5 &&          // At least 0.5 seconds
      metrics.peakAmplitude > 0.01 &&    // Minimum signal level
      metrics.rmsLevel > 0.005 &&        // Minimum RMS level
      metrics.signalToNoise > 5          // Minimum SNR
    );
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.workletInitialized = false;
  }

  /**
   * Initialize audio worklet for advanced processing
   */
  private async initializeWorklet(): Promise<void> {
    if (!this.audioContext?.audioWorklet) return;

    // In a real implementation, you would load an audio worklet module
    // For now, we'll skip this as it requires separate worklet files
    console.log('Audio worklet initialization skipped (requires separate worklet file)');
    this.workletInitialized = false;
  }

  /**
   * Process audio buffer with various enhancements
   */
  private async processAudioBuffer(
    audioBuffer: AudioBuffer,
    options: ProcessingOptions
  ): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not available');

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      this.defaultConfig.channels,
      audioBuffer.length * (this.defaultConfig.sampleRate / audioBuffer.sampleRate),
      this.defaultConfig.sampleRate
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    let currentNode: AudioNode = source;

    // Apply filters based on options
    if (options.highpassFilter) {
      const highpass = offlineContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = options.highpassFilter;
      highpass.Q.value = 0.707; // Butterworth response
      currentNode.connect(highpass);
      currentNode = highpass;
    }

    if (options.lowpassFilter) {
      const lowpass = offlineContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = options.lowpassFilter;
      lowpass.Q.value = 0.707;
      currentNode.connect(lowpass);
      currentNode = lowpass;
    }

    if (options.normalize) {
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      currentNode.connect(compressor);
      currentNode = compressor;
    }

    // Connect to destination
    currentNode.connect(offlineContext.destination);

    // Start processing
    source.start();

    // Return processed buffer
    return offlineContext.startRendering();
  }

  /**
   * Convert AudioBuffer to Blob
   */
  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    let offset = 0;
    
    // RIFF chunk descriptor
    view.setUint32(offset, 0x46464952, true); offset += 4; // "RIFF"
    view.setUint32(offset, bufferSize - 8, true); offset += 4; // File size - 8
    view.setUint32(offset, 0x45564157, true); offset += 4; // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(offset, 0x20746d66, true); offset += 4; // "fmt "
    view.setUint32(offset, 16, true); offset += 4; // Sub-chunk size
    view.setUint16(offset, format, true); offset += 2; // Audio format
    view.setUint16(offset, numberOfChannels, true); offset += 2; // Number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // Sample rate
    view.setUint32(offset, byteRate, true); offset += 4; // Byte rate
    view.setUint16(offset, blockAlign, true); offset += 2; // Block align
    view.setUint16(offset, bitDepth, true); offset += 2; // Bits per sample
    
    // data sub-chunk
    view.setUint32(offset, 0x61746164, true); offset += 4; // "data"
    view.setUint32(offset, dataSize, true); offset += 4; // Data size
    
    // PCM data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Calculate basic metrics from blob (fallback)
   */
  private async calculateBasicMetrics(audioBlob: Blob): Promise<AudioMetrics> {
    return {
      duration: 0, // Cannot determine from blob alone
      sampleRate: 44100, // Assume default
      channels: 1,
      peakAmplitude: 0.5, // Estimate
      rmsLevel: 0.1, // Estimate
      dynamicRange: 20, // Estimate
      signalToNoise: 10 // Estimate
    };
  }

  /**
   * Estimate signal-to-noise ratio
   */
  private estimateSignalToNoise(channelData: Float32Array): number {
    // Simplified SNR estimation
    // In practice, this would be more sophisticated
    
    const length = channelData.length;
    let signalEnergy = 0;
    let noiseEnergy = 0;
    
    // Estimate signal energy from higher amplitude samples
    const sortedSamples = Array.from(channelData).map(Math.abs).sort((a, b) => b - a);
    const signalThreshold = sortedSamples[Math.floor(length * 0.1)]; // Top 10%
    
    for (let i = 0; i < length; i++) {
      const sample = Math.abs(channelData[i]);
      if (sample > signalThreshold) {
        signalEnergy += sample * sample;
      } else {
        noiseEnergy += sample * sample;
      }
    }
    
    const signalPower = signalEnergy / length;
    const noisePower = Math.max(noiseEnergy / length, 1e-10);
    
    return 10 * Math.log10(signalPower / noisePower);
  }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();

// Export types
export type { AudioConfig, ProcessingOptions, AudioMetrics };