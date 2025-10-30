import { OpenAI } from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  fallbackModel: string;
}

// Default configuration for OpenAI API
const DEFAULT_CONFIG: Omit<OpenAIConfig, 'apiKey'> = {
  defaultModel: 'gpt-4o',
  fallbackModel: 'gpt-4o-mini',
};

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(apiKey?: string) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: apiKey || process.env.OPENAI_API_KEY || ''
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl
    });

    console.log('✅ OpenAI service initialized successfully');
    console.log(`🤖 Using model: ${this.config.defaultModel}`);
  }

  // Generic method for AI text generation with OpenAI (compatible with SeaLion interface)
  async generateResponse(options: {
    messages: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.config.defaultModel,
        messages: options.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        stream: false
      });

      const result = completion.choices[0].message.content?.trim();
      if (!result) {
        throw new Error('Empty response from OpenAI API');
      }

      return result;
    } catch (error) {
      console.error('OpenAI generateResponse error:', error);
      
      // Try fallback model if primary model fails
      if (options.model !== this.config.fallbackModel) {
        console.log('🔄 Retrying with fallback model:', this.config.fallbackModel);
        return this.generateResponse({
          ...options,
          model: this.config.fallbackModel
        });
      }
      
      throw new Error(`OpenAI API generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Audio transcription using OpenAI Whisper
  async transcribeAudio(audioFile: Buffer | File | NodeJS.ReadableStream, options: {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    filename?: string;
  } = {}): Promise<{
    text: string;
    language?: string;
    duration?: number;
    segments?: any[];
  }> {
    try {
      // Handle different input types for OpenAI API
      let fileToUpload: any = audioFile;
      
      if (Buffer.isBuffer(audioFile)) {
        // In Node.js, create a ReadableStream from Buffer for OpenAI API
        const filename = options.filename || 'audio.wav';
        const { Readable } = await import('stream');
        fileToUpload = Readable.from(audioFile);
        // Add filename property for OpenAI API
        (fileToUpload as any).name = filename;
        (fileToUpload as any).type = 'audio/wav';
      } else if ('readable' in audioFile) {
        // It's already a stream, add filename if provided
        const filename = options.filename || 'audio.wav';
        (fileToUpload as any).name = filename;
        (fileToUpload as any).type = 'audio/wav';
      }

      const transcription = await this.client.audio.transcriptions.create({
        file: fileToUpload,
        model: options.model || 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature || 0.0,
        response_format: options.response_format || 'verbose_json'
      });

      // Handle different response formats
      if (options.response_format === 'text') {
        return { text: typeof transcription === 'string' ? transcription : transcription.text ?? '' };
      }

      // For verbose_json format
      const verboseResponse = transcription as any;
      return {
        text: verboseResponse.text || '',
        language: verboseResponse.language,
        duration: verboseResponse.duration,
        segments: verboseResponse.segments
      };

    } catch (error) {
      console.error('OpenAI audio transcription error:', error);
      throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method to check OpenAI service health
  async healthCheck(): Promise<{ healthy: boolean; model: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      
      const latency = Date.now() - startTime;
      return {
        healthy: true,
        model: this.config.defaultModel,
        latency
      };
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return {
        healthy: false,
        model: this.config.defaultModel
      };
    }
  }

  // Get optimized prompts for OpenAI (considering its strengths)
  getOptimizedSystemPrompt(domain: 'study-plan' | 'company-research' | 'resource-generation' | 'general'): string {
    const prompts = {
      'study-plan': `You are an expert career coach and interview preparation specialist with deep knowledge of hiring practices across technology companies and Southeast Asian markets.

You excel at creating personalized, actionable study plans that balance technical preparation with cultural awareness. Your recommendations are practical, time-efficient, and proven to help candidates succeed in competitive interview processes.

Focus on deliverable outcomes, specific time allocations, and measurable progress milestones.`,

      'company-research': `You are a seasoned business analyst and recruitment consultant with extensive knowledge of company cultures, hiring practices, and industry trends across global markets, with particular expertise in Southeast Asian business environments.

You provide comprehensive, accurate company insights that help candidates understand organizational values, recent developments, competitive positioning, and interview expectations. Your research is thorough yet concise, focusing on actionable intelligence.`,

      'resource-generation': `You are an expert technical educator and interview preparation specialist who creates comprehensive, easy-to-understand learning materials.

You excel at breaking down complex topics into structured, actionable content that candidates can quickly absorb and apply. Your materials are practical, example-rich, and designed for efficient learning under time pressure.`,

      'general': `You are an expert AI assistant specializing in interview preparation and career development, with deep understanding of hiring practices and candidate success strategies.`
    };

    return prompts[domain];
  }

  // ============================================================================
  // REDESIGN PROJECT: NEW AI METHODS
  // ============================================================================

  /**
   * Analyze resume for ATS compatibility and improvement suggestions
   */
  async analyzeResume(resumeText: string, jobDescription?: string): Promise<{
    atsScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    matchedKeywords: string[];
  }> {
    const prompt = `You are an expert resume reviewer and ATS (Applicant Tracking System) specialist.

Analyze the following resume${jobDescription ? ' against this job description' : ''}:

${jobDescription ? `JOB DESCRIPTION:
${jobDescription}

` : ''}RESUME:
${resumeText}

Provide a comprehensive analysis in the following JSON format:
{
  "atsScore": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "matchedKeywords": ["keyword 1", "keyword 2", ...]
}

Evaluation criteria:
- ATS Score: Overall compatibility with ATS systems (format, keywords, structure)
- Strengths: What works well (achievements, keywords, formatting)
- Weaknesses: What needs improvement (missing keywords, formatting issues, vague descriptions)
- Recommendations: Specific, actionable improvements
- Matched Keywords: ${jobDescription ? 'Keywords from job description found in resume' : 'Important keywords found'}

Be specific, actionable, and focus on improvements that will increase interview chances.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Factual analysis
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content?.trim();
      if (!result) {
        throw new Error('Empty response from OpenAI API');
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('OpenAI resume analysis error:', error);

      // Try fallback model if primary model fails
      if (this.config.defaultModel !== this.config.fallbackModel) {
        console.log('🔄 Retrying resume analysis with fallback model:', this.config.fallbackModel);
        // Retry with fallback - create new completion
        try {
          const response = await this.client.chat.completions.create({
            model: this.config.fallbackModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
          });
          const result = response.choices[0].message.content?.trim();
          if (!result) throw new Error('Empty fallback response');
          return JSON.parse(result);
        } catch (fallbackError) {
          console.error('Fallback resume analysis also failed:', fallbackError);
          throw new Error('Resume analysis unavailable - AI service error');
        }
      }

      throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provide feedback on self-introduction transcript
   */
  async provideSelfIntroFeedback(transcript: string, targetRole?: string): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    rewrittenVersion: string;
  }> {
    const prompt = `You are an expert interview coach specializing in self-introductions and personal branding.

Evaluate the following self-introduction${targetRole ? ` for a ${targetRole} position` : ''}:

TRANSCRIPT:
${transcript}

Provide comprehensive feedback in the following JSON format:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "rewrittenVersion": "A polished, improved version of the self-introduction"
}

Evaluation criteria:
- Score: Overall effectiveness (0-100)
- Clarity: Is it easy to understand?
- Confidence: Does it project self-assurance?
- Relevance: Does it highlight appropriate experience${targetRole ? ` for ${targetRole}` : ''}?
- Structure: Is it well-organized (background → experience → value proposition)?
- Length: Is it appropriately concise (30-60 seconds when spoken)?

Strengths: What works well
Improvements: What needs to be changed
Suggestions: Specific tips to improve delivery and content
Rewritten Version: An improved version maintaining the candidate's voice

Be encouraging yet constructive. Focus on helping the candidate shine.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5, // Balanced - factual yet creative
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content?.trim();
      if (!result) {
        throw new Error('Empty response from OpenAI API');
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('OpenAI self-intro feedback error:', error);

      // Try fallback model
      if (this.config.defaultModel !== this.config.fallbackModel) {
        console.log('🔄 Retrying self-intro feedback with fallback model:', this.config.fallbackModel);
        try {
          const response = await this.client.chat.completions.create({
            model: this.config.fallbackModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 1500,
            response_format: { type: 'json_object' }
          });
          const result = response.choices[0].message.content?.trim();
          if (!result) throw new Error('Empty fallback response');
          return JSON.parse(result);
        } catch (fallbackError) {
          console.error('Fallback self-intro feedback also failed:', fallbackError);
          throw new Error('Self-intro feedback unavailable - AI service error');
        }
      }

      throw new Error(`Self-intro feedback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate insights and patterns from interview performance data
   */
  async generateReflectionInsights(performanceData: {
    interviewType: string;
    responses: Array<{ question: string; answer: string; score?: number }>;
    overallScore?: number;
    duration?: number;
  }): Promise<{
    insights: string[];
    patterns: string[];
    strengths: string[];
    areasForImprovement: string[];
    actionItems: string[];
  }> {
    const responseSummary = performanceData.responses.map((r, i) =>
      `Q${i + 1}: ${r.question}\nA: ${r.answer.substring(0, 200)}...${r.score ? `\nScore: ${r.score}/100` : ''}`
    ).join('\n\n');

    const prompt = `You are an expert interview coach and performance analyst.

Analyze the following interview performance and provide deep insights:

INTERVIEW TYPE: ${performanceData.interviewType}
OVERALL SCORE: ${performanceData.overallScore || 'N/A'}
DURATION: ${performanceData.duration ? `${Math.round(performanceData.duration / 60)} minutes` : 'N/A'}

RESPONSES:
${responseSummary}

Provide comprehensive insights in the following JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "patterns": ["pattern 1", "pattern 2", ...],
  "strengths": ["strength 1", "strength 2", ...],
  "areasForImprovement": ["area 1", "area 2", ...],
  "actionItems": ["action 1", "action 2", ...]
}

Analysis criteria:
- Insights: Deep observations about the candidate's performance and style
- Patterns: Recurring themes, behaviors, or tendencies across responses
- Strengths: What the candidate does well consistently
- Areas for Improvement: Specific weaknesses to address
- Action Items: Concrete, specific steps to improve (prioritized)

Look for:
- STAR method usage (Situation, Task, Action, Result)
- Clarity and conciseness
- Use of specific examples vs. generic statements
- Confidence indicators
- Technical depth (if applicable)
- Communication effectiveness

Be specific, actionable, and encouraging. Focus on growth opportunities.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, // More creative for insights
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content?.trim();
      if (!result) {
        throw new Error('Empty response from OpenAI API');
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('OpenAI reflection insights error:', error);

      // Try fallback model
      if (this.config.defaultModel !== this.config.fallbackModel) {
        console.log('🔄 Retrying reflection insights with fallback model:', this.config.fallbackModel);
        try {
          const response = await this.client.chat.completions.create({
            model: this.config.fallbackModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
          });
          const result = response.choices[0].message.content?.trim();
          if (!result) throw new Error('Empty fallback response');
          return JSON.parse(result);
        } catch (fallbackError) {
          console.error('Fallback reflection insights also failed:', fallbackError);
          throw new Error('Reflection insights unavailable - AI service error');
        }
      }

      throw new Error(`Reflection insights failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
let openaiService: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openaiService) {
    try {
      openaiService = new OpenAIService();
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
      throw error;
    }
  }
  return openaiService;
}

export { openaiService };