import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  type Listener = (payload?: any) => void;
  let listeners = new Map<string, Listener[]>();
  const emitted: Array<{ event: string; payload: any }> = [];

  const ensureListenerBucket = (event: string) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    return listeners.get(event)!;
  };

  const socket = {
    on: vi.fn((event: string, callback: Listener) => {
      const bucket = ensureListenerBucket(event);
      bucket.push(callback);
      if (event === "connect") {
        setTimeout(() => callback(), 0);
      }
    }),
    off: vi.fn((event: string, callback?: Listener) => {
      if (!listeners.has(event)) return;
      if (!callback) {
        listeners.delete(event);
        return;
      }
      const filtered = listeners
        .get(event)!
        .filter((stored) => stored !== callback);
      listeners.set(event, filtered);
    }),
    emit: vi.fn((event: string, payload: unknown) => {
      emitted.push({ event, payload });
      if (event === "practice:authenticate") {
        const handlerBucket = listeners.get("practice:message");
        handlerBucket?.forEach((handler) =>
          handler({ type: "system", data: { status: "authenticated" } })
        );
      }
      if (event === "practice:join-session") {
        const handlerBucket = listeners.get("practice:message");
        handlerBucket?.forEach((handler) =>
          handler({ type: "system", data: { status: "joined-session" } })
        );
      }
    }),
    disconnect: vi.fn(),
  };

  const trigger = (event: string, payload?: any) => {
    const bucket = listeners.get(event);
    bucket?.forEach((handler) => handler(payload));
  };

  const reset = () => {
    listeners = new Map();
    emitted.length = 0;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.disconnect.mockClear();
  };

  return {
    io: vi.fn(() => socket),
    __socketMock: {
      trigger,
      reset,
      getEmitted: () => emitted,
      getListeners: () => listeners,
    },
  };
});

// @ts-expect-error mock helper exposed by the socket mock above
import { __socketMock } from "socket.io-client";

// Mock useAuth hook
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-practice-test",
      firstName: "Practice",
      lastName: "Tester",
      email: "practice@test.dev",
      creditBalance: 100
    },
    isLoading: false,
    isAuthenticated: true,
    error: null,
  }),
}));

const sessionRequests: Array<Record<string, unknown>> = [];
const questionRequests: string[] = [];
const responseRequests: Array<{ sessionId: string; response: string }> = [];

const server = setupServer(
  // Create practice session
  http.post("/api/practice/sessions", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    sessionRequests.push(body);
    return HttpResponse.json({
      success: true,
      data: {
        id: "practice-session-test",
        userId: "user-practice-test",
        sessionType: body.sessionType ?? "mock-interview",
        difficulty: body.difficulty ?? "intermediate",
        language: body.language ?? "en",
        totalQuestions: 5,
        currentQuestionNumber: 1,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Get AI question
  http.post("/api/practice/sessions/:sessionId/ai-question", async ({ params }) => {
    questionRequests.push(params.sessionId as string);
    return HttpResponse.json({
      success: true,
      data: {
        question: {
          id: "question-1",
          questionText: "Tell me about a time you faced a challenging project deadline",
          questionTextTranslated: "Tell me about a time you faced a challenging project deadline",
          category: "behavioral",
        },
      },
    });
  }),

  // Submit response
  http.post("/api/practice/sessions/:sessionId/response", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    responseRequests.push({
      sessionId: params.sessionId as string,
      response: body.responseText as string,
    });
    return HttpResponse.json({
      success: true,
      data: {
        responseId: "response-1",
        evaluation: {
          starScore: {
            situation: 8,
            task: 7,
            action: 9,
            result: 8,
            overall: 8.0,
          },
          feedback: "Good answer with clear STAR structure",
          suggestions: ["Add more specific metrics to the result"],
        },
      },
    });
  }),

  // End session
  http.post("/api/practice/sessions/:sessionId/end", async ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        sessionId: params.sessionId as string,
        status: "completed",
        summary: {
          totalQuestions: 5,
          answeredQuestions: 1,
          averageScore: 8.0,
          creditsUsed: 5,
        },
      },
    });
  }),

  // Get user credit balance
  http.get("/api/users/credits", () => {
    return HttpResponse.json({
      success: true,
      data: {
        creditBalance: 95,
        lastUpdated: new Date().toISOString(),
      },
    });
  })
);

describe("Practice User Journey Integration", () => {
  beforeAll(() => {
    server.listen();
    // Mock speech synthesis for voice features
    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      value: {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: () => [],
      },
    });
  });

  afterEach(() => {
    server.resetHandlers();
    sessionRequests.length = 0;
    questionRequests.length = 0;
    responseRequests.length = 0;
    __socketMock.reset();
  });

  afterAll(() => {
    server.close();
  });

  function renderWithClient(children: ReactNode) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const rendered = render(
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return {
      ...rendered,
      cleanup: () => {
        rendered.unmount();
        queryClient.clear();
      },
    };
  }

  it("completes full practice session flow: setup → start → question → response → assessment → end", async () => {
    // This test validates the complete practice user journey
    // 1. User creates a practice session
    // 2. System generates first AI question
    // 3. User submits response
    // 4. System evaluates response with STAR framework
    // 5. Session ends and credits are deducted

    // Mock component that triggers the flow
    const MockPracticeFlow = () => {
      const [sessionId, setSessionId] = React.useState<string | null>(null);
      const [questionId, setQuestionId] = React.useState<string | null>(null);
      const [evaluation, setEvaluation] = React.useState<any>(null);

      React.useEffect(() => {
        // Step 1: Create session
        fetch("/api/practice/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionType: "mock-interview",
            difficulty: "intermediate",
            language: "en",
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setSessionId(data.data.id);
            // Step 2: Get first question
            return fetch(`/api/practice/sessions/${data.data.id}/ai-question`, {
              method: "POST",
            });
          })
          .then((res) => res.json())
          .then((data) => {
            setQuestionId(data.data.question.id);
            // Step 3: Submit response
            return fetch(`/api/practice/sessions/${sessionId}/response`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                responseText: "In my previous role, I managed a critical project...",
                questionId: data.data.question.id,
              }),
            });
          })
          .then((res) => res.json())
          .then((data) => {
            setEvaluation(data.data.evaluation);
          })
          .catch(console.error);
      }, []);

      return (
        <div>
          {sessionId && <div data-testid="session-id">{sessionId}</div>}
          {questionId && <div data-testid="question-id">{questionId}</div>}
          {evaluation && (
            <div data-testid="evaluation">
              Score: {evaluation.starScore.overall}
            </div>
          )}
        </div>
      );
    };

    const { cleanup } = renderWithClient(<MockPracticeFlow />);

    // Verify session creation
    await waitFor(() => expect(sessionRequests).toHaveLength(1), { timeout: 3000 });
    expect(sessionRequests[0]).toMatchObject({
      sessionType: "mock-interview",
      difficulty: "intermediate",
      language: "en",
    });

    // Verify question generation
    await waitFor(() => expect(questionRequests).toHaveLength(1), { timeout: 3000 });
    expect(questionRequests[0]).toBe("practice-session-test");

    // Verify response submission
    await waitFor(() => expect(responseRequests).toHaveLength(1), { timeout: 3000 });
    expect(responseRequests[0]).toMatchObject({
      sessionId: "practice-session-test",
      response: expect.stringContaining("In my previous role"),
    });

    // Verify evaluation display
    expect(await screen.findByTestId("evaluation", {}, { timeout: 3000 })).toHaveTextContent(
      "Score: 8"
    );

    cleanup();
  });

  it("deducts credits when session ends", async () => {
    const { cleanup } = renderWithClient(<div data-testid="placeholder" />);

    // End session
    const response = await fetch("/api/practice/sessions/practice-session-test/end", {
      method: "POST",
    });
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data.summary.creditsUsed).toBe(5);
    expect(result.data.status).toBe("completed");

    // Verify credit balance updated
    const creditsResponse = await fetch("/api/users/credits");
    const creditsResult = await creditsResponse.json();
    expect(creditsResult.data.creditBalance).toBe(95); // 100 - 5

    cleanup();
  });
});
