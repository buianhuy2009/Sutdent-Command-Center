// Helper to determine allowed origin for CORS
function getAllowedOrigin(origin) {
  if (!origin) return null;

  // Exact matching origins from environment and defaults
  const envOrigins = [
    process.env.APP_URL,
    process.env.VITE_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()) : []),
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ].filter(Boolean);

  if (envOrigins.includes(origin)) {
    return origin;
  }

  // Allow subdomains on vercel.app for preview deployments
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && (url.hostname === "vercel.app" || url.hostname.endsWith(".vercel.app"))) {
      return origin;
    }
  } catch {
    // invalid origin URL
  }

  return null;
}

export function setCorsHeaders(req, res) {
  const origin = req.headers ? req.headers.origin : undefined;
  const allowed = getAllowedOrigin(origin);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-canvas-token, Accept");
}

export { getAllowedOrigin };
