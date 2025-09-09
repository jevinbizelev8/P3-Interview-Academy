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
  language?: string;
}

export class AIRouter {
  private openaiService = getOpenAIService();
  private failureCount: { sealion: number; openai: number } = { sealion: 0, openai: 0 };
  private lastFailure: { sealion?: Date; openai?: Date } = {};
  
  // Circuit breaker settings
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_TIME_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

  // Response caching for performance optimization
  private cache = new Map<string, { content: string; timestamp: number; provider: string }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    console.log('🔀 AI Router initialized with SeaLion via Vertex AI (primary) + OpenAI (fallback)');
    console.log('🚀 All languages now use Vertex AI SeaLion for enhanced performance and reliability');
    
    // Clean expired cache entries every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  /**
   * Generate AI content with intelligent fallback and language-based routing
   */
  async generateResponse(options: AIGenerationOptions): Promise<AIResponse> {
    const startTime = Date.now();
    let fallbackUsed = false;
    
    // Generate cache key based on request content
    const cacheKey = this.generateCacheKey(options);
    
    // Check cache first
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      console.log(`📦 Cache hit for ${options.language || 'en'} request`);
      return {
        content: cachedResponse.content,
        provider: cachedResponse.provider as 'sealion' | 'openai',
        responseTime: Date.now() - startTime,
        fallbackUsed: false
      };
    }
    
    // Determine optimal service based on language
    const { primaryService, fallbackService } = this.determineServicePriority(options.language);

    // console.log(`🗺️ Language routing: '${options.language || 'en'}' → Primary: ${primaryService}, Fallback: ${fallbackService}`);

    // Try primary service first  
    if (this.isServiceAvailable(primaryService)) {
      try {
        console.log(`🤖 Using ${primaryService} ${primaryService === 'sealion' ? 'via Vertex AI' : ''} (primary)...`);
        
        const content = await this.callService(primaryService, options);
        
        // Cache successful response
        this.setCache(cacheKey, content, primaryService);

        // Reset failure count on success
        this.failureCount[primaryService] = 0;
        delete this.lastFailure[primaryService];

        return {
          content,
          provider: primaryService,
          responseTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        console.warn(`⚠️ ${primaryService} failed, falling back to ${fallbackService}:`, error instanceof Error ? error.message : error);
        this.recordFailure(primaryService);
        fallbackUsed = true;
      }
    } else {
      console.log(`⏭️ ${primaryService} unavailable, trying ${fallbackService}`);
      fallbackUsed = true;
    }

    // Fallback to secondary service
    if (this.isServiceAvailable(fallbackService)) {
      try {
        console.log(`🤖 Using ${fallbackService} ${fallbackService === 'sealion' ? 'via Vertex AI' : ''} (fallback)...`);
        
        const content = await this.callService(fallbackService, options);
        
        // Cache successful fallback response
        this.setCache(cacheKey, content, fallbackService);

        // Reset failure count on success
        this.failureCount[fallbackService] = 0;
        delete this.lastFailure[fallbackService];

        return {
          content,
          provider: fallbackService,
          responseTime: Date.now() - startTime,
          fallbackUsed
        };
      } catch (error) {
        console.error(`❌ ${fallbackService} also failed:`, error instanceof Error ? error.message : error);
        this.recordFailure(fallbackService);
        throw new Error(`Both AI services failed. ${primaryService}: ${fallbackUsed ? 'circuit breaker open or failed' : 'failed'}. ${fallbackService}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error(`No AI services available. Both ${primaryService} and ${fallbackService} are unavailable.`);
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
   * Determine service priority based on language
   * Updated: SeaLion (via Vertex AI) is now PRIMARY for ALL languages
   */
  private determineServicePriority(language?: string): { primaryService: 'sealion' | 'openai'; fallbackService: 'sealion' | 'openai' } {
    // SeaLion (via Vertex AI) is now the primary AI for all languages
    // This leverages Google Cloud infrastructure for better performance and reliability
    // OpenAI serves as the fallback for any failures
    return { primaryService: 'sealion', fallbackService: 'openai' };
  }

  /**
   * Call specific AI service with proper message optimization
   */
  private async callService(service: 'sealion' | 'openai', options: AIGenerationOptions): Promise<string> {
    if (service === 'openai') {
      // Optimize messages for OpenAI if domain is specified
      const optimizedMessages = options.domain ? 
        this.optimizeMessagesForOpenAI(options.messages, options.domain) : 
        options.messages;

      return await this.callWithTimeout(
        () => this.openaiService.generateResponse({
          messages: optimizedMessages,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          model: options.model
        }),
        options.timeout || this.DEFAULT_TIMEOUT_MS
      );
    } else {
      // Call SeaLion service with explicit language parameter
      return await this.callWithTimeout(
        () => sealionService.generateResponse({
          messages: options.messages,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          model: options.model,
          language: options.language || 'en' // Pass language to SeaLion service
        }),
        options.timeout || this.DEFAULT_TIMEOUT_MS
      );
    }
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

  /**
   * Generate cache key from request options
   */
  private generateCacheKey(options: AIGenerationOptions): string {
    const keyData = {
      messages: options.messages,
      language: options.language || 'en',
      domain: options.domain,
      maxTokens: options.maxTokens,
      temperature: options.temperature
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 64);
  }

  /**
   * Get response from cache if available and not expired
   */
  private getFromCache(key: string): { content: string; provider: string } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    
    return { content: cached.content, provider: cached.provider };
  }

  /**
   * Store response in cache
   */
  private setCache(key: string, content: string, provider: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      content,
      provider,
      timestamp: Date.now()
    });
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();