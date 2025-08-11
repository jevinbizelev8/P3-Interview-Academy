import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface InterviewerPersona {
  name: string;
  title: string;
  style: string;
  personality: string;
}

interface InterviewContext {
  stage: string;
  jobRole: string;
  company: string;
  candidateBackground: string;
  keyObjectives: string;
  userJobPosition?: string;
  userCompanyName?: string;
}

interface AIResponse {
  content: string;
  questionNumber?: number;
  feedback?: string;
}

interface STARAssessment {
  situation: number;
  task: number;
  action: number;
  result: number;
  flow: number;
  overall: number;
  qualitative: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

class BedrockService {
  private client: BedrockRuntimeClient;
  private maxRetries: number = 5;
  private baseDelay: number = 1000; // 1 second
  private maxDelay: number = 60000; // 1 minute
  private modelId: string = "anthropic.claude-3-5-sonnet-20241022-v2:0"; // Latest Claude model on Bedrock

  constructor() {
    // Check for required AWS credentials
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
      this.client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      console.warn("AWS credentials not provided. AI features will use mock responses until credentials are configured.");
      this.client = null as any; // Will use mock responses
    }
  }

  private async makeRequest(messages: any[], systemPrompt?: string, maxTokens: number = 1024): Promise<any> {
    // If no AWS client is configured, return mock response
    if (!this.client) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return {
        content: [{ text: "Mock AI response. Please configure AWS Bedrock credentials to enable real AI interactions." }]
      };
    }

    // Convert messages to Claude format
    const claudeMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      messages: claudeMessages,
      ...(systemPrompt && { system: systemPrompt }),
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const command = new InvokeModelCommand({
          modelId: this.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(requestBody),
        });

        const response = await this.client.send(command);
        
        if (!response.body) {
          throw new Error("No response body from Bedrock");
        }

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody;
      } catch (error: any) {
        // Handle throttling
        if (error.name === 'ThrottlingException' || error.message?.includes('throttl')) {
          const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
          const jitter = Math.random() * 1000; // Add up to 1 second of jitter
          
          console.log(`AWS Bedrock throttling detected. Retrying in ${delay + jitter}ms (attempt ${attempt}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          continue;
        }

        if (attempt === this.maxRetries) {
          console.error(`Failed to make Bedrock request after ${this.maxRetries} attempts:`, error);
          throw new Error(`Bedrock API failed after ${this.maxRetries} retries: ${error.message}`);
        }

        // Retry on network errors or retryable service errors
        if (error.name === 'NetworkingError' || error.name === 'ServiceException' || 
            error.name === 'InternalServerException' || error.name === 'ModelTimeoutException') {
          const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
          const jitter = Math.random() * 1000;
          
          console.log(`Retryable error. Retrying in ${delay + jitter}ms (attempt ${attempt}/${this.maxRetries}): ${error.name}`);
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          continue;
        }

        // Don't retry on client errors
        throw error;
      }
    }
  }

  async generateInterviewerPersona(context: InterviewContext): Promise<InterviewerPersona> {
    const systemPrompt = `You are an AI that dynamically generates realistic interviewer personas for job interview practice based on the specific role and company provided. 
    Create a completely unique interviewer persona that matches the actual job position and company culture.`;

    const actualJobRole = context.userJobPosition || context.jobRole;
    const actualCompany = context.userCompanyName || context.company;

    const messages = [{
      role: "user",
      content: `Generate a completely dynamic interviewer persona for:
        - Interview Stage: ${context.stage}
        - Target Role: ${actualJobRole}
        - Target Company: ${actualCompany}
        
        ${context.userJobPosition && context.userCompanyName ? 
          `CRITICAL: This is for a real ${context.userJobPosition} position at ${context.userCompanyName}. 
           Generate a persona that would realistically conduct this interview:
           - Name should fit the company culture
           - Title should be someone who would interview for this role (e.g., Engineering Manager, Director of AI, etc.)
           - Style should match the company's interview culture
           - Personality should reflect the company values and role requirements
           
           For ${context.userCompanyName}, consider their known culture, values, and interview practices.
           For ${context.userJobPosition}, consider the technical depth and soft skills needed.` :
          'Create a generic but professional interviewer persona.'
        }
        
        Return ONLY a JSON object with these exact fields:
        - name: A realistic first and last name
        - title: Their job title/position 
        - style: Their interviewing style
        - personality: Key personality traits
        
        Make this persona completely unique and specific to the role and company.`
    }];

    try {
      const response = await this.makeRequest(messages, systemPrompt, 500);
      const content = response.content[0].text;
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const persona = JSON.parse(jsonMatch[0]);
        return persona;
      }
      
      // Dynamic fallback based on context
      const actualJobRole = context.userJobPosition || context.jobRole;
      const actualCompany = context.userCompanyName || context.company;
      
      if (actualJobRole.toLowerCase().includes('ai') || actualJobRole.toLowerCase().includes('ml')) {
        if (actualCompany.toLowerCase() === 'meta') {
          return {
            name: "Sarah Chen",
            title: "AI Engineering Director",
            style: "technical and innovation-focused",
            personality: "cutting-edge, collaborative, Meta culture-driven"
          };
        } else {
          return {
            name: "Michael Rodriguez",
            title: "ML Engineering Manager",
            style: "technical and research-oriented",
            personality: "analytical, innovative, mentoring"
          };
        }
      } else if (actualJobRole.toLowerCase().includes('engineer')) {
        return {
          name: "David Kim",
          title: "Senior Engineering Manager",
          style: "technical and methodical",
          personality: "problem-solving focused, detail-oriented, supportive"
        };
      } else {
        return {
          name: "Sarah Johnson",
          title: "Senior Hiring Manager",
          style: "conversational and thorough",
          personality: "analytical, patient, encouraging"
        };
      }
    } catch (error) {
      console.error("Error generating interviewer persona:", error);
      // Dynamic fallback based on context
      const actualJobRole = context.userJobPosition || context.jobRole;
      const actualCompany = context.userCompanyName || context.company;
      
      if (actualJobRole.toLowerCase().includes('ai') || actualJobRole.toLowerCase().includes('ml')) {
        if (actualCompany.toLowerCase() === 'meta') {
          return {
            name: "Elena Patel",
            title: "AI Research Director",
            style: "technical and visionary",
            personality: "innovative, Meta-focused, research-oriented"
          };
        } else {
          return {
            name: "James Liu",
            title: "AI Engineering Lead",
            style: "technical and collaborative",
            personality: "cutting-edge, analytical, mentoring"
          };
        }
      } else {
        return {
          name: "Alex Thompson",
          title: "Senior Manager",
          style: "professional and structured",
          personality: "experienced, analytical, supportive"
        };
      }
    }
  }

  async generateFirstQuestion(
    context: InterviewContext,
    persona: InterviewerPersona
  ): Promise<AIResponse> {
    const systemPrompt = `You are ${persona.name}, a ${persona.title}. Your interviewing style is ${persona.style} and you are ${persona.personality}.

    ${context.userJobPosition && context.userCompanyName ? 
      `You are conducting a ${context.stage} interview for a ${context.userJobPosition} position at ${context.userCompanyName}. 
       
       IMPORTANT: Focus entirely on ${context.userJobPosition} role requirements and ${context.userCompanyName} company culture. 
       Ask questions specific to AI engineering, machine learning, technical architecture, and Meta's engineering practices.
       Ignore any generic scenario details and tailor everything for this specific role and company.` :
      context.userJobPosition ? 
        `You are conducting a ${context.stage} interview for a ${context.userJobPosition} position. 
         IMPORTANT: Focus on questions specific to the ${context.userJobPosition} role, ignoring generic scenario details.` :
        context.userCompanyName ?
          `You are conducting a ${context.stage} interview at ${context.userCompanyName}. 
           IMPORTANT: Focus on ${context.userCompanyName} company culture and values, ignoring generic scenario details.` :
          `You are conducting a ${context.stage} interview for a ${context.jobRole} position at ${context.company}.`
    }
    
    ${context.userJobPosition || context.userCompanyName ? 
      `DYNAMIC QUESTION GENERATION: 
       - Generate a completely fresh, unique opening question tailored specifically for ${context.userJobPosition || 'this role'} ${context.userCompanyName ? `at ${context.userCompanyName}` : ''}.
       - Consider the specific technical skills, experience, and challenges relevant to this exact position.
       - Make it feel like a real interview that this candidate would actually experience.
       - Avoid generic questions - be specific to the role and company context.` :
      `Candidate background: ${context.candidateBackground}
       Key objectives for this interview: ${context.keyObjectives}`
    }
    
    Start the interview with an appropriate opening question. Be natural and conversational, matching your persona.
    Keep responses focused and professional. This is question #1 of 15.`;

    const messages = [{
      role: "user",
      content: "Please start the interview with your first question."
    }];

    try {
      const response = await this.makeRequest(messages, systemPrompt, 500);
      return {
        content: response.content[0].text,
        questionNumber: 1
      };
    } catch (error) {
      console.error("Error generating first question:", error);
      // Dynamic fallback based on context
      const actualJobRole = context.userJobPosition || context.jobRole;
      const actualCompany = context.userCompanyName || context.company;
      
      if (actualJobRole.toLowerCase().includes('ai') || actualJobRole.toLowerCase().includes('ml')) {
        if (actualCompany.toLowerCase() === 'meta') {
          return {
            content: "Thanks for joining me today. I'm excited to learn about your AI engineering background. Let's start with this: What specific areas of machine learning or AI have you been working on recently, and how do you see them applying to Meta's mission of building the next generation of social technology?",
            questionNumber: 1
          };
        } else {
          return {
            content: "Thank you for your time today. Given your interest in an AI engineering role, I'd love to start by understanding your approach to machine learning problems. Can you walk me through a recent AI/ML project you worked on and the technical challenges you encountered?",
            questionNumber: 1
          };
        }
      } else {
        return {
          content: "Thank you for joining me today. Let's start with a simple question: Can you tell me a bit about yourself and what interests you about this role?",
          questionNumber: 1
        };
      }
    }
  }

  async generateFollowUpQuestion(
    context: InterviewContext,
    persona: InterviewerPersona,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
    currentQuestionNumber: number
  ): Promise<AIResponse> {
    const systemPrompt = `You are ${persona.name}, a ${persona.title}. Your interviewing style is ${persona.style} and you are ${persona.personality}.

    ${context.userJobPosition && context.userCompanyName ? 
      `You are conducting a ${context.stage} interview for a ${context.userJobPosition} position at ${context.userCompanyName}. 
       
       IMPORTANT: Focus entirely on ${context.userJobPosition} role requirements and ${context.userCompanyName} company culture. 
       Ask technical questions about AI/ML, system design, coding challenges, and Meta's engineering practices.
       Ignore any generic scenario details - this is specifically for ${context.userJobPosition} at ${context.userCompanyName}.` :
      context.userJobPosition ? 
        `You are conducting a ${context.stage} interview for a ${context.userJobPosition} position. 
         IMPORTANT: Focus on questions specific to the ${context.userJobPosition} role requirements and responsibilities.` :
        context.userCompanyName ?
          `You are conducting a ${context.stage} interview at ${context.userCompanyName}. 
           IMPORTANT: Focus on ${context.userCompanyName} company-specific questions and culture.` :
          `You are conducting a ${context.stage} interview for a ${context.jobRole} position at ${context.company}.`
    }
    
    This is question #${currentQuestionNumber + 1} of 15. Based on the conversation so far, ask a relevant follow-up question.
    ${context.userJobPosition || context.userCompanyName ? 
      `DYNAMIC FOLLOW-UP GENERATION:
       - Analyze the candidate's previous responses to understand their experience level and areas of strength/weakness
       - Generate a completely unique follow-up question that builds on their previous answers
       - Focus on ${context.userJobPosition || 'this role'} specific challenges ${context.userCompanyName ? `at ${context.userCompanyName}` : ''}
       - Progress naturally from basic to more complex topics
       - Consider real-world scenarios this person would face in the actual job
       - Make each question feel authentic and purposeful, not generic` :
      'Keep the interview flowing naturally while covering important topics for this role and interview stage.'
    }
    
    Be conversational and match your persona. Don't repeat previous questions.`;

    const messages = conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    try {
      const response = await this.makeRequest(messages, systemPrompt, 500);
      return {
        content: response.content[0].text,
        questionNumber: currentQuestionNumber + 1
      };
    } catch (error) {
      console.error("Error generating follow-up question:", error);
      return {
        content: "That's interesting. Can you tell me more about a specific situation where you demonstrated that skill?",
        questionNumber: currentQuestionNumber + 1
      };
    }
  }

  async generateSTARAssessment(
    context: InterviewContext,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>
  ): Promise<STARAssessment> {
    const systemPrompt = `You are an expert interview assessor. Analyze this interview conversation and provide a detailed STAR-based assessment.

    Rate each component on a scale of 1-10:
    - Situation: How well did the candidate set up contexts and scenarios?
    - Task: How clearly did they explain their responsibilities and objectives?
    - Action: How well did they describe their specific actions and decisions?
    - Result: How effectively did they communicate outcomes and impact?
    - Flow: How well did they structure and connect their responses?
    
    Also provide an overall score (1-10) and detailed qualitative feedback.
    
    Interview context:
    - Position: ${context.jobRole}
    - Interview Stage: ${context.stage}
    - Company: ${context.company}`;

    const messages = [{
      role: "user",
      content: `Please analyze this interview conversation and provide a STAR assessment:

${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Return a JSON object with these exact fields:
- situation: number (1-10)
- task: number (1-10)  
- action: number (1-10)
- result: number (1-10)
- flow: number (1-10)
- overall: number (1-10)
- qualitative: string (detailed feedback)
- strengths: array of strings (3-5 key strengths)
- improvements: array of strings (3-5 areas for improvement)
- recommendations: array of strings (3-5 specific recommendations)`
    }];

    try {
      const response = await this.makeRequest(messages, systemPrompt, 1500);
      const content = response.content[0].text;
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const assessment = JSON.parse(jsonMatch[0]);
        return assessment;
      }
      
      // Fallback assessment
      return {
        situation: 6,
        task: 6,
        action: 6,
        result: 6,
        flow: 6,
        overall: 6,
        qualitative: "The interview showed good effort, but there are opportunities to improve structure and detail in responses.",
        strengths: ["Engaged communication", "Relevant experience", "Professional demeanor"],
        improvements: ["More specific examples", "Better structure using STAR method", "Quantify results"],
        recommendations: ["Practice STAR method", "Prepare specific examples", "Focus on measurable outcomes"]
      };
    } catch (error) {
      console.error("Error generating STAR assessment:", error);
      // Return default assessment
      return {
        situation: 5,
        task: 5,
        action: 5,
        result: 5,
        flow: 5,
        overall: 5,
        qualitative: "Assessment could not be completed. Please review the interview manually.",
        strengths: ["Participated in interview"],
        improvements: ["Technical error occurred during assessment"],
        recommendations: ["Retry assessment or seek manual review"]
      };
    }
  }

  async generateQuickFeedback(response: string, questionContext: string): Promise<string> {
    const systemPrompt = `You are a helpful interview coach. Provide brief, encouraging feedback on interview responses.
    Keep feedback positive and constructive, focusing on 1-2 specific points. Maximum 50 words.`;

    const messages = [{
      role: "user",
      content: `Question context: ${questionContext}
      
Candidate response: ${response}

Provide brief encouraging feedback:`
    }];

    try {
      const response_data = await this.makeRequest(messages, systemPrompt, 200);
      return response_data.content[0].text;
    } catch (error) {
      console.error("Error generating quick feedback:", error);
      return "Good response! Consider adding more specific details and examples to strengthen your answer.";
    }
  }
}

// Export singleton instance
export const bedrockService = new BedrockService();
export type { InterviewerPersona, InterviewContext, AIResponse, STARAssessment };