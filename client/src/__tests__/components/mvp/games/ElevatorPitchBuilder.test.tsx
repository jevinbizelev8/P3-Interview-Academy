import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ElevatorPitchBuilder from '@/components/prepare/interactive/ElevatorPitchBuilder';

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

describe('ElevatorPitchBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<ElevatorPitchBuilder />);

    expect(screen.getByText(/What is an Elevator Pitch\?/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting and viewing examples', async () => {
    const user = userEvent.setup();
    render(<ElevatorPitchBuilder />);

    // Navigate to examples step
    const startButton = screen.getByRole('button', { name: /Let's get started!/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Study Real Examples/i)).toBeInTheDocument();
    });

    // Click on an example to view it
    const exampleButtons = screen.getAllByRole('button', { name: /Software Engineer|Marketing Manager|Product Manager/i });
    await user.click(exampleButtons[0]);

    // Verify example details are displayed
    await waitFor(() => {
      expect(screen.getByText(/WHO:/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAT:/i)).toBeInTheDocument();
      expect(screen.getByText(/WHY:/i)).toBeInTheDocument();
    });
  });

  it('should manage state correctly - tracking viewed examples and score', async () => {
    const user = userEvent.setup();
    render(<ElevatorPitchBuilder />);

    // Start the module
    await user.click(screen.getByRole('button', { name: /Let's get started!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Study Real Examples/i)).toBeInTheDocument();
    });

    // Initially, continue button should not be visible
    expect(screen.queryByRole('button', { name: /Continue to Practice/i })).not.toBeInTheDocument();

    // View all three examples
    const exampleButtons = screen.getAllByRole('button', { name: /Software Engineer|Marketing Manager|Product Manager/i });

    for (const button of exampleButtons) {
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText(/WHO:/i)).toBeInTheDocument();
      });
      await user.click(button); // Close the example
    }

    // After viewing all examples, continue button should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue to Practice/i })).toBeInTheDocument();
    });
  });

  it('should validate completion - requires viewing all examples', async () => {
    const user = userEvent.setup();
    render(<ElevatorPitchBuilder />);

    // Navigate to examples
    await user.click(screen.getByRole('button', { name: /Let's get started!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Study Real Examples/i)).toBeInTheDocument();
    });

    // Continue button should not appear until all examples are viewed
    expect(screen.queryByRole('button', { name: /Continue to Practice/i })).not.toBeInTheDocument();

    // View only one example
    const exampleButtons = screen.getAllByRole('button', { name: /Software Engineer/i });
    await user.click(exampleButtons[0]);

    // Continue button still should not appear
    expect(screen.queryByRole('button', { name: /Continue to Practice/i })).not.toBeInTheDocument();
  });

  it('should display example breakdown correctly', async () => {
    const user = userEvent.setup();
    render(<ElevatorPitchBuilder />);

    // Navigate to examples step
    await user.click(screen.getByRole('button', { name: /Let's get started!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Study Real Examples/i)).toBeInTheDocument();
    });

    // Click on Software Engineer example
    const softwareEngineerButton = screen.getByRole('button', { name: /Software Engineer/i });
    await user.click(softwareEngineerButton);

    // Verify breakdown is displayed
    await waitFor(() => {
      expect(screen.getByText(/WHO:/i)).toBeInTheDocument();
      expect(screen.getByText(/Full-stack developer/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAT:/i)).toBeInTheDocument();
      expect(screen.getByText(/Specialise in React/i)).toBeInTheDocument();
      expect(screen.getByText(/WHY:/i)).toBeInTheDocument();
      expect(screen.getByText(/Want to impact millions/i)).toBeInTheDocument();
    });
  });

  it('should trigger completion callback when navigating to self-intro', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<ElevatorPitchBuilder onComplete={mockOnComplete} />);

    // Navigate through the module
    await user.click(screen.getByRole('button', { name: /Let's get started!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Study Real Examples/i)).toBeInTheDocument();
    });

    // View all examples to unlock continue button
    const exampleButtons = screen.getAllByRole('button', { name: /Software Engineer|Marketing Manager|Product Manager/i });

    for (const button of exampleButtons) {
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText(/WHO:/i)).toBeInTheDocument();
      });
      await user.click(button); // Close
    }

    // Click continue to practice
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue to Practice/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Continue to Practice/i }));

    // Click "Go to Self-Introduction"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Go to Self-Introduction/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Go to Self-Introduction/i }));

    // Verify onComplete was called
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
      const [score, data] = mockOnComplete.mock.calls[0];
      expect(score).toBeGreaterThan(0);
      expect(data.viewedExamples).toBeTruthy();
      expect(data.completedAt).toBeTruthy();
    });
  });
});
