import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import PrepareAIInterface from "@/components/prepare-ai/PrepareAIInterface";
import type { ReactNode } from "react";

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
      if (event === "prepare:authenticate") {
        const handlerBucket = listeners.get("prepare:message");
        handlerBucket?.forEach((handler) =>
          handler({ type: "system", data: { status: "authenticated" } })
        );
      }
      if (event === "prepare:join-session") {
        const handlerBucket = listeners.get("prepare:message");
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

vi.mock("@/components/prepare-ai/VoiceControls", () => ({
  default: () => null,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-prepare", firstName: "Prepare", lastName: "Tester", email: "prepare@test.dev" },
    isLoading: false,
    isAuthenticated: true,
    error: null,
  }),
}));

const sessionRequests: Array<Record<string, unknown>> = [];
const questionRequests: string[] = [];

const server = setupServer(
  http.post("/api/prepare-ai/sessions", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    sessionRequests.push(body);
    return HttpResponse.json({
      success: true,
      data: {
        id: "prepare-session-test",
        userId: "user-prepare",
        preferredLanguage: body.preferredLanguage ?? "en",
        voiceEnabled: body.voiceEnabled ?? false,
      },
    });
  }),
  http.post("/api/prepare-ai/sessions/:sessionId/question", async ({ params }) => {
    questionRequests.push(params.sessionId as string);
    return HttpResponse.json({
      success: true,
      data: {
        question: {
          id: "question-1",
          questionText: "Tell me about yourself",
          questionTextTranslated: "Tell me about yourself",
        },
      },
    });
  })
);

describe("PrepareAIInterface integration", () => {
  beforeAll(() => {
    server.listen();
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
    __socketMock.reset();
  });

  afterAll(() => {
    server.close();
  });

  function renderWithClient(children: ReactNode) {
    const queryClient = new QueryClient();
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

  it("creates a prepare session, kicks off the first question, and renders it", async () => {
    const { cleanup } = renderWithClient(
      <PrepareAIInterface
        sessionConfig={{
          jobTitle: "Product Manager",
          companyName: "Acme",
          interviewStage: "functional-team",
          language: "en",
          voiceEnabled: false,
        }}
      />
    );

    await waitFor(() => expect(sessionRequests).toHaveLength(1));
    expect(sessionRequests[0]).toMatchObject({
      jobPosition: "Product Manager",
      companyName: "Acme",
      interviewStage: "functional-team",
      preferredLanguage: "en",
      voiceEnabled: false,
    });

    await waitFor(() => expect(questionRequests).toContain("prepare-session-test"));

    await act(async () => {
      __socketMock.trigger("question-generated", {
        question: "Tell me about yourself",
        questionId: "question-1",
      });
    });

    expect(
      await screen.findByText("Tell me about yourself", { exact: false })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Waiting for AI to generate your first question...")
    ).not.toBeInTheDocument();

    cleanup();
  });
});
