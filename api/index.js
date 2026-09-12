// Single-function API router (api/index.js is the ONLY file under api/ by design).
// Vercel Hobby allows max 12 Serverless Functions per deployment; 13 file-routed
// handlers failed every deploy at "Deploying outputs..." with no build error
// (see dpl_29g1j9oUm, 2026-09-06). Handler implementations live in
// src/server/api-handlers/* (bundled into this one function via nft) so the
// route table below stays identical and no client URL changes.
import handleHealth from "../src/server/api-handlers/health.js";
import handleCanvasProxy from "../src/server/api-handlers/canvas/proxy.js";
import handleAssistant from "../src/server/api-handlers/gemini/assistant.js";
import handleParseAssignment from "../src/server/api-handlers/gemini/parse-assignment.js";
import handleSummarizeEmails from "../src/server/api-handlers/gemini/summarize-emails.js";
import handleQuickDraft from "../src/server/api-handlers/gemini/quick-draft.js";
import handleExtractSubtasks from "../src/server/api-handlers/gemini/extract-subtasks.js";
import handleEstimateEffort from "../src/server/api-handlers/gemini/estimate-effort.js";
import handleSuggestStudySlots from "../src/server/api-handlers/gemini/suggest-study-slots.js";
import handleGenerate from "../src/server/api-handlers/gemini/generate.js";
import handleGoogleExchange from "../src/server/api-handlers/auth/google/exchange.js";
import handleGoogleRefresh from "../src/server/api-handlers/auth/google/refresh.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-canvas-token, Accept");
  if (req.method === "OPTIONS") return res.status(200).end();

  const rawUrl = req.headers["x-matched-path"] || req.url || "";
  const cleanPath = rawUrl.split("?")[0].replace(/^\/api/, "");

  if (cleanPath === "/health" || cleanPath === "" || cleanPath === "/" || cleanPath === "/index") {
    // After the vercel.json rewrite /api/(.*) -> /api/index, nested routes
    // arrive here as /api/index?url=... with the original path rewritten away.
    // A `url` query param always means Canvas proxy (health never has one).
    if (req.query?.url) return handleCanvasProxy(req, res);
    return handleHealth(req, res);
  }
  if (cleanPath === "/canvas/proxy") {
    return handleCanvasProxy(req, res);
  }
  if (cleanPath === "/gemini/assistant") {
    return handleAssistant(req, res);
  }
  if (cleanPath === "/gemini/parse-assignment") {
    return handleParseAssignment(req, res);
  }
  if (cleanPath === "/gemini/summarize-emails") {
    return handleSummarizeEmails(req, res);
  }
  if (cleanPath === "/gemini/quick-draft") {
    return handleQuickDraft(req, res);
  }
  if (cleanPath === "/gemini/extract-subtasks") {
    return handleExtractSubtasks(req, res);
  }
  if (cleanPath === "/gemini/estimate-effort") {
    return handleEstimateEffort(req, res);
  }
  if (cleanPath === "/gemini/suggest-study-slots") {
    return handleSuggestStudySlots(req, res);
  }
  if (cleanPath === "/gemini/generate") {
    return handleGenerate(req, res);
  }
  if (cleanPath === "/auth/google/exchange") {
    return handleGoogleExchange(req, res);
  }
  if (cleanPath === "/auth/google/refresh") {
    return handleGoogleRefresh(req, res);
  }

  res.status(404).json({ error: `API route not found: ${req.url}` });
}
