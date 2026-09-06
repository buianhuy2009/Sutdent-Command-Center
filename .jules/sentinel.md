# Sentinel Journal - Security & SSRF Protections

## Vulnerability Patterns & Mitigations

### Server-Side Request Forgery (SSRF) in Proxy Endpoints
- **Issue:** Proxy endpoints that accept target URLs from client input can be abused to access internal services, metadata endpoints (e.g. `169.254.169.254`), or unintended third-party hosts if target hostnames are not strict allowlisted.
- **Defense Pattern:**
  1. Validate URL protocol (`http:` and `https:` only).
  2. Parse URL with standard URL parser (`new URL(targetUrl)`).
  3. Validate hostname against strict domain allowlist (e.g., `instructure.com`, `canvaslms.com`, or custom domain environment variable `CANVAS_ALLOWED_HOSTS`).
  4. Compare hostnames using exact equality (`hostname === h`) or exact subdomain suffix matching (`hostname.endsWith("." + h)`).
  5. Deny requests immediately with HTTP 400 if hostname is not allowlisted before performing any `fetch` or downstream request.
- **Header vs. Body Token Passing:** Pass sensitive authentication tokens (like Canvas API tokens) in POST body when possible to avoid accidental edge/access log exposure of raw authorization headers.
