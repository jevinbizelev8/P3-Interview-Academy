import { db } from "../db";
import { assessments, assessmentCriteria, performanceTrends, interviewSessions, interviewScenarios } from "@shared/schema";
import type { Assessment, InsertAssessment, AssessmentWithCriteria, UserPerformanceOverview } from "@shared/schema";
import { eq, desc, avg, count } from "drizzle-orm";
// import { generateAssessmentFeedback } from "./bedrock";

// Assessment criteria as defined in the PRD
export const ASSESSMENT_CRITERIA = [
  { name: "relevance", label: "Relevance", description: "How relevant and appropriate the responses were to the questions asked" },
  { name: "structured", label: "Structured (STAR)", description: "Use of the STAR method - Situation, Task, Action, Result" },
  { name: "specific", label: "Specific", description: "Providing specific details and concrete examples rather than vague statements" },
  { name: "honest", label: "Honest", description: "Authenticity and truthfulness in responses" },
  { name: "confident", label: "Confident", description: "Demonstrating confidence without appearing arrogant" },
  { name: "aligned", label: "Aligned with Role", description: "Responses align with the target role and company culture" },
  { name: "outcomeOriented", label: "Outcome-Oriented", description: "Focus on results, achievements, and measurable outcomes" }
];

export interface AssessmentScores {
  relevanceScore: number;
  structuredScore: number;
  specificScore: number;
  honestScore: number;
  confidentScore: number;
  alignedScore: number;
  outcomeOrientedScore: number;
}

export interface AssessmentFeedback {
  scores: AssessmentScores;
  overallScore: number;
  overallGrade: string;
  strengths: string;
  improvements: string;
  specificFeedback: string;
  nextSteps: string;
}

export class AssessmentService {
  
  // Generate comprehensive assessment for a completed interview session
  async assessInterviewSession(sessionId: string, userId: string): Promise<Assessment> {
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

    // Generate AI-powered assessment
    const assessmentFeedback = await this.generateAIAssessment(session);
    
    // Calculate overall grade
    const grade = this.calculateGrade(assessmentFeedback.overallScore);
    
    // Create assessment record
    const [assessment] = await db.insert(assessments).values({
      sessionId,
      userId,
      relevanceScore: assessmentFeedback.scores.relevanceScore,
      structuredScore: assessmentFeedback.scores.structuredScore,
      specificScore: assessmentFeedback.scores.specificScore,
      honestScore: assessmentFeedback.scores.honestScore,
      confidentScore: assessmentFeedback.scores.confidentScore,
      alignedScore: assessmentFeedback.scores.alignedScore,
      outcomeOrientedScore: assessmentFeedback.scores.outcomeOrientedScore,
      overallScore: assessmentFeedback.overallScore.toString(),
      overallGrade: grade,
      strengths: assessmentFeedback.strengths,
      improvements: assessmentFeedback.improvements,
      specificFeedback: assessmentFeedback.specificFeedback,
      nextSteps: assessmentFeedback.nextSteps,
    }).returning();

    // Create detailed criteria records
    await this.createCriteriaRecords(assessment.id, assessmentFeedback);
    
    // Update performance trends
    await this.updatePerformanceTrends(userId, assessmentFeedback.scores);

    return assessment;
  }

  // Generate AI-powered assessment using Claude
  private async generateAIAssessment(session: any): Promise<AssessmentFeedback> {
    try {
      // Prepare conversation context for AI assessment
      const conversation = session.messages.map((msg: { messageType: string; content: string; timestamp: Date }) => ({
        role: msg.messageType === 'ai' ? 'interviewer' : 'candidate',
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const assessmentPrompt = `
You are an expert interview coach evaluating a candidate's performance in a ${session.scenario.interviewStage} interview for a ${session.scenario.jobRole} position at ${session.scenario.industry} company.

INTERVIEW CONTEXT:
- Role: ${session.scenario.jobRole}
- Company: ${session.scenario.industry}
- Interview Stage: ${session.scenario.interviewStage}
- Scenario: ${session.scenario.title}

CONVERSATION TRANSCRIPT:
${conversation.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

ASSESSMENT CRITERIA (Score 1-5 for each):
1. RELEVANCE: How relevant and appropriate the responses were to the questions asked
2. STRUCTURED (STAR): Use of the STAR method - Situation, Task, Action, Result
3. SPECIFIC: Providing specific details and concrete examples rather than vague statements
4. HONEST: Authenticity and truthfulness in responses
5. CONFIDENT: Demonstrating confidence without appearing arrogant
6. ALIGNED: Responses align with the target role and company culture
7. OUTCOME-ORIENTED: Focus on results, achievements, and measurable outcomes

Please provide a comprehensive assessment in the following JSON format:
{
  "scores": {
    "relevanceScore": [1-5],
    "structuredScore": [1-5],
    "specificScore": [1-5],
    "honestScore": [1-5],
    "confidentScore": [1-5],
    "alignedScore": [1-5],
    "outcomeOrientedScore": [1-5]
  },
  "strengths": "2-3 key strengths observed in the interview",
  "improvements": "2-3 specific areas for improvement",
  "specificFeedback": "Detailed analysis of the candidate's performance with specific examples",
  "nextSteps": "Actionable recommendations for continued improvement"
}

Be specific, constructive, and reference actual examples from the conversation.
`;

      // Temporary mock assessment until AWS Bedrock is configured
      const feedback = await this.generateMockAssessment();
      
      // Calculate overall score
      const totalScore = Object.values(feedback.scores).reduce((sum: number, score: number) => sum + score, 0);
      const overallScore = totalScore / 7;

      return {
        ...feedback,
        overallScore: Math.round(overallScore * 100) / 100
      };

    } catch (error) {
      console.error("Error generating AI assessment:", error);
      
      // Fallback assessment if AI fails
      const defaultScores = {
        relevanceScore: 3,
        structuredScore: 3,
        specificScore: 3,
        honestScore: 3,
        confidentScore: 3,
        alignedScore: 3,
        outcomeOrientedScore: 3
      };

      return {
        scores: defaultScores,
        overallScore: 3.0,
        overallGrade: "C",
        strengths: "Completed the interview and provided responses to all questions.",
        improvements: "Consider using the STAR method for more structured responses and providing specific examples.",
        specificFeedback: "Assessment system encountered an issue. Please review your responses and consider practicing with more specific examples.",
        nextSteps: "Continue practicing interview skills and focus on providing detailed, structured responses."
      };
    }
  }

  // Create detailed criteria records
  private async createCriteriaRecords(assessmentId: string, feedback: AssessmentFeedback) {
    const criteriaRecords = ASSESSMENT_CRITERIA.map(criteria => ({
      assessmentId,
      criteriaName: criteria.name,
      score: feedback.scores[criteria.name as keyof AssessmentScores],
      feedback: `${criteria.description} - Score: ${feedback.scores[criteria.name as keyof AssessmentScores]}/5`,
      examples: feedback.specificFeedback // AI can provide specific examples here
    }));

    await db.insert(assessmentCriteria).values(criteriaRecords);
  }

  // Update performance trends for user
  private async updatePerformanceTrends(userId: string, scores: AssessmentScores) {
    for (const [criteriaName, score] of Object.entries(scores)) {
      // Get existing trend or create new one
      const existingTrend = await db.query.performanceTrends.findFirst({
        where: eq(performanceTrends.userId, userId) && eq(performanceTrends.criteriaName, criteriaName)
      });

      if (existingTrend) {
        // Update existing trend
        const currentScores = Array.isArray(existingTrend.scores) ? existingTrend.scores : [];
        const newScores = [...currentScores, { score, date: new Date().toISOString() }];
        
        // Calculate trend
        const trend = this.calculateTrend(newScores.map(s => s.score));
        
        await db.update(performanceTrends)
          .set({
            scores: newScores,
            trend,
            lastUpdated: new Date()
          })
          .where(eq(performanceTrends.id, existingTrend.id));
      } else {
        // Create new trend
        await db.insert(performanceTrends).values({
          userId,
          criteriaName,
          scores: [{ score, date: new Date().toISOString() }],
          trend: "stable"
        });
      }
    }
  }

  // Calculate performance trend
  private calculateTrend(scores: number[]): string {
    if (scores.length < 2) return "stable";
    
    const recent = scores.slice(-3); // Last 3 scores
    const avg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const previousAvg = scores.slice(-6, -3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length - 3);
    
    if (avg > previousAvg + 0.3) return "improving";
    if (avg < previousAvg - 0.3) return "declining";
    return "stable";
  }

  // Temporary mock assessment generator
  private async generateMockAssessment(): Promise<AssessmentFeedback> {
    // Generate realistic scores between 2-5 with some randomness
    const generateScore = () => Math.floor(Math.random() * 4) + 2; // 2-5 range
    
    const scores = {
      relevanceScore: generateScore(),
      structuredScore: generateScore(),
      specificScore: generateScore(),
      honestScore: generateScore(),
      confidentScore: generateScore(),
      alignedScore: generateScore(),
      outcomeOrientedScore: generateScore()
    };

    return {
      scores,
      overallScore: 0, // Will be calculated
      overallGrade: "", // Will be calculated
      strengths: "Good communication skills and relevant experience. Demonstrated understanding of key concepts.",
      improvements: "Consider using the STAR method more consistently. Provide more specific examples and quantifiable results.",
      specificFeedback: "Your responses showed good technical knowledge. Focus on structuring answers with clear situation, task, action, and result components.",
      nextSteps: "Practice behavioral questions using STAR format. Research company-specific examples. Work on confident delivery."
    };
  }

  // Calculate letter grade from score
  private calculateGrade(score: number): string {
    if (score >= 4.5) return "A";
    if (score >= 3.5) return "B";
    if (score >= 2.5) return "C";
    if (score >= 1.5) return "D";
    return "F";
  }

  // Get user's assessment history
  async getUserAssessments(userId: string, limit: number = 10): Promise<AssessmentWithCriteria[]> {
    return await db.query.assessments.findMany({
      where: eq(assessments.userId, userId),
      with: {
        criteria: true,
        session: {
          with: {
            scenario: true
          }
        }
      },
      orderBy: [desc(assessments.assessmentDate)],
      limit
    });
  }

  // Get comprehensive user performance overview
  async getUserPerformanceOverview(userId: string): Promise<UserPerformanceOverview> {
    const userAssessments = await this.getUserAssessments(userId, 20);
    
    if (userAssessments.length === 0) {
      throw new Error("No assessments found for user");
    }

    // Calculate statistics
    const totalAssessments = userAssessments.length;
    const averageScore = userAssessments.reduce((sum, assessment) => sum + parseFloat(assessment.overallScore), 0) / totalAssessments;
    const currentGrade = this.calculateGrade(averageScore);

    // Find strongest and weakest criteria
    const criteriaAverages = ASSESSMENT_CRITERIA.map(criteria => {
      const scores = userAssessments.map(assessment => {
        const fieldName = criteria.name + 'Score' as keyof Assessment;
        return assessment[fieldName] as number;
      });
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return { name: criteria.label, average: avg };
    });

    criteriaAverages.sort((a, b) => b.average - a.average);
    const strongestCriteria = criteriaAverages[0].name;
    const weakestCriteria = criteriaAverages[criteriaAverages.length - 1].name;

    // Calculate recent trend
    const recentScores = userAssessments.slice(0, 5).map(a => parseFloat(a.overallScore));
    const recentTrend = this.calculateTrend(recentScores.reverse());

    return {
      user: {} as any, // Will be populated from the API route
      totalAssessments,
      averageScore: Math.round(averageScore * 100) / 100,
      currentGrade,
      strongestCriteria,
      weakestCriteria,
      recentTrend,
      assessments: userAssessments.map(a => a as Assessment)
    };
  }
}

export const assessmentService = new AssessmentService();