// Test endpoints for SeaLion integration testing

import { Router, Request, Response } from 'express';
import { SeaLionService } from './services/sealion.js';
import { AIQuestionGenerator } from './services/ai-question-generator.js';

const router = Router();

// Test endpoint for SeaLion response filtering
router.post('/api/test-sealion-response', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing SeaLion response filtering...');
    
    const sealionService = new SeaLionService();
    
    const testPrompt = `You are an AI interview coach. Generate a behavioral interview question for a Software Engineer position.

Think about this carefully:
- The candidate needs technical assessment  
- Consider STAR method relevance
- Make it challenging but fair

Response Format (JSON):
{
  "questionText": "Your question here",
  "questionCategory": "technical",
  "starMethodRelevant": true
}`;

    const response = await sealionService.generateResponse({
      messages: [{ role: 'user', content: testPrompt }],
      maxTokens: 1000,
      temperature: 0.7
    });
    
    // Check if response contains thinking process
    const hasThinkingTags = response.includes('<thinking>') || response.includes('</thinking>');
    const hasThinkingPatterns = /(?:think about|let me think|thinking|consider|i need to)/i.test(response);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const parsedJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    
    const testResult = {
      success: true,
      hasThinkingTags,
      hasThinkingPatterns,
      responseLength: response.length,
      hasValidJson: !!parsedJson,
      extractedQuestion: parsedJson?.questionText || null,
      fullResponse: response.substring(0, 200) + '...', // Truncated for safety
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Response analysis:', {
      hasThinkingTags,
      hasThinkingPatterns,
      hasValidJson: testResult.hasValidJson,
      responsePreview: response.substring(0, 100)
    });
    
    res.json(testResult);
    
  } catch (error) {
    console.error('❌ SeaLion test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for question generation
router.post('/api/test-question-generation', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing question generation...');
    
    const generator = new AIQuestionGenerator();
    
    const testRequest = {
      jobPosition: req.body.jobPosition || 'Software Engineer',
      companyName: req.body.companyName || 'Tech Company',
      interviewStage: req.body.interviewStage || 'behavioral',
      experienceLevel: req.body.experienceLevel || 'mid-level',
      preferredLanguage: req.body.preferredLanguage || 'en',
      difficultyLevel: req.body.difficultyLevel || 'intermediate',
      focusAreas: req.body.focusAreas || ['problem-solving'],
      questionCategories: req.body.questionCategories || ['behavioral'],
      questionNumber: req.body.questionNumber || 1
    };
    
    const startTime = Date.now();
    const question = await generator.generateQuestion(testRequest);
    const generationTime = Date.now() - startTime;
    
    const testResult = {
      success: true,
      generationTimeMs: generationTime,
      question: {
        text: question.questionText,
        category: question.questionCategory,
        type: question.questionType,
        difficulty: question.difficultyLevel,
        culturalContext: question.culturalContext?.substring(0, 100) + '...',
        hasTranslation: !!question.questionTextTranslated,
        generatedBy: question.generatedBy,
        starRelevant: question.starMethodRelevant
      },
      request: testRequest,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Question generated:', {
      category: question.questionCategory,
      generatedBy: question.generatedBy,
      timeMs: generationTime
    });
    
    res.json(testResult);
    
  } catch (error) {
    console.error('❌ Question generation test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for fallback mechanism
router.post('/api/test-fallback', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing fallback mechanism...');
    
    // Temporarily disable SeaLion by modifying the service
    const originalApiKey = process.env.SEA_LION_API_KEY;
    process.env.SEA_LION_API_KEY = 'invalid-test-key';
    
    const generator = new AIQuestionGenerator();
    
    const testRequest = {
      jobPosition: 'Marketing Manager',
      interviewStage: 'behavioral', 
      experienceLevel: 'senior',
      preferredLanguage: 'en',
      difficultyLevel: 'advanced',
      focusAreas: ['leadership'],
      questionCategories: ['behavioral'],
      questionNumber: 1
    };
    
    const startTime = Date.now();
    const question = await generator.generateQuestion(testRequest);
    const generationTime = Date.now() - startTime;
    
    // Restore original API key
    process.env.SEA_LION_API_KEY = originalApiKey;
    
    const testResult = {
      success: true,
      fallbackTriggered: question.generatedBy === 'fallback',
      generationTimeMs: generationTime,
      question: {
        text: question.questionText,
        category: question.questionCategory,
        generatedBy: question.generatedBy
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🔄 Fallback test:', {
      triggered: testResult.fallbackTriggered,
      timeMs: generationTime
    });
    
    res.json(testResult);
    
  } catch (error) {
    console.error('❌ Fallback test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for multi-language support
router.post('/api/test-multilanguage', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Testing multi-language support...');
    
    const languages = ['en', 'id', 'ms', 'th', 'vi', 'tl'];
    const generator = new AIQuestionGenerator();
    const results: Record<string, any> = {};
    
    for (const lang of languages) {
      const testRequest = {
        jobPosition: 'Data Analyst',
        interviewStage: 'behavioral',
        experienceLevel: 'entry-level', 
        preferredLanguage: lang,
        difficultyLevel: 'beginner',
        focusAreas: ['communication'],
        questionCategories: ['behavioral'],
        questionNumber: 1
      };
      
      try {
        const startTime = Date.now();
        const question = await generator.generateQuestion(testRequest);
        const generationTime = Date.now() - startTime;
        
        results[lang] = {
          success: true,
          generationTimeMs: generationTime,
          hasTranslation: !!question.questionTextTranslated,
          isTranslated: question.questionTextTranslated !== question.questionText,
          culturalContext: question.culturalContext?.substring(0, 50) + '...',
          generatedBy: question.generatedBy
        };
      } catch (error) {
        results[lang] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    console.log('🌐 Multi-language test completed');
    
    res.json({
      success: true,
      results,
      summary: {
        tested: languages.length,
        successful: Object.values(results).filter((r: any) => r.success).length,
        failed: Object.values(results).filter((r: any) => !r.success).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Multi-language test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;