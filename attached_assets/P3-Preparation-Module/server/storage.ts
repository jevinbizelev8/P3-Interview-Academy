import { type Session, type Question, type Response, type WgllContent, type JobDescription, type InsertSession, type InsertQuestion, type InsertResponse, type InsertWgllContent, type InsertJobDescription, type InterviewType, type STARGuidance, sessions, questions, responses, wgllContent, jobDescriptions } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Session management
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  
  // Question management
  getQuestionsByType(type: InterviewType, industry?: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getTechnicalIndustries(): Promise<{ id: string; name: string; description: string; questionCount: number }[]>;
  
  // Response management
  getResponsesBySession(sessionId: string): Promise<Response[]>;
  getResponseById(id: string): Promise<Response | undefined>;
  createResponse(response: InsertResponse): Promise<Response>;
  updateResponse(id: string, updates: Partial<Response>): Promise<Response>;
  
  // WGLL content
  getWgllContent(questionId: string): Promise<WgllContent | undefined>;
  createWgllContent(content: InsertWgllContent): Promise<WgllContent>;
  
  // Job Description management
  getJobDescription(id: string): Promise<JobDescription | undefined>;
  getJobDescriptionsByUser(userId: string): Promise<JobDescription[]>;
  createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription>;
  deleteJobDescription(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private seedingPromise: Promise<void>;

  constructor() {
    // Professional questions are now managed separately - no automatic seeding
    this.seedingPromise = Promise.resolve();
  }

  private async ensureSeeded() {
    await this.seedingPromise;
  }

  private async seedQuestions() {
    // Stage 1: Phone/Initial Screening (HR)
    const phoneScreeningQuestions: InsertQuestion[] = [
      {
        type: 'phone-screening',
        question: 'Tell me about yourself and what interests you about this role.',
        tags: ['Personal Introduction', 'Role Interest', 'Communication'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'Your current professional background and context',
          task: 'What you\'re looking to achieve in your next role',
          action: 'How your experience aligns with this opportunity',
          result: 'The value you can bring to the organization'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Why are you interested in leaving your current position?',
        tags: ['Career Motivation', 'Professional Growth', 'Change Management'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Your current role and what\'s driving the change',
          task: 'Professional goals you want to achieve',
          action: 'Steps you\'ve taken to evaluate this decision',
          result: 'How this opportunity fits your career progression'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What are your salary expectations for this role?',
        tags: ['Compensation', 'Negotiation', 'Market Awareness'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Your research on market rates and role scope',
          task: 'Balancing fair compensation with opportunity value',
          action: 'How you arrived at your expectation range',
          result: 'Flexibility and factors that matter most to you'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Do you have any questions about the company culture or this position?',
        tags: ['Company Research', 'Culture Fit', 'Engagement'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'What you\'ve learned about the company so far',
          task: 'Understanding key aspects important to your success',
          action: 'Specific questions that show your genuine interest',
          result: 'How the answers will influence your decision'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What are your greatest strengths and how do they relate to this role?',
        tags: ['Strengths', 'Self-Assessment', 'Role Alignment'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'Context where your strengths have been most valuable',
          task: 'Identifying your key differentiators',
          action: 'Specific examples demonstrating these strengths',
          result: 'How these strengths will benefit this role'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Describe a challenge you faced in your current role and how you overcame it.',
        tags: ['Problem Solving', 'Resilience', 'Growth Mindset'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The specific challenge and its context',
          task: 'Your responsibility in addressing the issue',
          action: 'Steps you took to overcome the challenge',
          result: 'Outcome and what you learned from the experience'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'How do you stay current with industry trends and developments?',
        tags: ['Continuous Learning', 'Industry Knowledge', 'Professional Development'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'A recent industry change or trend you encountered',
          task: 'Staying informed and relevant in your field',
          action: 'Specific methods and resources you use for learning',
          result: 'How this knowledge has benefited your work'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What motivates you to do your best work?',
        tags: ['Motivation', 'Work Values', 'Cultural Fit'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'A time when you were particularly motivated and engaged',
          task: 'Understanding what drives your performance',
          action: 'How you channel motivation into results',
          result: 'The impact of this motivation on your achievements'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Tell me about a time when you had to work under pressure or tight deadlines.',
        tags: ['Pressure Management', 'Time Management', 'Performance Under Stress'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The high-pressure situation and its constraints',
          task: 'What needed to be accomplished within the timeframe',
          action: 'Your approach to managing pressure and priorities',
          result: 'Successful delivery and lessons about working under pressure'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'How do you handle feedback and criticism?',
        tags: ['Feedback Reception', 'Growth Mindset', 'Self-Improvement'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A specific time you received constructive feedback',
          task: 'Processing and responding to the feedback appropriately',
          action: 'How you implemented the feedback and made improvements',
          result: 'The positive changes and enhanced performance'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What do you know about our company and why do you want to work here?',
        tags: ['Company Research', 'Interest Level', 'Cultural Alignment'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'Your research and understanding of the company',
          task: 'Demonstrating genuine interest and preparation',
          action: 'Specific aspects that attracted you to the organization',
          result: 'How you see yourself contributing to the company\'s success'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Describe your ideal work environment and management style.',
        tags: ['Work Environment', 'Management Preferences', 'Cultural Fit'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'Your most productive work environment experience',
          task: 'Understanding what enables your best performance',
          action: 'Specific environmental factors and management approaches that work for you',
          result: 'How this translates to success in various work settings'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What are your career goals and how does this position help you achieve them?',
        tags: ['Career Goals', 'Professional Growth', 'Long-term Vision'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Your current career trajectory and aspirations',
          task: 'Aligning opportunity with personal growth objectives',
          action: 'Specific ways this role advances your career',
          result: 'Mutual benefits for both you and the organization'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'Tell me about a time when you had to adapt to a significant change at work.',
        tags: ['Adaptability', 'Change Management', 'Flexibility'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The significant change and its impact',
          task: 'Your role in navigating the transition',
          action: 'How you adapted your approach and mindset',
          result: 'Successful adaptation and positive outcomes from the change'
        } as STARGuidance
      },
      {
        type: 'phone-screening',
        question: 'What would you consider to be your biggest professional achievement?',
        tags: ['Achievements', 'Success Stories', 'Professional Pride'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The context and significance of your achievement',
          task: 'What you set out to accomplish',
          action: 'Specific efforts and strategies that led to success',
          result: 'The impact and why it stands out as your biggest achievement'
        } as STARGuidance
      }
    ];

    // Stage 2: Functional/Team Interview
    const functionalTeamQuestions: InsertQuestion[] = [
      {
        type: 'functional-team',
        question: 'Describe a time when you had to collaborate with cross-functional teams to deliver a project.',
        tags: ['Cross-functional Collaboration', 'Project Delivery', 'Stakeholder Management'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The project scope and teams involved',
          task: 'Your role and responsibilities in the collaboration',
          action: 'How you facilitated communication and alignment',
          result: 'Project outcome and what you learned about teamwork'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Tell me about a time when you disagreed with a team decision. How did you handle it?',
        tags: ['Conflict Resolution', 'Team Dynamics', 'Advocacy'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The decision context and your concerns',
          task: 'Balancing team harmony with voicing your perspective',
          action: 'How you presented your viewpoint constructively',
          result: 'The final outcome and impact on team relationships'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'How do you typically approach mentoring or helping teammates who are struggling?',
        tags: ['Mentoring', 'Team Support', 'Knowledge Sharing'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A specific instance when a teammate needed support',
          task: 'Your approach to identifying and addressing their needs',
          action: 'Specific mentoring techniques and resources you provided',
          result: 'The teammate\'s improvement and your learning from the experience'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Describe your experience working in agile or fast-paced environments.',
        tags: ['Agile Methodology', 'Adaptability', 'Process Improvement'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'The agile environment and its specific challenges',
          task: 'Your role in the agile process and team dynamics',
          action: 'How you adapted and contributed to process improvements',
          result: 'Outcomes achieved and personal growth in agile practices'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Tell me about a time when you had to give difficult feedback to a colleague.',
        tags: ['Feedback Delivery', 'Interpersonal Skills', 'Team Development'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The performance issue and its impact on the team',
          task: 'Your responsibility to address the situation constructively',
          action: 'How you approached and delivered the feedback',
          result: 'The colleague\'s response and improvement in performance'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Describe a situation where you had to work with a difficult team member.',
        tags: ['Conflict Resolution', 'Team Dynamics', 'Relationship Management'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The challenging behavior and its impact on team productivity',
          task: 'Your role in maintaining team effectiveness',
          action: 'Strategies you used to manage the relationship and situation',
          result: 'Improved working relationship and team performance'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'How do you typically onboard new team members or help them integrate?',
        tags: ['Onboarding', 'Team Integration', 'Knowledge Transfer'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A specific new team member you helped onboard',
          task: 'Ensuring their successful integration and productivity',
          action: 'Your approach to training, support, and relationship building',
          result: 'Their successful integration and contribution to the team'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Tell me about a time when you had to coordinate multiple stakeholders with competing priorities.',
        tags: ['Stakeholder Management', 'Priority Alignment', 'Communication'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The competing priorities and stakeholder conflicts',
          task: 'Your role in finding alignment and moving forward',
          action: 'How you facilitated discussions and negotiated solutions',
          result: 'Successful stakeholder alignment and project progress'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Describe your approach to building trust within a new team.',
        tags: ['Trust Building', 'Team Formation', 'Relationship Development'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A new team or role where trust needed to be established',
          task: 'Building credibility and strong working relationships',
          action: 'Specific actions you took to demonstrate reliability and competence',
          result: 'Strong team relationships and improved collaboration'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Tell me about a time when you had to advocate for your team\'s needs to senior management.',
        tags: ['Team Advocacy', 'Upward Influence', 'Resource Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The team\'s needs and organizational constraints',
          task: 'Your responsibility to represent your team\'s interests',
          action: 'How you built the case and presented to leadership',
          result: 'Resources or support gained for your team'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'How do you handle situations when team members have different working styles?',
        tags: ['Diversity Management', 'Team Dynamics', 'Adaptability'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A team with diverse working styles and approaches',
          task: 'Ensuring effective collaboration despite differences',
          action: 'Strategies you used to bridge differences and leverage strengths',
          result: 'Improved team effectiveness and individual satisfaction'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Describe a time when you had to step outside your comfort zone to help your team.',
        tags: ['Team Support', 'Growth Mindset', 'Flexibility'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The team need and your initial discomfort or uncertainty',
          task: 'Your commitment to supporting team success',
          action: 'How you pushed beyond your comfort zone and acquired new skills',
          result: 'Team benefit and your personal growth from the experience'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Tell me about a successful team project you contributed to and your specific role.',
        tags: ['Team Success', 'Collaboration', 'Individual Contribution'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'The project scope and team composition',
          task: 'Your specific responsibilities and deliverables',
          action: 'How you contributed to planning, execution, and team success',
          result: 'Project outcomes and team achievements'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'How do you ensure effective communication in remote or distributed teams?',
        tags: ['Remote Collaboration', 'Communication', 'Team Effectiveness'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A remote or distributed team situation you managed',
          task: 'Maintaining team cohesion and communication effectiveness',
          action: 'Specific tools, processes, and practices you implemented',
          result: 'Improved team communication and productivity'
        } as STARGuidance
      },
      {
        type: 'functional-team',
        question: 'Describe a time when you had to deliver bad news to your team or stakeholders.',
        tags: ['Difficult Conversations', 'Communication', 'Leadership'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The bad news and its potential impact',
          task: 'Your responsibility to communicate effectively and manage reactions',
          action: 'How you prepared for and delivered the message',
          result: 'Team or stakeholder response and next steps taken'
        } as STARGuidance
      }
    ];

    // Stage 3: Hiring Manager Interview
    const hiringManagerQuestions: InsertQuestion[] = [
      {
        type: 'hiring-manager',
        question: 'Tell me about a time when you had to lead a project or initiative with limited authority.',
        tags: ['Leadership', 'Influence', 'Project Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The project context and authority limitations you faced',
          task: 'What needed to be accomplished without formal power',
          action: 'How you influenced and motivated others to contribute',
          result: 'Project success and what you learned about leadership'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Describe a situation where you had to make a difficult decision with incomplete information.',
        tags: ['Decision Making', 'Risk Management', 'Strategic Thinking'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The decision context and information gaps',
          task: 'The importance and urgency of making the decision',
          action: 'Your decision-making process and risk mitigation',
          result: 'The outcome and lessons learned about decision-making'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'How do you prioritize your work when everything seems urgent?',
        tags: ['Prioritization', 'Time Management', 'Strategic Focus'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A time when you faced competing urgent priorities',
          task: 'The challenge of determining what truly mattered most',
          action: 'Your framework for prioritization and stakeholder communication',
          result: 'How your approach led to successful outcomes'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Tell me about a time when you identified and drove a process improvement.',
        tags: ['Process Improvement', 'Innovation', 'Change Management'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The inefficient process you identified',
          task: 'Your role in recognizing and addressing the problem',
          action: 'How you developed and implemented the improvement',
          result: 'Measurable impact and adoption across the organization'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Describe a time when you had to manage a underperforming team member.',
        tags: ['Performance Management', 'Leadership', 'Team Development'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The performance issues and their impact',
          task: 'Your responsibility to address and improve performance',
          action: 'Your approach to coaching, support, and accountability',
          result: 'Performance improvement or appropriate resolution'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Tell me about a time when you had to make an unpopular decision.',
        tags: ['Difficult Decisions', 'Leadership', 'Change Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The decision context and why it was necessary but unpopular',
          task: 'Your leadership responsibility despite potential resistance',
          action: 'How you communicated and implemented the decision',
          result: 'Outcome and how you managed team relationships'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'How do you approach setting and communicating goals for your team?',
        tags: ['Goal Setting', 'Team Management', 'Communication'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A specific goal-setting situation with your team',
          task: 'Ensuring clear expectations and team alignment',
          action: 'Your process for setting, communicating, and tracking goals',
          result: 'Team performance and goal achievement'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Describe a situation where you had to navigate organizational politics to achieve your objectives.',
        tags: ['Organizational Navigation', 'Influence', 'Strategic Thinking'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The political landscape and obstacles you faced',
          task: 'Your objectives and the need to navigate carefully',
          action: 'How you built alliances and managed relationships',
          result: 'Successful achievement of objectives and maintained relationships'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Tell me about a time when you had to adapt your leadership style for different team members.',
        tags: ['Adaptive Leadership', 'Individual Management', 'Team Dynamics'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Team members with different needs and working styles',
          task: 'Providing effective leadership to each individual',
          action: 'How you adapted your approach for different personalities',
          result: 'Individual and team performance improvements'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'How do you stay informed about industry trends and their potential impact on your business?',
        tags: ['Strategic Awareness', 'Industry Knowledge', 'Business Acumen'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A significant industry trend or change you identified',
          task: 'Understanding its implications for your business',
          action: 'How you researched and analyzed the trend',
          result: 'Strategic decisions or preparations made based on this knowledge'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Describe a time when you had to manage competing deadlines and resource constraints.',
        tags: ['Resource Management', 'Prioritization', 'Project Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The competing demands and limited resources',
          task: 'Your responsibility to deliver on multiple fronts',
          action: 'How you prioritized, allocated resources, and managed expectations',
          result: 'Successful delivery and stakeholder satisfaction'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Tell me about a time when you had to build a business case for a new initiative.',
        tags: ['Business Case Development', 'Strategic Planning', 'Influence'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The opportunity or need for the new initiative',
          task: 'Building compelling justification for investment',
          action: 'How you researched, analyzed, and presented the case',
          result: 'Decision outcome and implementation success'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'How do you approach developing and mentoring high-potential team members?',
        tags: ['Talent Development', 'Mentoring', 'Succession Planning'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A high-potential team member you developed',
          task: 'Accelerating their growth and development',
          action: 'Specific mentoring and development activities you provided',
          result: 'Their career progression and impact on the organization'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'Describe a time when you had to turn around a failing project or initiative.',
        tags: ['Turnaround Management', 'Problem Solving', 'Leadership'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The failing project and its critical issues',
          task: 'Your responsibility to salvage or redirect the initiative',
          action: 'Your turnaround strategy and implementation',
          result: 'Project recovery and lessons learned'
        } as STARGuidance
      },
      {
        type: 'hiring-manager',
        question: 'How do you ensure your team maintains high performance during periods of uncertainty?',
        tags: ['Change Leadership', 'Team Resilience', 'Performance Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A period of significant uncertainty affecting your team',
          task: 'Maintaining team morale and productivity',
          action: 'Specific strategies you used to support and motivate the team',
          result: 'Team performance and successful navigation through uncertainty'
        } as STARGuidance
      }
    ];

    // Import comprehensive industry-specific technical questions
    const { industryTechnicalQuestions } = await import('./industryQuestions.js');
    const subjectMatterExpertiseQuestions: InsertQuestion[] = industryTechnicalQuestions;

    // Legacy subject-matter questions - remove old category-based approach
    const legacySubjectMatterQuestions: InsertQuestion[] = [
      {
        type: 'subject-matter-expertise',
        question: 'Walk me through your approach to solving a complex technical problem from start to finish.',
        tags: ['Problem Solving', 'Technical Analysis', 'Methodology'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A specific complex technical challenge you faced',
          task: 'Your responsibility for finding the solution',
          action: 'Your systematic approach and technical techniques used',
          result: 'The solution\'s effectiveness and broader technical impact'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Describe a time when you had to learn a new technology quickly to meet project requirements.',
        tags: ['Learning Agility', 'Technology Adoption', 'Self-Development'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'The project need and unfamiliar technology involved',
          task: 'The timeline and depth of knowledge required',
          action: 'Your learning strategy and knowledge acquisition process',
          result: 'How quickly you became productive and project success'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Tell me about a time when you had to debug a critical system failure.',
        tags: ['Debugging', 'System Analysis', 'Incident Response'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The system failure and its business impact',
          task: 'Your role in the incident response and investigation',
          action: 'Your debugging methodology and tools used',
          result: 'Resolution time and measures taken to prevent recurrence'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'How do you ensure code quality and maintainability in your projects?',
        tags: ['Code Quality', 'Best Practices', 'Technical Standards'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A project where code quality was particularly important',
          task: 'Your responsibility for maintaining high standards',
          action: 'Specific practices, tools, and processes you implemented',
          result: 'Long-term benefits and impact on team productivity'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Describe a time when you had to optimize system performance or scalability.',
        tags: ['Performance Optimization', 'Scalability', 'System Design'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The performance bottleneck or scalability challenge',
          task: 'Your role in identifying and addressing the issue',
          action: 'Specific optimization techniques and architectural changes',
          result: 'Performance improvements and system scalability gains'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Tell me about a time when you had to integrate multiple systems or APIs.',
        tags: ['System Integration', 'API Design', 'Technical Architecture'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The integration requirements and system complexity',
          task: 'Your responsibility for seamless system communication',
          action: 'Integration approach, protocols, and error handling',
          result: 'Successful integration and improved system functionality'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'How do you approach technical documentation and knowledge sharing?',
        tags: ['Documentation', 'Knowledge Management', 'Team Collaboration'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A complex system that needed comprehensive documentation',
          task: 'Ensuring knowledge transfer and team understanding',
          action: 'Documentation strategy and knowledge sharing practices',
          result: 'Improved team productivity and reduced onboarding time'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Describe your experience with database design and optimization.',
        tags: ['Database Design', 'Query Optimization', 'Data Architecture'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A database performance or design challenge you faced',
          task: 'Your role in database architecture and optimization',
          action: 'Specific design principles and optimization techniques used',
          result: 'Improved database performance and data integrity'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Tell me about a time when you had to implement security best practices.',
        tags: ['Security', 'Best Practices', 'Risk Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'Security requirements or vulnerabilities you addressed',
          task: 'Your responsibility for system security',
          action: 'Security measures, protocols, and monitoring implemented',
          result: 'Enhanced security posture and risk mitigation'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'How do you stay current with emerging technologies and decide which ones to adopt?',
        tags: ['Technology Evaluation', 'Innovation', 'Technical Strategy'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'An emerging technology you evaluated for adoption',
          task: 'Assessing technology fit and making adoption decisions',
          action: 'Evaluation criteria and pilot implementation approach',
          result: 'Technology adoption outcome and business impact'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Describe a time when you had to refactor legacy code or systems.',
        tags: ['Legacy Systems', 'Code Refactoring', 'Technical Debt'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The legacy system and its limitations',
          task: 'Your responsibility for modernization and improvement',
          action: 'Refactoring strategy and risk mitigation approach',
          result: 'Improved maintainability and reduced technical debt'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'How do you approach testing strategies and quality assurance?',
        tags: ['Testing Strategy', 'Quality Assurance', 'Test Automation'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A project with critical quality requirements',
          task: 'Ensuring comprehensive testing and quality assurance',
          action: 'Testing framework, automation, and quality processes',
          result: 'Reduced defects and improved software reliability'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Tell me about your experience with cloud platforms and DevOps practices.',
        tags: ['Cloud Computing', 'DevOps', 'Infrastructure'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A cloud migration or DevOps implementation project',
          task: 'Your role in cloud adoption and process automation',
          action: 'Cloud architecture decisions and DevOps pipeline implementation',
          result: 'Improved deployment efficiency and system reliability'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'Describe a complex technical problem you solved that others struggled with.',
        tags: ['Problem Solving', 'Technical Expertise', 'Innovation'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The complex problem and why others struggled with it',
          task: 'Your unique approach to understanding and solving the issue',
          action: 'Specific techniques, tools, and methodologies you applied',
          result: 'Successful solution and knowledge transfer to team'
        } as STARGuidance
      },
      {
        type: 'subject-matter-expertise',
        question: 'How do you balance technical excellence with business requirements and deadlines?',
        tags: ['Technical Strategy', 'Business Alignment', 'Prioritization'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A project with competing technical and business pressures',
          task: 'Balancing quality, functionality, and timeline constraints',
          action: 'Your approach to technical trade-offs and stakeholder communication',
          result: 'Successful delivery meeting both technical and business needs'
        } as STARGuidance
      }
    ];

    // Stage 5: Executive/Final Round
    const executiveFinalQuestions: InsertQuestion[] = [
      {
        type: 'executive-final',
        question: 'How do you see yourself contributing to our company\'s long-term strategic goals?',
        tags: ['Strategic Vision', 'Company Alignment', 'Long-term Impact'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'Your understanding of the company\'s strategic direction',
          task: 'Identifying where you can make the most significant impact',
          action: 'Specific contributions and initiatives you would drive',
          result: 'Expected outcomes and value creation for the organization'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Describe a time when you influenced a major business decision or change.',
        tags: ['Business Impact', 'Influence', 'Strategic Thinking'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The business context and decision point',
          task: 'Your role in shaping the decision or change',
          action: 'How you built consensus and drove the initiative',
          result: 'Business impact and lessons learned about organizational influence'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'What questions do you have about our company culture and leadership philosophy?',
        tags: ['Cultural Alignment', 'Leadership Style', 'Mutual Fit'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Your observations about the company culture so far',
          task: 'Understanding how you\'ll thrive in this environment',
          action: 'Thoughtful questions that demonstrate cultural awareness',
          result: 'How the answers will influence your commitment and approach'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Where do you see your career in the next 3-5 years, and how does this role fit?',
        tags: ['Career Vision', 'Growth Planning', 'Mutual Investment'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'Your current career trajectory and aspirations',
          task: 'Aligning personal growth with organizational needs',
          action: 'How this role accelerates your development',
          result: 'Mutual benefits and long-term value creation'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'How do you approach building and maintaining relationships with key stakeholders?',
        tags: ['Stakeholder Management', 'Relationship Building', 'Executive Presence'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A critical stakeholder relationship you developed',
          task: 'Building trust and alignment with senior stakeholders',
          action: 'Your strategy for engagement and value demonstration',
          result: 'Strong partnership and business outcomes achieved'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Tell me about a time when you had to drive organizational change.',
        tags: ['Change Leadership', 'Organizational Impact', 'Strategic Execution'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The organizational change initiative and its scope',
          task: 'Your leadership role in driving transformation',
          action: 'Change management strategy and stakeholder engagement',
          result: 'Successful transformation and lasting organizational impact'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'How do you measure success and what metrics matter most to you?',
        tags: ['Success Metrics', 'Performance Measurement', 'Business Impact'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A role where you defined success metrics',
          task: 'Establishing meaningful and actionable KPIs',
          action: 'Metrics framework and tracking methodology you implemented',
          result: 'Improved performance visibility and goal achievement'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Describe your approach to building high-performing teams and culture.',
        tags: ['Team Building', 'Culture Development', 'Leadership'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A team or culture transformation you led',
          task: 'Creating an environment for exceptional performance',
          action: 'Specific initiatives and practices you implemented',
          result: 'Team performance improvements and cultural transformation'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Tell me about a time when you had to make a decision with significant business impact.',
        tags: ['Strategic Decision Making', 'Business Impact', 'Executive Judgment'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The business context and decision complexity',
          task: 'Your responsibility for high-stakes decision making',
          action: 'Decision framework and stakeholder consultation process',
          result: 'Business impact and lessons learned from the outcome'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'How do you balance short-term pressures with long-term strategic objectives?',
        tags: ['Strategic Balance', 'Long-term Thinking', 'Pressure Management'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A time when short-term and long-term goals conflicted',
          task: 'Balancing immediate needs with strategic vision',
          action: 'Your approach to prioritization and stakeholder communication',
          result: 'Successful balance and achievement of both objectives'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'What is your philosophy on risk-taking and innovation?',
        tags: ['Risk Management', 'Innovation Strategy', 'Strategic Thinking'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'An innovative initiative with inherent risks you championed',
          task: 'Balancing innovation potential with risk management',
          action: 'Your framework for evaluating and managing innovation risks',
          result: 'Innovation success and risk mitigation achievements'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'How do you ensure your decisions align with company values and ethics?',
        tags: ['Values Alignment', 'Ethical Leadership', 'Integrity'],
        difficulty: 'medium',
        starGuidance: {
          situation: 'A decision where values and ethics were particularly important',
          task: 'Ensuring alignment with organizational principles',
          action: 'Your process for values-based decision making',
          result: 'Outcome that reinforced company culture and values'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Describe your experience with budget management and resource allocation.',
        tags: ['Financial Management', 'Resource Allocation', 'Strategic Planning'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'A significant budget or resource allocation challenge',
          task: 'Your responsibility for financial stewardship',
          action: 'Budget planning, allocation strategy, and performance tracking',
          result: 'Financial outcomes and resource optimization achievements'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'Tell me about your experience with crisis management or handling unexpected challenges.',
        tags: ['Crisis Management', 'Problem Solving', 'Leadership Under Pressure'],
        difficulty: 'hard',
        starGuidance: {
          situation: 'The crisis or unexpected challenge you faced',
          task: 'Your leadership responsibility during the crisis',
          action: 'Crisis response strategy and team coordination',
          result: 'Crisis resolution and organizational learning outcomes'
        } as STARGuidance
      },
      {
        type: 'executive-final',
        question: 'What questions do you have about our leadership team and company direction?',
        tags: ['Leadership Alignment', 'Strategic Understanding', 'Mutual Fit'],
        difficulty: 'easy',
        starGuidance: {
          situation: 'Your research and understanding of the company leadership',
          task: 'Demonstrating strategic interest and cultural alignment',
          action: 'Thoughtful questions about leadership philosophy and direction',
          result: 'How the answers will influence your approach and commitment'
        } as STARGuidance
      }
    ];

    // Seed all question types
    await this.seedQuestionsToDatabase([
      ...phoneScreeningQuestions,
      ...functionalTeamQuestions, 
      ...hiringManagerQuestions,
      ...subjectMatterExpertiseQuestions, 
      ...executiveFinalQuestions
    ]);
  }

  private async seedQuestionsToDatabase(questionList: InsertQuestion[]) {
    try {
      // Check if we already have a full question set (more than just basic seeding)
      const existingQuestions = await db.select().from(questions);
      const subjectMatterCount = existingQuestions.filter(q => q.type === 'subject-matter-expertise').length;
      
      // Only re-seed if we have less than 750 subject-matter-expertise questions
      // This preserves the expanded industry question set
      if (subjectMatterCount < 750) {
        console.log(`Attempting to seed ${questionList.length} questions...`);
        
        // Only clear and re-insert if we don't have the full expanded set
        await db.delete(questions);
        await db.insert(questions).values(questionList);
        console.log(`Successfully seeded ${questionList.length} questions to database`);
        
        // Verify seeding worked
        const verifyQuestions = await db.select().from(questions);
        console.log(`Database now contains ${verifyQuestions.length} total questions`);
      } else {
        console.log(`Database already contains ${existingQuestions.length} questions, skipping re-seed`);
      }
      
    } catch (error) {
      console.log('Question seeding error:', error);
      console.log('Error details:', error);
    }
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    
    if (!session) throw new Error('Session not found');
    return session;
  }

  async getQuestionsByType(type: InterviewType, industry?: string): Promise<Question[]> {
    await this.ensureSeeded();
    
    if (type === 'subject-matter-expertise' && industry) {
      // Filter by specific industry for technical questions and include WGLL content
      const industryQuestions = await db.select({
        id: questions.id,
        type: questions.type,
        question: questions.question,
        tags: questions.tags,
        difficulty: questions.difficulty,
        starGuidance: questions.starGuidance,
        industry: questions.industry,
        wgll_content: {
          model_answer: wgllContent.modelAnswer,
          expert_tips: wgllContent.expertTips,
          performance_metrics: wgllContent.performanceMetrics
        }
      })
      .from(questions)
      .leftJoin(wgllContent, eq(questions.id, wgllContent.questionId))
      .where(and(eq(questions.type, type), eq(questions.industry, industry)));
      
      // If no industry-specific questions found, fall back to all subject-matter-expertise questions
      if (industryQuestions.length === 0) {
        console.log(`No questions found for industry ${industry}, falling back to all subject-matter-expertise questions`);
        return await db.select().from(questions).where(eq(questions.type, type));
      }
      
      return industryQuestions;
    }
    
    // For other interview types, get questions without WGLL content
    return await db.select().from(questions).where(eq(questions.type, type));
  }

  async getTechnicalIndustries(): Promise<{ id: string; name: string; description: string; questionCount: number }[]> {
    // Get industries from database dynamically
    const industriesData = await db.select({
      industry: questions.industry,
      count: sql<number>`count(*)::int`
    })
    .from(questions)
    .where(eq(questions.type, 'subject-matter-expertise'))
    .groupBy(questions.industry)
    .having(sql`count(*) > 0`);

    // Map database industries to frontend format with proper descriptions
    const industryMap: Record<string, string> = {
      'software-development': 'Data structures, algorithms, system design, Agile/Scrum methodologies',
      'information-technology': 'System administration, network management, IT infrastructure, technical support',
      'data-science-analytics': 'Machine learning, statistical methods, data manipulation, Python/R/SQL',
      'cybersecurity': 'Network security protocols, penetration testing, risk assessment, OWASP',
      'aerospace-defense': 'Aerodynamics, propulsion systems, defence systems, flight dynamics',
      'automotive': 'Vehicle dynamics, engine systems, material science, manufacturing processes',
      'banking-finance': 'Financial modelling, valuation methods, market analysis, regulatory compliance',
      'financial-services': 'Investment strategies, portfolio management, risk assessment, financial analysis',
      'biotechnology': 'Molecular biology, genetics, biochemistry, bioinformatics tools',
      'pharmaceuticals-biotech': 'Drug development, clinical trials, regulatory affairs, quality control',
      'chemical-petrochemical': 'Chemical kinetics, thermodynamics, fluid dynamics, process control',
      'petrochemicals': 'Process engineering, distillation, chemical reactions, plant operations',
      'construction': 'Project management, construction materials, blueprint reading, safety regulations',
      'construction-engineering': 'Structural design, civil engineering, project management, building codes',
      'architecture-design': 'Building design, architectural software, construction principles, zoning laws',
      'education': 'Curriculum development, educational technology, learning systems, assessment methods',
      'education-training': 'Training methodologies, instructional design, e-learning platforms, competency frameworks',
      'electronics': 'Circuit design, microprocessors, electronic components, testing equipment',
      'energy-utilities': 'Power generation, grid management, renewable energy, utility operations',
      'utilities': 'Infrastructure management, service delivery, regulatory compliance, customer service',
      'oil-gas-energy': 'Petroleum engineering, reservoir management, drilling operations, energy markets',
      'entertainment': 'Content production, media management, audience engagement, entertainment technology',
      'media-entertainment': 'Broadcasting, digital media, content creation, audience analytics',
      'environmental-sustainability': 'Environmental regulations, sustainability practices, impact assessment, green technology',
      'food-beverage': 'Food science, quality assurance, supply chain logistics, processing equipment',
      'government-public-administration': 'Policy analysis, public service delivery, regulatory compliance, civic engagement',
      'healthcare-medical': 'Medical procedures, patient care, healthcare systems, medical technology',
      'hospitality-tourism': 'Service management, customer experience, revenue optimization, hospitality technology',
      'manufacturing': 'Production processes, quality control, lean manufacturing, automation systems',
      'non-profit-social-services': 'Program management, community outreach, fundraising, social impact measurement',
      'professional-services': 'Client management, service delivery, business consulting, project management',
      'telecommunications': 'Network infrastructure, communication protocols, wireless technology, service delivery',
      'transportation': 'Logistics management, fleet operations, transportation planning, safety compliance',
      'agriculture': 'Crop science, farming technology, agricultural management, sustainability practices',
      'advertising-marketing': 'Campaign development, market research, digital marketing, brand management',
      'human-computer-interaction': 'User experience design, usability testing, interface design, user research',
      'industrial-design': 'Product design, manufacturing processes, materials engineering, design thinking',
      'legal-services': 'Legal research, case management, regulatory compliance, legal technology',
      'logistics-supply-chain': 'Supply chain optimization, inventory management, distribution, logistics technology',
      'machinery': 'Equipment design, manufacturing processes, maintenance systems, industrial automation',
      'mining-metals': 'Mining operations, metallurgy, mineral processing, safety management',
      'music': 'Music production, audio engineering, performance, music business',
      'public-relations': 'Communications strategy, media relations, reputation management, crisis communication',
      'real-estate': 'Property management, market analysis, real estate finance, development processes',
      'retail': 'Retail operations, customer service, inventory management, sales strategies'
    };

    return industriesData
      .filter(item => item.industry) // Filter out null industries
      .map(item => ({
        id: item.industry!,
        name: item.industry!.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: industryMap[item.industry!] || 'Professional technical questions for this industry',
        questionCount: item.count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async getResponsesBySession(sessionId: string): Promise<Response[]> {
    return await db.select().from(responses).where(eq(responses.sessionId, sessionId));
  }

  async getResponseById(id: string): Promise<Response | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response || undefined;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
      .insert(responses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async updateResponse(id: string, updates: Partial<Response>): Promise<Response> {
    const [response] = await db
      .update(responses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(responses.id, id))
      .returning();
    
    if (!response) throw new Error('Response not found');
    return response;
  }

  async getWgllContent(questionId: string): Promise<WgllContent | undefined> {
    const [content] = await db.select().from(wgllContent).where(eq(wgllContent.questionId, questionId));
    return content || undefined;
  }

  async createWgllContent(insertWgllContent: InsertWgllContent): Promise<WgllContent> {
    const [content] = await db
      .insert(wgllContent)
      .values(insertWgllContent)
      .returning();
    return content;
  }

  async getJobDescription(id: string): Promise<JobDescription | undefined> {
    const [jobDescription] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id));
    return jobDescription || undefined;
  }

  async getJobDescriptionsByUser(userId: string): Promise<JobDescription[]> {
    return await db.select().from(jobDescriptions).where(eq(jobDescriptions.userId, userId));
  }

  async createJobDescription(insertJobDescription: InsertJobDescription): Promise<JobDescription> {
    const [jobDescription] = await db
      .insert(jobDescriptions)
      .values(insertJobDescription)
      .returning();
    return jobDescription;
  }

  async updateJobDescription(id: string, updates: Partial<JobDescription>): Promise<JobDescription> {
    const [jobDescription] = await db
      .update(jobDescriptions)
      .set({ ...updates, uploadedAt: new Date() })
      .where(eq(jobDescriptions.id, id))
      .returning();
    
    if (!jobDescription) throw new Error('Job description not found');
    return jobDescription;
  }

  async deleteJobDescription(id: string): Promise<void> {
    await db.delete(jobDescriptions).where(eq(jobDescriptions.id, id));
  }
}

export const storage = new DatabaseStorage();
