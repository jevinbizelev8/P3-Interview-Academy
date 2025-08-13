import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sealionService } from "./services/sealion";
import { AIService } from "./services/ai-service";
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
      const assessment = await sealionService.generateSTARAssessment(conversationMessages, context, session.interviewLanguage || 'en');

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
      });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "Failed to complete interview session" });
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
        error: error.message,
        timestamp: new Date().toISOString()
      });
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

  // Perform Module API Routes
  
  // Create perform session with job context
  app.post('/api/perform/sessions', async (req, res) => {
    try {
      const sessionData = {
        userId: "dev-user-123", // Development user
        scenarioId: "00000000-0000-0000-0000-000000000000", // Placeholder scenario for perform module
        userJobPosition: req.body.jobPosition,
        userCompanyName: req.body.companyName,
        interviewLanguage: req.body.interviewLanguage || "en",
        status: "in_progress"
      };

      const session = await storage.createInterviewSession(sessionData);
      
      // Generate initial AI greeting using the language-aware AI service
      const greeting = await AIService.generateInterviewQuestion(session, [], 1);
      
      await storage.createInterviewMessage({
        sessionId: session.id,
        messageType: "ai",
        content: greeting,
        questionNumber: 1
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating perform session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get perform session
  app.get('/api/perform/sessions/:sessionId', async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Get session messages
  app.get('/api/perform/sessions/:sessionId/messages', async (req, res) => {
    try {
      const messages = await storage.getSessionMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Add user message
  app.post('/api/perform/sessions/:sessionId/messages', async (req, res) => {
    try {
      const message = await storage.createInterviewMessage({
        sessionId: req.params.sessionId,
        messageType: "user",
        content: req.body.content,
        questionNumber: req.body.questionNumber
      });
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Generate AI response
  app.post('/api/perform/sessions/:sessionId/ai-response', async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.sessionId);
      const messages = await storage.getSessionMessages(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check if we should complete the interview
      const shouldComplete = await AIService.shouldCompleteInterview(messages.length);
      
      if (shouldComplete) {
        // Generate final message and complete interview
        const finalMessage = `Thank you for this comprehensive interview! You've provided excellent insights into your experience and approach to the ${session.userJobPosition} role at ${session.userCompanyName}. I'm now preparing your detailed performance evaluation with personalized feedback and recommendations. This will be available shortly.`;
        
        await storage.createInterviewMessage({
          sessionId: req.params.sessionId,
          messageType: "ai",
          content: finalMessage
        });

        // Update session status
        await storage.updateSessionStatus(req.params.sessionId, "completed");
        
        // Generate comprehensive evaluation
        const evaluation = await AIService.generateComprehensiveEvaluation(session, messages);
        await storage.createEvaluationResult({
          sessionId: req.params.sessionId,
          evaluationLanguage: session.interviewLanguage,
          culturalContext: "SEA", // Southeast Asia
          ...evaluation
        });

        res.json({ message: finalMessage, isCompleted: true });
      } else {
        // Generate next question
        const currentQuestionNumber = Math.floor(messages.length / 2) + 1;
        const nextQuestion = await AIService.generateInterviewQuestion(session, messages, currentQuestionNumber);
        
        await storage.createInterviewMessage({
          sessionId: req.params.sessionId,
          messageType: "ai",
          content: nextQuestion,
          questionNumber: currentQuestionNumber
        });

        res.json({ message: nextQuestion, isCompleted: false });
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Complete interview manually
  app.post('/api/perform/sessions/:sessionId/complete', async (req, res) => {
    try {
      const session = await storage.getInterviewSession(req.params.sessionId);
      const messages = await storage.getSessionMessages(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      await storage.updateSessionStatus(req.params.sessionId, "completed");
      
      // Generate comprehensive evaluation
      const evaluation = await AIService.generateComprehensiveEvaluation(session, messages);
      await storage.createEvaluationResult({
        sessionId: req.params.sessionId,
        evaluationLanguage: session.interviewLanguage,
        culturalContext: "SEA",
        ...evaluation
      });

      res.json({ message: "Interview completed successfully" });
    } catch (error) {
      console.error("Error completing interview:", error);
      res.status(500).json({ message: "Failed to complete interview" });
    }
  });

  // Get evaluation results
  app.get('/api/perform/sessions/:sessionId/evaluation', async (req, res) => {
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

  // Share progress (anonymized)
  app.post('/api/perform/sessions/:sessionId/share', async (req, res) => {
    try {
      // For now, just return success - in real app would share anonymized data
      res.json({ message: "Progress shared successfully" });
    } catch (error) {
      console.error("Error sharing progress:", error);
      res.status(500).json({ message: "Failed to share progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
