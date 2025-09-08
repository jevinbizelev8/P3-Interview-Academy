import { sealionService } from './sealion';
import { storage } from '../storage';
import type { 
  IndustryContext, 
  IndustryCategory, 
  IndustrySubfield,
  IndustryKnowledge,
  InsertIndustryKnowledge,
  INDUSTRY_CATEGORIES 
} from '@shared/schema';

// Simple in-memory cache for industry data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class IndustryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export class IndustryIntelligenceService {
  private industryCache = new IndustryCache();
  
  // ================================
  // INDUSTRY DETECTION & ANALYSIS
  // ================================

  /**
   * Analyzes job position and company to detect industry context
   */
  async detectIndustryContext(
    jobPosition: string, 
    companyName?: string, 
    experienceLevel?: string
  ): Promise<IndustryContext> {
    try {
      console.log(`Detecting industry context for: ${jobPosition} at ${companyName || 'Unknown Company'}`);

      // Use Sea Lion AI for intelligent industry analysis
      const analysisPrompt = `
        Analyze this job position and company to determine the industry context for interview preparation.
        
        Job Position: "${jobPosition}"
        Company: "${companyName || 'Not specified'}"
        Experience Level: "${experienceLevel || 'Not specified'}"
        
        Please provide a JSON response with the following structure:
        {
          "primaryIndustry": "technology|finance|healthcare|consulting|marketing|manufacturing|retail|education|government|nonprofit",
          "confidenceScore": 0.95,
          "specializations": ["specific-technical-areas", "relevant-skills"],
          "experienceLevel": "intermediate|senior|expert",
          "technicalDepth": "description of technical requirements",
          "companyContext": {
            "type": "startup|enterprise|consulting|agency",
            "businessModel": "description",
            "technicalStack": ["relevant-technologies"],
            "regulatoryEnvironment": "if applicable"
          },
          "reasoning": "explanation of the analysis"
        }
        
        Focus on accurate industry classification and relevant technical specializations for interview preparation.
      `;

      const analysisResult = await sealionService.generateResponse({
        messages: [{ role: 'user', content: analysisPrompt }],
        maxTokens: 800,
        temperature: 0.5
      });
      
      // Parse the AI response
      const analysis = this.parseIndustryAnalysis(analysisResult);
      
      // Enhance with existing knowledge base data
      const enhancedContext = await this.enhanceWithKnowledgeBase(analysis, companyName);
      
      return enhancedContext;

    } catch (error) {
      console.error('Error detecting industry context:', error);
      // Fallback to rule-based detection
      return this.fallbackIndustryDetection(jobPosition, companyName, experienceLevel);
    }
  }

  /**
   * Parse Sea Lion AI industry analysis response
   */
  private parseIndustryAnalysis(aiResponse: string): IndustryContext {
    try {
      // Clean and parse the JSON response
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        primaryIndustry: parsed.primaryIndustry || 'technology',
        specializations: Array.isArray(parsed.specializations) ? parsed.specializations : [],
        experienceLevel: parsed.experienceLevel || 'intermediate',
        technicalDepth: parsed.technicalDepth || 'General technical knowledge',
        companyContext: {
          type: parsed.companyContext?.type || 'enterprise',
          businessModel: parsed.companyContext?.businessModel || 'Standard business model',
          technicalStack: Array.isArray(parsed.companyContext?.technicalStack) 
            ? parsed.companyContext.technicalStack 
            : [],
          regulatoryEnvironment: parsed.companyContext?.regulatoryEnvironment
        }
      };
    } catch (error) {
      console.error('Error parsing industry analysis:', error);
      // Return default context if parsing fails
      return this.getDefaultIndustryContext();
    }
  }

  /**
   * Enhance detected context with existing knowledge base data
   */
  private async enhanceWithKnowledgeBase(
    context: IndustryContext, 
    companyName?: string
  ): Promise<IndustryContext> {
    try {
      // Get industry-specific knowledge
      const industryKnowledge = await storage.getIndustryKnowledge(
        'industry', 
        context.primaryIndustry
      );

      // Get company-specific knowledge if available
      let companyKnowledge = null;
      if (companyName) {
        companyKnowledge = await storage.getIndustryKnowledge('company', companyName);
      }

      // Enhance specializations with knowledge base data
      if (industryKnowledge) {
        const additionalSpecializations = this.extractSpecializationsFromKnowledge(
          industryKnowledge, 
          context.specializations
        );
        context.specializations = [...new Set([...context.specializations, ...additionalSpecializations])];
      }

      // Enhance company context with knowledge base data
      if (companyKnowledge) {
        context.companyContext = {
          ...context.companyContext,
          businessModel: companyKnowledge.businessModel || context.companyContext.businessModel,
          technicalStack: (companyKnowledge.technicalStack as string[]) || context.companyContext.technicalStack,
          regulatoryEnvironment: (companyKnowledge as any).regulatoryEnvironment || context.companyContext.regulatoryEnvironment
        };
      }

      return context;
    } catch (error) {
      console.error('Error enhancing with knowledge base:', error);
      return context;
    }
  }

  /**
   * Fallback rule-based industry detection
   */
  private fallbackIndustryDetection(
    jobPosition: string, 
    companyName?: string, 
    experienceLevel?: string
  ): IndustryContext {
    const position = jobPosition.toLowerCase();
    const company = companyName?.toLowerCase() || '';

    // Rule-based industry detection
    let primaryIndustry = 'technology'; // Default
    let specializations: string[] = [];

    // Technology industry detection
    if (position.includes('software') || position.includes('developer') || position.includes('engineer') ||
        position.includes('data') || position.includes('ai') || position.includes('machine learning')) {
      primaryIndustry = 'technology';
      
      if (position.includes('data') || position.includes('analytics')) {
        specializations.push('data-science', 'analytics');
      }
      if (position.includes('machine learning') || position.includes('ai')) {
        specializations.push('ai-ml', 'machine-learning');
      }
      if (position.includes('backend') || position.includes('api')) {
        specializations.push('backend-development', 'api-development');
      }
      if (position.includes('frontend') || position.includes('ui') || position.includes('react')) {
        specializations.push('frontend-development', 'ui-development');
      }
    }

    // Finance industry detection
    else if (position.includes('finance') || position.includes('banking') || position.includes('investment') ||
             company.includes('bank') || company.includes('financial')) {
      primaryIndustry = 'finance';
      
      if (position.includes('risk')) {
        specializations.push('risk-management');
      }
      if (position.includes('investment') || position.includes('trading')) {
        specializations.push('investment-banking', 'trading');
      }
    }

    // Healthcare industry detection
    else if (position.includes('healthcare') || position.includes('medical') || position.includes('clinical') ||
             company.includes('hospital') || company.includes('pharma')) {
      primaryIndustry = 'healthcare';
      
      if (position.includes('clinical')) {
        specializations.push('clinical');
      }
      if (position.includes('pharma')) {
        specializations.push('pharmaceutical');
      }
    }

    // Consulting industry detection
    else if (position.includes('consultant') || position.includes('advisory') ||
             company.includes('consulting') || company.includes('mckinsey') || company.includes('bcg')) {
      primaryIndustry = 'consulting';
      
      if (position.includes('strategy')) {
        specializations.push('strategy');
      }
      if (position.includes('management')) {
        specializations.push('management');
      }
    }

    // Marketing industry detection
    else if (position.includes('marketing') || position.includes('brand') || position.includes('digital') ||
             position.includes('social media')) {
      primaryIndustry = 'marketing';
      
      if (position.includes('digital')) {
        specializations.push('digital-marketing');
      }
      if (position.includes('brand')) {
        specializations.push('brand-management');
      }
    }

    return {
      primaryIndustry,
      specializations,
      experienceLevel: (experienceLevel as 'intermediate' | 'senior' | 'expert') || 'intermediate',
      technicalDepth: this.inferTechnicalDepth(position, experienceLevel),
      companyContext: {
        type: this.inferCompanyType(company),
        businessModel: 'Standard business operations',
        technicalStack: this.inferTechnicalStack(position),
        regulatoryEnvironment: this.inferRegulatoryEnvironment(primaryIndustry)
      }
    };
  }

  // ================================
  // INDUSTRY KNOWLEDGE MANAGEMENT
  // ================================

  /**
   * Get or create industry knowledge for a specific industry
   */
  async getIndustryKnowledge(industry: string): Promise<IndustryKnowledge | null> {
    try {
      const cacheKey = `industry:${industry.toLowerCase()}`;
      
      // Check cache first
      let knowledge = this.industryCache.get<IndustryKnowledge>(cacheKey);
      if (knowledge) {
        console.log(`🚀 Cache hit for industry knowledge: ${industry}`);
        return knowledge;
      }

      // Check existing knowledge base
      knowledge = await storage.getIndustryKnowledge('industry', industry);
      
      if (!knowledge) {
        // Generate new industry knowledge using AI
        console.log(`🤖 Generating new industry knowledge for: ${industry}`);
        knowledge = await this.generateIndustryKnowledge(industry);
      }

      // Cache the result if we have knowledge
      if (knowledge) {
        this.industryCache.set(cacheKey, knowledge);
        console.log(`💾 Cached industry knowledge for: ${industry}`);
      }
      
      return knowledge;
    } catch (error) {
      console.error(`Error getting industry knowledge for ${industry}:`, error);
      return null;
    }
  }

  /**
   * Generate comprehensive industry knowledge using Sea Lion AI
   */
  async generateIndustryKnowledge(industry: string): Promise<IndustryKnowledge> {
    const knowledgePrompt = `
      Generate comprehensive interview preparation knowledge for the ${industry} industry.
      
      Please provide a detailed JSON response with the following structure:
      {
        "overview": "Comprehensive industry overview including current state, major players, and trends",
        "keyInsights": ["insight1", "insight2", "insight3"],
        "currentTrends": ["trend1", "trend2", "trend3"],
        "challenges": ["challenge1", "challenge2", "challenge3"],
        "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
        "interviewFocus": ["what interviewers prioritize in this industry"],
        "commonScenarios": ["typical interview scenarios"],
        "keyTerminology": {
          "term1": "definition1",
          "term2": "definition2",
          "term3": "definition3"
        },
        "culturalNorms": "Interview culture and expectations in this industry"
      }
      
      Focus on providing practical, interview-relevant information for candidates preparing for ${industry} interviews.
    `;

    try {
      const aiResponse = await sealionService.generateResponse({
        messages: [{ role: 'user', content: knowledgePrompt }],
        maxTokens: 1200,
        temperature: 0.5
      });
      const parsedKnowledge = this.parseIndustryKnowledge(aiResponse);
      
      // Save to knowledge base
      const knowledgeData: InsertIndustryKnowledge = {
        knowledgeType: 'industry',
        entityName: industry,
        primaryIndustry: industry,
        overview: parsedKnowledge.overview,
        keyInsights: parsedKnowledge.keyInsights,
        currentTrends: parsedKnowledge.currentTrends,
        challenges: parsedKnowledge.challenges,
        opportunities: parsedKnowledge.opportunities,
        interviewFocus: parsedKnowledge.interviewFocus,
        commonScenarios: parsedKnowledge.commonScenarios,
        keyTerminology: parsedKnowledge.keyTerminology,
        culturalNorms: parsedKnowledge.culturalNorms,
        confidenceScore: "0.85",
        sources: ["AI Generated", "SeaLion Analysis"],
        createdBy: "system-ai"
      };

      return await storage.createIndustryKnowledge(knowledgeData);
    } catch (error) {
      console.error(`Error generating industry knowledge for ${industry}:`, error);
      return this.getDefaultIndustryKnowledge(industry);
    }
  }

  /**
   * Get company-specific knowledge and insights
   */
  async getCompanyKnowledge(companyName: string): Promise<IndustryKnowledge | null> {
    try {
      // Check existing knowledge base
      let knowledge = await storage.getIndustryKnowledge('company', companyName);
      
      if (!knowledge) {
        // Generate new company knowledge using AI
        knowledge = await this.generateCompanyKnowledge(companyName);
      }
      
      return knowledge;
    } catch (error) {
      console.error(`Error getting company knowledge for ${companyName}:`, error);
      return null;
    }
  }

  /**
   * Generate company-specific knowledge using Sea Lion AI
   */
  async generateCompanyKnowledge(companyName: string): Promise<IndustryKnowledge> {
    const companyPrompt = `
      Generate comprehensive interview preparation knowledge for ${companyName}.
      
      Please provide a detailed JSON response with the following structure:
      {
        "overview": "Company overview including history, mission, and current position",
        "keyInsights": ["unique aspects about the company"],
        "currentTrends": ["recent developments and news"],
        "challenges": ["current challenges the company faces"],
        "opportunities": ["growth opportunities and initiatives"],
        "interviewFocus": ["what this company's interviewers typically focus on"],
        "commonScenarios": ["typical interview scenarios at this company"],
        "culturalNorms": "Company culture and interview expectations",
        "companySize": "startup|small|medium|large|enterprise",
        "businessModel": "description of business model",
        "technicalStack": ["technologies used if applicable"],
        "recentNews": ["recent news and developments"],
        "leadership": ["key leadership and their backgrounds"],
        "competitors": ["main competitors"]
      }
      
      Focus on providing practical, interview-relevant information for candidates interviewing at ${companyName}.
    `;

    try {
      const aiResponse = await sealionService.generateResponse({
        messages: [{ role: 'user', content: companyPrompt }],
        maxTokens: 1200,
        temperature: 0.5
      });
      const parsedKnowledge = this.parseCompanyKnowledge(aiResponse);
      
      // Save to knowledge base
      const knowledgeData: InsertIndustryKnowledge = {
        knowledgeType: 'company',
        entityName: companyName,
        primaryIndustry: parsedKnowledge.primaryIndustry || 'technology',
        overview: parsedKnowledge.overview,
        keyInsights: parsedKnowledge.keyInsights,
        currentTrends: parsedKnowledge.currentTrends,
        challenges: parsedKnowledge.challenges,
        opportunities: parsedKnowledge.opportunities,
        interviewFocus: parsedKnowledge.interviewFocus,
        commonScenarios: parsedKnowledge.commonScenarios,
        culturalNorms: parsedKnowledge.culturalNorms,
        companySize: parsedKnowledge.companySize,
        businessModel: parsedKnowledge.businessModel,
        technicalStack: parsedKnowledge.technicalStack,
        recentNews: parsedKnowledge.recentNews,
        leadership: parsedKnowledge.leadership,
        competitors: parsedKnowledge.competitors,
        confidenceScore: "0.80",
        sources: ["AI Generated", "SeaLion Analysis"],
        createdBy: "system-ai"
      };

      return await storage.createIndustryKnowledge(knowledgeData);
    } catch (error) {
      console.error(`Error generating company knowledge for ${companyName}:`, error);
      return this.getDefaultCompanyKnowledge(companyName);
    }
  }

  // ================================
  // HELPER METHODS
  // ================================

  private extractSpecializationsFromKnowledge(
    knowledge: IndustryKnowledge, 
    existingSpecializations: string[]
  ): string[] {
    const additional: string[] = [];
    
    // Extract from key insights
    if (knowledge.keyInsights) {
      const insights = Array.isArray(knowledge.keyInsights) ? knowledge.keyInsights : [];
      insights.forEach((insight) => {
        if (typeof insight === 'string') {
          // Look for technical terms and specializations
          if (insight.toLowerCase().includes('data') && !existingSpecializations.includes('data-science')) {
            additional.push('data-science');
          }
          if (insight.toLowerCase().includes('cloud') && !existingSpecializations.includes('cloud-computing')) {
            additional.push('cloud-computing');
          }
          // Add more extraction logic as needed
        }
      });
    }
    
    return additional;
  }

  private inferTechnicalDepth(position: string, experienceLevel?: string): string {
    if (experienceLevel === 'expert' || position.includes('senior') || position.includes('lead') || position.includes('principal')) {
      return 'Expert-level technical knowledge with architecture and leadership skills';
    } else if (experienceLevel === 'senior' || position.includes('mid-level')) {
      return 'Senior-level technical skills with some architecture experience';
    } else {
      return 'Intermediate technical knowledge with practical application skills';
    }
  }

  private inferCompanyType(company: string): 'startup' | 'enterprise' | 'consulting' | 'agency' {
    if (company.includes('google') || company.includes('microsoft') || company.includes('amazon') || 
        company.includes('meta') || company.includes('apple')) {
      return 'enterprise';
    } else if (company.includes('consulting') || company.includes('mckinsey') || company.includes('bcg')) {
      return 'consulting';
    } else if (company.includes('agency') || company.includes('creative') || company.includes('marketing')) {
      return 'agency';
    } else {
      return 'startup'; // Default assumption for unknown companies
    }
  }

  private inferTechnicalStack(position: string): string[] {
    const stack: string[] = [];
    const pos = position.toLowerCase();
    
    if (pos.includes('react')) stack.push('React', 'JavaScript', 'TypeScript');
    if (pos.includes('node') || pos.includes('backend')) stack.push('Node.js', 'Express', 'API Development');
    if (pos.includes('python')) stack.push('Python', 'Django', 'Flask');
    if (pos.includes('java')) stack.push('Java', 'Spring', 'JVM');
    if (pos.includes('data') || pos.includes('analytics')) stack.push('SQL', 'Python', 'Data Analysis');
    if (pos.includes('cloud') || pos.includes('aws') || pos.includes('devops')) stack.push('AWS', 'Docker', 'Kubernetes');
    
    return stack;
  }

  private inferRegulatoryEnvironment(industry: string): string | undefined {
    switch (industry) {
      case 'finance':
        return 'Heavily regulated (SEC, FINRA, Basel III compliance)';
      case 'healthcare':
        return 'HIPAA, FDA, and clinical compliance requirements';
      case 'consulting':
        return 'Client confidentiality and professional service standards';
      default:
        return undefined;
    }
  }

  private parseIndustryKnowledge(aiResponse: string): any {
    try {
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parsing industry knowledge:', error);
      return {};
    }
  }

  private parseCompanyKnowledge(aiResponse: string): any {
    try {
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parsing company knowledge:', error);
      return {};
    }
  }

  private getDefaultIndustryContext(): IndustryContext {
    return {
      primaryIndustry: 'technology',
      specializations: ['general-development'],
      experienceLevel: 'intermediate',
      technicalDepth: 'General technical knowledge with practical application skills',
      companyContext: {
        type: 'enterprise',
        businessModel: 'Standard technology business operations',
        technicalStack: ['JavaScript', 'React', 'Node.js'],
        regulatoryEnvironment: undefined
      }
    };
  }

  private getDefaultIndustryKnowledge(industry: string): IndustryKnowledge {
    // This would be implemented with default fallback knowledge
    // For now, return a basic structure
    return {} as IndustryKnowledge;
  }

  private getDefaultCompanyKnowledge(companyName: string): IndustryKnowledge {
    // This would be implemented with default fallback knowledge
    // For now, return a basic structure  
    return {} as IndustryKnowledge;
  }
}

export const industryIntelligenceService = new IndustryIntelligenceService();