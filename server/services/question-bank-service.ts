import { storage } from "../storage";
import { sealionService } from "./sealion";
import { aiRouter } from "./ai-router";
import type { SupportedLanguage } from "@shared/schema";

export interface QuestionData {
  id: string;
  question: string;
  category: 'behavioral' | 'situational' | 'technical' | 'company-specific' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  interviewStage: 'phone-screening' | 'functional-team' | 'hiring-manager' | 'subject-matter-expertise' | 'executive-final';
  tags: string[];
  expectedAnswerTime: number; // minutes
  starMethodRelevant: boolean;
  culturalContext?: string;
  industrySpecific?: string[];
}

export interface QuestionSet {
  interviewStage: string;
  questions: QuestionData[];
  totalQuestions: number;
  averageDifficulty: number;
}

// Comprehensive question bank organized by interview stages
export const COMPREHENSIVE_QUESTION_BANK: Record<string, QuestionData[]> = {
  "phone-screening": [
    {
      id: "ps-001",
      question: "Tell me about yourself and why you're interested in this position.",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["introduction", "motivation", "background"],
      expectedAnswerTime: 3,
      starMethodRelevant: false,
      culturalContext: "Professional introduction with emphasis on career goals"
    },
    {
      id: "ps-002", 
      question: "What do you know about our company and why do you want to work here?",
      category: "company-specific",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["company-research", "motivation", "cultural-fit"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Demonstrates research and genuine interest"
    },
    {
      id: "ps-003",
      question: "Describe a challenging situation you faced at work and how you handled it.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["problem-solving", "resilience", "professionalism"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Shows problem-solving approach and professionalism"
    },
    {
      id: "ps-004",
      question: "What are your greatest strengths and how do they relate to this role?",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["strengths", "self-assessment", "role-alignment"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Confident but humble self-presentation"
    },
    {
      id: "ps-005",
      question: "Tell me about a time when you had to work with a difficult colleague or customer.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["teamwork", "conflict-resolution", "interpersonal"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Diplomatic approach to conflict resolution"
    },
    {
      id: "ps-006",
      question: "Where do you see yourself in 5 years?",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["career-goals", "ambition", "planning"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Balanced ambition with commitment to growth"
    },
    {
      id: "ps-007",
      question: "What motivates you in your work?",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["motivation", "values", "work-style"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Personal values aligned with professional goals"
    },
    {
      id: "ps-008",
      question: "Describe a time when you had to learn something new quickly.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["learning-agility", "adaptability", "growth"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Demonstrates continuous learning mindset"
    },
    {
      id: "ps-009",
      question: "How do you handle stress and pressure?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["stress-management", "resilience", "coping"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Healthy approach to workplace pressure"
    },
    {
      id: "ps-010",
      question: "What are your salary expectations?",
      category: "general",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["compensation", "negotiation", "expectations"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Professional discussion of compensation expectations"
    },
    {
      id: "ps-011",
      question: "Tell me about a project you're particularly proud of.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["achievement", "pride", "contribution"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Highlights accomplishments with appropriate pride"
    },
    {
      id: "ps-012",
      question: "How do you prioritize your work when you have multiple deadlines?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["time-management", "prioritization", "organization"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Systematic approach to task management"
    },
    {
      id: "ps-013",
      question: "What questions do you have about the role or our company?",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["curiosity", "engagement", "preparation"],
      expectedAnswerTime: 3,
      starMethodRelevant: false,
      culturalContext: "Shows genuine interest and preparation"
    },
    {
      id: "ps-014",
      question: "Describe your ideal work environment.",
      category: "general",
      difficulty: "beginner",
      interviewStage: "phone-screening",
      tags: ["work-environment", "cultural-fit", "preferences"],
      expectedAnswerTime: 2,
      starMethodRelevant: false,
      culturalContext: "Alignment with company culture and values"
    },
    {
      id: "ps-015",
      question: "Tell me about a time when you made a mistake and how you handled it.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["accountability", "learning", "integrity"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Shows accountability and learning from errors"
    },
    {
      id: "ps-016",
      question: "How do you stay current with industry trends and developments?",
      category: "general",
      difficulty: "intermediate",
      interviewStage: "phone-screening",
      tags: ["continuous-learning", "industry-knowledge", "professional-development"],
      expectedAnswerTime: 3,
      starMethodRelevant: false,
      culturalContext: "Commitment to professional growth and staying informed"
    }
  ],
  
  "functional-team": [
    {
      id: "ft-001",
      question: "Describe a time when you had to collaborate with multiple team members to complete a project.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["teamwork", "collaboration", "project-management"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Emphasizes team harmony and collective success"
    },
    {
      id: "ft-002",
      question: "How would you handle a situation where a team member is not contributing effectively?",
      category: "situational",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["team-management", "conflict-resolution", "leadership"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Diplomatic approach respecting individual dignity"
    },
    {
      id: "ft-003",
      question: "Tell me about a time when you had to adapt to a significant change in your work process.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["adaptability", "change-management", "flexibility"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Shows resilience and positive attitude toward change"
    },
    {
      id: "ft-004",
      question: "Describe your approach to training or mentoring new team members.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["mentoring", "training", "knowledge-sharing"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Demonstrates caring and supportive leadership style"
    },
    {
      id: "ft-005",
      question: "How do you ensure quality in your work while meeting tight deadlines?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["quality-assurance", "time-management", "standards"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Balance between efficiency and excellence"
    },
    {
      id: "ft-006",
      question: "Tell me about a time when you identified and solved a process improvement opportunity.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["process-improvement", "innovation", "efficiency"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Proactive approach to continuous improvement"
    },
    {
      id: "ft-007",
      question: "Describe a situation where you had to communicate complex information to non-technical stakeholders.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["communication", "simplification", "stakeholder-management"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Clear communication across different backgrounds"
    },
    {
      id: "ft-008",
      question: "How do you handle receiving constructive criticism or feedback?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["feedback", "growth-mindset", "professionalism"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Graceful acceptance of feedback with learning focus"
    },
    {
      id: "ft-009",
      question: "Tell me about a time when you had to work with limited resources to achieve your goals.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["resourcefulness", "creativity", "problem-solving"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Demonstrates ingenuity and efficient resource utilization"
    },
    {
      id: "ft-010",
      question: "Describe your experience working in a diverse, multicultural team.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["diversity", "cultural-sensitivity", "inclusion"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Appreciation for cultural diversity and inclusive practices"
    },
    {
      id: "ft-011",
      question: "How do you stay organized and manage multiple competing priorities?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["organization", "priority-management", "productivity"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Systematic approach to workload management"
    },
    {
      id: "ft-012",
      question: "Tell me about a time when you had to take initiative on a project without being asked.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["initiative", "proactivity", "leadership"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Balance between initiative and respect for hierarchy"
    },
    {
      id: "ft-013",
      question: "Describe a challenging deadline you've had to meet and how you ensured success.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["deadline-management", "planning", "execution"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Commitment to meeting commitments with quality work"
    },
    {
      id: "ft-014",
      question: "How do you approach learning new tools or technologies required for your role?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["learning", "technology", "adaptation"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Enthusiasm for continuous learning and skill development"
    },
    {
      id: "ft-015",
      question: "Tell me about a time when you had to convince others to support your idea or proposal.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "functional-team",
      tags: ["persuasion", "influence", "communication"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Respectful persuasion with data-driven arguments"
    }
  ],

  "hiring-manager": [
    {
      id: "hm-001",
      question: "Tell me about a time when you had to make a difficult decision with limited information.",
      category: "behavioral",
      difficulty: "intermediate", 
      interviewStage: "hiring-manager",
      tags: ["decision-making", "judgment", "leadership"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Demonstrates sound judgment and decisive leadership"
    },
    {
      id: "hm-002",
      question: "Describe a situation where you had to manage conflicting priorities from different stakeholders.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["stakeholder-management", "prioritization", "diplomacy"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Shows diplomatic skills in managing competing demands"
    },
    {
      id: "hm-003",
      question: "How do you approach setting and communicating goals for your team or projects?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["goal-setting", "communication", "leadership"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Clear communication with team engagement and buy-in"
    },
    {
      id: "hm-004",
      question: "Tell me about a time when you had to drive change in an organization or team.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["change-management", "leadership", "influence"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Respectful approach to change with stakeholder engagement"
    },
    {
      id: "hm-005",
      question: "Describe your approach to developing and mentoring team members.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["mentoring", "development", "leadership"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Caring leadership focused on individual growth"
    },
    {
      id: "hm-006",
      question: "How do you handle underperformance in your team?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["performance-management", "coaching", "difficult-conversations"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Compassionate but firm approach to performance issues"
    },
    {
      id: "hm-007",
      question: "Tell me about a time when you had to deliver difficult news or feedback to stakeholders.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["communication", "difficult-conversations", "transparency"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Honest and respectful communication of challenging information"
    },
    {
      id: "hm-008",
      question: "Describe a situation where you had to balance short-term pressures with long-term strategic goals.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["strategic-thinking", "balance", "planning"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Strategic mindset with consideration for sustainable success"
    },
    {
      id: "hm-009",
      question: "How do you ensure your team remains motivated during challenging periods?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["motivation", "team-morale", "leadership"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Supportive leadership that maintains team spirit"
    },
    {
      id: "hm-010",
      question: "Tell me about a time when you had to negotiate a complex agreement or resolution.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["negotiation", "problem-solving", "diplomacy"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Win-win negotiation approach with mutual respect"
    },
    {
      id: "hm-011",
      question: "Describe your approach to risk assessment and management in projects.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["risk-management", "planning", "analysis"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Prudent risk assessment with contingency planning"
    },
    {
      id: "hm-012",
      question: "How do you stay informed about industry trends and incorporate them into your work?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["industry-knowledge", "continuous-learning", "innovation"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Proactive learning and adaptation to industry changes"
    },
    {
      id: "hm-013",
      question: "Tell me about a time when you had to build consensus among diverse stakeholders.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["consensus-building", "stakeholder-management", "influence"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Inclusive approach to building agreement across differences"
    },
    {
      id: "hm-014",
      question: "Describe a situation where you had to pivot strategy based on changing market conditions.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "hiring-manager",
      tags: ["adaptability", "strategic-thinking", "market-awareness"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Agile response to market changes with strategic thinking"
    },
    {
      id: "hm-015",
      question: "How do you ensure quality and consistency across your team's deliverables?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["quality-assurance", "standards", "team-management"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Systematic approach to maintaining high standards"
    },
    {
      id: "hm-016",
      question: "Tell me about your experience with budget management and resource allocation.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "hiring-manager",
      tags: ["budget-management", "resource-allocation", "financial-acumen"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Responsible stewardship of company resources"
    }
  ],

  "subject-matter-expertise": [
    {
      id: "sme-001",
      question: "Walk me through your approach to solving a complex technical problem in your domain.",
      category: "technical",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["problem-solving", "technical-expertise", "methodology"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Systematic and thorough technical problem-solving approach"
    },
    {
      id: "sme-002",
      question: "Describe a time when you had to quickly master a new technology or methodology for a project.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["learning-agility", "technical-adaptation", "expertise-building"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Continuous learning and professional development commitment"
    },
    {
      id: "sme-003",
      question: "How do you stay current with best practices and emerging trends in your field?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["continuous-learning", "industry-trends", "professional-development"],
      expectedAnswerTime: 3,
      starMethodRelevant: false,
      culturalContext: "Commitment to staying at forefront of professional knowledge"
    },
    {
      id: "sme-004",
      question: "Tell me about a time when you had to debug or troubleshoot a particularly challenging issue.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["troubleshooting", "debugging", "analytical-thinking"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Methodical approach to problem-solving with persistence"
    },
    {
      id: "sme-005",
      question: "Describe your experience with [specific technology/methodology relevant to role].",
      category: "technical",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["specific-expertise", "hands-on-experience", "technical-depth"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Deep technical knowledge with practical application experience"
    },
    {
      id: "sme-006",
      question: "How do you approach code/work quality and maintainability in your projects?",
      category: "technical",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["quality-standards", "maintainability", "best-practices"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Professional standards with long-term thinking"
    },
    {
      id: "sme-007",
      question: "Tell me about a time when you had to make architectural or design decisions for a complex system.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["architecture", "design-decisions", "systems-thinking"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Strategic technical thinking with scalability considerations"
    },
    {
      id: "sme-008",
      question: "Describe your experience with performance optimization and scalability challenges.",
      category: "technical",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["performance", "scalability", "optimization"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Efficient and scalable solution design mindset"
    },
    {
      id: "sme-009",
      question: "How do you approach knowledge sharing and documentation in technical projects?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["knowledge-sharing", "documentation", "collaboration"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Collaborative approach to knowledge and team capability building"
    },
    {
      id: "sme-010",
      question: "Tell me about a time when you had to integrate multiple systems or technologies.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["integration", "systems-architecture", "technical-complexity"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Holistic thinking about system interactions and dependencies"
    },
    {
      id: "sme-011",
      question: "Describe your approach to testing and quality assurance in your work.",
      category: "technical",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["testing", "quality-assurance", "reliability"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Thorough and systematic approach to ensuring quality"
    },
    {
      id: "sme-012",
      question: "How do you handle technical debt and legacy system maintenance?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "subject-matter-expertise",
      tags: ["technical-debt", "legacy-systems", "maintenance"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Balanced approach to innovation and system maintenance"
    },
    {
      id: "sme-013",
      question: "Tell me about your experience with security considerations in your technical work.",
      category: "technical",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["security", "risk-management", "compliance"],
      expectedAnswerTime: 3,
      starMethodRelevant: true,
      culturalContext: "Security-conscious development with compliance awareness"
    },
    {
      id: "sme-014",
      question: "Describe a time when you had to mentor or train others in technical concepts.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["mentoring", "knowledge-transfer", "technical-communication"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Patient and supportive technical mentorship approach"
    },
    {
      id: "sme-015",
      question: "How do you evaluate and select appropriate tools and technologies for projects?",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "subject-matter-expertise",
      tags: ["technology-selection", "evaluation", "decision-making"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Pragmatic technology selection with business considerations"
    }
  ],

  "executive-final": [
    {
      id: "ef-001",
      question: "Describe your leadership philosophy and how it has evolved throughout your career.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["leadership-philosophy", "personal-growth", "management-style"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Thoughtful leadership approach with cultural sensitivity"
    },
    {
      id: "ef-002",
      question: "Tell me about a time when you had to lead an organization through a significant transformation.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["transformation", "change-leadership", "strategic-execution"],
      expectedAnswerTime: 6,
      starMethodRelevant: true,
      culturalContext: "Visionary leadership with stakeholder engagement and cultural awareness"
    },
    {
      id: "ef-003",
      question: "How do you approach building and maintaining strategic partnerships?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["partnerships", "relationship-building", "strategic-alliances"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Long-term relationship building with mutual value creation"
    },
    {
      id: "ef-004",
      question: "Describe your experience with P&L responsibility and financial stewardship.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["p&l-management", "financial-stewardship", "business-acumen"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Responsible financial management with sustainable growth focus"
    },
    {
      id: "ef-005",
      question: "How do you develop and communicate a compelling vision for your organization?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["vision-development", "strategic-communication", "inspiration"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Inspiring vision that resonates across diverse cultural backgrounds"
    },
    {
      id: "ef-006",
      question: "Tell me about a time when you had to make a decision that was unpopular but necessary.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["difficult-decisions", "courage", "leadership"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Principled decision-making with transparent communication"
    },
    {
      id: "ef-007",
      question: "How do you foster innovation and entrepreneurial thinking in large organizations?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["innovation", "entrepreneurship", "culture-building"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Balanced approach to innovation with risk management"
    },
    {
      id: "ef-008",
      question: "Describe your approach to talent development and succession planning.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["talent-development", "succession-planning", "people-leadership"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Investment in people development with diverse career pathway support"
    },
    {
      id: "ef-009",
      question: "How do you navigate regulatory and compliance challenges in your industry?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["regulatory-compliance", "risk-management", "governance"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Proactive compliance with ethical business practices"
    },
    {
      id: "ef-010",
      question: "Tell me about your experience with mergers, acquisitions, or major business integrations.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["m&a", "integration", "strategic-execution"],
      expectedAnswerTime: 6,
      starMethodRelevant: true,
      culturalContext: "Strategic integration with cultural sensitivity and people focus"
    },
    {
      id: "ef-011",
      question: "How do you ensure your organization remains competitive in a rapidly changing market?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["competitive-strategy", "market-adaptation", "strategic-planning"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Agile strategic thinking with sustainable competitive advantages"
    },
    {
      id: "ef-012",
      question: "Describe your approach to corporate social responsibility and sustainability.",
      category: "behavioral",
      difficulty: "intermediate",
      interviewStage: "executive-final",
      tags: ["csr", "sustainability", "stakeholder-capitalism"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Commitment to social responsibility with business value alignment"
    },
    {
      id: "ef-013",
      question: "How do you build and maintain trust with your board of directors and investors?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["board-relations", "investor-relations", "governance"],
      expectedAnswerTime: 4,
      starMethodRelevant: true,
      culturalContext: "Transparent and accountable leadership with regular communication"
    },
    {
      id: "ef-014",
      question: "Tell me about a crisis you've led your organization through and the lessons learned.",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["crisis-management", "resilience", "leadership-under-pressure"],
      expectedAnswerTime: 6,
      starMethodRelevant: true,
      culturalContext: "Calm and decisive crisis leadership with stakeholder communication"
    },
    {
      id: "ef-015",
      question: "How do you balance the needs of different stakeholders while driving business results?",
      category: "behavioral",
      difficulty: "advanced",
      interviewStage: "executive-final",
      tags: ["stakeholder-management", "balance", "business-results"],
      expectedAnswerTime: 5,
      starMethodRelevant: true,
      culturalContext: "Inclusive stakeholder consideration with principled decision-making"
    }
  ]
};

export class QuestionBankService {
  
  // ================================
  // QUESTION RETRIEVAL METHODS
  // ================================
  
  async getQuestionsForStage(
    interviewStage: string,
    count: number = 15,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    language: SupportedLanguage = 'en'
  ): Promise<QuestionData[]> {
    const stageQuestions = COMPREHENSIVE_QUESTION_BANK[interviewStage] || [];
    
    let filteredQuestions = stageQuestions;
    if (difficulty) {
      filteredQuestions = stageQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // Ensure we have at least the requested count
    if (filteredQuestions.length < count) {
      console.log(`Only ${filteredQuestions.length} questions available for ${interviewStage}, generating additional questions...`);
      const additionalQuestions = await this.generateAdditionalQuestions(
        interviewStage, 
        count - filteredQuestions.length,
        difficulty,
        language
      );
      filteredQuestions = [...filteredQuestions, ...additionalQuestions];
    }
    
    // Return exactly the requested count, shuffled for variety
    return this.shuffleArray(filteredQuestions).slice(0, count);
  }
  
  async getAllStageQuestions(): Promise<Record<string, QuestionSet>> {
    const result: Record<string, QuestionSet> = {};
    
    for (const [stage, questions] of Object.entries(COMPREHENSIVE_QUESTION_BANK)) {
      const totalQuestions = questions.length;
      const averageDifficulty = this.calculateAverageDifficulty(questions);
      
      result[stage] = {
        interviewStage: stage,
        questions,
        totalQuestions,
        averageDifficulty
      };
    }
    
    return result;
  }
  
  // ================================
  // DYNAMIC QUESTION GENERATION
  // ================================
  
  async generateAdditionalQuestions(
    interviewStage: string,
    count: number,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    language: SupportedLanguage = 'en'
  ): Promise<QuestionData[]> {
    const prompt = this.buildQuestionGenerationPrompt(interviewStage, count, difficulty);
    
    try {
      const aiResult = await aiRouter.generateResponse({
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach specializing in Southeast Asian business culture. Generate professional interview questions that are culturally appropriate and effective for assessment."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        maxTokens: 2000,
        temperature: 0.7,
        domain: 'general'
      });

      console.log(`📋 Generated additional questions using ${aiResult.provider} in ${aiResult.responseTime}ms${aiResult.fallbackUsed ? ' (fallback)' : ''}`);
      const generatedQuestions = this.parseGeneratedQuestions(aiResult.content, interviewStage, count);
      
      return generatedQuestions;
    } catch (error) {
      console.error("Error generating additional questions:", error);
      return this.generateFallbackQuestions(interviewStage, count, difficulty);
    }
  }
  
  private buildQuestionGenerationPrompt(
    interviewStage: string, 
    count: number, 
    difficulty?: string
  ): string {
    const stageContext = this.getStageContext(interviewStage);
    
    return `Generate ${count} professional interview questions for the ${interviewStage} interview stage.

Stage Context: ${stageContext}
${difficulty ? `Difficulty Level: ${difficulty}` : 'Mixed difficulty levels (beginner, intermediate, advanced)'}

Requirements:
- Questions should be culturally appropriate for Southeast Asian business environments
- Mix of behavioral, situational, and role-specific questions
- Include STAR method relevant questions
- Professional language suitable for diverse candidates

Return a JSON array with this structure:
[
  {
    "question": "string",
    "category": "behavioral|situational|technical|company-specific|general",
    "difficulty": "beginner|intermediate|advanced", 
    "tags": ["tag1", "tag2", "tag3"],
    "expectedAnswerTime": number (minutes),
    "starMethodRelevant": boolean,
    "culturalContext": "brief cultural guidance for answering"
  }
]

Focus on questions that assess competency while being respectful of diverse backgrounds and experiences.`;
  }
  
  private getStageContext(interviewStage: string): string {
    const contexts: Record<string, string> = {
      "phone-screening": "Initial screening to assess basic qualifications, communication skills, and cultural fit. Focus on background, motivation, and fundamental competencies.",
      "functional-team": "Team-based interview focusing on collaboration, technical skills relevant to the role, and ability to work effectively with colleagues.",
      "hiring-manager": "Strategic interview with decision-maker focusing on leadership potential, problem-solving, and alignment with team goals and company values.", 
      "subject-matter-expertise": "Deep technical or specialized knowledge assessment. Questions focus on expertise, industry knowledge, and advanced problem-solving.",
      "executive-final": "Senior-level interview focusing on strategic thinking, leadership philosophy, cultural impact, and long-term contribution to organizational success."
    };
    
    return contexts[interviewStage] || "General interview assessment";
  }
  
  private parseGeneratedQuestions(
    aiResponse: string, 
    interviewStage: string, 
    expectedCount: number
  ): QuestionData[] {
    try {
      const parsedQuestions = JSON.parse(aiResponse);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Generated questions is not an array");
      }
      
      return parsedQuestions.map((q, index) => ({
        id: `${interviewStage}-gen-${Date.now()}-${index}`,
        question: q.question || "Generated question",
        category: q.category || "general",
        difficulty: q.difficulty || "intermediate", 
        interviewStage: interviewStage as any,
        tags: Array.isArray(q.tags) ? q.tags : ["generated"],
        expectedAnswerTime: q.expectedAnswerTime || 3,
        starMethodRelevant: q.starMethodRelevant || false,
        culturalContext: q.culturalContext || "Professional response expected"
      }));
    } catch (error) {
      console.error("Error parsing generated questions:", error);
      return this.generateFallbackQuestions(interviewStage, expectedCount);
    }
  }
  
  private generateFallbackQuestions(
    interviewStage: string, 
    count: number, 
    difficulty?: string
  ): QuestionData[] {
    const fallbackQuestions: QuestionData[] = [];
    
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({
        id: `${interviewStage}-fallback-${Date.now()}-${i}`,
        question: `Tell me about a relevant experience that demonstrates your fit for this ${interviewStage} interview stage.`,
        category: "behavioral",
        difficulty: (difficulty as any) || "intermediate",
        interviewStage: interviewStage as any,
        tags: ["experience", "fit", "competency"],
        expectedAnswerTime: 3,
        starMethodRelevant: true,
        culturalContext: "Share specific examples that show your qualifications"
      });
    }
    
    return fallbackQuestions;
  }
  
  // ================================
  // UTILITY METHODS
  // ================================
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private calculateAverageDifficulty(questions: QuestionData[]): number {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const total = questions.reduce((sum, q) => sum + difficultyMap[q.difficulty], 0);
    return total / questions.length;
  }
  
  async getQuestionsByCategory(
    category: 'behavioral' | 'situational' | 'technical' | 'company-specific' | 'general',
    limit: number = 10
  ): Promise<QuestionData[]> {
    const allQuestions = Object.values(COMPREHENSIVE_QUESTION_BANK).flat();
    const categoryQuestions = allQuestions.filter(q => q.category === category);
    return this.shuffleArray(categoryQuestions).slice(0, limit);
  }
  
  async getStarMethodQuestions(limit: number = 15): Promise<QuestionData[]> {
    const allQuestions = Object.values(COMPREHENSIVE_QUESTION_BANK).flat();
    const starQuestions = allQuestions.filter(q => q.starMethodRelevant);
    return this.shuffleArray(starQuestions).slice(0, limit);
  }
  
  async getQuestionStatistics(): Promise<{
    totalQuestions: number;
    questionsByStage: Record<string, number>;
    questionsByCategory: Record<string, number>;
    questionsByDifficulty: Record<string, number>;
  }> {
    const allQuestions = Object.values(COMPREHENSIVE_QUESTION_BANK).flat();
    
    const questionsByStage: Record<string, number> = {};
    const questionsByCategory: Record<string, number> = {};
    const questionsByDifficulty: Record<string, number> = {};
    
    allQuestions.forEach(q => {
      questionsByStage[q.interviewStage] = (questionsByStage[q.interviewStage] || 0) + 1;
      questionsByCategory[q.category] = (questionsByCategory[q.category] || 0) + 1;
      questionsByDifficulty[q.difficulty] = (questionsByDifficulty[q.difficulty] || 0) + 1;
    });
    
    return {
      totalQuestions: allQuestions.length,
      questionsByStage,
      questionsByCategory,
      questionsByDifficulty
    };
  }
}

export const questionBankService = new QuestionBankService();