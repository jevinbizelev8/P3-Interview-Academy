/**
 * Enhanced Text-to-Speech Service
 * Optimized multi-language TTS with voice selection per language and ASEAN language support
 */

interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'low' | 'medium' | 'high' | 'premium';
  localName?: string;
  isDefault?: boolean;
  isRecommended?: boolean;
}

interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  autoSelectVoice?: boolean;
  fallbackLanguage?: string;
}

interface LanguageConfig {
  code: string;
  name: string;
  localName: string;
  flag: string;
  preferredVoices: string[];
  fallbackLanguages: string[];
  rtl: boolean;
}

class EnhancedTTSService {
  private speechSynthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voiceMap: Map<string, TTSVoice> = new Map();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;

  // ASEAN language configurations
  private readonly languageConfigs: LanguageConfig[] = [
    {
      code: 'en',
      name: 'English',
      localName: 'English',
      flag: '🇺🇸',
      preferredVoices: ['Microsoft Zira - English (United States)', 'Google US English', 'Samantha', 'Alex'],
      fallbackLanguages: ['en-US', 'en-GB'],
      rtl: false
    },
    {
      code: 'ms',
      name: 'Bahasa Malaysia',
      localName: 'Bahasa Malaysia',
      flag: '🇲🇾',
      preferredVoices: ['Microsoft Hazel - English (Great Britain)', 'Google Bahasa Malaysia'],
      fallbackLanguages: ['id', 'en'],
      rtl: false
    },
    {
      code: 'id',
      name: 'Bahasa Indonesia',
      localName: 'Bahasa Indonesia', 
      flag: '🇮🇩',
      preferredVoices: ['Google Bahasa Indonesia', 'Microsoft Andika - Indonesian (Indonesia)'],
      fallbackLanguages: ['ms', 'en'],
      rtl: false
    },
    {
      code: 'th',
      name: 'Thai',
      localName: 'ภาษาไทย',
      flag: '🇹🇭',
      preferredVoices: ['Google ภาษาไทย', 'Microsoft Achara - Thai (Thailand)', 'Siri Female (Thailand)'],
      fallbackLanguages: ['en'],
      rtl: false
    },
    {
      code: 'vi',
      name: 'Vietnamese',
      localName: 'Tiếng Việt',
      flag: '🇻🇳',
      preferredVoices: ['Google Tiếng Việt', 'Microsoft An - Vietnamese (Vietnam)'],
      fallbackLanguages: ['en'],
      rtl: false
    },
    {
      code: 'tl',
      name: 'Filipino',
      localName: 'Filipino',
      flag: '🇵🇭',
      preferredVoices: ['Google Filipino', 'Microsoft Rosa - Filipino (Philippines)'],
      fallbackLanguages: ['en'],
      rtl: false
    },
    {
      code: 'my',
      name: 'Burmese',
      localName: 'မြန်မာဘာသာ',
      flag: '🇲🇲',
      preferredVoices: ['Google မြန်မာ'],
      fallbackLanguages: ['en'],
      rtl: false
    },
    {
      code: 'km',
      name: 'Khmer',
      localName: 'ភាសាខ្មែរ',
      flag: '🇰🇭',
      preferredVoices: ['Google ខ្មែរ'],
      fallbackLanguages: ['en'],
      rtl: false
    },
    {
      code: 'lo',
      name: 'Lao',
      localName: 'ພາສາລາວ',
      flag: '🇱🇦',
      preferredVoices: ['Google ລາວ'],
      fallbackLanguages: ['th', 'en'],
      rtl: false
    },
    {
      code: 'bn',
      name: 'Bengali',
      localName: 'বাংলা',
      flag: '🇧🇩',
      preferredVoices: ['Google বাংলা (ভারত)', 'Microsoft Bashkar - Bengali (India)'],
      fallbackLanguages: ['en'],
      rtl: false
    }
  ];

  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onSpeakError?: (error: string) => void;
  private onSpeakProgress?: (charIndex: number, totalChars: number) => void;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize TTS service
   */
  private initialize(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Handle voice loading
      if (this.speechSynthesis.onvoiceschanged !== undefined) {
        this.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Load and categorize available voices
   */
  private loadVoices(): void {
    if (!this.speechSynthesis) return;

    this.availableVoices = this.speechSynthesis.getVoices();
    this.voiceMap.clear();

    console.log(`Loaded ${this.availableVoices.length} TTS voices`);

    // Categorize voices
    this.availableVoices.forEach(voice => {
      const ttsVoice: TTSVoice = {
        id: voice.name,
        name: voice.name,
        lang: voice.lang,
        gender: this.detectGender(voice.name),
        quality: this.assessVoiceQuality(voice),
        localName: voice.name,
        isDefault: voice.default
      };

      // Mark recommended voices
      const config = this.getLanguageConfig(voice.lang);
      if (config && config.preferredVoices.some(pv => voice.name.includes(pv.split(' - ')[0]))) {
        ttsVoice.isRecommended = true;
      }

      this.voiceMap.set(voice.name, ttsVoice);
    });
  }

  /**
   * Get language configuration
   */
  private getLanguageConfig(langCode: string): LanguageConfig | undefined {
    const code = langCode.split('-')[0].toLowerCase();
    return this.languageConfigs.find(config => config.code === code);
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return !!(this.speechSynthesis && this.availableVoices.length > 0);
  }

  /**
   * Get available voices for a specific language
   */
  getVoicesForLanguage(languageCode: string): TTSVoice[] {
    const code = languageCode.split('-')[0].toLowerCase();
    const voices = Array.from(this.voiceMap.values()).filter(voice => 
      voice.lang.toLowerCase().startsWith(code)
    );
    
    // Sort by quality and recommendation
    return voices.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      
      const qualityOrder = { premium: 4, high: 3, medium: 2, low: 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    });
  }

  /**
   * Get recommended voice for language
   */
  getRecommendedVoice(languageCode: string): TTSVoice | null {
    const voices = this.getVoicesForLanguage(languageCode);
    return voices.find(v => v.isRecommended) || voices[0] || null;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return this.languageConfigs.filter(config => {
      const voices = this.getVoicesForLanguage(config.code);
      return voices.length > 0;
    });
  }

  /**
   * Speak text with enhanced options
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.speechSynthesis || !text.trim()) {
      throw new Error('TTS not available or empty text');
    }

    // Stop any current speech
    this.stop();

    const {
      voice,
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      language,
      autoSelectVoice = true,
      fallbackLanguage = 'en'
    } = options;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const selectedVoice = this.selectVoice(voice, language, autoSelectVoice, fallbackLanguage);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      // Set speech parameters
      utterance.rate = Math.max(0.1, Math.min(10, rate));
      utterance.pitch = Math.max(0, Math.min(2, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      // Set event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.onSpeakStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.onSpeakEnd?.();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.onSpeakError?.(event.error);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          this.onSpeakProgress?.(event.charIndex, text.length);
        }
      };

      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);

      // Return promise that resolves when speech ends
      return new Promise((resolve, reject) => {
        const originalOnEnd = utterance.onend;
        const originalOnError = utterance.onerror;

        utterance.onend = (event) => {
          originalOnEnd?.(event);
          resolve();
        };

        utterance.onerror = (event) => {
          originalOnError?.(event);
          reject(new Error(event.error));
        };
      });

    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.speechSynthesis && this.isPaused) {
      this.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  /**
   * Get current speaking status
   */
  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      isAvailable: this.isSupported()
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
    onProgress?: (charIndex: number, totalChars: number) => void;
  }): void {
    this.onSpeakStart = handlers.onStart;
    this.onSpeakEnd = handlers.onEnd;
    this.onSpeakError = handlers.onError;
    this.onSpeakProgress = handlers.onProgress;
  }

  /**
   * Test voice with sample text
   */
  async testVoice(voiceId: string, language: string): Promise<void> {
    const sampleTexts: Record<string, string> = {
      'en': 'Hello! This is a test of the text-to-speech system.',
      'ms': 'Halo! Ini adalah ujian sistem teks-ke-suara.',
      'id': 'Halo! Ini adalah tes sistem text-to-speech.',
      'th': 'สวัสดี! นี่คือการทดสอบระบบเสียงพูด',
      'vi': 'Xin chào! Đây là bài kiểm tra hệ thống chuyển văn bản thành giọng nói.',
      'tl': 'Kumusta! Ito ay pagsubok ng text-to-speech system.',
      'my': 'မဂၤလာပါ! ၎င်းမှာ စာသား-မှ-အသံ စနစ်၏ စမ်းသပ်မှုတစ်ခုဖြစ်သည်။',
      'km': 'សួស្តី! នេះគឺជាការសាកល្បងនៃប្រព័ន្ធអត្ថបទទៅជាសំឡេង។',
      'lo': 'ສະບາຍດີ! ນີ້ແມ່ນການທົດສອບຂອງລະບົບເວົ້າຂໍ້ຄວາມ.',
      'bn': 'হ্যালো! এটি টেক্সট-টু-স্পিচ সিস্টেমের একটি পরীক্ষা।'
    };

    const langCode = language.split('-')[0];
    const sampleText = sampleTexts[langCode] || sampleTexts['en'];

    await this.speak(sampleText, { 
      voice: voiceId, 
      language: language,
      rate: 1.0 
    });
  }

  /**
   * Select appropriate voice based on criteria
   */
  private selectVoice(
    preferredVoice?: string,
    language?: string,
    autoSelect = true,
    fallbackLanguage = 'en'
  ): SpeechSynthesisVoice | null {
    if (preferredVoice) {
      const voice = this.availableVoices.find(v => v.name === preferredVoice);
      if (voice) return voice;
    }

    if (language && autoSelect) {
      // Try to find recommended voice for language
      const recommendedVoice = this.getRecommendedVoice(language);
      if (recommendedVoice) {
        const voice = this.availableVoices.find(v => v.name === recommendedVoice.id);
        if (voice) return voice;
      }

      // Try any voice for the language
      const langVoices = this.getVoicesForLanguage(language);
      if (langVoices.length > 0) {
        const voice = this.availableVoices.find(v => v.name === langVoices[0].id);
        if (voice) return voice;
      }

      // Try fallback language
      if (fallbackLanguage !== language) {
        return this.selectVoice(undefined, fallbackLanguage, true, 'en');
      }
    }

    // Return default voice
    return this.availableVoices.find(v => v.default) || this.availableVoices[0] || null;
  }

  /**
   * Detect voice gender from name
   */
  private detectGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();
    
    const femaleIndicators = ['female', 'woman', 'zira', 'hazel', 'samantha', 'susan', 'karen', 'sara', 'anna', 'maria'];
    const maleIndicators = ['male', 'man', 'david', 'mark', 'alex', 'james', 'george', 'daniel', 'michael'];
    
    if (femaleIndicators.some(indicator => name.includes(indicator))) {
      return 'female';
    }
    
    if (maleIndicators.some(indicator => name.includes(indicator))) {
      return 'male';
    }
    
    return 'neutral';
  }

  /**
   * Assess voice quality based on characteristics
   */
  private assessVoiceQuality(voice: SpeechSynthesisVoice): 'low' | 'medium' | 'high' | 'premium' {
    const name = voice.name.toLowerCase();
    
    // Premium voices (neural/high-quality)
    if (name.includes('neural') || name.includes('premium') || name.includes('enhanced')) {
      return 'premium';
    }
    
    // High-quality voices
    if (name.includes('google') || name.includes('microsoft') || name.includes('siri')) {
      return 'high';
    }
    
    // Medium quality
    if (name.includes('espeak') || name.includes('festival')) {
      return 'low';
    }
    
    return 'medium';
  }
}

// Export singleton instance
export const enhancedTTS = new EnhancedTTSService();

// Export types
export type { TTSVoice, TTSOptions, LanguageConfig };