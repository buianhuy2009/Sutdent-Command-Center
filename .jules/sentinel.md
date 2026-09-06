## 2025-05-18 - Canvas Proxy Allowlist Bypass via Unfiltered Host Array
**Vulnerability:** A trailing comma or empty string in `CANVAS_ALLOWED_HOSTS` created an empty string item `""` in the allowed host array. `u.hostname.endsWith("." + "")` evaluated to `true` for all domain names, completely bypassing the Canvas proxy host allowlist.
**Learning:** Always use `.filter(Boolean)` when splitting comma-separated environment variables to prevent empty string tokens from matching arbitrary strings.
**Prevention:** Sanitize domain allowlists with `.filter(Boolean)` and validate target protocols (`https://`) before proxying HTTP requests.
