/**
 * MVP Voice Service
 * Uses browser Web Speech API for TTS/STT with SeaLion AI for text processing
 */

interface VoiceConfig {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface STTConfig {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
  method: string;
}

class MVPVoiceService {
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;
  private isSpeaking = false;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Initialize Web Speech API
    this.speechSynthesis = window.speechSynthesis;
    
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
    }
  }

  /**
   * Text-to-Speech using browser Web Speech API
   */
  async speakText(text: string, config: VoiceConfig = { language: 'en' }): Promise<VoiceResult> {
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        resolve({
          success: false,
          error: 'Speech synthesis not supported',
          method: 'browser-speech-api'
        });
        return;
      }

      try {
        // Stop any current speech
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice
        if (config.voice) {
          const voices = this.speechSynthesis.getVoices();
          const selectedVoice = voices.find(voice => 
            voice.name === config.voice || 
            voice.lang.startsWith(config.language)
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        // Configure speech parameters
        utterance.lang = config.language;
        utterance.rate = config.rate || 1.0;
        utterance.pitch = config.pitch || 1.0;
        utterance.volume = config.volume || 1.0;

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve({
            success: true,
            text: text,
            method: 'browser-speech-api'
          });
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          resolve({
            success: false,
            error: `Speech synthesis error: ${event.error}`,
            method: 'browser-speech-api'
          });
        };

        this.currentUtterance = utterance;
        this.speechSynthesis.speak(utterance);

      } catch (error) {
        resolve({
          success: false,
          error: `Speech synthesis failed: ${error}`,
          method: 'browser-speech-api'
        });
      }
    });
  }

  /**
   * Speech-to-Text using browser Web Speech API
   */
  async listenForSpeech(config: STTConfig = { language: 'en' }): Promise<VoiceResult> {
    return new Promise((resolve) => {
      if (!this.speechRecognition) {
        resolve({
          success: false,
          error: 'Speech recognition not supported',
          method: 'browser-speech-api'
        });
        return;
      }

      try {
        // Stop any current recognition
        this.speechRecognition.stop();

        // Configure recognition
        this.speechRecognition.lang = config.language;
        this.speechRecognition.continuous = config.continuous || false;
        this.speechRecognition.interimResults = config.interimResults || true;
        this.speechRecognition.maxAlternatives = config.maxAlternatives || 1;

        // Event handlers
        this.speechRecognition.onstart = () => {
          this.isListening = true;
        };

        this.speechRecognition.onresult = (event: any) => {
          const result = event.results[event.resultIndex];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            this.isListening = false;
            resolve({
              success: true,
              text: transcript,
              confidence: confidence,
              method: 'browser-speech-api'
            });
          }
        };

        this.speechRecognition.onend = () => {
          this.isListening = false;
        };

        this.speechRecognition.onerror = (event: any) => {
          this.isListening = false;
          resolve({
            success: false,
            error: `Speech recognition error: ${event.error}`,
            method: 'browser-speech-api'
          });
        };

        this.speechRecognition.start();

      } catch (error) {
        resolve({
          success: false,
          error: `Speech recognition failed: ${error}`,
          method: 'browser-speech-api'
        });
      }
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Stop current listening
   */
  stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language: string = 'en'): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) return [];
    
    const voices = this.speechSynthesis.getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith(language) || 
      voice.lang.startsWith(language.split('-')[0])
    );
  }

  /**
   * Check if voice services are supported
   */
  isSupported(): boolean {
    return !!(this.speechSynthesis && this.speechRecognition);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'ms-MY', 'id-ID', 'th-TH', 'vi-VN', 'fil-PH',
      'zh-CN', 'zh-TW', 'zh-HK', 'ja-JP', 'ko-KR'
    ];
  }

  /**
   * Process text with server-side AI (translation, optimization)
   */
  async processTextWithAI(text: string, language: string, type: 'tts' | 'stt' | 'translate' = 'tts'): Promise<string> {
    try {
      const endpoint = type === 'translate' ? '/api/voice/translate' : '/api/voice/tts';
      const body = type === 'translate' 
        ? { text, targetLanguage: language }
        : { text, language };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.translatedText || result.text || text;

    } catch (error) {
      console.error('AI processing failed:', error);
      return text; // Return original text if AI processing fails
    }
  }

  /**
   * Get voice quality recommendations
   */
  async getQualityRecommendations(audioMetrics: any, language: string): Promise<string[]> {
    try {
      const response = await fetch('/api/voice/quality-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioMetrics, language }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get quality recommendations');
      }

      const result = await response.json();
      return result.recommendations || [];

    } catch (error) {
      console.error('Quality recommendations failed:', error);
      return ['Speak clearly and at a moderate pace'];
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isListening: this.isListening,
      isSupported: this.isSupported(),
      availableVoices: this.speechSynthesis?.getVoices().length || 0
    };
  }
}

// Export singleton instance
export const mvpVoiceService = new MVPVoiceService();
export default mvpVoiceService;

