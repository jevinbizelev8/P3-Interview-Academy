import { sealionService } from './sealion';
import { getOpenAIService } from './openai-service';

export interface AIResponse {
  content: string;
  provider: 'sealion' | 'openai';
  responseTime: number;
  fallbackUsed: boolean;
}

export interface AIGenerationOptions {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  timeout?: number;
  domain?: 'study-plan' | 'company-research' | 'resource-generation' | 'general';
}

export class AIRouter {
  private openaiService = getOpenAIService();
  private failureCount: { sealion: number; openai: number } = { sealion: 0, openai: 0 };
  private lastFailure: { sealion?: Date; openai?: Date } = {};
  
  // Circuit breaker settings
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_TIME_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

  constructor() {
    console.log('🔀 AI Router initialized with SeaLion (primary) + OpenAI (fallback)');
  }

  /**
   * Generate AI content with intelligent fallback
   */
  async generateResponse(options: AIGenerationOptions): Promise<AIResponse> {
    const startTime = Date.now();
    let fallbackUsed = false;

    // Try SeaLion first (if available)
    if (this.isServiceAvailable('sealion')) {
      try {
        console.log('🦁 Attempting SeaLion generation...');
        const content = await this.callWithTimeout(
          () => sealionService.generateResponse({
            messages: options.messages,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            model: options.model
          }),
          options.timeout || this.DEFAULT_TIMEOUT_MS
        );

        // Reset failure count on success
        this.failureCount.sealion = 0;
        delete this.lastFailure.sealion;

        return {
          content,
          provider: 'sealion',
          responseTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        console.warn('⚠️ SeaLion failed, falling back to OpenAI:', error instanceof Error ? error.message : error);
        this.recordFailure('sealion');
        fallbackUsed = true;
      }
    } else {
      console.log('⏭️ SeaLion unavailable, using OpenAI directly');
      fallbackUsed = true;
    }

    // Fallback to OpenAI
    if (this.isServiceAvailable('openai')) {
      try {
        console.log('🤖 Using OpenAI fallback...');
        
        // Optimize messages for OpenAI if domain is specified
        const optimizedMessages = options.domain ? 
          this.optimizeMessagesForOpenAI(options.messages, options.domain) : 
          options.messages;

        const content = await this.callWithTimeout(
          () => this.openaiService.generateResponse({
            messages: optimizedMessages,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            model: options.model
          }),
          options.timeout || this.DEFAULT_TIMEOUT_MS
        );

        // Reset failure count on success
        this.failureCount.openai = 0;
        delete this.lastFailure.openai;

        return {
          content,
          provider: 'openai',
          responseTime: Date.now() - startTime,
          fallbackUsed
        };
      } catch (error) {
        console.error('❌ OpenAI also failed:', error instanceof Error ? error.message : error);
        this.recordFailure('openai');
        throw new Error(`Both AI services failed. SeaLion: circuit breaker open. OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('No AI services available. Both SeaLion and OpenAI are unavailable.');
  }

  /**
   * Check service availability (circuit breaker logic)
   */
  private isServiceAvailable(service: 'sealion' | 'openai'): boolean {
    const failures = this.failureCount[service];
    const lastFailure = this.lastFailure[service];

    // If failure count is below threshold, service is available
    if (failures < this.FAILURE_THRESHOLD) {
      return true;
    }

    // If we're past the recovery time, reset the circuit breaker
    if (lastFailure && (Date.now() - lastFailure.getTime()) > this.RECOVERY_TIME_MS) {
      console.log(`🔄 Resetting circuit breaker for ${service}`);
      this.failureCount[service] = 0;
      delete this.lastFailure[service];
      return true;
    }

    console.log(`⚡ Circuit breaker open for ${service} (${failures} failures)`);
    return false;
  }

  /**
   * Record service failure for circuit breaker
   */
  private recordFailure(service: 'sealion' | 'openai'): void {
    this.failureCount[service]++;
    this.lastFailure[service] = new Date();
    
    console.log(`📊 Service failure recorded for ${service}: ${this.failureCount[service]}/${this.FAILURE_THRESHOLD}`);
  }

  /**
   * Add timeout wrapper to API calls
   */
  private async callWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Optimize messages for OpenAI based on domain
   */
  private optimizeMessagesForOpenAI(
    messages: Array<{ role: string; content: string }>, 
    domain: 'study-plan' | 'company-research' | 'resource-generation' | 'general'
  ): Array<{ role: string; content: string }> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    // Replace or enhance system message with OpenAI-optimized prompt
    const optimizedSystemPrompt = this.openaiService.getOptimizedSystemPrompt(domain);
    
    return [
      { role: 'system', content: optimizedSystemPrompt },
      ...userMessages
    ];
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    sealion: { available: boolean; failures: number; lastFailure?: Date };
    openai: { available: boolean; failures: number; lastFailure?: Date; health?: any };
  }> {
    const openaiHealth = await this.openaiService.healthCheck().catch(() => ({ healthy: false }));
    
    return {
      sealion: {
        available: this.isServiceAvailable('sealion'),
        failures: this.failureCount.sealion,
        lastFailure: this.lastFailure.sealion
      },
      openai: {
        available: this.isServiceAvailable('openai'),
        failures: this.failureCount.openai,
        lastFailure: this.lastFailure.openai,
        health: openaiHealth
      }
    };
  }

  /**
   * Force reset circuit breakers (for admin/testing)
   */
  resetCircuitBreakers(): void {
    this.failureCount = { sealion: 0, openai: 0 };
    this.lastFailure = {};
    console.log('🔄 All circuit breakers reset');
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();