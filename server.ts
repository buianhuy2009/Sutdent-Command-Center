import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  handleHealth,
  handleCanvasProxy,
  handleAssistant,
  handleParseAssignment,
  handleSummarizeEmails,
  handleQuickDraft,
  handleExtractSubtasks,
  handleEstimateEffort,
  handleSuggestStudySlots,
  handleGenerate,
} from "./src/server/handlers";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Endpoints
  app.get("/api/health", handleHealth);
  app.get("/api/canvas/proxy", handleCanvasProxy);
  app.post("/api/gemini/assistant", handleAssistant);
  app.post("/api/gemini/parse-assignment", handleParseAssignment);
  app.post("/api/gemini/summarize-emails", handleSummarizeEmails);
  app.post("/api/gemini/quick-draft", handleQuickDraft);
  app.post("/api/gemini/extract-subtasks", handleExtractSubtasks);
  app.post("/api/gemini/estimate-effort", handleEstimateEffort);
  app.post("/api/gemini/suggest-study-slots", handleSuggestStudySlots);
  app.post("/api/gemini/generate", handleGenerate);

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Command Center Server running on http://localhost:${PORT}`);
  });
}

startServer();
