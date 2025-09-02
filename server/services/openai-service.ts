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