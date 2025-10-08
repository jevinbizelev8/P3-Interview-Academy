// Model Answer Service
// Fetches and caches curated interview questions and model answers from Google Sheets

export interface CuratedQuestion {
  qNumber: number;
  question: string;
  focusArea: string;
  modelAnswer: string;
  stage: string;
  stageNumber: number;
}

export class ModelAnswerService {
  private curatedQuestions: CuratedQuestion[] = [];
  private csvUrl: string;
  private isLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    // Public Google Sheets CSV URL
    this.csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-Yg3A8ub3WQyjGsrrafCWYJf7t9cnuuMYpZxezfWrKjYztpfiLj2nW9OHXX0YJWMPsKgQQ18CYHXi/pub?gid=44685981&single=true&output=csv';

    // Auto-load on startup (fire and forget, with timeout to prevent blocking server startup)
    const loadWithTimeout = Promise.race([
      this.fetchModelAnswers(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('CSV load timeout after 15s')), 15000))
    ]);

    loadWithTimeout.catch(error => {
      console.warn('⚠️ Model answers not loaded on startup (will retry on first use):', error.message);
      // Service remains functional - will lazy-load on first question generation
    });
  }

  /**
   * Fetch and parse model answers from Google Sheets CSV
   * Uses caching to avoid repeated fetches
   */
  async fetchModelAnswers(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && this.curatedQuestions.length > 0) {
      console.log('✅ Model answers already cached in memory');
      return;
    }

    // If currently loading, wait for existing load to complete
    if (this.loadingPromise) {
      console.log('⏳ Model answers loading in progress, waiting...');
      return this.loadingPromise;
    }

    // Start new load
    this.loadingPromise = this.loadFromCSV();

    try {
      await this.loadingPromise;
      this.isLoaded = true;
      console.log(`✅ Model answers loaded: ${this.curatedQuestions.length} questions cached`);
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Internal method to actually fetch and parse CSV
   */
  private async loadFromCSV(): Promise<void> {
    try {
      console.log('🌐 Fetching curated questions from Google Sheets...');

      const response = await fetch(this.csvUrl);
      if (!response.ok) {
        throw new Error(`CSV fetch failed: ${response.status} ${response.statusText}`);
      }

      const csvData = await response.text();
      this.curatedQuestions = this.parseCSV(csvData);

      console.log(`📋 Parsed ${this.curatedQuestions.length} curated questions`);
      this.logStageDistribution();

    } catch (error) {
      console.error('❌ Error loading model answers:', error);
      throw new Error(`Failed to load model answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV data into structured question objects
   */
  private parseCSV(csvData: string): CuratedQuestion[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const questions: CuratedQuestion[] = [];

    // Skip header row (Q#,Question,Focus Area,Guided Model Answer Framework)
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];

        // Handle CSV parsing with proper quote handling
        const fields = this.parseCSVLine(line);

        if (fields.length < 4) {
          console.warn(`⚠️ Skipping malformed line ${i}: ${line.substring(0, 50)}...`);
          continue;
        }

        const qNumber = parseInt(fields[0].trim());
        if (isNaN(qNumber)) {
          console.warn(`⚠️ Skipping line with invalid Q#: ${fields[0]}`);
          continue;
        }

        const question = fields[1].trim();
        const focusArea = fields[2].trim();
        const modelAnswer = fields[3].trim();

        // Map question number to stage
        const { stage, stageNumber } = this.mapQuestionToStage(qNumber);

        questions.push({
          qNumber,
          question,
          focusArea,
          modelAnswer,
          stage,
          stageNumber
        });

      } catch (error) {
        console.warn(`⚠️ Error parsing line ${i}:`, error);
        continue;
      }
    }

    return questions.sort((a, b) => a.qNumber - b.qNumber);
  }

  /**
   * Parse a CSV line handling quoted fields properly
   */
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    fields.push(current);

    return fields;
  }

  /**
   * Map question number (1-125) to interview stage
   */
  private mapQuestionToStage(qNumber: number): { stage: string; stageNumber: number } {
    if (qNumber >= 1 && qNumber <= 25) {
      return { stage: 'phone-screening', stageNumber: 1 };
    } else if (qNumber >= 26 && qNumber <= 50) {
      return { stage: 'functional-team', stageNumber: 2 };
    } else if (qNumber >= 51 && qNumber <= 75) {
      return { stage: 'hiring-manager', stageNumber: 3 };
    } else if (qNumber >= 76 && qNumber <= 100) {
      return { stage: 'sme-expert', stageNumber: 4 };
    } else if (qNumber >= 101 && qNumber <= 125) {
      return { stage: 'executive-leadership', stageNumber: 5 };
    } else {
      console.warn(`⚠️ Question number ${qNumber} out of expected range (1-125)`);
      return { stage: 'unknown', stageNumber: 0 };
    }
  }

  /**
   * Log distribution of questions across stages
   */
  private logStageDistribution(): void {
    const distribution: Record<string, number> = {};

    this.curatedQuestions.forEach(q => {
      distribution[q.stage] = (distribution[q.stage] || 0) + 1;
    });

    console.log('📊 Question distribution by stage:');
    Object.entries(distribution).forEach(([stage, count]) => {
      console.log(`   ${stage}: ${count} questions`);
    });
  }

  /**
   * Get questions by interview stage
   * @param stage - Interview stage name (e.g., 'phone-screening', 'functional-team')
   * @param count - Optional limit on number of questions to return
   * @returns Array of curated questions for the stage
   */
  getQuestionsByStage(stage: string, count?: number): CuratedQuestion[] {
    // Ensure data is loaded
    if (!this.isLoaded) {
      console.warn('⚠️ Model answers not yet loaded, returning empty array');
      return [];
    }

    // Normalize stage name for matching
    const normalizedStage = this.normalizeStage(stage);

    const stageQuestions = this.curatedQuestions.filter(q => q.stage === normalizedStage);

    if (count && count > 0) {
      return stageQuestions.slice(0, count);
    }

    return stageQuestions;
  }

  /**
   * Find model answer by question text using fuzzy matching
   * @param questionText - The question text to match
   * @param threshold - Similarity threshold (0-1), default 0.7
   * @returns Model answer string or null if no match found
   */
  findModelAnswer(questionText: string, threshold: number = 0.7): string | null {
    if (!this.isLoaded || this.curatedQuestions.length === 0) {
      console.warn('⚠️ Model answers not yet loaded');
      return null;
    }

    const normalized = this.normalizeText(questionText);

    // Try exact match first
    const exactMatch = this.curatedQuestions.find(q =>
      this.normalizeText(q.question) === normalized
    );

    if (exactMatch) {
      console.log(`✅ Exact match found for question (Q${exactMatch.qNumber})`);
      return exactMatch.modelAnswer;
    }

    // Try fuzzy match
    let bestMatch: CuratedQuestion | null = null;
    let bestScore = 0;

    for (const curatedQ of this.curatedQuestions) {
      const score = this.calculateSimilarity(questionText, curatedQ.question);

      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = curatedQ;
      }
    }

    if (bestMatch) {
      console.log(`✅ Fuzzy match found for question (Q${bestMatch.qNumber}, score: ${bestScore.toFixed(2)})`);
      return bestMatch.modelAnswer;
    }

    console.log(`⚠️ No match found for question (tried threshold ${threshold})`);
    return null;
  }

  /**
   * Get curated question by Q# (1-125)
   * @param qNumber - Question number from spreadsheet
   * @returns CuratedQuestion or null
   */
  getCuratedQuestion(qNumber: number): CuratedQuestion | null {
    if (!this.isLoaded) {
      console.warn('⚠️ Model answers not yet loaded');
      return null;
    }

    return this.curatedQuestions.find(q => q.qNumber === qNumber) || null;
  }

  /**
   * Get a random question from a specific stage
   * @param stage - Interview stage
   * @returns Random curated question or null
   */
  getRandomQuestionByStage(stage: string): CuratedQuestion | null {
    const stageQuestions = this.getQuestionsByStage(stage);

    if (stageQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * stageQuestions.length);
    return stageQuestions[randomIndex];
  }

  /**
   * Calculate similarity between two strings using Jaccard similarity
   * @returns Score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(this.normalizeText(str1).split(/\s+/));
    const words2 = new Set(this.normalizeText(str2).split(/\s+/));

    // Calculate Jaccard similarity: intersection / union
    const intersection = new Set(Array.from(words1).filter(word => words2.has(word)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Normalize stage name for consistent matching
   */
  private normalizeStage(stage: string): string {
    const stageMap: Record<string, string> = {
      'phone-screening': 'phone-screening',
      'phone_screening': 'phone-screening',
      'phonescreening': 'phone-screening',
      'screening': 'phone-screening',
      'hr': 'phone-screening',

      'functional-team': 'functional-team',
      'functional_team': 'functional-team',
      'functionalteam': 'functional-team',
      'team': 'functional-team',

      'hiring-manager': 'hiring-manager',
      'hiring_manager': 'hiring-manager',
      'hiringmanager': 'hiring-manager',
      'manager': 'hiring-manager',

      'sme-expert': 'sme-expert',
      'sme_expert': 'sme-expert',
      'smeexpert': 'sme-expert',
      'subject-matter-expertise': 'sme-expert',
      'subject_matter_expertise': 'sme-expert',
      'sme': 'sme-expert',
      'expert': 'sme-expert',

      'executive-leadership': 'executive-leadership',
      'executive_leadership': 'executive-leadership',
      'executiveleadership': 'executive-leadership',
      'executive-final': 'executive-leadership',
      'executive': 'executive-leadership',
      'leadership': 'executive-leadership'
    };

    const normalized = stage.toLowerCase().trim();
    return stageMap[normalized] || normalized;
  }

  /**
   * Check if service is loaded and ready
   */
  isReady(): boolean {
    return this.isLoaded && this.curatedQuestions.length > 0;
  }

  /**
   * Get total number of curated questions loaded
   */
  getQuestionCount(): number {
    return this.curatedQuestions.length;
  }

  /**
   * Get all curated questions (useful for debugging)
   */
  getAllQuestions(): CuratedQuestion[] {
    return [...this.curatedQuestions];
  }
}
