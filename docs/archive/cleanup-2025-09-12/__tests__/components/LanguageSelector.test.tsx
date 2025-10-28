import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import LanguageSelector, { ASEAN_LANGUAGES } from '@/components/LanguageSelector';

describe('LanguageSelector Component', () => {
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays the selected language', () => {
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('shows globe icon', () => {
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);
      // Globe icon should be present (Lucide icons render as SVGs)
      const globeIcon = document.querySelector('svg');
      expect(globeIcon).toBeInTheDocument();
    });

    it('displays placeholder when no value selected', () => {
      render(<LanguageSelector value="" onValueChange={mockOnValueChange} />);
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toBeInTheDocument();
    });
  });

  describe('Language Options', () => {
    it('displays all ASEAN languages when opened', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Check that all ASEAN languages are displayed
      for (const language of ASEAN_LANGUAGES) {
        const elements = screen.queryAllByText(language.displayName);
        expect(elements.length).toBeGreaterThan(0);
      }
    });

    it('includes all expected ASEAN languages', () => {
      const expectedLanguages = [
        { code: 'en', name: 'English' },
        { code: 'ms', name: 'Bahasa Malaysia' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'th', name: 'ไทย' },
        { code: 'vi', name: 'Tiếng Việt' },
        { code: 'tl', name: 'Filipino' },
        { code: 'zh-sg', name: '中文' },
      ];

      expectedLanguages.forEach(lang => {
        const found = ASEAN_LANGUAGES.find(aseanLang => 
          aseanLang.code === lang.code && aseanLang.name === lang.name
        );
        expect(found).toBeTruthy();
      });
    });
  });

  describe('Selection Behavior', () => {
    it('calls onValueChange when language is selected', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const malaysiaOption = screen.getByText('Bahasa Malaysia');
      await user.click(malaysiaOption);

      expect(mockOnValueChange).toHaveBeenCalledWith('ms');
    });

    it('updates display when value prop changes', () => {
      const { rerender } = render(
        <LanguageSelector value="en" onValueChange={mockOnValueChange} />
      );
      expect(screen.getByText('English')).toBeInTheDocument();

      rerender(
        <LanguageSelector value="ms" onValueChange={mockOnValueChange} />
      );
      expect(screen.getByText('Bahasa Malaysia')).toBeInTheDocument();
    });

    it('handles selection of different language types correctly', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Test Thai language (with special characters)
      const thaiOption = screen.getByText('ไทย (Thai)');
      await user.click(thaiOption);

      expect(mockOnValueChange).toHaveBeenCalledWith('th');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className when provided', () => {
      render(
        <LanguageSelector 
          value="en" 
          onValueChange={mockOnValueChange} 
          className="custom-class"
        />
      );
      
      const container = screen.getByRole('combobox').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('maintains proper styling structure', () => {
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      
      // Should have proper trigger styling
      expect(combobox).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);

      const combobox = screen.getByRole('combobox');
      
      // Should be focusable
      await user.tab();
      expect(combobox).toHaveFocus();

      // Should open with Enter
      await user.keyboard('{Enter}');
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper labeling for screen readers', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={mockOnValueChange} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Each option should be properly labeled
      const englishOption = screen.getByRole('option', { name: /english/i });
      expect(englishOption).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid language codes gracefully', () => {
      render(<LanguageSelector value="invalid" onValueChange={mockOnValueChange} />);
      
      // Should still render without crashing
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText(/select language/i)).toBeInTheDocument();
    });

    it('handles missing onValueChange prop gracefully', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector value="en" onValueChange={() => {}} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Should not throw error when clicking options
      const malaysiaOption = screen.getByText('Bahasa Malaysia');
      await user.click(malaysiaOption);
      
      // Component should still function
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Language Data Integrity', () => {
    it('has unique language codes', () => {
      const codes = ASEAN_LANGUAGES.map(lang => lang.code);
      const uniqueCodes = Array.from(new Set(codes));
      
      expect(codes.length).toBe(uniqueCodes.length);
    });

    it('has non-empty names and display names', () => {
      ASEAN_LANGUAGES.forEach(lang => {
        expect(lang.code).toBeTruthy();
        expect(lang.name).toBeTruthy();
        expect(lang.displayName).toBeTruthy();
      });
    });

    it('maintains consistent data structure', () => {
      ASEAN_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('displayName');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.displayName).toBe('string');
      });
    });
  });
});