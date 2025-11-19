// Prepare Module API Routes
// RESTful endpoints for learning modules, self-introduction, resumes, STAR stories, and readiness score

import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import crypto from "crypto";
import { LearningModuleService } from "../services/learning-module-service";
import { SelfIntroService } from "../services/self-intro-service";
import { ResumeService } from "../services/resume-service";
import { ReadinessService } from "../services/readiness-service";
import { requireCredits, checkDuplicateAction, markActionProcessed } from "../middleware/credit-middleware.js";
import { CreditService } from "../services/credit-service";
import { db } from "../db";
import { starStories, type InsertStarStory } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

//
// ======================
// Learning Modules Routes
// ======================
//

/**
 * GET /modules
 * Get all active learning modules
 * Query params: includeProgress (boolean) - include user progress
 */
router.get('/modules', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const includeProgress = req.query.includeProgress === 'true';

    if (includeProgress) {
      const modules = await LearningModuleService.getModulesWithProgress(req.user.id);
      return res.json({ success: true, data: modules });
    } else {
      const modules = await LearningModuleService.getModules();
      return res.json({ success: true, data: modules });
    }
  } catch (error) {
    console.error('❌ Error getting learning modules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve learning modules',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /modules/:stage
 * Get modules filtered by stage (prepare, practice, perform)
 */
const getModulesByStageSchema = z.object({
  stage: z.enum(['prepare', 'practice', 'perform']),
});

router.get('/modules/:stage', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedParams = getModulesByStageSchema.parse(req.params);

    const modules = await LearningModuleService.getModulesByStage(validatedParams.stage);
    return res.json({ success: true, data: modules });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stage parameter',
        details: error.errors,
      });
    }

    console.error('❌ Error getting modules by stage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve modules',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /modules/progress
 * Update user's progress for a module
 */
const updateProgressSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
  isCompleted: z.boolean().optional(),
  timeSpentMinutes: z.number().int().min(0).optional(),
  score: z.number().int().min(0).max(100).optional(),
  userData: z.any().optional(),
});

router.post('/modules/progress', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = updateProgressSchema.parse(req.body);

    const progress = await LearningModuleService.updateProgress(
      req.user.id,
      validatedData.moduleId,
      {
        isCompleted: validatedData.isCompleted,
        timeSpentMinutes: validatedData.timeSpentMinutes,
        score: validatedData.score,
        userData: validatedData.userData,
      }
    );

    return res.json({ success: true, data: progress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error updating module progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update progress',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /modules/progress
 * Get user's progress for all modules or specific module
 * Query params: moduleId (optional)
 */
router.get('/modules/progress', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const moduleId = req.query.moduleId as string | undefined;

    if (moduleId && !z.string().uuid().safeParse(moduleId).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID format',
      });
    }

    const progress = await LearningModuleService.getUserProgress(req.user.id, moduleId);
    return res.json({ success: true, data: progress });
  } catch (error) {
    console.error('❌ Error getting module progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve progress',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /modules/:moduleId/coaching
 * Get AI coaching for a learning module answer
 * Credit cost: 2 credits
 */
const moduleCoachingSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  userAnswer: z.string().min(10, 'User answer must be at least 10 characters'),
  weakExample: z.string().optional(),
  strongExample: z.string().optional(),
});

router.post('/modules/:moduleId/coaching', requireCredits('module-coaching'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const moduleId = req.params.moduleId;
    const validatedData = moduleCoachingSchema.parse(req.body);

    // Validate module exists and user has access
    const module = await LearningModuleService.getModuleById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Learning module not found',
      });
    }

    // Get AI coaching using the learning module service
    const coaching = await LearningModuleService.getAICoaching(
      req.user.id,
      moduleId,
      validatedData.question,
      validatedData.userAnswer,
      validatedData.weakExample,
      validatedData.strongExample
    );

    return res.json({ success: true, data: coaching });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error getting AI coaching:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI coaching',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /modules/screening-interview/coaching
 * Get AI coaching for screening interview game rapid-fire scenarios
 */
router.post('/modules/screening-interview/coaching', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = moduleCoachingSchema.parse(req.body);

    // Get AI coaching for the screening interview scenario
    const coaching = await LearningModuleService.getAICoaching(
      req.user.id,
      'screening-interview', // module identifier
      validatedData.question,
      validatedData.userAnswer,
      validatedData.weakExample,
      validatedData.strongExample
    );

    return res.json({ success: true, data: coaching });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error getting screening interview coaching:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI coaching',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// Self-Introduction Routes
// ======================
//

/**
 * POST /self-intro/draft
 * Save or update a draft for a specific wizard step (1-6)
 */
const saveDraftSchema = z.object({
  stepNumber: z.number().int().min(1).max(6, 'Step number must be between 1 and 6'),
  stepData: z.any(), // Accept any data structure for flexibility
});

router.post('/self-intro/draft', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = saveDraftSchema.parse(req.body);

    const selfIntroService = new SelfIntroService();
    const draft = await selfIntroService.saveDraft(
      req.user.id,
      validatedData.stepNumber,
      validatedData.stepData
    );

    return res.json({ success: true, data: draft });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error saving self-intro draft:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save draft',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /self-intro/draft
 * Get all draft steps or specific step
 * Query params: stepNumber (optional)
 */
router.get('/self-intro/draft', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const stepNumber = req.query.stepNumber ? parseInt(req.query.stepNumber as string) : undefined;

    if (stepNumber !== undefined && (stepNumber < 1 || stepNumber > 6)) {
      return res.status(400).json({
        success: false,
        error: 'Step number must be between 1 and 6',
      });
    }

    const selfIntroService = new SelfIntroService();

    if (stepNumber !== undefined) {
      const draft = await selfIntroService.getDraftByStep(req.user.id, stepNumber);
      if (!draft) {
        return res.status(404).json({
          success: false,
          error: 'Draft not found for this step',
        });
      }
      return res.json({ success: true, data: draft });
    } else {
      const drafts = await selfIntroService.getDrafts(req.user.id);
      return res.json({ success: true, data: drafts });
    }
  } catch (error) {
    console.error('❌ Error getting self-intro draft:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve draft',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /self-intro/finalize
 * Finalize self-introduction with AI assessment
 */
const finalizeIntroSchema = z.object({
  script: z.string().min(10, 'Script must be at least 10 characters'),
  videoUrl: z.string().url().optional(),
  videoDuration: z.number().int().min(0).optional(),
});

router.post('/self-intro/finalize', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = finalizeIntroSchema.parse(req.body);

    const selfIntroService = new SelfIntroService();
    const intro = await selfIntroService.finalizeIntro(
      req.user.id,
      validatedData.script,
      validatedData.videoUrl,
      validatedData.videoDuration
    );

    return res.json({ success: true, data: intro });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error finalizing self-intro:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to finalize self-introduction',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /self-intro/polish
 * Polish self-introduction script with AI
 * Requires credits: 3 credits
 */
const polishScriptSchema = z.object({
  script: z.string().min(10, 'Script must be at least 10 characters'),
});

router.post('/self-intro/polish', requireCredits('self-intro-polish'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = polishScriptSchema.parse(req.body);

    const selfIntroService = new SelfIntroService();
    const result = await selfIntroService.polishScript(req.user.id, validatedData.script);

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error polishing self-intro script:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to polish script',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /self-intro/analyze-video
 * Analyze self-introduction video (placeholder - script-based analysis)
 * Requires credits: 5 credits
 */
const analyzeVideoSchema = z.object({
  script: z.string().min(10, 'Script must be at least 10 characters'),
  videoDuration: z.number().optional(),
});

router.post('/self-intro/analyze-video', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = analyzeVideoSchema.parse(req.body);

    // Generate unique resource ID from script hash for idempotency
    const scriptHash = crypto.createHash('md5').update(validatedData.script).digest('hex');
    const resourceId = `script-${scriptHash.substring(0, 16)}`;

    // Check for duplicate processing (idempotency)
    if (checkDuplicateAction(req.user.id, 'video-analysis', resourceId)) {
      console.log(`⚠️  Duplicate video analysis request detected for user ${req.user.id}, resource: ${resourceId}`);
      return res.status(409).json({
        success: false,
        error: 'This video has already been analyzed recently. Please wait before re-analyzing the same content.',
        code: 'DUPLICATE_REQUEST',
      });
    }

    // Check if user has enough credits BEFORE processing
    const creditCheck = await CreditService.checkCredits(req.user.id, 'self-intro-analyze-video');
    if (!creditCheck.hasEnoughCredits) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        creditsNeeded: creditCheck.creditsNeeded,
        currentBalance: creditCheck.currentBalance,
      });
    }

    // Perform analysis FIRST (before deducting credits)
    const selfIntroService = new SelfIntroService();
    const result = await selfIntroService.analyzeVideoScript(req.user.id, validatedData.script, validatedData.videoDuration);

    // Deduct credits AFTER successful analysis
    try {
      await CreditService.deductCredits(
        req.user.id,
        'self-intro-analyze-video',
        null,
        'Self-introduction video analysis'
      );

      // Mark as processed to prevent duplicate charges
      markActionProcessed(req.user.id, 'video-analysis', resourceId);

      console.log(`✅ Video analysis completed and credits deducted for user ${req.user.id}`);
    } catch (creditError) {
      console.error('⚠️  Credit deduction failed after successful analysis:', creditError);
      // Analysis succeeded, so return the result even if credit deduction had issues
      // Log this for manual review
      return res.json({
        success: true,
        data: result,
        warning: 'Analysis completed but credit deduction pending. Please contact support if you were charged incorrectly.',
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error analyzing self-intro video:', error);
    return res.status(500).json({
      success: false,
      error: 'Analysis failed. No credits were deducted. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// Resume Analyzer Routes
// ======================
//

/**
 * POST /resume/upload
 * Upload resume file (PDF or DOCX)
 * Multipart form data: file, jobDescriptionId (optional)
 */
router.post('/resume/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const jobDescriptionId = req.body.jobDescriptionId as string | undefined;

    // Parse file content based on MIME type
    let parsedContent: string;

    try {
      if (req.file.mimetype === 'application/pdf') {
        // Parse PDF
        const pdfData = await pdfParse(req.file.buffer);
        parsedContent = pdfData.text;

        if (!parsedContent || parsedContent.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'PDF file appears to be empty or could not be parsed',
          });
        }
      } else if (
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        req.file.mimetype === 'application/msword'
      ) {
        // Parse DOCX
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        parsedContent = result.value;

        if (!parsedContent || parsedContent.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'DOCX file appears to be empty or could not be parsed',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Unsupported file type. Please upload PDF or DOCX files only.',
        });
      }
    } catch (parseError) {
      console.error('❌ Error parsing resume file:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse resume file. Please ensure the file is not corrupted.',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
      });
    }

    // Store file (for now just use filename, later implement S3 or local storage)
    const fileUrl = `/uploads/resumes/${req.user.id}/${req.file.originalname}`;

    const resumeService = new ResumeService();
    const resume = await resumeService.uploadResume(
      req.user.id,
      req.file.originalname,
      fileUrl,
      req.file.size,
      parsedContent,
      jobDescriptionId
    );

    return res.json({ success: true, data: resume });
  } catch (error) {
    console.error('❌ Error uploading resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload resume',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /resume/analyze
 * Analyze resume with AI
 */
const analyzeResumeSchema = z.object({
  resumeId: z.string().uuid('Invalid resume ID'),
  jobDescriptionText: z.string().optional(),
});

router.post('/resume/analyze', requireCredits('resume-analysis'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = analyzeResumeSchema.parse(req.body);

    const resumeService = new ResumeService();
    const analysis = await resumeService.analyzeResume(
      validatedData.resumeId,
      validatedData.jobDescriptionText
    );

    return res.json({ success: true, data: analysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Resume not found') {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    console.error('❌ Error analyzing resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze resume',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /resume/generate
 * Generate improved resume based on analysis
 */
const generateResumeSchema = z.object({
  resumeId: z.string().uuid('Invalid resume ID'),
  analysis: z.object({
    ats_score: z.number(),
    jd_match_percentage: z.number().optional(),
    missing_keywords: z.array(z.string()),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    suggestions: z.array(z.object({
      section: z.string(),
      original: z.string(),
      suggested: z.string(),
      reason: z.string()
    })),
    ai_feedback: z.string()
  }),
  jobDescription: z.string().optional(),
});

router.post('/resume/generate', requireCredits('resume-generation'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = generateResumeSchema.parse(req.body);

    const resumeService = new ResumeService();
    const result = await resumeService.generateImprovedResume(
      validatedData.resumeId,
      validatedData.analysis,
      validatedData.jobDescription
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error generating improved resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate improved resume',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /resume/:id
 * Get resume by ID
 */
router.get('/resume/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const resumeId = req.params.id;

    if (!z.string().uuid().safeParse(resumeId).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format',
      });
    }

    const resumeService = new ResumeService();
    const resume = await resumeService.getResumeById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    // Check if user owns this resume
    if (resume.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - not your resume',
      });
    }

    return res.json({ success: true, data: resume });
  } catch (error) {
    console.error('❌ Error getting resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve resume',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// STAR Stories Routes
// ======================
//

/**
 * POST /star-stories
 * Create a new STAR story
 */
const createStarStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  situation: z.string().min(1, 'Situation is required'),
  task: z.string().min(1, 'Task is required'),
  action: z.string().min(1, 'Action is required'),
  result: z.string().min(1, 'Result is required'),
  tags: z.array(z.string()).optional(),
});

router.post('/star-stories', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = createStarStorySchema.parse(req.body);

    const storyData: InsertStarStory = {
      userId: req.user.id,
      title: validatedData.title,
      situation: validatedData.situation,
      task: validatedData.task,
      action: validatedData.action,
      result: validatedData.result,
      tags: validatedData.tags || [],
    };

    const [story] = await db.insert(starStories).values(storyData).returning();

    return res.json({ success: true, data: story });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error creating STAR story:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create STAR story',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /star-stories
 * Get user's STAR stories
 * Query params: tag (optional filter)
 */
router.get('/star-stories', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const stories = await db
      .select()
      .from(starStories)
      .where(eq(starStories.userId, req.user.id));

    // TODO: Add tag filtering if needed

    return res.json({ success: true, data: stories });
  } catch (error) {
    console.error('❌ Error getting STAR stories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve STAR stories',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /star-stories/:id
 * Delete a specific STAR story
 */
router.delete('/star-stories/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const storyId = req.params.id;

    // Verify story exists and belongs to user
    const [story] = await db
      .select()
      .from(starStories)
      .where(
        and(
          eq(starStories.id, storyId),
          eq(starStories.userId, req.user.id)
        )
      );

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'STAR story not found or you do not have permission to delete it',
      });
    }

    // Delete the story
    await db
      .delete(starStories)
      .where(
        and(
          eq(starStories.id, storyId),
          eq(starStories.userId, req.user.id)
        )
      );

    return res.json({
      success: true,
      message: 'STAR story deleted successfully',
      data: { id: storyId },
    });
  } catch (error) {
    console.error('❌ Error deleting STAR story:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete STAR story',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// Readiness Score Route
// ======================
//

/**
 * GET /readiness-score
 * Calculate and return user's interview readiness score
 */
router.get('/readiness-score', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await ReadinessService.calculateReadinessScore(req.user.id);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error calculating readiness score:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate readiness score',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
