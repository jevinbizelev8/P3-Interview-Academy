import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import Dashboard from "@/pages/perform/dashboard";
import type { ReactNode } from "react";

const server = setupServer(
  http.get("/api/perform/dashboard", () =>
    HttpResponse.json({
      totalSessions: 12,
      completedSessions: 10,
      totalQuestions: 42,
      averageScore: 4.2,
      averageStarScore: 4.2,
      totalPracticeTime: 180,
      improvementRate: 15,
      voiceUsagePercent: 30,
      strongestSkills: ["Communication"],
      improvementAreas: ["Add metrics"],
      recentSessions: [
        {
          id: "recent-1",
          date: "01/02/2025",
          scenario: "Practice Session",
          sessionType: "Practice" as const,
          score: 4,
          duration: 10,
          questionsAnswered: 3,
          voiceEnabled: true,
        },
      ],
      performanceTrends: [],
      skillBreakdown: [],
      interviewSessions: 3,
      practiceSessions: 7,
      practiceQuestions: 25,
      sessionTypeBreakdown: [
        { type: "Interview" as const, count: 3, percentage: 30 },
        { type: "Practice" as const, count: 7, percentage: 70 },
        { type: "Prepare" as const, count: 2, percentage: 20 },
      ],
    })
  )
);

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("Perform dashboard", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  function renderDashboard() {
    const queryClient = new QueryClient();
    const view = render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    return { queryClient, ...view };
  }

  it("surfaces practice and prepare metrics from the API", async () => {
    const { queryClient, unmount } = renderDashboard();

    const [practiceLabel] = await screen.findAllByText("Practice Sessions");
    const practiceRow = practiceLabel.closest("div")?.parentElement;
    await waitFor(() => {
      expect(practiceRow?.textContent).toContain("7");
    });

    const [prepareLabel] = await screen.findAllByText("AI Prepare Sessions");
    const prepareRow = prepareLabel.closest("div")?.parentElement;
    await waitFor(() => {
      expect(prepareRow?.textContent).toContain("2");
    });

    unmount();
    queryClient.clear();
  });
});


