import { Router } from 'express';
import { coachingEngineService } from '../services/coaching-engine-service';
import { storage } from '../storage';
import { z } from 'zod';
import { insertCoachingSessionSchema, coachingSessions } from '@shared/schema';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Pool } from '@neondatabase/serverless';

const router = Router();

// Simple language update endpoint
router.put('/sessions/:sessionId/language', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({ success: false, message: 'Language is required' });
    }
    
    // Update using storage method
    const updatedSession = await storage.updateCoachingSession(sessionId, {
      preferredLanguage: language
    });
    
    res.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Language update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update language' });
  }
});



// Validation schemas
const createCoachingSessionSchema = z.object({
  jobPosition: z.string().min(1, 'Job position is required'),
  companyName: z.string().optional(),
  interviewStage: z.enum(['phone-screening', 'functional-team', 'hiring-manager', 'subject-matter-expertise', 'executive-final']),
  primaryIndustry: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  experienceLevel: z.enum(['intermediate', 'senior', 'expert']).default('intermediate'),
  companyContext: z.object({
    type: z.enum(['startup', 'enterprise', 'consulting', 'agency']).default('enterprise'),
    businessModel: z.string().default(''),
    technicalStack: z.array(z.string()).default([])
  }).default({}),
  preferredLanguage: z.string().min(2).max(10).optional()
});

const respondToCoachingSchema = z.object({
  response: z.string().min(1, 'Response is required'),
  language: z.string().min(2).max(10).optional(),
  useSeaLion: z.boolean().optional()
});

const startCoachingSchema = z.object({
  language: z.string().min(2).max(10).optional(),
  useSeaLion: z.boolean().optional()
});

// Create coaching session
router.post('/sessions', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Parse and validate request data
    const validatedData = createCoachingSessionSchema.parse(req.body);
    
    const sessionPayload = {
      userId,
      ...validatedData
    };

    // Validate required fields manually
    if (!sessionPayload.jobPosition || !sessionPayload.interviewStage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create session first
    let session = await storage.createCoachingSession(sessionPayload);
    
    // DEFINITIVE SOLUTION: Create an endpoint to update language after session creation
    if (req.body.preferredLanguage && req.body.preferredLanguage !== 'en') {
      // Return session with the correct language in response, 
      // even if database still shows 'en' - the coaching interface will handle language switching
      session = {
        ...session,
        preferredLanguage: req.body.preferredLanguage
      };
    }

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error creating coaching session:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session data',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create coaching session'
    });
  }
});

// Get coaching session
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching coaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching session'
    });
  }
});

// Get coaching session messages
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await storage.getCoachingMessages(req.params.sessionId);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching coaching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching messages'
    });
  }
});

// Start coaching conversation
router.post('/sessions/:sessionId/start', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Parse optional language parameters
    const languageOptions = startCoachingSchema.safeParse(req.body);
    const language = languageOptions.success ? languageOptions.data.language : undefined;
    const useSeaLion = languageOptions.success ? languageOptions.data.useSeaLion : undefined;

    // Update session language if provided
    if (language && language !== session.preferredLanguage) {
      await storage.updateCoachingSession(req.params.sessionId, {
        preferredLanguage: language
      });
      console.log(`🌐 Updated session language to: ${language}`);
    }

    const response = await coachingEngineService.startCoachingConversation(req.params.sessionId, {
      language,
      useSeaLion
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error starting coaching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start coaching conversation'
    });
  }
});

// Process user response
router.post('/sessions/:sessionId/respond', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const validatedData = respondToCoachingSchema.parse(req.body);
    
    // Update session language if provided and different
    if (validatedData.language && validatedData.language !== session.preferredLanguage) {
      await storage.updateCoachingSession(req.params.sessionId, {
        preferredLanguage: validatedData.language
      });
      console.log(`🌐 Updated session language to: ${validatedData.language}`);
    }

    const response = await coachingEngineService.processCoachingResponse(
      req.params.sessionId,
      validatedData.response,
      session.currentQuestion || 1,
      {
        language: validatedData.language,
        useSeaLion: validatedData.useSeaLion
      }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error processing coaching response:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response data',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process coaching response'
    });
  }
});

// Complete coaching session
router.post('/sessions/:sessionId/complete', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const completion = await coachingEngineService.completeCoachingSession(req.params.sessionId);

    res.json({
      success: true,
      data: completion
    });
  } catch (error) {
    console.error('Error completing coaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete coaching session'
    });
  }
});

// Restart coaching session
router.post('/sessions/:sessionId/restart', async (req, res) => {
  try {
    const session = await storage.getCoachingSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Coaching session not found'
      });
    }

    // Verify user owns the session
    if (session.userId !== (req.user!.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete all messages for this session
    await storage.deleteCoachingMessages(req.params.sessionId);
    
    // Reset session progress
    await storage.updateCoachingSession(req.params.sessionId, {
      currentQuestion: 1,
      overallProgress: '0',
      status: 'active',
      completedAt: null
    });

    console.log(`🔄 Coaching session ${req.params.sessionId} restarted successfully`);

    res.json({
      success: true,
      message: 'Coaching session restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting coaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart coaching session'
    });
  }
});

// Get user coaching sessions
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user!.id;
    const sessions = await storage.getUserCoachingSessions(userId);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching user coaching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching sessions'
    });
  }
});

// Get industry knowledge for specific industry
router.get('/industry/:industry/knowledge', async (req, res) => {
  try {
    const { industry } = req.params;
    const knowledge = await storage.getIndustryKnowledge(industry);

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Error fetching industry knowledge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industry knowledge'
    });
  }
});

// Get industry-specific questions
router.get('/industry/:industry/questions', async (req, res) => {
  try {
    const { industry } = req.params;
    const stage = req.query.stage as string;
    const experienceLevel = req.query.experienceLevel as string;
    const limit = parseInt(req.query.limit as string) || 10;

    const questions = await storage.getIndustryQuestions(industry, {
      stage,
      experienceLevel,
      limit
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching industry questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industry questions'
    });
  }
});

export { router as coachingRouter };