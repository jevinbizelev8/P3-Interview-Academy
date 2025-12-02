import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ExecutivePresenceBuilder from '@/components/prepare/interactive/ExecutivePresenceBuilder';

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

describe('ExecutivePresenceBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<ExecutivePresenceBuilder />);

    expect(screen.getByText(/Executive Presence/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting scenario answers', async () => {
    const user = userEvent.setup();
    render(<ExecutivePresenceBuilder />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Start Building/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Where do you see this industry/i)).toBeInTheDocument();
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

  it('should manage state correctly - tracking score and progress', async () => {
    const user = userEvent.setup();
    render(<ExecutivePresenceBuilder />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Building/i }));

    await waitFor(() => {
      expect(screen.getByText(/industry in 5 years/i)).toBeInTheDocument();
    });

    // Check initial score
    expect(screen.getByText(/0 points/i)).toBeInTheDocument();

    // Select correct answer (option B)
    const optionB = screen.getAllByRole('button', { name: /^B$/i })[0];
    await user.click(optionB);

    // Score should increase after correct answer
    await waitFor(() => {
      expect(screen.getByText(/25 points/i)).toBeInTheDocument();
    });
  });

  it('should validate answers - showing appropriate feedback', async () => {
    const user = userEvent.setup();
    render(<ExecutivePresenceBuilder />);

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Building/i }));

    await waitFor(() => {
      expect(screen.getByText(/industry in 5 years/i)).toBeInTheDocument();
    });

    // Select wrong answer (option A)
    const optionA = screen.getAllByRole('button', { name: /^A$/i })[0];
    await user.click(optionA);

    // Should show negative feedback
    await waitFor(() => {
      expect(screen.getByText(/❌/i)).toBeInTheDocument();
      expect(screen.getByText(/lack of strategic thinking/i)).toBeInTheDocument();
    });

    // Move to next question
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Select correct answer on next question
    await waitFor(() => {
      expect(screen.getByText(/leadership philosophy/i)).toBeInTheDocument();
    });

    const optionB = screen.getAllByRole('button', { name: /^A$/i })[0]; // First option is correct for Q2
    await user.click(optionB);

    // Should show positive feedback
    await waitFor(() => {
      expect(screen.getByText(/✅/i)).toBeInTheDocument();
      expect(screen.getByText(/Perfect!/i)).toBeInTheDocument();
    });
  });

  it('should display executive presence elements and guidance', async () => {
    const user = userEvent.setup();
    render(<ExecutivePresenceBuilder />);

    // Introduction should show presence elements
    expect(screen.getByText(/Executive Presence/i)).toBeInTheDocument();

    // Start the game
    await user.click(screen.getByRole('button', { name: /Start Building/i }));

    // Scenarios should be displayed
    await waitFor(() => {
      expect(screen.getByText(/CEO asks|Executive asks/i)).toBeInTheDocument();
    });
  });

  it('should trigger completion callback when all scenarios answered', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<ExecutivePresenceBuilder onComplete={mockOnComplete} />);

    // Complete the game
    await user.click(screen.getByRole('button', { name: /Start Building/i }));

    await waitFor(() => {
      expect(screen.getByText(/industry in 5 years/i)).toBeInTheDocument();
    });

    // Answer multiple scenarios
    const totalScenarios = 4; // Based on typical executive presence structure

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
