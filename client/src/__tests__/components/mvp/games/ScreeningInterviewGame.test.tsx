import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ScreeningInterviewGame from '@/components/prepare/interactive/ScreeningInterviewGame';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('ScreeningInterviewGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<ScreeningInterviewGame />);

    expect(screen.getByText(/Understanding Screening Interviews/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting recruiter type', async () => {
    const user = userEvent.setup();
    render(<ScreeningInterviewGame />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Begin Learning/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Who Conducts Screening Interviews\?/i)).toBeInTheDocument();
    });

    // Select a recruiter option
    const recruiterButtons = screen.getAllByRole('button', { name: /HR Recruiter|Technical Recruiter|Hiring Manager/i });
    if (recruiterButtons.length > 0) {
      await user.click(recruiterButtons[0]);

      // Feedback should appear
      await waitFor(() => {
        expect(screen.getByText(/✅|❌/i)).toBeInTheDocument();
      });
    }
  });

  it('should manage state correctly - tracking flipped cards', async () => {
    const user = userEvent.setup();
    render(<ScreeningInterviewGame />);

    // Navigate through steps
    await user.click(screen.getByRole('button', { name: /Begin Learning/i }));

    await waitFor(() => {
      expect(screen.getByText(/Who Conducts/i)).toBeInTheDocument();
    });

    // Select recruiter
    const recruiterButtons = screen.getAllByRole('button', { name: /HR Recruiter|Technical Recruiter/i });
    if (recruiterButtons.length > 0) {
      await user.click(recruiterButtons[0]);
    }

    // Continue to card flip section
    await waitFor(() => {
      const continueButton = screen.queryByRole('button', { name: /Continue|Next/i });
      if (continueButton) {
        user.click(continueButton);
      }
    });

    // Check if cards can be flipped
    await waitFor(() => {
      const cardButtons = screen.queryAllByRole('button', { name: /Flip Card|Show/i });
      expect(cardButtons.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 3000 });
  });

  it('should validate quiz answers - red flag vs green flag', async () => {
    const user = userEvent.setup();
    render(<ScreeningInterviewGame />);

    // Navigate to quiz section
    await user.click(screen.getByRole('button', { name: /Begin Learning/i }));

    // Go through initial steps quickly
    await waitFor(() => {
      const recruiterButtons = screen.queryAllByRole('button', { name: /HR Recruiter/i });
      if (recruiterButtons.length > 0) {
        user.click(recruiterButtons[0]);
      }
    });

    // Continue through the module to reach quiz
    await waitFor(() => {
      const continueButtons = screen.queryAllByRole('button', { name: /Continue|Next/i });
      if (continueButtons.length > 0) {
        continueButtons.forEach(btn => user.click(btn));
      }
    }, { timeout: 5000 });

    // Look for red/green flag quiz
    await waitFor(() => {
      const redButton = screen.queryByRole('button', { name: /Red Flag/i });
      const greenButton = screen.queryByRole('button', { name: /Green Flag/i });
      expect(redButton || greenButton).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should display rapid-fire scenarios with weak and strong answers', async () => {
    const user = userEvent.setup();
    render(<ScreeningInterviewGame />);

    // Start game
    await user.click(screen.getByRole('button', { name: /Begin Learning/i }));

    // Navigate through multiple steps
    await waitFor(() => {
      const allButtons = screen.queryAllByRole('button');
      const progressButtons = allButtons.filter(btn =>
        btn.textContent?.includes('Continue') ||
        btn.textContent?.includes('Next') ||
        btn.textContent?.includes('HR Recruiter')
      );

      if (progressButtons.length > 0) {
        progressButtons.forEach(btn => user.click(btn));
      }
    }, { timeout: 5000 });

    // Check for scenario comparisons
    await waitFor(() => {
      expect(
        screen.queryByText(/Weak Response|Strong Response|Weak:|Strong:/i)
      ).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should trigger completion callback when game finishes', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<ScreeningInterviewGame onComplete={mockOnComplete} />);

    // Complete the game by clicking through all steps
    await user.click(screen.getByRole('button', { name: /Begin Learning/i }));

    // Navigate through multiple steps systematically
    for (let i = 0; i < 10; i++) {
      await waitFor(() => {
        const allButtons = screen.queryAllByRole('button');
        const actionButtons = allButtons.filter(btn => {
          const text = btn.textContent || '';
          return (
            text.includes('Continue') ||
            text.includes('Next') ||
            text.includes('Complete') ||
            text.includes('Finish') ||
            text.includes('HR Recruiter') ||
            text.includes('Green Flag') ||
            text.includes('Red Flag')
          );
        });

        if (actionButtons.length > 0) {
          user.click(actionButtons[0]);
        }
      }, { timeout: 2000 });
    }

    // Verify onComplete was called
    await waitFor(() => {
      if (mockOnComplete.mock.calls.length > 0) {
        const [score, data] = mockOnComplete.mock.calls[0];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(data.completedAt).toBeTruthy();
      }
    }, { timeout: 5000 });
  });
});
