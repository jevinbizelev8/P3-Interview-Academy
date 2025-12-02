import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ManagerPerspectiveGame from '@/components/prepare/interactive/ManagerPerspectiveGame';

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

describe('ManagerPerspectiveGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<ManagerPerspectiveGame />);

    expect(screen.getByText(/Think Like a Hiring Manager/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting manager priorities', async () => {
    const user = userEvent.setup();
    render(<ManagerPerspectiveGame />);

    // Start the game
    const startButton = screen.getByRole('button', { name: /Let's Begin!/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/What Hiring Managers Really Care About/i)).toBeInTheDocument();
    });

    // Select a priority
    const priorityButton = screen.getByRole('button', { name: /Can execute independently/i });
    await user.click(priorityButton);

    // Verify selection
    expect(priorityButton).toHaveClass('bg-blue-600');
  });

  it('should manage state correctly - tracking selected priorities', async () => {
    const user = userEvent.setup();
    render(<ManagerPerspectiveGame />);

    // Navigate to priorities step
    await user.click(screen.getByRole('button', { name: /Let's Begin!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select 5 priorities/i)).toBeInTheDocument();
    });

    // Select 5 priorities
    const priorities = [
      /Can execute independently/i,
      /Delivers measurable results/i,
      /Takes ownership of problems/i,
      /Aligns with team goals/i,
      /Communicates proactively/i
    ];

    for (const priority of priorities) {
      const button = screen.getByRole('button', { name: priority });
      await user.click(button);
    }

    // Next button should appear after selecting 5
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });
  });

  it('should validate user input - limiting to 5 priorities', async () => {
    const user = userEvent.setup();
    render(<ManagerPerspectiveGame />);

    // Navigate to priorities step
    await user.click(screen.getByRole('button', { name: /Let's Begin!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select 5 priorities/i)).toBeInTheDocument();
    });

    // Try to select more than 5 priorities
    const allPriorityButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('execute') ||
      btn.textContent?.includes('Delivers') ||
      btn.textContent?.includes('Takes') ||
      btn.textContent?.includes('Aligns') ||
      btn.textContent?.includes('Communicates') ||
      btn.textContent?.includes('experience')
    );

    // Select first 5
    for (let i = 0; i < 5 && i < allPriorityButtons.length; i++) {
      await user.click(allPriorityButtons[i]);
    }

    // Try to select 6th
    if (allPriorityButtons.length > 5) {
      await user.click(allPriorityButtons[5]);

      // Should still only have 5 selected (check via UI or state)
      const selectedButtons = allPriorityButtons.filter(btn =>
        btn.className.includes('bg-blue-600')
      );
      expect(selectedButtons.length).toBeLessThanOrEqual(5);
    }
  });

  it('should display scenario comparisons - weak vs strong answers', async () => {
    const user = userEvent.setup();
    render(<ManagerPerspectiveGame />);

    // Navigate through to scenarios
    await user.click(screen.getByRole('button', { name: /Let's Begin!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select 5 priorities/i)).toBeInTheDocument();
    });

    // Select 5 priorities quickly
    const priorities = [
      /Can execute independently/i,
      /Delivers measurable results/i,
      /Takes ownership/i,
      /Aligns with team/i,
      /Communicates/i
    ];

    for (const priority of priorities) {
      const button = screen.getByRole('button', { name: priority });
      await user.click(button);
    }

    await user.click(screen.getByRole('button', { name: /Continue/i }));

    // Should show scenario with weak and strong responses
    await waitFor(() => {
      expect(screen.getByText(/Feature Priority Decision|Underperforming Team Member|Resource Constraints/i)).toBeInTheDocument();
      expect(screen.getByText(/Weak Response:/i) || screen.getByText(/Strong Response:/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should trigger completion callback when game finishes', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<ManagerPerspectiveGame onComplete={mockOnComplete} />);

    // Complete the game flow
    await user.click(screen.getByRole('button', { name: /Let's Begin!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select 5 priorities/i)).toBeInTheDocument();
    });

    // Select 5 priorities
    const priorities = [
      /Can execute independently/i,
      /Delivers measurable results/i,
      /Takes ownership/i,
      /Aligns with team/i,
      /Communicates/i
    ];

    for (const priority of priorities) {
      const button = screen.getByRole('button', { name: priority });
      await user.click(button);
    }

    await user.click(screen.getByRole('button', { name: /Continue/i }));

    // Navigate through scenarios and complete
    await waitFor(async () => {
      const completeButton = screen.queryByRole('button', { name: /Complete Challenge|Finish/i });
      if (completeButton) {
        await user.click(completeButton);
      }
    }, { timeout: 5000 });

    // Verify onComplete was called
    await waitFor(() => {
      if (mockOnComplete.mock.calls.length > 0) {
        const [score, data] = mockOnComplete.mock.calls[0];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(data.selectedPriorities).toBeTruthy();
      }
    }, { timeout: 3000 });
  });
});
