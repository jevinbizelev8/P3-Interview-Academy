import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import TechnicalFrameworkGame from '@/components/prepare/interactive/TechnicalFrameworkGame';

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

describe('TechnicalFrameworkGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<TechnicalFrameworkGame />);

    expect(screen.getByText(/Technical Problem-Solving Framework/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting answer options', async () => {
    const user = userEvent.setup();
    render(<TechnicalFrameworkGame />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Start Practice/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/How do you approach a technical problem/i)).toBeInTheDocument();
    });

    // Select an answer option
    const optionButtons = screen.getAllByRole('button', { name: /^[ABC]$/i });
    expect(optionButtons.length).toBeGreaterThan(0);
    await user.click(optionButtons[1]); // Select option B (usually correct)

    // Feedback should appear
    await waitFor(() => {
      expect(screen.getByText(/✅|❌/i)).toBeInTheDocument();
    });
  });

  it('should manage state correctly - tracking score and answers', async () => {
    const user = userEvent.setup();
    render(<TechnicalFrameworkGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Practice/i }));

    await waitFor(() => {
      expect(screen.getByText(/How do you approach/i)).toBeInTheDocument();
    });

    // Check initial score
    expect(screen.getByText(/0 points/i)).toBeInTheDocument();

    // Select correct answer (option B)
    const optionB = screen.getAllByRole('button', { name: /^B$/i })[0];
    await user.click(optionB);

    // Score should increase
    await waitFor(() => {
      expect(screen.getByText(/20 points/i)).toBeInTheDocument();
    });
  });

  it('should validate answers - providing correct feedback', async () => {
    const user = userEvent.setup();
    render(<TechnicalFrameworkGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Practice/i }));

    await waitFor(() => {
      expect(screen.getByText(/How do you approach/i)).toBeInTheDocument();
    });

    // Select wrong answer (option A)
    const optionA = screen.getAllByRole('button', { name: /^A$/i })[0];
    await user.click(optionA);

    // Should show negative feedback
    await waitFor(() => {
      expect(screen.getByText(/❌/i)).toBeInTheDocument();
      expect(screen.getByText(/Too hasty/i)).toBeInTheDocument();
    });

    // Move to next question
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Select correct answer on next question (option B)
    await waitFor(() => {
      expect(screen.getByText(/Your solution works but is slow/i)).toBeInTheDocument();
    });

    const optionB = screen.getAllByRole('button', { name: /^B$/i })[0];
    await user.click(optionB);

    // Should show positive feedback
    await waitFor(() => {
      expect(screen.getByText(/✅/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent!/i)).toBeInTheDocument();
    });
  });

  it('should display framework steps and guidance', async () => {
    const user = userEvent.setup();
    render(<TechnicalFrameworkGame />);

    // Framework introduction should be visible initially
    expect(screen.getByText(/Technical Problem-Solving Framework/i)).toBeInTheDocument();

    // Start the game to see if guidance continues
    await user.click(screen.getByRole('button', { name: /Start Practice/i }));

    await waitFor(() => {
      expect(screen.getByText(/How do you approach/i)).toBeInTheDocument();
    });

    // Question should be displayed
    expect(screen.getByText(/technical problem/i)).toBeInTheDocument();
  });

  it('should trigger completion callback when all scenarios are answered', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<TechnicalFrameworkGame onComplete={mockOnComplete} />);

    // Complete the game
    await user.click(screen.getByRole('button', { name: /Start Practice/i }));

    await waitFor(() => {
      expect(screen.getByText(/How do you approach/i)).toBeInTheDocument();
    });

    // Answer multiple questions
    const totalQuestions = 4; // Based on typical technical framework structure

    for (let i = 0; i < totalQuestions; i++) {
      // Select an answer
      const optionButtons = screen.getAllByRole('button', { name: /^[ABC]$/i });
      if (optionButtons.length > 0) {
        await user.click(optionButtons[1]); // Select option B (usually correct)
      }

      await waitFor(() => {
        const nextButton = screen.queryByRole('button', { name: /Next/i });
        const finishButton = screen.queryByRole('button', { name: /Complete|Finish/i });

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
