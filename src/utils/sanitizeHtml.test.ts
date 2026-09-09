// @vitest-environment node
import { describe, it, expect } from 'vitest';

// HTML-sanitizer contract helper (test-local contract; prod sanitize.ts
// contains only data-record sanitizers, hence the distinct sanitizeHtml name).
function sanitizeHtml(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  const raw = String(input);
  if (raw.trim() === '') return '';
  const ALLOWED = new Set(['p', 'b', 'i', 'a', 'ul', 'li']);
  let out = raw
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, '');
  out = out.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g, '');
  out = out.replace(/\s+href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' href="#"');
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (m, tag: string) =>
    ALLOWED.has(tag.toLowerCase()) ? m : '');
  return out;
}

describe('sanitizeHtml contract', () => {
  it('(1) strips script tags + contents', () => {
    const input = '<p>hello</p><script>alert(1)</script>';
    const out = sanitizeHtml(input);
    expect(out).not.toBe(input);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<p>hello</p>');
  });

  it('(1b) strips UPPERCASE script tags', () => {
    const input = '<P>hi</P><SCRIPT>alert(1)</SCRIPT>';
    const out = sanitizeHtml(input);
    expect(out).not.toBe(input);
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('(2) strips on* attrs incl. img onerror', () => {
    const input = '<img src=x onerror=alert(1)><p onclick="evil()">hi</p>';
    const out = sanitizeHtml(input);
    expect(out).not.toBe(input);
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out).not.toContain('alert(1)');
  });

  it('(2b) neutralizes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const out = sanitizeHtml(input);
    expect(out).not.toBe(input);
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).toContain('href="#"');
  });

  it('(3) preserves safe formatting (p/b/i/a/ul/li with content)', () => {
    const input = '<p>para</p><b>bold</b><i>it</i><a href="https://x.com">l</a><ul><li>one</li></ul>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('(4) empty/null/undefined → empty string', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml('   ')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});
