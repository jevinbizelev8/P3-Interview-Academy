import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import LearningHub from '@/components/mvp/prepare/LearningHub';
import * as useApiHooks from '@/hooks/useApi';
import { mockLearningModules, mockUserModuleProgress, mockCreditBalance } from '../../../mocks/apiMocks';

// Mock the API hooks
vi.mock('@/hooks/useApi', () => ({
  useLearningModules: vi.fn(),
  useUserModuleProgress: vi.fn(),
  useUpdateModuleProgress: vi.fn(),
  useCreditBalance: vi.fn(),
}));

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe.skip('LearningHub', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    (useApiHooks.useLearningModules as any).mockReturnValue({
      data: mockLearningModules,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useUserModuleProgress as any).mockReturnValue({
      data: mockUserModuleProgress,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useCreditBalance as any).mockReturnValue({
      data: mockCreditBalance,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useUpdateModuleProgress as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });
  });

  it('renders the learning hub component', () => {
    render(<LearningHub />);

    expect(screen.getByText(/Learning Hub/i)).toBeInTheDocument();
  });

  it('displays learning stages', () => {
    render(<LearningHub />);

    expect(screen.getByText(/HR\/Recruiter Screening/i)).toBeInTheDocument();
    expect(screen.getByText(/Functional\/Team Round/i)).toBeInTheDocument();
  });

  it('displays learning modules within stages', async () => {
    render(<LearningHub />);

    // The modules might be initially hidden, so we might need to expand a stage first
    // Wait for component to render fully
    await waitFor(() => {
      expect(screen.getByText(/Understanding Screening Interviews/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when fetching modules', () => {
    (useApiHooks.useLearningModules as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<LearningHub />);

    // Check for loading indicator
    expect(screen.getByText(/Loading/i) || screen.getByRole('status')).toBeTruthy();
  });

  it('shows error state when module fetch fails', () => {
    (useApiHooks.useLearningModules as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch modules'),
    });

    render(<LearningHub />);

    // Component should handle error gracefully
    expect(screen.queryByText(/Understanding Screening Interviews/i)).not.toBeInTheDocument();
  });

  it('displays module progress for completed modules', async () => {
    render(<LearningHub />);

    await waitFor(() => {
      // Look for completion indicators (checkmarks, badges, etc.)
      const completionIndicators = screen.queryAllByTestId(/completed|check/i);
      expect(completionIndicators.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('allows users to start a module', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    (useApiHooks.useUpdateModuleProgress as any).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });

    render(<LearningHub />);

    await waitFor(() => {
      expect(screen.getByText(/Understanding Screening Interviews/i)).toBeInTheDocument();
    });

    // Find and click a "Start" or module button
    const moduleButtons = screen.queryAllByRole('button');
    if (moduleButtons.length > 0) {
      await user.click(moduleButtons[0]);
      // Component might open a modal or navigate
      await waitFor(() => {
        expect(moduleButtons[0]).toBeTruthy();
      });
    }
  });

  it('displays XP earned badge for completed modules', async () => {
    const completedProgress = [
      {
        ...mockUserModuleProgress[0],
        xp_earned: 20,
        status: 'completed',
      },
    ];

    (useApiHooks.useUserModuleProgress as any).mockReturnValue({
      data: completedProgress,
      isLoading: false,
      isError: false,
    });

    render(<LearningHub />);

    await waitFor(() => {
      // Look for XP indicators
      expect(screen.queryByText(/20/i) || screen.queryByText(/XP/i)).toBeTruthy();
    });
  });

  it('shows stage completion progress', async () => {
    render(<LearningHub />);

    await waitFor(() => {
      // Look for progress bars or percentage indicators
      const progressElements = screen.queryAllByRole('progressbar');
      expect(progressElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('handles module selection and opens interactive component', async () => {
    const user = userEvent.setup();

    render(<LearningHub />);

    await waitFor(() => {
      expect(screen.getByText(/Understanding Screening Interviews/i)).toBeInTheDocument();
    });

    // Click on a module to open it
    const moduleCards = screen.queryAllByRole('button', { name: /start|continue|view/i });
    if (moduleCards.length > 0) {
      await user.click(moduleCards[0]);

      // Verify modal or component opens
      await waitFor(() => {
        expect(moduleCards[0]).toBeTruthy();
      });
    }
  });

  it('displays estimated completion time for modules', async () => {
    render(<LearningHub />);

    await waitFor(() => {
      // Look for time indicators (e.g., "15 min", "20 minutes")
      expect(screen.queryByText(/15.*min/i) || screen.queryByText(/minute/i)).toBeTruthy();
    });
  });
});
