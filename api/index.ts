import handleHealth from "./health.js";
import handleCanvasProxy from "./canvas/proxy.js";
import handleAssistant from "./gemini/assistant.js";
import handleParseAssignment from "./gemini/parse-assignment.js";
import handleSummarizeEmails from "./gemini/summarize-emails.js";
import handleQuickDraft from "./gemini/quick-draft.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-canvas-token, Accept");
  if (req.method === "OPTIONS") return res.status(200).end();

  const rawUrl = req.headers["x-matched-path"] || req.url || "";
  const cleanPath = rawUrl.split("?")[0].replace(/^\/api/, "");

  if (cleanPath === "/health" || cleanPath === "" || cleanPath === "/") {
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

  res.status(404).json({ error: `API route not found: ${req.url}` });
}
