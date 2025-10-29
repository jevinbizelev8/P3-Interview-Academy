import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import Home from '@/pages/home';
import { toast } from '@/hooks/use-toast';
import { server } from '../utils/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the useLocation hook from wouter
const mockSetLocation = vi.fn();
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/', mockSetLocation],
  };
});

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ 
    toast: vi.fn(),
    toasts: []
  }),
}));

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<Home />);
      expect(screen.getByText('AI Interview Coaching')).toBeInTheDocument();
    });

    it('displays all required form fields', () => {
      render(<Home />);
      
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getAllByText(/interview stage/i)[0]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start AI Coaching Session/i })).toBeInTheDocument();
    });

    it('displays all interview stage options', () => {
      render(<Home />);
      
      expect(screen.getAllByText(/stage 1: phone\/initial screening/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/stage 2: functional\/team interview/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/stage 3: hiring manager interview/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/stage 4: subject-matter expertise/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/stage 5: executive\/final round/i)[0]).toBeInTheDocument();
    });

    it('displays language selector', () => {
      render(<Home />);
      expect(screen.getByText(/interview language/i)).toBeInTheDocument();
    });

  });

  describe('Form Validation', () => {
    it('disables start button when required fields are empty', () => {
      render(<Home />);

      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      expect(startButton).toBeDisabled();
    });

    it('shows error when technical stage selected without industry', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Software Engineer');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select technical interview stage
      const technicalCard = screen.getAllByText(/stage 4: subject-matter expertise/i)[0].closest('div');
      if (technicalCard) {
        await user.click(technicalCard);
      }

      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(vi.mocked(toast)).toHaveBeenCalledWith({
          title: 'Industry Required',
          description: 'Please select your technical industry for Stage 4 preparation.',
          variant: 'destructive',
        });
      });
    });

    it('enables start button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Business Manager');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select hiring manager stage
      const hiringManagerCard = screen.getAllByText(/stage 3: hiring manager interview/i)[0].closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('Auto-suggestion Logic', () => {
    it('suggests hiring manager stage for business development roles', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await user.type(screen.getByLabelText(/position/i), 'Business Development Manager');

      await waitFor(() => {
        expect(screen.getByText(/recommended for business development manager/i)).toBeInTheDocument();
      });
    });

    it('suggests technical stage for software engineering roles', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await user.type(screen.getByLabelText(/position/i), 'Software Engineer');

      await waitFor(() => {
        expect(screen.getByText(/recommended for software engineer/i)).toBeInTheDocument();
      });
    });

    it('suggests executive stage for C-level roles', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await user.type(screen.getByLabelText(/position/i), 'CEO');

      await waitFor(() => {
        expect(screen.getByText(/recommended for ceo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Interview Stage Selection', () => {
    it('allows selecting interview stages by clicking cards', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Find the card by looking for the specific card element that has the cursor-pointer class
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('[class*="cursor-pointer"]');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
        // Check that the card appears selected with ring styling
        await waitFor(() => {
          expect(hiringManagerCard).toHaveClass('ring-2');
        });
      }
    });

    it('shows technical industry selector when subject-matter expertise is selected', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const technicalCard = screen.getAllByText(/stage 4: subject-matter expertise/i)[0].closest('div');
      if (technicalCard) {
        await user.click(technicalCard);
        
        await waitFor(() => {
          expect(screen.getByText(/technical industry/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Session Creation', () => {
    it('successfully creates session with valid data', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Business Manager');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select interview stage
      const hiringManagerCard = screen.getAllByText(/stage 3: hiring manager interview/i)[0].closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(vi.mocked(toast)).toHaveBeenCalledWith({
          title: 'Coaching Session Created',
          description: 'Your personalized AI coaching session is ready!',
        });
      });

      expect(mockSetLocation).toHaveBeenCalledWith('/prepare/coaching/session-123');
    });

    it('handles session creation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API to return error by overriding the handler
      server.use(
        http.post('/api/coaching/sessions', () => {
          return HttpResponse.error();
        })
      );

      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Business Manager');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select interview stage
      const hiringManagerCard = screen.getAllByText(/stage 3: hiring manager interview/i)[0].closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(vi.mocked(toast)).toHaveBeenCalledWith({
          title: 'Setup Failed',
          description: 'Failed to create preparation session. Please try again.',
          variant: 'destructive',
        });
      });
    });

  });

  describe('Language Selection', () => {
    it('defaults to English', () => {
      render(<Home />);
      // The default language selection should be visible
      expect(screen.getByText(/english/i)).toBeInTheDocument();
    });

    it('displays language selector with default English selection', () => {
      render(<Home />);

      // Verify the language selector is present and shows English as default
      expect(screen.getByText(/interview language/i)).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<Home />);
      
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });

    it('has proper button accessibility', () => {
      render(<Home />);
      
      const startButton = screen.getByRole('button', { name: /Start AI Coaching Session/i });
      expect(startButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const positionField = screen.getByLabelText(/position/i);
      await user.tab();
      expect(positionField).toHaveFocus();
    });
  });
});