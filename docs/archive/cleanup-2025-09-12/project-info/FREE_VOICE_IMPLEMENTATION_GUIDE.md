# Free Voice Service Implementation Guide

## Overview

This guide documents the implementation patterns for cost-effective voice services in the AI-Powered Prepare Module, utilizing free and low-cost alternatives to premium cloud speech services.

## Voice Service Architecture

### Service Hierarchy

```
┌─────────────────────────────────────┐
│           Voice Service Router      │
├─────────────────────────────────────┤
│  Capability Detection & Selection   │
└─────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌─────────┐    ┌─────────┐    ┌─────────┐
│Web APIs │    │Whisper  │    │Fallback │
│(Primary)│    │(Offline)│    │(Manual) │
└─────────┘    └─────────┘    └─────────┘
```

### Implementation Strategy

**Tier 1: Web Speech APIs (Zero Cost)**
- Primary choice for MVP and production
- Excellent browser support and performance
- No external dependencies or API keys required

**Tier 2: Whisper.cpp WebAssembly (Enhanced Free)**
- Offline capability for premium user experience
- Superior accuracy for challenging audio conditions
- One-time download cost, no ongoing fees

**Tier 3: Manual Fallback (Always Available)**
- Text input when voice services unavailable
- Accessibility compliance for all users
- Zero technical dependencies

## Technical Implementation

### 1. Web Speech API Integration

#### Speech-to-Text Implementation

```typescript
// services/free-voice-service.ts
export class FreeVoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.setupRecognitionConfig();
    this.bindRecognitionEvents();
  }

  private setupRecognitionConfig() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.grammars = this.createGrammarList();
  }

  private createGrammarList(): SpeechGrammarList | undefined {
    if (!window.SpeechGrammarList) return undefined;

    const grammarList = new SpeechGrammarList();
    // Add common interview terms for better recognition
    const grammar = '#JSGF V1.0; grammar interview; public <interview> = experience | skills | challenge | achievement | team | project | result | impact;';
    grammarList.addFromString(grammar, 1);
    return grammarList;
  }

  async startListening(language: string = 'en-US'): Promise<void> {
    if (!this.recognition || this.isListening) return;

    this.recognition.lang = this.mapLanguageCode(language);
    
    return new Promise((resolve, reject) => {
      this.recognition!.start();
      this.isListening = true;
      
      this.recognition!.onstart = () => resolve();
      this.recognition!.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private bindRecognitionEvents() {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult.isFinal) {
        this.handleFinalTranscription(latestResult[0].transcript, latestResult[0].confidence);
      } else {
        this.handleInterimTranscription(latestResult[0].transcript);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.handleRecognitionEnd();
    };

    this.recognition.onspeechend = () => {
      this.handleSpeechEnd();
    };
  }

  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'ms': 'ms-MY',
      'id': 'id-ID', 
      'th': 'th-TH',
      'vi': 'vi-VN',
      'fil': 'fil-PH',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'zh-sg': 'zh-CN'
    };
    
    return languageMap[language] || 'en-US';
  }
}
```

#### Text-to-Speech Implementation

```typescript
export class TTSService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for voices to load (they load asynchronously)
    if (this.synthesis.getVoices().length === 0) {
      await this.waitForVoices();
    }
    
    this.voices = this.synthesis.getVoices();
    this.isInitialized = true;
  }

  private waitForVoices(): Promise<void> {
    return new Promise(resolve => {
      const checkVoices = () => {
        if (this.synthesis.getVoices().length > 0) {
          resolve();
        } else {
          setTimeout(checkVoices, 100);
        }
      };
      
      this.synthesis.onvoiceschanged = () => resolve();
      checkVoices();
    });
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    await this.initializeVoices();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.voice = this.selectVoice(options.language || 'en', options.gender);
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    // Add SSML-like pauses for natural speech
    utterance.text = this.addNaturalPauses(text);

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));
      
      this.synthesis.speak(utterance);
    });
  }

  private selectVoice(language: string, preferredGender?: 'male' | 'female'): SpeechSynthesisVoice | null {
    const languageCode = this.mapLanguageCode(language);
    
    // Find voices that match the language
    const matchingVoices = this.voices.filter(voice => 
      voice.lang.startsWith(languageCode.split('-')[0])
    );
    
    if (matchingVoices.length === 0) {
      return this.voices.find(voice => voice.lang.startsWith('en')) || null;
    }

    // Prefer gender if specified
    if (preferredGender) {
      const genderMatch = matchingVoices.find(voice => 
        voice.name.toLowerCase().includes(preferredGender === 'female' ? 'female' : 'male')
      );
      if (genderMatch) return genderMatch;
    }

    // Return best quality voice (usually the first one)
    return matchingVoices[0];
  }

  private addNaturalPauses(text: string): string {
    return text
      .replace(/\./g, '. ') // Pause after periods
      .replace(/,/g, ', ')  // Pause after commas
      .replace(/\?/g, '? ') // Pause after questions
      .replace(/!/g, '! ') // Pause after exclamations
      .replace(/:/g, ': '); // Pause after colons
  }
}

interface TTSOptions {
  language?: string;
  gender?: 'male' | 'female';
  rate?: number;
  pitch?: number;
  volume?: number;
}
```

### 2. Whisper.cpp WebAssembly Integration

#### WebAssembly Module Setup

```typescript
// services/whisper-service.ts
export class WhisperService {
  private whisperModule: any = null;
  private isInitialized = false;
  private modelCache = new Map<string, ArrayBuffer>();

  async initialize(modelSize: 'tiny' | 'base' | 'small' = 'base'): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load Whisper.cpp WebAssembly module
      this.whisperModule = await this.loadWhisperWasm();
      
      // Download and cache model
      await this.loadModel(modelSize);
      
      this.isInitialized = true;
      console.log(`Whisper.cpp initialized with ${modelSize} model`);
    } catch (error) {
      console.error('Failed to initialize Whisper.cpp:', error);
      throw error;
    }
  }

  private async loadWhisperWasm(): Promise<any> {
    // Dynamic import to avoid bundling WASM in main bundle
    const wasmModule = await import('./whisper.wasm');
    return await wasmModule.default();
  }

  private async loadModel(modelSize: string): Promise<void> {
    if (this.modelCache.has(modelSize)) return;

    const modelUrl = `/models/whisper-${modelSize}.bin`;
    
    try {
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);
      
      const modelData = await response.arrayBuffer();
      this.modelCache.set(modelSize, modelData);
      
      // Initialize model in Whisper module
      this.whisperModule.loadModel(modelData);
    } catch (error) {
      console.error(`Failed to load Whisper model ${modelSize}:`, error);
      throw error;
    }
  }

  async transcribeAudio(audioBuffer: ArrayBuffer, language?: string): Promise<TranscriptionResult> {
    if (!this.isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    const startTime = performance.now();
    
    try {
      // Convert audio buffer to format expected by Whisper
      const audioData = new Float32Array(audioBuffer);
      
      // Transcribe using Whisper.cpp
      const result = await this.whisperModule.transcribe({
        audio: audioData,
        language: language || 'auto',
        task: 'transcribe',
        temperature: 0.0,
        best_of: 1
      });

      const endTime = performance.now();

      return {
        text: result.text.trim(),
        confidence: result.confidence || 0.8,
        language: result.detectedLanguage || language || 'en',
        processingTime: endTime - startTime,
        segments: result.segments || []
      };
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.whisperModule !== null;
  }

  getSupportedLanguages(): string[] {
    return [
      'en', 'ms', 'id', 'th', 'vi', 'fil', 'my', 'km', 'lo', 'zh'
    ];
  }
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  segments: TranscriptionSegment[];
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}
```

### 3. Voice Service Router (Smart Selection)

```typescript
// services/voice-service-router.ts
export class VoiceServiceRouter {
  private webSpeechService: FreeVoiceService;
  private whisperService: WhisperService;
  private ttlService: TTSService;
  private capabilities: VoiceCapabilities;

  constructor() {
    this.webSpeechService = new FreeVoiceService();
    this.whisperService = new WhisperService();
    this.ttlService = new TTSService();
    this.capabilities = this.detectCapabilities();
  }

  private detectCapabilities(): VoiceCapabilities {
    return {
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window,
      mediaRecorder: 'MediaRecorder' in window,
      webAssembly: typeof WebAssembly !== 'undefined',
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
      offlineSupport: 'serviceWorker' in navigator
    };
  }

  async transcribeAudio(audioBlob: Blob, options: TranscriptionOptions): Promise<TranscriptionResult> {
    const strategy = this.selectTranscriptionStrategy(options);
    
    switch (strategy) {
      case 'web-speech':
        return await this.transcribeWithWebSpeech(audioBlob, options);
      
      case 'whisper':
        return await this.transcribeWithWhisper(audioBlob, options);
      
      case 'manual':
      default:
        throw new Error('No available transcription method');
    }
  }

  private selectTranscriptionStrategy(options: TranscriptionOptions): TranscriptionStrategy {
    // High quality required and Whisper available
    if (options.requireHighQuality && this.whisperService.isAvailable()) {
      return 'whisper';
    }

    // Offline mode required
    if (options.offlineOnly && this.whisperService.isAvailable()) {
      return 'whisper';
    }

    // Web Speech API available (most common case)
    if (this.capabilities.speechRecognition) {
      return 'web-speech';
    }

    // No viable automatic transcription
    return 'manual';
  }

  private async transcribeWithWebSpeech(audioBlob: Blob, options: TranscriptionOptions): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Note: Web Speech API doesn't support direct audio file input
          // This is a limitation - we need live audio stream
          throw new Error('Web Speech API requires live audio stream');
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(audioBlob);
    });
  }

  private async transcribeWithWhisper(audioBlob: Blob, options: TranscriptionOptions): Promise<TranscriptionResult> {
    if (!this.whisperService.isAvailable()) {
      await this.whisperService.initialize();
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    return await this.whisperService.transcribeAudio(arrayBuffer, options.language);
  }

  async synthesizeSpeech(text: string, options: SynthesisOptions): Promise<AudioBuffer> {
    if (!this.capabilities.speechSynthesis) {
      throw new Error('Text-to-speech not supported');
    }

    // Use Web Speech Synthesis (always available if supported)
    await this.ttlService.speak(text, {
      language: options.language,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume
    });

    // Web Speech API doesn't return AudioBuffer directly
    // Return empty buffer as placeholder
    return new AudioBuffer({
      numberOfChannels: 1,
      length: 1,
      sampleRate: 16000
    });
  }

  getRecommendedStrategy(userPreference?: string): VoiceStrategy {
    const strategies: VoiceStrategy[] = [];

    if (this.capabilities.speechRecognition && this.capabilities.speechSynthesis) {
      strategies.push({
        name: 'web-apis',
        displayName: 'Browser Voice Features',
        description: 'Fast, reliable, works online',
        stt: 'web-speech',
        tts: 'web-synthesis',
        cost: 'free',
        quality: 'good',
        offline: false
      });
    }

    if (this.whisperService.isAvailable() && this.capabilities.speechSynthesis) {
      strategies.push({
        name: 'whisper-hybrid',
        displayName: 'Enhanced Voice (Offline)',
        description: 'Higher accuracy, works offline',
        stt: 'whisper',
        tts: 'web-synthesis',
        cost: 'free',
        quality: 'excellent',
        offline: true
      });
    }

    strategies.push({
      name: 'text-only',
      displayName: 'Text Input Only',
      description: 'Always available fallback',
      stt: 'manual',
      tts: 'none',
      cost: 'free',
      quality: 'reliable',
      offline: true
    });

    return strategies[0] || strategies[strategies.length - 1];
  }
}

interface VoiceCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaRecorder: boolean;
  webAssembly: boolean;
  audioContext: boolean;
  offlineSupport: boolean;
}

interface TranscriptionOptions {
  language?: string;
  requireHighQuality?: boolean;
  offlineOnly?: boolean;
  realTime?: boolean;
}

interface SynthesisOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  gender?: 'male' | 'female';
}

type TranscriptionStrategy = 'web-speech' | 'whisper' | 'manual';

interface VoiceStrategy {
  name: string;
  displayName: string;
  description: string;
  stt: string;
  tts: string;
  cost: string;
  quality: string;
  offline: boolean;
}
```

## React Component Integration

### Voice Input Hook

```typescript
// hooks/useVoiceInput.ts
export function useVoiceInput(language: string = 'en') {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const voiceRouter = useMemo(() => new VoiceServiceRouter(), []);
  
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    try {
      setError(null);
      setIsRecording(true);
      
      await voiceRouter.startRecording({
        language,
        onTranscription: (text, conf) => {
          setTranscription(text);
          setConfidence(conf);
        },
        onError: (err) => {
          setError(err.message);
          setIsRecording(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed');
      setIsRecording(false);
    }
  }, [isRecording, language, voiceRouter]);
  
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    try {
      await voiceRouter.stopRecording();
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stop recording failed');
      setIsRecording(false);
    }
  }, [isRecording, voiceRouter]);
  
  const clearTranscription = useCallback(() => {
    setTranscription('');
    setConfidence(0);
    setError(null);
  }, []);
  
  return {
    isRecording,
    transcription,
    confidence,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
    isSupported: voiceRouter.capabilities.speechRecognition
  };
}
```

### Text-to-Speech Hook

```typescript
// hooks/useTextToSpeech.ts
export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const voiceRouter = useMemo(() => new VoiceServiceRouter(), []);
  
  const speak = useCallback(async (text: string, options?: SynthesisOptions) => {
    if (isPlaying) {
      // Stop current speech
      window.speechSynthesis.cancel();
    }
    
    try {
      setError(null);
      setIsPlaying(true);
      setCurrentText(text);
      
      await voiceRouter.synthesizeSpeech(text, {
        language: options?.language || 'en',
        rate: options?.rate || 0.9,
        pitch: options?.pitch || 1.0,
        volume: options?.volume || 1.0
      });
      
      setIsPlaying(false);
      setCurrentText(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech synthesis failed');
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, [isPlaying, voiceRouter]);
  
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentText(null);
  }, []);
  
  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);
  
  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);
  
  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    currentText,
    error,
    isSupported: voiceRouter.capabilities.speechSynthesis
  };
}
```

## Browser Compatibility & Fallbacks

### Feature Detection Matrix

| Browser | Speech Recognition | Speech Synthesis | WebAssembly | MediaRecorder |
|---------|-------------------|------------------|-------------|---------------|
| Chrome 25+ | ✅ | ✅ | ✅ | ✅ |
| Edge 79+ | ✅ | ✅ | ✅ | ✅ |
| Firefox 55+ | ❌ | ✅ | ✅ | ✅ |
| Safari 14.1+ | ❌ | ✅ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ | ✅ | ✅ |
| Mobile Safari | ❌ | ✅ | ✅ | ✅ |

### Graceful Degradation Strategy

```typescript
// components/VoiceCapabilityWrapper.tsx
export function VoiceCapabilityWrapper({ children }: { children: React.ReactNode }) {
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);
  const [strategy, setStrategy] = useState<VoiceStrategy | null>(null);
  
  useEffect(() => {
    const router = new VoiceServiceRouter();
    const caps = router.capabilities;
    const recommendedStrategy = router.getRecommendedStrategy();
    
    setCapabilities(caps);
    setStrategy(recommendedStrategy);
  }, []);
  
  if (!capabilities || !strategy) {
    return <div>Loading voice capabilities...</div>;
  }
  
  return (
    <VoiceCapabilityContext.Provider value={{ capabilities, strategy }}>
      {children}
      <CapabilityWarning capabilities={capabilities} strategy={strategy} />
    </VoiceCapabilityContext.Provider>
  );
}

function CapabilityWarning({ capabilities, strategy }: CapabilityWarningProps) {
  if (strategy.name === 'text-only') {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Voice features unavailable</AlertTitle>
        <AlertDescription>
          Your browser doesn't support voice input. You can still use text input for all features.
          For the best experience, try using Chrome or Edge.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!capabilities.speechRecognition && capabilities.speechSynthesis) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Limited voice features</AlertTitle>
        <AlertDescription>
          Questions can be read aloud, but voice input isn't available. 
          Switch to Chrome or Edge for full voice interaction.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
```

## Performance Optimization

### Audio Processing Optimization

```typescript
// utils/audio-processing.ts
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  
  async initialize(): Promise<void> {
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
      throw new Error('Web Audio API not supported');
    }
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load audio worklet for real-time processing
    await this.audioContext.audioWorklet.addModule('/audio-worklets/noise-suppressor.js');
    this.workletNode = new AudioWorkletNode(this.audioContext, 'noise-suppressor');
  }
  
  processAudioStream(stream: MediaStream): MediaStream {
    if (!this.audioContext || !this.workletNode) {
      return stream; // Return unprocessed if not initialized
    }
    
    const source = this.audioContext.createMediaStreamSource(stream);
    const destination = this.audioContext.createMediaStreamDestination();
    
    // Apply noise suppression
    source.connect(this.workletNode);
    this.workletNode.connect(destination);
    
    return destination.stream;
  }
  
  analyzeAudioQuality(audioBuffer: ArrayBuffer): AudioQualityMetrics {
    // Simple quality analysis
    const float32Array = new Float32Array(audioBuffer);
    const samples = Array.from(float32Array);
    
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    const snr = this.estimateSignalToNoise(samples);
    
    return {
      rms,
      snr,
      quality: this.categorizeQuality(rms, snr),
      recommendation: this.getQualityRecommendation(rms, snr)
    };
  }
  
  private estimateSignalToNoise(samples: number[]): number {
    const sortedSamples = [...samples].sort((a, b) => Math.abs(b) - Math.abs(a));
    const signalLevel = sortedSamples.slice(0, Math.floor(samples.length * 0.1))
      .reduce((sum, val) => sum + Math.abs(val), 0) / (samples.length * 0.1);
    const noiseLevel = sortedSamples.slice(Math.floor(samples.length * 0.9))
      .reduce((sum, val) => sum + Math.abs(val), 0) / (samples.length * 0.1);
    
    return noiseLevel > 0 ? signalLevel / noiseLevel : Infinity;
  }
  
  private categorizeQuality(rms: number, snr: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (rms > 0.1 && snr > 10) return 'excellent';
    if (rms > 0.05 && snr > 5) return 'good';
    if (rms > 0.01 && snr > 2) return 'fair';
    return 'poor';
  }
  
  private getQualityRecommendation(rms: number, snr: number): string {
    if (rms < 0.01) return 'Speak closer to the microphone';
    if (snr < 2) return 'Find a quieter environment';
    if (rms > 0.1 && snr > 10) return 'Audio quality is excellent';
    return 'Audio quality is acceptable';
  }
}

interface AudioQualityMetrics {
  rms: number;
  snr: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
}
```

## Cost Analysis & Scaling

### Free Tier Limitations

**Web Speech API**:
- No cost limitations
- Rate limited by browser (usually no issues)
- Quality depends on device and environment

**Whisper.cpp**:
- One-time model download (~39MB for base model)
- Processing time scales with audio length
- Memory usage: ~200MB during processing

**Alternative Paid Services** (for comparison):
- Google Cloud Speech: $0.006 per 15 seconds
- Azure Speech: $1.00 per audio hour
- AWS Transcribe: $0.0004 per second

### Scaling Strategy

**MVP (0-1K users)**: Pure free services - $0/month
**Growth (1K-10K users)**: Add Google Cloud free tier - $0-50/month  
**Scale (10K+ users)**: Hybrid approach with premium services - $200-1K/month

## Testing Strategy

### Voice Quality Testing

```typescript
// tests/voice-quality.test.ts
describe('Voice Quality Tests', () => {
  let voiceService: VoiceServiceRouter;
  
  beforeEach(() => {
    voiceService = new VoiceServiceRouter();
  });
  
  test('should detect speech recognition capability', () => {
    const capabilities = voiceService.capabilities;
    expect(typeof capabilities.speechRecognition).toBe('boolean');
  });
  
  test('should handle audio quality assessment', async () => {
    const mockAudioBuffer = generateMockAudioBuffer();
    const processor = new AudioProcessor();
    await processor.initialize();
    
    const metrics = processor.analyzeAudioQuality(mockAudioBuffer);
    expect(metrics.quality).toMatch(/excellent|good|fair|poor/);
    expect(metrics.recommendation).toBeTruthy();
  });
  
  test('should fallback gracefully when voice unavailable', async () => {
    // Mock browser without speech recognition
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true
    });
    
    const strategy = voiceService.getRecommendedStrategy();
    expect(strategy.stt).toBe('manual');
  });
});

function generateMockAudioBuffer(): ArrayBuffer {
  const length = 16000; // 1 second at 16kHz
  const buffer = new ArrayBuffer(length * 4);
  const view = new Float32Array(buffer);
  
  // Generate simple sine wave with noise
  for (let i = 0; i < length; i++) {
    view[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.3 + (Math.random() - 0.5) * 0.1;
  }
  
  return buffer;
}
```

## Deployment Considerations

### Static Asset Optimization

```yaml
# webpack.config.js optimization for voice assets
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        voice: {
          test: /[\\/]whisper[\\/]/,
          name: 'voice-services',
          chunks: 'all',
          enforce: true
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ]
  }
}
```

### Service Worker for Offline Support

```typescript
// public/sw.js - Service worker for offline voice features
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('voice-cache-v1').then((cache) => {
      return cache.addAll([
        '/models/whisper-base.bin',
        '/audio-worklets/noise-suppressor.js',
        '/voice/offline-fallback.html'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/models/') || event.request.url.includes('/audio-worklets/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

This implementation guide provides a comprehensive, production-ready approach to implementing voice services using free and open-source technologies, ensuring the AI-Powered Prepare Module delivers excellent user experience while maintaining cost-effectiveness.