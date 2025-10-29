import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Router, Route } from 'wouter';
import Prepare from '@/pages/prepare';
import Home from '@/pages/home';

// Mock location hook
const mockSetLocation = vi.fn();
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/prepare', mockSetLocation],
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}));

describe('Prepare Module Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Navigation', () => {
    it('renders prepare module correctly', () => {
      render(<Prepare />);
      
      expect(screen.getByText(/master your interview skills/i)).toBeInTheDocument();
      expect(screen.getByText(/prepare/i)).toBeInTheDocument();
    });

    it('shows navigation with prepare module active', () => {
      render(<Prepare />);
      
      // Navigation should show prepare as active
      const prepareLink = screen.getByText(/prepare/i);
      expect(prepareLink.closest('div')).toHaveClass('text-blue-600');
    });

    it('allows navigation between modules', async () => {
      const user = userEvent.setup();
      render(<Prepare />);

      // Click on practice module
      const practiceLink = screen.getByText(/practice/i);
      await user.click(practiceLink);

      // Should navigate to practice module
      expect(window.location.pathname).toBe('/practice');
    });
  });

  describe('Complete Session Setup Flow', () => {
    it('completes full session creation flow successfully', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Step 1: Fill position field
      const positionField = screen.getByLabelText(/position/i);
      await user.type(positionField, 'Business Development Manager');

      // Verify auto-suggestion works
      await waitFor(() => {
        expect(screen.getByText(/recommended for business development manager/i)).toBeInTheDocument();
      });

      // Step 2: Fill company field
      const companyField = screen.getByLabelText(/company/i);
      await user.type(companyField, 'Microsoft');

      // Step 3: Interview stage should be auto-selected, but let's verify and click it
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      expect(hiringManagerCard).toHaveClass('ring-2'); // Should be auto-selected
      
      // Step 4: Select language (optional - defaults to English)
      const languageSelector = screen.getByRole('combobox');
      await user.click(languageSelector);
      
      const englishOption = screen.getByText('English');
      await user.click(englishOption);

      // Step 5: Start session
      const startButton = screen.getByText(/start preparation session/i);
      expect(startButton).not.toBeDisabled();
      
      await user.click(startButton);

      // Verify success flow
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });

      expect(mockSetLocation).toHaveBeenCalledWith('/prepare/dashboard?sessionId=session-123');
    });

    it('handles technical role flow with industry selection', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill technical position
      await user.type(screen.getByLabelText(/position/i), 'Software Engineer');
      await user.type(screen.getByLabelText(/company/i), 'Google');

      // Verify technical stage is auto-selected
      await waitFor(() => {
        expect(screen.getByText(/recommended for software engineer/i)).toBeInTheDocument();
      });

      // Should show industry selector for technical roles
      expect(screen.getByText(/technical industry/i)).toBeInTheDocument();

      // Select industry
      const industrySelector = screen.getByRole('combobox', { name: /technical industry/i });
      await user.click(industrySelector);
      
      const softwareOption = screen.getByText(/software development/i);
      await user.click(softwareOption);

      // Start session
      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      // Should successfully create session
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });
    });

    it('handles job description upload in the flow', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill basic fields
      await user.type(screen.getByLabelText(/position/i), 'Product Manager');
      await user.type(screen.getByLabelText(/company/i), 'Apple');

      // Upload job description
      const file = new File(['job description content'], 'product-manager.pdf', { 
        type: 'application/pdf' 
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      // Wait for upload to complete
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Successful',
          description: 'Your job description has been uploaded successfully.',
        });
      });

      // Select the uploaded job description
      const selectButton = screen.getByText(/select/i);
      await user.click(selectButton);

      // Start session with job description
      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      // Should create session successfully
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });
    });
  });

  describe('Error Recovery Flow', () => {
    it('handles API failures gracefully and allows retry', async () => {
      const user = userEvent.setup();
      
      // Mock API failure on first call, success on second
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response(JSON.stringify([{
          id: 'scenario-123',
          title: 'Test Scenario',
        }])));
      });

      render(<Home />);

      // Fill form
      await user.type(screen.getByLabelText(/position/i), 'Manager');
      await user.type(screen.getByLabelText(/company/i), 'Test Company');

      // First attempt - should fail
      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to create session. Please try again.',
          variant: 'destructive',
        });
      });

      // Second attempt - should succeed
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });
    });

    it('validates required fields and shows appropriate errors', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Try to start without filling fields
      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Missing Information',
          description: 'Please fill in all fields to continue.',
          variant: 'destructive',
        });
      });

      // Fill position only
      await user.type(screen.getByLabelText(/position/i), 'Developer');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Missing Information',
          description: 'Please fill in all fields to continue.',
          variant: 'destructive',
        });
      });

      // Fill all required fields
      await user.type(screen.getByLabelText(/company/i), 'Tech Corp');
      
      // Select interview stage
      const hiringManagerCard = screen.getByText(/stage 3: hiring manager interview/i).closest('div');
      if (hiringManagerCard) {
        await user.click(hiringManagerCard);
      }

      // Now should work
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });
    });
  });

  describe('Multi-language Flow', () => {
    it('handles different language selections correctly', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill basic fields
      await user.type(screen.getByLabelText(/position/i), 'Sales Manager');
      await user.type(screen.getByLabelText(/company/i), 'Singapore Corp');

      // Select Bahasa Malaysia
      const languageSelector = screen.getByRole('combobox');
      await user.click(languageSelector);
      
      const malaysiaOption = screen.getByText('Bahasa Malaysia');
      await user.click(malaysiaOption);

      // Start session
      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      // Should create session with selected language
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });

      // Verify the session was created with correct language
      expect(mockSetLocation).toHaveBeenCalledWith('/prepare/dashboard?sessionId=session-123');
    });

    it('displays language-specific content correctly', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Open language selector
      const languageSelector = screen.getByRole('combobox');
      await user.click(languageSelector);

      // Verify ASEAN languages are displayed
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Bahasa Malaysia')).toBeInTheDocument();
      expect(screen.getByText('Bahasa Indonesia')).toBeInTheDocument();
      expect(screen.getByText('ไทย (Thai)')).toBeInTheDocument();
      expect(screen.getByText('Tiếng Việt (Vietnamese)')).toBeInTheDocument();
      expect(screen.getByText('Filipino')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('works correctly on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const user = userEvent.setup();
      render(<Home />);

      // Should still render all essential elements
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByText(/start preparation session/i)).toBeInTheDocument();

      // Mobile interaction should work
      await user.type(screen.getByLabelText(/position/i), 'Mobile Tester');
      await user.type(screen.getByLabelText(/company/i), 'Mobile Company');

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      });
    });
  });

  describe('Performance and Loading', () => {
    it('handles slow API responses gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve(new Response(JSON.stringify([{ id: 'slow-scenario' }]))), 
            2000
          )
        )
      );

      render(<Home />);

      // Fill form
      await user.type(screen.getByLabelText(/position/i), 'Slow Test');
      await user.type(screen.getByLabelText(/company/i), 'Slow Company');

      const startButton = screen.getByText(/start preparation session/i);
      await user.click(startButton);

      // Should show loading state
      expect(screen.getByText(/starting session/i)).toBeInTheDocument();
      expect(startButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Session Created',
          description: 'Your interview preparation session has been started.',
        });
      }, { timeout: 3000 });
    });
  });
});