import { storage } from "../storage";
import { sealionService } from "./sealion";
import { languageService } from "./language-service";
import type { 
  PreparationSession, 
  InsertPreparationSession, 
  StudyPlan, 
  InsertStudyPlan,
  PreparationResource,
  InsertPreparationResource,
  PracticeTest,
  InsertPracticeTest,
  CompanyResearch,
  InsertCompanyResearch,
  StarPracticeSession,
  InsertStarPracticeSession,
  PreparationProgress,
  InsertPreparationProgress,
  SUPPORTED_LANGUAGES,
  SupportedLanguage
} from "@shared/schema";

export class PrepareService {
  
  // ================================
  // PREPARATION SESSIONS
  // ================================
  
  async createPreparationSession(userId: string, data: InsertPreparationSession): Promise<PreparationSession> {
    return storage.createPreparationSession(userId, data);
  }

  async getPreparationSession(sessionId: string): Promise<PreparationSession | null> {
    return storage.getPreparationSession(sessionId);
  }

  async getUserPreparationSessions(userId: string): Promise<PreparationSession[]> {
    return storage.getUserPreparationSessions(userId);
  }

  async updatePreparationSession(sessionId: string, updates: Partial<PreparationSession>): Promise<PreparationSession> {
    return storage.updatePreparationSession(sessionId, updates);
  }

  // ================================
  // AI-POWERED STUDY PLAN GENERATION
  // ================================

  async generateStudyPlan(preparationSessionId: string, options: {
    jobPosition: string;
    companyName?: string;
    interviewDate?: Date;
    timeAvailable?: number; // hours per day
    focusAreas?: string[];
    language?: SupportedLanguage;
  }): Promise<StudyPlan> {
    const session = await storage.getPreparationSession(preparationSessionId);
    if (!session) {
      throw new Error("Preparation session not found");
    }

    // Generate AI-powered study plan
    const prompt = this.buildStudyPlanPrompt(options);
    
    try {
      const aiResponse = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert interview preparation coach. Generate comprehensive, personalized study plans that help candidates succeed in interviews."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 2000,
        temperature: 0.7
      });

      const studyPlanData = this.parseAIStudyPlanResponse(aiResponse, options);
      
      const studyPlan = await storage.createStudyPlan({
        preparationSessionId,
        title: `${options.jobPosition} Interview Preparation Plan`,
        description: `AI-generated study plan for ${options.jobPosition} interview preparation${options.companyName ? ` at ${options.companyName}` : ''}`,
        totalWeeks: studyPlanData.totalWeeks,
        targetSkills: studyPlanData.targetSkills,
        dailyTimeCommitment: options.timeAvailable || 60,
        milestones: studyPlanData.milestones,
        generatedContent: studyPlanData.content,
        customizations: {},
        isActive: true
      });

      // Update preparation session with study plan ID
      await storage.updatePreparationSession(preparationSessionId, {
        studyPlanId: studyPlan.id
      });

      return studyPlan;
    } catch (error) {
      console.error("Error generating study plan:", error);
      // Fallback to template-based study plan
      return this.generateFallbackStudyPlan(preparationSessionId, options);
    }
  }

  private buildStudyPlanPrompt(options: {
    jobPosition: string;
    companyName?: string;
    interviewDate?: Date;
    timeAvailable?: number;
    focusAreas?: string[];
    language?: SupportedLanguage;
  }): string {
    const daysUntilInterview = options.interviewDate 
      ? Math.ceil((options.interviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 14; // Default to 2 weeks

    return `Generate a comprehensive interview preparation study plan for:

Position: ${options.jobPosition}
${options.companyName ? `Company: ${options.companyName}` : ''}
Days until interview: ${daysUntilInterview}
Daily time available: ${options.timeAvailable || 60} minutes
${options.focusAreas?.length ? `Focus areas: ${options.focusAreas.join(', ')}` : ''}

Please provide a JSON response with the following structure:
{
  "totalWeeks": number,
  "targetSkills": ["skill1", "skill2", ...],
  "milestones": [
    {
      "week": number,
      "title": "string",
      "description": "string",
      "tasks": ["task1", "task2", ...],
      "estimatedHours": number
    }
  ],
  "content": {
    "overview": "string",
    "keyStrategies": ["strategy1", "strategy2", ...],
    "dailyRoutine": "string",
    "resources": ["resource1", "resource2", ...]
  }
}

Focus on practical, actionable steps that will help the candidate prepare effectively for their interview.`;
  }

  private parseAIStudyPlanResponse(aiResponse: string, options: any) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed;
    } catch (error) {
      // If AI response is not valid JSON, create a structured fallback
      return this.createFallbackStudyPlanStructure(options);
    }
  }

  private createFallbackStudyPlanStructure(options: any) {
    const daysUntilInterview = options.interviewDate 
      ? Math.ceil((options.interviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 14;
    const totalWeeks = Math.max(1, Math.ceil(daysUntilInterview / 7));

    return {
      totalWeeks,
      targetSkills: [
        "STAR method mastery",
        "Behavioral storytelling",
        "Company research",
        "Technical preparation",
        "Communication skills"
      ],
      milestones: [
        {
          week: 1,
          title: "Foundation Building",
          description: "Master the fundamentals and research the company",
          tasks: [
            "Complete STAR method training",
            "Research company background and culture",
            "Identify 5-7 key stories for behavioral questions",
            "Practice common interview questions"
          ],
          estimatedHours: (options.timeAvailable || 60) * 7 / 60
        }
      ],
      content: {
        overview: `Structured ${totalWeeks}-week preparation plan for ${options.jobPosition} interview`,
        keyStrategies: [
          "Practice STAR method responses",
          "Research company and industry trends",
          "Prepare thoughtful questions to ask",
          "Practice with mock interviews"
        ],
        dailyRoutine: "Dedicate time to skill building, company research, and practice sessions",
        resources: [
          "STAR method templates",
          "Company research guides",
          "Practice questions database",
          "Mock interview sessions"
        ]
      }
    };
  }

  private async generateFallbackStudyPlan(preparationSessionId: string, options: any): Promise<StudyPlan> {
    const studyPlanData = this.createFallbackStudyPlanStructure(options);
    
    return storage.createStudyPlan({
      preparationSessionId,
      title: `${options.jobPosition} Interview Preparation Plan`,
      description: `Template-based study plan for ${options.jobPosition} interview preparation`,
      totalWeeks: studyPlanData.totalWeeks,
      targetSkills: studyPlanData.targetSkills,
      dailyTimeCommitment: options.timeAvailable || 60,
      milestones: studyPlanData.milestones,
      generatedContent: studyPlanData.content,
      customizations: {},
      isActive: true
    });
  }

  // ================================
  // COMPANY RESEARCH ASSISTANT
  // ================================

  async generateCompanyResearch(userId: string, companyName: string, jobPosition?: string): Promise<CompanyResearch> {
    // Check if we already have recent research for this company
    const existingResearch = await storage.getCompanyResearch(userId, companyName);
    if (existingResearch && this.isRecentResearch(existingResearch.lastUpdated)) {
      return existingResearch;
    }

    const prompt = this.buildCompanyResearchPrompt(companyName, jobPosition);
    
    try {
      const aiResponse = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are a professional research assistant specializing in company analysis for interview preparation. Provide comprehensive, accurate, and up-to-date information about companies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 3000,
        temperature: 0.3
      });

      const researchData = this.parseCompanyResearchResponse(aiResponse, companyName);
      
      // Save or update company research
      if (existingResearch) {
        return storage.updateCompanyResearch(existingResearch.id, researchData);
      } else {
        return storage.createCompanyResearch({
          userId,
          companyName,
          ...researchData,
          aiGenerated: true
        });
      }
    } catch (error) {
      console.error("Error generating company research:", error);
      // Return basic company research structure
      return this.generateFallbackCompanyResearch(userId, companyName);
    }
  }

  private buildCompanyResearchPrompt(companyName: string, jobPosition?: string): string {
    return `Provide comprehensive research about ${companyName}${jobPosition ? ` for a ${jobPosition} interview` : ''}.

Please provide a JSON response with the following structure:
{
  "industry": "string",
  "companySize": "string",
  "headquarters": "string",
  "website": "string",
  "description": "string",
  "keyProducts": ["product1", "product2", ...],
  "recentNews": [
    {
      "title": "string",
      "summary": "string",
      "date": "string"
    }
  ],
  "leadership": [
    {
      "name": "string",
      "title": "string",
      "background": "string"
    }
  ],
  "culture": {
    "values": ["value1", "value2", ...],
    "workEnvironment": "string",
    "benefits": ["benefit1", "benefit2", ...]
  },
  "financialInfo": {
    "revenue": "string",
    "employees": "string",
    "fundingStatus": "string"
  },
  "competitors": ["competitor1", "competitor2", ...],
  "industryTrends": ["trend1", "trend2", ...],
  "interviewInsights": {
    "commonQuestions": ["question1", "question2", ...],
    "interviewProcess": "string",
    "whatTheyLookFor": ["trait1", "trait2", ...]
  }
}

Focus on information that would be valuable for interview preparation.`;
  }

  private parseCompanyResearchResponse(aiResponse: string, companyName: string) {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return this.createFallbackCompanyResearchStructure(companyName);
    }
  }

  private createFallbackCompanyResearchStructure(companyName: string) {
    return {
      industry: "Technology", // default assumption
      companySize: "Unknown",
      headquarters: "Unknown",
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      description: `${companyName} is a company in the technology sector.`,
      keyProducts: ["Research required"],
      recentNews: [],
      leadership: [],
      culture: {
        values: ["Innovation", "Excellence", "Collaboration"],
        workEnvironment: "Professional",
        benefits: ["Research required"]
      },
      financialInfo: {
        revenue: "Private",
        employees: "Unknown",
        fundingStatus: "Unknown"
      },
      competitors: [],
      industryTrends: [],
      interviewInsights: {
        commonQuestions: [
          "Why do you want to work here?",
          "What do you know about our company?",
          "How would you contribute to our team?"
        ],
        interviewProcess: "Standard interview process",
        whatTheyLookFor: ["Skills match", "Cultural fit", "Growth potential"]
      }
    };
  }

  private async generateFallbackCompanyResearch(userId: string, companyName: string): Promise<CompanyResearch> {
    const researchData = this.createFallbackCompanyResearchStructure(companyName);
    
    return storage.createCompanyResearch({
      userId,
      companyName,
      ...researchData,
      aiGenerated: false
    });
  }

  private isRecentResearch(lastUpdated: Date): boolean {
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate < 7; // Consider research recent if less than 7 days old
  }

  // ================================
  // STAR METHOD PRACTICE
  // ================================

  async createStarPracticeSession(userId: string, data: {
    preparationSessionId?: string;
    scenario: string;
    language?: SupportedLanguage;
  }): Promise<StarPracticeSession> {
    return storage.createStarPracticeSession({
      userId,
      preparationSessionId: data.preparationSessionId || null,
      scenario: data.scenario,
      userResponse: {},
      status: "draft",
      language: data.language || "en"
    });
  }

  async submitStarResponse(sessionId: string, starResponse: {
    situation: string;
    task: string;
    action: string;
    result: string;
  }): Promise<StarPracticeSession> {
    const session = await storage.getStarPracticeSession(sessionId);
    if (!session) {
      throw new Error("STAR practice session not found");
    }

    // Generate AI feedback
    const feedback = await this.generateStarFeedback(session.scenario, starResponse, session.language as SupportedLanguage);
    
    return storage.updateStarPracticeSession(sessionId, {
      userResponse: starResponse,
      aiAnalysis: feedback.analysis,
      scores: feedback.scores,
      feedback: feedback.feedback,
      suggestions: feedback.suggestions,
      status: "completed",
      completedAt: new Date()
    });
  }

  private async generateStarFeedback(scenario: string, response: any, language: SupportedLanguage) {
    const prompt = `Analyze this STAR method response and provide detailed feedback:

Scenario: ${scenario}

Response:
- Situation: ${response.situation}
- Task: ${response.task}  
- Action: ${response.action}
- Result: ${response.result}

Please provide a JSON response with:
{
  "analysis": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "overall": "string"
  },
  "scores": {
    "situation": number (0-5),
    "task": number (0-5),
    "action": number (0-5),
    "result": number (0-5),
    "overall": number (0-5)
  },
  "feedback": "detailed feedback string",
  "suggestions": ["suggestion1", "suggestion2", ...]
}`;

    try {
      const aiResponse = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach specializing in the STAR method. Provide constructive, actionable feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 1500,
        temperature: 0.4
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      console.error("Error generating STAR feedback:", error);
      return this.generateFallbackStarFeedback();
    }
  }

  private generateFallbackStarFeedback() {
    return {
      analysis: {
        strengths: ["Response provided for all STAR components"],
        weaknesses: ["Could use more specific details"],
        overall: "Good foundation, room for improvement in specificity and impact measurement"
      },
      scores: {
        situation: 3,
        task: 3,
        action: 3,
        result: 3,
        overall: 3
      },
      feedback: "Your response covers all STAR components. Focus on adding more specific details and quantifiable results.",
      suggestions: [
        "Add more specific details to the situation",
        "Quantify the results where possible",
        "Emphasize your individual contribution",
        "Include lessons learned or skills developed"
      ]
    };
  }

  // ================================
  // PREPARATION RESOURCES
  // ================================

  async getPreparationResources(filters: {
    category?: string;
    interviewStage?: string;
    industry?: string;
    difficulty?: string;
    language?: SupportedLanguage;
  }): Promise<PreparationResource[]> {
    return storage.getPreparationResources(filters);
  }

  async generateDynamicResource(topic: string, options: {
    resourceType: string;
    interviewStage?: string;
    language?: SupportedLanguage;
    userId?: string;
    industry?: string;
    jobLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    localMarket?: string;
  }): Promise<PreparationResource> {
    
    const language = options.language || "en";
    
    try {
      // Use language service for localized content generation
      if (language !== "en") {
        const localizedResource = await languageService.generateLocalizedResource(
          topic,
          options.resourceType as any,
          language,
          {
            industry: options.industry,
            jobLevel: options.jobLevel,
            localMarket: options.localMarket
          }
        );

        const resource = await storage.createPreparationResource({
          title: localizedResource.title,
          resourceType: options.resourceType,
          category: topic.toLowerCase().replace(/\s+/g, '-'),
          interviewStage: options.interviewStage,
          content: localizedResource.content,
          aiGenerated: true,
          language: language,
          tags: [topic, options.resourceType, ...localizedResource.culturalAdaptations.slice(0, 3)],
          difficulty: "intermediate",
          estimatedReadTime: Math.ceil(localizedResource.content.length / 1000),
          popularity: 0,
          isActive: true,
          createdBy: options.userId
        });

        return resource;
      }

      // Generate English content
      const prompt = this.buildResourceGenerationPrompt(topic, options);
      
      const aiResponse = await sealionService.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert interview preparation content creator. Generate high-quality, actionable preparation materials."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        maxTokens: 2000,
        temperature: 0.6
      });

      const resource = await storage.createPreparationResource({
        title: `${topic} - ${options.resourceType}`,
        resourceType: options.resourceType,
        category: topic.toLowerCase().replace(/\s+/g, '-'),
        interviewStage: options.interviewStage,
        content: aiResponse,
        aiGenerated: true,
        language: language,
        tags: [topic, options.resourceType],
        difficulty: "intermediate",
        estimatedReadTime: Math.ceil(aiResponse.length / 1000),
        popularity: 0,
        isActive: true,
        createdBy: options.userId
      });

      return resource;
    } catch (error) {
      console.error("Error generating resource:", error);
      throw new Error("Failed to generate resource");
    }
  }

  // ================================
  // MULTI-LANGUAGE SUPPORT METHODS
  // ================================

  async generateMultilingualQuestion(
    baseQuestion: string,
    targetLanguage: SupportedLanguage,
    context: {
      jobPosition?: string;
      companyName?: string;
      interviewStage?: string;
      questionType?: 'behavioral' | 'situational' | 'technical' | 'general';
    } = {}
  ) {
    return languageService.generateMultilingualQuestion(baseQuestion, targetLanguage, context);
  }

  async translateContent(
    content: string,
    targetLanguage: SupportedLanguage,
    context: {
      contentType?: 'question' | 'feedback' | 'resource' | 'general';
      preserveFormatting?: boolean;
    } = {}
  ) {
    return languageService.translateContent(content, targetLanguage, context);
  }

  async getLanguageSpecificTips(language: SupportedLanguage) {
    return languageService.getLanguageSpecificTips(language);
  }

  private buildResourceGenerationPrompt(topic: string, options: any): string {
    return `Create a comprehensive ${options.resourceType} about ${topic}${options.interviewStage ? ` for ${options.interviewStage} interviews` : ''}.

${options.resourceType === 'article' ? 'Write a detailed article with practical tips and examples.' : ''}
${options.resourceType === 'template' ? 'Provide a structured template that users can fill out.' : ''}
${options.resourceType === 'checklist' ? 'Create a comprehensive checklist with actionable items.' : ''}
${options.resourceType === 'example' ? 'Provide detailed examples with explanations.' : ''}

Make it practical, actionable, and focused on interview preparation success.`;
  }

  // ================================
  // PROGRESS TRACKING
  // ================================

  async updateProgress(userId: string, preparationSessionId: string, data: {
    activityType: string;
    activityId?: string;
    progress: number;
    timeSpent?: number;
    notes?: string;
  }): Promise<PreparationProgress> {
    // Check if progress entry already exists
    const existing = await storage.getPreparationProgress(userId, preparationSessionId, data.activityType, data.activityId);
    
    if (existing) {
      return storage.updatePreparationProgress(existing.id, {
        progress: data.progress,
        timeSpent: (existing.timeSpent || 0) + (data.timeSpent || 0),
        notes: data.notes,
        status: data.progress >= 100 ? "completed" : "in_progress",
        completedAt: data.progress >= 100 ? new Date() : undefined,
        updatedAt: new Date()
      });
    } else {
      return storage.createPreparationProgress({
        userId,
        preparationSessionId,
        activityType: data.activityType,
        activityId: data.activityId,
        status: data.progress >= 100 ? "completed" : "in_progress",
        progress: data.progress,
        timeSpent: data.timeSpent || 0,
        notes: data.notes,
        completedAt: data.progress >= 100 ? new Date() : undefined
      });
    }
  }

  async getSessionProgress(preparationSessionId: string): Promise<{
    overallProgress: number;
    completedActivities: number;
    totalActivities: number;
    timeSpent: number;
    progressByActivity: Record<string, number>;
  }> {
    const progressEntries = await storage.getSessionProgress(preparationSessionId);
    
    const completed = progressEntries.filter(p => p.status === "completed").length;
    const total = progressEntries.length;
    const totalTime = progressEntries.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    
    const progressByActivity: Record<string, number> = {};
    progressEntries.forEach(p => {
      progressByActivity[p.activityType] = (progressByActivity[p.activityType] || 0) + Number(p.progress || 0);
    });

    return {
      overallProgress: total > 0 ? (completed / total) * 100 : 0,
      completedActivities: completed,
      totalActivities: total,
      timeSpent: totalTime,
      progressByActivity
    };
  }
}

export const prepareService = new PrepareService();