/**
 * Stage-Difficulty Constraints Configuration
 * Enforces appropriate difficulty levels for each interview stage
 *
 * Difficulty Progression: Stage 1 (easiest) → Stage 5 (hardest)
 */

export type InterviewStage = 'phone-screening' | 'functional-team' | 'hiring-manager' | 'sme-expert' | 'executive-leadership';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StageConstraints {
  stageName: InterviewStage;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  allowedDifficulties: DifficultyLevel[];
  defaultDifficulty: DifficultyLevel;
  focusAreas: string[];
  complexityIndicators: {
    questionDepth: string;
    answerExpectations: string;
    evaluationCriteria: string;
  };
  forbiddenPatterns: string[];
  requiredCharacteristics: string[];
}

/**
 * Stage-specific constraints and requirements
 */
export const STAGE_DIFFICULTY_CONSTRAINTS: Record<InterviewStage, StageConstraints> = {
  'phone-screening': {
    stageName: 'phone-screening',
    stageNumber: 1,
    allowedDifficulties: ['beginner'],
    defaultDifficulty: 'beginner',
    focusAreas: [
      'Candidate Background',
      'Career Motivation',
      'Logistical Fit',
      'Cultural Alignment',
      'Basic Qualifications',
      'Communication Skills'
    ],
    complexityIndicators: {
      questionDepth: 'Surface-level, conversational, rapport-building',
      answerExpectations: '2-3 minute responses, basic examples, general overview',
      evaluationCriteria: 'Communication clarity, enthusiasm, basic fit assessment'
    },
    forbiddenPatterns: [
      'Deep technical questions',
      'Complex strategic scenarios',
      'Multi-layered problem-solving',
      'Executive-level decision-making',
      'Advanced industry analysis'
    ],
    requiredCharacteristics: [
      'Conversational tone',
      'Open-ended but simple',
      'Focus on background and motivation',
      'Practical and logistical questions',
      'Easy to answer honestly'
    ]
  },

  'functional-team': {
    stageName: 'functional-team',
    stageNumber: 2,
    allowedDifficulties: ['beginner', 'intermediate'],
    defaultDifficulty: 'intermediate',
    focusAreas: [
      'Teamwork & Collaboration',
      'Interpersonal Skills',
      'Communication Style',
      'Conflict Resolution',
      'Cross-functional Alignment',
      'Team Dynamics'
    ],
    complexityIndicators: {
      questionDepth: 'Behavioral examples required, team interaction focus',
      answerExpectations: '3-4 minute STAR responses, specific team scenarios',
      evaluationCriteria: 'Collaboration skills, adaptability, team contribution'
    },
    forbiddenPatterns: [
      'Pure technical depth questions',
      'Executive strategy questions',
      'Organizational transformation',
      'P&L responsibility',
      'Board-level stakeholder management'
    ],
    requiredCharacteristics: [
      'STAR method applicable',
      'Focus on team interactions',
      'Collaboration scenarios',
      'Peer relationship examples',
      'Moderate complexity'
    ]
  },

  'hiring-manager': {
    stageName: 'hiring-manager',
    stageNumber: 3,
    allowedDifficulties: ['intermediate', 'advanced'],
    defaultDifficulty: 'advanced',
    focusAreas: [
      'Role-Specific Competencies',
      'Management Alignment',
      'Strategic Thinking',
      'Project Management',
      'Performance Expectations',
      'Decision-Making'
    ],
    complexityIndicators: {
      questionDepth: 'Role-specific depth, strategic scenarios, leadership examples',
      answerExpectations: '4-5 minute detailed responses, quantified results, strategic thinking',
      evaluationCriteria: 'Job competency, leadership potential, strategic alignment'
    },
    forbiddenPatterns: [
      'Basic background questions',
      'Simple yes/no questions',
      'Purely logistical inquiries',
      'Surface-level motivations'
    ],
    requiredCharacteristics: [
      'Role-specific scenarios',
      'Strategic decision-making',
      'Leadership examples required',
      'Quantifiable outcomes expected',
      'Complex problem-solving'
    ]
  },

  'sme-expert': {
    stageName: 'sme-expert',
    stageNumber: 4,
    allowedDifficulties: ['intermediate', 'advanced'],
    defaultDifficulty: 'advanced',
    focusAreas: [
      'Technical Depth',
      'Domain Expertise',
      'Industry Knowledge',
      'Problem-Solving Methodology',
      'Innovation & Trends',
      'Technical Communication'
    ],
    complexityIndicators: {
      questionDepth: 'Deep technical/domain expertise, complex problem-solving',
      answerExpectations: '5-7 minute detailed technical responses, methodology explanation',
      evaluationCriteria: 'Technical mastery, problem-solving approach, industry insight'
    },
    forbiddenPatterns: [
      'Basic background questions',
      'Generic teamwork questions',
      'Surface-level motivation',
      'Simple logistical questions',
      'Non-technical generalities'
    ],
    requiredCharacteristics: [
      'Technical complexity required',
      'Industry-specific knowledge',
      'Methodology and process focus',
      'Problem-solving depth',
      'Innovation and trends awareness'
    ]
  },

  'executive-leadership': {
    stageName: 'executive-leadership',
    stageNumber: 5,
    allowedDifficulties: ['advanced'],
    defaultDifficulty: 'advanced',
    focusAreas: [
      'Strategic Vision',
      'Organizational Leadership',
      'Cultural Impact',
      'Transformation & Change',
      'Stakeholder Management',
      'Long-term Legacy'
    ],
    complexityIndicators: {
      questionDepth: 'Multi-layered strategic scenarios, organizational impact, visionary thinking',
      answerExpectations: '7-10 minute executive-level responses, transformational examples, board-level thinking',
      evaluationCriteria: 'Strategic vision, organizational impact, leadership philosophy, cultural alignment'
    },
    forbiddenPatterns: [
      'Basic background questions',
      'Entry-level scenarios',
      'Simple team dynamics',
      'Tactical execution questions',
      'Individual contributor tasks',
      'Surface-level inquiries'
    ],
    requiredCharacteristics: [
      'Strategic and visionary',
      'Organizational transformation focus',
      'Multi-stakeholder complexity',
      'Long-term impact orientation',
      'Executive decision-making required',
      'Leadership philosophy exploration'
    ]
  }
};

/**
 * Validate if a difficulty level is appropriate for a given stage
 */
export function isValidStageDifficulty(stage: InterviewStage, difficulty: DifficultyLevel): boolean {
  const constraints = STAGE_DIFFICULTY_CONSTRAINTS[stage];
  return constraints.allowedDifficulties.includes(difficulty);
}

/**
 * Get the default difficulty for a stage
 */
export function getDefaultDifficultyForStage(stage: InterviewStage): DifficultyLevel {
  return STAGE_DIFFICULTY_CONSTRAINTS[stage].defaultDifficulty;
}

/**
 * Auto-correct difficulty to match stage constraints
 */
export function enforceStageDifficulty(stage: InterviewStage, requestedDifficulty: DifficultyLevel): DifficultyLevel {
  const constraints = STAGE_DIFFICULTY_CONSTRAINTS[stage];

  // If requested difficulty is valid, use it
  if (constraints.allowedDifficulties.includes(requestedDifficulty)) {
    return requestedDifficulty;
  }

  // Otherwise, return the default for this stage
  return constraints.defaultDifficulty;
}

/**
 * Get stage number from stage name
 */
export function getStageNumber(stageName: InterviewStage): 1 | 2 | 3 | 4 | 5 {
  return STAGE_DIFFICULTY_CONSTRAINTS[stageName].stageNumber;
}

/**
 * Get stage name from stage number
 */
export function getStageName(stageNumber: 1 | 2 | 3 | 4 | 5): InterviewStage {
  const stageMap: Record<number, InterviewStage> = {
    1: 'phone-screening',
    2: 'functional-team',
    3: 'hiring-manager',
    4: 'sme-expert',
    5: 'executive-leadership'
  };
  return stageMap[stageNumber];
}

/**
 * Get comprehensive stage constraints
 */
export function getStageConstraints(stage: InterviewStage): StageConstraints {
  return STAGE_DIFFICULTY_CONSTRAINTS[stage];
}

/**
 * Map legacy stage names to new format
 */
export function normalizeStageName(stageName: string): InterviewStage {
  const mappings: Record<string, InterviewStage> = {
    'phone-screening': 'phone-screening',
    'functional-team': 'functional-team',
    'hiring-manager': 'hiring-manager',
    'subject-matter-expertise': 'sme-expert',
    'subject-matter': 'sme-expert',
    'sme': 'sme-expert',
    'sme-expert': 'sme-expert',
    'executive-final': 'executive-leadership',
    'executive': 'executive-leadership',
    'executive-leadership': 'executive-leadership'
  };

  if (!stageName || typeof stageName !== 'string') {
    return 'phone-screening';
  }

  const normalized = stageName.toLowerCase();
  return mappings[normalized] || 'phone-screening';
}

/**
 * Get difficulty progression validation
 */
export function getDifficultyProgression(): Record<DifficultyLevel, number[]> {
  return {
    'beginner': [1, 2],      // Stages 1-2 only
    'intermediate': [2, 3, 4], // Stages 2-4
    'advanced': [3, 4, 5]      // Stages 3-5 only
  };
}
