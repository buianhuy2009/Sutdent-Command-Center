import {
  handleHealth,
  handleCanvasProxy,
  handleAssistant,
  handleParseAssignment,
  handleSummarizeEmails,
  handleQuickDraft,
  setCorsHeaders
} from "../src/server/handlers";

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  
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
