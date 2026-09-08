## 2025-05-18 - XSS via Untrusted Canvas Assignment Descriptions

**Vulnerability:** Canvas assignment descriptions fetched from external LMS feeds or user input were injected directly into the DOM using `dangerouslySetInnerHTML` in `CanvasSyncTab.tsx` without sanitization.

**Learning:** External or synced content from LMS platforms can contain arbitrary HTML embedded with executable `<script>` tags, inline event handlers (`onerror`, `onload`, `onclick`), or `javascript:` URLs that execute in the context of the user's session.

**Prevention:** Always pass untrusted HTML through `sanitizeHtml` (or an established HTML sanitizer) before passing to `dangerouslySetInnerHTML`.
