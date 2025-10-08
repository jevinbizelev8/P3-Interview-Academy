import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelAnswerService, type CuratedQuestion } from "../services/model-answer-service";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Sample CSV data for testing
const sampleCSV = `Q#,Question,Focus Area,Guided Model Answer Framework
1,"Could you tell me about your current role?","Background / Motivation","My current role focuses on [responsibilities]. I'm seeking..."
2,"What attracted you to this company?","Motivation","I've been following your work in [industry]. This role allows..."
26,"How do you handle team conflicts?","Team Collaboration","In my experience with diverse teams, I approach conflicts by..."
51,"Tell me about your management style","Leadership","I believe in empowering team members through clear communication..."
76,"Explain your approach to technical problem-solving","Technical Expertise","When facing complex technical challenges, I start by..."
101,"What is your vision for organizational growth?","Strategic Leadership","I envision growth through strategic alignment of people..."`;

describe("ModelAnswerService", () => {
  let service: ModelAnswerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful CSV fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => sampleCSV
    });

    // Create fresh instance for each test
    service = new ModelAnswerService();
  });

  describe("fetchModelAnswers", () => {
    it("should fetch and parse CSV successfully", async () => {
      await service.fetchModelAnswers();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("docs.google.com"));
      expect(service.getQuestionCount()).toBe(6);
      expect(service.isReady()).toBe(true);
    });

    it("should cache results and not fetch twice", async () => {
      await service.fetchModelAnswers();
      await service.fetchModelAnswers();

      // Should only fetch once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(service.getQuestionCount()).toBe(6);
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found"
      });

      await expect(service.fetchModelAnswers()).rejects.toThrow("CSV fetch failed");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(service.fetchModelAnswers()).rejects.toThrow("Failed to load model answers");
    });
  });

  describe("parseCSV", () => {
    it("should correctly parse question numbers", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      const q26 = service.getCuratedQuestion(26);
      const q101 = service.getCuratedQuestion(101);

      expect(q1?.qNumber).toBe(1);
      expect(q26?.qNumber).toBe(26);
      expect(q101?.qNumber).toBe(101);
    });

    it("should parse question text correctly", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      expect(q1?.question).toBe("Could you tell me about your current role?");
    });

    it("should parse focus area correctly", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      expect(q1?.focusArea).toBe("Background / Motivation");
    });

    it("should parse model answer correctly", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      expect(q1?.modelAnswer).toContain("My current role focuses on");
    });

    it("should map question to correct stage", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);    // Q1-25: phone-screening
      const q26 = service.getCuratedQuestion(26);  // Q26-50: functional-team
      const q51 = service.getCuratedQuestion(51);  // Q51-75: hiring-manager
      const q76 = service.getCuratedQuestion(76);  // Q76-100: sme-expert
      const q101 = service.getCuratedQuestion(101); // Q101-125: executive-leadership

      expect(q1?.stage).toBe("phone-screening");
      expect(q1?.stageNumber).toBe(1);

      expect(q26?.stage).toBe("functional-team");
      expect(q26?.stageNumber).toBe(2);

      expect(q51?.stage).toBe("hiring-manager");
      expect(q51?.stageNumber).toBe(3);

      expect(q76?.stage).toBe("sme-expert");
      expect(q76?.stageNumber).toBe(4);

      expect(q101?.stage).toBe("executive-leadership");
      expect(q101?.stageNumber).toBe(5);
    });
  });

  describe("getQuestionsByStage", () => {
    it("should return questions for phone-screening stage", async () => {
      await service.fetchModelAnswers();

      const questions = service.getQuestionsByStage("phone-screening");

      expect(questions.length).toBe(2); // Q1 and Q2
      expect(questions.every(q => q.stageNumber === 1)).toBe(true);
    });

    it("should return questions for functional-team stage", async () => {
      await service.fetchModelAnswers();

      const questions = service.getQuestionsByStage("functional-team");

      expect(questions.length).toBe(1); // Q26
      expect(questions[0].qNumber).toBe(26);
    });

    it("should handle stage name variations", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getQuestionsByStage("phone-screening");
      const q2 = service.getQuestionsByStage("phone_screening");
      const q3 = service.getQuestionsByStage("screening");

      expect(q1.length).toBe(q2.length);
      expect(q2.length).toBe(q3.length);
    });

    it("should limit results when count parameter provided", async () => {
      await service.fetchModelAnswers();

      const questions = service.getQuestionsByStage("phone-screening", 1);

      expect(questions.length).toBe(1);
    });

    it("should return empty array for unknown stage", async () => {
      await service.fetchModelAnswers();

      const questions = service.getQuestionsByStage("invalid-stage");

      expect(questions.length).toBe(0);
    });

    it("should return empty array if not loaded", () => {
      const questions = service.getQuestionsByStage("phone-screening");

      expect(questions.length).toBe(0);
    });
  });

  describe("findModelAnswer", () => {
    it("should find exact match by question text", async () => {
      await service.fetchModelAnswers();

      const modelAnswer = service.findModelAnswer("Could you tell me about your current role?");

      expect(modelAnswer).toContain("My current role focuses on");
    });

    it("should handle case-insensitive matching", async () => {
      await service.fetchModelAnswers();

      const modelAnswer = service.findModelAnswer("COULD YOU TELL ME ABOUT YOUR CURRENT ROLE?");

      expect(modelAnswer).toContain("My current role focuses on");
    });

    it("should handle punctuation differences", async () => {
      await service.fetchModelAnswers();

      const modelAnswer = service.findModelAnswer("Could you tell me about your current role");

      expect(modelAnswer).toContain("My current role focuses on");
    });

    it("should use fuzzy matching for similar questions", async () => {
      await service.fetchModelAnswers();

      // Similar but not exact
      const modelAnswer = service.findModelAnswer("Can you tell me about your role?");

      // Should match with high enough similarity
      expect(modelAnswer).toBeTruthy();
    });

    it("should return null for very different questions", async () => {
      await service.fetchModelAnswers();

      const modelAnswer = service.findModelAnswer("What is the meaning of life?");

      expect(modelAnswer).toBeNull();
    });

    it("should respect similarity threshold", async () => {
      await service.fetchModelAnswers();

      // High threshold (0.9) - very strict matching
      const strictMatch = service.findModelAnswer("Can you tell me about your role?", 0.9);
      expect(strictMatch).toBeNull();

      // Low threshold (0.4) - lenient matching
      const lenientMatch = service.findModelAnswer("Can you tell me about your role?", 0.4);
      expect(lenientMatch).toBeTruthy();
    });

    it("should return null if service not loaded", () => {
      const modelAnswer = service.findModelAnswer("Any question");

      expect(modelAnswer).toBeNull();
    });
  });

  describe("getCuratedQuestion", () => {
    it("should return question by Q number", async () => {
      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);

      expect(q1).toBeTruthy();
      expect(q1?.qNumber).toBe(1);
      expect(q1?.question).toContain("current role");
    });

    it("should return null for non-existent Q number", async () => {
      await service.fetchModelAnswers();

      const q999 = service.getCuratedQuestion(999);

      expect(q999).toBeNull();
    });

    it("should return null if not loaded", () => {
      const q1 = service.getCuratedQuestion(1);

      expect(q1).toBeNull();
    });
  });

  describe("getRandomQuestionByStage", () => {
    it("should return a random question from stage", async () => {
      await service.fetchModelAnswers();

      const question = service.getRandomQuestionByStage("phone-screening");

      expect(question).toBeTruthy();
      expect(question?.stage).toBe("phone-screening");
    });

    it("should return different questions on multiple calls (statistically)", async () => {
      // Use a larger dataset for randomness test
      const largeCSV = `Q#,Question,Focus Area,Guided Model Answer Framework\n` +
        Array.from({ length: 25 }, (_, i) =>
          `${i + 1},"Question ${i + 1}","Focus","Answer ${i + 1}"`
        ).join('\n');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => largeCSV
      });

      await service.fetchModelAnswers();

      const results = new Set();
      for (let i = 0; i < 10; i++) {
        const q = service.getRandomQuestionByStage("phone-screening");
        if (q) results.add(q.qNumber);
      }

      // Should get at least 2 different questions in 10 tries (very likely with random selection)
      expect(results.size).toBeGreaterThan(1);
    });

    it("should return null for empty stage", async () => {
      await service.fetchModelAnswers();

      const question = service.getRandomQuestionByStage("invalid-stage");

      expect(question).toBeNull();
    });
  });

  describe("utility methods", () => {
    it("should return correct question count", async () => {
      await service.fetchModelAnswers();

      expect(service.getQuestionCount()).toBe(6);
    });

    it("should return 0 question count before loading", () => {
      expect(service.getQuestionCount()).toBe(0);
    });

    it("should indicate ready state correctly", async () => {
      expect(service.isReady()).toBe(false);

      await service.fetchModelAnswers();

      expect(service.isReady()).toBe(true);
    });

    it("should return all questions", async () => {
      await service.fetchModelAnswers();

      const allQuestions = service.getAllQuestions();

      expect(allQuestions.length).toBe(6);
      expect(allQuestions[0].qNumber).toBe(1);
    });

    it("should return copy of questions array (immutability)", async () => {
      await service.fetchModelAnswers();

      const questions1 = service.getAllQuestions();
      const questions2 = service.getAllQuestions();

      expect(questions1).not.toBe(questions2); // Different array instances
      expect(questions1).toEqual(questions2); // Same content
    });
  });

  describe("CSV parsing edge cases", () => {
    it("should handle quoted fields with commas", async () => {
      const csvWithCommas = `Q#,Question,Focus Area,Guided Model Answer Framework
1,"What is 2+2, exactly?","Math","The answer is 4, of course"`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvWithCommas
      });

      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      expect(q1?.question).toBe("What is 2+2, exactly?");
      expect(q1?.modelAnswer).toBe("The answer is 4, of course");
    });

    it("should handle escaped quotes in fields", async () => {
      const csvWithQuotes = `Q#,Question,Focus Area,Guided Model Answer Framework
1,"What is ""success""?","Philosophy","Success is ""achieving goals"""`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvWithQuotes
      });

      await service.fetchModelAnswers();

      const q1 = service.getCuratedQuestion(1);
      expect(q1?.question).toBe('What is "success"?');
    });

    it("should skip malformed lines", async () => {
      const csvWithBadLine = `Q#,Question,Focus Area,Guided Model Answer Framework
1,"Valid question","Focus","Answer"
InvalidLine
2,"Another valid","Focus 2","Answer 2"`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvWithBadLine
      });

      await service.fetchModelAnswers();

      // Should parse valid questions and skip invalid
      expect(service.getQuestionCount()).toBe(2);
    });

    it("should handle empty lines", async () => {
      const csvWithEmptyLines = `Q#,Question,Focus Area,Guided Model Answer Framework
1,"Question 1","Focus 1","Answer 1"

2,"Question 2","Focus 2","Answer 2"

`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvWithEmptyLines
      });

      await service.fetchModelAnswers();

      expect(service.getQuestionCount()).toBe(2);
    });
  });

  describe("concurrent loading", () => {
    it("should handle concurrent fetchModelAnswers calls", async () => {
      // Simulate slow fetch
      let resolveCount = 0;
      mockFetch.mockImplementation(() => new Promise(resolve => {
        resolveCount++;
        setTimeout(() => {
          resolve({
            ok: true,
            text: async () => sampleCSV
          });
        }, 50);
      }));

      // Make multiple concurrent calls
      await Promise.all([
        service.fetchModelAnswers(),
        service.fetchModelAnswers(),
        service.fetchModelAnswers()
      ]);

      // Should only fetch once (singleton pattern)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(service.getQuestionCount()).toBe(6);
    });
  });
});
