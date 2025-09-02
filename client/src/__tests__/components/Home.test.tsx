import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import Home from '@/pages/home';

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
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}));

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<Home />);
      expect(screen.getByText('Master Your Interview Skills')).toBeInTheDocument();
    });

    it('displays all required form fields', () => {
      render(<Home />);
      
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByText(/interview stage/i)).toBeInTheDocument();
      expect(screen.getByText(/start preparation session/i)).toBeInTheDocument();
    });

    it('displays all interview stage options', () => {
      render(<Home />);
      
      expect(screen.getByText(/stage 1: phone\/initial screening/i)).toBeInTheDocument();
      expect(screen.getByText(/stage 2: functional\/team interview/i)).toBeInTheDocument();
      expect(screen.getByText(/stage 3: hiring manager interview/i)).toBeInTheDocument();
      expect(screen.getByText(/stage 4: subject-matter expertise/i)).toBeInTheDocument();
      expect(screen.getByText(/stage 5: executive\/final round/i)).toBeInTheDocument();
    });

    it('displays language selector', () => {
      render(<Home />);
      expect(screen.getByText(/asean multi-language support/i)).toBeInTheDocument();
    });

    it('displays job description upload section', () => {
      render(<Home />);
      expect(screen.getByText(/supercharge your preparation with your job description/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when trying to start session without required fields', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Missing Information',
          description: 'Please fill in all fields to continue.',
          variant: 'destructive',
        });
      });
    });

    it('shows error when technical stage selected without industry', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Software Engineer');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select technical interview stage
      const technicalCard = screen.getByText(/stage 4: subject-matter expertise/i).closest('div');
      if (technicalCard) {
        await user.click(technicalCard);
      }

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
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
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByText(/start preparation session/i);
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

      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
        expect(hiringManagerCard).toHaveClass('ring-2');
      }
    });

    it('shows technical industry selector when subject-matter expertise is selected', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const technicalCard = screen.getByText(/stage 4: subject-matter expertise/i).closest('div');
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
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });

      expect(mockSetLocation).toHaveBeenCalledWith('/prepare/dashboard?sessionId=session-123');
    });

    it('handles session creation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API to return error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));

      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Business Manager');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select interview stage
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to create session. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('shows loading state during session creation', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill required fields
      await user.type(screen.getByLabelText(/position/i), 'Business Manager');
      await user.type(screen.getByLabelText(/company/i), 'Microsoft');
      
      // Select interview stage
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/starting session/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Language Selection', () => {
    it('defaults to English', () => {
      render(<Home />);
      // The default language selection should be visible
      expect(screen.getByText(/english/i)).toBeInTheDocument();
    });

    it('allows selecting different ASEAN languages', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Find and click language selector
      const languageSelector = screen.getByRole('combobox');
      await user.click(languageSelector);

      // Should show ASEAN language options
      await waitFor(() => {
        expect(screen.getByText(/bahasa malaysia/i)).toBeInTheDocument();
        expect(screen.getByText(/bahasa indonesia/i)).toBeInTheDocument();
        expect(screen.getByText(/thai/i)).toBeInTheDocument();
      });
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
      
      const startButton = screen.getByRole('button', { name: /start preparation session/i });
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