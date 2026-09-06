import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('CreationStudioWorkspace - SVG Sanitization', () => {
  it('sanitizes dangerous script tags and event handlers in SVG content', () => {
    const maliciousSvg = `<svg onload="alert('xss')">
      <rect width="100" height="100" />
      <script>alert('evil')</script>
      <a href="javascript:alert(1)">Click</a>
    </svg>`;

    const sanitized = DOMPurify.sanitize(maliciousSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });

    expect(sanitized).not.toContain('onload');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:alert(1)');
    expect(sanitized).toContain('<rect');
  });

  it('preserves valid safe SVG structure and elements', () => {
    const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g><circle cx="50" cy="50" r="40" fill="red" /></g>
    </svg>`;

    const sanitized = DOMPurify.sanitize(safeSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });

    expect(sanitized).toContain('<circle');
    expect(sanitized).toContain('fill="red"');
  });
});
