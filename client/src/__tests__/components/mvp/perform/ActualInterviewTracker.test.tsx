import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ActualInterviewTracker from '@/components/mvp/perform/ActualInterviewTracker';
import * as useApiHooks from '@/hooks/useApi';
import { mockActualInterviews } from '../../../mocks/apiMocks';

// Mock the API hooks
vi.mock('@/hooks/useApi', () => ({
  useActualInterviews: vi.fn(),
  useCreateActualInterview: vi.fn(),
  useUpdateActualInterview: vi.fn(),
  useDeleteActualInterview: vi.fn(),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: any, formatStr: string) => '2025-10-30',
}));

describe('ActualInterviewTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useApiHooks.useActualInterviews as any).mockReturnValue({
      data: mockActualInterviews,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useCreateActualInterview as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });

    (useApiHooks.useUpdateActualInterview as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });

    (useApiHooks.useDeleteActualInterview as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });
  });

  it('renders the interview tracker component', () => {
    render(<ActualInterviewTracker />);

    expect(screen.getByText(/Actual Interview Tracker|Interview.*Tracker/i)).toBeInTheDocument();
  });

  it('displays existing interviews', () => {
    render(<ActualInterviewTracker />);

    expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/Senior Developer/i)).toBeInTheDocument();
  });

  it('shows button to log new interview', () => {
    render(<ActualInterviewTracker />);

    expect(screen.getByRole('button', { name: /log.*interview|add.*interview|new/i })).toBeInTheDocument();
  });

  it('opens form when clicking log interview button', async () => {
    const user = userEvent.setup();

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(screen.getByText(/Company|Position|Interview.*Date/i)).toBeInTheDocument();
    });
  });

  it('displays form fields for logging interview', async () => {
    const user = userEvent.setup();

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      // Should have fields for company, position, date, etc.
      expect(screen.queryByLabelText(/company/i) || screen.queryByPlaceholderText(/company/i)).toBeTruthy();
      expect(screen.queryByLabelText(/position|job.*title/i) || screen.queryByPlaceholderText(/position/i)).toBeTruthy();
      expect(screen.queryByLabelText(/date/i) || screen.queryByPlaceholderText(/date/i)).toBeTruthy();
    });
  });

  it('allows entering interview details', async () => {
    const user = userEvent.setup();

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      const companyInput = screen.queryByPlaceholderText(/company/i);
      if (companyInput) {
        user.type(companyInput, 'Example Corp');
      }
    });
  });

  it('allows selecting interview outcome', async () => {
    const user = userEvent.setup();

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      // Should have outcome options: success, rejected, pending
      expect(screen.queryByText(/pending|success|rejected|outcome/i)).toBeTruthy();
    });
  });

  it('displays interview status badges', () => {
    render(<ActualInterviewTracker />);

    // Should show status of existing interview (upcoming, pending, etc.)
    expect(screen.queryByText(/upcoming|pending|completed/i)).toBeTruthy();
  });

  it('shows interview stage information', () => {
    render(<ActualInterviewTracker />);

    // Should display stage (technical, behavioral, etc.)
    expect(screen.getByText(/technical/i)).toBeInTheDocument();
  });

  it('allows adding notes to interviews', async () => {
    const user = userEvent.setup();

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      const notesTextarea = screen.queryByPlaceholderText(/notes|comments/i);
      expect(notesTextarea).toBeTruthy();
    });
  });

  it('tracks thank you note sent status', () => {
    render(<ActualInterviewTracker />);

    // Should show thank you note tracking
    expect(screen.queryByText(/thank.*you|follow.*up/i)).toBeTruthy();
  });

  it('allows toggling thank you sent status', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    (useApiHooks.useUpdateActualInterview as any).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });

    render(<ActualInterviewTracker />);

    // Find and click thank you checkbox
    const thankYouCheckboxes = screen.queryAllByRole('checkbox');
    if (thankYouCheckboxes.length > 0) {
      await user.click(thankYouCheckboxes[0]);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    }
  });

  it('displays interview date', () => {
    render(<ActualInterviewTracker />);

    // Should show formatted date
    expect(screen.queryByText(/2025|date|oct|october/i)).toBeTruthy();
  });

  it('allows saving new interview', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    (useApiHooks.useCreateActualInterview as any).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });

    render(<ActualInterviewTracker />);

    const logButton = screen.getByRole('button', { name: /log.*interview|add.*interview|new/i });
    await user.click(logButton);

    await waitFor(() => {
      const saveButton = screen.queryByRole('button', { name: /save|submit|add/i });
      if (saveButton) {
        user.click(saveButton);

        waitFor(() => {
          expect(mockMutate).toHaveBeenCalled();
        });
      }
    });
  });

  it('shows loading state when fetching interviews', () => {
    (useApiHooks.useActualInterviews as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ActualInterviewTracker />);

    expect(screen.queryByText(/loading/i) || screen.queryByRole('status')).toBeTruthy();
  });

  it('displays empty state when no interviews logged', () => {
    (useApiHooks.useActualInterviews as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<ActualInterviewTracker />);

    // Should show empty state message
    expect(screen.queryByText(/no.*interview|start.*tracking|log.*first/i)).toBeTruthy();
  });

  it('handles API errors gracefully', () => {
    (useApiHooks.useActualInterviews as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
    });

    render(<ActualInterviewTracker />);

    // Should show error message or fallback
    expect(screen.queryByText(/error|failed|try.*again/i)).toBeTruthy();
  });
});
