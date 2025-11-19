import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import ReadinessScoreBadge from '@/components/mvp/shared/ReadinessScoreBadge';
import * as useApiHooks from '@/hooks/useApi';
import { mockReadinessScore } from '../../../mocks/apiMocks';

// Mock the API hooks
vi.mock('@/hooks/useApi', () => ({
  useReadinessScore: vi.fn(),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ReadinessScoreBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useApiHooks.useReadinessScore as any).mockReturnValue({
      data: { score: 75 },
      isLoading: false,
      isError: false,
    });
  });

  it('renders the readiness score badge', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} />);

    // Check for either 75% or readiness text (use getAllByText for multiple matches)
    const textElements = screen.getAllByText(/75|readiness/i);
    expect(textElements.length).toBeGreaterThan(0);
  });

  it('displays score with percentage', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} />);

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  it('shows correct label for score >= 80 (Interview Ready)', () => {
    render(<ReadinessScoreBadge score={85} fetchFromApi={false} />);

    expect(screen.getByText(/Interview Ready/i)).toBeInTheDocument();
  });

  it('shows correct label for score 60-79 (Good Progress)', () => {
    render(<ReadinessScoreBadge score={70} fetchFromApi={false} />);

    expect(screen.getByText(/Good Progress/i)).toBeInTheDocument();
  });

  it('shows correct label for score 40-59 (Keep Practicing)', () => {
    render(<ReadinessScoreBadge score={50} fetchFromApi={false} />);

    expect(screen.getByText(/Keep Practicing/i)).toBeInTheDocument();
  });

  it('shows correct label for score < 40 (Just Starting)', () => {
    render(<ReadinessScoreBadge score={30} fetchFromApi={false} />);

    expect(screen.getByText(/Just Starting/i)).toBeInTheDocument();
  });

  it('displays progress bar', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows details when showDetails is true', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} showDetails={true} />);

    // Check for multiple detail elements (use getAllByText)
    const detailElements = screen.getAllByText(/Learning|Practice|Profile|Consistency/i);
    expect(detailElements.length).toBeGreaterThan(0);
  });

  it('hides details when showDetails is false', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} showDetails={false} />);

    expect(screen.queryByText(/25%.*weight/i)).toBeNull();
  });

  it('displays compact size correctly', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} size="compact" />);

    expect(screen.getByText(/75/i)).toBeInTheDocument();
    expect(screen.getByText(/Readiness/i)).toBeInTheDocument();
  });

  it('displays large size correctly', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} size="large" />);

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview Readiness/i)).toBeInTheDocument();
  });

  it('shows trend indicator when score increases', () => {
    render(<ReadinessScoreBadge score={80} previousScore={70} fetchFromApi={false} />);

    // Should show upward trend (+10) - use getAllByText for multiple matches
    const trendElements = screen.getAllByText(/10|trending/i);
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('shows trend indicator when score decreases', () => {
    render(<ReadinessScoreBadge score={60} previousScore={70} fetchFromApi={false} />);

    // Should show downward trend (-10) - use getAllByText for multiple matches
    const trendElements = screen.getAllByText(/10/i);
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('uses green color for high scores (>= 80)', () => {
    const { container } = render(<ReadinessScoreBadge score={85} fetchFromApi={false} />);

    // Check for green color classes
    expect(container.innerHTML).toMatch(/green/i);
  });

  it('uses blue color for medium scores (60-79)', () => {
    const { container } = render(<ReadinessScoreBadge score={70} fetchFromApi={false} />);

    expect(container.innerHTML).toMatch(/blue/i);
  });

  it('uses orange/yellow color for low scores (40-59)', () => {
    const { container } = render(<ReadinessScoreBadge score={50} fetchFromApi={false} />);

    expect(container.innerHTML).toMatch(/orange|yellow/i);
  });

  it('uses red color for very low scores (< 40)', () => {
    const { container } = render(<ReadinessScoreBadge score={30} fetchFromApi={false} />);

    expect(container.innerHTML).toMatch(/red/i);
  });

  it('fetches score from API when fetchFromApi is true', async () => {
    (useApiHooks.useReadinessScore as any).mockReturnValue({
      data: mockReadinessScore,
      isLoading: false,
      isError: false,
    });

    render(<ReadinessScoreBadge fetchFromApi={true} />);

    await waitFor(() => {
      // Should display score from API (75 from mock) - use getAllByText for multiple matches
      const scoreElements = screen.getAllByText(/75%/i);
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });

  it('shows loading state when fetching from API', () => {
    (useApiHooks.useReadinessScore as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ReadinessScoreBadge fetchFromApi={true} />);

    // Check for loading text or spinner
    const loadingText = screen.queryByText(/Loading/i);
    const spinner = screen.queryByRole('status') || document.querySelector('.animate-spin');
    expect(loadingText || spinner).toBeTruthy();
  });

  it('handles zero score gracefully', () => {
    render(<ReadinessScoreBadge score={0} fetchFromApi={false} />);

    // Use getAllByText since there might be multiple elements with 0%
    const scoreElements = screen.getAllByText(/0%/i);
    expect(scoreElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Just Starting/i)).toBeInTheDocument();
  });

  it('handles 100% score', () => {
    render(<ReadinessScoreBadge score={100} fetchFromApi={false} />);

    expect(screen.getByText(/100%/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview Ready/i)).toBeInTheDocument();
  });

  it('displays component weights breakdown', () => {
    render(<ReadinessScoreBadge score={75} fetchFromApi={false} showDetails={true} />);

    // Should show the weight percentages
    expect(screen.queryByText(/25%.*weight/i)).toBeTruthy();
    expect(screen.queryByText(/40%.*weight/i)).toBeTruthy();
  });
});
