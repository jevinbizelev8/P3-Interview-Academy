import express from 'express';
import { z } from 'zod';
import { questionBankService } from '../services/question-bank-service';
import { translationService } from '../services/translation-service';
import type { SupportedLanguage } from '@shared/schema';

const router = express.Router();

// Validation schemas
const getQuestionsSchema = z.object({
  stage: z.string().min(1),
  count: z.coerce.number().min(1).max(50).optional().default(15),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().min(2).max(10).optional().default('en'),
  sessionId: z.string().optional()
});

const getCategoryQuestionsSchema = z.object({
  category: z.enum(['behavioral', 'situational', 'technical', 'company-specific', 'general']),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  language: z.string().min(2).max(10).optional().default('en')
});

// ================================
// QUESTION RETRIEVAL ENDPOINTS
// ================================

/**
 * GET /api/prepare/questions/stage/:stage
 * Get questions for a specific interview stage
 */
router.get('/stage/:stage', async (req, res) => {
  try {
    const validation = getQuestionsSchema.safeParse({
      stage: req.params.stage,
      count: req.query.count,
      difficulty: req.query.difficulty,
      language: req.query.language,
      sessionId: req.query.sessionId
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.errors
      });
    }

    const { stage, count, difficulty, language } = validation.data;
    
    const questions = await questionBankService.getQuestionsForStage(
      stage,
      count,
      difficulty,
      language as SupportedLanguage
    );

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          stage,
          count: questions.length,
          difficulty,
          language,
          totalAvailable: questions.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching questions for stage:', error);
    res.status(500).json({
      error: 'Failed to fetch questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prepare/questions/category/:category
 * Get questions by category (behavioral, situational, etc.)
 */
router.get('/category/:category', async (req, res) => {
  try {
    const validation = getCategoryQuestionsSchema.safeParse({
      category: req.params.category,
      limit: req.query.limit,
      language: req.query.language
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.errors
      });
    }

    const { category, limit } = validation.data;
    
    const questions = await questionBankService.getQuestionsByCategory(category, limit);

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          category,
          count: questions.length,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    res.status(500).json({
      error: 'Failed to fetch questions by category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prepare/questions/star-method
 * Get questions that are relevant for STAR method practice
 */
router.get('/star-method', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 15, 50);
    
    const questions = await questionBankService.getStarMethodQuestions(limit);

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          type: 'star-method',
          count: questions.length,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching STAR method questions:', error);
    res.status(500).json({
      error: 'Failed to fetch STAR method questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prepare/questions/all-stages
 * Get comprehensive overview of all available questions by stage
 */
router.get('/all-stages', async (req, res) => {
  try {
    const allStageQuestions = await questionBankService.getAllStageQuestions();

    res.json({
      success: true,
      data: {
        stages: allStageQuestions,
        metadata: {
          totalStages: Object.keys(allStageQuestions).length,
          totalQuestions: Object.values(allStageQuestions).reduce((sum, stage) => sum + stage.totalQuestions, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all stage questions:', error);
    res.status(500).json({
      error: 'Failed to fetch all stage questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prepare/questions/statistics
 * Get comprehensive statistics about the question bank
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await questionBankService.getQuestionStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching question statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch question statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// DYNAMIC QUESTION GENERATION
// ================================

/**
 * POST /api/prepare/questions/generate
 * Generate additional questions for a specific stage using AI
 */
router.post('/generate', async (req, res) => {
  try {
    const { stage, count, difficulty, language, jobPosition, companyName } = req.body;

    if (!stage || !count) {
      return res.status(400).json({
        error: 'Missing required parameters: stage and count'
      });
    }

    if (count > 20) {
      return res.status(400).json({
        error: 'Maximum 20 questions can be generated at once'
      });
    }

    const questions = await questionBankService.generateAdditionalQuestions(
      stage,
      count,
      difficulty,
      language as SupportedLanguage
    );

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          stage,
          count: questions.length,
          generated: true,
          language: language || 'en'
        }
      }
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      error: 'Failed to generate questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// SESSION-SPECIFIC ENDPOINTS
// ================================

/**
 * GET /api/prepare/questions/session/:sessionId
 * Get questions for a specific preparation session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const count = Math.min(parseInt(req.query.count as string) || 15, 50);
    const difficulty = req.query.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined;
    const language = (req.query.language as string) || 'en';

    // For now, we'll use the existing session data to determine the stage
    // In a real implementation, you'd fetch the session from the database
    const defaultStage = 'phone-screening'; // This should come from the session data
    
    const questions = await questionBankService.getQuestionsForStage(
      defaultStage,
      count,
      difficulty,
      language as SupportedLanguage
    );

    res.json({
      success: true,
      data: {
        questions,
        sessionId,
        metadata: {
          stage: defaultStage,
          count: questions.length,
          difficulty,
          language
        }
      }
    });
  } catch (error) {
    console.error('Error fetching session questions:', error);
    res.status(500).json({
      error: 'Failed to fetch session questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/prepare/questions/session/:sessionId/bookmark
 * Bookmark a specific question for later review
 */
router.post('/session/:sessionId/bookmark', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, bookmarked } = req.body;

    if (!questionId) {
      return res.status(400).json({
        error: 'Missing questionId in request body'
      });
    }

    // TODO: Implement bookmark functionality in database
    // For now, return success response
    res.json({
      success: true,
      data: {
        sessionId,
        questionId,
        bookmarked: bookmarked !== false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error bookmarking question:', error);
    res.status(500).json({
      error: 'Failed to bookmark question',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// ENHANCED TRANSLATION ENDPOINT
// ================================

/**
 * POST /api/prepare/questions/translate
 * Enhanced translation endpoint with cultural context
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, context } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required parameters: text and targetLanguage'
      });
    }

    // Validate target language
    const supportedLanguages = ['ms', 'id', 'th', 'vi', 'fil', 'my', 'km', 'lo', 'zh-sg', 'en'];
    if (!supportedLanguages.includes(targetLanguage)) {
      return res.status(400).json({
        error: `Unsupported target language: ${targetLanguage}. Supported: ${supportedLanguages.join(', ')}`
      });
    }

    // If requesting English, return original text
    if (targetLanguage === 'en') {
      return res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: text,
          targetLanguage,
          context,
          culturalAdaptations: [
            'Original English text maintained',
            'Professional tone preserved'
          ]
        }
      });
    }

    console.log(`🌏 Translating text to ${targetLanguage}: "${text.substring(0, 100)}..."`);
    
    // Use the enhanced translation service
    const translationResult = await translationService.translateContent(
      text, 
      targetLanguage as SupportedLanguage,
      context || 'interview question'
    );

    const culturalAdaptations = [
      'Culturally adapted for Southeast Asian context',
      'Professional tone maintained',
      'Respectful language used',
      'Context-aware translation applied'
    ];

    // Add specific adaptations based on language
    const languageSpecificAdaptations: Record<string, string> = {
      'ms': 'Adapted for Malaysian business culture',
      'id': 'Adapted for Indonesian professional context',
      'th': 'Respectful Thai language conventions applied',
      'vi': 'Vietnamese professional courtesy maintained',
      'fil': 'Filipino cultural respect and hierarchy considered',
      'my': 'Myanmar cultural sensitivity maintained',
      'km': 'Khmer professional etiquette applied',
      'lo': 'Lao cultural context respected',
      'zh-sg': 'Singapore Chinese business context applied'
    };

    if (languageSpecificAdaptations[targetLanguage]) {
      culturalAdaptations.push(languageSpecificAdaptations[targetLanguage]);
    }

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText: translationResult.translated,
        targetLanguage,
        context: context || 'interview question',
        culturalAdaptations,
        provider: translationResult.provider,
        responseTime: translationResult.responseTime
      }
    });

  } catch (error) {
    console.error('Error translating question:', error);
    res.status(500).json({
      error: 'Failed to translate question',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;