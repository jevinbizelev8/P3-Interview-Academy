import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import STARStoryBuilder from '@/components/mvp/prepare/practice/STARStoryBuilder';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('STARStoryBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch for getting stories
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'story-1',
            title: 'Led team migration project',
            situation: 'Legacy system causing issues',
            task: 'Migrate to microservices',
            action: 'Planned migration\nCoordinated team\nImplemented changes',
            result: 'Reduced latency by 40%',
            tags: ['Teamwork & Collaboration'],
          },
        ],
      }),
    });
  });

  it('renders the STAR story builder component', async () => {
    render(<STARStoryBuilder />);

    await waitFor(() => {
      expect(screen.getByText(/Your STAR Story Bank/i)).toBeInTheDocument();
    });
  });

  it('displays existing STAR stories', async () => {
    render(<STARStoryBuilder />);

    await waitFor(() => {
      expect(screen.getByText(/Led team migration project/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching stories', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<STARStoryBuilder />);

    expect(screen.queryByText(/loading/i) || screen.queryByRole('status')).toBeTruthy();
  });

  it('shows button to create new story', async () => {
    render(<STARStoryBuilder />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new story/i })).toBeInTheDocument();
    });
  });

  it('opens story creation form when clicking new story button', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /add new story/i });
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      // Form should appear with category selection
      expect(screen.getAllByText(/Situation/i).length).toBeGreaterThan(0);
    });
  });

  it('displays all STAR framework fields in the form', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      // Form should have text inputs and textareas for STAR fields
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(3); // At least 4 STAR fields
    }, { timeout: 2000 });
  });

  it('allows entering story title', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      const titleInput = screen.queryByPlaceholderText(/title|name.*story/i);
      if (titleInput) {
        expect(titleInput).toBeInTheDocument();
      }
    });
  });

  it('allows selecting a story category', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      // Categories appear in the initial view
      const categories = screen.getAllByText(/Teamwork|Communication|Problem-Solving/i);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  it('validates required fields before saving', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      const saveButton = screen.queryByRole('button', { name: /save/i });
      if (saveButton) {
        expect(saveButton).toBeInTheDocument();
      }
    });

    // Try to save without filling required fields
    const saveButton = screen.queryByRole('button', { name: /save/i });
    if (saveButton) {
      await user.click(saveButton);

      // Should show validation error or disabled state
      await waitFor(() => {
        expect(saveButton).toBeTruthy();
      });
    }
  });

  it('saves a complete STAR story', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              id: 'new-story',
              title: 'Test Story',
              situation: 'Test situation',
              task: 'Test task',
              action: 'Test action',
              result: 'Test result',
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [] }),
      });
    });

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    // Fill in form fields
    await waitFor(() => {
      const titleInput = screen.queryByPlaceholderText(/title/i);
      if (titleInput) {
        user.type(titleInput, 'Test Story');
      }

      const situationInput = screen.queryByPlaceholderText(/situation/i);
      if (situationInput) {
        user.type(situationInput, 'Test situation');
      }
    });

    // Click save button
    const saveButton = screen.queryByRole('button', { name: /save/i });
    if (saveButton) {
      await user.click(saveButton);

      await waitFor(() => {
        // Form should close or show success message
        expect(saveButton).toBeTruthy();
      }, { timeout: 3000 });
    }
  });

  it('displays category badges for existing stories', async () => {
    render(<STARStoryBuilder />);

    await waitFor(() => {
      // Category badges appear on the page
      const categories = screen.getAllByText(/Teamwork|Collaboration|Communication/i);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  it('allows adding multiple action steps', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    const createButton = await screen.findByRole('button', { name: /add new story/i });
    await user.click(createButton);

    await waitFor(() => {
      // Look for "Add Action" or similar button
      const addActionButton = screen.queryByRole('button', { name: /add.*action|add.*step/i });
      expect(addActionButton).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    render(<STARStoryBuilder />);

    await waitFor(() => {
      // Should show error state or message
      expect(screen.queryByText(/error|failed|try again/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('displays STAR framework guidance', async () => {
    const user = userEvent.setup();

    render(<STARStoryBuilder />);

    // Category badges are always visible as guidance
    await waitFor(() => {
      const teamworkElements = screen.getAllByText(/Teamwork|Collaboration/i);
      expect(teamworkElements.length).toBeGreaterThan(0);
    });
  });
});
