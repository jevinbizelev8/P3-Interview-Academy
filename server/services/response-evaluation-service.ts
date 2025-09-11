// Response Evaluation Service
// Comprehensive AI-powered evaluation using official 9-criteria interview scoring rubric

import { SeaLionService } from "./sealion.js";

interface EvaluationRequest {
  questionText: string;
  questionCategory: string;
  questionType: string;
  responseText: string;
  responseLanguage: string;
  culturalContext?: string;
  jobPosition: string;
  experienceLevel: string;
  starMethodRelevant: boolean;
}

interface StarScores {
  situation: number;    // 1-5 score for situation clarity
  task: number;         // 1-5 score for task identification
  action: number;       // 1-5 score for action description
  result: number;       // 1-5 score for result measurement
  overall: number;      // 1-5 overall STAR score
}

interface DetailedFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  culturalRelevance?: string;
}

interface EvaluationResult {
  // 9-Criteria Official Rubric Scores (1-5 scale)
  relevanceScore: number;              // 15% - Direct, focused answers
  starStructureScore: number;          // 15% - STAR method organization
  specificEvidenceScore: number;       // 15% - Concrete examples with metrics
  roleAlignmentScore: number;          // 15% - Job/company relevance
  outcomeOrientedScore: number;        // 15% - Measurable results focus
  communicationScore: number;          // 10% - Clear, professional tone
  problemSolvingScore: number;         // 10% - Analytical thinking
  culturalFitScore: number;            // 5% - Teamwork, adaptability
  learningAgilityScore: number;        // 5% - Growth orientation
  
  // Calculated scores
  weightedOverallScore: number;        // Weighted average
  overallRating: 'Pass' | 'Borderline' | 'Needs Improvement';
  
  // Legacy STAR scores for backward compatibility
  starScores: StarScores;
  detailedFeedback: DetailedFeedback;
  modelAnswer: string;
  completenessScore: number;           // 1-5 response completeness
  evaluatedBy: 'sealion' | 'openai' | 'rule-based';
}

export class ResponseEvaluationService {
  private seaLionService: SeaLionService;
  private starCriteria: Record<string, string>;

  constructor() {
    this.seaLionService = new SeaLionService();
    this.starCriteria = this.initializeStarCriteria();
  }

  /**
   * Evaluate user response with comprehensive 9-criteria scoring
   */
  async evaluateResponse(request: EvaluationRequest): Promise<EvaluationResult> {
    try {
      console.log(`🎯 Evaluating response for ${request.questionCategory} question`);

      // Try SeaLion AI first for ASEAN cultural context
      if (this.shouldUseSeaLion(request.responseLanguage)) {
        try {
          const seaLionEvaluation = await this.evaluateWithSeaLion(request);
          if (seaLionEvaluation) return seaLionEvaluation;
        } catch (error) {
          console.warn("⚠️ SeaLion evaluation failed, falling back:", error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Fallback to rule-based evaluation
      return this.evaluateWithRules(request);

    } catch (error) {
      console.error("❌ Error evaluating response:", error);
      throw new Error(`Failed to evaluate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Evaluate multiple responses and generate comprehensive session report
   */
  async evaluateSessionResponses(
    responses: Array<{
      questionText: string;
      responseText: string;
      questionCategory: string;
      questionType: string;
    }>,
    sessionContext: {
      jobPosition: string;
      companyName?: string;
      experienceLevel: string;
      responseLanguage: string;
      culturalContext?: string;
    }
  ): Promise<{
    overallScores: EvaluationResult;
    responseEvaluations: EvaluationResult[];
    sessionSummary: {
      totalResponses: number;
      averageScores: Record<string, number>;
      keyStrengths: string[];
      criticalImprovements: string[];
      nextSteps: string[];
    };
  }> {
    console.log(`📊 Evaluating ${responses.length} responses for comprehensive session report`);
    
    const responseEvaluations: EvaluationResult[] = [];
    
    // Evaluate each response individually
    for (const response of responses) {
      const evaluation = await this.evaluateResponse({
        questionText: response.questionText,
        questionCategory: response.questionCategory,
        questionType: response.questionType,
        responseText: response.responseText,
        responseLanguage: sessionContext.responseLanguage,
        culturalContext: sessionContext.culturalContext,
        jobPosition: sessionContext.jobPosition,
        experienceLevel: sessionContext.experienceLevel,
        starMethodRelevant: true // All behavioral questions should use STAR
      });
      
      responseEvaluations.push(evaluation);
    }
    
    // Calculate overall session scores
    const overallScores = this.calculateOverallSessionScores(responseEvaluations);
    
    // Generate session summary
    const sessionSummary = this.generateSessionSummary(responseEvaluations, sessionContext);
    
    return {
      overallScores,
      responseEvaluations,
      sessionSummary
    };
  }
  
  /**
   * Calculate weighted overall scores from individual response evaluations
   */
  private calculateOverallSessionScores(evaluations: EvaluationResult[]): EvaluationResult {
    if (evaluations.length === 0) {
      throw new Error('No evaluations to calculate overall scores');
    }
    
    // Average all criteria scores across responses
    const avgRelevance = evaluations.reduce((sum, e) => sum + e.relevanceScore, 0) / evaluations.length;
    const avgStarStructure = evaluations.reduce((sum, e) => sum + e.starStructureScore, 0) / evaluations.length;
    const avgSpecificEvidence = evaluations.reduce((sum, e) => sum + e.specificEvidenceScore, 0) / evaluations.length;
    const avgRoleAlignment = evaluations.reduce((sum, e) => sum + e.roleAlignmentScore, 0) / evaluations.length;
    const avgOutcomeOriented = evaluations.reduce((sum, e) => sum + e.outcomeOrientedScore, 0) / evaluations.length;
    const avgCommunication = evaluations.reduce((sum, e) => sum + e.communicationScore, 0) / evaluations.length;
    const avgProblemSolving = evaluations.reduce((sum, e) => sum + e.problemSolvingScore, 0) / evaluations.length;
    const avgCulturalFit = evaluations.reduce((sum, e) => sum + e.culturalFitScore, 0) / evaluations.length;
    const avgLearningAgility = evaluations.reduce((sum, e) => sum + e.learningAgilityScore, 0) / evaluations.length;
    
    // Calculate weighted overall score using official rubric weights
    const weightedScore = (
      (avgRelevance * 0.15) +
      (avgStarStructure * 0.15) +
      (avgSpecificEvidence * 0.15) +
      (avgRoleAlignment * 0.15) +
      (avgOutcomeOriented * 0.15) +
      (avgCommunication * 0.10) +
      (avgProblemSolving * 0.10) +
      (avgCulturalFit * 0.05) +
      (avgLearningAgility * 0.05)
    );
    
    // Determine overall rating based on threshold
    let overallRating: 'Pass' | 'Borderline' | 'Needs Improvement';
    if (weightedScore >= 3.5) {
      overallRating = 'Pass';
    } else if (weightedScore >= 3.0) {
      overallRating = 'Borderline';
    } else {
      overallRating = 'Needs Improvement';
    }
    
    // Aggregate feedback
    const allStrengths = evaluations.flatMap(e => e.detailedFeedback.strengths);
    const allWeaknesses = evaluations.flatMap(e => e.detailedFeedback.weaknesses);
    const allSuggestions = evaluations.flatMap(e => e.detailedFeedback.suggestions);
    
    return {
      relevanceScore: Number(avgRelevance.toFixed(1)),
      starStructureScore: Number(avgStarStructure.toFixed(1)),
      specificEvidenceScore: Number(avgSpecificEvidence.toFixed(1)),
      roleAlignmentScore: Number(avgRoleAlignment.toFixed(1)),
      outcomeOrientedScore: Number(avgOutcomeOriented.toFixed(1)),
      communicationScore: Number(avgCommunication.toFixed(1)),
      problemSolvingScore: Number(avgProblemSolving.toFixed(1)),
      culturalFitScore: Number(avgCulturalFit.toFixed(1)),
      learningAgilityScore: Number(avgLearningAgility.toFixed(1)),
      weightedOverallScore: Number(weightedScore.toFixed(1)),
      overallRating,
      
      // Legacy STAR scores (using weighted average)
      starScores: {
        situation: Number(avgStarStructure.toFixed(0)),
        task: Number(avgStarStructure.toFixed(0)),
        action: Number(avgStarStructure.toFixed(0)),
        result: Number(avgOutcomeOriented.toFixed(0)),
        overall: Number(weightedScore.toFixed(0))
      },
      
      detailedFeedback: {
        strengths: Array.from(new Set(allStrengths)).slice(0, 5),
        weaknesses: Array.from(new Set(allWeaknesses)).slice(0, 3),
        suggestions: Array.from(new Set(allSuggestions)).slice(0, 5),
        culturalRelevance: evaluations.find(e => e.detailedFeedback.culturalRelevance)?.detailedFeedback.culturalRelevance
      },
      
      modelAnswer: `Based on your ${evaluations.length} responses, focus on: ${allSuggestions.slice(0, 3).join(', ')}.`,
      completenessScore: Number(weightedScore.toFixed(1)),
      evaluatedBy: evaluations[0]?.evaluatedBy || 'rule-based'
    };
  }
  
  /**
   * Generate comprehensive session summary with actionable insights
   */
  private generateSessionSummary(
    evaluations: EvaluationResult[],
    context: { jobPosition: string; experienceLevel: string; responseLanguage: string }
  ) {
    const averageScores = {
      relevance: evaluations.reduce((sum, e) => sum + e.relevanceScore, 0) / evaluations.length,
      starStructure: evaluations.reduce((sum, e) => sum + e.starStructureScore, 0) / evaluations.length,
      specificEvidence: evaluations.reduce((sum, e) => sum + e.specificEvidenceScore, 0) / evaluations.length,
      roleAlignment: evaluations.reduce((sum, e) => sum + e.roleAlignmentScore, 0) / evaluations.length,
      outcomeOriented: evaluations.reduce((sum, e) => sum + e.outcomeOrientedScore, 0) / evaluations.length,
      communication: evaluations.reduce((sum, e) => sum + e.communicationScore, 0) / evaluations.length,
      problemSolving: evaluations.reduce((sum, e) => sum + e.problemSolvingScore, 0) / evaluations.length,
      culturalFit: evaluations.reduce((sum, e) => sum + e.culturalFitScore, 0) / evaluations.length,
      learningAgility: evaluations.reduce((sum, e) => sum + e.learningAgilityScore, 0) / evaluations.length
    };
    
    // Identify strengths (scores >= 4.0)
    const keyStrengths = Object.entries(averageScores)
      .filter(([_, score]) => score >= 4.0)
      .map(([criterion, score]) => `${this.getCriterionDisplayName(criterion)} (${score.toFixed(1)}/5)`)
      .slice(0, 3);
    
    // Identify critical improvements (scores < 3.0)
    const criticalImprovements = Object.entries(averageScores)
      .filter(([_, score]) => score < 3.0)
      .sort(([, a], [, b]) => a - b) // Sort by score, lowest first
      .map(([criterion, score]) => `${this.getCriterionDisplayName(criterion)} (${score.toFixed(1)}/5)`)
      .slice(0, 3);
    
    // Generate next steps based on lowest scoring criteria
    const nextSteps = this.generateNextSteps(averageScores, context);
    
    return {
      totalResponses: evaluations.length,
      averageScores,
      keyStrengths,
      criticalImprovements,
      nextSteps
    };
  }
  
  private getCriterionDisplayName(criterion: string): string {
    const displayNames: Record<string, string> = {
      relevance: 'Response Relevance',
      starStructure: 'STAR Structure',
      specificEvidence: 'Specific Evidence',
      roleAlignment: 'Role Alignment',
      outcomeOriented: 'Outcome Focus',
      communication: 'Communication',
      problemSolving: 'Problem-Solving',
      culturalFit: 'Cultural Fit',
      learningAgility: 'Learning Agility'
    };
    return displayNames[criterion] || criterion;
  }
  
  private generateNextSteps(
    averageScores: Record<string, number>,
    context: { jobPosition: string; experienceLevel: string }
  ): string[] {
    const steps: string[] = [];
    
    // Add steps based on lowest scoring areas
    const sortedScores = Object.entries(averageScores).sort(([, a], [, b]) => a - b);
    
    for (const [criterion, score] of sortedScores.slice(0, 3)) {
      if (score < 3.5) {
        steps.push(this.getImprovementStep(criterion, score));
      }
    }
    
    // Add role-specific recommendations
    if (context.jobPosition.toLowerCase().includes('senior') || context.experienceLevel === 'advanced') {
      steps.push('Focus on leadership and strategic thinking examples in your responses');
    }
    
    return steps.slice(0, 5);
  }
  
  private getImprovementStep(criterion: string, score: number): string {
    const improvementSteps: Record<string, string> = {
      relevance: 'Practice staying on-topic and directly answering the question asked',
      starStructure: 'Master the STAR method: Situation, Task, Action, Result structure',
      specificEvidence: 'Include specific metrics and quantifiable results in your examples',
      roleAlignment: 'Research the role deeply and connect your experience to job requirements',
      outcomeOriented: 'Always conclude with measurable business impact or results achieved',
      communication: 'Practice clear, concise communication without filler words',
      problemSolving: 'Demonstrate analytical thinking and creative problem-solving approaches',
      culturalFit: 'Show collaboration skills and alignment with company values',
      learningAgility: 'Highlight examples of quickly learning new skills or adapting to change'
    };
    
    return improvementSteps[criterion] || `Improve your ${criterion} skills through targeted practice`;
  }

  /**
   * Evaluate response using SeaLion AI with 9-criteria rubric
   */
  private async evaluateWithSeaLion(request: EvaluationRequest): Promise<EvaluationResult | null> {
    try {
      const prompt = this.buildEvaluationPrompt(request);
      
      const response = await this.seaLionService.generateResponse({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000, // Increased for comprehensive evaluation
        temperature: 0.2  // Lower temperature for consistent scoring
      });

      return this.parseEvaluationResponse(response, request);

    } catch (error) {
      console.error("❌ SeaLion evaluation error:", error);
      return null;
    }
  }

  /**
   * Build comprehensive 9-criteria evaluation prompt
   */
  private buildEvaluationPrompt(request: EvaluationRequest): string {
    const culturalGuidance = this.getCulturalEvaluationGuidance(request.responseLanguage);

    return `You are an expert interview coach specializing in Southeast Asian business contexts. Evaluate this interview response using the official 9-criteria scoring rubric.

INTERVIEW CONTEXT:
Question: "${request.questionText}"
Category: ${request.questionCategory}
Job Position: ${request.jobPosition}
Experience Level: ${request.experienceLevel}
Response Language: ${request.responseLanguage}

USER RESPONSE:
"${request.responseText}"

OFFICIAL 9-CRITERIA EVALUATION RUBRIC:

1. RELEVANCE OF RESPONSE (15% weight)
   - 1 = Goes off-topic, rambles, fails to answer directly
   - 3 = Partially addresses question, some irrelevant content
   - 5 = Fully addresses question, concise and focused throughout

2. STAR METHOD STRUCTURE (15% weight)
   - 1 = Rambling, disorganized, hard to follow
   - 3 = Some structure, occasional jumps in logic
   - 5 = Highly structured, clear STAR flow (Situation, Task, Action, Result)

3. SPECIFIC EVIDENCE USAGE (15% weight)
   - 1 = No examples, vague statements only
   - 3 = Some examples but lacks detail or measurable outcomes
   - 5 = Specific, measurable, illustrative examples with metrics

4. ROLE ALIGNMENT (15% weight)
   - 1 = Unrelated experience, no enthusiasm for role
   - 3 = Some relevant skills mentioned, weak connection
   - 5 = Clearly articulates match to job requirements, genuine enthusiasm

5. OUTCOME-ORIENTED (15% weight)
   - 1 = No results mentioned, process-focused only
   - 3 = Some outcomes but lacks quantification
   - 5 = Consistently highlights measurable business impact

6. COMMUNICATION SKILLS (10% weight)
   - 1 = Difficult to understand, poor grammar, lacks confidence
   - 3 = Generally clear, minor lapses or hesitancy
   - 5 = Highly articulate, confident, professional tone

7. PROBLEM-SOLVING/CRITICAL THINKING (10% weight)
   - 1 = No analytical thinking, relies on assumptions
   - 3 = Basic solutions, identifies main issues
   - 5 = Excellent analysis, innovation, strategic insight

8. CULTURAL FIT/VALUES ALIGNMENT (5% weight)
   - 1 = Poor alignment, disruptive attitude
   - 3 = Some alignment, acceptable behavior
   - 5 = Excellent cultural alignment, promotes teamwork

9. LEARNING AGILITY/ADAPTABILITY (5% weight)
   - 1 = Resists change, struggles to adapt
   - 3 = Some willingness to learn, may need support
   - 5 = Proactively seeks knowledge, adapts seamlessly

${culturalGuidance}

SCORING GUIDELINES:
- Score each criterion 1-5 based on rubric descriptions above
- Provide specific evidence from the response for each score
- Be constructive and culturally sensitive

PROVIDE EVALUATION IN JSON FORMAT:
{
  "relevanceScore": 1-5,
  "starStructureScore": 1-5,
  "specificEvidenceScore": 1-5,
  "roleAlignmentScore": 1-5,
  "outcomeOrientedScore": 1-5,
  "communicationScore": 1-5,
  "problemSolvingScore": 1-5,
  "culturalFitScore": 1-5,
  "learningAgilityScore": 1-5,
  "weightedOverallScore": "calculated weighted average",
  "overallRating": "Pass/Borderline/Needs Improvement",
  "starScores": {
    "situation": 1-5,
    "task": 1-5,
    "action": 1-5,
    "result": 1-5,
    "overall": 1-5
  },
  "detailedFeedback": {
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
    "culturalRelevance": "Cultural context assessment"
  },
  "modelAnswer": "Example of strong response for this question using STAR method...",
  "completenessScore": 1-5
}

Focus on actionable, specific feedback that helps the candidate systematically improve using the rubric criteria.`;
  }

  /**
   * Get STAR evaluation guidance
   */
  private getStarEvaluationGuidance(): string {
    return `
STAR METHOD EVALUATION:
- Situation (1-5): Did they clearly describe the context/background?
- Task (1-5): Did they explain their specific responsibility?
- Action (1-5): Did they detail the steps they took?
- Result (1-5): Did they quantify outcomes and impact?
- Overall (1-5): How well structured and compelling was the STAR response?`;
  }

  /**
   * Get cultural evaluation guidance
   */
  private getCulturalEvaluationGuidance(language: string): string {
    const guidanceMap: Record<string, string> = {
      'id': `
INDONESIAN CULTURAL CONTEXT:
- Values gotong royong (mutual assistance) and consensus building
- Respects hierarchy while showing initiative
- Emphasizes relationship building and collaboration
- Consider how response demonstrates cultural awareness`,

      'ms': `
MALAYSIAN CULTURAL CONTEXT:
- Values harmony and face-saving (muka)
- Emphasizes relationship building before business
- Respects diversity and inclusive approaches
- Consider cultural sensitivity in response`,

      'th': `
THAI CULTURAL CONTEXT:
- Values kreng jai (consideration for others)
- Respects hierarchy and seniority
- Emphasizes maintaining harmonious relationships
- Consider how response shows cultural understanding`,

      'en': `
ASEAN BUSINESS CONTEXT:
- Values relationship building and trust
- Respects cultural diversity and inclusion
- Emphasizes collaborative problem-solving
- Consider regional business culture awareness`
    };

    return guidanceMap[language] || guidanceMap['en'];
  }

  private parseEvaluationResponse(response: string, request: EvaluationRequest): EvaluationResult | null {
    try {
      const jsonResponse = JSON.parse(response);
      
      // Extract 9-criteria scores
      const relevanceScore = jsonResponse.relevanceScore || 3;
      const starStructureScore = jsonResponse.starStructureScore || 3;
      const specificEvidenceScore = jsonResponse.specificEvidenceScore || 3;
      const roleAlignmentScore = jsonResponse.roleAlignmentScore || 3;
      const outcomeOrientedScore = jsonResponse.outcomeOrientedScore || 3;
      const communicationScore = jsonResponse.communicationScore || 3;
      const problemSolvingScore = jsonResponse.problemSolvingScore || 3;
      const culturalFitScore = jsonResponse.culturalFitScore || 3;
      const learningAgilityScore = jsonResponse.learningAgilityScore || 3;
      
      // Calculate weighted overall score
      const weightedOverallScore = (
        (relevanceScore * 0.15) +
        (starStructureScore * 0.15) +
        (specificEvidenceScore * 0.15) +
        (roleAlignmentScore * 0.15) +
        (outcomeOrientedScore * 0.15) +
        (communicationScore * 0.10) +
        (problemSolvingScore * 0.10) +
        (culturalFitScore * 0.05) +
        (learningAgilityScore * 0.05)
      );
      
      // Determine overall rating
      let overallRating: 'Pass' | 'Borderline' | 'Needs Improvement';
      if (weightedOverallScore >= 3.5) {
        overallRating = 'Pass';
      } else if (weightedOverallScore >= 3.0) {
        overallRating = 'Borderline';
      } else {
        overallRating = 'Needs Improvement';
      }
      
      return {
        relevanceScore: Number(relevanceScore.toFixed(1)),
        starStructureScore: Number(starStructureScore.toFixed(1)),
        specificEvidenceScore: Number(specificEvidenceScore.toFixed(1)),
        roleAlignmentScore: Number(roleAlignmentScore.toFixed(1)),
        outcomeOrientedScore: Number(outcomeOrientedScore.toFixed(1)),
        communicationScore: Number(communicationScore.toFixed(1)),
        problemSolvingScore: Number(problemSolvingScore.toFixed(1)),
        culturalFitScore: Number(culturalFitScore.toFixed(1)),
        learningAgilityScore: Number(learningAgilityScore.toFixed(1)),
        weightedOverallScore: Number(weightedOverallScore.toFixed(1)),
        overallRating,
        
        // Legacy STAR scores for backward compatibility
        starScores: jsonResponse.starScores || {
          situation: Math.round(starStructureScore),
          task: Math.round(starStructureScore),
          action: Math.round(starStructureScore),
          result: Math.round(outcomeOrientedScore),
          overall: Math.round(weightedOverallScore)
        },
        
        detailedFeedback: jsonResponse.detailedFeedback || {
          strengths: ['Engaged with the question'],
          weaknesses: ['Could be more specific'],
          suggestions: ['Use STAR method', 'Add specific metrics', 'Connect to role requirements'],
          culturalRelevance: 'Response shows professional communication style'
        },
        
        modelAnswer: jsonResponse.modelAnswer || 'Provide specific examples using STAR method with measurable results',
        completenessScore: jsonResponse.completenessScore || weightedOverallScore,
        evaluatedBy: 'sealion'
      };
    } catch (error) {
      console.error("❌ Failed to parse evaluation response:", error);
      return null;
    }
  }

  private evaluateWithRules(request: EvaluationRequest): EvaluationResult {
    console.log(`🔧 Using rule-based evaluation for ${request.responseLanguage} response`);

    const response = request.responseText.toLowerCase();
    const wordCount = request.responseText.split(/\s+/).length;
    
    // Initialize all 9-criteria scores with default values
    let relevanceScore = 3;
    let starStructureScore = 3;
    let specificEvidenceScore = 3;
    let roleAlignmentScore = 3;
    let outcomeOrientedScore = 3;
    let communicationScore = 3;
    let problemSolvingScore = 3;
    let culturalFitScore = 3;
    let learningAgilityScore = 3;
    
    // 1. RELEVANCE ANALYSIS
    if (this.containsQuestionKeywords(request.questionText, response)) {
      relevanceScore = 4;
    }
    if (wordCount < 30) {
      relevanceScore = Math.max(relevanceScore - 1, 1);
    }
    
    // 2. STAR STRUCTURE ANALYSIS
    let starComponents = 0;
    if (response.includes('situation') || response.includes('when') || response.includes('context')) {
      starComponents++;
    }
    if (response.includes('task') || response.includes('responsible') || response.includes('goal')) {
      starComponents++;
    }
    if (response.includes('action') || response.includes('did') || response.includes('implemented')) {
      starComponents++;
    }
    if (response.includes('result') || response.includes('outcome') || response.includes('achieved')) {
      starComponents++;
    }
    starStructureScore = Math.min(starComponents + 1, 5);
    
    // 3. SPECIFIC EVIDENCE ANALYSIS
    const hasNumbers = /\d+/.test(response);
    const hasPercentages = /%/.test(response);
    const hasMetrics = /\$|increase|decrease|improve|reduce/.test(response);
    
    if (hasNumbers && hasPercentages) specificEvidenceScore = 5;
    else if (hasNumbers || hasMetrics) specificEvidenceScore = 4;
    else if (response.includes('example') || response.includes('specifically')) specificEvidenceScore = 3;
    else specificEvidenceScore = 2;
    
    // 4. ROLE ALIGNMENT ANALYSIS
    const jobKeywords = request.jobPosition.toLowerCase().split(' ');
    const hasJobKeywords = jobKeywords.some(keyword => response.includes(keyword));
    if (hasJobKeywords) roleAlignmentScore = 4;
    
    // 5. OUTCOME-ORIENTED ANALYSIS
    if (hasMetrics || response.includes('impact') || response.includes('delivered')) {
      outcomeOrientedScore = 4;
    }
    if (hasPercentages || /improved|increased|decreased|saved/.test(response)) {
      outcomeOrientedScore = 5;
    }
    
    // 6. COMMUNICATION ANALYSIS
    if (wordCount >= 50 && wordCount <= 150) {
      communicationScore = 4; // Good length
    } else if (wordCount > 200) {
      communicationScore = 3; // Too verbose
    } else if (wordCount < 30) {
      communicationScore = 2; // Too brief
    }
    
    // 7. PROBLEM-SOLVING ANALYSIS
    if (response.includes('problem') || response.includes('challenge') || response.includes('solution')) {
      problemSolvingScore = 4;
    }
    if (response.includes('analyzed') || response.includes('identified') || response.includes('strategy')) {
      problemSolvingScore = 5;
    }
    
    // 8. CULTURAL FIT ANALYSIS
    if (response.includes('team') || response.includes('collaboration') || response.includes('together')) {
      culturalFitScore = 4;
    }
    
    // 9. LEARNING AGILITY ANALYSIS
    if (response.includes('learn') || response.includes('adapt') || response.includes('new')) {
      learningAgilityScore = 4;
    }
    
    // Calculate weighted overall score
    const weightedOverallScore = (
      (relevanceScore * 0.15) +
      (starStructureScore * 0.15) +
      (specificEvidenceScore * 0.15) +
      (roleAlignmentScore * 0.15) +
      (outcomeOrientedScore * 0.15) +
      (communicationScore * 0.10) +
      (problemSolvingScore * 0.10) +
      (culturalFitScore * 0.05) +
      (learningAgilityScore * 0.05)
    );
    
    // Determine overall rating
    let overallRating: 'Pass' | 'Borderline' | 'Needs Improvement';
    if (weightedOverallScore >= 3.5) {
      overallRating = 'Pass';
    } else if (weightedOverallScore >= 3.0) {
      overallRating = 'Borderline';
    } else {
      overallRating = 'Needs Improvement';
    }
    
    // Generate targeted feedback
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    
    if (starStructureScore >= 4) strengths.push('Good use of structured storytelling');
    if (specificEvidenceScore >= 4) strengths.push('Included specific examples');
    if (communicationScore >= 4) strengths.push('Clear and concise communication');
    
    if (starStructureScore < 3) {
      weaknesses.push('Response lacks clear structure');
      suggestions.push('Use STAR method: Situation, Task, Action, Result');
    }
    if (specificEvidenceScore < 3) {
      weaknesses.push('Limited specific evidence provided');
      suggestions.push('Include specific metrics, numbers, and measurable outcomes');
    }
    if (outcomeOrientedScore < 3) {
      suggestions.push('Focus more on the business impact and results achieved');
    }
    
    // Legacy STAR scores for backward compatibility
    const starScores: StarScores = {
      situation: Math.min(starComponents >= 1 ? 4 : 2, 5),
      task: Math.min(starComponents >= 2 ? 4 : 2, 5),
      action: Math.min(starComponents >= 3 ? 4 : 2, 5),
      result: Math.min(starComponents >= 4 ? 4 : 2, 5),
      overall: Math.round(weightedOverallScore)
    };
    
    const detailedFeedback: DetailedFeedback = {
      strengths: strengths.length > 0 ? strengths : ['Engaged with the question'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Could be more detailed'],
      suggestions: suggestions.length > 0 ? suggestions : [
        'Use the STAR method to structure responses',
        'Include specific metrics and outcomes',
        'Connect experience to role requirements'
      ]
    };
    
    return {
      relevanceScore: Number(relevanceScore.toFixed(1)),
      starStructureScore: Number(starStructureScore.toFixed(1)),
      specificEvidenceScore: Number(specificEvidenceScore.toFixed(1)),
      roleAlignmentScore: Number(roleAlignmentScore.toFixed(1)),
      outcomeOrientedScore: Number(outcomeOrientedScore.toFixed(1)),
      communicationScore: Number(communicationScore.toFixed(1)),
      problemSolvingScore: Number(problemSolvingScore.toFixed(1)),
      culturalFitScore: Number(culturalFitScore.toFixed(1)),
      learningAgilityScore: Number(learningAgilityScore.toFixed(1)),
      weightedOverallScore: Number(weightedOverallScore.toFixed(1)),
      overallRating,
      starScores,
      detailedFeedback,
      modelAnswer: `For this ${request.questionCategory} question about ${request.jobPosition}, structure your response using STAR method: describe the specific Situation, your Task/responsibility, the Actions you took, and the measurable Results achieved. Include specific metrics and connect to role requirements.`,
      completenessScore: Number(weightedOverallScore.toFixed(1)),
      evaluatedBy: 'rule-based'
    };
  }
  
  private containsQuestionKeywords(question: string, response: string): boolean {
    const questionWords = question.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return questionWords.some(word => response.includes(word));
  }

  private shouldUseSeaLion(language: string): boolean {
    // Use SeaLion for ASEAN languages and cultural contexts
    const aseanLanguages = ['id', 'ms', 'th', 'vi', 'tl', 'my', 'km', 'lo', 'bn', 'hi', 'zh', 'ta'];
    return aseanLanguages.includes(language.toLowerCase());
  }

  private initializeStarCriteria(): Record<string, string> {
    return {
      situation: "Clear context and background information",
      task: "Specific responsibility or challenge identified",
      action: "Detailed steps taken to address the situation",
      result: "Measurable outcomes and impact achieved"
    };
  }
}