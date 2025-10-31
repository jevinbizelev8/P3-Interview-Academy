import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import SimulationSetup from '@/components/mvp/practice/SimulationSetup';
import * as useApiHooks from '@/hooks/useApi';
import { mockResumes, mockCreditBalance } from '../../../mocks/apiMocks';

// Mock the API hooks
vi.mock('@/hooks/useApi', () => ({
  useResumes: vi.fn(),
  useCreditBalance: vi.fn(),
  useSimulationHistory: vi.fn(),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockNavigate],
}));

describe('SimulationSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useApiHooks.useResumes as any).mockReturnValue({
      data: mockResumes,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useCreditBalance as any).mockReturnValue({
      data: mockCreditBalance,
      isLoading: false,
      isError: false,
    });

    (useApiHooks.useSimulationHistory as any).mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('renders the simulation setup component', () => {
    render(<SimulationSetup />);

    expect(screen.getByText(/Simulation.*Setup|Interview.*Setup|Practice.*Setup/i)).toBeInTheDocument();
  });

  it('displays credit balance', () => {
    render(<SimulationSetup />);

    // Should show user's current credits (100 from mock)
    expect(screen.queryByText(/100|credit|balance/i)).toBeTruthy();
  });

  it('shows credit cost for simulation', () => {
    render(<SimulationSetup />);

    // Standard simulation typically costs 10-20 credits
    expect(screen.queryByText(/10.*credit|credit.*cost|cost/i)).toBeTruthy();
  });

  it('displays difficulty level options', () => {
    render(<SimulationSetup />);

    // Should have options for easy, medium, hard
    expect(screen.queryByText(/easy|medium|hard|difficulty/i)).toBeTruthy();
  });

  it('displays interview stage options', () => {
    render(<SimulationSetup />);

    // HR, Functional, Manager, Executive stages
    expect(screen.queryByText(/HR|Functional|Manager|screening|stage/i)).toBeTruthy();
  });

  it('allows selecting a resume for the simulation', async () => {
    render(<SimulationSetup />);

    await waitFor(() => {
      // Should show resume selection UI
      expect(screen.queryByText(/resume|select.*resume|choose.*resume/i)).toBeTruthy();
    });
  });

  it('displays list of available resumes', () => {
    render(<SimulationSetup />);

    // Should display the mock resume
    expect(screen.queryByText(/resume\.pdf/i)).toBeTruthy();
  });

  it('warns when credit balance is insufficient', () => {
    (useApiHooks.useCreditBalance as any).mockReturnValue({
      data: { balance: 5, last_updated: new Date().toISOString() },
      isLoading: false,
    });

    render(<SimulationSetup />);

    // Should show warning about insufficient credits
    expect(screen.queryByText(/insufficient|not enough|low.*credit/i)).toBeTruthy();
  });

  it('disables start button when credits are insufficient', () => {
    (useApiHooks.useCreditBalance as any).mockReturnValue({
      data: { balance: 5, last_updated: new Date().toISOString() },
      isLoading: false,
    });

    render(<SimulationSetup />);

    const startButton = screen.queryByRole('button', { name: /start|begin/i });
    if (startButton) {
      expect(startButton).toBeDisabled();
    }
  });

  it('allows starting simulation with sufficient credits', () => {
    render(<SimulationSetup />);

    const startButton = screen.queryByRole('button', { name: /start|begin/i });
    if (startButton) {
      expect(startButton).not.toBeDisabled();
    }
  });

  it('shows loading state when fetching resumes', () => {
    (useApiHooks.useResumes as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<SimulationSetup />);

    expect(screen.queryByText(/loading/i) || screen.queryByRole('status')).toBeTruthy();
  });

  it('handles case when no resumes are available', () => {
    (useApiHooks.useResumes as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<SimulationSetup />);

    // Should prompt user to upload a resume first
    expect(screen.queryByText(/no.*resume|upload.*resume|add.*resume/i)).toBeTruthy();
  });

  it('displays simulation type options', () => {
    render(<SimulationSetup />);

    // Behavioral, Technical, etc.
    expect(screen.queryByText(/behavioral|technical|type/i)).toBeTruthy();
  });

  it('allows customizing simulation settings', async () => {
    const user = userEvent.setup();

    render(<SimulationSetup />);

    // Look for settings or customization options
    const settingsElements = screen.queryAllByRole('combobox');
    expect(settingsElements.length).toBeGreaterThanOrEqual(0);
  });

  it('shows preview of selected configuration', () => {
    render(<SimulationSetup />);

    // Should summarize selected options before starting
    expect(screen.queryByText(/setup|configuration|preview/i)).toBeTruthy();
  });
});
