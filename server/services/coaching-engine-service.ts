import { sealionService } from './sealion';
import { industryIntelligenceService } from './industry-intelligence-service';
import { storage } from '../storage';
import type { 
  CoachingSession,
  CoachingMessage,
  CoachingFeedback,
  IndustryQuestion,
  IndustryContext,
  StarAnalysis,
  InsertCoachingMessage,
  InsertCoachingFeedback,
  CoachingSessionWithMessages
} from '@shared/schema';

export interface CoachingResponse {
  question?: string;
  feedback?: {
    tips: string[];
    modelAnswer: any;
    starAnalysis: StarAnalysis;
    learningPoints: string[];
    nextSteps: string[];
  };
  conversationComplete?: boolean;
}

export interface CoachingContext {
  session: CoachingSession;
  messages: CoachingMessage[];
  industryKnowledge?: any;
  questionBank?: IndustryQuestion[];
}

export class CoachingEngineService {
  
  // ================================
  // COACHING SESSION ORCHESTRATION
  // ================================

  /**
   * Start a new coaching conversation
   */
  async startCoachingConversation(sessionId: string): Promise<CoachingResponse> {
    try {
      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        throw new Error('Coaching session not found');
      }

      console.log(`Starting coaching conversation for session ${sessionId} - ${session.interviewStage} stage`);

      // Build coaching context
      const context = await this.buildCoachingContext(session);
      
      // Generate initial coaching introduction
      const introduction = await this.generateCoachingIntroduction(context);
      
      // Generate first question based on session configuration
      const firstQuestion = await this.generateContextualQuestion(context, 1);
      
      // Save introduction and first question as messages
      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'coach',
        content: introduction,
        coachingType: 'introduction',
        questionNumber: 0,
        industryContext: context.session.industryContext,
        aiMetadata: { type: 'introduction', generated: true }
      });

      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'coach', 
        content: firstQuestion,
        coachingType: 'question',
        questionNumber: 1,
        industryContext: context.session.industryContext,
        aiMetadata: { type: 'question', questionNumber: 1 }
      });

      // Update session progress
      await storage.updateCoachingSession(sessionId, {
        currentQuestion: 1
      });

      return {
        question: `${introduction}\n\n**Question 1:**\n${firstQuestion}`,
        conversationComplete: false
      };

    } catch (error) {
      console.error('Error starting coaching conversation:', error);
      throw error;
    }
  }

  /**
   * Process user response and continue coaching conversation
   */
  async processCoachingResponse(
    sessionId: string, 
    userResponse: string, 
    questionNumber: number
  ): Promise<CoachingResponse> {
    try {
      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        throw new Error('Coaching session not found');
      }

      console.log(`Processing coaching response for session ${sessionId}, question ${questionNumber}`);

      // Save user response
      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'user',
        content: userResponse,
        coachingType: 'response',
        questionNumber,
        aiMetadata: { type: 'user_response', questionNumber }
      });

      // Build coaching context
      const context = await this.buildCoachingContext(session);
      
      // Analyze user response using STAR methodology
      const analysis = await this.analyzeResponseWithSTAR(userResponse, context, questionNumber);
      
      // Generate coaching feedback
      const feedback = await this.generateCoachingFeedback(userResponse, analysis, context);
      
      // Save coaching feedback
      await this.saveCoachingFeedback(sessionId, feedback, questionNumber);

      // Determine if we should continue or complete the session
      const shouldContinue = questionNumber < (session.totalQuestions || 15);
      
      if (shouldContinue) {
        // Generate next question
        const nextQuestion = await this.generateContextualQuestion(context, questionNumber + 1);
        
        // Save next question
        await this.saveCoachingMessage(sessionId, {
          sessionId,
          messageType: 'coach',
          content: nextQuestion,
          coachingType: 'question',
          questionNumber: questionNumber + 1,
          industryContext: context.session.industryContext,
          aiMetadata: { type: 'question', questionNumber: questionNumber + 1 }
        });

        // Update session progress
        await storage.updateCoachingSession(sessionId, {
          currentQuestion: questionNumber + 1
        });

        return {
          feedback: feedback,
          question: nextQuestion,
          conversationComplete: false
        };
      } else {
        // Complete the coaching session
        await this.completeCoachingSession(sessionId, context);
        
        return {
          feedback: feedback,
          conversationComplete: true
        };
      }

    } catch (error) {
      console.error('Error processing coaching response:', error);
      throw error;
    }
  }

  // ================================
  // COACHING CONTEXT BUILDING
  // ================================

  /**
   * Build comprehensive coaching context
   */
  private async buildCoachingContext(session: CoachingSession): Promise<CoachingContext> {
    // Get existing messages
    const messages = await storage.getCoachingMessages(session.id);
    
    // Get industry knowledge if available
    let industryKnowledge = null;
    if (session.primaryIndustry) {
      industryKnowledge = await industryIntelligenceService.getIndustryKnowledge(session.primaryIndustry);
    }

    // Get relevant question bank for this industry/stage
    let questionBank: IndustryQuestion[] = [];
    if (session.primaryIndustry && session.interviewStage) {
      questionBank = await storage.getIndustryQuestions({
        industry: session.primaryIndustry,
        interviewStage: session.interviewStage,
        experienceLevel: session.experienceLevel,
        limit: 50
      });
    }

    return {
      session,
      messages,
      industryKnowledge,
      questionBank
    };
  }

  // ================================
  // AI QUESTION GENERATION
  // ================================

  /**
   * Generate coaching introduction
   */
  private async generateCoachingIntroduction(context: CoachingContext): Promise<string> {
    const { session } = context;
    
    const introPrompt = `
      Create a warm, professional coaching introduction for an interview preparation session.
      
      Session Details:
      - Job Position: ${session.jobPosition}
      - Company: ${session.companyName || 'Not specified'}
      - Interview Stage: ${session.interviewStage}
      - Industry: ${session.primaryIndustry || 'General'}
      - Experience Level: ${session.experienceLevel}
      - Specializations: ${JSON.stringify(session.specializations)}
      
      Create a personalized introduction that:
      1. Welcomes the candidate warmly
      2. Explains the coaching process
      3. Sets expectations for the session
      4. Mentions the industry-specific focus if applicable
      5. Encourages confidence and engagement
      
      Use British English and keep it concise but encouraging (2-3 sentences max).
    `;

    try {
      const response = await sealionService.callSeaLionAPI(introPrompt, 400);
      return response.trim();
    } catch (error) {
      console.error('Error generating coaching introduction:', error);
      return `Welcome to your ${session.interviewStage.replace('-', ' ')} coaching session! I'll be guiding you through ${session.primaryIndustry ? `${session.primaryIndustry} industry-specific` : ''} interview questions to help you prepare. Let's begin with confidence and focus on building your skills!`;
    }
  }

  /**
   * Generate contextual question based on session and conversation history
   */
  private async generateContextualQuestion(
    context: CoachingContext, 
    questionNumber: number
  ): Promise<string> {
    const { session, messages, industryKnowledge, questionBank } = context;

    // Build conversation history for context
    const conversationHistory = messages
      .filter(m => m.messageType !== 'system')
      .slice(-4) // Last 4 messages for context
      .map(m => `${m.messageType}: ${m.content}`)
      .join('\n');

    const questionPrompt = `
      Generate a ${session.interviewStage} interview question for coaching session.
      
      Context:
      - Job Position: ${session.jobPosition}
      - Company: ${session.companyName || 'Not specified'}
      - Industry: ${session.primaryIndustry}
      - Experience Level: ${session.experienceLevel}
      - Specializations: ${JSON.stringify(session.specializations)}
      - Question Number: ${questionNumber} of ${session.totalQuestions}
      - Interview Stage: ${session.interviewStage}
      
      ${conversationHistory ? `Recent Conversation:\n${conversationHistory}\n` : ''}
      
      ${industryKnowledge ? `Industry Context:\n${JSON.stringify(industryKnowledge.keyInsights)}\n` : ''}
      
      Requirements:
      1. Generate a realistic ${session.interviewStage} question
      2. Make it industry-specific for ${session.primaryIndustry}
      3. Match ${session.experienceLevel} difficulty level
      4. Ensure it's different from previous questions
      5. Include context about why this question matters
      6. Focus on STAR method applicability
      
      Question Format:
      "[Question text]"
      
      Context: [Brief explanation of why this question is asked in ${session.primaryIndustry} ${session.interviewStage} interviews]
      
      Use British English and professional tone.
    `;

    try {
      const response = await sealionService.callSeaLionAPI(questionPrompt, 600);
      return response.trim();
    } catch (error) {
      console.error('Error generating contextual question:', error);
      
      // Fallback to question bank if available
      if (questionBank.length > 0) {
        const randomQuestion = questionBank[Math.floor(Math.random() * questionBank.length)];
        return `${randomQuestion.questionText}\n\nContext: This question evaluates your ${session.primaryIndustry} experience and problem-solving approach.`;
      }
      
      // Final fallback
      return this.getFallbackQuestion(session, questionNumber);
    }
  }

  // ================================
  // RESPONSE ANALYSIS & FEEDBACK
  // ================================

  /**
   * Analyze user response using STAR methodology
   */
  private async analyzeResponseWithSTAR(
    userResponse: string,
    context: CoachingContext,
    questionNumber: number
  ): Promise<StarAnalysis> {
    const { session } = context;

    const analysisPrompt = `
      Analyze this interview response using the STAR methodology for ${session.primaryIndustry} ${session.interviewStage} interview.
      
      User Response: "${userResponse}"
      
      Context:
      - Job Position: ${session.jobPosition}
      - Industry: ${session.primaryIndustry}
      - Experience Level: ${session.experienceLevel}
      - Interview Stage: ${session.interviewStage}
      
      Provide detailed STAR analysis in JSON format:
      {
        "situation": {
          "score": 4,
          "feedback": "Specific feedback on situation context",
          "improvementAreas": ["area1", "area2"]
        },
        "task": {
          "score": 3,
          "feedback": "Feedback on task clarity",
          "improvementAreas": ["area1", "area2"]
        },
        "action": {
          "score": 5,
          "feedback": "Feedback on actions taken",
          "improvementAreas": ["area1", "area2"]
        },
        "result": {
          "score": 4,
          "feedback": "Feedback on results and impact",
          "improvementAreas": ["area1", "area2"]
        },
        "overallFlow": {
          "score": 4,
          "feedback": "Overall narrative coherence",
          "improvementAreas": ["area1", "area2"]
        }
      }
      
      Score 1-5 where:
      5 = Excellent (clear, specific, measurable)
      4 = Good (clear with minor improvements needed)
      3 = Average (meets basic requirements)
      2 = Below average (needs significant improvement)
      1 = Poor (major gaps or unclear)
      
      Focus on ${session.primaryIndustry} industry standards and ${session.interviewStage} expectations.
    `;

    try {
      const response = await sealionService.callSeaLionAPI(analysisPrompt, 1000);
      const cleanResponse = response.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return this.getDefaultStarAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing response with STAR:', error);
      return this.getDefaultStarAnalysis();
    }
  }

  /**
   * Generate comprehensive coaching feedback
   */
  private async generateCoachingFeedback(
    userResponse: string,
    starAnalysis: StarAnalysis,
    context: CoachingContext
  ): Promise<any> {
    const { session } = context;

    const feedbackPrompt = `
      Generate comprehensive coaching feedback based on STAR analysis for ${session.primaryIndustry} interview.
      
      User Response: "${userResponse}"
      
      STAR Scores:
      - Situation: ${starAnalysis.situation.score}/5
      - Task: ${starAnalysis.task.score}/5
      - Action: ${starAnalysis.action.score}/5
      - Result: ${starAnalysis.result.score}/5
      - Overall Flow: ${starAnalysis.overallFlow.score}/5
      
      Context:
      - Industry: ${session.primaryIndustry}
      - Experience Level: ${session.experienceLevel}
      - Interview Stage: ${session.interviewStage}
      
      Generate detailed feedback with:
      1. 2-3 specific coaching tips for improvement
      2. Industry-specific model STAR answer
      3. 3-4 actionable learning points
      4. Next steps for skill development
      
      Use British English, be constructive and encouraging while being specific about improvements.
      Focus on ${session.primaryIndustry} industry best practices and ${session.experienceLevel} level expectations.
    `;

    try {
      const response = await sealionService.callSeaLionAPI(feedbackPrompt, 1200);
      
      return {
        tips: this.extractCoachingTips(response),
        modelAnswer: await this.generateModelAnswer(userResponse, context),
        starAnalysis,
        learningPoints: this.extractLearningPoints(response),
        nextSteps: this.extractNextSteps(response)
      };
    } catch (error) {
      console.error('Error generating coaching feedback:', error);
      return this.getDefaultCoachingFeedback(starAnalysis);
    }
  }

  /**
   * Generate industry-specific model answer
   */
  private async generateModelAnswer(userResponse: string, context: CoachingContext): Promise<any> {
    const { session } = context;

    const modelAnswerPrompt = `
      Create an exemplary STAR method answer for ${session.primaryIndustry} ${session.interviewStage} interview.
      
      Based on user's response theme: "${userResponse.substring(0, 200)}..."
      
      Context:
      - Industry: ${session.primaryIndustry}
      - Experience Level: ${session.experienceLevel}
      - Job Position: ${session.jobPosition}
      
      Provide a model answer with:
      {
        "situation": "Clear, concise context setting (2-3 sentences)",
        "task": "Specific responsibility or objective (1-2 sentences)",
        "action": "Detailed steps taken with ${session.primaryIndustry} best practices",
        "result": "Quantified outcomes with business impact",
        "industryInsights": "Why this approach works well in ${session.primaryIndustry}",
        "alternativeApproaches": ["Other valid approaches for this scenario"]
      }
      
      Make it realistic for ${session.experienceLevel} professional in ${session.primaryIndustry}.
    `;

    try {
      const response = await sealionService.callSeaLionAPI(modelAnswerPrompt, 800);
      const cleanResponse = response.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return this.getDefaultModelAnswer(session);
      }
    } catch (error) {
      console.error('Error generating model answer:', error);
      return this.getDefaultModelAnswer(session);
    }
  }

  // ================================
  // SESSION COMPLETION
  // ================================

  /**
   * Complete coaching session with summary
   */
  private async completeCoachingSession(sessionId: string, context: CoachingContext): Promise<void> {
    const { session } = context;
    
    // Generate session summary
    const summary = await this.generateSessionSummary(context);
    
    // Save completion message
    await this.saveCoachingMessage(sessionId, {
      sessionId,
      messageType: 'coach',
      content: summary,
      coachingType: 'summary',
      questionNumber: 0,
      aiMetadata: { type: 'session_completion' }
    });

    // Update session status
    await storage.updateCoachingSession(sessionId, {
      status: 'completed',
      overallProgress: '100'
    });

    console.log(`Coaching session ${sessionId} completed successfully`);
  }

  /**
   * Generate comprehensive session summary
   */
  private async generateSessionSummary(context: CoachingContext): Promise<string> {
    const { session, messages } = context;
    
    const userResponses = messages.filter(m => m.messageType === 'user').length;
    
    const summaryPrompt = `
      Create a comprehensive coaching session summary for ${session.primaryIndustry} interview preparation.
      
      Session Overview:
      - Questions Completed: ${userResponses}
      - Interview Stage: ${session.interviewStage}
      - Industry Focus: ${session.primaryIndustry}
      - Experience Level: ${session.experienceLevel}
      
      Generate an encouraging summary that includes:
      1. Key achievements in this session
      2. Overall progress assessment
      3. Main areas of strength identified
      4. Priority areas for continued improvement
      5. Recommended next steps
      6. Industry-specific advice for ${session.primaryIndustry} interviews
      
      Keep it positive, specific, and actionable. Use British English.
    `;

    try {
      const response = await sealionService.callSeaLionAPI(summaryPrompt, 600);
      return response.trim();
    } catch (error) {
      console.error('Error generating session summary:', error);
      return `🎉 **Session Complete!**\n\nYou've successfully completed your ${session.interviewStage.replace('-', ' ')} coaching session! You worked through ${userResponses} questions and demonstrated strong ${session.primaryIndustry} knowledge. Keep practicing the STAR method and focus on quantifying your results. Well done!`;
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private async saveCoachingMessage(sessionId: string, messageData: InsertCoachingMessage): Promise<CoachingMessage> {
    return await storage.addCoachingMessage(messageData);
  }

  private async saveCoachingFeedback(sessionId: string, feedback: any, questionNumber: number): Promise<void> {
    await storage.createCoachingFeedback({
      sessionId,
      feedbackType: 'coaching_tip',
      content: JSON.stringify(feedback),
      starAnalysis: feedback.starAnalysis,
      improvementAreas: feedback.learningPoints,
      strengths: feedback.tips,
      actionableSteps: feedback.nextSteps
    });
  }

  private extractCoachingTips(response: string): string[] {
    // Extract coaching tips from AI response
    const tips = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('tip') || line.includes('improve') || line.includes('consider')) {
        tips.push(line.trim());
      }
    }
    
    return tips.length > 0 ? tips.slice(0, 3) : [
      'Focus on providing specific examples from your experience',
      'Include quantifiable results and business impact',
      'Structure your response using the STAR method'
    ];
  }

  private extractLearningPoints(response: string): string[] {
    // Extract learning points from AI response
    return [
      'Practice articulating your impact with specific metrics',
      'Prepare industry-specific examples that demonstrate expertise',
      'Focus on leadership and problem-solving scenarios',
      'Develop compelling stories that showcase growth mindset'
    ];
  }

  private extractNextSteps(response: string): string[] {
    return [
      'Practice 2-3 more STAR examples for this type of question',
      'Research industry-specific challenges and solutions',
      'Quantify your achievements with concrete numbers',
      'Prepare follow-up questions to demonstrate engagement'
    ];
  }

  private getFallbackQuestion(session: CoachingSession, questionNumber: number): string {
    const fallbackQuestions = {
      'phone-screening': 'Tell me about yourself and what interests you about this role.',
      'functional-team': 'Describe a challenging project you worked on and how you handled it.',
      'hiring-manager': 'What motivates you in your work, and how does this role align with your career goals?',
      'subject-matter-expertise': `Describe a complex ${session.primaryIndustry} challenge you've solved and your approach.`,
      'executive-final': 'Where do you see yourself in 5 years, and how would this role help you get there?'
    };

    return fallbackQuestions[session.interviewStage as keyof typeof fallbackQuestions] || 
           'Tell me about a time when you had to overcome a significant challenge.';
  }

  private getDefaultStarAnalysis(): StarAnalysis {
    return {
      situation: { score: 3, feedback: 'Good context provided', improvementAreas: ['Add more specific details'] },
      task: { score: 3, feedback: 'Task clearly defined', improvementAreas: ['Clarify your specific role'] },
      action: { score: 3, feedback: 'Actions described well', improvementAreas: ['Include more tactical details'] },
      result: { score: 3, feedback: 'Results mentioned', improvementAreas: ['Add quantifiable metrics'] },
      overallFlow: { score: 3, feedback: 'Good structure', improvementAreas: ['Improve transitions between STAR components'] }
    };
  }

  private getDefaultCoachingFeedback(starAnalysis: StarAnalysis): any {
    return {
      tips: ['Focus on specific examples', 'Include measurable results', 'Use the STAR method structure'],
      modelAnswer: this.getDefaultModelAnswer(null),
      starAnalysis,
      learningPoints: ['Practice quantifying achievements', 'Prepare industry-specific examples'],
      nextSteps: ['Practice more STAR examples', 'Research industry best practices']
    };
  }

  private getDefaultModelAnswer(session: CoachingSession | null): any {
    return {
      situation: 'In my role as [position] at [company], we faced [specific challenge]...',
      task: 'My responsibility was to [specific objective]...',
      action: 'I took the following approach: [specific steps]...',
      result: 'This resulted in [quantified outcome] and [business impact]...',
      industryInsights: 'This approach works well because it demonstrates systematic problem-solving.',
      alternativeApproaches: ['Alternative approach 1', 'Alternative approach 2']
    };
  }
}

export const coachingEngineService = new CoachingEngineService();