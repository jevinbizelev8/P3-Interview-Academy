// Response Evaluation Service
// Comprehensive AI-powered evaluation using STAR method and cultural context

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
  starScores: StarScores;
  detailedFeedback: DetailedFeedback;
  modelAnswer: string;
  relevanceScore: number;        // 1-5 how relevant to question
  communicationScore: number;    // 1-5 communication clarity
  completenessScore: number;     // 1-5 response completeness
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
   * Evaluate user response with comprehensive scoring
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
          console.warn("⚠️ SeaLion evaluation failed, falling back:", error.message);
        }
      }

      // Fallback to rule-based evaluation
      return this.evaluateWithRules(request);

    } catch (error) {
      console.error("❌ Error evaluating response:", error);
      throw new Error(`Failed to evaluate response: ${error.message}`);
    }
  }

  /**
   * Evaluate response using SeaLion AI
   */
  private async evaluateWithSeaLion(request: EvaluationRequest): Promise<EvaluationResult | null> {
    try {
      const prompt = this.buildEvaluationPrompt(request);
      
      const response = await this.seaLionService.generateResponse(prompt);

      return this.parseEvaluationResponse(response, request);

    } catch (error) {
      console.error("❌ SeaLion evaluation error:", error);
      return null;
    }
  }

  /**
   * Build comprehensive evaluation prompt
   */
  private buildEvaluationPrompt(request: EvaluationRequest): string {
    const culturalGuidance = this.getCulturalEvaluationGuidance(request.responseLanguage);
    const starGuidance = request.starMethodRelevant ? this.getStarEvaluationGuidance() : '';

    return `You are an expert interview coach specializing in Southeast Asian business contexts. Evaluate this interview response comprehensively.

INTERVIEW CONTEXT:
Question: "${request.questionText}"
Category: ${request.questionCategory}
Job Position: ${request.jobPosition}
Experience Level: ${request.experienceLevel}
Response Language: ${request.responseLanguage}

USER RESPONSE:
"${request.responseText}"

EVALUATION CRITERIA:
${starGuidance}
${culturalGuidance}

SCORING GUIDELINES:
1 = Poor: Below expectations, needs significant improvement
2 = Needs Work: Some issues, room for improvement  
3 = Average: Meets basic expectations, adequate performance
4 = Good: Above average, strong performance
5 = Excellent: Exceeds expectations, exemplary performance

PROVIDE EVALUATION IN JSON FORMAT:
{
  "starScores": {
    "situation": 1-5,
    "task": 1-5,
    "action": 1-5,
    "result": 1-5,
    "overall": 1-5
  },
  "detailedFeedback": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "culturalRelevance": "Cultural context assessment"
  },
  "modelAnswer": "Example of strong response following STAR method...",
  "relevanceScore": 1-5,
  "communicationScore": 1-5,
  "completenessScore": 1-5
}

Focus on constructive feedback that helps the candidate improve while being culturally sensitive.`;
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

  /**
   * Parse AI evaluation response
   */
  private parseEvaluationResponse(response: string, request: EvaluationRequest): EvaluationResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          starScores: this.validateStarScores(parsed.starScores),
          detailedFeedback: this.validateDetailedFeedback(parsed.detailedFeedback),
          modelAnswer: parsed.modelAnswer || this.generateModelAnswer(request),
          relevanceScore: this.validateScore(parsed.relevanceScore),
          communicationScore: this.validateScore(parsed.communicationScore),
          completenessScore: this.validateScore(parsed.completenessScore),
          evaluatedBy: 'sealion'
        };
      }

      // Fallback to text parsing
      return this.parseTextEvaluation(response, request);

    } catch (error) {
      console.warn("⚠️ Error parsing AI evaluation, using rule-based fallback");
      return this.evaluateWithRules(request);
    }
  }

  /**
   * Parse non-JSON evaluation text
   */
  private parseTextEvaluation(response: string, request: EvaluationRequest): EvaluationResult {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract basic scores (simple parsing)
    const overallScore = this.extractScoreFromText(response, 'overall') || 3;
    
    return {
      starScores: {
        situation: this.extractScoreFromText(response, 'situation') || overallScore,
        task: this.extractScoreFromText(response, 'task') || overallScore,
        action: this.extractScoreFromText(response, 'action') || overallScore,
        result: this.extractScoreFromText(response, 'result') || overallScore,
        overall: overallScore
      },
      detailedFeedback: {
        strengths: this.extractFeedbackItems(response, 'strengths') || ['Clear communication'],
        weaknesses: this.extractFeedbackItems(response, 'weaknesses') || ['Could be more specific'],
        suggestions: this.extractFeedbackItems(response, 'suggestions') || ['Provide more concrete examples']
      },
      modelAnswer: this.generateModelAnswer(request),
      relevanceScore: overallScore,
      communicationScore: overallScore,
      completenessScore: overallScore,
      evaluatedBy: 'sealion'
    };
  }

  /**
   * Rule-based evaluation fallback
   */
  private evaluateWithRules(request: EvaluationRequest): EvaluationResult {
    const responseLength = request.responseText.length;
    const wordCount = request.responseText.split(/\s+/).length;
    
    // Basic scoring based on response characteristics
    const baseScore = this.calculateBaseScore(request.responseText, wordCount);
    const starScores = request.starMethodRelevant 
      ? this.evaluateStarMethodRuleBased(request.responseText)
      : { situation: baseScore, task: baseScore, action: baseScore, result: baseScore, overall: baseScore };

    return {
      starScores,
      detailedFeedback: this.generateRuleBasedFeedback(request, wordCount),
      modelAnswer: this.generateModelAnswer(request),
      relevanceScore: baseScore,
      communicationScore: this.evaluateCommunication(request.responseText),
      completenessScore: this.evaluateCompleteness(request.responseText, wordCount),
      evaluatedBy: 'rule-based'
    };
  }

  /**
   * Calculate base score from response characteristics
   */
  private calculateBaseScore(responseText: string, wordCount: number): number {
    let score = 3; // Start with average

    // Adjust based on length
    if (wordCount < 20) score -= 1;
    else if (wordCount > 100) score += 0.5;

    // Adjust based on structure
    if (responseText.includes('situation') || responseText.includes('when')) score += 0.3;
    if (responseText.includes('result') || responseText.includes('outcome')) score += 0.3;
    if (responseText.match(/\d+/)) score += 0.2; // Contains numbers/metrics

    return Math.min(Math.max(Math.round(score * 10) / 10, 1), 5);
  }

  /**
   * Rule-based STAR method evaluation
   */
  private evaluateStarMethodRuleBased(responseText: string): StarScores {
    const text = responseText.toLowerCase();
    
    const situation = this.scoreStarComponent(text, ['situation', 'when', 'where', 'context', 'background']);
    const task = this.scoreStarComponent(text, ['task', 'responsibility', 'goal', 'objective', 'needed']);
    const action = this.scoreStarComponent(text, ['action', 'did', 'implemented', 'created', 'developed']);
    const result = this.scoreStarComponent(text, ['result', 'outcome', 'achieved', 'improved', 'increased']);
    
    const overall = (situation + task + action + result) / 4;
    
    return {
      situation: Math.round(situation),
      task: Math.round(task),
      action: Math.round(action),
      result: Math.round(result),
      overall: Math.round(overall * 10) / 10
    };
  }

  /**
   * Score individual STAR component
   */
  private scoreStarComponent(text: string, keywords: string[]): number {
    const hasKeyword = keywords.some(keyword => text.includes(keyword));
    const keywordDensity = keywords.reduce((count, keyword) => 
      count + (text.match(new RegExp(keyword, 'g')) || []).length, 0);
    
    let score = 2; // Base score
    if (hasKeyword) score += 1;
    if (keywordDensity > 1) score += 0.5;
    if (keywordDensity > 2) score += 0.5;
    
    return Math.min(score, 5);
  }

  /**
   * Evaluate communication quality
   */
  private evaluateCommunication(responseText: string): number {
    let score = 3;
    
    const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = responseText.length / sentences.length;
    
    // Penalize very short or very long sentences
    if (avgSentenceLength < 30 || avgSentenceLength > 150) score -= 0.5;
    
    // Check for clear structure
    if (sentences.length >= 3) score += 0.3;
    if (responseText.includes(',') && responseText.includes('.')) score += 0.2;
    
    return Math.min(Math.max(Math.round(score * 10) / 10, 1), 5);
  }

  /**
   * Evaluate response completeness
   */
  private evaluateCompleteness(responseText: string, wordCount: number): number {
    let score = 3;
    
    // Score based on word count
    if (wordCount < 30) score = 2;
    else if (wordCount < 50) score = 2.5;
    else if (wordCount > 150) score = 4.5;
    else if (wordCount > 100) score = 4;
    
    // Check for specific details
    if (responseText.match(/\d+/)) score += 0.3; // Contains numbers
    if (responseText.includes('%')) score += 0.2; // Contains percentages
    
    return Math.min(Math.max(Math.round(score * 10) / 10, 1), 5);
  }

  /**
   * Generate rule-based feedback
   */
  private generateRuleBasedFeedback(request: EvaluationRequest, wordCount: number): DetailedFeedback {
    const strengths = [];
    const weaknesses = [];
    const suggestions = [];
    
    // Analyze response characteristics
    if (wordCount > 80) strengths.push('Provided detailed response');
    else if (wordCount < 40) weaknesses.push('Response could be more detailed');
    
    if (request.responseText.match(/\d+/)) strengths.push('Included specific metrics or numbers');
    else suggestions.push('Include quantifiable results or metrics');
    
    if (request.starMethodRelevant) {
      const text = request.responseText.toLowerCase();
      if (text.includes('situation') || text.includes('when')) strengths.push('Clear situation setup');
      else suggestions.push('Start with clear situation description');
      
      if (text.includes('result') || text.includes('outcome')) strengths.push('Mentioned outcomes');
      else suggestions.push('Conclude with measurable results');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Provide more specific examples');
      suggestions.push('Include measurable outcomes');
    }
    
    return {
      strengths: strengths.length > 0 ? strengths : ['Addressed the question directly'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Could provide more context'],
      suggestions
    };
  }

  /**
   * Generate model answer
   */
  private generateModelAnswer(request: EvaluationRequest): string {
    const jobPosition = request.jobPosition;
    const category = request.questionCategory;
    
    const templates: Record<string, string> = {
      'leadership': `SITUATION: In my role as ${jobPosition}, I was leading a cross-functional team of 6 people on a critical project with a tight deadline. TASK: My responsibility was to ensure project delivery within 4 weeks while maintaining quality standards and team morale. ACTION: I implemented daily stand-ups, created clear task assignments, and established regular check-ins with stakeholders. When we encountered obstacles, I facilitated problem-solving sessions and reallocated resources. RESULT: We delivered the project 3 days early, achieving 98% quality metrics and receiving positive feedback from all stakeholders.`,
      
      'problem-solving': `SITUATION: As a ${jobPosition}, I encountered a complex technical issue that was causing system downtime affecting 500+ users. TASK: I needed to identify the root cause and implement a solution within 2 hours to minimize business impact. ACTION: I systematically analyzed logs, collaborated with the infrastructure team, and implemented a staged rollback while developing a permanent fix. RESULT: I reduced downtime from 2 hours to 45 minutes and prevented future occurrences, saving the company an estimated $15,000 in lost productivity.`,
      
      'teamwork': `SITUATION: In my ${jobPosition} role, I was part of a diverse team working on a product launch, but we had conflicting opinions on the approach. TASK: I needed to help the team reach consensus while ensuring everyone's expertise was valued. ACTION: I organized structured brainstorming sessions, created comparison matrices for different approaches, and facilitated compromise solutions. RESULT: We launched successfully, 10% ahead of schedule, and team satisfaction scores increased by 25% through better collaboration.`
    };
    
    return templates[category] || `As a ${jobPosition}, I would approach this by first understanding the situation clearly, defining my specific responsibilities, taking systematic action steps, and measuring the results to ensure success.`;
  }

  /**
   * Utility methods for validation and parsing
   */
  private validateStarScores(scores: any): StarScores {
    return {
      situation: this.validateScore(scores?.situation),
      task: this.validateScore(scores?.task),
      action: this.validateScore(scores?.action),
      result: this.validateScore(scores?.result),
      overall: this.validateScore(scores?.overall)
    };
  }

  private validateScore(score: any): number {
    const numScore = Number(score);
    return isNaN(numScore) ? 3 : Math.min(Math.max(numScore, 1), 5);
  }

  private validateDetailedFeedback(feedback: any): DetailedFeedback {
    return {
      strengths: Array.isArray(feedback?.strengths) ? feedback.strengths : ['Clear communication'],
      weaknesses: Array.isArray(feedback?.weaknesses) ? feedback.weaknesses : ['Could be more specific'],
      suggestions: Array.isArray(feedback?.suggestions) ? feedback.suggestions : ['Provide concrete examples'],
      culturalRelevance: feedback?.culturalRelevance || undefined
    };
  }

  private shouldUseSeaLion(language: string): boolean {
    const seaLionLanguages = ['id', 'ms', 'th', 'vi', 'tl', 'my', 'km', 'lo', 'jv', 'su', 'en'];
    return seaLionLanguages.includes(language);
  }

  private extractScoreFromText(text: string, component: string): number | null {
    const pattern = new RegExp(`${component}[:\\s]*([1-5])`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : null;
  }

  private extractFeedbackItems(text: string, section: string): string[] | null {
    const lines = text.split('\n');
    const sectionIndex = lines.findIndex(line => line.toLowerCase().includes(section));
    if (sectionIndex === -1) return null;
    
    const items = [];
    for (let i = sectionIndex + 1; i < lines.length && i < sectionIndex + 4; i++) {
      const line = lines[i]?.trim();
      if (line && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        items.push(line.replace(/^[-•\d.]\s*/, ''));
      }
    }
    return items.length > 0 ? items : null;
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