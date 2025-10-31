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

    expect(screen.getByText(/75|readiness/i)).toBeTruthy();
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

    expect(screen.queryByText(/Learning|Practice|Profile|Consistency/i)).toBeTruthy();
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

    // Should show upward trend (+10)
    expect(screen.queryByText(/10|trending/i)).toBeTruthy();
  });

  it('shows trend indicator when score decreases', () => {
    render(<ReadinessScoreBadge score={60} previousScore={70} fetchFromApi={false} />);

    // Should show downward trend (-10)
    expect(screen.queryByText(/10/i)).toBeTruthy();
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
      // Should display score from API (75 from mock)
      expect(screen.getByText(/75%/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when fetching from API', () => {
    (useApiHooks.useReadinessScore as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ReadinessScoreBadge fetchFromApi={true} />);

    expect(screen.queryByText(/Loading/i) || screen.queryByRole('status')).toBeTruthy();
  });

  it('handles zero score gracefully', () => {
    render(<ReadinessScoreBadge score={0} fetchFromApi={false} />);

    expect(screen.getByText(/0%/i)).toBeInTheDocument();
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
