import { GoogleGenAI } from "@google/genai";

let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
].filter(Boolean);

async function generateWithModelFallback(params) {
  const ai = getGenAI();
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} attempt failed: ${err.message || err}. Trying next fallback...`);
    }
  }
  throw lastError || new Error("All candidate Gemini models failed.");
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

    const prompt = `You are an intelligent bilingual academic email scanner for a student command center.
Analyze the following ${emails.length} emails. Note that emails may be in English or Vietnamese (tiếng Việt).

Your tasks:
1. DETECT SPAM / PROMOTIONS / MARKETING (CRITICAL PRIORITY):
   - Identify whether an email is commercial spam, shopping discounts, retail sales, vouchers, coupons, marketing newsletters, subscription updates, or phishing.
   - Examples of PROMOTIONS: "50% off", "Flash sale", "Voucher giảm 50k", "Shopee/Lazada deal", "Grab discount", "Sale ends midnight".
   - For any promotional/marketing emails, set "isSpam": true, "category": "PROMOTION", "urgency": "INFO", and provide a clear "spamReason".
   - CRITICAL: NEVER mark a marketing or sales email as "ASSIGNMENT" or "EXAM", even if it uses marketing words like "deadline", "urgent", "expires", or "final hours"!
2. FOR ACADEMIC / SCHOOL / INSTRUCTOR EMAILS ONLY:
   - Only emails genuinely from schools, teachers, professors, or academic LMS platforms (Canvas, Classroom, Blackboard) about coursework may be categorized into: "ASSIGNMENT", "EXAM", "GRADE", "SCHEDULE", "ANNOUNCEMENT", or "GENERAL".
   - Extract actionable deadlines, quizzes, test dates, homework, lab reports, or office hours.
   - Set urgency: "HIGH" for imminent school deadlines (<48h) or critical exam dates; "MEDIUM" for standard assignments/requests; "LOW" for general school info; "INFO" for newsletters/spam.
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
      "categoryLabel": "human-friendly label like 'Bài tập / Assignment' or 'Khuyến mãi / Promotion'",
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

    const response = await generateWithModelFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    const nonAcademicTest =
      /\b\d+%\s*(?:off|giảm)\b|\b(?:sale|giảm|off|discount|deal|save)\s*\d+%\b|khuyến mãi|voucher|giảm giá|ưu đãi|tiết kiệm|clearance|coupon|flash sale|black friday|quà tặng|free shipping|miễn phí vận chuyển|mua \d+ tặng \d+|shopee|tiki|lazada|grab|be |gojek|sendo|amazon|shein|aliexpress|temu|zalopay|momo|viettel money|starbucks|highlands|kfc|mcdonald|netflix|spotify|canva|duolingo|grammarly|linkedin|facebook|instagram|tiktok|youtube|twitter|x\.com|medium|newsletter|bản tin|digest|unsubscribe|hủy đăng ký|opt-?out|view in browser|xem trên trình duyệt|privacy policy|manage preferences|receipt|invoice|order confirmation|payment received|mã otp/i;
    const academicTest =
      /professor|prof\.|teacher|giáo viên|thầy|cô|giảng viên|khoa|phòng đào tạo|trường|bài tập|assignment|homework|exam|kiểm tra|thi học kỳ|canvas|google classroom|moodle|blackboard|syllabus|hạn nộp|nộp bài|lab report/i;

    if (parsed.alerts && Array.isArray(parsed.alerts)) {
      parsed.alerts = parsed.alerts.map((alert) => {
        const raw = emails.find((e) => e.id === alert.id);
        const fullText = `${alert.sender || ""} ${alert.subject || ""} ${raw?.snippet || ""}`.toLowerCase();
        const isCommercial = !academicTest.test(fullText) && nonAcademicTest.test(fullText);

        if (isCommercial || alert.isSpam || alert.category === "SPAM" || alert.category === "PROMOTION") {
          alert.isSpam = true;
          alert.category = alert.category === "SPAM" ? "SPAM" : "PROMOTION";
          alert.categoryLabel = alert.language === "vi" ? "Khuyến mãi / Thư rác" : "Promotion / Spam";
          alert.urgency = "INFO";
          alert.spamReason =
            alert.spamReason ||
            (alert.language === "vi"
              ? "Nội dung quảng cáo / dịch vụ ngoài trường học"
              : "Commercial promotion or marketing email");
          if (alert.detectedAssignment) {
            alert.detectedAssignment.isAssignment = false;
          }
        }
        return alert;
      });
    }
    res.status(200).json(parsed);
  } catch (err) {
    console.error("Email summarization error:", err);
    // Robust heuristic fallback for English & Vietnamese emails
    const nonAcademicFallback =
      /\b\d+%\s*(?:off|giảm)\b|\b(?:sale|giảm|off|discount|deal|save)\s*\d+%\b|khuyến mãi|voucher|giảm giá|ưu đãi|tiết kiệm|clearance|coupon|flash sale|black friday|quà tặng|free shipping|miễn phí vận chuyển|mua \d+ tặng \d+|shopee|tiki|lazada|grab|be |gojek|sendo|amazon|shein|aliexpress|temu|zalopay|momo|viettel money|starbucks|highlands|kfc|mcdonald|netflix|spotify|canva|duolingo|grammarly|linkedin|facebook|instagram|tiktok|youtube|twitter|x\.com|medium|newsletter|bản tin|digest|unsubscribe|hủy đăng ký|opt-?out|view in browser|xem trên trình duyệt|privacy policy|manage preferences|receipt|invoice|order confirmation|payment received|mã otp/i;
    const academicFallback =
      /professor|prof\.|teacher|giáo viên|thầy|cô|giảng viên|khoa|phòng đào tạo|trường|bài tập|assignment|homework|exam|kiểm tra|thi học kỳ|canvas|google classroom|moodle|blackboard|syllabus|hạn nộp|nộp bài|lab report/i;

    const fallbackAlerts = ((req.body && req.body.emails) || []).map((e) => {
      const fullText = `${e.subject || ""} ${e.snippet || ""} ${e.sender || ""}`.toLowerCase();
      const isCommercial = !academicFallback.test(fullText) && nonAcademicFallback.test(fullText);
      const isVietnamese =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          fullText
        );

      let category = "GENERAL";
      let isSpam = isCommercial;
      let urgency = "LOW";
      let categoryLabel = isVietnamese ? "Thông báo chung" : "General Update";

      if (isSpam) {
        category = "PROMOTION";
        urgency = "INFO";
        categoryLabel = isVietnamese ? "Khuyến mãi / Quảng cáo" : "Promotion / Spam";
      } else {
        const isExam = /thi học kỳ|kỳ thi|lịch thi|kiểm tra 15p|kiểm tra 1 tiết|midterm exam|final exam|quiz due|test date/i.test(fullText);
        const isAssignment = /bài tập về nhà|bài tập lớn|hạn nộp bài|nộp bài tập|deadline nộp|assignment due|homework due|lab report due|submit essay/i.test(fullText);
        const isAnnouncement = /thông báo học vụ|nghỉ học|học bù|lịch học|thay đổi phòng học|class announcement|lecture update|syllabus update/i.test(fullText);

        if (isExam) {
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
          isAssignment: !isSpam && (category === "ASSIGNMENT" || category === "EXAM"),
          name: e.subject || "New Assignment",
          subject: isVietnamese ? "Môn học" : "General",
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
          priority: urgency === "HIGH" ? "High" : "Med",
        },
      };
    });
    res.status(200).json({ alerts: fallbackAlerts });
  }
}
