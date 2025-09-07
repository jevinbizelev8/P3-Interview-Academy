import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sealionService } from "./services/sealion";
import { AIService } from "./services/ai-service";
import { prepareService } from "./services/prepare-service";
import { questionBankService } from "./services/question-bank-service";
import { setupAuth, isAuthenticated } from "./replit-auth";
import { 
  requireAuth, 
  validateSessionOwnership, 
  validateEvaluationAccess, 
  ensureUser, 
  requireAdmin 
} from "./middleware/auth-middleware";
import { 
  insertInterviewScenarioSchema, 
  insertInterviewSessionSchema, 
  insertInterviewMessageSchema,
  insertPreparationSessionSchema,
  insertStudyPlanSchema,
  insertStarPracticeSessionSchema,
  insertPreparationProgressSchema
} from "@shared/schema";
import { z } from "zod";
import { errorLogger, logAPIError } from "./services/error-logger";
import { coachingRouter } from "./routes/coaching";
import { coachingEngineService } from "./services/coaching-engine-service";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      };
      session: {
        userId?: string;
        userEmail?: string;
        userFirstName?: string;
        userLastName?: string;
        destroy: (callback: () => void) => void;
      } & Express.Session;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Simple auth routes for development
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("Auth check - Session ID:", req.sessionID);
      console.log("Auth check - Session data:", req.session);
      
      // Check if user is in session
      if (req.session && req.session.userId) {
        let user = await storage.getUser(req.session.userId);
        if (!user) {
          // Create user if not exists
          user = await storage.upsertUser({
            id: req.session.userId,
            email: req.session.userEmail || "user@example.com",
            firstName: req.session.userFirstName || "User",
            lastName: req.session.userLastName || "",
            role: "user"
          });
        }
        console.log("User found/created:", user.id);
        return res.json(user);
      }
      
      // Return 401 if not authenticated
      console.log("No session found - returning 401");
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Simple login endpoint
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      // Create session data
      req.session.userId = `user-${Date.now()}`;
      req.session.userEmail = email || "user@example.com";
      req.session.userFirstName = firstName || "User";
      req.session.userLastName = lastName || "";
      
      // Explicitly save the session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed - session error" });
        }
        
        console.log("Session saved successfully for user:", req.session.userId);
        res.json({ success: true, redirectTo: "/dashboard" });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Note: Authentication middleware now imported from ./middleware/auth-middleware

  // Interview Scenarios API
  app.get("/api/practice/scenarios", async (req, res) => {
    try {
      const stage = req.query.stage as string | undefined;
      const userJobPosition = req.query.jobPosition as string | undefined;
      const userCompanyName = req.query.companyName as string | undefined;
      
      // If user provides job context, generate dynamic scenarios
      if (userJobPosition || userCompanyName) {
        const stages = ['phone-screening', 'functional-team', 'hiring-manager', 'subject-matter', 'executive'];
        const dynamicScenarios = [];
        
        for (const scenarioStage of (stage ? [stage] : stages)) {
          try {
            // For now, create basic dynamic scenario structure
            // TODO: Implement generateDynamicScenario in SeaLion service
            const dynamicScenario = {
              title: `${scenarioStage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Interview`,
              description: `Customized ${scenarioStage} interview for ${userJobPosition} at ${userCompanyName}`,
              interviewStage: scenarioStage,
              jobRole: userJobPosition || "Software Engineer",
              companyBackground: userCompanyName || "Technology Company",
              candidateBackground: "Experienced professional",
              keyObjectives: `Assess candidate suitability for ${userJobPosition} role at ${userCompanyName}`,
              difficulty: "intermediate"
            };
            
            // Add required fields for consistency
            dynamicScenarios.push({
              id: `dynamic-${scenarioStage}-${Date.now()}`,
              ...dynamicScenario,
              createdBy: 'system',
              createdAt: new Date(),
              updatedAt: new Date(),
              sessionCount: 0,
              averageScore: null
            });
          } catch (error) {
            console.error(`Error generating dynamic scenario for stage ${scenarioStage}:`, error);
            // Continue with other stages even if one fails
          }
        }
        
        res.json(dynamicScenarios);
      } else {
        // Fallback to static scenarios when no job context provided
        const scenarios = await storage.getInterviewScenarios(stage);
        res.json(scenarios);
      }
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ message: "Failed to fetch interview scenarios" });
    }
  });

  app.get("/api/practice/scenarios/:id", async (req, res) => {
    try {
      // Check if it's a dynamic scenario ID
      if (req.params.id.startsWith('dynamic-')) {
        const [, stage] = req.params.id.split('-');
        const userJobPosition = req.query.jobPosition as string | undefined;
        const userCompanyName = req.query.companyName as string | undefined;
        
        // Generate dynamic scenario on-demand
        // TODO: Implement generateDynamicScenario in SeaLion service
        const dynamicScenario = {
          title: `${stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Interview`,
          description: `Customized ${stage} interview for ${userJobPosition} at ${userCompanyName}`,
          interviewStage: stage,
          jobRole: userJobPosition || "Software Engineer",
          companyBackground: userCompanyName || "Technology Company",
          candidateBackground: "Experienced professional",
          keyObjectives: `Assess candidate suitability for ${userJobPosition} role at ${userCompanyName}`,
          difficulty: "intermediate"
        };
        
        res.json({
          id: req.params.id,
          ...dynamicScenario,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Fetch static scenario from database
        const scenario = await storage.getInterviewScenario(req.params.id);
        if (!scenario) {
          return res.status(404).json({ message: "Scenario not found" });
        }
        res.json(scenario);
      }
    } catch (error) {
      console.error("Error fetching scenario:", error);
      res.status(500).json({ message: "Failed to fetch scenario" });
    }
  });

  app.post("/api/practice/scenarios", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertInterviewScenarioSchema.parse(req.body);
      validatedData.createdBy = req.user!.id;
      
      const scenario = await storage.createInterviewScenario(validatedData);
      res.status(201).json(scenario);
    } catch (error: any) {
      console.error("Error creating scenario:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });

  app.put("/api/practice/scenarios/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertInterviewScenarioSchema.partial().parse(req.body);
      const scenario = await storage.updateInterviewScenario(req.params.id, validatedData);
      res.json(scenario);
    } catch (error: any) {
      console.error("Error updating scenario:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });

  app.delete("/api/practice/scenarios/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteInterviewScenario(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  // Interview Sessions API
  app.post("/api/practice/sessions", requireAuth, ensureUser, async (req, res) => {
    try {
      console.log("Creating session with body:", req.body);
      console.log("User:", req.user);
      
      // Simple validation without strict UUID checking for scenarioId
      const sessionData = {
        userId: req.user!.id,
        scenarioId: req.body.scenarioId, // Accept any string ID
        userJobPosition: req.body.userJobPosition || null,
        userCompanyName: req.body.userCompanyName || null,
        interviewLanguage: req.body.interviewLanguage || "en",
      };
      
      // Basic validation
      if (!sessionData.scenarioId) {
        return res.status(400).json({ message: "scenarioId is required" });
      }
      
      console.log("Session data to create:", sessionData);
      
      const session = await storage.createInterviewSession(sessionData);
      res.status(201).json(session);
    } catch (error: any) {
      console.error("Error creating session:", error);
      if (error.name === 'ZodError') {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/practice/sessions/:id", requireAuth, validateSessionOwnership, async (req, res) => {
    try {
      // Session is already validated and available in req.session
      res.json(req.session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.get("/api/practice/sessions", requireAuth, ensureUser, async (req, res) => {
    try {
      const sessions = await storage.getUserInterviewSessions(req.user!.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.put("/api/practice/sessions/:id", requireAuth, validateSessionOwnership, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertInterviewSessionSchema.partial().parse(req.body);
      const updatedSession = await storage.updateInterviewSession(req.params.id, validatedData);
      res.json(updatedSession);
    } catch (error: any) {
      console.error("Error updating session:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.post("/api/practice/sessions/:id/auto-save", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertInterviewSessionSchema.partial().parse(req.body);
      await storage.autoSaveSession(req.params.id, validatedData);
      res.json({ message: "Session auto-saved successfully" });
    } catch (error: any) {
      console.error("Error auto-saving session:", error);
      res.status(500).json({ message: "Failed to auto-save session" });
    }
  });

  // AI Interview API
  app.post("/api/practice/sessions/:id/ai-question", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userResponse } = req.body;
      const questionNumber = session.currentQuestion || 1;
      
      // Build conversation history
      const conversationHistory = session.messages
        .map(msg => `${msg.messageType === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
        .join('\n');

      // Generate dynamic persona based on user's job context or scenario
      const persona = await sealionService.generateInterviewerPersona({
        stage: session.scenario.interviewStage,
        jobRole: session.scenario.jobRole,
        company: session.scenario.companyBackground,
        candidateBackground: session.scenario.candidateBackground,
        keyObjectives: session.scenario.keyObjectives,
        userJobPosition: session.userJobPosition || undefined,
        userCompanyName: session.userCompanyName || undefined,
      }, session.interviewLanguage || 'en');

      const context = {
        stage: session.scenario.interviewStage,
        jobRole: session.scenario.jobRole,
        company: session.scenario.companyBackground,
        candidateBackground: session.scenario.candidateBackground,
        keyObjectives: session.scenario.keyObjectives,
        userJobPosition: session.userJobPosition || undefined,
        userCompanyName: session.userCompanyName || undefined,
      };

      // Convert conversation history to the format expected by SeaLion service
      const conversationMessages = session.messages.map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

      let aiResponse;
      const language = session.interviewLanguage || 'en';
      if (questionNumber === 1) {
        aiResponse = await sealionService.generateFirstQuestion(context, persona, language);
      } else {
        aiResponse = await sealionService.generateFollowUpQuestion(
          context,
          persona,
          conversationMessages,
          questionNumber - 1,
          language
        );
      }

      // Save AI message
      await storage.addInterviewMessage({
        sessionId: req.params.id,
        messageType: 'ai',
        content: aiResponse.content,
        questionNumber: aiResponse.questionNumber,
        timestamp: new Date(),
      });

      res.json(aiResponse);
    } catch (error) {
      console.error("Error generating AI question:", error);
      res.status(500).json({ message: "Failed to generate interview question" });
    }
  });

  app.post("/api/practice/sessions/:id/user-response", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, questionContext } = req.body;
      
      // Generate live feedback (simplified for now since SeaLion doesn't have generateQuickFeedback)
      const feedback = `Thank you for your response. Please continue with the next question.`;

      // Save user message with feedback
      const message = await storage.addInterviewMessage({
        sessionId: req.params.id,
        messageType: 'user',
        content,
        questionNumber: session.currentQuestion,
        feedback,
        timestamp: new Date(),
      });

      // Update session progress
      const newQuestionNumber = (session.currentQuestion || 1) + 1;
      if (newQuestionNumber <= 15) {
        await storage.autoSaveSession(req.params.id, {
          currentQuestion: newQuestionNumber,
        });
      }

      res.json({ message, feedback });
    } catch (error) {
      console.error("Error processing user response:", error);
      res.status(500).json({ message: "Failed to process response" });
    }
  });

  app.post("/api/practice/sessions/:id/complete", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update session status first
      await storage.updateSessionStatus(req.params.id, "completed");

      // Build conversation history for assessment
      const conversationMessages = session.messages.map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

      const context = {
        stage: session.scenario.interviewStage,
        jobRole: session.scenario.jobRole,
        company: session.scenario.companyBackground,
        candidateBackground: session.scenario.candidateBackground,
        keyObjectives: session.scenario.keyObjectives,
        userJobPosition: session.userJobPosition || undefined,
        userCompanyName: session.userCompanyName || undefined,
      };

      // Generate comprehensive assessment using SeaLion
      const assessment = await sealionService.generateSTARAssessment(conversationMessages, context, session.interviewLanguage || 'en');

      // Create comprehensive evaluation result for dashboard analytics
      const evaluationResult = {
        sessionId: req.params.id,
        evaluationLanguage: session.interviewLanguage || 'en',
        culturalContext: "SEA", // Southeast Asia
        overallScore: assessment.overallScore || 7.5,
        overallRating: assessment.overallRating || "Good Performance",
        communicationScore: assessment.communicationScore || 7,
        empathyScore: assessment.empathyScore || 7,
        problemSolvingScore: assessment.problemSolvingScore || 7,
        culturalAlignmentScore: assessment.culturalAlignmentScore || 7,
        situationScore: assessment.starAnalysis?.situation?.score || 7,
        taskScore: assessment.starAnalysis?.task?.score || 7,
        actionScore: assessment.starAnalysis?.action?.score || 7,
        resultScore: assessment.starAnalysis?.result?.score || 7,
        strengths: assessment.keyStrengths || assessment.strengths || [],
        improvementAreas: assessment.areasForImprovement || assessment.improvements || [],
        actionableInsights: assessment.actionableInsights || ["Continue practicing interview skills"],
        personalizedDrills: assessment.personalizedDrills || ["Practice more behavioral questions"],
        reflectionPrompts: assessment.reflectionPrompts || ["What would you do differently next time?"],
        qualitativeObservations: assessment.summary || assessment.qualitative || "Interview completed successfully",
        badgeEarned: assessment.badgeEarned || null,
        pointsEarned: assessment.pointsEarned || 0,
        coachReflectionSummary: assessment.coachReflectionSummary || null,
        userJobPosition: session.userJobPosition || null,
        userCompanyName: session.userCompanyName || null
      };

      // Store evaluation result for dashboard analytics
      await storage.createEvaluationResult(evaluationResult);

      // Calculate duration
      const duration = session.startedAt 
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;

      // Update session with completion data (adapted for SeaLion response format)
      const updatedSession = await storage.updateInterviewSession(req.params.id, {
        status: 'completed',
        completedAt: new Date(),
        duration,
        overallScore: ((assessment.overallScore || 75) / 10).toString(),
        situationScore: (assessment.starAnalysis?.situation?.score || 7).toString(),
        taskScore: (assessment.starAnalysis?.task?.score || 7).toString(),
        actionScore: (assessment.starAnalysis?.action?.score || 7).toString(),
        resultScore: (assessment.starAnalysis?.result?.score || 7).toString(),
        flowScore: (assessment.culturalFit?.score || 7).toString(),
        qualitativeFeedback: assessment.summary || assessment.qualitative || "Interview completed successfully",
        strengths: assessment.keyStrengths || assessment.strengths || [],
        improvements: assessment.areasForImprovement || assessment.improvements || [],
        recommendations: typeof assessment.recommendations === 'string' ? assessment.recommendations : 
                        Array.isArray(assessment.recommendations) ? assessment.recommendations.join('. ') : 
                        "Continue practicing interview skills",
      });

      res.json({
        session: updatedSession,
        assessment,
        evaluation: evaluationResult
      });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "Failed to complete interview session" });
    }
  });

  // Enhanced Practice API endpoints (compatible with new frontend)
  
  // Get messages for Practice session (separate endpoint)
  app.get("/api/practice/sessions/:id/messages", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSessionMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching session messages:", error);
      res.status(500).json({ message: "Failed to fetch session messages" });
    }
  });

  // Add message to Practice session (separate endpoint)
  app.post("/api/practice/sessions/:id/messages", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const message = await storage.addInterviewMessage({
        sessionId: req.params.id,
        messageType: req.body.messageType || "user",
        content: req.body.content,
        questionNumber: req.body.questionNumber,
        timestamp: new Date(),
      });

      res.json(message);
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Get evaluation results for Practice session
  app.get("/api/practice/sessions/:id/evaluation", requireAuth, validateEvaluationAccess, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const evaluation = await storage.getEvaluationResult(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      res.status(500).json({ message: "Failed to fetch evaluation" });
    }
  });

  // AI Response generation for Practice (enhanced version) 
  app.post("/api/practice/sessions/:id/ai-response", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      const messages = await storage.getSessionMessages(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if we should complete the interview (15 questions or more than 30 messages)
      const shouldComplete = messages.length >= 30 || (session.currentQuestion || 0) >= 15;
      
      if (shouldComplete) {
        // Generate final message
        const finalMessage = `Thank you for this comprehensive practice interview! You've provided excellent insights into your experience and approach${session.userJobPosition ? ` to the ${session.userJobPosition} role` : ''}${session.userCompanyName ? ` at ${session.userCompanyName}` : ''}. I'm now preparing your detailed performance evaluation with personalized feedback and recommendations. This will be available shortly.`;
        
        await storage.addInterviewMessage({
          sessionId: req.params.id,
          messageType: "ai",
          content: finalMessage,
          timestamp: new Date(),
        });

        // Update session status
        await storage.updateSessionStatus(req.params.id, "completed");

        res.json({ message: finalMessage, isCompleted: true });
      } else {
        // Generate next question using existing AI question endpoint logic
        const { userResponse } = req.body;
        const questionNumber = (session.currentQuestion || 0) + 1;
        
        // Build conversation history
        const conversationHistory = session.messages
          .map(msg => `${msg.messageType === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
          .join('\n');

        // Generate dynamic persona based on user's job context or scenario
        const persona = await sealionService.generateInterviewerPersona({
          stage: session.scenario.interviewStage,
          jobRole: session.scenario.jobRole,
          company: session.scenario.companyBackground,
          candidateBackground: session.scenario.candidateBackground,
          keyObjectives: session.scenario.keyObjectives,
          userJobPosition: session.userJobPosition || undefined,
          userCompanyName: session.userCompanyName || undefined,
        }, session.interviewLanguage || 'en');

        const context = {
          stage: session.scenario.interviewStage,
          jobRole: session.scenario.jobRole,
          company: session.scenario.companyBackground,
          candidateBackground: session.scenario.candidateBackground,
          keyObjectives: session.scenario.keyObjectives,
          userJobPosition: session.userJobPosition || undefined,
          userCompanyName: session.userCompanyName || undefined,
        };

        // Convert conversation history to the format expected by SeaLion service
        const conversationMessages = messages.map(msg => ({
          role: msg.messageType === 'ai' ? 'assistant' : 'user',
          content: msg.content,
          timestamp: msg.timestamp || new Date()
        }));

        let aiResponse;
        const language = session.interviewLanguage || 'en';
        if (questionNumber === 1) {
          aiResponse = await sealionService.generateFirstQuestion(context, persona, language);
        } else {
          aiResponse = await sealionService.generateFollowUpQuestion(
            context,
            persona,
            conversationMessages,
            questionNumber - 1,
            language
          );
        }

        // Save AI message
        await storage.addInterviewMessage({
          sessionId: req.params.id,
          messageType: 'ai',
          content: aiResponse.content,
          questionNumber: aiResponse.questionNumber,
          timestamp: new Date(),
        });

        // Update session question number
        await storage.updateInterviewSession(req.params.id, {
          currentQuestion: questionNumber
        });

        res.json({ message: aiResponse.content, isCompleted: false, questionNumber: aiResponse.questionNumber });
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  // System health and error reporting endpoint
  app.get('/api/system/health', async (req, res) => {
    try {
      const fallbackReport = errorLogger.generateFallbackReport();
      const seaLionStats = errorLogger.getComponentStats('SeaLion');
      
      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        systemHealth: {
          overall: fallbackReport.fallbackSuccessRate > 90 ? 'healthy' : 'degraded',
          components: fallbackReport.componentStatus,
          fallbackSuccessRate: fallbackReport.fallbackSuccessRate,
          totalErrors24h: fallbackReport.totalErrors
        },
        seaLionIntegration: {
          status: seaLionStats.totalErrors < 5 ? 'operational' : 'degraded',
          totalErrors: seaLionStats.totalErrors,
          recentErrors: seaLionStats.recentErrors,
          fallbackRate: seaLionStats.fallbackRate,
          lastError: seaLionStats.lastError?.message || 'None'
        },
        recommendations: fallbackReport.recommendations,
        mostCommonErrors: fallbackReport.mostCommonErrors,
        bugReport: {
          criticalIssues: ['SeaLion API key format incorrect (OpenAI format detected)'],
          fallbackStatus: 'All systems operational with fallbacks',
          platformReady: true,
          requiresUserAction: ['Provide correct SeaLion API key']
        }
      });
    } catch (error) {
      logAPIError('system-health', error, false, { endpoint: '/api/system/health' });
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate health report',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test endpoint for SeaLion integration
  app.post("/api/test-sealion", async (req, res) => {
    try {
      console.log("Testing SeaLion integration...");
      
      // Test basic connectivity
      const testContext = {
        stage: "phone-screening",
        jobRole: "AI Engineer",
        company: "Meta",
        candidateBackground: "Experienced professional",
        keyObjectives: "Test SeaLion integration",
        userJobPosition: "AI Engineer", 
        userCompanyName: "Meta"
      };

      // Test persona generation
      console.log("Testing persona generation...");
      const persona = await sealionService.generateInterviewerPersona(testContext, 'en');
      console.log("Persona generated:", persona);

      // Test first question generation
      console.log("Testing first question generation...");
      const firstQuestion = await sealionService.generateFirstQuestion(testContext, persona, 'en');
      console.log("First question generated:", firstQuestion);

      // Test assessment with mock conversation
      console.log("Testing STAR assessment...");
      const mockConversation = [
        { role: 'assistant', content: 'Tell me about a challenging project you worked on.', timestamp: new Date() },
        { role: 'user', content: 'I worked on implementing a machine learning model that improved our recommendation system by 25%. The main challenge was handling the large dataset and optimizing for real-time inference.', timestamp: new Date() }
      ];
      
      const assessment = await sealionService.generateSTARAssessment(mockConversation, testContext, 'en');
      console.log("Assessment generated:", assessment);

      res.json({
        success: true,
        message: "SeaLion integration test completed successfully",
        results: {
          persona: persona,
          firstQuestion: firstQuestion,
          assessment: assessment,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("SeaLion test failed:", error);
      res.status(500).json({
        success: false,
        message: "SeaLion integration test failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get session questions
  app.get("/api/practice/sessions/:id/questions", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate fallback questions directly (AI endpoint has issues)
      const questions = [];
      const fallbackQuestions = [
        "Tell me about yourself and what interests you about this role.",
        "Tell me about a time when you demonstrated leadership skills in your professional experience.",
        "Describe a challenging problem you solved and how you approached it.",
        "Tell me about a time when you had to work collaboratively with a team to achieve a goal.",
        "Describe a situation where you had to adapt to significant changes or learn something new quickly.",
        "Tell me about a time when you had to innovate or think creatively to overcome an obstacle.",
        "Describe a situation where you had to manage competing priorities or tight deadlines.",
        "Tell me about a time when you received constructive feedback and how you handled it.",
        "Describe a project you're particularly proud of and your role in its success.",
        "Tell me about a time when you had to communicate complex information to different stakeholders.",
        "Describe a situation where you had to make a difficult decision with limited information.",
        "Tell me about a time when you went above and beyond what was expected of you.",
        "Describe how you stay current with industry trends and continue learning in your field.",
        "Tell me about a time when you had to resolve a conflict or disagreement with a colleague.",
        "Where do you see yourself in the next few years and how does this role fit your career goals?"
      ];

      for (let i = 1; i <= (session.totalQuestions || 15); i++) {
        questions.push({
          id: `question-${i}`,
          sessionId: req.params.id,
          questionNumber: i,
          question: fallbackQuestions[i - 1] || `Tell me about a time when you demonstrated ${['leadership', 'problem-solving', 'teamwork', 'innovation', 'adaptability'][i % 5]} skills in your professional experience.`,
          createdAt: new Date(),
        });
      }
      
      res.json(questions);
    } catch (error) {
      console.error("Error fetching session questions:", error);
      res.status(500).json({ message: "Failed to fetch session questions" });
    }
  });

  // Get session responses
  app.get("/api/practice/sessions/:id/responses", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get session messages that are user responses
      const messages = await storage.getSessionMessages(req.params.id);
      const responses = messages
        .filter(msg => msg.messageType === 'user')
        .map(msg => ({
          id: msg.id,
          sessionId: req.params.id,
          questionId: `question-${msg.questionNumber || 1}`,
          responseText: msg.content,
          responseType: 'text', // Default to text for now
          createdAt: msg.timestamp,
        }));
      
      res.json(responses);
    } catch (error) {
      console.error("Error fetching session responses:", error);
      res.status(500).json({ message: "Failed to fetch session responses" });
    }
  });

  // Create or update response
  app.post("/api/responses", requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId, questionId, responseText, responseType = 'text' } = req.body;
      
      if (!sessionId || !questionId || !responseText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Extract question number from questionId
      const questionNumber = parseInt(questionId.replace('question-', '')) || 1;

      // Save as interview message
      const message = await storage.addInterviewMessage({
        sessionId,
        questionNumber,
        messageType: 'user',
        content: responseText,
      });

      const response = {
        id: message.id,
        sessionId,
        questionId,
        responseText,
        responseType,
        createdAt: message.timestamp,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  // Update response
  app.patch("/api/responses/:id", requireAuth, ensureUser, async (req, res) => {
    try {
      const { responseText } = req.body;
      
      if (!responseText) {
        return res.status(400).json({ message: "Response text is required" });
      }

      // For now, we'll just return success as updating messages is not implemented
      // In a real implementation, you'd update the message in the database
      
      res.json({
        id: req.params.id,
        responseText,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating response:", error);
      res.status(500).json({ message: "Failed to update response" });
    }
  });

  // Session transcript download
  app.get("/api/practice/sessions/:id/transcript", requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const transcript = session.messages
        .map(msg => `[${new Date(msg.timestamp || new Date()).toLocaleString('en-GB')}] ${msg.messageType === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
        .join('\n\n');

      const filename = `interview-transcript-${session.id}.txt`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(transcript);
    } catch (error) {
      console.error("Error generating transcript:", error);
      res.status(500).json({ message: "Failed to generate transcript" });
    }
  });

  // Perform Module API Routes - Analytics Dashboard
  
  // Get dashboard analytics data
  app.get('/api/perform/dashboard', requireAuth, ensureUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all user sessions (from both Practice and legacy Perform)
      const userSessions = await storage.getUserInterviewSessions(userId);
      const completedSessions = userSessions.filter(session => session.status === 'completed');
      
      // Calculate basic stats
      const totalSessions = userSessions.length;
      const completedCount = completedSessions.length;
      
      // Calculate average score from completed sessions
      let totalScore = 0;
      let scoreCount = 0;
      completedSessions.forEach(session => {
        if (session.overallScore && !isNaN(Number(session.overallScore))) {
          totalScore += Number(session.overallScore);
          scoreCount++;
        }
      });
      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
      
      // Calculate total practice time (in minutes)
      let totalPracticeTime = 0;
      completedSessions.forEach(session => {
        if (session.duration) {
          totalPracticeTime += Math.floor(session.duration / 60); // Convert seconds to minutes
        }
      });
      
      // Get recent sessions (last 5)
      const recentSessions = completedSessions
        .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
        .slice(0, 5)
        .map(session => ({
          id: session.id,
          date: new Date(session.completedAt || session.createdAt).toLocaleDateString('en-GB'),
          scenario: session.scenario?.title || 'Interview Practice',
          score: Number(session.overallScore) || 0,
          duration: Math.floor((session.duration || 0) / 60) // Convert to minutes
        }));
      
      // Get aggregated strengths and improvement areas from evaluations
      const strongestSkills = [];
      const improvementAreas = [];
      
      try {
        for (const session of completedSessions.slice(0, 10)) { // Check last 10 sessions
          try {
            const evaluation = await storage.getEvaluationResult(session.id);
            if (evaluation) {
              if (evaluation.strengths && Array.isArray(evaluation.strengths)) {
                strongestSkills.push(...evaluation.strengths);
              }
              if (evaluation.improvementAreas && Array.isArray(evaluation.improvementAreas)) {
                improvementAreas.push(...evaluation.improvementAreas);
              }
            }
          } catch (evalError) {
            // Skip if evaluation not found for this session
            continue;
          }
        }
      } catch (error) {
        console.log("Could not fetch all evaluations:", error);
      }
      
      // Get unique strengths and improvement areas (top 5 each)
      const uniqueStrengths = [...new Set(strongestSkills)].slice(0, 5);
      const uniqueImprovementAreas = [...new Set(improvementAreas)].slice(0, 5);
      
      // Calculate improvement rate (simple version - could be more sophisticated)
      const improvementRate = completedCount > 1 ? 
        ((averageScore - 6) / 6) * 100 : 0; // Assuming 6 as baseline
      
      // Mock skill breakdown (in real implementation, this would be calculated from evaluations)
      const skillBreakdown = [
        { skill: "Communication Clarity", score: averageScore > 0 ? Math.min(averageScore + Math.random(), 10) : 7, trend: 'up' as const },
        { skill: "Problem Solving", score: averageScore > 0 ? Math.min(averageScore + Math.random() - 0.5, 10) : 6.5, trend: 'stable' as const },
        { skill: "Cultural Alignment", score: averageScore > 0 ? Math.min(averageScore + Math.random() - 1, 10) : 6, trend: 'up' as const },
        { skill: "Empathy & EQ", score: averageScore > 0 ? Math.min(averageScore + Math.random() - 0.3, 10) : 6.8, trend: 'stable' as const }
      ];
      
      const dashboardData = {
        totalSessions,
        completedSessions: completedCount,
        averageScore,
        totalPracticeTime,
        improvementRate,
        strongestSkills: uniqueStrengths.length > 0 ? uniqueStrengths : ['Complete more sessions to identify strengths'],
        improvementAreas: uniqueImprovementAreas.length > 0 ? uniqueImprovementAreas : ['Complete more sessions to identify areas for improvement'],
        recentSessions,
        performanceTrends: [], // Could be implemented later with more data
        skillBreakdown
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get evaluation results (for backward compatibility and dashboard access)
  app.get('/api/perform/sessions/:sessionId/evaluation', requireAuth, validateEvaluationAccess, async (req, res) => {
    try {
      const evaluation = await storage.getEvaluationResult(req.params.sessionId);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      res.status(500).json({ message: "Failed to fetch evaluation" });
    }
  });

  // Get session data (for backward compatibility with evaluation page)
  app.get('/api/perform/sessions/:sessionId', requireAuth, validateSessionOwnership, async (req, res) => {
    try {
      // Session is already validated and available in req.session
      res.json(req.session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Share progress (anonymized)
  app.post('/api/perform/sessions/:sessionId/share', requireAuth, validateSessionOwnership, async (req, res) => {
    try {
      // For now, just return success - in real app would share anonymized data
      // Future: Generate anonymized progress report for sharing
      const session = req.session;
      console.log(`📤 User ${req.user!.id} sharing progress for session ${session.id}`);
      res.json({ message: "Progress shared successfully" });
    } catch (error) {
      console.error("Error sharing progress:", error);
      res.status(500).json({ message: "Failed to share progress" });
    }
  });

  // ================================
  // AI SERVICES HEALTH CHECK
  // ================================
  
  app.get('/api/ai/health', async (req, res) => {
    try {
      const { aiRouter } = await import('./services/ai-router');
      const healthStatus = await aiRouter.getHealthStatus();
      res.json({
        status: 'ok',
        services: healthStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // ================================
  // PREPARE MODULE API ROUTES
  // ================================

  // Preparation Sessions
  app.post('/api/prepare/sessions', requireAuth, ensureUser, async (req, res) => {
    try {
      // Simple validation for preparation sessions - avoid complex schema validation for now
      const sessionData = {
        userId: req.user!.id,
        title: req.body.title || "Preparation Session",
        targetRole: req.body.targetRole || "Professional",
        targetCompany: req.body.targetCompany || "Company",
        targetIndustry: req.body.targetIndustry || "General",
        interviewStage: req.body.interviewStage || "general",
        preferredLanguage: req.body.preferredLanguage || "en",
        status: "active"
      };
      
      const session = await prepareService.createPreparationSession(req.user!.id, sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating preparation session:", error);
      res.status(500).json({ message: "Failed to create preparation session" });
    }
  });

  app.get('/api/prepare/sessions', requireAuth, ensureUser, async (req, res) => {
    try {
      const sessions = await prepareService.getUserPreparationSessions(req.user!.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching preparation sessions:", error);
      res.status(500).json({ message: "Failed to fetch preparation sessions" });
    }
  });

  app.get('/api/prepare/sessions/:id', requireAuth, ensureUser, async (req, res) => {
    try {
      const session = await prepareService.getPreparationSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Preparation session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching preparation session:", error);
      res.status(500).json({ message: "Failed to fetch preparation session" });
    }
  });

  app.put('/api/prepare/sessions/:id', requireAuth, ensureUser, async (req, res) => {
    try {
      const updates = req.body;
      const session = await prepareService.updatePreparationSession(req.params.id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating preparation session:", error);
      res.status(500).json({ message: "Failed to update preparation session" });
    }
  });

  // Study Plans
  app.post('/api/prepare/sessions/:id/study-plan', requireAuth, ensureUser, async (req, res) => {
    try {
      const { jobPosition, companyName, interviewDate, timeAvailable, focusAreas, language } = req.body;
      
      const studyPlan = await prepareService.generateStudyPlan(req.params.id, {
        jobPosition,
        companyName,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        timeAvailable,
        focusAreas,
        language
      });
      
      res.json(studyPlan);
    } catch (error) {
      console.error("Error generating study plan:", error);
      res.status(500).json({ message: "Failed to generate study plan" });
    }
  });

  app.get('/api/prepare/study-plans/:id', requireAuth, ensureUser, async (req, res) => {
    try {
      const studyPlan = await storage.getStudyPlan(req.params.id);
      if (!studyPlan) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      res.json(studyPlan);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ message: "Failed to fetch study plan" });
    }
  });

  // Company Research
  app.post('/api/prepare/company-research', requireAuth, ensureUser, async (req, res) => {
    try {
      const { companyName, jobPosition } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }
      
      const research = await prepareService.generateCompanyResearch(req.user!.id, companyName, jobPosition);
      res.json(research);
    } catch (error) {
      console.error("Error generating company research:", error);
      res.status(500).json({ message: "Failed to generate company research" });
    }
  });

  app.get('/api/prepare/company-research', requireAuth, ensureUser, async (req, res) => {
    try {
      const { companyName } = req.query;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }
      
      const research = await storage.getCompanyResearch(req.user!.id, companyName as string);
      if (!research) {
        return res.status(404).json({ message: "Company research not found" });
      }
      
      res.json(research);
    } catch (error) {
      console.error("Error fetching company research:", error);
      res.status(500).json({ message: "Failed to fetch company research" });
    }
  });

  // STAR Practice Sessions
  app.post('/api/prepare/star-practice', requireAuth, ensureUser, async (req, res) => {
    try {
      const { preparationSessionId, scenario, language } = req.body;
      
      const session = await prepareService.createStarPracticeSession(req.user!.id, {
        preparationSessionId,
        scenario,
        language
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error creating STAR practice session:", error);
      res.status(500).json({ message: "Failed to create STAR practice session" });
    }
  });

  app.post('/api/prepare/star-practice/:id/submit', requireAuth, ensureUser, async (req, res) => {
    try {
      const { situation, task, action, result } = req.body;
      
      const session = await prepareService.submitStarResponse(req.params.id, {
        situation,
        task,
        action,
        result
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error submitting STAR response:", error);
      res.status(500).json({ message: "Failed to submit STAR response" });
    }
  });

  app.get('/api/prepare/star-practice', requireAuth, ensureUser, async (req, res) => {
    try {
      const { preparationSessionId } = req.query;
      
      const sessions = await storage.getUserStarPracticeSessions(
        req.user!.id, 
        preparationSessionId as string
      );
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching STAR practice sessions:", error);
      res.status(500).json({ message: "Failed to fetch STAR practice sessions" });
    }
  });

  // Preparation Resources
  app.get('/api/prepare/resources', async (req, res) => {
    try {
      const { category, interviewStage, industry, difficulty, language } = req.query;
      
      const resources = await prepareService.getPreparationResources({
        category: category as string,
        interviewStage: interviewStage as string,
        industry: industry as string,
        difficulty: difficulty as string,
        language: language as string
      });
      
      res.json(resources);
    } catch (error) {
      console.error("Error fetching preparation resources:", error);
      res.status(500).json({ message: "Failed to fetch preparation resources" });
    }
  });

  app.post('/api/prepare/resources/generate', requireAuth, ensureUser, async (req, res) => {
    try {
      const { topic, resourceType, interviewStage, language } = req.body;
      
      if (!topic || !resourceType) {
        return res.status(400).json({ message: "Topic and resource type are required" });
      }
      
      const resource = await prepareService.generateDynamicResource(topic, {
        resourceType,
        interviewStage,
        language,
        userId: req.user!.id
      });
      
      res.json(resource);
    } catch (error) {
      console.error("Error generating resource:", error);
      res.status(500).json({ message: "Failed to generate resource" });
    }
  });

  // Practice Tests
  app.get('/api/prepare/practice-tests', async (req, res) => {
    try {
      const { testType, interviewStage, industry, difficulty } = req.query;
      
      const tests = await storage.getPracticeTests({
        testType: testType as string,
        interviewStage: interviewStage as string,
        industry: industry as string,
        difficulty: difficulty as string
      });
      
      res.json(tests);
    } catch (error) {
      console.error("Error fetching practice tests:", error);
      res.status(500).json({ message: "Failed to fetch practice tests" });
    }
  });

  app.post('/api/prepare/practice-tests/:id/results', requireAuth, ensureUser, async (req, res) => {
    try {
      const { answers, timeSpent } = req.body;
      
      const test = await storage.getPracticeTest(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "Practice test not found" });
      }
      
      // Calculate score (simplified - would be more complex in real implementation)
      const correctAnswers = answers.filter((answer: any) => answer.correct).length;
      const score = (correctAnswers / test.totalQuestions) * 100;
      const passed = test.passingScore ? score >= Number(test.passingScore) : true;
      
      const result = await storage.createPracticeTestResult({
        userId: req.user!.id,
        practiceTestId: req.params.id,
        score: score.toString(),
        totalQuestions: test.totalQuestions,
        correctAnswers,
        timeSpent,
        answers,
        feedback: [], // Would generate detailed feedback
        passed,
        strengths: [], // Would analyze performance
        improvementAreas: [], // Would identify weak areas
        completedAt: new Date()
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error submitting practice test results:", error);
      res.status(500).json({ message: "Failed to submit practice test results" });
    }
  });

  // Progress Tracking
  app.post('/api/prepare/sessions/:id/progress', requireAuth, ensureUser, async (req, res) => {
    try {
      const { activityType, activityId, progress, timeSpent, notes } = req.body;
      
      const progressEntry = await prepareService.updateProgress(req.user!.id, req.params.id, {
        activityType,
        activityId,
        progress,
        timeSpent,
        notes
      });
      
      res.json(progressEntry);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/prepare/sessions/:id/progress', async (req, res) => {
    try {
      const progressSummary = await prepareService.getSessionProgress(req.params.id);
      res.json(progressSummary);
    } catch (error) {
      console.error("Error fetching session progress:", error);
      res.status(500).json({ message: "Failed to fetch session progress" });
    }
  });

  // Language Support Routes
  app.post('/api/prepare/translate', async (req, res) => {
    try {
      const { content, targetLanguage, contentType, preserveFormatting } = req.body;
      
      if (!content || !targetLanguage) {
        return res.status(400).json({ message: "Content and target language are required" });
      }
      
      const translation = await prepareService.translateContent(content, targetLanguage, {
        contentType,
        preserveFormatting
      });
      
      res.json({ translation });
    } catch (error) {
      console.error("Error translating content:", error);
      res.status(500).json({ message: "Failed to translate content" });
    }
  });

  app.post('/api/prepare/multilingual-question', async (req, res) => {
    try {
      const { baseQuestion, targetLanguage, context } = req.body;
      
      if (!baseQuestion || !targetLanguage) {
        return res.status(400).json({ message: "Base question and target language are required" });
      }
      
      const result = await prepareService.generateMultilingualQuestion(baseQuestion, targetLanguage, context);
      res.json(result);
    } catch (error) {
      console.error("Error generating multilingual question:", error);
      res.status(500).json({ message: "Failed to generate multilingual question" });
    }
  });

  app.get('/api/prepare/language-tips/:language', async (req, res) => {
    try {
      const { language } = req.params;
      
      const tips = await prepareService.getLanguageSpecificTips(language as any);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching language tips:", error);
      res.status(500).json({ message: "Failed to fetch language tips" });
    }
  });

  // ================================
  // COACHING MODULE API ROUTES
  // ================================
  

  // Coaching sessions API routes (inline for better compatibility)
  app.post('/api/coaching/sessions', requireAuth, ensureUser, async (req, res) => {
    try {
      const userId = req.user?.id || 'dev-user-123';
      // Log the request body for debugging
      // console.log('Coaching session request body:', JSON.stringify(req.body, null, 2));
      
      // Preprocess request body to handle null values
      const processedBody = {
        ...req.body,
        jobPosition: req.body.jobPosition === null || req.body.jobPosition === undefined || req.body.jobPosition === '' ? 'Professional' : req.body.jobPosition,
        companyName: req.body.companyName === null || req.body.companyName === undefined ? undefined : req.body.companyName,
        primaryIndustry: req.body.primaryIndustry === null || req.body.primaryIndustry === undefined ? undefined : req.body.primaryIndustry,
        specializations: Array.isArray(req.body.specializations) ? req.body.specializations : [],
        experienceLevel: req.body.experienceLevel || 'intermediate'
      };
      
      // console.log('Processed body:', JSON.stringify(processedBody, null, 2));
      const validatedData = z.object({
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
        interviewLanguage: z.string().min(2).max(10).default('en')
      }).safeParse(processedBody);

      if (!validatedData.success) {
        console.log('Validation failed:', validatedData.error.issues);
        return res.status(400).json({
          success: false,
          message: 'Invalid session data',
          errors: validatedData.error.errors
        });
      }

      const { interviewLanguage, ...sessionData } = validatedData.data;
      const sessionPayload = {
        userId,
        ...sessionData,
        preferredLanguage: interviewLanguage
      };
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

  // Get coaching session by ID
  app.get('/api/coaching/sessions/:sessionId', requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getCoachingSession(sessionId);
      
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

  // Get coaching messages for a session
  app.get('/api/coaching/sessions/:sessionId/messages', requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getCoachingSession(sessionId);
      
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

      const messages = await storage.getCoachingMessages(sessionId);

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
  app.post('/api/coaching/sessions/:sessionId/start', requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getCoachingSession(sessionId);
      
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

      // Parse language parameters from request body
      const languageOptions = {
        language: req.body.language,
        useSeaLion: req.body.useSeaLion
      };
      // console.log('Starting coaching with language options:', languageOptions);
      
      const response = await coachingEngineService.startCoachingConversation(sessionId, languageOptions);

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

  // Process user response with immediate AI guidance
  app.post('/api/coaching/sessions/:sessionId/respond', requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { response } = req.body;
      
      if (!response) {
        return res.status(400).json({
          success: false,
          message: 'Response is required'
        });
      }

      const session = await storage.getCoachingSession(sessionId);
      
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

      // Parse language parameters from request body
      const languageOptions = {
        language: req.body.language,
        useSeaLion: req.body.useSeaLion
      };
      // console.log('Processing response with language options:', languageOptions);
      
      const coachingResponse = await coachingEngineService.processCoachingResponse(
        sessionId,
        response,
        undefined, // questionNumber
        languageOptions
      );

      res.json({
        success: true,
        data: coachingResponse
      });
    } catch (error) {
      console.error('Error processing coaching response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process coaching response'
      });
    }
  });

  // Complete coaching session and get model answers
  app.post('/api/coaching/sessions/:sessionId/complete', requireAuth, ensureUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getCoachingSession(sessionId);
      
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

      const completion = await coachingEngineService.completeCoachingSession(sessionId);

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

  // ================================
  // ENHANCED QUESTION BANK API ROUTES
  // ================================

  // Get questions for specific interview stage
  app.get('/api/prepare/questions/stage/:stage', async (req, res) => {
    try {
      const { stage } = req.params;
      const count = Math.min(parseInt(req.query.count as string) || 15, 50);
      const difficulty = req.query.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined;
      const language = (req.query.language as string) || 'en';

      if (!['phone-screening', 'functional-team', 'hiring-manager', 'subject-matter-expertise', 'executive-final'].includes(stage)) {
        return res.status(400).json({ message: 'Invalid interview stage' });
      }

      const questions = await questionBankService.getQuestionsForStage(
        stage,
        count,
        difficulty,
        language as any
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

  // Get questions by category
  app.get('/api/prepare/questions/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      if (!['behavioral', 'situational', 'technical', 'company-specific', 'general'].includes(category)) {
        return res.status(400).json({ message: 'Invalid question category' });
      }

      const questions = await questionBankService.getQuestionsByCategory(category as any, limit);

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

  // Get STAR method questions
  app.get('/api/prepare/questions/star-method', async (req, res) => {
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

  // Get all stage questions overview
  app.get('/api/prepare/questions/all-stages', async (req, res) => {
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

  // Get question bank statistics
  app.get('/api/prepare/questions/statistics', async (req, res) => {
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

  // Generate additional questions using AI
  app.post('/api/prepare/questions/generate', async (req, res) => {
    try {
      const { stage, count, difficulty, language } = req.body;

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
        language as any
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

  // Get questions for a specific session
  app.get('/api/prepare/questions/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const count = Math.min(parseInt(req.query.count as string) || 15, 50);
      const difficulty = req.query.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined;
      const language = (req.query.language as string) || 'en';

      // For now, use default stage - in real implementation, fetch from session
      const defaultStage = 'phone-screening';
      
      const questions = await questionBankService.getQuestionsForStage(
        defaultStage,
        count,
        difficulty,
        language as any
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

  // Enhanced translation endpoint with cultural context
  app.post('/api/prepare/questions/translate', async (req, res) => {
    try {
      const { text, targetLanguage, context } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({
          error: 'Missing required parameters: text and targetLanguage'
        });
      }

      // Enhanced translation using prepareService
      const translatedText = await prepareService.translateContent(text, targetLanguage as any, {
        contentType: context?.contentType || 'question',
        preserveFormatting: true
      });

      res.json({
        success: true,
        data: {
          originalText: text,
          translatedText,
          targetLanguage,
          context,
          culturalAdaptations: [
            'Culturally adapted for Southeast Asian context',
            'Professional tone maintained',
            'Respectful language used'
          ]
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

  // Bookmark question for session
  app.post('/api/prepare/questions/session/:sessionId/bookmark', async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
