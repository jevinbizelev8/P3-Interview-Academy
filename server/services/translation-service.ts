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
      // Try SeaLion first for ASEAN languages
      let translatedContent: string;
      
      try {
        translatedContent = await sealionService.generateResponse({
          messages: [
            { role: 'user', content: `Translate this to ${this.getLanguageName(targetLanguage)} (provide only the translation): "${content}"` }
          ],
          maxTokens: 100,
          temperature: 0.0,
          language: targetLanguage
        });
        
        console.log(`✅ SeaLion translation success for ${targetLanguage}`);
        
      } catch (sealionError) {
        console.log(`⚠️ SeaLion failed, falling back to OpenAI for ${targetLanguage}:`, sealionError.message);
        
        // Fallback to OpenAI
        const { aiRouter } = await import('./ai-router');
        translatedContent = await aiRouter.generateResponse({
          messages: [
            { role: 'system', content: `Translate to ${this.getLanguageName(targetLanguage)}. Provide only the translation.` },
            { role: 'user', content: `Translate: "${content}"` }
          ],
          maxTokens: 200,
          temperature: 0.0,
          language: 'en' // Force OpenAI to use English routing
        });
      }

      // Clean the translation to remove any reasoning or explanations
      let cleanTranslation = translatedContent.trim();
      
      // Extremely aggressive cleaning - remove all AI reasoning
      cleanTranslation = cleanTranslation
        .replace(/^.*?(?:provide only the translation|i should use|appropriate|terms like|customer|resolve|menyelesaikan|cause|solution-oriented|would be good).*$/gim, '')
        .replace(/^.*?(?:but i should check|let me|i need|understanding|translate|translation|requirements).*$/gim, '')
        .replace(/^.*?(?:start by|carefully|first|original text|maintaining).*$/gim, '')
        .replace(/^.*?(?:english|professional tone|correct term|job contexts|formal language).*$/gim, '')
        .replace(/^\s*["']?/, '')  // Remove starting quotes
        .replace(/["']?\s*$/, '')  // Remove ending quotes
        .replace(/\n\n+/g, ' ')   // Remove extra newlines
        .trim();
      
      // If it's still all in English or contains reasoning, try to extract Malaysian content
      if (cleanTranslation.toLowerCase().includes('should use') || cleanTranslation.toLowerCase().includes('appropriate') || cleanTranslation.toLowerCase().includes('terms like')) {
        // Last resort: Use fallback to OpenAI immediately
        throw new Error('SeaLion output contains reasoning - fallback to OpenAI');
      }
      
      // Extract only text before reasoning starts (case insensitive)
      const reasoningMarkers = ['But I should', 'Let me check', 'In Malaysian', 'I should check', 'Baik, saya perlu', 'soalan asalnya'];
      for (const marker of reasoningMarkers) {
        const markerIndex = cleanTranslation.toLowerCase().indexOf(marker.toLowerCase());
        if (markerIndex > 0) {
          cleanTranslation = cleanTranslation.slice(0, markerIndex).trim();
          break;
        }
      }
      
      // Remove any remaining quotes at the end
      cleanTranslation = cleanTranslation.replace(/["']?\s*$/, '').trim();
      
      // If translation is still full of reasoning, extract actual Bahasa Malaysia content
      if (cleanTranslation.includes('user wants') || cleanTranslation.includes('translate') || cleanTranslation.includes('requirements')) {
        // Find the first occurrence of Bahasa Malaysia words/patterns
        const malayPatterns = [
          /selamat datang[^.!?]*[.!?]/i,
          /terima kasih[^.!?]*[.!?]/i,
          /anda[^.!?]*[.!?]/i,
          /untuk[^.!?]*[.!?]/i,
        ];
        
        let extractedTranslation = '';
        for (const pattern of malayPatterns) {
          const match = cleanTranslation.match(pattern);
          if (match) {
            extractedTranslation = match[0].trim();
            
            // Try to extend to get more context
            const startIndex = cleanTranslation.indexOf(match[0]);
            const remainingText = cleanTranslation.slice(startIndex);
            const sentences = remainingText.split(/[.!?]/);
            if (sentences.length > 1) {
              extractedTranslation = sentences.slice(0, Math.min(2, sentences.length)).join('.') + '.';
            }
            break;
          }
        }
        
        if (extractedTranslation) {
          cleanTranslation = extractedTranslation;
        } else {
          // Last resort: use original with translation note
          cleanTranslation = `${content}\n[Terjemahan: Teks dalam Bahasa Malaysia tidak tersedia]`;
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