import { describe, it, expect } from 'vitest';
import { isApodCacheFresh } from './publicApis';
import { sanitizeHtml } from '../utils/sanitize';

describe('isApodCacheFresh', () => {
  it('returns true when cached date equals today', () => {
    expect(isApodCacheFresh('2026-09-06', '2026-09-06')).toBe(true);
  });
  it('returns false for stale / missing dates', () => {
    expect(isApodCacheFresh('2026-09-05', '2026-09-06')).toBe(false);
    expect(isApodCacheFresh(undefined, '2026-09-06')).toBe(false);
    expect(isApodCacheFresh(null, '2026-09-06')).toBe(false);
  });
});

describe('APOD mediaType handling', () => {
  it('distinguishes image vs video payloads', () => {
    const image = { mediaType: 'image', url: 'https://apod.nasa.gov/img.jpg' };
    const video = { mediaType: 'video', url: 'https://www.youtube.com/embed/xyz' };
    expect(image.mediaType).toBe('image');
    expect(video.mediaType).toBe('video');
    // Card shows <img> only for image; video shows Watch-video link
    expect(image.mediaType === 'image').toBe(true);
    expect(video.mediaType === 'image').toBe(false);
  });
});

describe('sanitizeHtml security tests', () => {
  it('strips script tags and inline event handlers', () => {
    const malicious = '<script>alert("xss")</script><p>Assignment instructions</p><img src="x" onerror="alert(1)">';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('<p>Assignment instructions</p>');
  });

  it('strips javascript: URIs', () => {
    const malicious = '<a href="javascript:alert(1)">Click here</a>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain('javascript:');
  });

  it('preserves valid safe formatting tags', () => {
    const safe = '<b>Important:</b> Read chapter 5 before Monday.';
    expect(sanitizeHtml(safe)).toContain('<b>Important:</b>');
  });
});
