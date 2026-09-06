/**
 * Global Prompt Log store — Division A compliance (Điều 5).
 * Captures every AI call: timestamp, model, system excerpt, user prompt,
 * output excerpt, feature source + student edit notes (self-built vs AI-assisted).
 * Persisted to localStorage (scc_prompt_log_v1); Dexie mirror is best-effort.
 */

export interface PromptLogEntry {
  id: string;
  timestamp: string;
  feature: string;
  model: string;
  systemPromptExcerpt: string;
  userPrompt: string;
  outputExcerpt: string;
  studentEditNotes?: string;
  contribution?: 'self-built' | 'ai-assisted' | 'open-source';
}

const KEY = 'scc_prompt_log_v1';
const MAX_ENTRIES = 500;

function truncate(s: string, n = 300): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function logPrompt(entry: Omit<PromptLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): PromptLogEntry {
  const full: PromptLogEntry = {
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    feature: entry.feature,
    model: entry.model,
    systemPromptExcerpt: truncate(entry.systemPromptExcerpt || '', 300),
    userPrompt: truncate(entry.userPrompt || '', 300),
    outputExcerpt: truncate(entry.outputExcerpt || '', 300),
    studentEditNotes: (entry.studentEditNotes || '').slice(0, 500),
    contribution: entry.contribution || 'ai-assisted',
  };
  try {
    const raw = localStorage.getItem(KEY);
    const arr: PromptLogEntry[] = raw ? JSON.parse(raw) : [];
    arr.unshift(full);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX_ENTRIES)));
  } catch {}
  // Best-effort Dexie mirror (never blocks UI)
  try {
    import('./db').then(({ db }) => {
      (db as any).table?.('promptLogs')?.add?.({ ...full }).catch(() => {});
    }).catch(() => {});
  } catch {}
  try { window.dispatchEvent(new CustomEvent('scc:prompt-log', { detail: { id: full.id } })); } catch {}
  return full;
}

export function getPromptLogs(): PromptLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function updatePromptLogNotes(id: string, notes: string): void {
  try {
    const arr = getPromptLogs();
    const next = arr.map(e => (e.id === id ? { ...e, studentEditNotes: notes.slice(0, 500) } : e));
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function clearPromptLogs(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

export function exportPromptLogMarkdown(): string {
  const logs = getPromptLogs();
  const lines = [
    '# Prompt Log — Student Command Center (Division A compliance)',
    `Exported: ${new Date().toISOString()}`,
    `Entries: ${logs.length}`,
    '',
    ...logs.map((e, i) => [
      `## ${i + 1}. [${e.feature}] ${e.timestamp}`,
      `- Model: ${e.model}`,
      `- Contribution: ${e.contribution || 'ai-assisted'}`,
      `- System prompt (excerpt): ${e.systemPromptExcerpt}`,
      `- User prompt: ${e.userPrompt}`,
      `- Output (excerpt): ${e.outputExcerpt}`,
      `- Student edit notes: ${e.studentEditNotes || '(none — add: I changed X because Y)'}`,
      '',
    ].join('\n')),
  ];
  return lines.join('\n');
}
