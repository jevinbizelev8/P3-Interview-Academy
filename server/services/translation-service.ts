import { sealionService } from './sealion';

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
      const translationPrompt = `Translate the following English text to ${this.getLanguageName(targetLanguage)}.
      
      Requirements:
      - Provide ONLY the translated text, no explanations
      - Maintain professional interview context
      - Keep technical terms accurate
      - Preserve formatting and structure
      
      English text: "${content}"
      
      ${this.getLanguageInstruction(targetLanguage)}`;

      const translatedContent = await sealionService.generateResponse({
        messages: [
          { role: 'user', content: translationPrompt }
        ],
        maxTokens: 800,
        temperature: 0.3,
        language: targetLanguage
      });

      return {
        original: content,
        translated: translatedContent.trim(),
        language: targetLanguage
      };

    } catch (error) {
      console.error('Translation error:', error);
      // Return original content if translation fails
      return {
        original: content,
        translated: content + ` [Translation to ${this.getLanguageName(targetLanguage)} unavailable]`,
        language: targetLanguage
      };
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
      // Combine content for efficient batch translation
      const combinedContent = contents.join('\n---SEPARATOR---\n');
      const batchTranslation = await this.translateContent(combinedContent, targetLanguage);
      
      const translatedParts = batchTranslation.translated.split('\n---SEPARATOR---\n');
      
      return contents.map((original, index) => ({
        original,
        translated: translatedParts[index] || original,
        language: targetLanguage
      }));

    } catch (error) {
      console.error('Batch translation error:', error);
      return contents.map(content => ({
        original: content,
        translated: content,
        language: targetLanguage
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
      'my': 'Myanmar language (မြန်မာဘာသာ)',
      'km': 'Khmer language (ភាសាខ្មែរ)',
      'lo': 'Lao language (ພາສາລາວ)',
      'zh-sg': 'Simplified Chinese (简体中文)',
      'en': 'English'
    };
    return languageNames[code as keyof typeof languageNames] || 'the target language';
  }

  private getLanguageInstruction(language: string): string {
    const instructions = {
      'ms': 'Terjemahkan ke Bahasa Malaysia yang standard dan profesional.',
      'id': 'Terjemahkan ke Bahasa Indonesia yang baku dan profesional.',
      'th': 'แปลเป็นภาษาไทยที่เป็นทางการและเหมาะสมสำหรับการสัมภาษณ์งาน',
      'vi': 'Dịch sang tiếng Việt chuyên nghiệp và phù hợp với bối cảnh phỏng vấn việc làm.',
      'fil': 'Isalin sa wikang Filipino na propesyonal at angkop sa interview.',
      'my': 'မြန်မာဘာသာသို့ ပရော်ဖက်ရှင်နယ်စွာ ဘာသာပြန်ပါ။',
      'km': 'បកប្រែជាភាសាខ្មែរដែលមានលក្ខណៈវិជ្ជាជីវៈ។',
      'lo': 'ແປເປັນພາສາລາວທີ່ມີວິຊາຊີບ.',
      'zh-sg': '翻译成专业的简体中文，适合面试场合使用。',
      'en': 'Respond in English.'
    };
    return instructions[language as keyof typeof instructions] || instructions['en'];
  }
}

// Export singleton instance
export const translationService = new TranslationService();