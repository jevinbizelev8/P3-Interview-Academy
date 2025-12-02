/**
 * OpenAI Test Helpers
 *
 * Comprehensive utilities for testing OpenAI/AI service integration:
 * - Mock AI responses
 * - Mock streaming responses
 * - Simulate AI errors
 * - Pre-defined mock questions and answers
 * - Token usage simulation
 *
 * @module openai-helpers
 */

import { vi } from 'vitest';

/**
 * Mock interview questions for testing
 */
export const MOCK_QUESTIONS = {
  BEHAVIORAL: {
    question: "Tell me about a time when you had to work with a difficult team member.",
    difficulty: "medium",
    category: "behavioral",
    expectedAnswerStructure: ["situation", "task", "action", "result"],
  },
  TECHNICAL: {
    question: "Explain the concept of dependency injection and its benefits.",
    difficulty: "medium",
    category: "technical",
    keywords: ["dependency", "injection", "loose coupling", "testability"],
  },
  LEADERSHIP: {
    question: "Describe a situation where you had to make a difficult decision as a leader.",
    difficulty: "hard",
    category: "leadership",
    expectedAnswerStructure: ["situation", "decision", "reasoning", "outcome"],
  },
  PROBLEM_SOLVING: {
    question: "How would you approach debugging a production issue under time pressure?",
    difficulty: "medium",
    category: "problem-solving",
    keywords: ["systematic", "prioritization", "communication", "root cause"],
  },
  CAREER: {
    question: "What are your career goals for the next 3-5 years?",
    difficulty: "easy",
    category: "career",
    keywords: ["growth", "learning", "impact", "leadership"],
  },
} as const;

/**
 * Mock AI answers (STAR format)
 */
export const MOCK_ANSWERS = {
  GOOD_STAR: {
    situation: "In my previous role, our team was behind schedule on a critical project.",
    task: "I needed to coordinate with stakeholders and reallocate resources.",
    action: "I organized daily standup meetings, identified blockers, and delegated tasks based on team strengths.",
    result: "We delivered the project on time and improved team collaboration by 40%.",
    full: "In my previous role, our team was behind schedule on a critical project. I needed to coordinate with stakeholders and reallocate resources. I organized daily standup meetings, identified blockers, and delegated tasks based on team strengths. We delivered the project on time and improved team collaboration by 40%.",
  },
  POOR_ANSWER: {
    full: "I would try to handle it. I think communication is important.",
  },
  EXCELLENT_ANSWER: {
    full: "When I joined my current company, we were struggling with code quality issues. As the senior developer, I was tasked with improving our development process. I introduced code review practices, set up automated testing, and mentored junior developers on best practices. Within six months, our bug rate decreased by 60% and deployment frequency increased by 3x.",
  },
} as const;

/**
 * Mock OpenAI chat completion response
 *
 * @param content - Response content
 * @param model - Model name (default: 'gpt-4')
 * @param tokens - Token usage (default: reasonable estimates)
 * @returns Mock OpenAI response object
 *
 * @example
 * const response = mockOpenAIResponse("This is a great answer!");
 */
export function mockOpenAIResponse(
  content: string,
  model: string = 'gpt-4',
  tokens?: { prompt: number; completion: number; total: number }
): any {
  const defaultTokens = {
    prompt: Math.ceil(content.length / 4) + 100,
    completion: Math.ceil(content.length / 4),
    total: Math.ceil(content.length / 2) + 100,
  };

  const usage = tokens || defaultTokens;

  return {
    id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: usage.prompt,
      completion_tokens: usage.completion,
      total_tokens: usage.total,
    },
  };
}

/**
 * Mock streaming OpenAI response
 * Returns an async generator that yields chunks
 *
 * @param content - Full response content to stream
 * @param chunkSize - Size of each chunk (default: 10 characters)
 * @param delayMs - Delay between chunks in ms (default: 10ms)
 * @returns Async generator yielding response chunks
 *
 * @example
 * const stream = mockStreamingResponse("This is a streaming response");
 * for await (const chunk of stream) {
 *   console.log(chunk.choices[0]?.delta?.content);
 * }
 */
export async function* mockStreamingResponse(
  content: string,
  chunkSize: number = 10,
  delayMs: number = 10
): AsyncGenerator<any, void, unknown> {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield {
      id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          delta: {
            content: chunks[i],
          },
          finish_reason: i === chunks.length - 1 ? 'stop' : null,
        },
      ],
    };
  }
}

/**
 * Simulate various AI service errors
 *
 * @param errorType - Type of error to simulate
 * @returns Error object matching the specified type
 *
 * @example
 * mockOpenAI.chat.completions.create.mockRejectedValue(
 *   simulateAIError('rate_limit')
 * );
 */
export function simulateAIError(
  errorType: 'rate_limit' | 'timeout' | 'invalid_request' | 'api_error' | 'network_error' | 'authentication'
): Error {
  const errors = {
    rate_limit: {
      message: 'Rate limit exceeded. Please try again later.',
      type: 'rate_limit_error',
      statusCode: 429,
    },
    timeout: {
      message: 'Request timed out. Please try again.',
      type: 'timeout',
      statusCode: 408,
    },
    invalid_request: {
      message: 'Invalid request parameters.',
      type: 'invalid_request_error',
      statusCode: 400,
    },
    api_error: {
      message: 'An error occurred with the API.',
      type: 'api_error',
      statusCode: 500,
    },
    network_error: {
      message: 'Network connection failed.',
      type: 'network_error',
      statusCode: 503,
    },
    authentication: {
      message: 'Invalid API key.',
      type: 'authentication_error',
      statusCode: 401,
    },
  };

  const errorConfig = errors[errorType];
  const error: any = new Error(errorConfig.message);
  error.type = errorConfig.type;
  error.statusCode = errorConfig.statusCode;
  return error;
}

/**
 * Create a mock OpenAI client for testing
 *
 * @returns Mock OpenAI client with common methods
 *
 * @example
 * const mockOpenAI = createMockOpenAIClient();
 * mockOpenAI.chat.completions.create.mockResolvedValue(
 *   mockOpenAIResponse("Great answer!")
 * );
 */
export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    models: {
      list: vi.fn(),
      retrieve: vi.fn(),
    },
    embeddings: {
      create: vi.fn(),
    },
  };
}

/**
 * Mock interview question generation response
 *
 * @param jobRole - Job role for questions
 * @param difficulty - Difficulty level
 * @param count - Number of questions (default: 5)
 * @returns Mock question generation response
 *
 * @example
 * const questions = mockQuestionGeneration('Software Engineer', 'medium', 5);
 */
export function mockQuestionGeneration(
  jobRole: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 5
): {
  questions: Array<{
    id: string;
    text: string;
    category: string;
    difficulty: string;
    expectedKeywords: string[];
  }>;
} {
  const categories = ['behavioral', 'technical', 'problem-solving', 'leadership', 'career'];
  const questions = [];

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `q-${i + 1}`,
      text: `Sample ${difficulty} question ${i + 1} for ${jobRole}`,
      category: categories[i % categories.length],
      difficulty,
      expectedKeywords: ['keyword1', 'keyword2', 'keyword3'],
    });
  }

  return { questions };
}

/**
 * Mock STAR evaluation response
 *
 * @param answer - User's answer text
 * @param score - Overall score (0-100)
 * @returns Mock STAR evaluation
 *
 * @example
 * const evaluation = mockSTAREvaluation(MOCK_ANSWERS.GOOD_STAR.full, 85);
 */
export function mockSTAREvaluation(
  answer: string,
  score: number = 75
): {
  overallScore: number;
  components: {
    situation: { present: boolean; score: number; feedback: string };
    task: { present: boolean; score: number; feedback: string };
    action: { present: boolean; score: number; feedback: string };
    result: { present: boolean; score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  feedback: string;
} {
  return {
    overallScore: score,
    components: {
      situation: {
        present: true,
        score: score,
        feedback: "Good context provided",
      },
      task: {
        present: true,
        score: score - 5,
        feedback: "Clear task definition",
      },
      action: {
        present: true,
        score: score + 5,
        feedback: "Detailed action steps",
      },
      result: {
        present: true,
        score: score,
        feedback: "Measurable outcomes",
      },
    },
    strengths: [
      "Clear structure",
      "Specific examples",
      "Measurable results",
    ],
    improvements: [
      "Add more detail to the situation",
      "Quantify the impact further",
    ],
    feedback: "Overall good answer following the STAR method. Consider adding more specific metrics.",
  };
}

/**
 * Mock feedback generation response
 *
 * @param answerQuality - Quality of the answer ('poor' | 'good' | 'excellent')
 * @returns Mock AI feedback
 *
 * @example
 * const feedback = mockFeedbackGeneration('excellent');
 */
export function mockFeedbackGeneration(
  answerQuality: 'poor' | 'good' | 'excellent'
): {
  summary: string;
  detailedFeedback: string;
  score: number;
  suggestions: string[];
} {
  const feedbackMap = {
    poor: {
      summary: "Your answer needs more structure and detail.",
      detailedFeedback: "The answer lacks the STAR structure and doesn't provide enough context or measurable results. Consider providing a specific situation, task, your actions, and the results.",
      score: 45,
      suggestions: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Provide specific examples",
        "Include measurable outcomes",
        "Add more detail about your role",
      ],
    },
    good: {
      summary: "Good answer with room for improvement.",
      detailedFeedback: "Your answer follows a good structure and provides relevant information. To make it excellent, consider adding more specific metrics and elaborating on the challenges you faced.",
      score: 75,
      suggestions: [
        "Add more quantifiable results",
        "Elaborate on challenges faced",
        "Provide more context about the team",
      ],
    },
    excellent: {
      summary: "Excellent answer demonstrating strong communication.",
      detailedFeedback: "Your answer excellently demonstrates the STAR method with clear structure, specific examples, and measurable outcomes. This is exactly what interviewers are looking for.",
      score: 95,
      suggestions: [
        "Maintain this level of detail",
        "Consider varying your examples",
      ],
    },
  };

  return feedbackMap[answerQuality];
}

/**
 * Mock model answer generation
 *
 * @param question - Interview question
 * @param jobRole - Job role context
 * @returns Mock model answer
 *
 * @example
 * const modelAnswer = mockModelAnswerGeneration(
 *   MOCK_QUESTIONS.BEHAVIORAL.question,
 *   'Software Engineer'
 * );
 */
export function mockModelAnswerGeneration(
  question: string,
  jobRole: string
): {
  modelAnswer: string;
  keyPoints: string[];
  structure: string[];
  tips: string[];
} {
  return {
    modelAnswer: "In my previous role as a software engineer, our team faced a critical production bug affecting 10,000 users. I was responsible for identifying and fixing the issue within 4 hours. I immediately gathered logs, reproduced the issue locally, identified the root cause in our caching layer, deployed a fix, and monitored metrics. The issue was resolved in 2.5 hours with zero data loss, and I implemented additional monitoring to prevent similar issues.",
    keyPoints: [
      "Specific situation with impact metrics",
      "Clear task and responsibility",
      "Systematic problem-solving approach",
      "Measurable positive outcome",
      "Proactive follow-up action",
    ],
    structure: [
      "Situation: Production bug affecting users",
      "Task: Fix within 4 hours",
      "Action: Systematic debugging and deployment",
      "Result: Resolved in 2.5 hours, improved monitoring",
    ],
    tips: [
      "Always include specific numbers and metrics",
      "Show your problem-solving process",
      "Demonstrate ownership and initiative",
      "Mention lessons learned or improvements made",
    ],
  };
}

/**
 * Create mock token usage data
 *
 * @param inputLength - Approximate input length
 * @param outputLength - Approximate output length
 * @returns Mock token usage object
 *
 * @example
 * const usage = mockTokenUsage(1000, 500);
 */
export function mockTokenUsage(
  inputLength: number = 1000,
  outputLength: number = 500
): {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
} {
  const promptTokens = Math.ceil(inputLength / 4);
  const completionTokens = Math.ceil(outputLength / 4);
  const totalTokens = promptTokens + completionTokens;

  // GPT-4 pricing: ~$0.03 per 1K prompt tokens, ~$0.06 per 1K completion tokens
  const estimatedCost = (promptTokens * 0.03 + completionTokens * 0.06) / 1000;

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    estimated_cost: Number(estimatedCost.toFixed(4)),
  };
}

/**
 * Mock AI service response with delay simulation
 *
 * @param content - Response content
 * @param delayMs - Simulated API delay in ms (default: 1000ms)
 * @returns Promise resolving to mock response after delay
 *
 * @example
 * const response = await mockDelayedResponse("AI response", 2000);
 */
export async function mockDelayedResponse(
  content: string,
  delayMs: number = 1000
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return mockOpenAIResponse(content);
}

/**
 * Create mock AI conversation history
 *
 * @param turns - Number of conversation turns
 * @returns Array of mock messages
 *
 * @example
 * const history = mockConversationHistory(3);
 */
export function mockConversationHistory(turns: number = 3): Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}> {
  const history = [];

  for (let i = 0; i < turns; i++) {
    history.push(
      {
        role: 'user' as const,
        content: `User question ${i + 1}`,
        timestamp: new Date(Date.now() - (turns - i) * 60000),
      },
      {
        role: 'assistant' as const,
        content: `AI response ${i + 1}`,
        timestamp: new Date(Date.now() - (turns - i) * 60000 + 5000),
      }
    );
  }

  return history;
}
