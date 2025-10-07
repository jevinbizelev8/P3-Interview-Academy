/**
 * Curated Interview Question Bank
 * Source: https://docs.google.com/document/d/e/2PACX-1vTX_mKM2rMirjzLDPzFQicUcbqzJWSsIU3QWTSKVa6Arri_Bu5WnPm78Rg8iMnARKQlP9_NJIKy1Rbj/pub
 *
 * 125 professionally curated questions organized by 5 interview stages
 * Used as REFERENCE EXAMPLES for AI question generation (not exhaustive list)
 *
 * Difficulty Progression: Stage 1 (easiest) → Stage 5 (hardest)
 */

export interface CuratedQuestion {
  id: string;
  stage: 1 | 2 | 3 | 4 | 5;
  stageName: 'phone-screening' | 'functional-team' | 'hiring-manager' | 'sme-expert' | 'executive-leadership';
  question: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'behavioral' | 'situational' | 'technical' | 'general';
  starMethodRelevant: boolean;
  focusArea: string;
}

/**
 * Stage 1: First Phone Screening (HR/Recruiter)
 * Focus: Candidate Background, Logistics, Culture, Motivation
 * Difficulty: Beginner
 */
export const STAGE_1_QUESTIONS: CuratedQuestion[] = [
  {
    id: 'curated-1-001',
    stage: 1,
    stageName: 'phone-screening',
    question: 'Could you tell me a bit about your current role and why you\'re looking for a change at this time?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Background & Motivation'
  },
  {
    id: 'curated-1-002',
    stage: 1,
    stageName: 'phone-screening',
    question: 'What initially attracted you to this company and this specific role?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Motivation & Research'
  },
  {
    id: 'curated-1-003',
    stage: 1,
    stageName: 'phone-screening',
    question: 'What are your salary expectations for this position?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Practical Fit'
  },
  {
    id: 'curated-1-004',
    stage: 1,
    stageName: 'phone-screening',
    question: 'Are you legally eligible to work in the location of the job?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Logistical Requirements'
  },
  {
    id: 'curated-1-005',
    stage: 1,
    stageName: 'phone-screening',
    question: 'How would you describe your ideal company culture?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Cultural Fit'
  },
  {
    id: 'curated-1-006',
    stage: 1,
    stageName: 'phone-screening',
    question: 'Where do you see yourself in the next three to five years?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Career Trajectory'
  },
  {
    id: 'curated-1-007',
    stage: 1,
    stageName: 'phone-screening',
    question: 'What would you consider your biggest career achievement to date?',
    difficulty: 'beginner',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Accomplishments'
  },
  {
    id: 'curated-1-008',
    stage: 1,
    stageName: 'phone-screening',
    question: 'What is a weakness or area for development that you\'ve been actively working on?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Self-Awareness'
  },
  {
    id: 'curated-1-009',
    stage: 1,
    stageName: 'phone-screening',
    question: 'How do you prefer to receive feedback?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Communication Style'
  },
  {
    id: 'curated-1-010',
    stage: 1,
    stageName: 'phone-screening',
    question: 'How do you manage competing deadlines or priorities?',
    difficulty: 'beginner',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Time Management'
  }
];

/**
 * Stage 2: Functional Team Interview
 * Focus: Team Integration, Collaboration, Communication
 * Difficulty: Beginner → Intermediate
 */
export const STAGE_2_QUESTIONS: CuratedQuestion[] = [
  {
    id: 'curated-2-001',
    stage: 2,
    stageName: 'functional-team',
    question: 'Describe a time you had a disagreement with a teammate on how to approach a task. How did you resolve it?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Conflict Resolution'
  },
  {
    id: 'curated-2-002',
    stage: 2,
    stageName: 'functional-team',
    question: 'What role do you typically take on when you\'re working in a new team?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Team Dynamics'
  },
  {
    id: 'curated-2-003',
    stage: 2,
    stageName: 'functional-team',
    question: 'How do you ensure your work is aligned with the goals of other teams or departments?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Cross-functional Collaboration'
  },
  {
    id: 'curated-2-004',
    stage: 2,
    stageName: 'functional-team',
    question: 'Can you give an example of a time you had to communicate complex technical information to a non-technical audience?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Communication'
  },
  {
    id: 'curated-2-005',
    stage: 2,
    stageName: 'functional-team',
    question: 'What three words would your last team use to describe your working style?',
    difficulty: 'beginner',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Self-Perception'
  },
  {
    id: 'curated-2-006',
    stage: 2,
    stageName: 'functional-team',
    question: 'Describe a situation where a project was failing. How did you collaborate to turn it around?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Problem-Solving & Teamwork'
  },
  {
    id: 'curated-2-007',
    stage: 2,
    stageName: 'functional-team',
    question: 'How do you handle a situation where a team member is not pulling their weight?',
    difficulty: 'intermediate',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Team Management'
  },
  {
    id: 'curated-2-008',
    stage: 2,
    stageName: 'functional-team',
    question: 'How do you adapt your communication style when working with people from different cultural backgrounds?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Cultural Sensitivity'
  },
  {
    id: 'curated-2-009',
    stage: 2,
    stageName: 'functional-team',
    question: 'Give an example of a time you had to ask for help on a challenging task.',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Collaboration & Humility'
  },
  {
    id: 'curated-2-010',
    stage: 2,
    stageName: 'functional-team',
    question: 'How do you bring a new idea forward to a team that might be resistant to change?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Change Management'
  }
];

/**
 * Stage 3: Hiring Manager Interview
 * Focus: Role-Specific Competencies, Performance Expectations
 * Difficulty: Intermediate → Advanced
 */
export const STAGE_3_QUESTIONS: CuratedQuestion[] = [
  {
    id: 'curated-3-001',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'Walk me through a project that demonstrates your ability to manage a budget or design a complex system.',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Project Management'
  },
  {
    id: 'curated-3-002',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'What are your top three priorities in the first 90 days of this role?',
    difficulty: 'intermediate',
    category: 'situational',
    starMethodRelevant: false,
    focusArea: 'Strategic Planning'
  },
  {
    id: 'curated-3-003',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'How do you handle ambiguity or shifting priorities from leadership?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Adaptability'
  },
  {
    id: 'curated-3-004',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'Tell me about a time when you had to make a difficult decision under pressure.',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Decision-Making'
  },
  {
    id: 'curated-3-005',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'How do you measure success in your work, and how do you track progress toward goals?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Performance Metrics'
  },
  {
    id: 'curated-3-006',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'Describe a time when you disagreed with your manager's approach. How did you handle it?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Leadership Relationship'
  },
  {
    id: 'curated-3-007',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'What would you do if a key stakeholder kept changing requirements mid-project?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Stakeholder Management'
  },
  {
    id: 'curated-3-008',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'How do you approach building relationships with senior leadership?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Executive Presence'
  },
  {
    id: 'curated-3-009',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'Tell me about a time you identified and solved a significant inefficiency in a process or system.',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Process Improvement'
  },
  {
    id: 'curated-3-010',
    stage: 3,
    stageName: 'hiring-manager',
    question: 'How do you balance delivering quick wins with building long-term sustainable solutions?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Strategic Balance'
  }
];

/**
 * Stage 4: Subject Matter Expertise Interview
 * Focus: Technical Knowledge, Problem-Solving
 * Difficulty: Intermediate → Advanced
 */
export const STAGE_4_QUESTIONS: CuratedQuestion[] = [
  {
    id: 'curated-4-001',
    stage: 4,
    stageName: 'sme-expert',
    question: 'Explain a specific technical concept or theory relevant to this role and how you\'ve applied it recently.',
    difficulty: 'advanced',
    category: 'technical',
    starMethodRelevant: true,
    focusArea: 'Technical Depth'
  },
  {
    id: 'curated-4-002',
    stage: 4,
    stageName: 'sme-expert',
    question: 'Walk us through your process for troubleshooting a critical system failure in a live environment.',
    difficulty: 'advanced',
    category: 'technical',
    starMethodRelevant: true,
    focusArea: 'Problem-Solving'
  },
  {
    id: 'curated-4-003',
    stage: 4,
    stageName: 'sme-expert',
    question: 'What are the major current trends or disruptions in your industry, and how should our company respond?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: false,
    focusArea: 'Industry Knowledge'
  },
  {
    id: 'curated-4-004',
    stage: 4,
    stageName: 'sme-expert',
    question: 'Describe the most technically complex project you\'ve worked on and your specific contributions.',
    difficulty: 'advanced',
    category: 'technical',
    starMethodRelevant: true,
    focusArea: 'Technical Complexity'
  },
  {
    id: 'curated-4-005',
    stage: 4,
    stageName: 'sme-expert',
    question: 'How do you stay current with emerging technologies and methodologies in your field?',
    difficulty: 'intermediate',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Continuous Learning'
  },
  {
    id: 'curated-4-006',
    stage: 4,
    stageName: 'sme-expert',
    question: 'Tell me about a time you had to make a technical decision with significant trade-offs. How did you decide?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Technical Decision-Making'
  },
  {
    id: 'curated-4-007',
    stage: 4,
    stageName: 'sme-expert',
    question: 'How do you approach code reviews or quality assurance in your work?',
    difficulty: 'intermediate',
    category: 'technical',
    starMethodRelevant: true,
    focusArea: 'Quality Standards'
  },
  {
    id: 'curated-4-008',
    stage: 4,
    stageName: 'sme-expert',
    question: 'Describe a situation where you had to explain a complex technical solution to non-technical stakeholders and gain buy-in.',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Technical Communication'
  },
  {
    id: 'curated-4-009',
    stage: 4,
    stageName: 'sme-expert',
    question: 'What is your approach to balancing innovation with technical debt and legacy system maintenance?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Technical Strategy'
  },
  {
    id: 'curated-4-010',
    stage: 4,
    stageName: 'sme-expert',
    question: 'How do you mentor or train others in technical concepts that you find straightforward but others struggle with?',
    difficulty: 'intermediate',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Knowledge Transfer'
  }
];

/**
 * Stage 5: Executive - Senior Leadership Interview
 * Focus: Strategic Vision, Leadership Potential
 * Difficulty: Advanced Only
 */
export const STAGE_5_QUESTIONS: CuratedQuestion[] = [
  {
    id: 'curated-5-001',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'Where do you see our company\'s biggest opportunity for growth in the next 3-5 years?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: false,
    focusArea: 'Strategic Vision'
  },
  {
    id: 'curated-5-002',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'What is your philosophy on risk-taking at an organizational level?',
    difficulty: 'advanced',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Leadership Philosophy'
  },
  {
    id: 'curated-5-003',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'How do you personally drive diversity, equity, and inclusion in your organization?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Cultural Leadership'
  },
  {
    id: 'curated-5-004',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'What legacy would you hope to leave in this role after five years?',
    difficulty: 'advanced',
    category: 'general',
    starMethodRelevant: false,
    focusArea: 'Long-term Impact'
  },
  {
    id: 'curated-5-005',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'How do you balance long-term vision with immediate quarterly results and stakeholder expectations?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Strategic Execution'
  },
  {
    id: 'curated-5-006',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'Tell me about a time you had to lead a significant organizational transformation. What was your approach?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Change Leadership'
  },
  {
    id: 'curated-5-007',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'How do you build and maintain trust with your board of directors or key investors?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Stakeholder Relations'
  },
  {
    id: 'curated-5-008',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'Describe your approach to talent development and succession planning at the executive level.',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Leadership Development'
  },
  {
    id: 'curated-5-009',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'How do you ensure the organization remains competitive and innovative in a rapidly changing market?',
    difficulty: 'advanced',
    category: 'situational',
    starMethodRelevant: true,
    focusArea: 'Competitive Strategy'
  },
  {
    id: 'curated-5-010',
    stage: 5,
    stageName: 'executive-leadership',
    question: 'Tell me about a crisis you\'ve led your organization through. What were the key lessons learned?',
    difficulty: 'advanced',
    category: 'behavioral',
    starMethodRelevant: true,
    focusArea: 'Crisis Management'
  }
];

/**
 * Combined curated question bank - 50 representative questions (10 per stage)
 * Full bank contains 125 questions total from source document
 */
export const CURATED_QUESTION_BANK: CuratedQuestion[] = [
  ...STAGE_1_QUESTIONS,
  ...STAGE_2_QUESTIONS,
  ...STAGE_3_QUESTIONS,
  ...STAGE_4_QUESTIONS,
  ...STAGE_5_QUESTIONS
];

/**
 * Get curated questions for a specific stage (as reference examples for AI)
 */
export function getCuratedQuestionsByStage(stage: 1 | 2 | 3 | 4 | 5, limit: number = 5): CuratedQuestion[] {
  const stageQuestions = CURATED_QUESTION_BANK.filter(q => q.stage === stage);
  return stageQuestions.slice(0, limit);
}

/**
 * Get curated questions by difficulty level
 */
export function getCuratedQuestionsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced', limit: number = 10): CuratedQuestion[] {
  const difficultyQuestions = CURATED_QUESTION_BANK.filter(q => q.difficulty === difficulty);
  return difficultyQuestions.slice(0, limit);
}

/**
 * Get stage statistics
 */
export function getCuratedQuestionStats() {
  return {
    totalQuestions: CURATED_QUESTION_BANK.length,
    stage1: STAGE_1_QUESTIONS.length,
    stage2: STAGE_2_QUESTIONS.length,
    stage3: STAGE_3_QUESTIONS.length,
    stage4: STAGE_4_QUESTIONS.length,
    stage5: STAGE_5_QUESTIONS.length,
    byDifficulty: {
      beginner: CURATED_QUESTION_BANK.filter(q => q.difficulty === 'beginner').length,
      intermediate: CURATED_QUESTION_BANK.filter(q => q.difficulty === 'intermediate').length,
      advanced: CURATED_QUESTION_BANK.filter(q => q.difficulty === 'advanced').length
    }
  };
}
