import { GoogleGenAI } from "@google/genai";

let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGenAI();
    const prompt = `Extract a student assignment from this natural language text: "${text}"
Current reference date is ${new Date().toISOString().split("T")[0]}.

Respond with JSON:
{
  "subject": "detected course/subject like Physics, AP Calculus, Literature, Chemistry, etc. If unknown, use General",
  "assignmentName": "clean concise assignment title",
  "dueDate": "YYYY-MM-DD (estimate relative to today if user said tomorrow/friday/next week)",
  "priority": "High" | "Med" | "Low",
  "status": "Not Started",
  "estimatedMinutes": 45
}
Return only JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.status(200).json(parsed);
  } catch (err) {
    console.error("Parse assignment error:", err);
    res.status(200).json({
      subject: "General",
      assignmentName: (req.body && req.body.text) || "New Task",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      priority: "Med",
      status: "Not Started",
      estimatedMinutes: 45,
    });
  }
}
