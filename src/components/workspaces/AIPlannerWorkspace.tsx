import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  CalendarCheck,
  RefreshCw,
  Send,
  Clock,
  BookOpen,
  Coffee,
  TriangleAlert,
  CalendarX2,
  Loader2,
  ListPlus,
  KeyRound,
  MessageSquareText,
} from 'lucide-react';
import type { Assignment, CalendarEvent, CanvasAssignment, EmailAlert } from '../../types';
import { callGemini, GEMINI_DEFAULT_MODEL } from '../../services/gemini';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AIPlannerWorkspaceProps {
  assignments: Assignment[];
  canvasAssignments: CanvasAssignment[];
  /** Classroom coursework (same shape as Canvas). Optional for backward compat. */
  classroomAssignments?: CanvasAssignment[];
  /** Gmail radar alerts with detectedAssignment. Optional. */
  emailAlerts?: EmailAlert[];
  /** Read-only Google Calendar events (optional). Prefer 7-day upcoming feed. */
  meetings?: CalendarEvent[];
}

interface PlanBlock {
  id: string;
  title: string;
  subject: string;
  dayISO: string; // YYYY-MM-DD
  startMin: number; // minutes since midnight
  endMin: number;
  reason: string;
  kind: 'study' | 'review' | 'break' | 'meeting';
}

interface PlannerConstraints {
  avoidMornings: boolean;
  preferEvenings: boolean;
  moreBreaks: boolean;
  blockedDays: string[]; // YYYY-MM-DD
  notes: string[];
}

interface PersistedPlan {
  blocks: PlanBlock[];
  generatedAt: string;
  mode: 'ai' | 'local';
  constraints: PlannerConstraints;
}

interface ChatMsg {
  role: 'user' | 'planner';
  text: string;
}

const STORAGE_KEY = 'scc_ai_planner_v1';
const DEFAULT_CONSTRAINTS: PlannerConstraints = {
  avoidMornings: false,
  preferEvenings: false,
  moreBreaks: false,
  blockedDays: [],
  notes: [],
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/* ------------------------------------------------------------------ */
/* Date helpers (local time, YYYY-MM-DD)                               */
/* ------------------------------------------------------------------ */

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function next7Days(): string[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(now, i)));
}

function parseDueToISO(due?: string): string | null {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return null;
  return toISODate(d);
}

function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${`${m}`.padStart(2, '0')} ${ampm}`;
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const today = toISODate(new Date());
  const tomorrow = toISODate(addDays(new Date(), 1));
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (iso === today) return `Today · ${md}`;
  if (iso === tomorrow) return `Tomorrow · ${md}`;
  return `${weekday} · ${md}`;
}

function daysUntil(iso: string): number {
  const today = new Date(toISODate(new Date()) + 'T12:00:00').getTime();
  const target = new Date(`${iso}T12:00:00`).getTime();
  return Math.round((target - today) / 86400000);
}

/* ------------------------------------------------------------------ */
/* Input harvesting (read-only)                                        */
/* ------------------------------------------------------------------ */

interface DatedTask {
  key: string;
  title: string;
  subject: string;
  dueISO: string;
  priority: 'High' | 'Med' | 'Low';
  minutes: number;
  origin: 'assignment' | 'canvas' | 'classroom' | 'gmail' | 'moodle';
}

function readCachedArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function harvestTasks(
  assignments: Assignment[],
  canvas: CanvasAssignment[],
  classroom?: CanvasAssignment[],
  emailAlerts?: EmailAlert[],
  days?: string[],
): DatedTask[] {
  const out: DatedTask[] = [];
  const fallbackDue = days && days.length > 0 ? days[days.length - 1] : toISODate(addDays(new Date(), 6));
  for (const a of assignments || []) {
    if (!a || a.status === 'Done') continue;
    let dueISO = parseDueToISO(a.dueDate);
    if (!dueISO) {
      // Undated High-priority still deserves a slot — backlog to end of week.
      if (a.priority !== 'High') continue;
      dueISO = fallbackDue;
    }
    const subMin = Array.isArray(a.subtasks)
      ? a.subtasks.reduce((s, st: any) => s + (Number(st?.estimatedMinutes) || 0), 0)
      : 0;
    out.push({
      key: `a-${a.id}`,
      title: a.assignmentName || 'Untitled assignment',
      subject: a.subject || 'General',
      dueISO,
      priority: a.priority || 'Med',
      minutes: Math.max(30, Math.min(240, Math.max(a.estimatedMinutes || 90, subMin || 0))),
      origin: 'assignment',
    });
  }
  const pushLms = (c: CanvasAssignment, prefix: string, origin: DatedTask['origin'], fallbackSubject: string) => {
    if (!c || c.isCompleted || c.isInformational) return;
    const dueISO = parseDueToISO((c as any).dueAt);
    if (!dueISO) return;
    out.push({
      key: `${prefix}-${c.id}`,
      title: c.name || 'Untitled item',
      subject: c.courseName || fallbackSubject,
      dueISO,
      priority: 'Med',
      minutes: 60,
      origin,
    });
  };
  for (const c of canvas || []) pushLms(c, 'c', 'canvas', 'Canvas');
  for (const c of classroom || []) pushLms(c, 'gclass', 'classroom', 'Classroom');
  for (const m of readCachedArray('scc_cached_moodle_assignments')) {
    pushLms(
      { id: String(m?.id || m?.name || Math.random()), name: m?.name || m?.title, courseName: m?.courseName || m?.course || 'Moodle', dueAt: m?.dueAt || m?.dueDate } as CanvasAssignment,
      'm',
      'moodle',
      'Moodle',
    );
  }
  const seenGmail = new Set<string>();
  for (const alert of emailAlerts || []) {
    const det = alert?.detectedAssignment;
    if (!det?.isAssignment) continue;
    const title = (det.name || alert.subject || '').trim();
    if (!title || seenGmail.has(title.toLowerCase())) continue;
    seenGmail.add(title.toLowerCase());
    const dueISO = parseDueToISO(det.dueDate) || fallbackDue;
    out.push({
      key: `g-${alert.id}`,
      title,
      subject: det.subject || 'Gmail',
      dueISO,
      priority: det.priority || 'Med',
      minutes: 60,
      origin: 'gmail',
    });
  }
  const weight = { High: 0, Med: 1, Low: 2 } as const;
  out.sort((x, y) => x.dueISO.localeCompare(y.dueISO) || weight[x.priority] - weight[y.priority]);
  return out;
}

interface BusySpan {
  dayISO: string;
  startMin: number;
  endMin: number;
  label: string;
}

function meetingsToBusy(meetings?: CalendarEvent[]): BusySpan[] {
  if (!meetings) return [];
  const spans: BusySpan[] = [];
  for (const m of meetings) {
    try {
      const rawStart = m?.start?.dateTime || m?.start?.date;
      if (!rawStart) continue;
      const s = new Date(rawStart);
      if (Number.isNaN(s.getTime())) continue;
      const rawEnd = m?.end?.dateTime || m?.end?.date;
      const e = rawEnd ? new Date(rawEnd) : new Date(s.getTime() + 60 * 60000);
      const dayISO = toISODate(s);
      const startMin = s.getHours() * 60 + s.getMinutes();
      const endMin = Number.isNaN(e.getTime())
        ? startMin + 60
        : e.getHours() * 60 + e.getMinutes();
      spans.push({
        dayISO,
        startMin: Math.max(0, startMin),
        endMin: Math.max(startMin + 15, Math.min(1440, endMin)),
        label: m.summary || 'Meeting',
      });
    } catch {
      /* ignore malformed events */
    }
  }
  return spans;
}

/** Weekly timetable (scc_timetable_v1 {day:Mon..Sun,hour:8..19,title}) → busy spans for this 7-day window. */
function timetableToBusy(days: string[]): BusySpan[] {
  const rows = readCachedArray('scc_timetable_v1');
  if (rows.length === 0) return [];
  const idx: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const spans: BusySpan[] = [];
  for (const dayISO of days) {
    const dow = new Date(`${dayISO}T12:00:00`).getDay();
    for (const r of rows) {
      const key = String(r?.day || '').slice(0, 3);
      if (idx[key] !== dow) continue;
      const h = Number(r?.hour);
      if (!Number.isFinite(h)) continue;
      spans.push({ dayISO, startMin: h * 60, endMin: Math.min(1440, h * 60 + 60), label: String(r?.title || 'Class') });
    }
  }
  return spans;
}

/* ------------------------------------------------------------------ */
/* Deterministic local planner — always works offline.                 */
/* Exclusive: no two blocks (study or meeting) ever overlap.           */
/* ------------------------------------------------------------------ */

function windowsFor(constraints: PlannerConstraints): Array<[number, number]> {
  if (constraints.avoidMornings) return [[780, 1020], [1140, 1290]]; // 1pm-5pm, 7pm-9:30pm
  if (constraints.preferEvenings) return [[540, 720], [1140, 1320]]; // 9am-12pm, 7pm-10pm
  return [[540, 720], [780, 1020], [1140, 1260]]; // 9-12, 1-5, 7-9
}

function buildLocalPlan(
  tasks: DatedTask[],
  busy: BusySpan[],
  days: string[],
  constraints: PlannerConstraints,
): PlanBlock[] {
  const blocks: PlanBlock[] = [];
  const occupied: Record<string, Array<[number, number]>> = {};
  for (const d of days) occupied[d] = [];
  for (const b of busy) {
    if (occupied[b.dayISO]) occupied[b.dayISO].push([b.startMin, b.endMin]);
  }

  const overlaps = (day: string, s: number, e: number) =>
    (occupied[day] || []).some(([a, b]) => s < b && a < e);

  const claim = (day: string, s: number, e: number) => {
    occupied[day].push([s, e]);
  };

  const sessionLen = constraints.moreBreaks ? 45 : 75;
  const gap = constraints.moreBreaks ? 15 : 10;
  let seq = 0;

  const placeSession = (
    task: DatedTask,
    dayISO: string,
    reason: string,
    kind: PlanBlock['kind'],
  ): boolean => {
    if (constraints.blockedDays.includes(dayISO)) return false;
    for (const [ws, we] of windowsFor(constraints)) {
      for (let s = ws; s + sessionLen <= we; s += 15) {
        const e = s + sessionLen;
        if (!overlaps(dayISO, s, e)) {
          claim(dayISO, s, e);
          seq += 1;
          blocks.push({
            id: `${task.key}-s${seq}`,
            title: task.title,
            subject: task.subject,
            dayISO,
            startMin: s,
            endMin: e,
            reason,
            kind,
          });
          if (constraints.moreBreaks) {
            // A short breather right after — still exclusive, still claimed.
            const bs = e;
            const be = Math.min(e + 10, we);
            if (be - bs >= 5 && !overlaps(dayISO, bs, be)) {
              claim(dayISO, bs, be);
              blocks.push({
                id: `${task.key}-b${seq}`,
                title: 'Break',
                subject: 'Recharge',
                dayISO,
                startMin: bs,
                endMin: be,
                reason: 'Short breather so focus stays sharp.',
                kind: 'break',
              });
            }
          }
          return true;
        }
      }
    }
    return false;
  };

  for (const task of tasks) {
    const left = daysUntil(task.dueISO);
    const sessionsNeeded = task.minutes > 120 ? 3 : task.minutes > 60 ? 2 : 1;
    // Eligible days: today → due date within the 7-day window.
    // Overdue (due < today) front-loads across the whole week instead of vanishing.
    const eligible = task.dueISO < days[0] ? [...days] : days.filter((d) => d <= task.dueISO);
    const ordered = [...eligible].sort((a, b) => {
      // Urgent items first, then earliest slot — spreads load across free days.
      if (left <= 2) return a.localeCompare(b);
      return b.localeCompare(a);
    });
    let placed = 0;
    for (const day of ordered) {
      if (placed >= sessionsNeeded) break;
      const leftForDay = daysUntil(task.dueISO) - days.indexOf(day);
      const reason =
        task.priority === 'High'
          ? `High priority · due ${task.dueISO} — placed early so it never slips.`
          : left <= 1
            ? `Due ${left <= 0 ? 'today' : 'tomorrow'} — front-loaded before the deadline.`
            : `Due ${task.dueISO} (${leftForDay} day${leftForDay === 1 ? '' : 's'} out) — steady progress, no cramming.`;
      const kind: PlanBlock['kind'] = placed === sessionsNeeded - 1 && sessionsNeeded > 1 ? 'review' : 'study';
      if (placeSession(task, day, reason, kind)) placed += 1;
      void gap;
    }
  }

  blocks.sort((a, b) => a.dayISO.localeCompare(b.dayISO) || a.startMin - b.startMin);
  return blocks;
}

/* ------------------------------------------------------------------ */
/* AI enhancement (judge-locked chain: 3.5-flash → 3.0-flash → Groq).  */
/* Uses shared callGemini so BYOK, server proxy, and Groq all work.   */
/* Any failure → null, caller falls back to the local plan.           */
/* ------------------------------------------------------------------ */

async function tryGeminiPlan(
  tasks: DatedTask[],
  days: string[],
  constraints: PlannerConstraints,
  signal: AbortSignal,
): Promise<PlanBlock[] | null> {
  if (signal.aborted) return null;

  const prompt = [
    'You are a student timetable planner. Return ONLY valid JSON: an array of blocks.',
    'Each block: {"title": string, "subject": string, "dayISO": "YYYY-MM-DD", "startMin": number (minutes since midnight), "endMin": number, "reason": string (one short sentence why this slot)}.',
    `Week days (use only these): ${days.join(', ')}.`,
    `Constraints: avoidMornings=${constraints.avoidMornings}, preferEvenings=${constraints.preferEvenings}, moreBreaks=${constraints.moreBreaks}, blockedDays=${constraints.blockedDays.join('|') || 'none'}.`,
    'Rules: exclusive timetable — no overlapping blocks. 45-75 minute sessions. Put urgent due dates first.',
    `Tasks: ${JSON.stringify(tasks.slice(0, 40))}`,
  ].join('\n');

  try {
    const text = await callGemini({
      contents: prompt.slice(0, 12000),
      config: { responseMimeType: 'application/json' },
      model: GEMINI_DEFAULT_MODEL,
    });
    if (!text || signal.aborted) return null;
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as any[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const daySet = new Set(days);
    const blocks: PlanBlock[] = [];
    const taken: Array<[string, number, number]> = [];
    parsed.slice(0, 30).forEach((b, i) => {
      const dayISO = String(b?.dayISO || '');
      const s = Number(b?.startMin);
      const e = Number(b?.endMin);
      if (!daySet.has(dayISO) || !Number.isFinite(s) || !Number.isFinite(e) || e <= s) return;
      if (e - s > 180 || e - s < 15) return;
      if (taken.some(([d, a, c]) => d === dayISO && s < c && a < e)) return; // keep exclusive
      if (constraints.blockedDays.includes(dayISO)) return;
      taken.push([dayISO, s, e]);
      blocks.push({
        id: `ai-${i}-${s}`,
        title: String(b?.title || 'Study session').slice(0, 80),
        subject: String(b?.subject || 'Study').slice(0, 40),
        dayISO,
        startMin: Math.max(0, Math.min(1439, Math.round(s))),
        endMin: Math.max(1, Math.min(1440, Math.round(e))),
        reason: String(b?.reason || 'Placed by AI around your deadlines.').slice(0, 140),
        kind: 'study',
      });
    });
    blocks.sort((a, b) => a.dayISO.localeCompare(b.dayISO) || a.startMin - b.startMin);
    return blocks.length > 0 ? blocks : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Constraint parsing for chat re-plans                                */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseConstraintsFromText(
  text: string,
  days: string[],
  prev: PlannerConstraints,
): { next: PlannerConstraints; changes: string[] } {
  const lower = text.toLowerCase();
  const next: PlannerConstraints = {
    ...prev,
    blockedDays: [...prev.blockedDays],
    notes: [...prev.notes],
  };
  const changes: string[] = [];

  if (/(avoid|no|skip)\s+(morning|mornings)/.test(lower) || /not\s+a\s+morning\s+person/.test(lower)) {
    if (!next.avoidMornings) {
      next.avoidMornings = true;
      changes.push('Avoiding mornings — sessions move to afternoons and evenings.');
    }
  }
  if (/(evening|night)/.test(lower) && /(prefer|after|pm)/.test(lower)) {
    if (!next.preferEvenings) {
      next.preferEvenings = true;
      changes.push('Preferring evening slots where the day is free.');
    }
  }
  if (/more\s+breaks?/.test(lower) || /burn(ed|t)?\s*out/.test(lower) || /shorter\s+sessions?/.test(lower)) {
    if (!next.moreBreaks) {
      next.moreBreaks = true;
      changes.push('Shorter 45-minute sessions with breathers between them.');
    }
  }
  // Explicit "keep X clear / busy Friday / no time Monday" blocks that day — same rule every weekday.
  const dayBusy = /(busy|meeting|reschedul|avoid|off|unavailable|no\s*time|booked|clear|keep|move)/.test(lower);
  WEEKDAYS.forEach((wd, idx) => {
    if (!lower.includes(wd) && !lower.includes(wd.slice(0, 3))) return;
    if (!dayBusy) return;
    const match = days.find((iso) => new Date(`${iso}T12:00:00`).getDay() === idx);
    if (match && !next.blockedDays.includes(match)) {
      next.blockedDays.push(match);
      changes.push(`Keeping ${wd[0].toUpperCase()}${wd.slice(1)} (${match}) clear — sessions moved to other days.`);
    }
  });
  if (changes.length === 0) {
    const snippet = text.trim().slice(0, 60);
    next.notes.push(snippet);
    changes.push(`Noted (“${snippet}”) — rebalanced the week with your deadlines first.`);
  }
  return { next, changes };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AIPlannerWorkspace: React.FC<AIPlannerWorkspaceProps> = ({
  assignments,
  canvasAssignments,
  classroomAssignments,
  emailAlerts,
  meetings,
}) => {
  const days = useMemo(() => next7Days(), []);
  const tasks = useMemo(
    () => harvestTasks(assignments || [], canvasAssignments || [], classroomAssignments, emailAlerts, days),
    [assignments, canvasAssignments, classroomAssignments, emailAlerts, days],
  );
  const busySpans = useMemo(
    () => [...meetingsToBusy(meetings), ...timetableToBusy(days)],
    [meetings, days],
  );
  const busyByDay = useMemo(() => {
    const map: Record<string, BusySpan[]> = {};
    for (const b of busySpans) (map[b.dayISO] ||= []).push(b);
    return map;
  }, [busySpans]);
  const hasMeetingFeed = meetings !== undefined;

  const [plan, setPlan] = useState<PersistedPlan | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedPlan;
      if (!parsed || !Array.isArray(parsed.blocks)) return null;
      return parsed;
    } catch {
      return null;
    }
  });
  const [constraints, setConstraints] = useState<PlannerConstraints>(
    () => plan?.constraints || DEFAULT_CONSTRAINTS,
  );
  const [phase, setPhase] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const planLiveRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((p: PersistedPlan) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* storage full or blocked — plan still shows in memory */
    }
  }, []);

  const runPlanning = useCallback(
    async (active: PlannerConstraints, announcement?: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setAiError(null);
      try {
        setPhase(`Scanning ${tasks.length} assignment${tasks.length === 1 ? '' : 's'}…`);
        await delay(380);
        if (ctrl.signal.aborted) return;
        setPhase(
          hasMeetingFeed
            ? `Blocking ${busySpans.length} calendar event${busySpans.length === 1 ? '' : 's'}…`
            : 'Checking the week ahead…',
        );
        await delay(340);
        if (ctrl.signal.aborted) return;

        setPhase('Asking AI for a smart layout (3.5-flash → 3.0-flash → Groq)…');
        await delay(300);
        if (ctrl.signal.aborted) return;

        const local = buildLocalPlan(tasks, busySpans, days, active);
        let blocks = local;
        let mode: 'ai' | 'local' = 'local';
        {
          setPhase('Refining slots with AI…');
          const ai = await tryGeminiPlan(tasks, days, active, ctrl.signal);
          if (ai && ai.length > 0) {
            blocks = ai;
            mode = 'ai';
          } else {
            setAiError(
              'AI did not return a usable plan (keys missing or quota reached) — showing the offline plan instead. Add a key in Settings → AI (BYOK).',
            );
          }
        }
        if (ctrl.signal.aborted) return;
        setPhase('Laying out exclusive blocks…');
        await delay(280);
        if (ctrl.signal.aborted) return;

        const next: PersistedPlan = {
          blocks,
          generatedAt: new Date().toISOString(),
          mode,
          constraints: active,
        };
        setPlan(next);
        persist(next);
        if (announcement) {
          setChat((prev) => [...prev.slice(-9), { role: 'planner', text: announcement }]);
        }
      } finally {
        if (!ctrl.signal.aborted) setPhase(null);
      }
    },
    [tasks, busySpans, days, hasMeetingFeed, persist],
  );

  // Auto-plan on first mount when real dated work exists.
  useEffect(() => {
    if (plan || tasks.length === 0 || phase) return;
    void runPlanning(DEFAULT_CONSTRAINTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const blocksByDay = useMemo(() => {
    const map: Record<string, PlanBlock[]> = {};
    for (const d of days) map[d] = [];
    for (const b of plan?.blocks || []) {
      if (map[b.dayISO]) map[b.dayISO].push(b);
      else map[b.dayISO] = [b];
    }
    return map;
  }, [plan, days]);

  const totalStudyMin = useMemo(
    () => (plan?.blocks || []).filter((b) => b.kind !== 'break').reduce((s, b) => s + (b.endMin - b.startMin), 0),
    [plan],
  );

  const handleRegenerate = () => void runPlanning(constraints);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || phase) return;
    const { next, changes } = parseConstraintsFromText(text, days, constraints);
    setConstraints(next);
    setChat((prev) => [...prev.slice(-9), { role: 'user', text }]);
    setDraft('');
    void runPlanning(next, changes.join(' '));
  };

  /* ------------------------------ states ------------------------------ */

  if (tasks.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 overflow-x-hidden px-1">
        <div className="rounded-3xl border border-[#DFDACB] bg-white p-6 shadow-card dark:border-[#2C2B27] dark:bg-[#1A1917] sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1A1917] dark:text-[#F5F2EA]">AI Planner</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
                I turn your real assignments and Canvas deadlines into one exclusive 7-day timetable —
                no overlaps, urgent work first.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[#DFDACB] px-4 py-10 text-center dark:border-[#2C2B27]">
            <ListPlus className="h-8 w-8 text-[#A8A49A]" aria-hidden="true" />
            <p className="mt-3 max-w-sm text-sm font-semibold text-[#1A1917] dark:text-[#F5F2EA]">
              Nothing dated to plan yet
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
              Add an assignment with a due date in Assignment Tracker, or sync Canvas — then come back
              and I will lay out your week in one tap.
            </p>
          </div>
          {!hasMeetingFeed && (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
              <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Connect Google Calendar in Settings to include meetings around your study blocks.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 overflow-x-hidden px-1">
      {/* Header */}
      <div className="rounded-3xl border border-[#DFDACB] bg-white p-5 shadow-card dark:border-[#2C2B27] dark:bg-[#1A1917] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1A1917] dark:text-[#F5F2EA]">AI Planner</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
                Exclusive 7-day timetable from {tasks.length} dated item{tasks.length === 1 ? '' : 's'}
                {hasMeetingFeed ? ` · working around ${busySpans.length} meeting${busySpans.length === 1 ? '' : 's'}` : ''}
                {plan ? ` · ${Math.round(totalStudyMin / 60)}h planned` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={phase !== null}
            aria-label="Regenerate timetable"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#C86646] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {phase ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            {phase ? 'Planning…' : 'Regenerate'}
          </button>
        </div>

        {plan && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                plan.mode === 'ai'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {plan.mode === 'ai' ? 'AI-tuned plan (3.5-flash → 3.0-flash → Groq)' : 'Offline plan — no key needed'}
            </span>
            <span className="text-[#6B6860] dark:text-[#A8A49A]">
              Built {new Date(plan.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
            {constraints.avoidMornings && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                No mornings
              </span>
            )}
            {constraints.moreBreaks && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Extra breaks
              </span>
            )}
            {constraints.blockedDays.length > 0 && (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                {constraints.blockedDays.length} day{constraints.blockedDays.length === 1 ? '' : 's'} kept clear
              </span>
            )}
          </div>
        )}

        {aiError && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              <KeyRound className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {aiError}
            </p>
          </div>
        )}
        {!hasMeetingFeed && tasks.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
            <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Connect Google Calendar in Settings to include meetings — study blocks will work around them automatically.
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {phase && (
        <div aria-busy="true" aria-label="Planning your week" className="rounded-3xl border border-[#DFDACB] bg-white p-5 shadow-card dark:border-[#2C2B27] dark:bg-[#1A1917]">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#1A1917] dark:text-[#F5F2EA]">
            <Loader2 className="h-4 w-4 animate-spin text-[#D97757]" aria-hidden="true" />
            {phase}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[#DFDACB] p-3 dark:border-[#2C2B27]">
                <div className="h-3 w-2/3 rounded bg-stone-200 dark:bg-stone-700" />
                <div className="mt-2 h-2 w-1/2 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="mt-2 h-2 w-full rounded bg-stone-100 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero agenda */}
      {plan && !phase && (
        <div ref={planLiveRef} aria-live="polite" className="grid items-start gap-3 lg:grid-cols-7">
          {days.map((day) => {
            const dayBlocks = (blocksByDay[day] || []).filter((b) => b.kind !== 'break');
            const breaks = (blocksByDay[day] || []).filter((b) => b.kind === 'break');
            const meetingsToday = busyByDay[day] || [];
            const isEmpty = dayBlocks.length === 0 && meetingsToday.length === 0;
            return (
              <section
                key={day}
                aria-label={dayLabel(day)}
                className="min-w-0 rounded-2xl border border-[#DFDACB] bg-white p-3 shadow-card dark:border-[#2C2B27] dark:bg-[#1A1917]"
              >
                <h3 className="truncate text-xs font-bold text-[#1A1917] dark:text-[#F5F2EA]">{dayLabel(day)}</h3>
                <div className="mt-2 space-y-2">
                  {meetingsToday.map((m, i) => (
                    <div
                      key={`m-${i}`}
                      className="rounded-xl border border-sky-200 bg-sky-50 p-2 dark:border-sky-900 dark:bg-sky-950/40"
                    >
                      <p className="flex items-center gap-1 text-[11px] font-bold text-sky-800 dark:text-sky-200">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{fmtTime(m.startMin)} – {fmtTime(m.endMin)}</span>
                      </p>
                      <p className="mt-0.5 break-words text-[11px] font-semibold text-sky-900 dark:text-sky-100">{m.label}</p>
                      <p className="text-[10px] text-sky-600 dark:text-sky-400">Busy — kept clear</p>
                    </div>
                  ))}
                  {dayBlocks.map((b) => (
                    <article
                      key={b.id}
                      className={`rounded-xl border p-2 ${
                        b.kind === 'review'
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
                          : 'border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30'
                      }`}
                    >
                      <p className="flex items-center gap-1 text-[11px] font-bold text-[#1A1917] dark:text-[#F5F2EA]">
                        {b.kind === 'review'
                          ? <BookOpen className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
                          : <CalendarCheck className="h-3 w-3 shrink-0 text-violet-600" aria-hidden="true" />}
                        <span className="truncate">{fmtTime(b.startMin)} – {fmtTime(b.endMin)}</span>
                      </p>
                      <p className="mt-0.5 break-words text-[11px] font-bold leading-snug text-[#1A1917] dark:text-[#F5F2EA]">
                        {b.title}
                      </p>
                      <p className="truncate text-[10px] font-medium text-[#6B6860] dark:text-[#A8A49A]">{b.subject}</p>
                      <p className="mt-1 break-words text-[10px] italic leading-snug text-[#6B6860] dark:text-[#A8A49A]">
                        {b.reason}
                      </p>
                    </article>
                  ))}
                  {breaks.length > 0 && (
                    <p className="flex items-center gap-1 px-1 text-[10px] font-medium text-[#6B6860] dark:text-[#A8A49A]">
                      <Coffee className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {breaks.length} breather{breaks.length === 1 ? '' : 's'} tucked in
                    </p>
                  )}
                  {isEmpty && (
                    <p className="rounded-xl border border-dashed border-[#DFDACB] p-2 text-center text-[10px] text-[#A8A49A] dark:border-[#2C2B27]">
                      Open day — nothing scheduled.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Chat re-plan */}
      <div className="rounded-3xl border border-[#DFDACB] bg-white p-5 shadow-card dark:border-[#2C2B27] dark:bg-[#1A1917] sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#1A1917] dark:text-[#F5F2EA]">
          <MessageSquareText className="h-4 w-4 text-[#D97757]" aria-hidden="true" />
          Reschedule in plain words
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6860] dark:text-[#A8A49A]">
          Try “meeting moved to Friday, keep it clear”, “avoid mornings”, or “I need more breaks”.
        </p>
        <div aria-live="polite" className="mt-3 space-y-2">
          {chat.length === 0 && (
            <p className="rounded-2xl bg-[#FAF9F5] p-3 text-xs text-[#6B6860] dark:bg-[#1F1E1B] dark:text-[#A8A49A]">
              No reschedule notes yet — your latest plan is shown above. Tell me what changed and I will
              re-lay the week around it.
            </p>
          )}
          {chat.slice(-10).map((m, i) => (
            <div
              key={i}
              className={`max-w-full break-words rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto w-fit max-w-[90%] bg-[#D97757] font-medium text-white'
                  : 'mr-auto w-fit max-w-[90%] border border-[#DFDACB] bg-[#FAF9F5] text-[#3A3835] dark:border-[#2C2B27] dark:bg-[#1F1E1B] dark:text-[#D6D2C7]'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="ai-planner-chat" className="sr-only">
            Describe a schedule change
          </label>
          <input
            id="ai-planner-chat"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Cram session moved to Friday — keep it clear"
            autoComplete="off"
            disabled={phase !== null}
            className="min-w-0 flex-1 rounded-xl border border-[#DFDACB] bg-white px-3 py-2.5 text-sm text-[#1A1917] outline-none placeholder:text-[#A8A49A] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/30 dark:border-[#2C2B27] dark:bg-[#1F1E1B] dark:text-[#F5F2EA]"
          />
          <button
            type="submit"
            disabled={phase !== null || !draft.trim()}
            aria-label="Send reschedule request"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1A1917] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F5F2EA] dark:text-[#1A1917]"
          >
            {phase ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Re-plan
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIPlannerWorkspace;
