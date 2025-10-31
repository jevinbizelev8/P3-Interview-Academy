import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../utils/test-utils';
import CreditCostBadge from '@/components/mvp/shared/CreditCostBadge';

describe('CreditCostBadge', () => {
  it('renders the credit cost badge', () => {
    render(<CreditCostBadge credits={10} />);

    expect(screen.getByText(/10/i)).toBeInTheDocument();
  });

  it('displays credit amount', () => {
    render(<CreditCostBadge credits={25} />);

    expect(screen.getByText(/25/i)).toBeInTheDocument();
  });

  it('displays default label "credits"', () => {
    render(<CreditCostBadge credits={10} />);

    expect(screen.getByText(/credits/i)).toBeInTheDocument();
  });

  it('allows custom label', () => {
    render(<CreditCostBadge credits={10} label="tokens" />);

    expect(screen.getByText(/tokens/i)).toBeInTheDocument();
  });

  it('displays lightning icon', () => {
    const { container } = render(<CreditCostBadge credits={10} />);

    // Check for SVG element (Lucide icons render as SVGs)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('handles zero credits', () => {
    render(<CreditCostBadge credits={0} />);

    expect(screen.getByText(/0/i)).toBeInTheDocument();
  });

  it('handles large credit amounts', () => {
    render(<CreditCostBadge credits={1000} />);

    expect(screen.getByText(/1000/i)).toBeInTheDocument();
  });

  it('displays as a badge component', () => {
    const { container } = render(<CreditCostBadge credits={10} />);

    // Should have badge-related classes
    expect(container.firstChild?.firstChild).toHaveClass('inline-flex');
  });

  it('uses gradient background colors', () => {
    const { container } = render(<CreditCostBadge credits={10} />);

    // Check for gradient classes
    expect(container.innerHTML).toMatch(/gradient|yellow|orange/i);
  });

  it('renders correctly with single credit', () => {
    render(<CreditCostBadge credits={1} label="credit" />);

    expect(screen.getByText(/1/i)).toBeInTheDocument();
    expect(screen.getByText(/credit/i)).toBeInTheDocument();
  });
});
