import { EmailAlert, EmailMessage, QuickDraftRequest, QuickDraftResponse, Assignment, CanvasAssignment, CalendarEvent } from '../types';

export async function summarizeEmailsWithGemini(emails: EmailMessage[]): Promise<EmailAlert[]> {
  try {
    const res = await fetch('/api/gemini/summarize-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });

    if (!res.ok) {
      throw new Error(`Summarize API failed: ${res.statusText}`);
    }

    const data = await res.json();
    const alerts: EmailAlert[] = (data.alerts || []).map((alert: any) => {
      const raw = emails.find((e) => e.id === alert.id);
      return {
        ...alert,
        rawEmail: raw,
      };
    });

    return alerts;
  } catch (error) {
    console.error('Error calling summarize emails API:', error);
    const nonAcademicTest =
      /\b\d+%\s*(?:off|giảm)\b|\b(?:sale|giảm|off|discount|deal|save)\s*\d+%\b|khuyến mãi|voucher|giảm giá|ưu đãi|tiết kiệm|clearance|coupon|flash sale|black friday|quà tặng|free shipping|miễn phí vận chuyển|mua \d+ tặng \d+|shopee|tiki|lazada|grab|be |gojek|sendo|amazon|shein|aliexpress|temu|zalopay|momo|viettel money|starbucks|highlands|kfc|mcdonald|netflix|spotify|canva|duolingo|grammarly|linkedin|facebook|instagram|tiktok|youtube|twitter|x\.com|medium|newsletter|bản tin|digest|unsubscribe|hủy đăng ký|opt-?out|view in browser|xem trên trình duyệt|privacy policy|manage preferences|receipt|invoice|order confirmation|payment received|mã otp/i;
    const academicTest =
      /professor|prof\.|teacher|giáo viên|thầy|cô|giảng viên|khoa|phòng đào tạo|trường|bài tập|assignment|homework|exam|kiểm tra|thi học kỳ|canvas|google classroom|moodle|blackboard|syllabus|hạn nộp|nộp bài|lab report/i;

    return emails.map((e) => {
      const fullText = `${e.subject || ""} ${e.snippet || ""} ${e.sender || ""}`.toLowerCase();
      const isCommercial = !academicTest.test(fullText) && nonAcademicTest.test(fullText);
      const isVietnamese =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fullText);

      if (isCommercial) {
        return {
          id: e.id,
          sender: e.sender,
          subject: e.subject,
          oneLineSummary: `${(e.snippet || e.subject || "").slice(0, 75)}...`,
          urgency: 'INFO' as const,
          category: 'PROMOTION' as const,
          categoryLabel: isVietnamese ? 'Khuyến mãi / Quảng cáo' : 'Promotion / Spam',
          isSpam: true,
          spamReason: isVietnamese ? 'Nội dung quảng cáo / dịch vụ ngoài trường học' : 'Commercial promotion',
          language: isVietnamese ? 'vi' : 'en',
          rawEmail: e,
        };
      }

      const isExam = /thi học kỳ|kỳ thi|lịch thi|kiểm tra|midterm|final exam|quiz due/i.test(fullText);
      const isAssignment = /bài tập|assignment|homework|lab report|nộp bài/i.test(fullText);
      const urgency: 'HIGH' | 'LOW' = isExam || isAssignment ? 'HIGH' : 'LOW';
      const category: 'EXAM' | 'ASSIGNMENT' | 'GENERAL' = isExam ? 'EXAM' : isAssignment ? 'ASSIGNMENT' : 'GENERAL';

      return {
        id: e.id,
        sender: e.sender,
        subject: e.subject,
        oneLineSummary: `${(e.snippet || e.subject || "").slice(0, 75)}...`,
        urgency,
        category,
        categoryLabel: isExam
          ? (isVietnamese ? 'Lịch thi / Kiểm tra' : 'Exam / Quiz')
          : isAssignment
          ? (isVietnamese ? 'Bài tập & Hạn nộp' : 'Assignment')
          : (isVietnamese ? 'Thông báo chung' : 'General Update'),
        isSpam: false,
        language: isVietnamese ? 'vi' : 'en',
        detectedAssignment: {
          isAssignment: isExam || isAssignment,
          name: e.subject,
          subject: isVietnamese ? 'Môn học' : 'General',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          priority: isExam || isAssignment ? 'High' : 'Med',
        },
        rawEmail: e,
      };
    });
  }
}

export async function generateQuickDraft(request: QuickDraftRequest): Promise<QuickDraftResponse> {
  const res = await fetch('/api/gemini/quick-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Quick draft API error: ${res.statusText}`);
  }

  return await res.json();
}

export async function parseNaturalLanguageAssignment(text: string): Promise<Partial<Assignment>> {
  const res = await fetch('/api/gemini/parse-assignment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Parse assignment error: ${res.statusText}`);
  }

  return await res.json();
}

export async function sendStudyAssistantMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context?: any
): Promise<string> {
  const res = await fetch('/api/gemini/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!res.ok) {
    throw new Error(`Study assistant error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.reply || "I'm here to help you stay ahead in all your classes!";
}

// AI Smart-Breakdown Task Extractor
export interface SubtaskResult {
  subtasks: { title: string; estimatedMinutes: number; order: number }[];
  totalEstimatedMinutes: number;
  difficulty: string;
}

export async function extractSubtasksFromCanvas(assignment: CanvasAssignment): Promise<SubtaskResult> {
  const res = await fetch('/api/gemini/extract-subtasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignmentName: assignment.name,
      courseName: assignment.courseName,
      description: assignment.description,
      dueAt: assignment.dueAt,
      pointsPossible: assignment.pointsPossible,
    }),
  });

  if (!res.ok) {
    throw new Error(`Extract subtasks error: ${res.statusText}`);
  }

  return await res.json();
}

// Dynamic Priority & Effort Estimator
export interface EffortEstimate {
  id: string;
  riskScore: number;
  estimatedMinutes: number;
  focusOrder: number;
  aiTip: string;
}

export async function estimateAssignmentEffort(assignments: Assignment[]): Promise<EffortEstimate[]> {
  const notDone = assignments.filter((a) => a.status !== 'Done');
  if (notDone.length === 0) return [];

  const res = await fetch('/api/gemini/estimate-effort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments: notDone }),
  });

  if (!res.ok) {
    throw new Error(`Estimate effort error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.estimates || [];
}

// AI Peak-Focus Chronotype Study Slot Suggester
export interface StudySlotSuggestion {
  startTime: string;
  endTime: string;
  taskName: string;
  taskSubject: string;
  reason: string;
}

export interface StudySlotResult {
  suggestedSlots: StudySlotSuggestion[];
  chronotypeAdvice: string;
}

export async function suggestStudySlots(
  existingEvents: CalendarEvent[],
  pendingTasks: Assignment[],
  chronotype?: string,
  date?: string
): Promise<StudySlotResult> {
  const res = await fetch('/api/gemini/suggest-study-slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ existingEvents, pendingTasks, chronotype, date }),
  });

  if (!res.ok) {
    throw new Error(`Suggest study slots error: ${res.statusText}`);
  }

  return await res.json();
}
