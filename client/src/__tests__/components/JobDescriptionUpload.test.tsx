import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import JobDescriptionUpload from '@/components/JobDescriptionUpload';
import { mockJobDescriptions } from '../utils/mocks/handlers';

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}));

describe('JobDescriptionUpload Component', () => {
  const mockOnJobDescriptionSelect = vi.fn();
  const defaultProps = {
    userId: 'test-user-123',
    selectedJobDescriptionId: undefined,
    onJobDescriptionSelect: mockOnJobDescriptionSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/upload job description/i)).toBeInTheDocument();
      });
    });

    it('displays upload instructions', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/drag & drop your job description/i)).toBeInTheDocument();
        expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
      });
    });

    it('shows file format information', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/pdf, doc, docx \(max 5mb\)/i)).toBeInTheDocument();
      });
    });

    it('displays existing job descriptions when loaded', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('business-manager-job.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload Functionality', () => {
    it('opens file dialog when upload area is clicked', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const uploadArea = screen.getByText(/drag & drop your job description/i).closest('div');
      expect(uploadArea).toBeInTheDocument();

      // Mock file input click
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      if (uploadArea) {
        await user.click(uploadArea);
      }
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('handles file selection and upload', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Successful',
          description: 'Your job description has been uploaded successfully.',
        });
      });
    });

    it('validates file size (5MB limit)', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: 'File too large. Maximum size is 5MB.',
          variant: 'destructive',
        });
      });
    });

    it('validates file type', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid File Type',
          description: 'Please upload a PDF, DOC, or DOCX file.',
          variant: 'destructive',
        });
      });
    });

    it('shows upload progress during file upload', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      // Should show uploading state
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);

      const uploadArea = screen.getByText(/drag & drop your job description/i).closest('div');
      expect(uploadArea).toBeInTheDocument();

      if (uploadArea) {
        // Simulate drag over
        const dragEvent = new DragEvent('dragover', {
          bubbles: true,
          dataTransfer: new DataTransfer(),
        });
        
        uploadArea.dispatchEvent(dragEvent);
        
        // Should add visual feedback
        await waitFor(() => {
          expect(uploadArea).toHaveClass('border-blue-500');
        });
      }
    });

    it('handles file drop', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);

      const uploadArea = screen.getByText(/drag & drop your job description/i).closest('div');
      expect(uploadArea).toBeInTheDocument();

      if (uploadArea) {
        const file = new File(['test content'], 'dropped.pdf', { type: 'application/pdf' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          dataTransfer,
        });

        uploadArea.dispatchEvent(dropEvent);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Upload Successful',
            description: 'Your job description has been uploaded successfully.',
          });
        });
      }
    });

    it('removes drag styling on drag leave', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);

      const uploadArea = screen.getByText(/drag & drop your job description/i).closest('div');
      expect(uploadArea).toBeInTheDocument();

      if (uploadArea) {
        // Simulate drag over then drag leave
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          dataTransfer: new DataTransfer(),
        });
        
        const dragLeaveEvent = new DragEvent('dragleave', {
          bubbles: true,
        });

        uploadArea.dispatchEvent(dragOverEvent);
        uploadArea.dispatchEvent(dragLeaveEvent);

        await waitFor(() => {
          expect(uploadArea).not.toHaveClass('border-blue-500');
        });
      }
    });
  });

  describe('Job Description Management', () => {
    it('displays existing job descriptions', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('business-manager-job.pdf')).toBeInTheDocument();
      });
    });

    it('allows selecting existing job descriptions', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      await waitFor(() => {
        const selectButton = screen.getByText(/select/i);
        expect(selectButton).toBeInTheDocument();
      });

      const selectButton = screen.getByText(/select/i);
      await user.click(selectButton);

      expect(mockOnJobDescriptionSelect).toHaveBeenCalledWith(mockJobDescriptions[0]);
    });

    it('allows deleting job descriptions', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Job Description Deleted',
          description: 'The job description has been removed successfully.',
        });
      });
    });

    it('shows selected job description state', () => {
      render(
        <JobDescriptionUpload 
          {...defaultProps} 
          selectedJobDescriptionId="job-desc-1"
        />
      );

      expect(screen.getByText(/selected/i)).toBeInTheDocument();
    });

    it('allows deselecting job descriptions', async () => {
      const user = userEvent.setup();
      render(
        <JobDescriptionUpload 
          {...defaultProps} 
          selectedJobDescriptionId="job-desc-1"
        />
      );

      const deselectButton = screen.getByText(/deselect/i);
      await user.click(deselectButton);

      expect(mockOnJobDescriptionSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Loading States', () => {
    it('shows loading state when fetching job descriptions', () => {
      // Mock loading state by making the query return loading
      const { rerender } = render(<JobDescriptionUpload {...defaultProps} />);
      
      // During initial render, should show loading state
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows uploading state during file upload', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors during upload', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to return error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Upload failed'));
      
      render(<JobDescriptionUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: 'An error occurred while uploading your file. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('handles API errors during deletion', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to return error for delete request
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Delete failed'));
      
      render(<JobDescriptionUpload {...defaultProps} />);

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Delete Failed',
          description: 'An error occurred while deleting the file. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Network error'));
      
      render(<JobDescriptionUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Upload Failed',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<JobDescriptionUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('aria-label', 'Upload job description');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      await waitFor(() => {
        const selectButton = screen.getByText(/select/i);
        expect(selectButton).toBeInTheDocument();
      });

      // Should be able to tab to buttons
      await user.tab();
      expect(screen.getByText(/select/i)).toHaveFocus();
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<JobDescriptionUpload {...defaultProps} />);

      const uploadArea = screen.getByText(/drag & drop your job description/i).closest('div');
      
      // Should be focusable
      if (uploadArea) {
        uploadArea.focus();
        expect(uploadArea).toHaveFocus();
      }
    });
  });
});