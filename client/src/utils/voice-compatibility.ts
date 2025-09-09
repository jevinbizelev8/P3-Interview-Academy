/**
 * Voice Compatibility Testing Utilities
 * Cross-browser compatibility detection and testing for voice features
 */

interface BrowserCapabilities {
  name: string;
  version: string;
  webSpeechAPI: {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    continuousRecognition: boolean;
    interimResults: boolean;
  };
  mediaRecorder: {
    supported: boolean;
    supportedMimeTypes: string[];
  };
  audioContext: {
    supported: boolean;
    sampleRates: number[];
  };
  webAssembly: {
    supported: boolean;
    threads: boolean;
    simd: boolean;
  };
  permissions: {
    microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  };
  languages: {
    speechRecognition: string[];
    speechSynthesis: string[];
  };
}

interface CompatibilityTestResult {
  overall: 'excellent' | 'good' | 'limited' | 'poor';
  capabilities: BrowserCapabilities;
  recommendations: string[];
  issues: string[];
  fallbackStrategies: string[];
}

class VoiceCompatibilityTester {
  private testResults: CompatibilityTestResult | null = null;

  /**
   * Run comprehensive compatibility test
   */
  async runCompatibilityTest(): Promise<CompatibilityTestResult> {
    console.log('Running voice compatibility test...');

    const capabilities = await this.detectBrowserCapabilities();
    const recommendations = this.generateRecommendations(capabilities);
    const issues = this.identifyIssues(capabilities);
    const fallbackStrategies = this.suggestFallbackStrategies(capabilities);
    const overall = this.calculateOverallRating(capabilities);

    this.testResults = {
      overall,
      capabilities,
      recommendations,
      issues,
      fallbackStrategies
    };

    console.log('Compatibility test completed:', this.testResults);
    return this.testResults;
  }

  /**
   * Get cached test results
   */
  getCachedResults(): CompatibilityTestResult | null {
    return this.testResults;
  }

  /**
   * Test specific voice feature
   */
  async testVoiceFeature(feature: 'speech-recognition' | 'speech-synthesis' | 'media-recorder'): Promise<boolean> {
    switch (feature) {
      case 'speech-recognition':
        return this.testSpeechRecognition();
      case 'speech-synthesis':
        return this.testSpeechSynthesis();
      case 'media-recorder':
        return this.testMediaRecorder();
      default:
        return false;
    }
  }

  /**
   * Get browser-specific recommendations
   */
  getBrowserSpecificAdvice(): string[] {
    const userAgent = navigator.userAgent.toLowerCase();
    const advice: string[] = [];

    if (userAgent.includes('chrome')) {
      advice.push('Chrome has excellent Web Speech API support');
      advice.push('Enable microphone permissions for best experience');
      if (userAgent.includes('mobile')) {
        advice.push('Mobile Chrome may have limited continuous recognition');
      }
    } else if (userAgent.includes('firefox')) {
      advice.push('Firefox has limited Web Speech API support');
      advice.push('Consider using Whisper WASM fallback for better accuracy');
      advice.push('Speech synthesis works well in Firefox');
    } else if (userAgent.includes('safari')) {
      advice.push('Safari has partial Web Speech API support');
      advice.push('Speech synthesis is supported but may have limited voices');
      advice.push('MediaRecorder API support varies by iOS version');
    } else if (userAgent.includes('edge')) {
      advice.push('Edge has good Web Speech API support');
      advice.push('Similar capabilities to Chrome');
    }

    return advice;
  }

  /**
   * Detect comprehensive browser capabilities
   */
  private async detectBrowserCapabilities(): Promise<BrowserCapabilities> {
    const browserInfo = this.getBrowserInfo();

    return {
      name: browserInfo.name,
      version: browserInfo.version,
      webSpeechAPI: await this.detectWebSpeechCapabilities(),
      mediaRecorder: await this.detectMediaRecorderCapabilities(),
      audioContext: await this.detectAudioContextCapabilities(),
      webAssembly: await this.detectWebAssemblyCapabilities(),
      permissions: await this.detectPermissions(),
      languages: await this.detectLanguageSupport()
    };
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    
    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match ? match[1] : 'Unknown' };
    }
    
    // Firefox
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match ? match[1] : 'Unknown' };
    }
    
    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match ? match[1] : 'Unknown' };
    }
    
    // Edge
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { name: 'Edge', version: match ? match[1] : 'Unknown' };
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  /**
   * Detect Web Speech API capabilities
   */
  private async detectWebSpeechCapabilities() {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    let continuousRecognition = false;
    let interimResults = false;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        continuousRecognition = 'continuous' in recognition;
        interimResults = 'interimResults' in recognition;
      } catch (error) {
        // Browser may not support all features
      }
    }

    return {
      speechRecognition: !!SpeechRecognition,
      speechSynthesis: !!speechSynthesis,
      continuousRecognition,
      interimResults
    };
  }

  /**
   * Detect MediaRecorder capabilities
   */
  private async detectMediaRecorderCapabilities() {
    const supported = typeof MediaRecorder !== 'undefined';
    const supportedMimeTypes: string[] = [];

    if (supported) {
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm;codecs=vorbis',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/mpeg',
        'audio/ogg;codecs=opus'
      ];

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedMimeTypes.push(mimeType);
        }
      }
    }

    return {
      supported,
      supportedMimeTypes
    };
  }

  /**
   * Detect AudioContext capabilities
   */
  private async detectAudioContextCapabilities() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const supported = !!AudioContextClass;
    const sampleRates: number[] = [];

    if (supported) {
      try {
        const context = new AudioContextClass();
        const baseSampleRate = context.sampleRate;
        sampleRates.push(baseSampleRate);
        
        // Test common sample rates
        const testRates = [8000, 16000, 22050, 44100, 48000, 96000];
        for (const rate of testRates) {
          if (rate !== baseSampleRate) {
            sampleRates.push(rate);
          }
        }
        
        context.close();
      } catch (error) {
        // Basic support but may have limitations
      }
    }

    return {
      supported,
      sampleRates
    };
  }

  /**
   * Detect WebAssembly capabilities
   */
  private async detectWebAssemblyCapabilities() {
    const supported = typeof WebAssembly !== 'undefined';
    let threads = false;
    let simd = false;

    if (supported) {
      // Test for WebAssembly threads
      try {
        threads = typeof SharedArrayBuffer !== 'undefined' && 
                 typeof Atomics !== 'undefined';
      } catch (error) {
        threads = false;
      }

      // Test for WebAssembly SIMD
      try {
        const wasmCode = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
          0x01, 0x04, 0x01, 0x60, 0x00, 0x00, 0x03, 0x02,
          0x01, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd,
          0x00, 0x0b
        ]);
        
        await WebAssembly.instantiate(wasmCode);
        simd = true;
      } catch (error) {
        simd = false;
      }
    }

    return {
      supported,
      threads,
      simd
    };
  }

  /**
   * Detect permissions status
   */
  private async detectPermissions() {
    let microphone: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';

    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        microphone = result.state;
      }
    } catch (error) {
      // Permissions API not supported or permission name not recognized
    }

    return { microphone };
  }

  /**
   * Detect language support
   */
  private async detectLanguageSupport() {
    const speechRecognition: string[] = [];
    const speechSynthesis: string[] = [];

    // Speech synthesis voices (wait for them to load)
    if (window.speechSynthesis) {
      await new Promise<void>((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve();
        } else {
          const intervalId = setInterval(() => {
            voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              clearInterval(intervalId);
              resolve();
            }
          }, 100);
          
          // Timeout after 2 seconds
          setTimeout(() => {
            clearInterval(intervalId);
            resolve();
          }, 2000);
        }
      });

      const voices = window.speechSynthesis.getVoices();
      const languages = new Set(voices.map(voice => voice.lang));
      speechSynthesis.push(...Array.from(languages).sort());
    }

    // Speech recognition languages (common ones)
    const commonLangs = [
      'en-US', 'en-GB', 'en-AU',
      'es-ES', 'es-MX', 'fr-FR',
      'de-DE', 'it-IT', 'pt-BR',
      'ru-RU', 'ja-JP', 'ko-KR',
      'zh-CN', 'zh-TW', 'th-TH',
      'vi-VN', 'ms-MY', 'id-ID'
    ];
    speechRecognition.push(...commonLangs);

    return {
      speechRecognition,
      speechSynthesis
    };
  }

  /**
   * Test speech recognition functionality
   */
  private async testSpeechRecognition(): Promise<boolean> {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) return false;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          recognition.stop();
          resolve(false);
        }, 1000);

        recognition.onstart = () => {
          clearTimeout(timeout);
          recognition.stop();
          resolve(true);
        };

        recognition.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        recognition.start();
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Test speech synthesis functionality
   */
  private async testSpeechSynthesis(): Promise<boolean> {
    if (!window.speechSynthesis) return false;

    try {
      const utterance = new SpeechSynthesisUtterance('test');
      utterance.volume = 0; // Silent test
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2000);

        utterance.onstart = () => {
          clearTimeout(timeout);
          window.speechSynthesis.cancel(); // Stop immediately
          resolve(true);
        };

        utterance.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Test media recorder functionality
   */
  private async testMediaRecorder(): Promise<boolean> {
    if (typeof MediaRecorder === 'undefined') return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate recommendations based on capabilities
   */
  private generateRecommendations(capabilities: BrowserCapabilities): string[] {
    const recommendations: string[] = [];

    if (!capabilities.webSpeechAPI.speechRecognition) {
      recommendations.push('Use Whisper WASM fallback for speech recognition');
    }

    if (!capabilities.webSpeechAPI.speechSynthesis) {
      recommendations.push('Speech synthesis not available - consider text-only interface');
    }

    if (!capabilities.mediaRecorder.supported) {
      recommendations.push('MediaRecorder not supported - limited recording capabilities');
    }

    if (!capabilities.audioContext.supported) {
      recommendations.push('Audio processing features will be limited');
    }

    if (capabilities.permissions.microphone === 'denied') {
      recommendations.push('Request microphone permission for voice features');
    }

    if (capabilities.name === 'Firefox') {
      recommendations.push('Consider Whisper WASM for better speech recognition accuracy');
    }

    if (capabilities.name === 'Safari') {
      recommendations.push('Test voice features thoroughly on Safari due to limited support');
    }

    return recommendations;
  }

  /**
   * Identify potential issues
   */
  private identifyIssues(capabilities: BrowserCapabilities): string[] {
    const issues: string[] = [];

    if (!capabilities.webSpeechAPI.speechRecognition && !capabilities.webAssembly.supported) {
      issues.push('No speech recognition available - voice input will not work');
    }

    if (!capabilities.webSpeechAPI.continuousRecognition) {
      issues.push('Continuous recognition not supported - may interrupt during long speech');
    }

    if (capabilities.mediaRecorder.supportedMimeTypes.length === 0) {
      issues.push('No supported audio formats for recording');
    }

    if (!capabilities.webAssembly.threads) {
      issues.push('WebAssembly threads not supported - Whisper processing may be slower');
    }

    if (capabilities.permissions.microphone === 'denied') {
      issues.push('Microphone access denied - voice features unavailable');
    }

    return issues;
  }

  /**
   * Suggest fallback strategies
   */
  private suggestFallbackStrategies(capabilities: BrowserCapabilities): string[] {
    const strategies: string[] = [];

    if (!capabilities.webSpeechAPI.speechRecognition) {
      if (capabilities.webAssembly.supported) {
        strategies.push('Use Whisper WASM for speech recognition');
      } else {
        strategies.push('Provide text input as alternative to voice');
      }
    }

    if (!capabilities.webSpeechAPI.speechSynthesis) {
      strategies.push('Display text instead of speaking it aloud');
    }

    if (!capabilities.mediaRecorder.supported && capabilities.webSpeechAPI.speechRecognition) {
      strategies.push('Use Web Speech API without fallback recording');
    }

    if (capabilities.permissions.microphone !== 'granted') {
      strategies.push('Provide clear instructions for enabling microphone access');
      strategies.push('Offer text-based interaction as default');
    }

    return strategies;
  }

  /**
   * Calculate overall compatibility rating
   */
  private calculateOverallRating(capabilities: BrowserCapabilities): 'excellent' | 'good' | 'limited' | 'poor' {
    let score = 0;

    // Core features
    if (capabilities.webSpeechAPI.speechRecognition) score += 25;
    if (capabilities.webSpeechAPI.speechSynthesis) score += 20;
    if (capabilities.mediaRecorder.supported) score += 15;
    if (capabilities.audioContext.supported) score += 10;

    // Advanced features
    if (capabilities.webAssembly.supported) score += 10;
    if (capabilities.webSpeechAPI.continuousRecognition) score += 5;
    if (capabilities.webSpeechAPI.interimResults) score += 5;

    // Permissions
    if (capabilities.permissions.microphone === 'granted') score += 10;
    else if (capabilities.permissions.microphone === 'prompt') score += 5;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'limited';
    return 'poor';
  }
}

// Export singleton instance
export const voiceCompatibilityTester = new VoiceCompatibilityTester();

// Export types
export type { BrowserCapabilities, CompatibilityTestResult };