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

export function setCorsHeaders(req: any, res: any): boolean {
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
    res.status(200).end();
    return true;
  }
  return false;
}

// 1. Health Check
export async function handleHealth(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  res.status(200).json({
    status: "ok",
    platform: process.env.VERCEL ? "vercel-serverless" : "node-server",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}

// 2. Canvas Proxy
export async function handleCanvasProxy(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

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
      return res.status(200).json(data);
    } else {
      const text = await response.text();
      return res.status(200).send(text);
    }
  } catch (err: any) {
    console.error("Canvas proxy error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch from Canvas" });
  }
}

// 3. Summarize Emails with Gemini
export async function handleSummarizeEmails(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  try {
    const { emails } = req.body || {};
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(200).json({ alerts: [] });
    }

    const ai = getGenAI();
    const prompt = `You are an intelligent bilingual academic email scanner for a student command center.
Analyze the following ${emails.length} emails. Note that emails may be in English or Vietnamese (tiếng Việt).

Your tasks:
1. DETECT SPAM / PROMOTIONS / MARKETING:
   - Identify whether an email is commercial spam, shopping discount (Shopee, Tiki, Lazada, Grab, etc.), marketing newsletter, subscription update, or phishing.
   - For spam/promotions, set "isSpam": true, "category": "SPAM" or "PROMOTION", "urgency": "INFO" or "LOW", and provide a clear "spamReason".
2. FOR ACADEMIC / SCHOOL / INSTRUCTOR EMAILS:
   - Categorize into: "ASSIGNMENT", "EXAM", "GRADE", "SCHEDULE", "ANNOUNCEMENT", or "GENERAL".
   - Extract actionable deadlines, quizzes, test dates, homework, lab reports, or office hours.
   - Set urgency: "HIGH" for imminent deadlines (<48h) or critical exam dates; "MEDIUM" for standard assignments/requests; "LOW" for general info; "INFO" for newsletters/spam.
3. LANGUAGE HANDLING:
   - Identify the language ("vi" for Vietnamese, "en" for English).
   - Write "oneLineSummary" concisely (under 14 words) in the SAME language as the email.
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
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    const nonAcademicTest = /unsubscribe|opt-?out|view in browser|khuyến mãi|voucher|giảm giá|shopee|tiki|lazada|grab|tiktok|facebook|instagram|youtube|twitter|linkedin|reddit|discord|spotify|netflix|duolingo|grammarly|canva|receipt|invoice|payment received|mã otp/i;
    const academicTest = /professor|prof\.|teacher|giáo viên|thầy|cô|giảng viên|bài tập|assignment|homework|exam|kiểm tra|thi học kỳ|canvas|google classroom|moodle|blackboard|syllabus|hạn nộp|nộp bài|lab report/i;
    if (parsed.alerts && Array.isArray(parsed.alerts)) {
      parsed.alerts = parsed.alerts.map((alert: any) => {
        const raw = emails.find((e: any) => e.id === alert.id);
        const fullText = `${alert.sender || ""} ${alert.subject || ""} ${raw?.snippet || ""}`.toLowerCase();
        if (!alert.isSpam && !academicTest.test(fullText) && nonAcademicTest.test(fullText)) {
          alert.isSpam = true;
          alert.category = "SPAM";
          alert.categoryLabel = alert.language === "vi" ? "Thư rác / Quảng cáo" : "Spam / Promotion";
          alert.urgency = "INFO";
          alert.spamReason = alert.language === "vi" ? "Nội dung quảng cáo / dịch vụ ngoài trường học" : "Commercial or marketing email";
          if (alert.detectedAssignment) alert.detectedAssignment.isAssignment = false;
        }
        return alert;
      });
    }
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Email summarization error:", err);
    // Heuristic fallback for English & Vietnamese emails
    const fallbackAlerts = ((req.body && req.body.emails) || []).map((e: any) => {
      const fullText = `${e.subject || ""} ${e.snippet || ""} ${e.sender || ""}`.toLowerCase();
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
    res.status(200).json({ alerts: fallbackAlerts });
  }
}

// 4. Quick Draft Email to Teacher
export async function handleQuickDraft(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
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
      attachments,
      links,
    } = req.body || {};
    const ai = getGenAI();

    const prompt = `You are an expert student communication advisor.
Draft a polite, respectful, clear, and professional email from a student to their instructor/teacher.
The email can be written in English or Vietnamese depending on language parameter: "${language || "en"}".

Parameters:
- Language: ${language || "English / Tiếng Việt as appropriate"}
- Student Name: ${studentName || "Student"}
- Teacher / Professor Name: ${teacherName || "Professor"}
- Course / Subject: ${course || "Class"}
- Draft Intent / Type: ${draftType || "Clarification"}
- Topic / Specific Details: ${topic || ""}
- Student's Context / Notes: ${studentNotes || "None"}
- Desired Tone: ${tone || "Polite & Respectful / Lịch sự, tôn trọng"}
- Google Drive Attachments: ${JSON.stringify(attachments || [])}
- Included Links: ${JSON.stringify(links || [])}

Guidelines:
1. If drafting in Vietnamese:
   - Use standard respectful Vietnamese academic honorifics (e.g., "Kính gửi Thầy/Cô [Tên],", "Em tên là [Student Name], sinh viên/học sinh lớp [Course]...", "Em xin phép viết email này để...", "Em xin chân thành cảm ơn Thầy/Cô.", "Trân trọng,").
2. If drafting in English:
   - Use standard formal academic greeting (e.g. "Dear Professor [Name],", "I am writing regarding...").
3. Get straight to the point in the opening sentence.
4. If Google Drive attachments are provided, refer to them naturally in the email body (e.g. "I have attached the document [File Name] (link: [File Link]) for your review").
5. If links are provided, reference them naturally in the text.

Respond with valid JSON:
{
  "subject": "Clear email subject line in requested language",
  "body": "Full ready-to-send email body with line breaks",
  "keyPoints": ["Bullet 1 summary", "Bullet 2", "Bullet 3"]
}
Return only JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Quick draft error:", err);
    const { teacherName, course, topic, language, studentName } = req.body || {};
    const isVi = language === "vi";
    if (isVi) {
      res.status(200).json({
        subject: `Thắc mắc về ${topic || "bài tập"} - Môn ${course || "Học phần"}`,
        body: `Kính gửi Thầy/Cô ${teacherName || "Giảng viên"},\n\nEm hy vọng Thầy/Cô đang có một tuần làm việc thuận lợi. Em viết email này để xin phép hỏi thêm về ${
          topic || "nội dung bài tập"
        } của môn ${course || "học"}.\n\nEm đã xem lại tài liệu và hướng dẫn trên hệ thống nhưng vẫn muốn làm rõ thêm một số yêu cầu để đảm bảo hoàn thành bài đúng tiến độ.\n\nEm xin chân thành cảm ơn Thầy/Cô đã dành thời gian đọc thư.\n\nKính chúc Thầy/Cô sức khỏe,\nTrân trọng,\n${
          studentName || "Học sinh / Sinh viên"
        }`,
        keyPoints: [
          "Lời chào kính trọng tới Thầy/Cô",
          `Trình bày rõ thắc mắc về ${topic || "bài tập"}`,
          "Lời cảm ơn và kết thư lịch sự",
        ],
      });
    } else {
      res.status(200).json({
        subject: `Question regarding ${topic || "Assignment"} - ${course || "Course"}`,
        body: `Dear ${teacherName || "Professor"},\n\nI hope you're having a great week. I am writing regarding ${
          topic || "our upcoming assignment"
        } in ${course || "class"}.\n\nCould you please provide some clarification on the requirements? I want to make sure I am on the right track.\n\nThank you very much for your time and assistance.\n\nBest regards,\n${
          studentName || "Student"
        }`,
        keyPoints: [
          "Polite greeting to instructor",
          `Clear inquiry regarding ${topic || "assignment"}`,
          "Professional closing",
        ],
      });
    }
  }
}

// 5. Parse Natural Language Assignment
export async function handleParseAssignment(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
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
  } catch (err: any) {
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

// 6. AI Study Assistant Chat
export async function handleAssistant(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
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

// 7. AI Smart-Breakdown Task Extractor (Canvas)
export async function handleExtractSubtasks(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  try {
    const { assignmentName, courseName, description, dueAt, pointsPossible } = req.body || {};
    if (!assignmentName) {
      return res.status(400).json({ error: "Assignment name is required" });
    }

    const ai = getGenAI();
    const prompt = `You are an AI academic task planner for a student command center.
Given the following Canvas LMS assignment, break it down into a clear, ordered checklist of actionable sub-tasks that a student can follow step-by-step to complete the assignment.

Assignment Details:
- Name: ${assignmentName}
- Course: ${courseName || "Unknown"}
- Due Date: ${dueAt || "Not specified"}
- Points: ${pointsPossible || "N/A"}
- Description / Instructions:
${description || "No description provided. Infer reasonable sub-tasks from the assignment name."}

Guidelines:
1. Extract 3-8 concrete, actionable sub-tasks (not vague like "do research" — be specific like "Find 3 peer-reviewed sources on [topic]").
2. Order them logically (research first, then draft, then review, then submit).
3. For each sub-task, estimate minutes needed.
4. If the description is in Vietnamese, write sub-tasks in Vietnamese. Otherwise use English.

Respond with valid JSON:
{
  "subtasks": [
    { "title": "Clear actionable sub-task title", "estimatedMinutes": 20, "order": 1 },
    { "title": "Another sub-task", "estimatedMinutes": 15, "order": 2 }
  ],
  "totalEstimatedMinutes": 60,
  "difficulty": "Easy" | "Medium" | "Hard"
}
Return only JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Extract subtasks error:", err);
    res.status(200).json({
      subtasks: [
        { title: "Read the assignment instructions carefully", estimatedMinutes: 10, order: 1 },
        { title: "Research and gather materials", estimatedMinutes: 30, order: 2 },
        { title: "Create first draft", estimatedMinutes: 45, order: 3 },
        { title: "Review, proofread, and finalize", estimatedMinutes: 20, order: 4 },
        { title: "Submit before deadline", estimatedMinutes: 5, order: 5 },
      ],
      totalEstimatedMinutes: 110,
      difficulty: "Medium",
    });
  }
}

// 8. Dynamic Priority & Effort Estimator (Assignment Tracker)
export async function handleEstimateEffort(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  try {
    const { assignments } = req.body || {};
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(200).json({ estimates: [] });
    }

    const ai = getGenAI();
    const today = new Date().toISOString().split("T")[0];
    const prompt = `You are an AI academic advisor. Analyze the following student assignments and for each one, calculate:
1. A dynamic "riskScore" from 1-10 based on: how close the due date is to today (${today}), the assignment type difficulty, and current status.
2. An "estimatedMinutes" for how long the task should take.
3. A recommended "focusOrder" (1 = do first, 2 = do second, etc.)
4. A short "aiTip" (max 12 words) with specific advice.

Assignments:
${JSON.stringify(assignments.map((a: any) => ({
  id: a.id, name: a.assignmentName, subject: a.subject, dueDate: a.dueDate, priority: a.priority, status: a.status, estimatedMinutes: a.estimatedMinutes,
})), null, 2)}

Respond with valid JSON:
{
  "estimates": [
    { "id": "matching assignment id", "riskScore": 8, "estimatedMinutes": 45, "focusOrder": 1, "aiTip": "Due tomorrow — start the outline now" }
  ]
}
Return only JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Estimate effort error:", err);
    const fallback = ((req.body && req.body.assignments) || []).map((a: any, i: number) => {
      const daysLeft = Math.max(0, Math.floor((new Date(a.dueDate).getTime() - Date.now()) / 86400000));
      const riskScore = Math.min(10, Math.max(1, 10 - daysLeft));
      return {
        id: a.id, riskScore, estimatedMinutes: a.estimatedMinutes || 45, focusOrder: i + 1,
        aiTip: daysLeft <= 1 ? "Due very soon — start immediately" : daysLeft <= 3 ? "Due this week — prioritize" : "On track — plan ahead",
      };
    });
    res.status(200).json({ estimates: fallback });
  }
}

// 9. AI Peak-Focus Chronotype Study Slot Suggester (Daily Schedule)
export async function handleSuggestStudySlots(req: any, res: any) {
  if (setCorsHeaders(req, res)) return;
  try {
    const { existingEvents, pendingTasks, chronotype, date } = req.body || {};
    const ai = getGenAI();
    const targetDate = date || new Date().toISOString().split("T")[0];
    const prompt = `You are an AI study planner that schedules optimal focus blocks for a student.

Today's date: ${targetDate}
Student chronotype preference: ${chronotype || "balanced (no preference)"}

Existing calendar events today (DO NOT overlap with these):
${JSON.stringify(existingEvents || [], null, 2)}

Pending tasks that need study time:
${JSON.stringify((pendingTasks || []).map((t: any) => ({
  name: t.assignmentName || t.name, subject: t.subject || t.courseName, dueDate: t.dueDate || t.dueAt, priority: t.priority, estimatedMinutes: t.estimatedMinutes || 45,
})), null, 2)}

Guidelines:
1. Suggest 2-4 study blocks of 25-50 minutes each with 5-10 min breaks between them.
2. If chronotype is "morning", prefer slots 7am-12pm. If "evening", prefer 4pm-10pm. If "balanced", spread across the day.
3. Avoid overlapping with existing events. Leave at least 15 min buffer.
4. Assign the highest-priority pending task to the first suggested slot.

Respond with valid JSON:
{
  "suggestedSlots": [
    { "startTime": "09:00", "endTime": "09:45", "taskName": "Task name", "taskSubject": "Subject", "reason": "Brief reason" }
  ],
  "chronotypeAdvice": "Short personalized tip about their study pattern"
}
Return only JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Suggest study slots error:", err);
    res.status(200).json({
      suggestedSlots: [
        { startTime: "09:00", endTime: "09:45", taskName: "Study Block 1", taskSubject: "General", reason: "Morning focus window" },
        { startTime: "14:00", endTime: "14:45", taskName: "Study Block 2", taskSubject: "General", reason: "Afternoon review session" },
      ],
      chronotypeAdvice: "Try studying during your most alert hours for best results!",
    });
  }
}
