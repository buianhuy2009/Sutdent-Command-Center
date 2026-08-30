import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { messages, context } = req.body || {};
    const ai = getGenAI();

    const systemInstruction = `You are the Student Command Center AI Study Advisor & Academic Coach.
You help high school and university students manage their coursework, plan 45-minute focus sessions, break down large essays/projects into milestones, draft professional emails to professors, and master challenging concepts.
Keep your responses structured, encouraging, concise, and highly actionable with markdown formatting and bullet points where helpful.
Current student context:
${JSON.stringify(context || {}, null, 2)}`;

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: "user",
        parts: [{ text: "Hello! How can you help me today?" }],
      });
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    res.status(200).json({
      reply:
        response.text ||
        "I'm here to help you organize and conquer your school tasks!",
    });
  } catch (err: any) {
    console.error("Study assistant error:", err);
    res.status(200).json({
      reply:
        "I am ready to help you plan your study blocks, organize your assignments, and draft emails to your teachers! Let me know which task or class you want to tackle first.",
    });
  }
}
