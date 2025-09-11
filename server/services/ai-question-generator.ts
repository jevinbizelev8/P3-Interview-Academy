// AI Question Generator Service
// Generates contextual interview questions using OpenAI and SeaLion AI for ASEAN cultural awareness

import { SeaLionService } from "./sealion.js";
import { getOpenAIService, OpenAIService } from "./openai-service.js";

interface QuestionGenerationRequest {
  jobPosition: string;
  companyName?: string;
  interviewStage: string;
  experienceLevel: string;
  preferredLanguage: string;
  difficultyLevel: string;
  focusAreas: string[];
  questionCategories: string[];
  questionNumber: number;
  previousResponses?: any[];
  adaptiveDifficulty?: boolean;
}

interface GeneratedQuestion {
  questionText: string;
  questionTextTranslated: string;
  questionCategory: string;
  questionType: 'behavioral' | 'situational' | 'technical' | 'cultural';
  difficultyLevel: string;
  expectedAnswerTime: number;
  culturalContext: string;
  starMethodRelevant: boolean;
  generatedBy: 'sealion' | 'openai' | 'fallback';
}

interface QuestionTemplate {
  category: string;
  type: string;
  templates: string[];
  culturalAdaptations: Record<string, string>;
  starRelevant: boolean;
}

export class AIQuestionGenerator {
  private seaLionService: SeaLionService;
  private openaiService: OpenAIService;
  private questionTemplates: QuestionTemplate[];

  constructor() {
    this.seaLionService = new SeaLionService();
    try {
      this.openaiService = getOpenAIService();
    } catch (error) {
      console.warn("⚠️ OpenAI service not available, will use SeaLion and fallback only:", error instanceof Error ? error.message : 'Unknown error');
    }
    this.questionTemplates = this.initializeQuestionTemplates();
  }

  /**
   * Generate contextual interview question
   */
  async generateQuestion(request: QuestionGenerationRequest): Promise<GeneratedQuestion> {
    try {
      console.log(`🎯 Generating question ${request.questionNumber} for ${request.jobPosition}`);

      // Try OpenAI first (prioritized as requested)
      if (this.openaiService) {
        try {
          const openaiQuestion = await this.generateWithOpenAI(request);
          if (openaiQuestion) return openaiQuestion;
        } catch (error) {
          console.warn("⚠️ OpenAI generation failed, trying SeaLion:", error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Try SeaLion AI second for ASEAN languages and cultural context
      if (this.shouldUseSeaLion(request.preferredLanguage)) {
        try {
          const seaLionQuestion = await this.generateWithSeaLion(request);
          if (seaLionQuestion) return seaLionQuestion;
        } catch (error) {
          console.warn("⚠️ SeaLion generation failed, falling back to templates:", error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Fallback to template-based generation
      return this.generateFromTemplate(request);

    } catch (error) {
      console.error("❌ Error generating question:", error);
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate question using OpenAI
   */
  private async generateWithOpenAI(request: QuestionGenerationRequest): Promise<GeneratedQuestion | null> {
    try {
      const prompt = this.buildOpenAIPrompt(request);
      
      const response = await this.openaiService.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1000,
        temperature: 0.7
      });

      return this.parseOpenAIResponse(response, request);

    } catch (error) {
      console.error("❌ OpenAI generation error:", error);
      return null;
    }
  }

  /**
   * Generate question using SeaLion AI
   */
  private async generateWithSeaLion(request: QuestionGenerationRequest): Promise<GeneratedQuestion | null> {
    try {
      const prompt = this.buildSeaLionPrompt(request);
      
      const response = await this.seaLionService.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1000,
        temperature: 0.7
      });

      return this.parseSeaLionResponse(response, request);

    } catch (error) {
      console.error("❌ SeaLion generation error:", error);
      return null;
    }
  }

  /**
   * Build OpenAI prompt for question generation  
   */
  private buildOpenAIPrompt(request: QuestionGenerationRequest): string {
    const culturalContext = this.getCulturalContext(request.preferredLanguage);
    const adaptiveContext = this.getAdaptiveContext(request);

    return `You are an expert AI interview coach with deep knowledge of hiring practices and interview strategies. Generate a high-quality, culturally-appropriate interview question.

Context:
- Job Position: ${request.jobPosition}
- Company: ${request.companyName || 'Tech company'}
- Interview Stage: ${request.interviewStage}
- Experience Level: ${request.experienceLevel}
- Language: ${request.preferredLanguage}
- Question Number: ${request.questionNumber}
- Focus Areas: ${request.focusAreas.join(', ')}
- Categories: ${request.questionCategories.join(', ')}
- Difficulty: ${request.difficultyLevel}

${culturalContext}
${adaptiveContext}

Requirements:
1. Generate ONE excellent interview question for ${request.jobPosition}
2. Make it culturally appropriate for ${this.getLanguageName(request.preferredLanguage)} speakers
3. Include STAR method guidance if behavioral question
4. Translate to ${request.preferredLanguage} if not English
5. Specify expected answer time (60-300 seconds)
6. Provide cultural context explanation

Response Format (JSON only, no other text):
{
  "questionText": "English question text",
  "questionTextTranslated": "Translated question (if applicable)",
  "questionCategory": "leadership|problem-solving|teamwork|technical|cultural",
  "questionType": "behavioral|situational|technical|cultural",
  "difficultyLevel": "beginner|intermediate|advanced",
  "expectedAnswerTime": 180,
  "culturalContext": "Brief cultural context explanation",
  "starMethodRelevant": true|false
}`;
  }

  /**
   * Build SeaLion prompt for question generation
   */
  private buildSeaLionPrompt(request: QuestionGenerationRequest): string {
    const culturalContext = this.getCulturalContext(request.preferredLanguage);
    const adaptiveContext = this.getAdaptiveContext(request);

    return `You are an AI interview coach specializing in Southeast Asian job markets. Generate a culturally-appropriate interview question.

Context:
- Job Position: ${request.jobPosition}
- Company: ${request.companyName || 'Tech company'}
- Interview Stage: ${request.interviewStage}
- Experience Level: ${request.experienceLevel}
- Language: ${request.preferredLanguage}
- Question Number: ${request.questionNumber}
- Focus Areas: ${request.focusAreas.join(', ')}
- Categories: ${request.questionCategories.join(', ')}
- Difficulty: ${request.difficultyLevel}

${culturalContext}
${adaptiveContext}

Requirements:
1. Generate ONE interview question appropriate for ${request.jobPosition}
2. Make it culturally relevant for ${this.getLanguageName(request.preferredLanguage)} speakers
3. Include STAR method if behavioral question
4. Translate to ${request.preferredLanguage} if not English
5. Specify expected answer time (60-300 seconds)
6. Include cultural context explanation

Response Format (JSON):
{
  "questionText": "English question text",
  "questionTextTranslated": "Translated question (if applicable)",
  "questionCategory": "leadership|problem-solving|teamwork|technical|cultural",
  "questionType": "behavioral|situational|technical|cultural",
  "difficultyLevel": "beginner|intermediate|advanced",
  "expectedAnswerTime": 180,
  "culturalContext": "Brief cultural context explanation",
  "starMethodRelevant": true|false
}`;
  }

  /**
   * Generate question from templates (fallback method)
   */
  private generateFromTemplate(request: QuestionGenerationRequest): GeneratedQuestion {
    const category = this.selectCategory(request);
    const template = this.getQuestionTemplate(category, request);
    
    const questionText = this.fillTemplate(template, request);
    const questionTextTranslated = this.translateQuestion(questionText, request.preferredLanguage);
    
    return {
      questionText,
      questionTextTranslated,
      questionCategory: category,
      questionType: this.getQuestionType(category),
      difficultyLevel: request.difficultyLevel,
      expectedAnswerTime: this.getExpectedTime(category, request.difficultyLevel),
      culturalContext: this.getCulturalContext(request.preferredLanguage),
      starMethodRelevant: this.isStarRelevant(category),
      generatedBy: 'fallback'
    };
  }

  /**
   * Parse OpenAI response
   */
  private parseOpenAIResponse(response: string, request: QuestionGenerationRequest): GeneratedQuestion {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionText: parsed.questionText || 'Generated question not available',
          questionTextTranslated: parsed.questionTextTranslated || parsed.questionText,
          questionCategory: parsed.questionCategory || 'general',
          questionType: parsed.questionType || 'behavioral',
          difficultyLevel: parsed.difficultyLevel || request.difficultyLevel,
          expectedAnswerTime: parsed.expectedAnswerTime || 180,
          culturalContext: parsed.culturalContext || this.getCulturalContext(request.preferredLanguage),
          starMethodRelevant: parsed.starMethodRelevant ?? true,
          generatedBy: 'openai'
        };
      }

      // Fallback parsing for non-JSON response
      return this.parseTextResponse(response, request, 'openai');

    } catch (error) {
      console.warn("⚠️ Error parsing OpenAI response, using text fallback");
      return this.parseTextResponse(response, request, 'openai');
    }
  }

  /**
   * Parse SeaLion AI response
   */
  private parseSeaLionResponse(response: string, request: QuestionGenerationRequest): GeneratedQuestion {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionText: parsed.questionText || 'Generated question not available',
          questionTextTranslated: parsed.questionTextTranslated || parsed.questionText,
          questionCategory: parsed.questionCategory || 'general',
          questionType: parsed.questionType || 'behavioral',
          difficultyLevel: parsed.difficultyLevel || request.difficultyLevel,
          expectedAnswerTime: parsed.expectedAnswerTime || 180,
          culturalContext: parsed.culturalContext || this.getCulturalContext(request.preferredLanguage),
          starMethodRelevant: parsed.starMethodRelevant ?? true,
          generatedBy: 'sealion'
        };
      }

      // Fallback parsing for non-JSON response
      return this.parseTextResponse(response, request);

    } catch (error) {
      console.warn("⚠️ Error parsing SeaLion response, using fallback");
      return this.generateFromTemplate(request);
    }
  }

  /**
   * Parse non-JSON text response
   */
  private parseTextResponse(response: string, request: QuestionGenerationRequest, service: 'openai' | 'sealion' = 'sealion'): GeneratedQuestion {
    // Extract clean interview question from AI response that may contain reasoning
    const cleanedQuestion = this.extractCleanQuestion(response);
    
    return {
      questionText: cleanedQuestion,
      questionTextTranslated: this.translateQuestion(cleanedQuestion, request.preferredLanguage),
      questionCategory: this.extractCategory(response) || 'behavioral',
      questionType: 'behavioral',
      difficultyLevel: request.difficultyLevel,
      expectedAnswerTime: 180,
      culturalContext: this.getCulturalContext(request.preferredLanguage),
      starMethodRelevant: true,
      generatedBy: service
    };
  }

  /**
   * Extract clean interview question from AI response that may contain reasoning
   */
  private extractCleanQuestion(response: string): string {
    console.log('🔍 Extracting clean question from response:', response.substring(0, 200) + '...');
    
    // Remove thinking tags and content
    let cleaned = response.replace(/<think>.*?<\/think>/gs, '').trim();
    
    // Look for quoted questions first (most reliable)
    const quotedQuestions = cleaned.match(/"([^"]*\?[^"]*)"/g);
    if (quotedQuestions && quotedQuestions.length > 0) {
      // Find the longest quoted question (likely the main one)
      const mainQuestion = quotedQuestions
        .map(q => q.replace(/"/g, '').trim())
        .reduce((longest, current) => current.length > longest.length ? current : longest);
      
      if (mainQuestion.length > 10) {
        console.log('✅ Found quoted question:', mainQuestion);
        return mainQuestion;
      }
    }
    
    // Split by common separators and look for the actual question
    const lines = cleaned.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for patterns that indicate the start of an actual interview question
    const questionStarters = [
      'Bagaimana', 'Ceritakan', 'Berikan', 'Jelaskan', 'Apa', 'Mengapa',
      'How', 'Tell', 'Describe', 'What', 'Why', 'Can you',
      'Selamat', 'Welcome', 'Good morning', 'Hello'
    ];
    
    // Find the line that looks like an actual interview question
    let questionLine = '';
    
    // Look for a line that starts with typical question patterns and contains a question mark
    for (const line of lines) {
      const startsWithQuestionWord = questionStarters.some(starter => 
        line.toLowerCase().startsWith(starter.toLowerCase())
      );
      
      if (startsWithQuestionWord || line.includes('?')) {
        // If this looks like a question, take from here to the end or next obvious break
        const fromThisLine = lines.slice(lines.indexOf(line)).join(' ');
        
        // Extract just the question part (stop at next obvious break like "This allows...")
        const questionEnd = fromThisLine.match(/(.*?[?.!])\s*(?:This |The |It |For |Consider |Remember |Note )/);
        questionLine = questionEnd ? questionEnd[1] : fromThisLine;
        break;
      }
    }
    
    // If no clear question found, take the last meaningful line
    if (!questionLine) {
      questionLine = lines.reverse().find(line => 
        line.includes('?') || 
        line.length > 30 ||
        questionStarters.some(starter => line.toLowerCase().includes(starter.toLowerCase()))
      ) || lines[0] || 'Generated question not available';
    }
    
    // Clean up extra whitespace and ensure it's a complete question
    questionLine = questionLine.replace(/\s+/g, ' ').trim();
    
    // If it doesn't end with proper punctuation, add a question mark if it seems like a question
    if (!questionLine.match(/[.!?]$/)) {
      const seemsLikeQuestion = questionStarters.some(starter => 
        questionLine.toLowerCase().includes(starter.toLowerCase())
      );
      if (seemsLikeQuestion) {
        questionLine += '?';
      }
    }
    
    console.log('✅ Extracted clean question:', questionLine);
    return questionLine || 'Generated question not available';
  }

  /**
   * Check if SeaLion should be used for this language
   */
  private shouldUseSeaLion(language: string): boolean {
    const seaLionLanguages = ['id', 'ms', 'th', 'vi', 'tl', 'my', 'km', 'lo', 'jv', 'su'];
    return seaLionLanguages.includes(language) || language === 'en';
  }

  /**
   * Get cultural context for language
   */
  private getCulturalContext(language: string): string {
    const contexts: Record<string, string> = {
      'id': 'Indonesian business culture values consensus building (gotong royong), respect for hierarchy, and collaborative decision-making.',
      'ms': 'Malaysian workplace culture emphasizes harmony, face-saving (muka), and building relationships before business.',
      'th': 'Thai business culture prioritizes respect (kreng jai), hierarchy awareness, and maintaining harmonious relationships.',
      'vi': 'Vietnamese business culture values respect for seniority, collective decision-making, and building trust over time.',
      'tl': 'Filipino business culture emphasizes personal relationships (pakikipagkapwa), respect for authority, and collaborative teamwork.',
      'my': 'Myanmar business culture values patience, respect for elders, and consensus-building in decision-making.',
      'en': 'ASEAN business culture generally values relationship-building, respect for hierarchy, and collaborative approaches to problem-solving.'
    };
    
    return contexts[language] || contexts['en'];
  }

  /**
   * Get adaptive context based on previous responses
   */
  private getAdaptiveContext(request: QuestionGenerationRequest): string {
    if (!request.adaptiveDifficulty || !request.previousResponses?.length) {
      return '';
    }

    const avgScore = request.previousResponses.reduce((sum, r) => sum + (r.starScores?.overall || 3), 0) / request.previousResponses.length;
    
    if (avgScore >= 4.5) {
      return '\nAdaptive Context: Previous responses show strong performance. Generate a more challenging question.';
    } else if (avgScore <= 2.5) {
      return '\nAdaptive Context: Previous responses need improvement. Generate a more supportive, foundational question.';
    }
    
    return '\nAdaptive Context: Previous responses show moderate performance. Maintain current difficulty level.';
  }

  /**
   * Initialize question templates for fallback
   */
  private initializeQuestionTemplates(): QuestionTemplate[] {
    return [
      {
        category: 'leadership',
        type: 'behavioral',
        templates: [
          'Tell me about a time when you had to lead a team through a difficult project for {jobPosition}.',
          'Describe a situation where you had to motivate team members who were struggling.',
          'Give me an example of how you handled a conflict between team members.'
        ],
        culturalAdaptations: {
          'id': 'Consider Indonesian values of gotong royong (mutual assistance) in your response.',
          'ms': 'Think about how you maintained harmony while exercising leadership.',
          'th': 'Consider how you balanced hierarchy respect with effective leadership.'
        },
        starRelevant: true
      },
      {
        category: 'problem-solving',
        type: 'behavioral',
        templates: [
          'Describe a complex problem you solved in your role as {jobPosition}.',
          'Tell me about a time when you had to find a creative solution under pressure.',
          'Walk me through your approach to troubleshooting technical issues.'
        ],
        culturalAdaptations: {
          'id': 'Explain how you involved others in the problem-solving process.',
          'ms': 'Describe how you balanced individual initiative with team consultation.',
          'th': 'Consider how you approached senior colleagues for guidance.'
        },
        starRelevant: true
      },
      {
        category: 'teamwork',
        type: 'behavioral',
        templates: [
          'Tell me about your most successful collaboration experience.',
          'Describe a time when you had to work with a difficult team member.',
          'Give me an example of how you contributed to team success.'
        ],
        culturalAdaptations: {
          'id': 'Focus on how you built consensus and maintained group harmony.',
          'ms': 'Describe how you built personal relationships within the team.',
          'th': 'Explain how you showed respect for different viewpoints.'
        },
        starRelevant: true
      }
    ];
  }

  /**
   * Select appropriate question category
   */
  private selectCategory(request: QuestionGenerationRequest): string {
    if (request.focusAreas.length > 0) {
      return request.focusAreas[request.questionNumber % request.focusAreas.length];
    }
    
    const categories = ['leadership', 'problem-solving', 'teamwork', 'communication'];
    return categories[request.questionNumber % categories.length];
  }

  /**
   * Get question template for category
   */
  private getQuestionTemplate(category: string, request: QuestionGenerationRequest): QuestionTemplate {
    return this.questionTemplates.find(t => t.category === category) || this.questionTemplates[0];
  }

  /**
   * Fill template with request data
   */
  private fillTemplate(template: QuestionTemplate, request: QuestionGenerationRequest): string {
    const templateText = template.templates[request.questionNumber % template.templates.length];
    return templateText.replace('{jobPosition}', request.jobPosition);
  }

  /**
   * Simple translation for fallback (basic implementation)
   */
  private translateQuestion(questionText: string, language: string): string {
    if (language === 'en') return questionText;
    
    // Basic translation templates for common interview questions
    const basicTranslations = {
      'id': {
        'Tell me about a time when you had to lead': 'Ceritakan tentang saat Anda harus memimpin',
        'Describe a situation where you had to motivate': 'Jelaskan situasi di mana Anda harus memotivasi',
        'Tell me about a time when you had to find': 'Ceritakan tentang saat Anda harus mencari',
        'Give me an example of how you handled': 'Berikan contoh bagaimana Anda menangani',
        'Describe a complex problem you solved': 'Jelaskan masalah kompleks yang Anda selesaikan',
        'Tell me about your most successful collaboration': 'Ceritakan tentang kolaborasi paling sukses Anda'
      },
      'ms': {
        'Tell me about a time when you had to lead': 'Beritahu saya tentang masa anda perlu memimpin',
        'Describe a situation where you had to motivate': 'Terangkan situasi di mana anda perlu memotivasikan',
        'Tell me about a time when you had to find': 'Beritahu saya tentang masa anda perlu mencari',
        'Give me an example of how you handled': 'Berikan contoh bagaimana anda mengendalikan',
        'Describe a complex problem you solved': 'Terangkan masalah kompleks yang anda selesaikan',
        'Tell me about your most successful collaboration': 'Beritahu saya tentang kerjasama paling berjaya anda'
      },
      'th': {
        'Tell me about a time when you had to lead': 'บอกฉันเกี่ยวกับช่วงที่คุณต้องนำ',
        'Describe a situation where you had to motivate': 'อธิบายสถานการณ์ที่คุณต้องจูงใจ',
        'Tell me about a time when you had to find': 'บอกฉันเกี่ยวกับช่วงที่คุณต้องหา',
        'Give me an example of how you handled': 'ยกตัวอย่างว่าคุณจัดการอย่างไร',
        'Describe a complex problem you solved': 'อธิบายปัญหาที่ซับซ้อนที่คุณแก้ไข',
        'Tell me about your most successful collaboration': 'บอกฉันเกี่ยวกับการร่วมมือที่ประสบความสำเร็จที่สุด'
      },
      'vi': {
        'Tell me about a time when you had to lead': 'Hãy kể cho tôi về lúc bạn phải lãnh đạo',
        'Describe a situation where you had to motivate': 'Mô tả tình huống mà bạn phải động viên',
        'Tell me about a time when you had to find': 'Hãy kể cho tôi về lúc bạn phải tìm',
        'Give me an example of how you handled': 'Cho tôi ví dụ về cách bạn xử lý',
        'Describe a complex problem you solved': 'Mô tả vấn đề phức tạp mà bạn đã giải quyết',
        'Tell me about your most successful collaboration': 'Hãy kể về sự hợp tác thành công nhất của bạn'
      },
      'tl': {
        'Tell me about a time when you had to lead': 'Ikwento mo sa akin ang panahon na kailangan mong manguna',
        'Describe a situation where you had to motivate': 'Ilarawan ang sitwasyon na kailangan mong mag-motivate',
        'Tell me about a time when you had to find': 'Ikwento mo sa akin ang panahon na kailangan mong maghanap',
        'Give me an example of how you handled': 'Magbigay ng halimbawa kung paano mo pinangasiwaan',
        'Describe a complex problem you solved': 'Ilarawan ang komplikadong problema na nalutas mo',
        'Tell me about your most successful collaboration': 'Ikwento ang inyong pinaka-matagumpay na pakikipagtulungan'
      }
    };

    const languageTranslations = basicTranslations[language as keyof typeof basicTranslations];
    if (languageTranslations) {
      // Find the closest matching translation
      for (const [englishPhrase, translation] of Object.entries(languageTranslations)) {
        if (questionText.includes(englishPhrase.split(' ').slice(0, 5).join(' '))) {
          return translation + questionText.slice(englishPhrase.length);
        }
      }
    }
    
    // If no specific translation found, return with language note
    return `${questionText} [Terjemahan ke ${language} tersedia]`;
  }

  /**
   * Get question type from category
   */
  private getQuestionType(category: string): 'behavioral' | 'situational' | 'technical' | 'cultural' {
    const typeMap: Record<string, any> = {
      'leadership': 'behavioral',
      'problem-solving': 'behavioral',
      'teamwork': 'behavioral',
      'technical': 'technical',
      'cultural': 'cultural'
    };
    
    return typeMap[category] || 'behavioral';
  }

  /**
   * Get expected answer time based on category and difficulty
   */
  private getExpectedTime(category: string, difficulty: string): number {
    const baseTime = 180; // 3 minutes
    const difficultyMultiplier = {
      'beginner': 0.8,
      'intermediate': 1.0,
      'advanced': 1.3
    };
    
    return Math.round(baseTime * (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0));
  }

  /**
   * Check if category is STAR method relevant
   */
  private isStarRelevant(category: string): boolean {
    const starCategories = ['leadership', 'problem-solving', 'teamwork', 'conflict-resolution'];
    return starCategories.includes(category);
  }

  /**
   * Extract category from text response
   */
  private extractCategory(response: string): string | null {
    const categories = ['leadership', 'problem-solving', 'teamwork', 'communication', 'technical'];
    return categories.find(cat => response.toLowerCase().includes(cat)) || null;
  }

  /**
   * Get language name for display
   */
  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'id': 'Indonesian',
      'ms': 'Malay',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tl': 'Filipino',
      'my': 'Myanmar',
      'km': 'Khmer',
      'lo': 'Lao',
      'jv': 'Javanese',
      'su': 'Sundanese'
    };
    
    return names[code] || 'English';
  }
}