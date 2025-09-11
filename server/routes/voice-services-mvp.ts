import { Router } from 'express';
import { sealionService } from '../services/sealion';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// Voice service status
router.get('/health', async (req, res) => {
  try {
    const status = {
      status: 'healthy',
      services: {
        browserTTS: true, // Web Speech API
        browserSTT: true, // Web Speech API
        sealion: true, // For text processing
        translation: true // SeaLion translation
      },
      features: {
        tts: 'Browser Web Speech API',
        stt: 'Browser Web Speech API',
        translation: 'SeaLion AI',
        languages: 10
      },
      timestamp: new Date().toISOString()
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Voice services health check failed' });
  }
});

// Voice service configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      supportedLanguages: [
        { code: 'en', name: 'English', localName: 'English', browserSupport: true },
        { code: 'ms', name: 'Bahasa Malaysia', localName: 'Bahasa Malaysia', browserSupport: true },
        { code: 'id', name: 'Bahasa Indonesia', localName: 'Bahasa Indonesia', browserSupport: true },
        { code: 'th', name: 'Thai', localName: 'ไทย', browserSupport: true },
        { code: 'vi', name: 'Vietnamese', localName: 'Tiếng Việt', browserSupport: true },
        { code: 'fil', name: 'Filipino', localName: 'Filipino', browserSupport: true },
        { code: 'my', name: 'Myanmar', localName: 'မြန်မာ', browserSupport: false },
        { code: 'km', name: 'Khmer', localName: 'ខ្មែរ', browserSupport: false },
        { code: 'lo', name: 'Lao', localName: 'ລາວ', browserSupport: false },
        { code: 'zh-sg', name: 'Chinese Singapore', localName: '中文', browserSupport: true }
      ],
      ttsVoices: {
        en: ['en-US-Standard-A', 'en-US-Standard-B', 'en-US-Standard-C', 'en-US-Standard-D'],
        ms: ['ms-MY-Standard-A', 'ms-MY-Standard-B'],
        id: ['id-ID-Standard-A', 'id-ID-Standard-B'],
        th: ['th-TH-Standard-A', 'th-TH-Standard-B'],
        vi: ['vi-VN-Standard-A', 'vi-VN-Standard-B'],
        fil: ['fil-PH-Standard-A', 'fil-PH-Standard-B'],
        'zh-sg': ['zh-SG-Standard-A', 'zh-SG-Standard-B']
      },
      browserVoices: {
        en: ['Google US English', 'Microsoft David Desktop', 'Microsoft Zira Desktop'],
        ms: ['Google Bahasa Malaysia', 'Microsoft Rizwan Desktop'],
        id: ['Google Bahasa Indonesia', 'Microsoft Andika Desktop'],
        th: ['Google ไทย', 'Microsoft Pattara Desktop'],
        vi: ['Google Tiếng Việt', 'Microsoft An Desktop'],
        fil: ['Google Filipino', 'Microsoft Angelo Desktop'],
        'zh-sg': ['Google 中文', 'Microsoft Huihui Desktop']
      },
      sttModels: ['browser-speech-api', 'whisper-1'],
      maxFileSize: '10MB',
      supportedFormats: ['wav', 'mp3', 'm4a', 'webm', 'ogg'],
      freeServices: {
        browserTTS: 'Unlimited',
        browserSTT: 'Unlimited',
        translation: 'Unlimited via SeaLion'
      }
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voice configuration' });
  }
});

// Text-to-Speech endpoint (processes text for browser TTS)
router.post('/tts', requireAuth, async (req, res) => {
  try {
    const { text, language = 'en', voice, rate = 1.0, pitch = 1.0 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use SeaLion for text processing and optimization
    const processedText = await sealionService.generateResponse({
      messages: [{
        role: 'user',
        content: `Optimize this text for speech synthesis in ${language}: "${text}". 
        Add natural pauses, correct pronunciation hints, and ensure it flows well when spoken. 
        Return only the optimized text, no explanations.`
      }],
      maxTokens: 500,
      temperature: 0.3
    });

    // Get available browser voices for the language
    const availableVoices = getBrowserVoices(language);
    const selectedVoice = voice || availableVoices[0] || 'default';

    const ttsResponse = {
      success: true,
      text: processedText,
      originalText: text,
      language,
      voice: selectedVoice,
      availableVoices,
      rate,
      pitch,
      duration: estimateDuration(processedText),
      method: 'browser-speech-api',
      instructions: {
        useBrowserTTS: true,
        voiceName: selectedVoice,
        rate: rate,
        pitch: pitch,
        language: language
      },
      timestamp: new Date().toISOString()
    };

    res.json(ttsResponse);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ 
      error: 'TTS processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Speech-to-Text endpoint (provides configuration for browser STT)
router.post('/stt', requireAuth, async (req, res) => {
  try {
    const { language = 'en', continuous = false, interimResults = true } = req.body;

    const sttResponse = {
      success: true,
      language,
      continuous,
      interimResults,
      method: 'browser-speech-api',
      instructions: {
        useBrowserSTT: true,
        language: language,
        continuous: continuous,
        interimResults: interimResults,
        maxAlternatives: 1
      },
      supportedLanguages: getSupportedSTTLanguages(),
      timestamp: new Date().toISOString()
    };

    res.json(sttResponse);
  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ 
      error: 'STT configuration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Translation endpoint
router.post('/translate', requireAuth, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Use SeaLion for translation
    const translation = await sealionService.generateResponse({
      messages: [{
        role: 'user',
        content: `Translate this text from ${sourceLanguage} to ${targetLanguage}: "${text}". 
        Ensure the translation is natural, culturally appropriate, and maintains the original meaning. 
        Return only the translation, no explanations.`
      }],
      maxTokens: 1000,
      temperature: 0.3
    });

    const translationResponse = {
      success: true,
      originalText: text,
      translatedText: translation,
      sourceLanguage,
      targetLanguage,
      method: 'sealion-ai',
      timestamp: new Date().toISOString()
    };

    res.json(translationResponse);
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Voice quality recommendations
router.post('/quality-recommendations', requireAuth, async (req, res) => {
  try {
    const { audioMetrics, language = 'en' } = req.body;

    const recommendations = generateQualityRecommendations(audioMetrics, language);

    res.json({
      success: true,
      recommendations,
      language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quality Recommendations Error:', error);
    res.status(500).json({ 
      error: 'Quality recommendations failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Browser voice detection endpoint
router.get('/browser-voices', async (req, res) => {
  try {
    const { language } = req.query;
    
    const voices = getBrowserVoices(language as string || 'en');
    
    res.json({
      success: true,
      voices,
      language: language || 'en',
      totalVoices: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Browser Voices Error:', error);
    res.status(500).json({ 
      error: 'Failed to get browser voices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getBrowserVoices(language: string): string[] {
  const voiceMap: Record<string, string[]> = {
    'en': ['Google US English', 'Microsoft David Desktop', 'Microsoft Zira Desktop', 'Samantha'],
    'ms': ['Google Bahasa Malaysia', 'Microsoft Rizwan Desktop'],
    'id': ['Google Bahasa Indonesia', 'Microsoft Andika Desktop'],
    'th': ['Google ไทย', 'Microsoft Pattara Desktop'],
    'vi': ['Google Tiếng Việt', 'Microsoft An Desktop'],
    'fil': ['Google Filipino', 'Microsoft Angelo Desktop'],
    'zh-sg': ['Google 中文', 'Microsoft Huihui Desktop']
  };
  return voiceMap[language] || ['Default Voice'];
}

function getSupportedSTTLanguages(): string[] {
  return [
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
    'ms-MY', 'id-ID', 'th-TH', 'vi-VN', 'fil-PH',
    'zh-CN', 'zh-TW', 'zh-HK', 'ja-JP', 'ko-KR'
  ];
}

function estimateDuration(text: string): number {
  // Rough estimate: 150 words per minute
  const words = text.split(' ').length;
  return Math.ceil((words / 150) * 60);
}

function generateQualityRecommendations(audioMetrics: any, language: string): string[] {
  const recommendations = [];
  
  if (audioMetrics) {
    if (audioMetrics.volume < 0.1) {
      recommendations.push("Audio volume is too low. Please speak closer to the microphone.");
    } else if (audioMetrics.volume > 0.9) {
      recommendations.push("Audio volume is too high. Please speak further from the microphone.");
    }
    
    if (audioMetrics.duration < 2) {
      recommendations.push("Audio is too short. Please speak for at least 2-3 seconds.");
    }
    
    if (audioMetrics.noise > 0.3) {
      recommendations.push("Background noise detected. Please find a quieter environment.");
    }
  }
  
  // Language-specific recommendations
  const languageTips: Record<string, string[]> = {
    'en': [
      "Speak clearly and at a moderate pace",
      "Pause briefly between sentences",
      "Use proper pronunciation for technical terms"
    ],
    'ms': [
      "Bercakap dengan jelas dan perlahan-lahan",
      "Gunakan sebutan yang betul untuk istilah teknikal",
      "Jeda sebentar antara ayat"
    ],
    'id': [
      "Berbicara dengan jelas dan perlahan",
      "Gunakan pengucapan yang benar untuk istilah teknis",
      "Berhenti sebentar di antara kalimat"
    ],
    'th': [
      "พูดชัดเจนและช้าๆ",
      "ใช้การออกเสียงที่ถูกต้องสำหรับคำศัพท์ทางเทคนิค",
      "หยุดสักครู่ระหว่างประโยค"
    ],
    'vi': [
      "Nói rõ ràng và chậm rãi",
      "Sử dụng phát âm đúng cho thuật ngữ kỹ thuật",
      "Tạm dừng giữa các câu"
    ]
  };
  
  const tips = languageTips[language] || languageTips['en'];
  recommendations.push(...tips);
  
  return recommendations;
}

export default router;

