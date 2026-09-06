# Sentinel Security Journal

## CORS Policy Validation & Multi-Tenant Wildcards

**Vulnerability Pattern:** Permissive CORS checks using wildcard suffix matching on multi-tenant domain spaces (e.g. `origin.endsWith('.vercel.app')`).

**Impact:** In multi-tenant cloud hosting environments (like Vercel, Netlify, Cloudflare Pages, Heroku, Github Pages), any malicious actor can deploy an application under an arbitrary subdomain (e.g., `attacker.vercel.app`). Allowing `*.vercel.app` in `Access-Control-Allow-Origin` permits malicious third-party apps hosted on the same platform to send cross-origin requests to your backend endpoints and read sensitive credentials or data.

**Remediation Strategy:**
1. Never use `endsWith()` or broad regex wildcards for shared multi-tenant SaaS domains in CORS checks.
2. Require exact origin matching against an explicit allowlist of trusted domains (e.g., configured via environment variables like `APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, or `ALLOWED_ORIGINS`).
3. For deployment platforms like Vercel, dynamically normalize `VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL` with standard protocols (`https://`) to construct precise allowlists.
