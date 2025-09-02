import { sealionService } from './sealion';
import { aiRouter } from './ai-router';
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
      // Check if conversation already started
      const existingMessages = await storage.getCoachingMessages(sessionId);
      if (existingMessages.length > 0) {
        console.log(`Conversation already exists for session ${sessionId}, skipping start`);
        return {
          question: existingMessages.map(msg => msg.content).join('\n\n'),
          conversationComplete: false
        };
      }

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
      
      // Clean up the responses to remove any internal reasoning
      const cleanIntroduction = this.cleanAIResponse(introduction);
      const cleanFirstQuestion = this.cleanAIResponse(firstQuestion);

      // Save introduction and first question as messages
      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'coach',
        content: cleanIntroduction,
        coachingType: 'introduction',
        questionNumber: 0,
        industryContext: context.session.industryContext,
        aiMetadata: { type: 'introduction', generated: true } as any
      });

      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'coach', 
        content: cleanFirstQuestion,
        coachingType: 'question',
        questionNumber: 1,
        industryContext: context.session.industryContext,
        aiMetadata: { type: 'question', questionNumber: 1 } as any
      });

      // Update session progress
      await storage.updateCoachingSession(sessionId, {
        currentQuestion: 1
      });

      return {
        question: `${cleanIntroduction}\n\n**Question 1:**\n${cleanFirstQuestion}`,
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
    questionNumber?: number
  ): Promise<CoachingResponse> {
    try {
      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        throw new Error('Coaching session not found');
      }

      // Determine current question number if not provided
      if (!questionNumber) {
        const messages = await storage.getCoachingMessages(sessionId);
        const userResponses = messages.filter(m => m.messageType === 'user').length;
        questionNumber = userResponses; // This will be the current question number (1-based)
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
      const rawFeedback = await this.generateCoachingFeedback(userResponse, analysis, context);
      
      // Clean the feedback content if it's a string
      let cleanedFeedback = rawFeedback;
      if (typeof rawFeedback === 'string') {
        cleanedFeedback = this.cleanAIResponse(rawFeedback);
      } else if (rawFeedback && typeof rawFeedback === 'object') {
        // Clean individual string properties in feedback object
        cleanedFeedback = { ...rawFeedback };
        Object.keys(cleanedFeedback).forEach(key => {
          if (typeof cleanedFeedback[key] === 'string') {
            cleanedFeedback[key] = this.cleanAIResponse(cleanedFeedback[key]);
          }
        });
      }
      
      // Save coaching feedback message with the feedback data embedded
      await this.saveCoachingMessage(sessionId, {
        sessionId,
        messageType: 'coach',
        content: 'Your response has been analyzed. Here is your feedback:',
        coachingType: 'feedback',
        questionNumber,
        feedback: cleanedFeedback,
        aiMetadata: { type: 'feedback', questionNumber } as any
      });

      // Determine if we should continue or complete the session
      const totalQuestions = session.totalQuestions || 15;
      const shouldContinue = questionNumber < totalQuestions;
      
      console.log(`Session progress: ${questionNumber}/${totalQuestions}, shouldContinue: ${shouldContinue}`);
      
      if (shouldContinue) {
        // Generate next question
        const rawNextQuestion = await this.generateContextualQuestion(context, questionNumber + 1);
        const cleanNextQuestion = this.cleanAIResponse(rawNextQuestion);
        
        // Save next question
        await this.saveCoachingMessage(sessionId, {
          sessionId,
          messageType: 'coach',
          content: cleanNextQuestion,
          coachingType: 'question',
          questionNumber: questionNumber + 1,
          industryContext: context.session.industryContext,
          aiMetadata: { type: 'question', questionNumber: questionNumber + 1 }
        });

        // Update session progress
        const progressPercentage = ((questionNumber + 1) / totalQuestions * 100).toFixed(2);
        await storage.updateCoachingSession(sessionId, {
          currentQuestion: questionNumber + 1,
          overallProgress: progressPercentage
        });

        return {
          feedback: cleanedFeedback,
          question: cleanNextQuestion,
          conversationComplete: false
        };
      } else {
        // Complete the coaching session
        await this.completeCoachingSession(sessionId, context);
        
        return {
          feedback: cleanedFeedback,
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
        difficultyLevel: session.experienceLevel as any,
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
    
    const introPrompt = `Create a concise ${session.interviewStage} interview coaching introduction for ${session.jobPosition} at ${session.companyName || 'target company'}. Include: brief welcome, STAR method reminder, ${session.totalQuestions} questions in ${session.timeAllocation}min. Max 3 sentences, British English, encouraging tone for ${session.experienceLevel} level.`;

    try {
      const response = await aiRouter.generateResponse({
        messages: [{ role: 'user', content: introPrompt }],
        maxTokens: 400,
        temperature: 0.7
      });
      return response.content.trim();
    } catch (error) {
      console.error('Error generating coaching introduction:', error);
      const stageDescription = {
        'phone-screening': 'initial screening to assess basic qualifications and cultural fit',
        'functional-team': 'technical assessment with team members to evaluate practical skills',
        'hiring-manager': 'strategic discussion about role expectations and career alignment', 
        'subject-matter-expertise': 'deep technical evaluation with industry experts',
        'executive-final': 'final decision-making conversation with senior leadership'
      }[session.interviewStage] || 'interview assessment';

      return `Welcome to your ${session.interviewStage.replace('-', ' ')} coaching session for the ${session.jobPosition} role at ${session.companyName || 'your target company'}! This stage typically involves ${stageDescription}. I'll be guiding you through ${session.totalQuestions} ${session.primaryIndustry ? `${session.primaryIndustry} industry-specific` : ''} interview questions using the STAR method over ${session.timeAllocation} minutes. As a ${session.experienceLevel} professional, we'll focus on showcasing your expertise and building your confidence for this critical interview stage!`;
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

    const questionPrompt = `Generate a concise ${session.interviewStage} interview question for ${session.jobPosition}. Requirements: ${session.experienceLevel} level, STAR-suitable, industry-relevant for ${session.primaryIndustry}. Format: "Question text" followed by "Context: Why this matters (1 sentence)". Keep total under 50 words.`;

    try {
      const response = await aiRouter.generateResponse({
        messages: [{ role: 'user', content: questionPrompt }],
        maxTokens: 600,
        temperature: 0.8
      });
      return response.content.trim();
    } catch (error) {
      console.error('Error generating contextual question:', error);
      
      // Fallback to question bank if available
      if (questionBank && questionBank.length > 0) {
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
      const response = await aiRouter.generateResponse({
        messages: [{ role: 'user', content: analysisPrompt }],
        maxTokens: 1000,
        temperature: 0.3
      });
      const cleanResponse = response.content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
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
    const { session, messages } = context;
    
    // Get the current question being answered
    const currentQuestion = messages
      .filter(m => m.messageType === 'coach' && m.coachingType === 'question')
      .pop()?.content || 'the interview question';

    const feedbackPrompt = `
Analyze this interview response and provide specific feedback in JSON format:

QUESTION: ${currentQuestion}
RESPONSE: ${userResponse}
POSITION: ${session.jobPosition} at ${session.companyName}
STAGE: ${session.interviewStage}

Provide feedback with 3-4 improvement points (mix of strengths ✓ and areas ⚠) and a model answer that directly addresses the specific question asked.

{
  "improvementPoints": [
    "✓ Clear situation context",
    "✓ Good action details", 
    "⚠ Add specific metrics",
    "⚠ Stronger result impact"
  ],
  "modelAnswer": "At [Company], I led [specific situation]. My task was [clear objective]. I [specific actions with details]. This resulted in [quantified outcome with business impact]."
}

Focus on STAR structure and make the model answer relevant to the specific question. Keep improvement points concise but actionable. JSON only.`;

    try {
      const response = await aiRouter.generateResponse({
        messages: [{ role: 'user', content: feedbackPrompt }],
        maxTokens: 300,
        temperature: 0.3
      });
      
      // Parse JSON response
      const cleanResponse = response.content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const feedback = JSON.parse(jsonMatch[0]);
        
        // Keep feedback structured but allow more detail
        const structuredFeedback = {
          improvementPoints: (feedback.improvementPoints || []).slice(0, 4), // Allow up to 4 points
          modelAnswer: feedback.modelAnswer || this.generateDefaultModelAnswer(currentQuestion, session),
          starScores: {
            situation: starAnalysis.situation.score,
            task: starAnalysis.task.score,
            action: starAnalysis.action.score,
            result: starAnalysis.result.score,
            overall: Math.round((starAnalysis.situation.score + starAnalysis.task.score + starAnalysis.action.score + starAnalysis.result.score) / 4)
          }
        };
        
        return structuredFeedback;
      }
      
      return this.getDefaultCoachingFeedback(starAnalysis);
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
      const response = await aiRouter.generateResponse({
        messages: [{ role: 'user', content: modelAnswerPrompt }],
        maxTokens: 50,
        temperature: 0.5
      });
      const cleanResponse = response.content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
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
    const rawSummary = await this.generateSessionSummary(context);
    const cleanSummary = this.cleanAIResponse(rawSummary);
    
    // Save completion message
    await this.saveCoachingMessage(sessionId, {
      sessionId,
      messageType: 'coach',
      content: cleanSummary,
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
   * Generate brief session summary
   */
  private async generateSessionSummary(context: CoachingContext): Promise<string> {
    const { session, messages } = context;
    const userResponses = messages.filter(m => m.messageType === 'user').length;
    
    // Return ultra-brief completion message
    return `✓ Session complete! Completed ${userResponses} questions for ${session.jobPosition} interview prep.`;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Clean AI response to extract user-facing content only
   */
  private cleanAIResponse(response: string): string {
    // Remove any <think> tags and their content
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // Remove the specific AI reasoning pattern that appears in our responses
    cleaned = cleaned.replace(/^[\s\S]*?>\s*\n\n/, '');
    
    // Remove internal thinking patterns like "Okay, let's tackle this..."
    const thinkingPatterns = [
      /^Okay, let's tackle this[\s\S]*?(?=\n\n|\d+\.|\*\*|$)/,
      /^Let me tackle this[\s\S]*?(?=\n\n|\d+\.|\*\*|$)/,
      /^I need to[\s\S]*?(?=\n\n|\d+\.|\*\*|$)/,
      /^The user wants[\s\S]*?(?=\n\n|\d+\.|\*\*|$)/,
      /^First,[\s\S]*?(?=\n\n|\d+\.|\*\*|$)/,
    ];
    
    for (const pattern of thinkingPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Handle [Question text: ...] format specifically
    const questionTextMatch = cleaned.match(/\[Question text:\s*([\s\S]+?)\]/);
    if (questionTextMatch) {
      return questionTextMatch[1].trim();
    }
    
    // Handle standalone [Question text] without content - this indicates a generation error
    if (cleaned.includes('[Question text]')) {
      return 'Please provide a specific example from your experience that demonstrates your skills and accomplishments in this area.';
    }
    
    // Look for quoted content (typical AI response pattern)
    const quotedMatch = cleaned.match(/"([^"]+(?:\s[^"]*)*?)"/);
    if (quotedMatch) {
      return quotedMatch[1].trim();
    }
    
    // Look for content after markdown-style patterns
    const markdownMatch = cleaned.match(/\*\*Question:\*\*\s*([\s\S]+?)(?:\*\*Context:\*\*|$)/);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }
    
    // Look for numbered lists or structured content (typical for summaries/feedback)
    const numberedMatch = cleaned.match(/(?:\d+\.\s*[\s\S]+?)(?=\n\n|$)/);
    if (numberedMatch) {
      return cleaned.trim();
    }
    
    // Look for content after common AI reasoning patterns
    const patterns = [
      /(?:Here's|I'll provide|Let me create|I'll generate)[\s\S]*?[:]\s*(.+)/i,
      /(?:Response|Answer):\s*(.+)/i,
      /\*\*Question:\*\*\s*([\s\S]+?)(?:\*\*|$)/,
      /Context:[\s\S]*?Question[^:]*:\s*(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Split by double newlines and take the last substantial paragraph
    const paragraphs = cleaned.split('\n\n').filter(p => p.trim().length > 30);
    if (paragraphs.length > 0) {
      return paragraphs[paragraphs.length - 1].trim();
    }
    
    // If no patterns match, return first substantial sentence
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      return sentences[0].trim() + '.';
    }
    
    // Fallback: return cleaned response
    return cleaned.trim();
  }

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
      improvementPoints: [
        '✓ Good structure',
        '⚠ Add specific metrics',
        '⚠ Include more context',
        '⚠ Strengthen results'
      ],
      modelAnswer: "In my role at [Company], I faced [situation]. I was responsible for [task]. I took these actions: [specific steps]. This delivered [quantified results with business impact].",
      starScores: {
        situation: starAnalysis.situation.score,
        task: starAnalysis.task.score,
        action: starAnalysis.action.score,
        result: starAnalysis.result.score,
        overall: Math.round((starAnalysis.situation.score + starAnalysis.task.score + starAnalysis.action.score + starAnalysis.result.score) / 4)
      }
    };
  }

  private generateDefaultModelAnswer(questionText: string, session: CoachingSession): string {
    const questionLower = questionText.toLowerCase();
    
    if (questionLower.includes('campaign') || questionLower.includes('marketing')) {
      return `At ${session.companyName || '[Company]'}, I led a marketing campaign that increased brand awareness by 30% and generated $2M in new revenue. I identified our target audience, developed a multi-channel strategy, executed across digital and traditional media, and achieved measurable results that exceeded our goals.`;
    }
    
    if (questionLower.includes('team') || questionLower.includes('leadership')) {
      return `As ${session.jobPosition || 'team lead'} at ${session.companyName || '[Company]'}, I managed a cross-functional team of 8 people. When we faced project delays, I restructured workflows, implemented daily standups, and prioritized critical tasks. This improved delivery speed by 40% and team satisfaction by 25%.`;
    }
    
    if (questionLower.includes('challenge') || questionLower.includes('problem')) {
      return `In my role at ${session.companyName || '[Company]'}, I encountered a critical issue that threatened our Q4 targets. I analyzed root causes, developed a comprehensive solution plan, coordinated with stakeholders, and implemented changes that not only resolved the issue but improved efficiency by 35%.`;
    }
    
    // Default template
    return `In my position as ${session.jobPosition || 'professional'} at ${session.companyName || '[Company]'}, I faced a significant challenge that required strategic thinking. I assessed the situation thoroughly, defined clear objectives, executed a structured plan with measurable milestones, and delivered results that exceeded expectations by 25%.`;
  }

  private getDefaultModelAnswer(session: CoachingSession | null): string {
    return 'In my role at [Company], I faced [specific challenge] (Situation). My task was to [objective] (Task). I implemented [specific actions] including [details] (Action). This resulted in [quantified outcome] such as [specific metrics] (Result).';
  }
}

export const coachingEngineService = new CoachingEngineService();