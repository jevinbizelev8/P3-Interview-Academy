import { sealionService } from "./sealion";
import type { SupportedLanguage, SUPPORTED_LANGUAGES } from "@shared/schema";

export class LanguageService {
  
  /**
   * Translate content to the specified language using SeaLion AI
   */
  async translateContent(
    content: string, 
    targetLanguage: SupportedLanguage, 
    context: {
      sourceLanguage?: string;
      contentType?: 'question' | 'feedback' | 'resource' | 'general';
      preserveFormatting?: boolean;
    } = {}
  ): Promise<string> {
    
    if (targetLanguage === 'en' && context.sourceLanguage === 'en') {
      return content; // No translation needed
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];
    const sourceLanguage = context.sourceLanguage || 'English';
    
    const prompt = this.buildTranslationPrompt(content, languageName, sourceLanguage, context);

    try {
      const translation = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are a professional translator specializing in Southeast Asian languages with expertise in business and interview contexts. Provide accurate, culturally appropriate translations while maintaining the original meaning and tone."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: Math.max(500, content.length * 2), // Allow for expansion in translation
        temperature: 0.3 // Lower temperature for more consistent translation
      });

      return translation.trim();
    } catch (error) {
      console.error(`Translation error for language ${targetLanguage}:`, error);
      return content; // Return original content if translation fails
    }
  }

  /**
   * Generate multilingual interview questions
   */
  async generateMultilingualQuestion(
    baseQuestion: string,
    targetLanguage: SupportedLanguage,
    context: {
      jobPosition?: string;
      companyName?: string;
      interviewStage?: string;
      questionType?: 'behavioral' | 'situational' | 'technical' | 'general';
    } = {}
  ): Promise<{
    english: string;
    translated: string;
    culturalNotes?: string;
  }> {

    if (targetLanguage === 'en') {
      return {
        english: baseQuestion,
        translated: baseQuestion
      };
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];
    
    const prompt = `Generate a culturally appropriate interview question for Southeast Asian context.

Base question (English): "${baseQuestion}"
Target language: ${languageName}
${context.jobPosition ? `Job position: ${context.jobPosition}` : ''}
${context.companyName ? `Company: ${context.companyName}` : ''}
${context.interviewStage ? `Interview stage: ${context.interviewStage}` : ''}

Please provide:
1. An improved English version that's culturally sensitive for Southeast Asia
2. A natural translation in ${languageName}
3. Any cultural considerations or notes

Format your response as JSON:
{
  "english": "improved English question",
  "translated": "translation in ${languageName}",
  "culturalNotes": "optional cultural considerations"
}`;

    try {
      const response = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert in Southeast Asian business culture and professional communication. Generate interview questions that are respectful, appropriate, and effective across different cultural contexts in the region."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 800,
        temperature: 0.4
      });

      const parsed = JSON.parse(response);
      return {
        english: parsed.english || baseQuestion,
        translated: parsed.translated || baseQuestion,
        culturalNotes: parsed.culturalNotes
      };
    } catch (error) {
      console.error('Error generating multilingual question:', error);
      // Fallback to simple translation
      const translated = await this.translateContent(baseQuestion, targetLanguage, {
        contentType: 'question'
      });
      
      return {
        english: baseQuestion,
        translated: translated
      };
    }
  }

  /**
   * Provide culturally appropriate feedback in multiple languages
   */
  async generateMultilingualFeedback(
    feedback: string,
    targetLanguage: SupportedLanguage,
    context: {
      userResponse?: string;
      questionType?: string;
      culturalContext?: 'formal' | 'casual' | 'mixed';
    } = {}
  ): Promise<{
    english: string;
    translated: string;
    culturalTips?: string[];
  }> {

    if (targetLanguage === 'en') {
      return {
        english: feedback,
        translated: feedback
      };
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];
    
    const prompt = `Provide culturally appropriate interview feedback for Southeast Asian context.

Original feedback (English): "${feedback}"
Target language: ${languageName}
Cultural context: ${context.culturalContext || 'professional'}

Please provide:
1. The original feedback in clear, professional English
2. A culturally sensitive translation in ${languageName}
3. Any cultural tips specific to ${languageName.split(' ')[0]} business culture

Consider:
- Appropriate level of directness vs. diplomacy
- Cultural values around feedback and criticism
- Professional communication norms
- Face-saving concepts where applicable

Format as JSON:
{
  "english": "clear English feedback",
  "translated": "culturally appropriate ${languageName} translation",
  "culturalTips": ["tip1", "tip2", ...]
}`;

    try {
      const response = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert in cross-cultural communication and professional development across Southeast Asian cultures. Provide feedback that is constructive, respectful, and culturally appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 1000,
        temperature: 0.4
      });

      const parsed = JSON.parse(response);
      return {
        english: parsed.english || feedback,
        translated: parsed.translated || feedback,
        culturalTips: parsed.culturalTips || []
      };
    } catch (error) {
      console.error('Error generating multilingual feedback:', error);
      const translated = await this.translateContent(feedback, targetLanguage, {
        contentType: 'feedback'
      });
      
      return {
        english: feedback,
        translated: translated
      };
    }
  }

  /**
   * Generate localized preparation resources
   */
  async generateLocalizedResource(
    topic: string,
    resourceType: 'article' | 'template' | 'checklist' | 'example',
    targetLanguage: SupportedLanguage,
    context: {
      industry?: string;
      jobLevel?: 'entry' | 'mid' | 'senior' | 'executive';
      localMarket?: string; // e.g., 'Singapore', 'Malaysia', 'Indonesia'
    } = {}
  ): Promise<{
    title: string;
    content: string;
    language: SupportedLanguage;
    culturalAdaptations: string[];
  }> {

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];
    const country = this.getCountryFromLanguage(targetLanguage);
    
    const prompt = `Create a localized interview preparation ${resourceType} for ${country}.

Topic: ${topic}
Target language: ${languageName}
${context.industry ? `Industry: ${context.industry}` : ''}
${context.jobLevel ? `Job level: ${context.jobLevel}` : ''}
${context.localMarket ? `Local market: ${context.localMarket}` : ''}

Create content that:
1. Is written in ${targetLanguage === 'en' ? 'English' : languageName}
2. Reflects local business culture and practices
3. Uses relevant examples from the ${country} context
4. Addresses cultural nuances in interview processes
5. Provides actionable, practical advice

Include specific cultural adaptations made for this market.

Format as JSON:
{
  "title": "${resourceType} title in appropriate language",
  "content": "detailed ${resourceType} content",
  "culturalAdaptations": ["adaptation1", "adaptation2", ...]
}`;

    try {
      const response = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: `You are an expert career counselor and interview coach specializing in ${country} business culture. Create practical, culturally relevant career development content.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 2000,
        temperature: 0.6
      });

      const parsed = JSON.parse(response);
      return {
        title: parsed.title || topic,
        content: parsed.content || '',
        language: targetLanguage,
        culturalAdaptations: parsed.culturalAdaptations || []
      };
    } catch (error) {
      console.error('Error generating localized resource:', error);
      throw new Error(`Failed to generate localized resource for ${languageName}`);
    }
  }

  /**
   * Detect the most likely language of text content
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    const prompt = `Detect the language of this text and return the appropriate language code.

Text: "${text.substring(0, 200)}..."

Return one of these language codes:
- en (English)
- ms (Bahasa Malaysia) 
- id (Bahasa Indonesia)
- th (Thai)
- vi (Vietnamese)
- fil (Filipino)
- my (Myanmar)
- km (Khmer)
- lo (Lao)
- zh-sg (Chinese - Singapore)

Return only the language code, nothing else.`;

    try {
      const response = await sealionService.generateResponse({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 10,
        temperature: 0.1
      });

      const detectedCode = response.trim().toLowerCase();
      
      // Validate the detected language code
      if (detectedCode in SUPPORTED_LANGUAGES) {
        return detectedCode as SupportedLanguage;
      }
      
      return 'en'; // Default to English if detection fails
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  private buildTranslationPrompt(
    content: string, 
    targetLanguage: string, 
    sourceLanguage: string,
    context: {
      contentType?: string;
      preserveFormatting?: boolean;
    }
  ): string {
    
    let prompt = `Translate the following ${context.contentType || 'text'} from ${sourceLanguage} to ${targetLanguage}.

Original text:
"${content}"

Requirements:
- Maintain the original meaning and tone
- Use professional, appropriate language
- Adapt for business/interview context
- Ensure cultural appropriateness for Southeast Asian context`;

    if (context.preserveFormatting) {
      prompt += '\n- Preserve any formatting, bullet points, or structure';
    }

    if (context.contentType === 'question') {
      prompt += '\n- Make the question natural and appropriate for interview setting';
    } else if (context.contentType === 'feedback') {
      prompt += '\n- Ensure the feedback is constructive and culturally sensitive';
    }

    prompt += '\n\nProvide only the translation, no explanations or additional text.';

    return prompt;
  }

  private getCountryFromLanguage(language: SupportedLanguage): string {
    const languageToCountry: Record<SupportedLanguage, string> = {
      'en': 'Southeast Asia',
      'ms': 'Malaysia',
      'id': 'Indonesia', 
      'th': 'Thailand',
      'vi': 'Vietnam',
      'fil': 'Philippines',
      'my': 'Myanmar',
      'km': 'Cambodia',
      'lo': 'Laos',
      'zh-sg': 'Singapore'
    };

    return languageToCountry[language] || 'Southeast Asia';
  }

  /**
   * Get language-specific interview tips
   */
  async getLanguageSpecificTips(language: SupportedLanguage): Promise<{
    communicationStyle: string[];
    culturalConsiderations: string[];
    commonMistakes: string[];
    successTips: string[];
  }> {
    
    if (language === 'en') {
      return {
        communicationStyle: [
          'Be direct but diplomatic',
          'Use professional terminology',
          'Maintain confident tone'
        ],
        culturalConsiderations: [
          'Eye contact shows confidence',
          'Firm handshake is expected',
          'Individual achievement is valued'
        ],
        commonMistakes: [
          'Being too modest about achievements',
          'Not preparing specific examples',
          'Failing to ask thoughtful questions'
        ],
        successTips: [
          'Prepare STAR method examples',
          'Research company thoroughly',
          'Practice with mock interviews'
        ]
      };
    }

    const languageName = SUPPORTED_LANGUAGES[language];
    const country = this.getCountryFromLanguage(language);
    
    const prompt = `Provide interview tips specific to ${country} business culture and ${languageName} communication style.

Please provide specific advice for:
1. Communication style preferences
2. Important cultural considerations
3. Common mistakes to avoid
4. Keys to success

Format as JSON:
{
  "communicationStyle": ["tip1", "tip2", ...],
  "culturalConsiderations": ["consideration1", "consideration2", ...],
  "commonMistakes": ["mistake1", "mistake2", ...], 
  "successTips": ["tip1", "tip2", ...]
}`;

    try {
      const response = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: `You are an expert in ${country} business culture and professional communication. Provide specific, actionable interview advice.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 1200,
        temperature: 0.4
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error getting language-specific tips:', error);
      return {
        communicationStyle: ['Use respectful, professional language'],
        culturalConsiderations: ['Show respect for hierarchy and tradition'],
        commonMistakes: ['Not understanding local business customs'],
        successTips: ['Learn about local business culture and values']
      };
    }
  }
}

export const languageService = new LanguageService();