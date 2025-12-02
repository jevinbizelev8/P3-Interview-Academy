import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import TeamDynamicsGame from '@/components/prepare/interactive/TeamDynamicsGame';

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

describe('TeamDynamicsGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<TeamDynamicsGame />);

    expect(screen.getByText(/Team Collaboration & Cross-Functional Skills/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting scenario answers', async () => {
    const user = userEvent.setup();
    render(<TeamDynamicsGame />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Start Scenarios/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Collaboration Scenario/i)).toBeInTheDocument();
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

  it('should manage state correctly - tracking answers and score', async () => {
    const user = userEvent.setup();
    render(<TeamDynamicsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Scenarios/i }));

    await waitFor(() => {
      expect(screen.getByText(/Collaboration Scenario/i)).toBeInTheDocument();
    });

    // Check initial score
    expect(screen.getByText(/0 points/i)).toBeInTheDocument();

    // Select correct answer (option B)
    const optionB = screen.getAllByRole('button', { name: /^B$/i })[0];
    await user.click(optionB);

    // Score should increase after correct answer
    await waitFor(() => {
      expect(screen.getByText(/20 points/i)).toBeInTheDocument();
    });
  });

  it('should validate user choices - providing feedback on team dynamics', async () => {
    const user = userEvent.setup();
    render(<TeamDynamicsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Scenarios/i }));

    await waitFor(() => {
      expect(screen.getByText(/Collaboration Scenario/i)).toBeInTheDocument();
    });

    // Select wrong answer (option A)
    const optionA = screen.getAllByRole('button', { name: /^A$/i })[0];
    await user.click(optionA);

    // Should show negative feedback
    await waitFor(() => {
      expect(screen.getByText(/❌/i)).toBeInTheDocument();
      expect(screen.getByText(/Too dismissive|doesn't seek collaboration/i)).toBeInTheDocument();
    });

    // Move to next scenario
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Select correct answer on next scenario
    await waitFor(() => {
      expect(screen.getByText(/Communication Style/i)).toBeInTheDocument();
    });

    const optionC = screen.getAllByRole('button', { name: /^C$/i })[0]; // Option C often correct
    await user.click(optionC);

    // Should show positive feedback
    await waitFor(() => {
      expect(screen.getByText(/✅/i)).toBeInTheDocument();
    });
  });

  it('should display team scenario situations clearly', async () => {
    const user = userEvent.setup();
    render(<TeamDynamicsGame />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Scenarios/i }));

    await waitFor(() => {
      expect(screen.getByText(/Collaboration Scenario/i)).toBeInTheDocument();
    });

    // Scenario situation should be displayed
    expect(screen.getByText(/working on a feature with the design team/i)).toBeInTheDocument();
    expect(screen.getByText(/How do you handle this\?/i)).toBeInTheDocument();
  });

  it('should trigger completion callback when all scenarios completed', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<TeamDynamicsGame onComplete={mockOnComplete} />);

    // Complete the game
    await user.click(screen.getByRole('button', { name: /Start Scenarios/i }));

    await waitFor(() => {
      expect(screen.getByText(/Collaboration Scenario/i)).toBeInTheDocument();
    });

    // Answer multiple scenarios
    const totalScenarios = 5; // Based on typical team dynamics structure

    for (let i = 0; i < totalScenarios; i++) {
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
