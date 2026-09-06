import { setCorsHeaders } from "./cors.js";

export default function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  return res.status(200).json({
    status: "ok",
    platform: "vercel-serverless",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
