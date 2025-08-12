import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bedrockService } from "./services/bedrock";
import { setupAuth, isAuthenticated } from "./replit-auth";
import { insertInterviewScenarioSchema, insertInterviewSessionSchema, insertInterviewMessageSchema } from "@shared/schema";
import { z } from "zod";

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
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes (development mode - will add proper auth later)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // For development, create/return a mock user
      let user = await storage.getUser("dev-user-123");
      if (!user) {
        user = await storage.upsertUser({
          id: "dev-user-123",
          email: "dev@example.com",
          firstName: "Dev",
          lastName: "User",
          role: "admin"
        });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Temporary middleware bypass for development
  const requireAdmin = (req: any, res: any, next: any) => {
    // For development, bypass admin checks
    req.user = { id: "dev-user-123", role: "admin" };
    next();
  };

  // Temporary middleware to add mock user for development
  const addMockUser = (req: any, res: any, next: any) => {
    req.user = { id: "dev-user-123", role: "admin" };
    next();
  };

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
            const dynamicScenario = await bedrockService.generateDynamicScenario(
              scenarioStage,
              userJobPosition,
              userCompanyName
            );
            
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
        const dynamicScenario = await bedrockService.generateDynamicScenario(
          stage,
          userJobPosition,
          userCompanyName
        );
        
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
      validatedData.createdBy = req.user.id;
      
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
  app.post("/api/practice/sessions", addMockUser, async (req, res) => {
    try {
      console.log("Creating session with body:", req.body);
      console.log("User:", req.user);
      
      const sessionData = {
        ...req.body,
        userId: req.user.id
      };
      
      console.log("Session data to validate:", sessionData);
      const validatedData = insertInterviewSessionSchema.parse(sessionData);
      
      const session = await storage.createInterviewSession(validatedData);
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

  app.get("/api/practice/sessions/:id", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Verify user owns the session
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.get("/api/practice/sessions", addMockUser, async (req, res) => {
    try {
      const sessions = await storage.getUserInterviewSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.put("/api/practice/sessions/:id", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
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

  app.post("/api/practice/sessions/:id/auto-save", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
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
  app.post("/api/practice/sessions/:id/ai-question", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userResponse } = req.body;
      const questionNumber = session.currentQuestion || 1;
      
      // Build conversation history
      const conversationHistory = session.messages
        .map(msg => `${msg.messageType === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
        .join('\n');

      // Generate dynamic persona based on user's job context or scenario
      const persona = await bedrockService.generateInterviewerPersona({
        stage: session.scenario.interviewStage,
        jobRole: session.scenario.jobRole,
        company: session.scenario.companyBackground,
        candidateBackground: session.scenario.candidateBackground,
        keyObjectives: session.scenario.keyObjectives,
        userJobPosition: session.userJobPosition || undefined,
        userCompanyName: session.userCompanyName || undefined,
      });

      const context = {
        stage: session.scenario.interviewStage,
        jobRole: session.scenario.jobRole,
        company: session.scenario.companyBackground,
        candidateBackground: session.scenario.candidateBackground,
        keyObjectives: session.scenario.keyObjectives,
        userJobPosition: session.userJobPosition || undefined,
        userCompanyName: session.userCompanyName || undefined,
      };

      // Convert conversation history to the format expected by Bedrock service
      const conversationMessages = session.messages.map(msg => ({
        role: msg.messageType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

      let aiResponse;
      const language = session.interviewLanguage || 'en';
      if (questionNumber === 1) {
        aiResponse = await bedrockService.generateFirstQuestion(context, persona, language);
      } else {
        aiResponse = await bedrockService.generateFollowUpQuestion(
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

  app.post("/api/practice/sessions/:id/user-response", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, questionContext } = req.body;
      
      // Generate live feedback
      const feedback = await bedrockService.generateQuickFeedback(content, questionContext);

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

  app.post("/api/practice/sessions/:id/complete", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

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

      // Generate assessment
      const assessment = await bedrockService.generateSTARAssessment(context, conversationMessages);

      // Calculate duration
      const duration = session.startedAt 
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;

      // Update session with completion data
      const updatedSession = await storage.updateInterviewSession(req.params.id, {
        status: 'completed',
        completedAt: new Date(),
        duration,
        overallScore: assessment.overall.toString(),
        situationScore: assessment.situation.toString(),
        taskScore: assessment.task.toString(),
        actionScore: assessment.action.toString(),
        resultScore: assessment.result.toString(),
        flowScore: assessment.flow.toString(),
        qualitativeFeedback: assessment.qualitative,
        strengths: assessment.strengths,
        improvements: assessment.improvements,
        recommendations: assessment.recommendations,
      });

      res.json({
        session: updatedSession,
        assessment,
      });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "Failed to complete interview session" });
    }
  });

  // Session transcript download
  app.get("/api/practice/sessions/:id/transcript", addMockUser, async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
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

  // Assessment routes for Perform module
  app.post("/api/assessments", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      
      if (!sessionId || !userId) {
        return res.status(400).json({ message: "Session ID and User ID are required" });
      }

      const { assessmentService } = await import("./services/assessment");
      const assessment = await assessmentService.assessInterviewSession(sessionId, userId);
      
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get("/api/assessments/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const { assessmentService } = await import("./services/assessment");
      const assessments = await assessmentService.getUserAssessments(userId, limit);
      
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching user assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/performance/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { assessmentService } = await import("./services/assessment");
      const overview = await assessmentService.getUserPerformanceOverview(userId);
      
      res.json(overview);
    } catch (error) {
      console.error("Error fetching performance overview:", error);
      if (error.message === "No assessments found for user") {
        return res.status(404).json({ message: "No performance data available" });
      }
      res.status(500).json({ message: "Failed to fetch performance overview" });
    }
  });

  // Get assessment criteria definitions
  app.get("/api/assessment-criteria", async (req, res) => {
    try {
      const { ASSESSMENT_CRITERIA } = await import("./services/assessment");
      res.json(ASSESSMENT_CRITERIA);
    } catch (error) {
      console.error("Error fetching assessment criteria:", error);
      res.status(500).json({ message: "Failed to fetch assessment criteria" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
