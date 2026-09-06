# Sentinel Security Journal

## API Key Storage in Web Browsers
- **Vulnerability:** Plaintext API keys saved directly to `localStorage` (e.g., `scc_gemini_api_key`, `scc_groq_api_key`) are exposed to XSS attacks, malicious third-party scripts, and browser extensions running on the origin.
- **Remediation Pattern:**
  - Prefer `sessionStorage` for short-lived session API key storage.
  - When storing API keys persistently in `localStorage`, encrypt/obfuscate the key prior to calling `localStorage.setItem`.
  - Use getter functions (`getClientGeminiApiKey()`, `getClientGroqApiKey()`) that transparently decrypt stored keys and automatically migrate any existing legacy plaintext keys to the encrypted format.
