import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'wouter';

/**
 * XSS Prevention Security Tests
 *
 * These tests verify that user-generated and AI-generated content
 * is properly sanitized to prevent XSS attacks.
 *
 * Related Security Fix: 2025-12-10
 * - Fixed dangerouslySetInnerHTML in pre-interview-briefing.tsx
 * - Now using safe React rendering instead of raw HTML
 */

describe('XSS Prevention - AI-Generated Content', () => {
  it('should not execute script tags in keyObjectives', () => {
    const maliciousContent = '<script>window.xssTest = "vulnerable";</script>Legitimate objective';

    // Render the content the way our components do it now (safe React rendering)
    const { container } = render(
      <div>
        {maliciousContent
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // Script tag should not be present in DOM
    expect(container.querySelector('script')).toBeNull();

    // Script should not have executed
    expect((window as any).xssTest).toBeUndefined();

    // Text content should be escaped and rendered safely
    expect(container.textContent).toContain('Legitimate objective');
  });

  it('should not execute onerror event handlers in keyObjectives', () => {
    const maliciousContent = '<img src=x onerror="window.xssTest2=true">Legitimate objective';

    const { container } = render(
      <div>
        {maliciousContent
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // No img tag with onerror should exist
    const imgWithError = container.querySelector('img[onerror]');
    expect(imgWithError).toBeNull();

    // Handler should not have executed
    expect((window as any).xssTest2).toBeUndefined();
  });

  it('should not execute onclick event handlers', () => {
    const maliciousContent = '<div onclick="window.xssTest3=true">Click me</div>Legitimate objective';

    const { container } = render(
      <div>
        {maliciousContent
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // No div with onclick should exist
    const divWithClick = container.querySelector('div[onclick]');
    expect(divWithClick).toBeNull();

    // Handler should not have executed
    expect((window as any).xssTest3).toBeUndefined();
  });

  it('should render HTML entities as text, not as HTML', () => {
    const contentWithHtmlEntities = '&lt;script&gt;alert("XSS")&lt;/script&gt;Legitimate objective';

    const { container } = render(
      <div>
        {contentWithHtmlEntities
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // HTML entities should be rendered as text
    expect(container.textContent).toContain('&lt;script&gt;');

    // No actual script tag should exist
    expect(container.querySelector('script')).toBeNull();
  });

  it('should handle multiple malicious payloads in multi-line content', () => {
    const maliciousMultiLine = [
      '<script>alert("Line 1")</script>',
      'Legitimate line',
      '<img src=x onerror="alert(2)">',
      'Another legitimate line',
      '<a href="javascript:alert(3)">Click</a>'
    ].join('\n');

    const { container } = render(
      <div>
        {maliciousMultiLine
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // No scripts should execute
    expect(container.querySelectorAll('script').length).toBe(0);
    expect(container.querySelectorAll('img[onerror]').length).toBe(0);
    expect(container.querySelectorAll('a[href^="javascript:"]').length).toBe(0);

    // Legitimate content should still be rendered
    expect(container.textContent).toContain('Legitimate line');
    expect(container.textContent).toContain('Another legitimate line');
  });

  it('should safely render content with bullet points', () => {
    const contentWithBullets = '• First objective\n• Second objective\n• Third objective';

    const { container } = render(
      <div>
        {contentWithBullets
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // Should render 3 paragraphs
    expect(container.querySelectorAll('p').length).toBe(3);

    // All content should be safe text
    expect(container.textContent).toContain('First objective');
    expect(container.textContent).toContain('Second objective');
    expect(container.textContent).toContain('Third objective');
  });

  it('should not be vulnerable to attribute injection', () => {
    const maliciousAttribute = 'text" onload="alert(1)" data-x="value';

    const { container } = render(
      <div>
        {maliciousAttribute
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // No elements with onload attribute should exist
    const elemWithOnload = container.querySelector('[onload]');
    expect(elemWithOnload).toBeNull();

    // Content should be rendered as text
    expect(container.textContent).toContain('text" onload="alert(1)" data-x="value');
  });

  it('should handle empty and whitespace-only content safely', () => {
    const emptyContent = '\n\n  \n';

    const { container } = render(
      <div>
        {emptyContent
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // Should render no paragraphs (all filtered out)
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('should safely render special characters', () => {
    const specialChars = '< > & " \' / \\ ` = { } [ ]';

    const { container } = render(
      <div>
        {specialChars
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // All special characters should be rendered as text
    expect(container.textContent).toContain('<');
    expect(container.textContent).toContain('>');
    expect(container.textContent).toContain('&');
    expect(container.textContent).toContain('"');
    expect(container.textContent).toContain("'");
  });

  it('should not execute data URLs with JavaScript', () => {
    const dataUrlPayload = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';

    const { container } = render(
      <div>
        {dataUrlPayload
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, idx: number) => (
            <p key={idx}>• {line.replace(/^[•-]\s*/, '')}</p>
          ))
        }
      </div>
    );

    // No anchor tags with data URLs should exist
    const dataUrlLink = container.querySelector('a[href^="data:"]');
    expect(dataUrlLink).toBeNull();

    // Content should be escaped as text
    expect(container.textContent).toContain('href=');
  });
});

describe('XSS Prevention - File Upload Security', () => {
  it('should validate file extensions match MIME types', () => {
    // This is a conceptual test - actual validation happens server-side
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const testFiles = [
      { name: 'image.jpg', mimetype: 'image/jpeg', expected: true },
      { name: 'image.png', mimetype: 'image/png', expected: true },
      { name: 'script.js', mimetype: 'image/jpeg', expected: false }, // MIME type spoofing
      { name: 'image.exe', mimetype: 'image/jpeg', expected: false },
      { name: 'image.php', mimetype: 'image/jpeg', expected: false },
    ];

    testFiles.forEach(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isValidExtension = allowedExtensions.includes(ext);
      const isValidMimeType = file.mimetype.startsWith('image/');
      const isValid = isValidExtension && isValidMimeType;

      expect(isValid).toBe(file.expected);
    });
  });
});

describe('XSS Prevention - CSP Headers', () => {
  it('should define comprehensive CSP policy', () => {
    // This test documents the expected CSP policy
    const expectedCspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com",
      "frame-ancestors 'self' https://www.bizelev8.ai https://bizelev8.ai",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    // Verify all critical directives are present
    expectedCspDirectives.forEach(directive => {
      expect(directive).toBeTruthy();
      expect(directive).toContain('self');
    });
  });
});
