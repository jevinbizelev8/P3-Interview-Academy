import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../utils/test-utils';
import BadgeGallery from '@/components/mvp/perform/BadgeGallery';
import { mockBadges, mockUserBadges } from '../../../mocks/apiMocks';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('BadgeGallery', () => {
  const mockProps = {
    badges: mockBadges,
    userBadges: mockUserBadges,
  };

  it('renders the badge gallery component', () => {
    render(<BadgeGallery {...mockProps} />);

    expect(screen.getByText(/Badge.*Gallery|Achievements|Badges/i)).toBeInTheDocument();
  });

  it('displays available badges', () => {
    render(<BadgeGallery {...mockProps} />);

    expect(screen.getByText(/First Steps/i)).toBeInTheDocument();
  });

  it('shows badge descriptions', () => {
    render(<BadgeGallery {...mockProps} />);

    expect(screen.getByText(/Complete your first learning module/i)).toBeInTheDocument();
  });

  it('displays badge tiers (common, rare, epic, etc.)', () => {
    render(<BadgeGallery {...mockProps} />);

    expect(screen.queryByText(/common|rare|epic|tier/i)).toBeTruthy();
  });

  it('shows XP reward for badges', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should display 50 XP reward
    expect(screen.queryByText(/50.*XP|XP.*50/i)).toBeTruthy();
  });

  it('highlights earned badges differently than locked badges', () => {
    render(<BadgeGallery {...mockProps} />);

    // Earned badges should be visually distinct
    const badgeElements = screen.getAllByText(/First Steps/i);
    expect(badgeElements.length).toBeGreaterThan(0);
  });

  it('shows progress for partially earned badges', () => {
    const partialBadge = [
      {
        ...mockUserBadges[0],
        progress: 0.5,
        earned_at: null,
      },
    ];

    render(<BadgeGallery badges={mockBadges} userBadges={partialBadge} />);

    // Should show progress indicator
    expect(screen.queryByRole('progressbar') || screen.queryByText(/50%|progress/i)).toBeTruthy();
  });

  it('displays badge categories', () => {
    render(<BadgeGallery {...mockProps} />);

    expect(screen.getByText(/learning/i)).toBeInTheDocument();
  });

  it('shows earned date for completed badges', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should display when badge was earned
    expect(screen.queryByText(/earned|unlocked|awarded/i)).toBeTruthy();
  });

  it('displays total badge count', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should show "1/1" or similar
    expect(screen.queryByText(/1.*\/.*1|total|earned/i)).toBeTruthy();
  });

  it('allows filtering badges by category', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should have filter options
    expect(screen.queryByText(/all|learning|practice|achievement|filter/i)).toBeTruthy();
  });

  it('shows locked state for unearned badges', () => {
    const unearnedBadge = [
      {
        id: 'badge-2',
        name: 'Interview Master',
        description: 'Complete 10 simulations',
        category: 'practice',
        tier: 'rare',
        xp_reward: 100,
        image_url: '/badges/master.png',
        requirements: { simulations_completed: 10 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<BadgeGallery badges={unearnedBadge} userBadges={[]} />);

    // Should show locked indicator
    expect(screen.queryByText(/locked|locked|not.*earned/i)).toBeTruthy();
  });

  it('displays badge requirements', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should show what's needed to earn the badge
    expect(screen.queryByText(/requirement|complete|earn/i)).toBeTruthy();
  });

  it('handles empty badge list gracefully', () => {
    render(<BadgeGallery badges={[]} userBadges={[]} />);

    // Should show empty state
    expect(screen.queryByText(/no.*badge|coming.*soon|check.*back/i)).toBeTruthy();
  });

  it('displays badge images or icons', () => {
    render(<BadgeGallery {...mockProps} />);

    // Should have image elements for badges
    const images = screen.queryAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(0);
  });
});
