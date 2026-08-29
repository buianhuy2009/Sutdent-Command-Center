import { EmailAlert, EmailMessage, QuickDraftRequest, QuickDraftResponse, Assignment } from '../types';

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
    // Fallback alerts
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
