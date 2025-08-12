import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, insertResponseSchema, insertJobDescriptionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { generateInterviewFeedback, enhanceQuestionWithJobDescription } from './bedrock';
import type { InterviewType, Question } from "@shared/schema";
import mammoth from "mammoth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  // Session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid session data" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.id, updates);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update session" });
    }
  });

  // Question routes
  app.get("/api/questions", async (req, res) => {
    try {
      const type = req.query.type as string;
      const sessionId = req.query.sessionId as string;
      const industry = req.query.industry as string | undefined;
      
      if (!type) {
        return res.status(400).json({ error: "Question type is required" });
      }
      
      // Get base questions for the interview type (with optional industry filter)
      let questions = await storage.getQuestionsByType(type as any, industry);
      
      // If sessionId is provided, enhance questions with job description context
      if (sessionId) {
        try {
          const session = await storage.getSession(sessionId);
          if (session?.jobDescriptionId) {
            const jobDescription = await storage.getJobDescription(session.jobDescriptionId);
            if (jobDescription?.extractedText) {
              // Enhance questions with job description context
              const enhancedQuestions = await Promise.all(
                questions.map(async (question) => {
                  try {
                    const enhancedText = await enhanceQuestionWithJobDescription(
                      question.question,
                      jobDescription.extractedText || '',
                      session.position || '',
                      session.company || ''
                    );
                    return { ...question, question: enhancedText };
                  } catch (error) {
                    console.log('Failed to enhance question:', error);
                    return question; // Return original question if enhancement fails
                  }
                })
              );
              questions = enhancedQuestions;
            }
          }
        } catch (error) {
          console.log('Failed to enhance questions with JD context:', error);
          // Fall back to base questions if JD enhancement fails
        }
      }
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/technical-industries", async (req, res) => {
    try {
      const industries = await storage.getTechnicalIndustries();
      res.json(industries);
    } catch (error) {
      console.error('Error fetching technical industries:', error);
      res.status(500).json({ error: 'Failed to fetch technical industries' });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  // Response routes
  app.post("/api/responses", async (req, res) => {
    try {
      const responseData = insertResponseSchema.parse(req.body);
      
      // Auto-generate feedback if response text is provided
      let responseWithFeedback = { ...responseData };
      
      if (responseData.responseText) {
        const session = await storage.getSession(responseData.sessionId);
        const question = await storage.getQuestion(responseData.questionId);
        
        const feedback = await generateFeedback(
          responseData.responseText,
          question?.question,
          session
        );
        
        responseWithFeedback.feedback = feedback;
        
        // Store evaluation scores if generated by AI
        if (feedback.evaluationScores) {
          responseWithFeedback.evaluationScores = feedback.evaluationScores;
        }
      }
      
      const response = await storage.createResponse(responseWithFeedback);
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid response data" });
    }
  });

  app.get("/api/responses/session/:sessionId", async (req, res) => {
    try {
      const responses = await storage.getResponsesBySession(req.params.sessionId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });

  app.patch("/api/responses/:id", async (req, res) => {
    try {
      const updates = req.body;
      
      // Regenerate feedback if response text changed
      if (updates.responseText) {
        // Get session context for enhanced feedback
        const response = await storage.getResponseById(req.params.id);
        const session = response ? await storage.getSession(response.sessionId) : null;
        const question = response ? await storage.getQuestion(response.questionId) : null;
        
        const feedback = await generateFeedback(
          updates.responseText,
          question?.question,
          session
        );
        
        updates.feedback = feedback;
        
        // Update evaluation scores if generated by AI
        if (feedback.evaluationScores) {
          updates.evaluationScores = feedback.evaluationScores;
        }
      }
      
      const response = await storage.updateResponse(req.params.id, updates);
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update response" });
    }
  });

  // WGLL content routes - Generate dynamic industry-specific expert answers
  app.get("/api/wgll/:questionId", async (req, res) => {
    try {
      // First check if we have cached WGLL content
      let content = await storage.getWgllContent(req.params.questionId);
      
      if (!content) {
        // Generate new WGLL content dynamically using AI
        const question = await storage.getQuestion(req.params.questionId);
        
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        // Only generate for subject-matter-expertise questions with industry
        if (question.type === 'subject-matter-expertise' && question.industry) {
          const { generateWGLLContent } = await import('./bedrock');
          
          try {
            const wgllData = await generateWGLLContent(
              question.question,
              question.industry,
              Array.isArray(question.tags) ? question.tags : []
            );

            // Store the generated content in database for future use
            content = await storage.createWgllContent({
              questionId: req.params.questionId,
              modelAnswer: wgllData.modelAnswer,
              expertTips: wgllData.expertTips,
              performanceMetrics: wgllData.keySuccessFactors
            });
          } catch (generateError) {
            console.error('WGLL generation failed:', generateError);
            return res.status(500).json({ error: "Failed to generate WGLL content" });
          }
        } else {
          return res.status(404).json({ error: "WGLL content not available for this question type" });
        }
      }
      
      res.json(content);
    } catch (error) {
      console.error('WGLL fetch error:', error);
      res.status(500).json({ error: "Failed to fetch WGLL content" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `jd-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only PDF and text files
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'text/plain' || 
          file.mimetype === 'application/msword' ||
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, TXT, DOC, and DOCX files are allowed'));
      }
    }
  });

  // Job Description upload endpoint
  app.post("/api/job-descriptions", upload.single('jobDescription'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.body.userId || 'user-1'; // In production, get from authentication
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Extract text from the uploaded file
      let extractedText = '';
      try {
        if (req.file.mimetype === 'text/plain') {
          extractedText = await fs.readFile(req.file.path, 'utf-8');
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Extract text from DOCX files using mammoth
          const result = await mammoth.extractRawText({ path: req.file.path });
          extractedText = result.value;
        } else if (req.file.mimetype === 'application/msword') {
          // For older DOC files, use mammoth as well
          const result = await mammoth.extractRawText({ path: req.file.path });
          extractedText = result.value;
        } else {
          // For PDF files, would need pdf-parse library
          extractedText = `Uploaded file: ${req.file.originalname}. PDF text extraction requires additional processing.`;
        }
      } catch (error) {
        console.log('Text extraction failed:', error);
        extractedText = `File uploaded successfully. Text extraction failed: ${error}`;
      }

      const jobDescriptionData = {
        userId,
        fileName: req.file.originalname,
        fileUrl,
        extractedText,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      const jobDescription = await storage.createJobDescription(jobDescriptionData);
      res.json(jobDescription);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "File upload failed" });
    }
  });

  // Get job descriptions for a user
  app.get("/api/job-descriptions/user/:userId", async (req, res) => {
    try {
      const jobDescriptions = await storage.getJobDescriptionsByUser(req.params.userId);
      res.json(jobDescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job descriptions" });
    }
  });

  // Get specific job description
  app.get("/api/job-descriptions/:id", async (req, res) => {
    try {
      const jobDescription = await storage.getJobDescription(req.params.id);
      if (!jobDescription) {
        return res.status(404).json({ error: "Job description not found" });
      }
      res.json(jobDescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job description" });
    }
  });

  // Delete job description
  app.delete("/api/job-descriptions/:id", async (req, res) => {
    try {
      const jobDescription = await storage.getJobDescription(req.params.id);
      if (!jobDescription) {
        return res.status(404).json({ error: "Job description not found" });
      }

      // Delete the file from disk
      try {
        const filePath = path.join(process.cwd(), 'uploads', path.basename(jobDescription.fileUrl));
        await fs.unlink(filePath);
      } catch (error) {
        console.log('Failed to delete file:', error);
      }

      await storage.deleteJobDescription(req.params.id);
      res.json({ message: "Job description deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job description" });
    }
  });

  // Re-extract text from job description
  app.post("/api/job-descriptions/:id/extract", async (req, res) => {
    try {
      const jobDescription = await storage.getJobDescription(req.params.id);
      if (!jobDescription) {
        return res.status(404).json({ error: "Job description not found" });
      }

      const filePath = path.join(process.cwd(), 'uploads', path.basename(jobDescription.fileUrl));
      
      let extractedText = '';
      try {
        if (jobDescription.mimeType === 'text/plain') {
          extractedText = await fs.readFile(filePath, 'utf-8');
        } else if (jobDescription.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ path: filePath });
          extractedText = result.value;
        } else if (jobDescription.mimeType === 'application/msword') {
          const result = await mammoth.extractRawText({ path: filePath });
          extractedText = result.value;
        } else {
          return res.status(400).json({ error: "Unsupported file type for extraction" });
        }

        // Update the job description with extracted text
        const updated = await storage.updateJobDescription(req.params.id, { extractedText });
        res.json(updated);
      } catch (error) {
        console.error('Text extraction failed:', error);
        res.status(500).json({ error: "Text extraction failed" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process extraction request" });
    }
  });

  // Note: Static file serving for uploads is handled in index.ts

  // AI feedback generation endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const { responseText, questionText, sessionId } = req.body;
      if (!responseText) {
        return res.status(400).json({ error: "Response text is required" });
      }
      
      // Get session context if provided
      let sessionContext = null;
      if (sessionId) {
        try {
          sessionContext = await storage.getSession(sessionId);
        } catch (error) {
          console.log('Could not fetch session context:', error);
        }
      }
      
      const feedback = await generateFeedback(responseText, questionText, sessionContext);
      res.json({ feedback });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate feedback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// AI feedback generation function using AWS Bedrock

async function generateFeedback(
  responseText: string, 
  questionText?: string,
  sessionContext?: any
) {
  try {
    // Get session details for context
    const interviewStage = sessionContext?.interviewType || 'general';
    const position = sessionContext?.position || '';
    const company = sessionContext?.company || '';
    
    // Get job description if available
    let jobDescriptionText = '';
    if (sessionContext?.jobDescriptionId) {
      try {
        const jobDescription = await storage.getJobDescription(sessionContext.jobDescriptionId);
        jobDescriptionText = jobDescription?.extractedText || '';
      } catch (error) {
        console.log('Could not fetch job description:', error);
      }
    }

    const feedbackRequest = {
      questionText: questionText || 'Interview question',
      responseText,
      interviewStage,
      position,
      company,
      jobDescription: jobDescriptionText
    };

    // Use Bedrock for feedback generation
    const feedbackJson = await generateInterviewFeedback(
      questionText || 'Interview question',
      responseText,
      interviewStage,
      position,
      company,
      jobDescriptionText
    );
    
    // Parse the JSON response from Bedrock
    const parsedFeedback = JSON.parse(feedbackJson);
    
    // Convert to our expected format
    return {
      overall: parsedFeedback.specificFeedback,
      items: [
        ...parsedFeedback.strengths.map((strength: string) => ({
          type: 'positive' as const,
          message: strength
        })),
        ...parsedFeedback.areasForImprovement.map((improvement: string) => ({
          type: 'improvement' as const,
          message: improvement
        }))
      ],
      score: parsedFeedback.overallScore,
      suggestions: [parsedFeedback.actionableAdvice],
      evaluationScores: parsedFeedback.scoreBreakdown
    };
    
  } catch (error) {
    console.error('Error generating feedback:', error);
    
    // Fallback to basic analysis
    return generateBasicFeedback(responseText);
  }
}

// Fallback basic feedback function
function generateBasicFeedback(responseText: string) {
  const feedback = {
    overall: '',
    items: [] as Array<{ type: 'positive' | 'improvement', message: string }>,
    starCompliance: {
      situation: false,
      task: false,
      action: false,
      result: false
    },
    score: 0,
    suggestions: [] as string[],
    evaluationScores: {
      content: 3,
      structure: 3,
      relevance: 3,
      impact: 3,
      communication: 3
    }
  };

  // Simple keyword analysis for STAR framework
  const lowerText = responseText.toLowerCase();
  
  // Situation detection
  if (lowerText.includes('situation') || lowerText.includes('context') || lowerText.includes('challenge') || lowerText.includes('problem')) {
    feedback.starCompliance.situation = true;
    feedback.items.push({
      type: 'positive',
      message: 'Clear situation and context provided'
    });
  }

  // Task detection
  if (lowerText.includes('task') || lowerText.includes('objective') || lowerText.includes('goal') || lowerText.includes('responsible')) {
    feedback.starCompliance.task = true;
    feedback.items.push({
      type: 'positive',
      message: 'Clear task and objective identified'
    });
  }
  
  // Action detection
  if (lowerText.includes('action') || lowerText.includes('did') || lowerText.includes('implemented') || lowerText.includes('decided')) {
    feedback.starCompliance.action = true;
    feedback.items.push({
      type: 'positive',
      message: 'Specific actions and steps described'
    });
  }
  
  // Result detection
  if (lowerText.includes('result') || lowerText.includes('outcome') || lowerText.includes('impact') || lowerText.includes('achieved')) {
    feedback.starCompliance.result = true;
    feedback.items.push({
      type: 'positive',
      message: 'Clear results and outcomes provided'
    });
  }

  // Calculate score based on STAR compliance and response quality
  const starScore = Object.values(feedback.starCompliance).filter(Boolean).length;
  const wordCount = responseText.trim().split(/\s+/).length;
  const lengthScore = Math.min(wordCount / 30, 3); // Up to 3 points for adequate length
  feedback.score = Math.round((starScore * 2 + lengthScore) * 1.2);
  feedback.score = Math.min(Math.max(feedback.score, 1), 10);

  // Add improvement suggestions based on missing STAR elements
  const missingStar = [];
  if (!feedback.starCompliance.situation) missingStar.push('situation/context');
  if (!feedback.starCompliance.task) missingStar.push('task/objective');
  if (!feedback.starCompliance.action) missingStar.push('actions taken');
  if (!feedback.starCompliance.result) missingStar.push('results/outcomes');
  
  if (missingStar.length > 0) {
    feedback.items.push({
      type: 'improvement',
      message: `Consider adding more detail about: ${missingStar.join(', ')}`
    });
  }
  
  if (wordCount < 30) {
    feedback.items.push({
      type: 'improvement',
      message: 'Response could benefit from more detail and specific examples'
    });
  }

  feedback.overall = `Response shows ${starScore > 2 ? 'good' : 'basic'} structure with ${wordCount > 50 ? 'adequate' : 'limited'} detail. Score: ${feedback.score}/10`;
  
  feedback.suggestions = [
    'Use the STAR framework to structure your response',
    'Include specific examples and quantifiable results',
    'Practice articulating your thought process clearly',
    'Focus on your personal contributions and learnings'
  ];

  return feedback;
}
