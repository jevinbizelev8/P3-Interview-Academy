import { Router } from 'express';
import { coachingEngineService } from '../services/coaching-engine-service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

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
  }).default({})
});

const respondToCoachingSchema = z.object({
  response: z.string().min(1, 'Response is required')
});

// Create coaching session
router.post('/sessions', async (req, res) => {
  try {
    console.log('Creating coaching session - req.user:', req.user);
    const userId = req.user?.id || 'dev-user-123';
    console.log('Using userId:', userId);
    const validatedData = createCoachingSessionSchema.parse(req.body);

    const sessionPayload = {
      userId,
      ...validatedData
    };
    console.log('Session payload:', sessionPayload);

    const session = await storage.createCoachingSession(sessionPayload);

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
    if (session.userId !== (req.user?.id || 'dev-user-123')) {
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
    if (session.userId !== (req.user?.id || 'dev-user-123')) {
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
    if (session.userId !== (req.user?.id || 'dev-user-123')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const response = await coachingEngineService.startCoachingConversation(req.params.sessionId);

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
    if (session.userId !== (req.user?.id || 'dev-user-123')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const validatedData = respondToCoachingSchema.parse(req.body);
    
    const response = await coachingEngineService.processCoachingResponse(
      req.params.sessionId,
      validatedData.response
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
    if (session.userId !== (req.user?.id || 'dev-user-123')) {
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

// Get user coaching sessions
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user?.id || 'dev-user-123';
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