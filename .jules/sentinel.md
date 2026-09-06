# Sentinel Security Journal

## CORS Policy Vulnerability Prevention
- **Avoid Wildcard (`*`) Origins in Authenticated or Proxy Endpoints:** Wildcard `Access-Control-Allow-Origin: *` headers expose serverless proxy and auth endpoints to Cross-Origin Resource Sharing (CORS) exploitation from arbitrary malicious third-party origins.
- **Dynamic Origin Allowlisting:** Validate incoming `req.headers.origin` against a strictly controlled list of allowed origins (environment variables such as `APP_URL`, `VERCEL_URL`, local dev origins, and validated preview domains).
- **Include `Vary: Origin`:** Whenever returning dynamic `Access-Control-Allow-Origin` values based on request headers, set `Vary: Origin` to ensure downstream CDNs and caches do not serve cached CORS responses to mismatched origins.
- **Strict Domain Checking:** Use `new URL(origin)` parsing and enforce exact domain or protocol/hostname suffix matching (`https://*.vercel.app`) to prevent domain spoofing (e.g. `attacker-vercel.app.evil.com`).
