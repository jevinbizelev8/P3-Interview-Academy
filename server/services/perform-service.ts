import { db } from "../db";
import { 
  assessments, 
  simulationQuestions, 
  performanceIndicators, 
  learningDrills,
  interviewSessions, 
  interviewScenarios 
} from "@shared/schema";
import type { 
  Assessment, 
  InsertAssessment, 
  AssessmentWithDetails, 
  UserPerformanceOverview,
  SimulationRequest,
  SimulationQuestion,
  LearningDrill
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

// Performance indicators as per team requirements
export const PERFORMANCE_INDICATORS = [
  { key: 'communication', name: 'Communication Clarity', description: 'Clear, articulate communication with appropriate tone' },
  { key: 'empathy', name: 'Empathy', description: 'Understanding and relating to others\' perspectives' },
  { key: 'problemSolving', name: 'Problem Solving', description: 'Analytical thinking and solution-oriented approach' },
  { key: 'culturalAlignment', name: 'Cultural Alignment', description: 'Alignment with company values and culture' }
];

export const PERFORMANCE_RATINGS = [
  { range: [4.5, 5.0], rating: 'Outstanding', description: 'Exceptional performance, consistently exceeds expectations' },
  { range: [4.0, 4.4], rating: 'Competent', description: 'Strong performance, meets and often exceeds expectations' },
  { range: [3.0, 3.9], rating: 'Developing', description: 'Good performance with room for targeted improvement' },
  { range: [2.0, 2.9], rating: 'Needs Practice', description: 'Basic performance, requires focused development' },
  { range: [1.0, 1.9], rating: 'Emerging', description: 'Early stage, needs significant improvement and practice' }
];

export class PerformService {
  
  // Generate AI-powered simulation questions based on job role and company
  async generateSimulationQuestions(request: SimulationRequest): Promise<SimulationQuestion[]> {
    const { jobRole, companyName, questionCount, difficultyLevel, questionTypes } = request;
    
    try {
      // Generate contextual questions using AI
      const generatedQuestions = await this.generateAIQuestions(jobRole, companyName, questionCount, difficultyLevel, questionTypes);
      
      // Save to database
      const savedQuestions = await db.insert(simulationQuestions).values(generatedQuestions).returning();
      
      return savedQuestions;
      
    } catch (error) {
      console.error("Error generating simulation questions:", error);
      
      // Fallback to predefined questions if AI fails
      return await this.getFallbackQuestions(jobRole, companyName, questionTypes, questionCount);
    }
  }

  // Generate AI questions (mock implementation - will integrate with Anthropic)
  private async generateAIQuestions(jobRole: string, companyName: string, questionCount: number, difficultyLevel: number, questionTypes: string[]): Promise<any[]> {
    // Mock AI-generated questions based on role and company
    const questionTemplates = {
      behavioral: [
        {
          question: `Tell me about a time when you had to solve a complex problem in your role as a ${jobRole}. How did you approach it?`,
          context: `This question assesses problem-solving skills specific to ${jobRole} at ${companyName}`,
          expectedOutcomes: ['STAR method usage', 'Technical competency', 'Problem-solving process']
        },
        {
          question: `Describe a situation where you had to work with a difficult team member. How did you handle it?`,
          context: `Evaluates interpersonal skills and conflict resolution in ${companyName} context`,
          expectedOutcomes: ['Empathy demonstration', 'Communication skills', 'Team collaboration']
        }
      ],
      technical: [
        {
          question: `How would you approach designing a system for ${companyName}'s specific needs as a ${jobRole}?`,
          context: `Technical design question tailored to ${jobRole} responsibilities`,
          expectedOutcomes: ['Technical architecture', 'Company-specific considerations', 'Scalability thinking']
        }
      ],
      situational: [
        {
          question: `If ${companyName} needed to implement a major change in your department, how would you ensure smooth adoption?`,
          context: `Change management scenario relevant to ${jobRole} and ${companyName}`,
          expectedOutcomes: ['Change management skills', 'Stakeholder communication', 'Strategic thinking']
        }
      ]
    };

    const questions = [];
    for (const type of questionTypes) {
      const templates = questionTemplates[type as keyof typeof questionTemplates] || [];
      const questionsNeeded = Math.ceil(questionCount / questionTypes.length);
      
      for (let i = 0; i < Math.min(questionsNeeded, templates.length); i++) {
        questions.push({
          jobRole,
          companyName,
          questionType: type,
          question: templates[i].question,
          context: templates[i].context,
          expectedOutcomes: templates[i].expectedOutcomes,
          difficultyLevel
        });
      }
    }

    return questions.slice(0, questionCount);
  }

  // Fallback questions if AI generation fails
  private async getFallbackQuestions(jobRole: string, companyName: string, questionTypes: string[], count: number): Promise<SimulationQuestion[]> {
    // Check if we have existing questions for this role/company combo
    const existing = await db.select()
      .from(simulationQuestions)
      .where(
        and(
          eq(simulationQuestions.jobRole, jobRole),
          eq(simulationQuestions.companyName, companyName)
        )
      )
      .limit(count);

    return existing;
  }

  // Create comprehensive performance assessment
  async createPerformanceAssessment(sessionId: string, userId: string, jobRole?: string, companyName?: string): Promise<Assessment> {
    // Get session with messages and scenario
    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.timestamp)]
        },
        scenario: true
      }
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Generate AI-powered performance assessment
    const performanceData = await this.generatePerformanceAnalysis(session, jobRole, companyName);
    
    // Create assessment record
    const [assessment] = await db.insert(assessments).values({
      sessionId,
      userId,
      communicationScore: performanceData.indicators.communication,
      empathyScore: performanceData.indicators.empathy,
      problemSolvingScore: performanceData.indicators.problemSolving,
      culturalAlignmentScore: performanceData.indicators.culturalAlignment,
      overallScore: performanceData.overallScore.toString(),
      overallRating: performanceData.overallRating,
      strengths: performanceData.qualitative.strengths,
      improvementAreas: performanceData.qualitative.improvements,
      qualitativeObservations: performanceData.qualitative.observations,
      actionableInsights: performanceData.actionableInsights,
      starMethodRecommendations: performanceData.starMethodRecommendations,
      personalizedDrills: performanceData.personalizedDrills,
      selfReflectionPrompts: performanceData.selfReflectionPrompts,
      progressLevel: performanceData.progressLevel,
      performanceBadge: performanceData.badge
    }).returning();

    // Create detailed performance indicators
    await this.createPerformanceIndicators(assessment.id, performanceData.indicators);
    
    // Create personalized learning drills
    await this.createLearningDrills(assessment.id, userId, performanceData.drills);

    return assessment;
  }

  // Generate comprehensive performance analysis (mock implementation)
  private async generatePerformanceAnalysis(session: any, jobRole?: string, companyName?: string) {
    // Mock AI-powered analysis - would integrate with Anthropic Claude
    const mockScores = {
      communication: Math.floor(Math.random() * 2) + 3, // 3-5 range
      empathy: Math.floor(Math.random() * 2) + 3,
      problemSolving: Math.floor(Math.random() * 2) + 3,
      culturalAlignment: Math.floor(Math.random() * 2) + 3
    };

    const overallScore = (mockScores.communication + mockScores.empathy + mockScores.problemSolving + mockScores.culturalAlignment) / 4;
    const overallRating = this.calculatePerformanceRating(overallScore);

    return {
      indicators: mockScores,
      overallScore: Math.round(overallScore * 100) / 100,
      overallRating,
      qualitative: {
        strengths: "Demonstrated strong communication skills and authentic responses. Good use of specific examples.",
        improvements: "Focus on more structured STAR method responses and quantifying achievements.",
        observations: "Candidate showed genuine interest and good cultural fit indicators. Technical knowledge was evident but could be presented more systematically."
      },
      actionableInsights: "Practice STAR method with 3-5 specific examples for each competency area. Prepare quantified metrics for your key achievements. Research company values more deeply.",
      starMethodRecommendations: "Structure responses with clear Situation setup (30 seconds), Task definition (20 seconds), detailed Action steps (60 seconds), and specific Results with metrics (30 seconds).",
      personalizedDrills: [
        { type: "star_method", title: "STAR Method Practice", priority: "high" },
        { type: "communication", title: "Clear Communication Drills", priority: "medium" },
        { type: "cultural_fit", title: "Company Values Alignment", priority: "medium" }
      ],
      selfReflectionPrompts: [
        "What specific examples best demonstrate your problem-solving abilities?",
        "How do your values align with the company's mission and culture?",
        "What metrics or outcomes can you use to quantify your past achievements?"
      ],
      drills: [
        {
          drillType: "star_method",
          title: "STAR Method Mastery",
          description: "Practice structuring behavioral interview responses using the STAR method",
          scenario: `You're interviewing for a ${jobRole || 'leadership'} position at ${companyName || 'a top company'}. Practice answering behavioral questions with clear STAR structure.`,
          targetSkill: "Structured Response Technique",
          estimatedDuration: 15
        },
        {
          drillType: "communication",
          title: "Clear Communication Practice",
          description: "Improve clarity and conciseness in interview responses",
          scenario: "Practice explaining complex concepts in simple, clear language that any interviewer can understand.",
          targetSkill: "Communication Clarity",
          estimatedDuration: 10
        }
      ],
      progressLevel: Math.floor(overallScore),
      badge: overallScore >= 4.5 ? "Interview Excellence" : overallScore >= 4.0 ? "Strong Performer" : overallScore >= 3.5 ? "Competent Candidate" : "Developing Skills"
    };
  }

  // Create performance indicator records
  private async createPerformanceIndicators(assessmentId: string, indicators: any) {
    const indicatorData = PERFORMANCE_INDICATORS.map(indicator => ({
      assessmentId,
      indicatorType: indicator.key,
      score: indicators[indicator.key as keyof typeof indicators],
      description: indicator.description,
      visualData: {
        type: 'radar',
        value: indicators[indicator.key as keyof typeof indicators],
        maxValue: 5,
        label: indicator.name
      }
    }));

    await db.insert(performanceIndicators).values(indicatorData);
  }

  // Create personalized learning drills
  private async createLearningDrills(assessmentId: string, userId: string, drills: any[]) {
    const drillData = drills.map(drill => ({
      assessmentId,
      userId,
      drillType: drill.drillType,
      title: drill.title,
      description: drill.description,
      scenario: drill.scenario,
      targetSkill: drill.targetSkill,
      estimatedDuration: drill.estimatedDuration
    }));

    await db.insert(learningDrills).values(drillData);
  }

  // Calculate performance rating based on score
  private calculatePerformanceRating(score: number): string {
    const rating = PERFORMANCE_RATINGS.find(r => score >= r.range[0] && score <= r.range[1]);
    return rating?.rating || 'Needs Practice';
  }

  // Get user's assessment history with full details
  async getUserAssessmentHistory(userId: string, limit: number = 10): Promise<Assessment[]> {
    return await db.select().from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(limit);
  }

  // Get comprehensive performance overview
  async getUserPerformanceOverview(userId: string): Promise<UserPerformanceOverview> {
    const userAssessments = await this.getUserAssessmentHistory(userId, 20);
    
    if (userAssessments.length === 0) {
      throw new Error("No assessments found for user");
    }

    // Calculate statistics
    const totalAssessments = userAssessments.length;
    const averageScore = userAssessments.reduce((sum, assessment) => sum + parseFloat(assessment.overallScore), 0) / totalAssessments;
    const currentRating = this.calculatePerformanceRating(averageScore);

    // Find strongest and weakest indicators
    const indicatorAverages = PERFORMANCE_INDICATORS.map(indicator => {
      const scores = userAssessments.map(assessment => {
        const fieldName = indicator.key + 'Score' as keyof Assessment;
        return assessment[fieldName] as number;
      });
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return { name: indicator.name, average: avg };
    });

    indicatorAverages.sort((a, b) => b.average - a.average);
    const strongestIndicator = indicatorAverages[0].name;
    const weakestIndicator = indicatorAverages[indicatorAverages.length - 1].name;

    // Calculate progress metrics
    const allDrills = userAssessments.flatMap(a => a.drills);
    const completedDrills = allDrills.filter(d => d.completed).length;
    const availableDrills = allDrills.length;

    // Get performance badges
    const performanceBadges = [...new Set(userAssessments.map(a => a.performanceBadge).filter(Boolean))];

    // Calculate recent trend
    const recentScores = userAssessments.slice(0, 5).map(a => parseFloat(a.overallScore));
    const recentTrend = this.calculateTrend(recentScores.reverse());

    return {
      user: {} as any, // Will be populated from API route
      totalAssessments,
      averageScore: Math.round(averageScore * 100) / 100,
      currentRating,
      strongestIndicator,
      weakestIndicator,
      recentTrend,
      progressLevel: Math.max(...userAssessments.map(a => a.progressLevel || 1)),
      completedDrills,
      availableDrills,
      performanceBadges,
      assessments: userAssessments
    };
  }

  // Calculate performance trend
  private calculateTrend(scores: number[]): string {
    if (scores.length < 2) return "stable";
    
    const recent = scores.slice(-3);
    const avg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const previousAvg = scores.slice(-6, -3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length - 3);
    
    if (avg > previousAvg + 0.3) return "improving";
    if (avg < previousAvg - 0.3) return "declining";
    return "stable";
  }

  // Get available learning drills for user
  async getUserLearningDrills(userId: string): Promise<LearningDrill[]> {
    return await db.select()
      .from(learningDrills)
      .where(eq(learningDrills.userId, userId))
      .orderBy(desc(learningDrills.createdAt));
  }

  // Complete a learning drill
  async completeLearningDrill(drillId: string, userId: string): Promise<LearningDrill> {
    const [updatedDrill] = await db.update(learningDrills)
      .set({ 
        completed: true, 
        completedAt: new Date() 
      })
      .where(and(
        eq(learningDrills.id, drillId),
        eq(learningDrills.userId, userId)
      ))
      .returning();

    return updatedDrill;
  }
}

export const performService = new PerformService();