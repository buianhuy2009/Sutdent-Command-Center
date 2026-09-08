import type { Assignment, CanvasAssignment, EmailAlert, EmailMessage } from '../types';

/**
 * Data sanitizers — the white-screen backstop.
 * Any malformed record (legacy storage, blank sheet row, Gmail extract, share-target)
 * used to throw inside setState updaters above all error boundaries and unmount the app.
 * Every loader normalizes through these so pipelines never see null/undefined fields.
 */

const safeStr = (v: any, fallback = ''): string =>
  typeof v === 'string' ? v : v === null || v === undefined ? fallback : String(v);

export function normKey(v: any): string {
  return safeStr(v).toLowerCase().trim();
}

export function sanitizeAssignment(a: any, index = 0): Assignment | null {
  if (!a || typeof a !== 'object') return null;
  const assignmentName = safeStr(a.assignmentName || a.title || a.name, '').trim() || 'Untitled Assignment';
  const priority = a.priority === 'High' || a.priority === 'Med' || a.priority === 'Low' ? a.priority : 'Med';
  const status = a.status === 'Done' || a.status === 'In Progress' || a.status === 'Not Started' ? a.status : 'Not Started';
  return {
    id: safeStr(a.id, `task-${Date.now()}-${index}`),
    subject: safeStr(a.subject, 'General') || 'General',
    assignmentName,
    dueDate: safeStr(a.dueDate, ''),
    priority,
    status,
    source: a.source ?? 'Manual',
    canvasId: a.canvasId,
    docUrl: a.docUrl,
    notes: a.notes,
    sheetRowIndex: typeof a.sheetRowIndex === 'number' ? a.sheetRowIndex : undefined,
    estimatedMinutes: typeof a.estimatedMinutes === 'number' ? a.estimatedMinutes : undefined,
    updatedAt: a.updatedAt,
    repeats: a.repeats,
    rrule: a.rrule,
    subtasks: Array.isArray(a.subtasks) ? a.subtasks : undefined,
    attachments: Array.isArray(a.attachments) ? a.attachments : undefined,
    submission: a.submission,
    trashedAt: a.trashedAt ?? null,
  };
}

export function sanitizeAssignments(list: any): Assignment[] {
  if (!Array.isArray(list)) return [];
  return list.map((a, i) => sanitizeAssignment(a, i)).filter((a): a is Assignment => a !== null);
}

export function sanitizeCanvasAssignment(c: any, index = 0): CanvasAssignment | null {
  if (!c || typeof c !== 'object') return null;
  return {
    id: safeStr(c.id, `canvas-${Date.now()}-${index}`),
    name: safeStr(c.name || c.title, '').trim() || 'Canvas Assignment',
    courseName: safeStr(c.courseName || c.course_code, '').trim() || 'Canvas Course',
    courseId: c.courseId !== undefined && c.courseId !== null ? String(c.courseId) : undefined,
    dueAt: safeStr(c.dueAt || c.due_at, ''),
    pointsPossible: typeof c.pointsPossible === 'number' ? c.pointsPossible : undefined,
    htmlUrl: c.htmlUrl,
    description: c.description,
    isSynced: Boolean(c.isSynced),
    isCompleted: Boolean(c.isCompleted),
    isInformational: c.isInformational,
    submissionTypes: Array.isArray(c.submissionTypes) ? c.submissionTypes : undefined,
  };
}

export function sanitizeCanvasAssignments(list: any): CanvasAssignment[] {
  if (!Array.isArray(list)) return [];
  return list.map((c, i) => sanitizeCanvasAssignment(c, i)).filter((c): c is CanvasAssignment => c !== null);
}

export function sanitizeEmailAlert(e: any, index = 0): EmailAlert | null {
  if (!e || typeof e !== 'object') return null;
  const urgency = e.urgency === 'HIGH' || e.urgency === 'MEDIUM' || e.urgency === 'LOW' || e.urgency === 'INFO' ? e.urgency : 'INFO';
  return { ...e, id: safeStr(e.id, `alert-${Date.now()}-${index}`), urgency } as EmailAlert;
}

export function sanitizeEmailAlerts(list: any): EmailAlert[] {
  if (!Array.isArray(list)) return [];
  return list.map((e, i) => sanitizeEmailAlert(e, i)).filter((e): e is EmailAlert => e !== null);
}

export function sanitizeRawEmails(list: any): EmailMessage[] {
  if (!Array.isArray(list)) return [];
  return list.filter((e) => e && typeof e === 'object').map((e: any, i: number) => ({
    id: safeStr(e.id, `email-${Date.now()}-${i}`),
    threadId: e.threadId,
    sender: safeStr(e.sender, 'Unknown sender'),
    senderEmail: e.senderEmail,
    subject: safeStr(e.subject, '(no subject)'),
    date: safeStr(e.date, ''),
    snippet: safeStr(e.snippet, ''),
    body: e.body,
    unread: e.unread,
  }));
}

/**
 * Sanitizes raw HTML strings to prevent XSS attacks when using dangerouslySetInnerHTML.
 * Strips executable tags (<script>, <iframe>, etc.), inline event attributes (on*),
 * and dangerous URL schemes (javascript:, etc.).
 */
function isDangerousUrl(urlVal: string): boolean {
  if (!urlVal) return false;
  const normalized = urlVal
    .replace(/&#[xX]0*([0-9a-fA-F]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#0*([0-9]+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/[\x00-\x20\x7F-\x9F]/g, '')
    .toLowerCase();
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html') ||
    normalized.startsWith('data:application/')
  );
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    let clean = html;
    let prev = '';
    while (clean !== prev) {
      prev = clean;
      clean = clean
        .replace(/<(script|iframe|object|embed|form|base|meta|link|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
        .replace(/<(script|iframe|object|embed|form|base|meta|link|style)\b[^>]*\/?>/gi, '');
    }
    return clean
      .replace(/\s+on[a-z0-9_-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(href|src|action|data)\s*=\s*["']?\s*(?:java&#[xX]0*73;cript|javascript|vbscript|data:text\/html)[^"'\s>]+/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const forbiddenTags = ['script', 'iframe', 'object', 'embed', 'form', 'base', 'meta', 'link', 'style'];
    forbiddenTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    doc.querySelectorAll('*').forEach((el) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if (['href', 'src', 'action', 'data'].includes(name)) {
          if (isDangerousUrl(attr.value)) {
            el.removeAttribute(attr.name);
          }
        }
      }
    });

    return doc.body.innerHTML;
  } catch {
    return '';
  }
}
