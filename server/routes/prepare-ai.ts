// AI-Powered Prepare Module API Routes
// RESTful endpoints for AI-driven interview preparation sessions

import { Router } from "express";
import { z } from "zod";
import { PrepareAIService } from "../services/prepare-ai-service.js";
import { emitToSession } from "../services/realtime-gateway.js";

const router = Router();
const prepareAIService = new PrepareAIService();

// Validation schemas
const createSessionSchema = z.object({
  jobPosition: z.string().min(1, "Job position is required"),
  companyName: z.string().optional(),
  interviewStage: z.enum([
    "phone-screening", 
    "functional-team", 
    "hiring-manager", 
    "sme-expert", 
    "executive-leadership"
  ]),
  experienceLevel: z.enum(["entry", "intermediate", "senior", "expert"]),
  preferredLanguage: z.string().default("en"),
  voiceEnabled: z.boolean().default(true),
  speechRate: z.string().default("1.0"),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "adaptive"]).default("adaptive"),
  focusAreas: z.array(z.string()).default(["behavioral", "situational"]),
  questionCategories: z.array(z.string()).default(["general"])
});

const responseSchema = z.object({
  questionId: z.string().uuid(),
  responseText: z.string().min(1, "Response text is required"),
  responseLanguage: z.string().default("en"),
  inputMethod: z.enum(["voice", "text"]).default("text"),
  audioDuration: z.number().optional(),
  transcriptionConfidence: z.string().optional()
});

// Session management endpoints
router.post('/sessions', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = createSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid session configuration',
        details: validation.error.issues
      });
    }

    const session = await prepareAIService.createSession(req.user.id, validation.data);
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'AI preparation session created successfully'
    });

  } catch (error) {
    console.error('❌ Create AI session error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/sessions/:sessionId', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await prepareAIService.getSession(req.params.sessionId);
    
    // Check ownership
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('❌ Get AI session error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const sessions = await prepareAIService.getUserSessions(req.user.id, limit, offset);
    
    res.json({
      success: true,
      data: sessions,
      pagination: {
        limit,
        offset,
        total: sessions.length
      }
    });

  } catch (error) {
    console.error('❌ Get user AI sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Question generation endpoints
router.post('/sessions/:sessionId/question', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await prepareAIService.getSession(req.params.sessionId);
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const question = await prepareAIService.generateNextQuestion({
      sessionId: req.params.sessionId,
      userId: req.user.id,
      adaptiveDifficulty: req.body.adaptiveDifficulty !== false
    });

    // Emit the question to WebSocket clients in the session room
    // Use translated question if available and language is not English
    const questionToSend = session.preferredLanguage !== 'en' && question.questionTextTranslated 
      ? question.questionTextTranslated 
      : question.questionText;
      
    emitToSession(req.params.sessionId, 'question-generated', {
      question: questionToSend,
      questionId: question.id
    });

    res.json({
      success: true,
      data: question,
      message: 'Question generated successfully'
    });

  } catch (error) {
    console.error('❌ Generate question error:', error);
    res.status(500).json({
      error: 'Failed to generate question',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Response processing endpoints
router.post('/sessions/:sessionId/respond', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await prepareAIService.getSession(req.params.sessionId);
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const validation = responseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid response data',
        details: validation.error.issues
      });
    }

    const response = await prepareAIService.processResponse(
      req.params.sessionId,
      validation.data.questionId,
      validation.data.responseText,
      {
        responseLanguage: validation.data.responseLanguage,
        inputMethod: validation.data.inputMethod,
        audioDuration: validation.data.audioDuration,
        transcriptionConfidence: validation.data.transcriptionConfidence
      }
    );

    res.json({
      success: true,
      data: response,
      message: 'Response processed and evaluated successfully'
    });

  } catch (error) {
    console.error('❌ Process response error:', error);
    res.status(500).json({
      error: 'Failed to process response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Progress and analytics endpoints
router.get('/sessions/:sessionId/progress', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await prepareAIService.getSession(req.params.sessionId);
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const progress = await prepareAIService.getSessionProgress(req.params.sessionId);

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('❌ Get session progress error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Session control endpoints
router.patch('/sessions/:sessionId/status', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, paused, or completed' });
    }

    // Verify session ownership
    const session = await prepareAIService.getSession(req.params.sessionId);
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    await prepareAIService.updateSessionStatus(req.params.sessionId, status);

    res.json({
      success: true,
      message: `Session ${status} successfully`
    });

  } catch (error) {
    console.error('❌ Update session status error:', error);
    res.status(500).json({
      error: 'Failed to update session status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await prepareAIService.getSession(req.params.sessionId);
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    await prepareAIService.deleteSession(req.params.sessionId);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete session error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Voice processing endpoints (RESTful fallbacks for WebSocket)
router.post('/voice/transcribe', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // This would be implemented for RESTful fallback
    // Primary voice processing happens via WebSocket
    res.json({
      success: false,
      message: 'Voice processing available via WebSocket. Connect to /socket.io for real-time voice features.'
    });

  } catch (error) {
    console.error('❌ Voice transcribe error:', error);
    res.status(500).json({
      error: 'Failed to process voice transcription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/voice/synthesize', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // This would be implemented for RESTful fallback
    // Primary voice processing happens via WebSocket
    res.json({
      success: false,
      message: 'Voice synthesis available via WebSocket. Connect to /socket.io for real-time voice features.'
    });

  } catch (error) {
    console.error('❌ Voice synthesize error:', error);
    res.status(500).json({
      error: 'Failed to process voice synthesis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as prepareAIRouter };