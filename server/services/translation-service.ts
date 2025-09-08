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
      // Use a very simple and direct translation prompt
      const simplePrompt = `Translate to ${this.getLanguageName(targetLanguage)}: "${content}"`;

      const translatedContent = await sealionService.generateResponse({
        messages: [
          { 
            role: 'system', 
            content: `You are a professional translator. CRITICAL RULES:
1. Output ONLY the ${this.getLanguageName(targetLanguage)} translation
2. NO thinking process, reasoning, or explanations
3. NO <think> tags or analysis
4. NO English words in your response
5. Just the direct translation, nothing else` 
          },
          { role: 'user', content: simplePrompt }
        ],
        maxTokens: 300,
        temperature: 0,
        language: targetLanguage
      });

      // Enhanced cleaning to remove AI thinking process and unwanted content
      let cleanTranslation = translatedContent.trim();
      
      // Remove AI thinking/reasoning tags and content (the main issue you reported)
      cleanTranslation = this.removeAIThinkingProcess(cleanTranslation);
      
      // Remove common AI prefixes if they exist
      const prefixesToRemove = [
        'Translation:',
        'Translated:',
        'In Bahasa Malaysia:',
        'Bahasa Malaysia translation:',
        'Here is the translation:',
        'Translation is:',
        'The translation is:',
        'Terjemahan:',
        'Here\'s the translation:',
        'Okay, the user wants the translation of',
        'I need to recall the common translations for',
        'First, I',
        'Let me',
        'I should'
      ];
      
      for (const prefix of prefixesToRemove) {
        if (cleanTranslation.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleanTranslation = cleanTranslation.substring(prefix.length).trim();
          break;
        }
      }
      
      // Remove quotes if the entire response is wrapped in them
      if ((cleanTranslation.startsWith('"') && cleanTranslation.endsWith('"')) ||
          (cleanTranslation.startsWith("'") && cleanTranslation.endsWith("'"))) {
        cleanTranslation = cleanTranslation.slice(1, -1).trim();
      }
      
      // Additional cleaning for truncated content
      cleanTranslation = this.cleanTruncatedContent(cleanTranslation);

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
}

// Export singleton instance
export const translationService = new TranslationService();