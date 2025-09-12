import { sealionService } from './sealion';
import { openaiService } from './openai-service';

interface TranslationResponse {
  original: string;
  translated: string;
  language: string;
}

export class TranslationService {
  
  /**
   * Translate English content to ASEAN languages using SeaLion
   */
  async translateContent(
    content: string, 
    targetLanguage: string
  ): Promise<TranslationResponse> {
    if (targetLanguage === 'en' || !content.trim()) {
      return {
        original: content,
        translated: content,
        language: targetLanguage
      };
    }

    try {
      // Ultra-minimal directive prompt - no personality, no reasoning allowed
      const translatedContent = await sealionService.generateResponse({
        messages: [
          { 
            role: 'system', 
            content: `Translate to ${this.getLanguageDisplayName(targetLanguage)}. Rules:
- Output ONLY the direct translation
- NO explanations, reasoning, or thinking process
- NO "Okay", "Let me", "The user", "I need to", "First"
- NO additional context or cultural notes

Example:
Input: "What is your name?"
Output: ${this.getTranslationExample(targetLanguage)}`
          },
          { role: 'user', content: content }
        ],
        maxTokens: 150, // Reduced to prevent verbose responses
        temperature: 0,
        language: targetLanguage
      });

      // Validate response doesn't contain reasoning/explanations
      if (this.containsReasoning(translatedContent)) {
        console.warn(`⚠️ SeaLion returned reasoning instead of clean translation: "${translatedContent.substring(0, 100)}..."`);
        // Force retry with even more constrained prompt
        throw new Error('Response contains reasoning - retry needed');
      }

      // Use bulletproof extraction method
      const cleanTranslation = this.extractCleanTranslation(translatedContent, targetLanguage);

      return {
        original: content,
        translated: cleanTranslation,
        language: targetLanguage
      };

    } catch (error) {
      console.error('❌ SeaLion translation failed:', error);
      console.log('🔄 Attempting OpenAI fallback for translation...');
      
      try {
        // Try OpenAI as ultimate fallback for translation
        if (!openaiService) {
          throw new Error('OpenAI service not available');
        }
        
        const openaiTranslation = await openaiService.generateResponse({
          messages: [
            {
              role: 'system',
              content: `You are a translation service. Translate the following text to ${this.getLanguageName(targetLanguage)}. Respond ONLY with the translation, no explanations.`
            },
            {
              role: 'user',
              content: `Translate to ${this.getLanguageName(targetLanguage)}: "${content}"`
            }
          ],
          maxTokens: 150,
          temperature: 0
        });
        
        console.log('✅ OpenAI fallback translation successful');
        return {
          original: content,
          translated: openaiTranslation.trim(),
          language: targetLanguage
        };
        
      } catch (openaiError) {
        console.error('❌ OpenAI fallback also failed:', openaiError);
        // Return original content if both services fail
        return {
          original: content,
          translated: content + ` [Translation to ${this.getLanguageName(targetLanguage)} unavailable]`,
          language: targetLanguage
        };
      }
    }
  }

  /**
   * Batch translate multiple content pieces
   */
  async translateBatch(
    contents: string[], 
    targetLanguage: string
  ): Promise<TranslationResponse[]> {
    if (targetLanguage === 'en') {
      return contents.map(content => ({
        original: content,
        translated: content,
        language: targetLanguage
      }));
    }

    try {
      // For better accuracy, translate individually rather than combining
      const translations = await Promise.all(
        contents.map(content => this.translateContent(content, targetLanguage))
      );
      
      return translations;

    } catch (error) {
      console.error('Batch translation error:', error);
      return contents.map(content => ({
        original: content,
        translated: content + ' [Translation unavailable]',
        language: targetLanguage
      }));
    }
  }

  /**
   * Translate a set of question objects while preserving structure
   */
  async translateQuestionSet(
    questions: any[], 
    targetLanguage: string
  ): Promise<any[]> {
    if (targetLanguage === 'en') {
      return questions;
    }

    console.log(`🔄 Translating ${questions.length} questions to ${targetLanguage}`);
    
    try {
      const translatedQuestions = await Promise.all(
        questions.map(async (question) => {
          // Create a copy to avoid mutating original
          let translatedQuestion = { ...question };
          
          // Translate the main question text
          if (question.question) {
            const questionTranslation = await this.translateContent(question.question, targetLanguage);
            translatedQuestion.question = questionTranslation.translated;
          }
          
          // Translate cultural context if present
          if (question.culturalContext) {
            const contextTranslation = await this.translateContent(question.culturalContext, targetLanguage);
            translatedQuestion.culturalContext = contextTranslation.translated;
          }
          
          // Keep metadata in English for consistency
          // (id, category, difficulty, interviewStage, tags, etc. remain unchanged)
          
          // Apply format validation and consistency checks
          translatedQuestion = this.ensureConsistentFormat(question, translatedQuestion, targetLanguage);
          
          return translatedQuestion;
        })
      );

      console.log(`✅ Successfully translated ${translatedQuestions.length} questions to ${targetLanguage}`);
      return translatedQuestions;

    } catch (error) {
      console.error(`❌ Error translating question set to ${targetLanguage}:`, error);
      
      // Fallback: return original questions with translation unavailable notice
      return questions.map(question => ({
        ...question,
        question: question.question + ` [${this.getLanguageName(targetLanguage)} translation unavailable]`
      }));
    }
  }

  private getLanguageName(code: string): string {
    const languageNames = {
      'ms': 'Bahasa Malaysia',
      'id': 'Bahasa Indonesia', 
      'th': 'Thai language (ภาษาไทย)',
      'vi': 'Vietnamese (Tiếng Việt)',
      'fil': 'Filipino language',
      'zh-sg': 'Simplified Chinese (简体中文)',
      'en': 'English'
    };
    return languageNames[code as keyof typeof languageNames] || 'the target language';
  }

  private getLanguageDisplayName(code: string): string {
    const languageNames = {
      'ms': 'Bahasa Malaysia',
      'id': 'Bahasa Indonesia',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'fil': 'Filipino',
      'zh-sg': 'Chinese',
      'en': 'English'
    };
    return languageNames[code as keyof typeof languageNames] || code.toUpperCase();
  }

  private getTranslationExample(code: string): string {
    const examples = {
      'ms': 'Siapakah nama anda?',
      'id': 'Siapa nama Anda?',
      'th': 'คุณชื่ออะไร?',
      'vi': 'Tên bạn là gì?',
      'fil': 'Ano ang pangalan mo?',
      'zh-sg': '你叫什么名字？',
      'en': 'What is your name?'
    };
    return examples[code as keyof typeof examples] || 'Translation example';
  }

  /**
   * Detect if response contains reasoning/explanations instead of clean translation
   */
  private containsReasoning(content: string): boolean {
    const reasoningPatterns = [
      /^Okay,/i,
      /^Let me/i,
      /^I need to/i,
      /^I will/i,
      /^The user/i,
      /^First,/i,
      /^Based on/i,
      /^In.*culture/i,
      /translation.*means/i,
      /appropriate.*response/i,
      /should.*consider/i,
      /better.*phrase/i,
      /more.*suitable/i,
      /cultural.*context/i
    ];

    return reasoningPatterns.some(pattern => pattern.test(content.trim()));
  }

  private getLanguageInstruction(language: string): string {
    const instructions = {
      'ms': 'Berikan terjemahan dalam Bahasa Malaysia sahaja.',
      'id': 'Berikan terjemahan dalam Bahasa Indonesia saja.',
      'th': 'ให้คำแปลเป็นภาษาไทยเท่านั้น',
      'vi': 'Chỉ cung cấp bản dịch tiếng Việt.',
      'fil': 'Magbigay ng salin sa Filipino lamang.',
      'my': 'မြန်မာဘာသာဖြင့်သာ ဘာသာပြန်ပါ။',
      'km': 'ផ្តល់តែការបកប្រែជាភាសាខ្មែរប៉ុណ្ណោះ។',
      'lo': 'ໃຫ້ແຕ່ການແປພາສາລາວເທົ່ານັ້ນ.',
      'zh-sg': '只提供中文翻译。',
      'en': 'Respond in English only.'
    };
    return instructions[language as keyof typeof instructions] || instructions['en'];
  }

  /**
   * Remove AI thinking process tags and content
   */
  private removeAIThinkingProcess(content: string): string {
    // Remove <think> tags and their content
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove <thinking> tags and their content  
    content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Remove reasoning markers and explanations
    content = content.replace(/\[Thinking:[\s\S]*?\]/gi, '');
    content = content.replace(/\[Reasoning:[\s\S]*?\]/gi, '');
    
    // Remove everything from "Okay, the user wants" up until the final result
    // This is the main pattern causing issues in your screenshots
    content = content.replace(/Okay, the user wants[\s\S]*?\n\n([^Okay]*?)$/gi, '$1');
    
    // Remove common AI reasoning patterns - more aggressive
    const reasoningPatterns = [
      /^Okay, the user wants[\s\S]*?(?=\n[A-Z])/gim,
      /^First, I[\s\S]*?(?=\n[A-Z])/gim,
      /^Let me[\s\S]*?(?=\n[A-Z])/gim,
      /^I need to[\s\S]*?(?=\n[A-Z])/gim,
      /^I should[\s\S]*?(?=\n[A-Z])/gim,
      /In [A-Za-z\s]+, (direct translations|the term commonly used)[\s\S]*?(?=\n[A-Z])/gim,
      /Double-checking[\s\S]*?(?=\n[A-Z])/gim,
      /Final translation:[\s\S]*?(?=\")/gi
    ];
    
    for (const pattern of reasoningPatterns) {
      content = content.replace(pattern, '');
    }
    
    // Extract just the final translated line if reasoning is still present
    const lines = content.split('\n');
    const lastNonEmptyLine = lines.filter(line => line.trim()).pop();
    
    // If content still has reasoning patterns, try to extract just the translation
    if (content.includes('Okay, the user wants') || content.includes('Let me') || content.includes('First, I')) {
      // Look for the actual translation at the end - it's usually the shortest, meaningful line
      const lines = content.split('\n').filter(line => line.trim());
      
      // The translation is typically the last line that doesn't contain reasoning words
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        // Skip lines that contain reasoning markers
        if (!line.includes('Okay, the user') && 
            !line.includes('Let me') && 
            !line.includes('First, I') && 
            !line.includes('In Bahasa') &&
            !line.includes('translation') &&
            !line.includes('context') &&
            !line.includes('should') &&
            !line.includes('need to') &&
            line.length < 150 &&
            line.length > 3) {
          return line.replace(/^"|"$/g, '').trim(); // Remove quotes if present
        }
      }
      
      // Last resort: look for common Malaysian/Indonesian patterns
      const translationMatch = content.match(/([A-Za-z\s]*(?:anda|kamu|dalam|untuk|dengan|yang|ini|itu|menonjol|ceritakan|apa|kelebihan|tentang)[A-Za-z\s]*[.?!]?)/gi);
      if (translationMatch && translationMatch.length > 0) {
        return translationMatch[translationMatch.length - 1].trim();
      }
    }
    
    return content.trim();
  }

  /**
   * Bulletproof extraction method for clean translations from verbose SeaLion responses
   */
  private extractCleanTranslation(content: string, targetLanguage: string): string {
    console.log(`🔍 Extracting translation for ${targetLanguage}, original length: ${content.length}`);
    
    let cleaned = content.trim();
    
    // Strategy 1: Remove common verbose patterns first
    const verbosePatterns = [
      /^Okay, the user wants[\s\S]*?(?=\n[A-Z\u00C0-\u017F\u0100-\u017F])/gim, // Remove "Okay, the user wants..." until capital letter
      /^First, I[\s\S]*?(?=\n[A-Z\u00C0-\u017F\u0100-\u017F])/gim,
      /^Let me[\s\S]*?(?=\n[A-Z\u00C0-\u017F\u0100-\u017F])/gim,
      /^I need to[\s\S]*?(?=\n[A-Z\u00C0-\u017F\u0100-\u017F])/gim,
      /<think>[\s\S]*?<\/think>/gi,
      /<thinking>[\s\S]*?<\/thinking>/gi
    ];
    
    for (const pattern of verbosePatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // Strategy 2: If still verbose, extract using line-by-line approach
    if (cleaned.includes('Okay, the user') || cleaned.includes('translation') || cleaned.length > 150) {
      console.log('🔍 Applying line-by-line extraction');
      
      const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const targetLanguageWords = this.getTargetLanguageWords(targetLanguage);
      
      // Find the best translation line (reverse order, shortest valid line wins)
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Skip obviously wrong lines
        if (this.isReasoningLine(line)) continue;
        
        // Check if line contains target language words
        const hasTargetWords = targetLanguageWords.some(word => 
          line.toLowerCase().includes(word.toLowerCase())
        );
        
        // Good translation characteristics
        const isGoodLength = line.length >= 3 && line.length <= 100;
        const hasMinimalEnglishWords = this.countEnglishWords(line) < 3;
        
        if (hasTargetWords && isGoodLength && hasMinimalEnglishWords) {
          console.log(`✅ Found clean translation: "${line}"`);
          return this.finalCleanup(line);
        }
      }
    }
    
    // Strategy 3: Pattern matching for specific formats
    const patterns = [
      // Extract quoted translations
      /"([^"]{3,100})"/g,
      /'([^']{3,100})'/g,
      // Extract after "Translation:" or similar
      /(?:Translation|Terjemahan|翻译):\s*(.{3,100}?)(?:\n|$)/gi,
      // Extract standalone sentences with target language
      /([A-Z\u00C0-\u017F][\w\s\u00C0-\u017F]{2,99}[.!?]?)/g
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(cleaned.matchAll(pattern));
      const targetLanguageWords = this.getTargetLanguageWords(targetLanguage);
      
      for (const match of matches.reverse()) { // Check from end
        const candidate = match[1] || match[0];
        const hasTargetWords = targetLanguageWords.some(word => 
          candidate.toLowerCase().includes(word.toLowerCase())
        );
        
        if (hasTargetWords && candidate.length <= 100 && !this.isReasoningLine(candidate)) {
          console.log(`✅ Pattern matched translation: "${candidate}"`);
          return this.finalCleanup(candidate);
        }
      }
    }
    
    // Strategy 4: Emergency fallback - find shortest meaningful content
    const lines = cleaned.split(/[.\n]+/).map(line => line.trim()).filter(line => line.length > 2);
    const shortestMeaningful = lines.reduce((shortest, current) => {
      if (current.length < (shortest?.length || Infinity) && 
          current.length >= 3 && 
          current.length <= 100 &&
          !this.isReasoningLine(current)) {
        return current;
      }
      return shortest;
    }, undefined as string | undefined);
    
    if (shortestMeaningful) {
      console.log(`⚠️ Emergency fallback used: "${shortestMeaningful}"`);
      return this.finalCleanup(shortestMeaningful);
    }
    
    console.log(`❌ All extraction strategies failed, returning cleaned content`);
    return this.finalCleanup(cleaned);
  }
  
  /**
   * Check if a line contains reasoning/thinking patterns
   */
  private isReasoningLine(line: string): boolean {
    const reasoningIndicators = [
      'okay, the user', 'let me', 'first, i', 'i need to', 'i should',
      'translation', 'context', 'user wants', 'appropriate', 'business',
      'professional', 'malaysia', 'indonesia', 'southeast', 'language',
      'think', 'consider', 'recall', 'understand', 'analyze'
    ];
    
    const lowerLine = line.toLowerCase();
    return reasoningIndicators.some(indicator => lowerLine.includes(indicator)) ||
           line.length > 150;
  }
  
  /**
   * Count English words in a string
   */
  private countEnglishWords(text: string): number {
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 'from', 'as', 'be', 'have', 'this', 'that', 'you', 'are', 'will', 'can', 'should', 'would', 'could'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => englishWords.includes(word)).length;
  }
  
  /**
   * Get common words for target language detection
   */
  private getTargetLanguageWords(targetLanguage: string): string[] {
    const languageWords = {
      'ms': ['anda', 'dalam', 'untuk', 'dengan', 'yang', 'ini', 'itu', 'adalah', 'akan', 'dapat', 'boleh', 'saya', 'kita', 'mereka', 'dia'],
      'id': ['anda', 'dalam', 'untuk', 'dengan', 'yang', 'ini', 'itu', 'adalah', 'akan', 'dapat', 'saya', 'kita', 'mereka', 'dia', 'dari'],
      'th': ['ใน', 'และ', 'ที่', 'เป็น', 'มี', 'จะ', 'ได้', 'ไม่', 'แล้ว', 'ของ', 'กับ', 'ก็', 'ให้', 'มา', 'ไป'],
      'vi': ['trong', 'và', 'của', 'là', 'có', 'được', 'một', 'tôi', 'bạn', 'họ', 'chúng', 'với', 'để', 'sẽ', 'đã'],
      'fil': ['sa', 'ng', 'at', 'na', 'ang', 'para', 'mga', 'ako', 'ikaw', 'sila', 'ito', 'iyan', 'may', 'hindi', 'kung'],
      'my': ['တွင်', 'နှင့်', 'သည်', 'ဖြစ်', 'မည်', 'ရှိ', 'လုပ်', 'ငါ', 'သင်', 'သူ', 'ဤ', 'ထို', 'များ', 'မ', 'ကို'],
      'km': ['ក្នុង', 'និង', 'នេះ', 'នោះ', 'ជា', 'មាន', 'បាន', 'ខ្ញុំ', 'អ្នក', 'គាត់', 'ពួកគេ', 'ដើម្បី', 'ទៅ', 'មក', 'ផង'],
      'lo': ['ໃນ', 'ແລະ', 'ທີ່', 'ເປັນ', 'ມີ', 'ໄດ້', 'ຈະ', 'ຂ້ອຍ', 'ເຈົ້າ', 'ເຂົາ', 'ນີ້', 'ນັ້ນ', 'ກັບ', 'ໄປ', 'ມາ'],
      'zh-sg': ['的', '是', '在', '了', '有', '和', '就', '不', '这', '那', '我', '你', '他', '她', '它', '我们', '你们', '他们']
    };
    
    return languageWords[targetLanguage as keyof typeof languageWords] || [];
  }
  
  /**
   * Final cleanup of extracted translation
   */
  private finalCleanup(text: string): string {
    return text
      .replace(/^["']+|["']+$/g, '') // Remove surrounding quotes
      .replace(/^[:\-\s]+|[:\-\s]+$/g, '') // Remove colons, dashes, spaces
      .replace(/^(Translation|Terjemahan|翻译):\s*/gi, '') // Remove translation labels
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Clean truncated or incomplete content
   */
  private cleanTruncatedContent(content: string): string {
    // Remove incomplete sentences at the end
    content = content.replace(/\.\s*[^.]*$/, '.');
    
    // Handle specific truncation markers
    if (content.endsWith('...') || content.endsWith('…')) {
      // Find the last complete sentence
      const lastPeriod = content.lastIndexOf('.', content.length - 4);
      if (lastPeriod > 0) {
        content = content.substring(0, lastPeriod + 1);
      }
    }
    
    // Remove "null" at the end if it appears
    if (content.trim().endsWith('null')) {
      content = content.replace(/\s*null\s*$/, '').trim();
    }
    
    return content;
  }

  /**
   * Validate and ensure translated question maintains consistent format
   */
  ensureConsistentFormat(originalQuestion: any, translatedQuestion: any, targetLanguage: string): any {
    console.log(`🔍 Validating format consistency for question ${originalQuestion.id} in ${targetLanguage}`);
    
    const validatedQuestion = { ...translatedQuestion };
    
    // 1. Preserve all metadata fields from original
    const metadataFields = ['id', 'category', 'difficulty', 'interviewStage', 'tags', 'expectedAnswerTime', 'starMethodRelevant', 'industrySpecific'];
    metadataFields.forEach(field => {
      if (originalQuestion[field] !== undefined) {
        validatedQuestion[field] = originalQuestion[field];
      }
    });
    
    // 2. Validate required fields exist
    const requiredFields = ['question', 'category', 'difficulty', 'interviewStage'];
    for (const field of requiredFields) {
      if (!validatedQuestion[field]) {
        console.warn(`⚠️ Missing required field '${field}' in translated question, using original`);
        validatedQuestion[field] = originalQuestion[field];
      }
    }
    
    // 3. Validate question content is not empty or suspiciously short
    if (!validatedQuestion.question || validatedQuestion.question.length < 10) {
      console.warn(`⚠️ Translated question seems invalid or too short, using original`);
      validatedQuestion.question = originalQuestion.question + ` [${this.getLanguageName(targetLanguage)} translation failed]`;
    }
    
    // 4. Ensure arrays remain arrays
    if (originalQuestion.tags && Array.isArray(originalQuestion.tags)) {
      if (!Array.isArray(validatedQuestion.tags)) {
        validatedQuestion.tags = originalQuestion.tags;
      }
    }
    
    // 5. Validate boolean fields
    if (typeof originalQuestion.starMethodRelevant === 'boolean') {
      validatedQuestion.starMethodRelevant = originalQuestion.starMethodRelevant;
    }
    
    // 6. Validate numeric fields
    if (typeof originalQuestion.expectedAnswerTime === 'number') {
      validatedQuestion.expectedAnswerTime = originalQuestion.expectedAnswerTime;
    }
    
    // 7. Add translation metadata
    validatedQuestion.translatedFrom = 'en';
    validatedQuestion.targetLanguage = targetLanguage;
    validatedQuestion.translatedAt = new Date().toISOString();
    
    console.log(`✅ Format validation completed for question ${originalQuestion.id}`);
    return validatedQuestion;
  }
}

// Export singleton instance
export const translationService = new TranslationService();