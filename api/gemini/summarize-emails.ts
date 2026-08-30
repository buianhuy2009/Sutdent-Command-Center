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
