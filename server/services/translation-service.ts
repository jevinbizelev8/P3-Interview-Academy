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
      const translationPrompt = `Translate this English interview coaching text to ${this.getLanguageName(targetLanguage)}:

"${content}"

Requirements:
- ONLY provide the direct translation
- NO explanations, reasoning, or commentary
- Keep professional interview tone
- Preserve technical terms like "STAR method"
- Maintain original formatting

${this.getLanguageInstruction(targetLanguage)}`;

      const translatedContent = await sealionService.generateResponse({
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional translator. Provide ONLY direct translations without any explanations, reasoning, or commentary.' 
          },
          { role: 'user', content: translationPrompt }
        ],
        maxTokens: 500,
        temperature: 0.1,
        language: targetLanguage
      });

      // Clean the translation by extracting only the translated content
      let cleanTranslation = translatedContent.trim();
      
      // If the response contains reasoning, try to extract just the translation
      const patterns = [
        /(?:translation[:\s]*["']?([^"'\n]+)["']?)/i,
        /(?:translating[:\s]*["']?([^"'\n]+)["']?)/i,
        /(?:in bahasa malaysia[:\s]*["']?([^"'\n]+)["']?)/i,
        /(?:translation is[:\s]*["']?([^"'\n]+)["']?)/i
      ];
      
      for (const pattern of patterns) {
        const match = cleanTranslation.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          cleanTranslation = match[1].trim();
          break;
        }
      }
      
      // Fallback: If translation is still full of reasoning, use a shorter approach
      if (cleanTranslation.includes('requirements') || cleanTranslation.includes('translate') || cleanTranslation.length > content.length * 3) {
        // Try to find the actual translation content after common phrases
        const startIndicators = ['selamat datang', 'welcome', content.slice(0, 20).toLowerCase()];
        for (const indicator of startIndicators) {
          const startIndex = cleanTranslation.toLowerCase().indexOf(indicator);
          if (startIndex > 0) {
            cleanTranslation = cleanTranslation.slice(startIndex);
            // Find end of sentence or reasonable stopping point
            const endMatch = cleanTranslation.match(/[.!?]\s|$/);
            if (endMatch) {
              cleanTranslation = cleanTranslation.slice(0, endMatch.index + 1);
            }
            break;
          }
        }
      }

      return {
        original: content,
        translated: cleanTranslation,
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
}

// Export singleton instance
export const translationService = new TranslationService();