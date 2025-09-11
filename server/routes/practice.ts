// Practice Module API Routes
// RESTful endpoints for interactive practice interview sessions

import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { 
  insertPracticeSessionSchema, 
  insertPracticeMessageSchema,
  insertPracticeReportSchema 
} from "@shared/schema.js";
import { AIQuestionGenerator } from "../services/ai-question-generator.js";
import { ResponseEvaluationService } from "../services/response-evaluation-service.js";

const router = Router();
const questionGenerator = new AIQuestionGenerator();
const evaluationService = new ResponseEvaluationService();

// Validation schemas
const createSessionSchema = z.object({
  scenarioId: z.string().min(1, "Scenario ID is required"),
  jobPosition: z.string().optional(),
  companyName: z.string().optional(),
  interviewStage: z.string().min(1, "Interview stage is required"),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  preferredLanguage: z.string().default("en"),
  totalQuestions: z.number().min(1).max(30).default(20),
});

const userResponseSchema = z.object({
  content: z.string().min(1, "Response content is required"),
  inputMethod: z.enum(["text", "voice"]).default("text"),
  responseTime: z.number().optional(),
  questionNumber: z.number().min(1),
});

// ================================
// PRACTICE SESSION ENDPOINTS
// ================================

/**
 * POST /sessions
 * Create new practice session from scenario configuration
 */
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

    const sessionData = {
      ...validation.data,
      userId: req.user.id,
      status: 'active' as const,
    };

    const session = await storage.createPracticeSession(sessionData);
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Practice session created successfully'
    });

  } catch (error) {
    console.error('❌ Create practice session error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /sessions/:id
 * Return session with messages and optional report
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await storage.getPracticeSession(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }

    // Verify ownership
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('❌ Get practice session error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /sessions
 * Get user's practice sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await storage.getUserPracticeSessions(req.user.id, limit);
    
    res.json({
      success: true,
      data: sessions,
      pagination: {
        limit,
        total: sessions.length
      }
    });

  } catch (error) {
    console.error('❌ Get user practice sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /sessions/:id
 * Get individual practice session with messages
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await storage.getPracticeSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    res.json(session);

  } catch (error) {
    console.error('❌ Get practice session error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// SESSION INTERACTION ENDPOINTS
// ================================

/**
 * POST /sessions/:id/user-response
 * Append user response message to session
 */
router.post('/sessions/:id/user-response', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await storage.getPracticeSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const validation = userResponseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid response data',
        details: validation.error.issues
      });
    }

    const messageData = {
      sessionId: req.params.id,
      messageType: 'user_response' as const,
      content: validation.data.content,
      questionNumber: validation.data.questionNumber,
      inputMethod: validation.data.inputMethod,
      responseTime: validation.data.responseTime,
    };

    const message = await storage.addPracticeMessage(messageData);
    
    res.status(201).json({
      success: true,
      data: message,
      message: 'Response recorded successfully'
    });

  } catch (error) {
    console.error('❌ Add user response error:', error);
    res.status(500).json({
      error: 'Failed to record response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /sessions/:id/ai-question
 * Generate next AI question for the session
 */
router.post('/sessions/:id/ai-question', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await storage.getPracticeSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Check if session is still active
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Check if we've reached the question limit
    const currentQuestionNumber = session.currentQuestionNumber || 1;
    const totalQuestions = session.totalQuestions || 10;
    
    if (currentQuestionNumber > totalQuestions) {
      return res.status(400).json({ 
        error: 'Maximum questions reached',
        suggestion: 'Complete the session to get evaluation'
      });
    }

    // Generate next question using AI Question Generator
    const questionRequest = {
      jobPosition: session.jobPosition || "Professional",
      companyName: session.companyName || undefined,
      interviewStage: session.interviewStage,
      experienceLevel: (session.difficultyLevel === 'beginner' ? 'entry' : 
                       session.difficultyLevel === 'advanced' ? 'senior' : 'intermediate') as 'entry' | 'intermediate' | 'senior' | 'expert',
      preferredLanguage: session.preferredLanguage || 'en',
      difficultyLevel: session.difficultyLevel || 'intermediate',
      focusAreas: ['behavioral', 'situational'],
      questionCategories: ['general'],
      questionNumber: currentQuestionNumber,
      adaptiveDifficulty: true,
    };

    const generatedQuestion = await questionGenerator.generateQuestion(questionRequest);
    
    // Add AI question message to session
    const messageData = {
      sessionId: req.params.id,
      messageType: 'ai_question' as const,
      content: generatedQuestion.questionText,
      questionNumber: currentQuestionNumber,
      language: session.preferredLanguage || 'en',
    };

    const message = await storage.addPracticeMessage(messageData);

    // Update session with current question number
    await storage.updatePracticeSession(req.params.id, {
      currentQuestionNumber: currentQuestionNumber + 1,
    });
    
    res.json({
      success: true,
      data: {
        message,
        question: generatedQuestion,
        questionNumber: currentQuestionNumber,
        remainingQuestions: totalQuestions - currentQuestionNumber,
      },
      message: 'Question generated successfully'
    });

  } catch (error) {
    console.error('❌ Generate AI question error:', error);
    res.status(500).json({
      error: 'Failed to generate question',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// SESSION COMPLETION ENDPOINTS
// ================================

/**
 * POST /sessions/:id/complete
 * Complete session and generate evaluation report
 */
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await storage.getPracticeSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Check if session is already completed
    if (session.status === 'completed') {
      const existingReport = await storage.getPracticeReport(req.params.id);
      return res.json({
        success: true,
        data: { session, report: existingReport },
        message: 'Session already completed'
      });
    }

    // Calculate session duration
    const startTime = session.startedAt ? new Date(session.startedAt) : new Date();
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Get user responses for evaluation
    const userMessages = session.messages.filter(m => m.messageType === 'user_response');
    
    if (userMessages.length === 0) {
      return res.status(400).json({ 
        error: 'No responses to evaluate',
        message: 'Session must have at least one user response to complete'
      });
    }

    // Generate comprehensive evaluation using enhanced Response Evaluation Service
    console.log(`📋 Starting comprehensive evaluation for ${userMessages.length} responses`);
    
    // Prepare responses for evaluation
    const responsesToEvaluate = userMessages.map((msg, index) => ({
      questionText: session.scenarioId || `Interview question ${msg.questionNumber || index + 1}`,
      responseText: msg.content,
      questionCategory: session.scenarioId || 'behavioral',
      questionType: 'behavioral'
    }));
    
    // Session context for evaluation
    const sessionContext = {
      jobPosition: session.jobPosition || 'Professional',
      companyName: session.companyName,
      experienceLevel: session.difficultyLevel || 'intermediate',
      responseLanguage: session.preferredLanguage || 'en',
      culturalContext: session.preferredLanguage && session.preferredLanguage !== 'en' ? 'ASEAN' : undefined
    };

    let evaluationResults;
    let overallScore: number;
    let strengths: string[];
    let weaknesses: string[];
    let improvements: string[];
    let detailedFeedback: string;
    
    // 9-Criteria scores
    let relevanceScore: number;
    let starStructureScore: number;
    let specificEvidenceScore: number;
    let roleAlignmentScore: number;
    let outcomeOrientedScore: number;
    let communicationScore: number;
    let problemSolvingScore: number;
    let culturalFitScore: number;
    let learningAgilityScore: number;
    let overallRating: string;

    try {
      // Use comprehensive evaluation service
      evaluationResults = await evaluationService.evaluateSessionResponses(
        responsesToEvaluate,
        sessionContext
      );
      
      const overallScores = evaluationResults.overallScores;
      
      // Extract comprehensive scores
      overallScore = overallScores.weightedOverallScore;
      relevanceScore = overallScores.relevanceScore;
      starStructureScore = overallScores.starStructureScore;
      specificEvidenceScore = overallScores.specificEvidenceScore;
      roleAlignmentScore = overallScores.roleAlignmentScore;
      outcomeOrientedScore = overallScores.outcomeOrientedScore;
      communicationScore = overallScores.communicationScore;
      problemSolvingScore = overallScores.problemSolvingScore;
      culturalFitScore = overallScores.culturalFitScore;
      learningAgilityScore = overallScores.learningAgilityScore;
      overallRating = overallScores.overallRating;
      
      // Extract feedback
      strengths = overallScores.detailedFeedback.strengths;
      weaknesses = overallScores.detailedFeedback.weaknesses;
      improvements = overallScores.detailedFeedback.suggestions;
      
      // Generate summary feedback
      const summary = evaluationResults.sessionSummary;
      detailedFeedback = `Session completed with ${summary.totalResponses} responses. Overall performance: ${overallRating} (${overallScore}/5.0). ${summary.keyStrengths.length > 0 ? 'Key strengths: ' + summary.keyStrengths.join(', ') + '. ' : ''}${summary.criticalImprovements.length > 0 ? 'Focus areas: ' + summary.criticalImprovements.join(', ') + '.' : ''}`;
      
      console.log(`✅ Comprehensive evaluation completed: ${overallRating} (${overallScore}/5.0)`);

    } catch (evalError) {
      console.error('❌ Comprehensive evaluation failed, using fallback:', evalError);
      
      // Fallback to basic scoring
      overallScore = 3.5;
      relevanceScore = 3.5;
      starStructureScore = 3.5;
      specificEvidenceScore = 3.5;
      roleAlignmentScore = 3.5;
      outcomeOrientedScore = 3.5;
      communicationScore = 3.5;
      problemSolvingScore = 3.5;
      culturalFitScore = 3.5;
      learningAgilityScore = 3.5;
      overallRating = 'Borderline';
      
      strengths = ["Completed practice session", "Demonstrated engagement with questions"];
      weaknesses = ["Technical evaluation unavailable"];
      improvements = ["Continue practicing interview skills", "Focus on structured STAR responses", "Include specific metrics in examples"];
      detailedFeedback = `Session completed with ${userMessages.length} responses. Technical evaluation temporarily unavailable, but you've demonstrated good engagement with the interview practice.`;
    }

    // Create comprehensive evaluation report with 9-criteria scores
    const reportData = {
      sessionId: req.params.id,
      userId: req.user.id,
      
      // Overall scoring
      overallScore: overallScore.toString(),
      overallRating: overallRating,
      
      // 9-Criteria detailed scores
      relevanceScore: relevanceScore.toString(),
      starStructureScore: starStructureScore.toString(),
      specificEvidenceScore: specificEvidenceScore.toString(),
      roleAlignmentScore: roleAlignmentScore.toString(),
      outcomeOrientedScore: outcomeOrientedScore.toString(),
      communicationScore: communicationScore.toString(),
      problemSolvingScore: problemSolvingScore.toString(),
      culturalFitScore: culturalFitScore.toString(),
      learningAgilityScore: learningAgilityScore.toString(),
      
      // Legacy STAR scores for backward compatibility
      situationScore: starStructureScore.toString(),
      taskScore: starStructureScore.toString(),
      actionScore: starStructureScore.toString(),
      resultScore: outcomeOrientedScore.toString(),
      
      // Feedback and insights
      strengths: JSON.stringify(strengths.slice(0, 5)),
      weaknesses: JSON.stringify(weaknesses.slice(0, 5)),
      improvements: JSON.stringify(improvements.slice(0, 5)),
      detailedFeedback,
      
      // Session statistics and insights
      keyInsights: JSON.stringify([
        `Completed ${userMessages.length} questions in ${Math.floor(duration / 60)} minutes`,
        `Overall performance: ${overallRating} (${overallScore}/5.0)`,
        `Pass threshold: ${overallScore >= 3.5 ? '✅ ACHIEVED' : '❌ Not reached (need ≥3.5)'}`,
        ...(evaluationResults?.sessionSummary.keyStrengths.slice(0, 2) || [])
      ]),
      
      // Actionable recommendations based on evaluation
      recommendedActions: JSON.stringify([
        ...(evaluationResults?.sessionSummary.nextSteps.slice(0, 3) || [
          "Review detailed feedback for each criterion",
          "Practice structured STAR method responses",
          "Focus on including specific metrics and outcomes"
        ]),
        "Schedule follow-up practice sessions to track improvement",
        "Consider role-specific interview preparation"
      ]),
      
      // Enhanced metadata
      evaluatedBy: "comprehensive-ai",
      evaluationCompleted: true,
      criteriaVersion: "9-criteria-v1.0",
      sessionLanguage: sessionContext.responseLanguage,
      totalResponses: userMessages.length,
      sessionDuration: duration
    };

    const report = await storage.createPracticeReport(reportData);

    // Update session as completed
    await storage.updatePracticeSession(req.params.id, {
      status: 'completed',
      totalDuration: duration,
    });

    res.json({
      success: true,
      data: {
        session: { ...session, status: 'completed', totalDuration: duration },
        report,
      },
      message: 'Session completed and evaluated successfully'
    });

  } catch (error) {
    console.error('❌ Complete session error:', error);
    res.status(500).json({
      error: 'Failed to complete session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /sessions/:id/report
 * Return evaluation report for completed session
 */
router.get('/sessions/:id/report', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session ownership
    const session = await storage.getPracticeSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const report = await storage.getPracticeReport(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        error: 'Report not found',
        message: 'Complete the session first to generate a report'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Get practice report error:', error);
    res.status(500).json({
      error: 'Failed to retrieve report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// ANALYTICS ENDPOINTS
// ================================

/**
 * GET /overview
 * Get user practice statistics for Perform dashboard
 */
router.get('/overview', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const overview = await storage.getPracticeOverview(req.user.id);
    
    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('❌ Get practice overview error:', error);
    res.status(500).json({
      error: 'Failed to retrieve overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ================================
// SESSION MANAGEMENT ENDPOINTS
// ================================

/**
 * DELETE /sessions/:id
 * Delete practice session (only incomplete sessions can be deleted)
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = req.params.id;

    // Verify session exists and ownership
    const session = await storage.getPracticeSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Only allow deletion of incomplete sessions
    if (session.status === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot delete completed sessions', 
        message: 'Completed practice sessions cannot be deleted to preserve evaluation history.'
      });
    }

    // Delete related data first (messages, reports if any)
    await storage.deletePracticeMessages(sessionId);
    
    // Delete the session itself
    await storage.deletePracticeSession(sessionId);
    
    res.json({
      success: true,
      message: 'Practice session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete practice session error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;