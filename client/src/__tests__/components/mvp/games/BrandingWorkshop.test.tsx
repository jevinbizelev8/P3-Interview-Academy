import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import BrandingWorkshop from '@/components/prepare/interactive/BrandingWorkshop';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('BrandingWorkshop', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render without crashing', () => {
    render(<BrandingWorkshop />);

    expect(screen.getByText(/What is Personal Branding\?/i)).toBeInTheDocument();
  });

  it('should handle user interaction - selecting strengths', async () => {
    const user = userEvent.setup();
    render(<BrandingWorkshop />);

    // Move to step 2 (strengths selection)
    const startButton = screen.getByRole('button', { name: /Let's build my brand!/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Core Strengths/i)).toBeInTheDocument();
    });

    // Select a strength
    const strengthButton = screen.getByRole('button', { name: /Problem-solving/i });
    await user.click(strengthButton);

    // Verify it's selected (check for purple background color class)
    expect(strengthButton).toHaveClass('bg-purple-600');
  });

  it('should manage state correctly - tracking selected strengths', async () => {
    const user = userEvent.setup();
    render(<BrandingWorkshop />);

    // Navigate to strengths step
    const startButton = screen.getByRole('button', { name: /Let's build my brand!/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Selected Strengths \(0\/3\):/i)).toBeInTheDocument();
    });

    // Select three strengths
    await user.click(screen.getByRole('button', { name: /Problem-solving/i }));
    await user.click(screen.getByRole('button', { name: /Leadership/i }));
    await user.click(screen.getByRole('button', { name: /Communication/i }));

    await waitFor(() => {
      expect(screen.getByText(/Selected Strengths \(3\/3\):/i)).toBeInTheDocument();
    });

    // Next button should appear when 3 strengths are selected
    expect(screen.getByRole('button', { name: /Next: Professional Identity/i })).toBeInTheDocument();
  });

  it('should validate user input - requiring minimum character count', async () => {
    const user = userEvent.setup();
    render(<BrandingWorkshop />);

    // Navigate to step 3 (professional identity)
    await user.click(screen.getByRole('button', { name: /Let's build my brand!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Core Strengths/i)).toBeInTheDocument();
    });

    // Select 3 strengths
    await user.click(screen.getByRole('button', { name: /Problem-solving/i }));
    await user.click(screen.getByRole('button', { name: /Leadership/i }));
    await user.click(screen.getByRole('button', { name: /Communication/i }));

    await user.click(screen.getByRole('button', { name: /Next: Professional Identity/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your Professional Identity/i)).toBeInTheDocument();
    });

    // Next button should NOT appear with short input
    expect(screen.queryByRole('button', { name: /Next: Origin Story/i })).not.toBeInTheDocument();

    // Type a long enough identity statement (>= 50 characters)
    const textarea = screen.getByPlaceholderText(/Type your professional identity statement here.../i);
    await user.type(textarea, 'I am a software engineer who builds scalable systems for enterprise clients through modern architecture patterns.');

    // Next button should appear after meeting character requirement
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next: Origin Story/i })).toBeInTheDocument();
    });
  });

  it('should trigger completion callback with correct data', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();

    render(<BrandingWorkshop onComplete={mockOnComplete} />);

    // Complete all steps
    // Step 1: Introduction
    await user.click(screen.getByRole('button', { name: /Let's build my brand!/i }));

    // Step 2: Strengths
    await waitFor(() => {
      expect(screen.getByText(/Identify Your Core Strengths/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Problem-solving/i }));
    await user.click(screen.getByRole('button', { name: /Leadership/i }));
    await user.click(screen.getByRole('button', { name: /Communication/i }));
    await user.click(screen.getByRole('button', { name: /Next: Professional Identity/i }));

    // Step 3: Professional Identity
    await waitFor(() => {
      expect(screen.getByText(/Your Professional Identity/i)).toBeInTheDocument();
    });
    const identityTextarea = screen.getByPlaceholderText(/Type your professional identity statement here.../i);
    await user.type(identityTextarea, 'I am a software engineer who builds scalable systems for enterprise clients through modern architecture.');
    await user.click(screen.getByRole('button', { name: /Next: Origin Story/i }));

    // Step 4: Origin Story
    await waitFor(() => {
      expect(screen.getByText(/Your Origin Story/i)).toBeInTheDocument();
    });
    const originTextarea = screen.getByPlaceholderText(/Write your origin story here/i);
    await user.type(originTextarea, 'I started my career as a junior developer and gradually specialized in backend systems. Over the years, I have worked on multiple large-scale projects that serve millions of users.');
    await user.click(screen.getByRole('button', { name: /Final Step: Value Proposition/i }));

    // Step 5: Value Proposition
    await waitFor(() => {
      expect(screen.getByText(/Your Value Proposition/i)).toBeInTheDocument();
    });
    const valueTextarea = screen.getByPlaceholderText(/Type your value proposition here.../i);
    await user.type(valueTextarea, 'I help organizations scale their infrastructure by implementing cloud-native solutions.');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Workshop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Complete Workshop/i }));

    // Verify onComplete was called with score and data
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
      const [score, data] = mockOnComplete.mock.calls[0];
      expect(score).toBeGreaterThan(0);
      expect(data.strengths).toHaveLength(3);
      expect(data.identity).toBeTruthy();
      expect(data.origin).toBeTruthy();
      expect(data.valueProposition).toBeTruthy();
    });
  });
});
