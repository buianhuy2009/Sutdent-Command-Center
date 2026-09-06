# Sentinel Security Journal

## XSS via SVG Content in DOM Injection
- **Vulnerability:** Rendering SVG strings directly into `dangerouslySetInnerHTML` without sanitization allows execution of arbitrary JavaScript via `<script>` tags, inline event handlers (e.g. `onload`), and `javascript:` URIs embedded in SVG.
- **Fix:** Sanitize SVG string content using DOMPurify with SVG profile settings (`DOMPurify.sanitize(svgContent, { USE_PROFILES: { svg: true, svgFilters: true } })`) prior to setting inner HTML.
