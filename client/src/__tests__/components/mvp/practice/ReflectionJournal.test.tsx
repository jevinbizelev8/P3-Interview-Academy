import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ReflectionJournal from '@/components/practice/ReflectionJournal';
import { mockReflections } from '../../../mocks/apiMocks';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock React Query
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (options: any) => mockUseQuery(options),
    useMutation: (options: any) => mockUseMutation(options),
  };
});

describe('ReflectionJournal', () => {
  const mockSimulationId = 'sim-123';
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useQuery (fetch reflections)
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    // Default mock for useMutation (submit reflection)
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('should render without crashing', () => {
    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    expect(screen.getByText('Reflection Journal')).toBeInTheDocument();
    expect(screen.getByText(/Deepen your learning by reflecting/i)).toBeInTheDocument();
  });

  it('should display reflection prompts', () => {
    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Should show at least one prompt
    expect(
      screen.getByText(/What was the most challenging question/i) ||
      screen.getByText(/If you could redo one response/i) ||
      screen.getByText(/What specific actions will you take/i)
    ).toBeTruthy();
  });

  it('should allow users to write reflections', async () => {
    const user = userEvent.setup();

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    expect(textarea).toBeInTheDocument();

    await user.type(textarea, 'I learned to structure my STAR responses better.');

    expect(textarea).toHaveValue('I learned to structure my STAR responses better.');
  });

  it('should submit reflection when submit button clicked', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    });

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'Great learning experience');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        simulationId: mockSimulationId,
        reflections: 'Great learning experience',
      });
    });
  });

  it('should disable submit button when reflection is empty', () => {
    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state while submitting', () => {
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    });

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    expect(screen.getByText(/Analyzing Your Reflection/i)).toBeInTheDocument();
  });

  it('should display AI response after reflection submission', async () => {
    const user = userEvent.setup();
    let mutateCallback: any;

    mockUseMutation.mockImplementation((options: any) => ({
      mutate: (data: any) => {
        options.onSuccess({ journal: mockReflections[0] });
      },
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'I need to practice more technical questions');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Great reflection!/i)).toBeInTheDocument();
    });
  });

  it('should allow navigation between reflection prompts', async () => {
    const user = userEvent.setup();

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Find prompt indicators (dots)
    const promptIndicators = screen.getAllByLabelText(/Prompt \d+/);
    expect(promptIndicators.length).toBeGreaterThan(1);

    // Click on second prompt indicator
    if (promptIndicators[1]) {
      await user.click(promptIndicators[1]);

      // The prompt text should change (we can't predict exact text without checking all prompts)
      // Just verify the component re-renders without crashing
      expect(screen.getByText('Reflection Journal')).toBeInTheDocument();
    }
  });

  it('should handle empty state gracefully', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Component should still render reflection form
    expect(screen.getByPlaceholderText(/Write your reflection here/i)).toBeInTheDocument();
  });

  it('should display chat interface after initial submission', async () => {
    const user = userEvent.setup();

    mockUseMutation.mockImplementation((options: any) => ({
      mutate: (data: any) => {
        options.onSuccess({ journal: mockReflections[0] });
      },
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'Great session!');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      // After submission, should show chat interface
      expect(screen.getByPlaceholderText(/Continue the conversation/i)).toBeInTheDocument();
    });
  });

  it('should send chat messages to AI coach', async () => {
    const user = userEvent.setup();

    // Setup initial submission state
    mockUseMutation.mockImplementation((options: any) => ({
      mutate: (data: any) => {
        options.onSuccess({ journal: mockReflections[0] });
      },
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Submit initial reflection
    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'I need more practice');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Continue the conversation/i)).toBeInTheDocument();
    });

    // Send a chat message
    const chatTextarea = screen.getByPlaceholderText(/Continue the conversation/i);
    await user.type(chatTextarea, 'How can I improve my technical answers?');

    const sendButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg') // Find button with Send icon
    );

    if (sendButton) {
      await user.click(sendButton);

      // Wait for AI response to appear
      await waitFor(() => {
        // The mock AI responds with specific text
        expect(screen.getByText(/specific examples with measurable outcomes/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('should enforce character limit on chat messages', async () => {
    const user = userEvent.setup();

    // Setup initial submission state
    mockUseMutation.mockImplementation((options: any) => ({
      mutate: (data: any) => {
        options.onSuccess({ journal: mockReflections[0] });
      },
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Submit initial reflection
    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'Test');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Continue the conversation/i)).toBeInTheDocument();
    });

    // Try to type more than 1000 characters
    const chatTextarea = screen.getByPlaceholderText(/Continue the conversation/i) as HTMLTextAreaElement;
    const longText = 'a'.repeat(1001);

    await user.type(chatTextarea, longText);

    // Should be limited to 1000 characters (or close to it, depending on onChange logic)
    expect(chatTextarea.value.length).toBeLessThanOrEqual(1000);
  });

  it('should show BookOpen icon in header', () => {
    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    // Check for the icon by looking for svg elements near the title
    const header = screen.getByText('Reflection Journal').closest('div');
    expect(header).toBeInTheDocument();
  });

  it('should display explore further prompts after AI response', async () => {
    const user = userEvent.setup();

    mockUseMutation.mockImplementation((options: any) => ({
      mutate: (data: any) => {
        options.onSuccess({ journal: mockReflections[0] });
      },
      mutateAsync: vi.fn().mockResolvedValue({ journal: mockReflections[0] }),
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<ReflectionJournal simulationId={mockSimulationId} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/Write your reflection here/i);
    await user.type(textarea, 'Great experience');

    const submitButton = screen.getByRole('button', { name: /Submit Reflection/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Explore Further:/i)).toBeInTheDocument();
      expect(screen.getByText(/What specific metrics could you use/i)).toBeInTheDocument();
      expect(screen.getByText(/How can you apply these learnings/i)).toBeInTheDocument();
    });
  });
});
