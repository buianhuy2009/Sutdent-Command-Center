import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export function createApiApp(): express.Express {
  const app = express();

  // CORS middleware for API endpoints
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-canvas-token, Accept"
    );
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  app.use(express.json({ limit: "5mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      platform: process.env.VERCEL ? "vercel-serverless" : "node-server",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Canvas Proxy (handles .ics calendar feed and API calls without CORS issues)
  app.get("/api/canvas/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
      }

      // Security check: must be http or https
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        return res.status(400).json({ error: "Invalid URL protocol" });
      }

      const headers: Record<string, string> = {
        "User-Agent": "StudentCommandCenter/1.0",
      };

      const canvasToken = req.headers["x-canvas-token"] as string;
      if (canvasToken) {
        headers["Authorization"] = `Bearer ${canvasToken}`;
      }

      const response = await fetch(targetUrl, { headers });
      if (!response.ok) {
        return res.status(response.status).json({
          error: `Canvas fetch failed with status ${response.status}: ${response.statusText}`,
        });
      }

      const contentType = response.headers.get("content-type") || "text/plain";
      res.setHeader("Content-Type", contentType);

      if (contentType.includes("json")) {
        const data = await response.json();
        return res.json(data);
      } else {
        const text = await response.text();
        return res.send(text);
      }
    } catch (err: any) {
      console.error("Canvas proxy error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch from Canvas" });
    }
  });

  // Gemini API: Summarize Emails into 1-Line Alerts with Spam Detection & Vietnamese Support
  app.post("/api/gemini/summarize-emails", async (req, res) => {
    try {
      const { emails } = req.body;
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.json({ alerts: [] });
      }

      const ai = getGenAI();
      const prompt = `You are an intelligent bilingual academic email scanner for a student command center.
Analyze the following ${emails.length} emails. Note that emails may be in English or Vietnamese (tiếng Việt).

Your tasks:
1. DETECT SPAM / PROMOTIONS / MARKETING:
   - Identify whether an email is commercial spam, shopping discount (Shopee, Tiki, Lazada, Grab, etc.), marketing newsletter, subscription update, or phishing.
   - For spam/promotions, set "isSpam": true, "category": "SPAM" or "PROMOTION", "urgency": "INFO" or "LOW", and provide a clear "spamReason" (e.g. "Commercial promotional discount" or "Quảng cáo khuyến mãi mua sắm").
2. FOR ACADEMIC / SCHOOL / INSTRUCTOR EMAILS:
   - Categorize into: "ASSIGNMENT", "EXAM", "GRADE", "SCHEDULE", "ANNOUNCEMENT", or "GENERAL".
   - Extract actionable deadlines, quizzes, test dates, homework, lab reports, or office hours.
   - Set urgency: "HIGH" for imminent deadlines (<48h) or critical exam dates; "MEDIUM" for standard assignments/requests; "LOW" for general info; "INFO" for newsletters/spam.
3. LANGUAGE HANDLING:
   - Identify the language ("vi" for Vietnamese, "en" for English).
   - Write "oneLineSummary" concisely (under 14 words) in the SAME language as the email (or clear concise Vietnamese if original was Vietnamese).
   - If an assignment is detected, extract title and course name cleanly.

Emails to scan:
${JSON.stringify(emails, null, 2)}

Respond with valid JSON matching this schema:
{
  "alerts": [
    {
      "id": "matching email id",
      "sender": "clean sender name or role",
      "subject": "email subject",
      "oneLineSummary": "concise 1-line alert under 14 words with specific dates and action items",
      "urgency": "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "ASSIGNMENT" | "EXAM" | "GRADE" | "SCHEDULE" | "ANNOUNCEMENT" | "SPAM" | "PROMOTION" | "GENERAL",
      "categoryLabel": "human-friendly label like 'Bài tập / Assignment' or 'Thư rác / Spam'",
      "isSpam": boolean,
      "spamReason": "reason if spam/promo or empty string",
      "language": "vi" | "en" | "other",
      "detectedAssignment": {
        "isAssignment": boolean,
        "name": "concise assignment name",
        "subject": "detected course/subject like Toán, Vật lý, AP Physics, Literature, etc.",
        "dueDate": "YYYY-MM-DD or empty string",
        "priority": "High" | "Med" | "Low"
      }
    }
  ]
}
Return only JSON, no markdown formatting.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: any) {
      console.error("Email summarization error:", err);
      // Heuristic fallback for English & Vietnamese emails
      const fallbackAlerts = (req.body.emails || []).map((e: any) => {
        const fullText = `${e.subject || ""} ${e.snippet || ""} ${e.sender || ""}`.toLowerCase();

        // Check Vietnamese / English spam keywords
        const isSpamKeywords =
          /khuyến mãi|voucher|giảm giá|ưu đãi|shopee|tiki|lazada|sale\s*\d+%|off\s*\d+%|quảng cáo|discount|coupon|unsubscribe|marketing|bản tin|deal|cashback/i.test(
            fullText
          );
        const isExam = /thi|kiểm tra|exam|quiz|test|midterm|final/i.test(fullText);
        const isAssignment =
          /bài tập|assignment|homework|lab|report|nộp bài|deadline|hạn nộp|rubric/i.test(fullText);
        const isAnnouncement =
          /thông báo|announcement|notice|nhắc nhở|schedule|lịch/i.test(fullText);
        const isVietnamese =
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
            fullText
          );

        let category: any = "GENERAL";
        let isSpam = isSpamKeywords;
        let urgency: any = "LOW";
        let categoryLabel = isVietnamese ? "Thông báo chung" : "General Update";

        if (isSpam) {
          category = "SPAM";
          urgency = "INFO";
          categoryLabel = isVietnamese ? "Thư rác / Quảng cáo" : "Spam / Promotion";
        } else if (isExam) {
          category = "EXAM";
          urgency = "HIGH";
          categoryLabel = isVietnamese ? "Lịch thi / Kiểm tra" : "Exam / Quiz";
        } else if (isAssignment) {
          category = "ASSIGNMENT";
          urgency = "HIGH";
          categoryLabel = isVietnamese ? "Bài tập & Hạn nộp" : "Assignment";
        } else if (isAnnouncement) {
          category = "ANNOUNCEMENT";
          urgency = "MEDIUM";
          categoryLabel = isVietnamese ? "Thông báo học vụ" : "Announcement";
        }

        return {
          id: e.id,
          sender: e.sender || "Instructor",
          subject: e.subject || "Email Notification",
          oneLineSummary: `${(e.snippet || e.subject || "").slice(0, 75)}...`,
          urgency,
          category,
          categoryLabel,
          isSpam,
          spamReason: isSpam
            ? isVietnamese
              ? "Thư quảng cáo / Khuyến mãi"
              : "Commercial promotion"
            : "",
          language: isVietnamese ? "vi" : "en",
          detectedAssignment: {
            isAssignment: !isSpam && isAssignment,
            name: e.subject || "New Assignment",
            subject: isVietnamese ? "Môn học" : "General",
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
            priority: isExam || isAssignment ? "High" : "Med",
          },
        };
      });
      res.json({ alerts: fallbackAlerts });
    }
  });

  // Gemini API: Quick Draft Email to Teacher (Supports Vietnamese & English)
  app.post("/api/gemini/quick-draft", async (req, res) => {
    try {
      const {
        teacherName,
        course,
        topic,
        draftType,
        studentNotes,
        tone,
        studentName,
        language,
      } = req.body;
      const ai = getGenAI();

      const prompt = `You are an expert student communication advisor.
Draft a polite, respectful, clear, and professional email from a student to their instructor/teacher.
The email can be written in English or Vietnamese depending on language parameter: "${language || "en"}".

Parameters:
- Language: ${language || "English / Tiếng Việt as appropriate"}
- Student Name: ${studentName || "Student"}
- Teacher / Professor Name: ${teacherName || "Professor"}
- Course / Subject: ${course || "Class"}
- Draft Intent / Type: ${
        draftType || "Clarification"
      } (e.g. Request Extension / Xin gia hạn nộp bài, Clarify Question / Giải đáp thắc mắc, Office Hours / Hẹn gặp trao đổi, Grade Inquiry / Thắc mắc điểm số, General Question)
- Topic / Specific Details: ${topic || ""}
- Student's Context / Notes: ${studentNotes || "None"}
- Desired Tone: ${tone || "Polite & Respectful / Lịch sự, tôn trọng"}

Guidelines:
1. If drafting in Vietnamese:
   - Use standard respectful Vietnamese academic honorifics (e.g., "Kính gửi Thầy/Cô [Tên],", "Em tên là [Student Name], sinh viên/học sinh lớp [Course]...", "Em xin phép viết email này để...", "Em xin chân thành cảm ơn Thầy/Cô.", "Trân trọng,").
2. If drafting in English:
   - Use standard formal academic greeting (e.g. "Dear Professor [Name],", "I am writing regarding...").
3. Get straight to the point in the opening sentence.
4. If requesting an extension, provide an accountable, clear reason and propose a specific alternate date.
5. If asking a clarifying question, demonstrate what the student already attempted or checked.

Respond with valid JSON:
{
  "subject": "Clear email subject line in requested language",
  "body": "Full ready-to-send email body with line breaks",
  "keyPoints": ["Bullet 1 summary of what this email conveys", "Bullet 2", "Bullet 3"]
}
Return only JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: any) {
      console.error("Quick draft error:", err);
      const { teacherName, course, topic, language } = req.body;
      const isVi = language === "vi";
      if (isVi) {
        res.json({
          subject: `Thắc mắc về ${topic || "bài tập"} - Môn ${course || "Học phần"}`,
          body: `Kính gửi Thầy/Cô ${teacherName || "Giảng viên"},\n\nEm hy vọng Thầy/Cô đang có một tuần làm việc thuận lợi. Em viết email này để xin phép hỏi thêm về ${
            topic || "nội dung bài tập"
          } của môn ${course || "học"}.\n\nEm đã xem lại tài liệu và hướng dẫn trên hệ thống nhưng vẫn muốn làm rõ thêm một số yêu cầu để đảm bảo hoàn thành bài đúng tiến độ.\n\nEm xin chân thành cảm ơn Thầy/Cô đã dành thời gian đọc thư.\n\nKính chúc Thầy/Cô sức khỏe,\nTrân trọng,\n${
            req.body.studentName || "Học sinh / Sinh viên"
          }`,
          keyPoints: [
            "Lời chào kính trọng tới Thầy/Cô",
            `Trình bày rõ thắc mắc về ${topic || "bài tập"}`,
            "Lời cảm ơn và kết thư lịch sự",
          ],
        });
      } else {
        res.json({
          subject: `Question regarding ${topic || "Assignment"} - ${course || "Course"}`,
          body: `Dear ${teacherName || "Professor"},\n\nI hope you're having a great week. I am writing regarding ${
            topic || "our upcoming assignment"
          } in ${course || "class"}.\n\nCould you please provide some clarification on the requirements? I want to make sure I am on the right track.\n\nThank you very much for your time and assistance.\n\nBest regards,\n${
            req.body.studentName || "Student"
          }`,
          keyPoints: [
            "Polite greeting to instructor",
            `Clear inquiry regarding ${topic || "assignment"}`,
            "Professional closing",
          ],
        });
      }
    }
  });

  // Gemini API: Parse natural language assignment
  app.post("/api/gemini/parse-assignment", async (req, res) => {
    try {
      const { text } = req.body;
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
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Parse assignment error:", err);
      res.json({
        subject: "General",
        assignmentName: req.body.text || "New Task",
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        priority: "Med",
        status: "Not Started",
        estimatedMinutes: 45,
      });
    }
  });

  // Gemini API: AI Study Assistant Multi-Turn Chat
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { messages, context } = req.body;
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
        model: "gemini-flash-latest",
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      res.json({
        reply:
          response.text ||
          "I'm here to help you organize and conquer your school tasks!",
      });
    } catch (err: any) {
      console.error("Study assistant error:", err);
      res.json({
        reply:
          "I am ready to help you plan your study blocks, organize your assignments, and draft emails to your teachers!",
      });
    }
  });

  // Generic Gemini Generate endpoint with Groq automatic fallback
  app.post("/api/gemini/generate", async (req, res) => {
    const { contents, config, model } = req.body;
    if (!contents) {
      return res.status(400).json({ error: "contents is required" });
    }

    // 1. Try Gemini first
    try {
      const ai = getGenAI();
      const targetModel = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      return res.json({
        text: response.text || "",
        provider: "gemini",
      });
    } catch (geminiErr: any) {
      console.warn("Gemini server call failed, attempting Groq fallback...", geminiErr?.message || geminiErr);

      // 2. Automatic Groq fallback
      try {
        const groqApiKey = process.env.GROQ_API_KEY || '';
        let promptString = "";

        if (typeof contents === "string") {
          promptString = contents;
        } else if (Array.isArray(contents)) {
          promptString = contents
            .map((c: any) => (typeof c === "string" ? c : c.text || ""))
            .join("\n");
        } else if (contents?.text) {
          promptString = contents.text;
        }

        const isJsonMode = config?.responseMimeType === "application/json";
        const systemMessage = config?.systemInstruction
          ? typeof config.systemInstruction === "string"
            ? config.systemInstruction
            : config.systemInstruction.text || ""
          : "";

        const messages: any[] = [];
        if (systemMessage) {
          messages.push({ role: "system", content: systemMessage });
        }
        messages.push({ role: "user", content: promptString || "Help the student with academic tasks." });

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: 0.3,
            response_format: isJsonMode ? { type: "json_object" } : undefined,
          }),
        });

        if (!groqRes.ok) {
          throw new Error(`Groq API returned ${groqRes.status}: ${groqRes.statusText}`);
        }

        const groqData = await groqRes.json();
        const outputText = groqData.choices?.[0]?.message?.content || "";

        return res.json({
          text: outputText,
          provider: "groq-llama-3.3-70b",
        });
      } catch (groqErr: any) {
        console.error("Both Gemini and Groq fallbacks failed:", groqErr);
        return res.status(500).json({
          error: `AI generation failed on both Gemini and Groq: ${geminiErr?.message || "Unknown error"}`,
        });
      }
    }
  });

  return app;
}
