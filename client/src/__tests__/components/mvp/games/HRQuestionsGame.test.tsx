import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import HRQuestionsGame from '@/components/prepare/interactive/HRQuestionsGame';

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
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('HRQuestionsGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<HRQuestionsGame />);

    expect(screen.getByText(/Common HR\/Recruiter Questions/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting answers', async () => {
    const user = userEvent.setup();
    render(<HRQuestionsGame />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Start Challenge/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself/i)).toBeInTheDocument();
    });

    // Select an answer option
    const answerButtons = screen.getAllByRole('button', { name: /^[AB]$/i });
    expect(answerButtons.length).toBeGreaterThan(0);
    await user.click(answerButtons[0]);

    // Feedback should appear
    await waitFor(() => {
      expect(screen.getByText(/❌|✅/i)).toBeInTheDocument();
    });
  });

  it('should manage state correctly - tracking score and progress', async () => {
    const user = userEvent.setup();
    render(<HRQuestionsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Challenge/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself/i)).toBeInTheDocument();
    });

    // Check initial score display
    expect(screen.getByText(/0 points/i)).toBeInTheDocument();

    // Select the correct answer (option B is usually correct based on component structure)
    const answerButtons = screen.getAllByRole('button', { name: /^B$/i });
    await user.click(answerButtons[0]);

    // Score should increase after correct answer
    await waitFor(() => {
      expect(screen.getByText(/20 points/i)).toBeInTheDocument();
    });
  });

  it('should validate user input - providing feedback on answers', async () => {
    const user = userEvent.setup();
    render(<HRQuestionsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Challenge/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself/i)).toBeInTheDocument();
    });

    // Select option A (incorrect based on component)
    const optionA = screen.getAllByRole('button', { name: /^A$/i })[0];
    await user.click(optionA);

    // Should show negative feedback
    await waitFor(() => {
      expect(screen.getByText(/❌/i)).toBeInTheDocument();
      expect(screen.getByText(/Too vague/i)).toBeInTheDocument();
    });

    // Navigate to next question
    const nextButton = screen.getByRole('button', { name: /Next Question/i });
    await user.click(nextButton);

    // Select option B (correct)
    await waitFor(() => {
      expect(screen.getByText(/Why are you leaving/i)).toBeInTheDocument();
    });

    const optionB = screen.getAllByRole('button', { name: /^B$/i })[0];
    await user.click(optionB);

    // Should show positive feedback
    await waitFor(() => {
      expect(screen.getByText(/✅/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent!/i)).toBeInTheDocument();
    });
  });

  it('should display tips and guidance for each question', async () => {
    const user = userEvent.setup();
    render(<HRQuestionsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Challenge/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself/i)).toBeInTheDocument();
    });

    // Tips should be displayed
    expect(screen.getByText(/Start with your current role/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep it under 90 seconds/i)).toBeInTheDocument();
  });

  it('should trigger completion callback when game finishes', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<HRQuestionsGame onComplete={mockOnComplete} />);

    // Start and complete all questions
    await user.click(screen.getByRole('button', { name: /Start Challenge/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself/i)).toBeInTheDocument();
    });

    // Answer all questions (component has multiple questions)
    const totalQuestions = 5; // Based on typical HR questions game structure

    for (let i = 0; i < totalQuestions; i++) {
      // Select an answer
      const answerButtons = screen.getAllByRole('button', { name: /^[AB]$/i });
      if (answerButtons.length > 0) {
        await user.click(answerButtons[0]);
      }

      // Move to next question or finish
      await waitFor(() => {
        const nextButton = screen.queryByRole('button', { name: /Next Question/i });
        const finishButton = screen.queryByRole('button', { name: /Complete Challenge|Finish/i });

        if (nextButton) {
          user.click(nextButton);
        } else if (finishButton) {
          user.click(finishButton);
        }
      });
    }

    // Verify onComplete was called
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});
