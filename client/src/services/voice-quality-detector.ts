/**
 * Voice Quality Detection Service
 * Monitors audio quality and triggers automatic fallback to Whisper WASM when needed
 */

interface AudioQualityMetrics {
  volume: number;          // 0-1 range
  signalToNoise: number;   // dB
  clarity: number;         // 0-1 range
  stability: number;       // 0-1 range
  timestamp: number;
}

interface QualityThresholds {
  minVolume: number;
  minSignalToNoise: number;
  minClarity: number;
  minStability: number;
  consecutiveFailures: number;
}

type QualityStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

class VoiceQualityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  
  private isMonitoring = false;
  private qualityHistory: AudioQualityMetrics[] = [];
  private consecutiveFailures = 0;
  private monitoringInterval: number | null = null;
  
  private readonly thresholds: QualityThresholds = {
    minVolume: 0.01,          // Minimum volume level
    minSignalToNoise: 10,     // Minimum SNR in dB
    minClarity: 0.3,          // Minimum clarity score
    minStability: 0.5,        // Minimum stability score
    consecutiveFailures: 3    // Max consecutive failures before fallback
  };

  private readonly bufferSize = 2048;
  private readonly historySize = 30; // Keep last 30 measurements
  
  private onQualityChange?: (status: QualityStatus, metrics: AudioQualityMetrics) => void;
  private onFallbackNeeded?: (reason: string) => void;

  /**
   * Check if Web Audio API is supported
   */
  isSupported(): boolean {
    return !!(
      window.AudioContext || 
      (window as any).webkitAudioContext ||
      (window as any).mozAudioContext
    );
  }

  /**
   * Initialize quality monitoring
   */
  async initialize(stream: MediaStream): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Web Audio API not supported - quality detection disabled');
      return false;
    }

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.bufferSize;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Connect microphone to analyser
      this.mediaStream = stream;
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      console.log('Voice quality detector initialized');
      return true;

    } catch (error) {
      console.error('Failed to initialize quality detector:', error);
      return false;
    }
  }

  /**
   * Start monitoring audio quality
   */
  startMonitoring(
    onQualityChange?: (status: QualityStatus, metrics: AudioQualityMetrics) => void,
    onFallbackNeeded?: (reason: string) => void
  ): void {
    if (!this.analyser || this.isMonitoring) return;

    this.onQualityChange = onQualityChange;
    this.onFallbackNeeded = onFallbackNeeded;
    this.isMonitoring = true;
    this.qualityHistory = [];
    this.consecutiveFailures = 0;

    // Start periodic quality checks
    this.monitoringInterval = window.setInterval(() => {
      this.checkAudioQuality();
    }, 500); // Check every 500ms

    console.log('Voice quality monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    this.onQualityChange = undefined;
    this.onFallbackNeeded = undefined;
    
    console.log('Voice quality monitoring stopped');
  }

  /**
   * Get current quality metrics
   */
  getCurrentQuality(): AudioQualityMetrics | null {
    if (!this.analyser) return null;
    
    const metrics = this.analyzeAudio();
    return metrics;
  }

  /**
   * Get quality status for given metrics
   */
  getQualityStatus(metrics: AudioQualityMetrics): QualityStatus {
    const { volume, signalToNoise, clarity, stability } = metrics;
    const { minVolume, minSignalToNoise, minClarity, minStability } = this.thresholds;

    // Check for failures
    if (volume < minVolume * 0.5 || signalToNoise < minSignalToNoise * 0.5) {
      return 'failed';
    }

    // Calculate overall score
    const volumeScore = Math.min(volume / (minVolume * 2), 1);
    const snrScore = Math.min(signalToNoise / (minSignalToNoise * 2), 1);
    const clarityScore = clarity;
    const stabilityScore = stability;
    
    const overallScore = (volumeScore + snrScore + clarityScore + stabilityScore) / 4;

    if (overallScore >= 0.8) return 'excellent';
    if (overallScore >= 0.6) return 'good';
    if (overallScore >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Get quality trend over time
   */
  getQualityTrend(): 'improving' | 'stable' | 'declining' {
    if (this.qualityHistory.length < 5) return 'stable';

    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.clarity, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.clarity, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopMonitoring();
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.mediaStream = null;
    this.qualityHistory = [];
  }

  /**
   * Check current audio quality
   */
  private checkAudioQuality(): void {
    if (!this.analyser || !this.isMonitoring) return;

    const metrics = this.analyzeAudio();
    const status = this.getQualityStatus(metrics);
    
    // Add to history
    this.qualityHistory.push(metrics);
    if (this.qualityHistory.length > this.historySize) {
      this.qualityHistory.shift();
    }

    // Check for consecutive failures
    if (status === 'failed' || status === 'poor') {
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= this.thresholds.consecutiveFailures) {
        const reason = this.getDegradationReason(metrics);
        console.warn(`Voice quality degraded: ${reason}`);
        this.onFallbackNeeded?.(reason);
        this.consecutiveFailures = 0; // Reset counter
      }
    } else {
      this.consecutiveFailures = 0;
    }

    // Notify quality change
    this.onQualityChange?.(status, metrics);
  }

  /**
   * Analyze current audio data
   */
  private analyzeAudio(): AudioQualityMetrics {
    if (!this.analyser) {
      return {
        volume: 0,
        signalToNoise: 0,
        clarity: 0,
        stability: 0,
        timestamp: Date.now()
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);
    
    this.analyser.getByteTimeDomainData(dataArray);
    this.analyser.getByteFrequencyData(frequencyData);

    // Calculate volume (RMS)
    const volume = this.calculateVolume(dataArray);
    
    // Calculate signal-to-noise ratio
    const signalToNoise = this.calculateSNR(frequencyData);
    
    // Calculate clarity (frequency distribution analysis)
    const clarity = this.calculateClarity(frequencyData);
    
    // Calculate stability (consistency over time)
    const stability = this.calculateStability(volume);

    return {
      volume,
      signalToNoise,
      clarity,
      stability,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate RMS volume
   */
  private calculateVolume(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128.0;
      sum += sample * sample;
    }
    
    return Math.sqrt(sum / dataArray.length);
  }

  /**
   * Calculate signal-to-noise ratio
   */
  private calculateSNR(frequencyData: Uint8Array): number {
    // Find signal peak
    const signal = Math.max(...Array.from(frequencyData));
    
    // Calculate noise floor (average of lowest 10% frequencies)
    const sorted = Array.from(frequencyData).sort((a, b) => a - b);
    const noiseFloorSize = Math.floor(sorted.length * 0.1);
    const noiseFloor = sorted.slice(0, noiseFloorSize).reduce((sum, val) => sum + val, 0) / noiseFloorSize;
    
    // Return SNR in dB
    if (noiseFloor === 0) return 60; // Very high SNR
    return 20 * Math.log10(signal / noiseFloor);
  }

  /**
   * Calculate clarity based on frequency distribution
   */
  private calculateClarity(frequencyData: Uint8Array): number {
    // Voice frequencies are typically 85Hz - 8kHz
    // Focus on 300Hz - 3.4kHz for speech clarity
    const voiceStart = Math.floor(frequencyData.length * 0.02); // ~300Hz
    const voiceEnd = Math.floor(frequencyData.length * 0.3);   // ~3.4kHz
    
    let voiceEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const energy = frequencyData[i];
      totalEnergy += energy;
      
      if (i >= voiceStart && i <= voiceEnd) {
        voiceEnergy += energy;
      }
    }
    
    return totalEnergy > 0 ? voiceEnergy / totalEnergy : 0;
  }

  /**
   * Calculate stability over time
   */
  private calculateStability(currentVolume: number): number {
    if (this.qualityHistory.length < 5) return 1; // Assume stable initially
    
    const recentVolumes = this.qualityHistory.slice(-5).map(m => m.volume);
    recentVolumes.push(currentVolume);
    
    // Calculate coefficient of variation
    const mean = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const variance = recentVolumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / recentVolumes.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Convert to stability score (0-1, where 1 is most stable)
    return Math.max(0, 1 - coefficientOfVariation);
  }

  /**
   * Determine reason for quality degradation
   */
  private getDegradationReason(metrics: AudioQualityMetrics): string {
    const { volume, signalToNoise, clarity, stability } = metrics;
    const { minVolume, minSignalToNoise, minClarity, minStability } = this.thresholds;

    if (volume < minVolume) return 'Low microphone volume';
    if (signalToNoise < minSignalToNoise) return 'High background noise';
    if (clarity < minClarity) return 'Poor speech clarity';
    if (stability < minStability) return 'Unstable audio signal';
    
    return 'General audio quality issues';
  }
}

// Export singleton instance
export const voiceQualityDetector = new VoiceQualityDetector();

// Export types
export type { AudioQualityMetrics, QualityStatus };