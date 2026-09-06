# Sentinel Security Journal

## Vulnerabilities Fixed & Patterns

### Cross-Site Scripting (XSS) in Unsanitized Canvas API HTML (`dangerouslySetInnerHTML`)
- **Issue:** Assignment descriptions and rich-text content received from Canvas LMS API or external feeds were rendered directly using React's `dangerouslySetInnerHTML={{ __html: description }}` without sanitization.
- **Risk:** Malicious users or courses could embed XSS vectors (e.g., `<script>`, `<img onerror=...>`) to steal session tokens or execute arbitrary JS.
- **Solution:** Always wrap untrusted/external HTML string content in `DOMPurify.sanitize(content)` before passing to `dangerouslySetInnerHTML`.
