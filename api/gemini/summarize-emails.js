import { GoogleGenAI } from "@google/genai";

let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Known commercial/promotional keywords and sender patterns
const NON_ACADEMIC_PATTERNS = [
  /unsubscribe/i,
  /opt-?out/i,
  /view in browser/i,
  /privacy policy/i,
  /manage preferences/i,
  /khuyến mãi|voucher|giảm giá|ưu đãi|sale\s*\d+%|off\s*\d+%/i,
  /shopee|tiki|lazada|grab|beamin|baemin|tiktok|facebook|instagram|youtube|twitter|linkedin|reddit|discord|spotify|netflix/i,
  /duolingo|grammarly|canva|adobe|coursera|udemy|edx/i,
  /receipt|invoice|order confirmation|payment received|billing|hóa đơn|thanh toán|mã otp|mã xác minh/i,
  /newsletter|digest|weekly update|special offer|limited time|flash sale|discount|cashback/i,
];

function isLikelySpamOrPromo(email) {
  const fullText = `${email.sender || ""} ${email.subject || ""} ${email.snippet || ""}`.toLowerCase();
  
  // Exclude school/teacher indicators
  const hasAcademicIndicators = /professor|prof\.|teacher|giáo viên|thầy|cô|giảng viên|bài tập|assignment|homework|exam|kiểm tra|thi học kỳ|canvas|google classroom|moodle|blackboard|syllabus|hạn nộp|nộp bài|lab report/i.test(fullText);
  if (hasAcademicIndicators) return false;

  for (const pattern of NON_ACADEMIC_PATTERNS) {
    if (pattern.test(fullText)) return true;
  }
  return false;
}

export default async function handler(req, res) {
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
    const prompt = `You are an expert bilingual academic email organizer and spam filter for students.
Analyze the following ${emails.length} student emails. Emails may be in English or Vietnamese (tiếng Việt).

CRITICAL CLASSIFICATION RULES:
1. WHAT COUNTS AS SPAM / PROMOTION / NON-ACADEMIC (isSpam: true):
   - Shopping discounts, coupons, e-commerce (Shopee, Lazada, Tiki, Grab, Amazon, etc.).
   - App newsletters & commercial subscriptions (Spotify, Netflix, Duolingo, Grammarly, Canva, Medium, etc.).
   - Social media digests & notifications (YouTube, LinkedIn, Facebook, Instagram, Twitter/X, Discord, Reddit).
   - Automated account security alerts, OTP codes, password resets, purchase receipts, billing invoices that are NOT school tuition.
   - ANY email that is NOT from a school, university, instructor, teacher, educational institution, or academic LMS.
   -> For all these: set "isSpam": true, "category": "SPAM" or "PROMOTION", "urgency": "INFO" or "LOW", "detectedAssignment.isAssignment": false.

2. WHAT COUNTS AS ACADEMIC (isSpam: false):
   - Only emails from instructors, professors, teaching assistants, academic departments, schools, or learning management systems (Canvas, Google Classroom, Moodle).
   - Categories:
     * "ASSIGNMENT": homework, projects, problem sets, lab reports, essays, reading assignments, deadlines.
     * "EXAM": midterm exams, final exams, pop quizzes, unit tests, oral exams, exam review schedules.
     * "SCHEDULE": timetable changes, office hours, lecture room swaps, class cancellations.
     * "ANNOUNCEMENT": official school announcements, syllabus updates, grade releases, academic policy.
     * "GENERAL": peer study group coordination, questions to/from classmates regarding class.

3. SUMMARY & LANGUAGE:
   - Identify language: "vi" or "en".
   - "oneLineSummary": Maximum 12 words. Clear, informative summary in the SAME language as the email.

Emails to scan:
${JSON.stringify(emails, null, 2)}

Respond with valid JSON matching this schema:
{
  "alerts": [
    {
      "id": "matching email id",
      "sender": "clean sender name or role",
      "subject": "email subject",
      "oneLineSummary": "concise 1-line summary under 12 words",
      "urgency": "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "ASSIGNMENT" | "EXAM" | "GRADE" | "SCHEDULE" | "ANNOUNCEMENT" | "SPAM" | "PROMOTION" | "GENERAL",
      "categoryLabel": "human-friendly label (e.g., 'Bài tập / Assignment' or 'Thư rác / Spam')",
      "isSpam": boolean,
      "spamReason": "reason if spam/promo or empty string",
      "language": "vi" | "en" | "other",
      "detectedAssignment": {
        "isAssignment": boolean,
        "name": "concise assignment name or empty string",
        "subject": "course/subject or empty string",
        "dueDate": "YYYY-MM-DD or empty string",
        "priority": "High" | "Med" | "Low"
      }
    }
  ]
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
    
    // Double-check with heuristic validator to guarantee no spam slips through
    if (parsed.alerts && Array.isArray(parsed.alerts)) {
      parsed.alerts = parsed.alerts.map((alert) => {
        const raw = emails.find((e) => e.id === alert.id);
        if (raw && !alert.isSpam && isLikelySpamOrPromo(raw)) {
          alert.isSpam = true;
          alert.category = "SPAM";
          alert.categoryLabel = alert.language === "vi" ? "Thư rác / Quảng cáo" : "Spam / Promotion";
          alert.urgency = "INFO";
          alert.spamReason = alert.spamReason || (alert.language === "vi" ? "Nội dung quảng cáo / thương mại" : "Commercial or marketing email");
          if (alert.detectedAssignment) alert.detectedAssignment.isAssignment = false;
        }
        return alert;
      });
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Email summarization error:", err);
    const fallbackAlerts = ((req.body && req.body.emails) || []).map((e) => {
      const fullText = `${e.subject || ""} ${e.snippet || ""} ${e.sender || ""}`.toLowerCase();
      const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fullText);
      const isSpam = isLikelySpamOrPromo(e);
      const isExam = /thi|kiểm tra|exam|quiz|test|midterm|final/i.test(fullText);
      const isAssignment = /bài tập|assignment|homework|lab|report|nộp bài|deadline|hạn nộp/i.test(fullText);
      const isAnnouncement = /thông báo|announcement|notice|nhắc nhở|schedule|lịch/i.test(fullText);

      let category = "GENERAL";
      let urgency = "LOW";
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
        spamReason: isSpam ? (isVietnamese ? "Thư quảng cáo / dịch vụ ngoài trường học" : "Non-academic promotional email") : "",
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
