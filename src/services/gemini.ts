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
    return emails.map((e) => ({
      id: e.id,
      sender: e.sender,
      subject: e.subject,
      oneLineSummary: `${e.sender}: ${e.snippet.slice(0, 80)}...`,
      urgency: 'MEDIUM',
      category: 'ASSIGNMENT',
      detectedAssignment: {
        isAssignment: true,
        name: e.subject,
        subject: 'General',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        priority: 'Med',
      },
      rawEmail: e,
    }));
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
