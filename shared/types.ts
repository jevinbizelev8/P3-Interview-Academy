// Interface definitions for AI services

export interface InterviewerPersona {
  name: string;
  title: string;
  style: string;
  personality: string;
}

export interface InterviewContext {
  stage: string;
  jobRole: string;
  company: string;
  candidateBackground: string;
  keyObjectives: string;
  userJobPosition?: string;
  userCompanyName?: string;
}

export interface AIResponse {
  content: string;
  questionNumber?: number;
  feedback?: string;
}

export interface STARAssessment {
  situation: number;
  task: number;
  action: number;
  result: number;
  flow: number;
  overall: number;
  qualitative: string;
  strengths: string[];
  improvements: string[];
}