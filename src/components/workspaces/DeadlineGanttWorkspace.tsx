import React, { useMemo, useState } from 'react';
import { GanttChart } from 'lucide-react';
import { Assignment, CanvasAssignment } from '../../types';
import { t, useLang } from '../../services/i18n';

const DAY_MS = 86400000;

interface PreviewItem {
  key: string;
  name: string;
  course: string;
  due: string;
  dueMs: number;
  overdue: boolean;
  dueToday: boolean;
  source: string;
}

function readJsonArray(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseDayMs(value: unknown): number {
  if (typeof value !== 'string' || value.trim() === '') return NaN;
  const text = value.trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const t = new Date(text).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function toDayStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export const DeadlineGanttWorkspace: React.FC<{ assignments: Assignment[]; canvasAssignments: CanvasAssignment[] }> = ({ assignments, canvasAssignments }) => {
  useLang();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const items = useMemo<PreviewItem[]>(() => {
    const seen = new Set<string>();
    const out: PreviewItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const push = (rawName: string, rawCourse: string, rawDue: unknown, source: string, rawId: unknown) => {
      const dueMs = parseDayMs(rawDue);
      if (Number.isNaN(dueMs)) return;
      const name = rawName.trim() === '' ? 'Untitled' : rawName.trim().slice(0, 60);
      const course = rawCourse.trim() === '' ? 'General' : rawCourse.trim().slice(0, 40);
      const due = toDayStr(dueMs);
      const keyBase = typeof rawId === 'string' && rawId !== '' ? rawId : `${source}|${course}|${name}|${due}`;
      if (seen.has(keyBase)) return;
      seen.add(keyBase);
      out.push({
        key: keyBase,
        name,
        course,
        due,
        dueMs,
        overdue: dueMs < todayMs,
        dueToday: dueMs === todayMs,
        source,
      });
    };

    (Array.isArray(assignments) ? assignments : []).forEach((a) => {
      if (!a || typeof a !== 'object') return;
      if ((a as Assignment).status === 'Done') return;
      if ((a as Assignment).trashedAt) return;
      push(a.assignmentName ?? '', a.subject ?? '', (a as Assignment).dueDate, 'tracker', (a as Assignment).id);
    });
    (Array.isArray(canvasAssignments) ? canvasAssignments : []).forEach((c) => {
      if (!c || typeof c !== 'object') return;
      if ((c as CanvasAssignment).isCompleted) return;
      push(c.name ?? '', c.courseName ?? '', (c as CanvasAssignment).dueAt, 'canvas', (c as CanvasAssignment).id);
    });

    // Read-only fallback: scan the tracker + synced-assignment caches the app
    // already persists, so the preview still populates when props arrive empty.
    // Keys mirror App.tsx / dataStore.ts (tracker) and the Canvas/Classroom/Moodle panels.
    if (out.length === 0) {
      readJsonArray('scc_user_assignments_v2').forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const o = entry as Record<string, unknown>;
        if (o['status'] === 'Done') return;
        if (o['trashedAt']) return;
        push(pickStr(o, ['assignmentName', 'name', 'title']), pickStr(o, ['subject', 'course', 'courseName']), o['dueDate'] ?? o['due'] ?? o['dueAt'], 'tracker', o['id']);
      });
      (['scc_cached_canvas_assignments', 'scc_cached_classroom_assignments', 'scc_cached_moodle_assignments'] as const).forEach((storeKey) => {
        readJsonArray(storeKey).forEach((entry) => {
          if (!entry || typeof entry !== 'object') return;
          const o = entry as Record<string, unknown>;
          if (o['isCompleted'] === true) return;
          push(pickStr(o, ['name', 'title', 'assignmentName']), pickStr(o, ['courseName', 'course', 'subject']), o['dueAt'] ?? o['dueDate'] ?? o['due'], 'canvas', o['id']);
        });
      });
    }

    out.sort((x, y) => x.dueMs - y.dueMs);
    return out;
  }, [assignments, canvasAssignments]);

  const mermaidCode = useMemo(() => {
    const all = items.map(a => ({ name: a.name, due: a.due, course: a.course })).slice(0, 12);
    if (all.length===0) return 'gantt\n title No deadlines\n dateFormat YYYY-MM-DD\n section Empty\n Task : 2026-09-01, 1d';
    const todayStr = new Date().toISOString().split('T')[0];
    const normDue = (d?: string) => (d ? d.split('T')[0] : todayStr);
    const dues = all.map(a => normDue(a.due));
    const minDue = dues.reduce((m, d) => (d < m ? d : m), dues[0]);
    const maxDue = dues.reduce((m, d) => (d > m ? d : m), dues[0]);
    const showToday = todayStr >= minDue && todayStr <= maxDue;
    let code = 'gantt\n title Deadline Radar Timeline\n dateFormat YYYY-MM-DD\n';
    const byCourse: Record<string, typeof all> = {};
    all.forEach(a=> { (byCourse[a.course] ||= []).push(a); });
    Object.entries(byCourse).forEach(([course, list])=>{
      code += ` section ${course}\n`;
      list.forEach(item=>{
        const due = normDue(item.due);
        const safe = item.name.replace(/:/g,' -').slice(0,30);
        const overdue = due < todayStr;
        code += overdue ? ` ${safe} :crit, ${due}, 1d\n` : ` ${safe} : ${due}, 1d\n`;
      });
    });
    if (showToday) code += ` section Today\n Today :milestone, ${todayStr}, 0d\n`;
    return code;
  }, [items]);

  const preview = useMemo(() => {
    if (items.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    let min = items.reduce((m, i) => Math.min(m, i.dueMs), items[0].dueMs);
    let max = items.reduce((m, i) => Math.max(m, i.dueMs), items[0].dueMs);
    if (min === max) {
      min -= 3 * DAY_MS;
      max += 3 * DAY_MS;
    }
    const total = max - min + DAY_MS;
    const todayPct = todayMs >= min && todayMs <= max ? ((todayMs - min) / total) * 100 : null;
    const groups = new Map<string, PreviewItem[]>();
    items.forEach((i) => {
      const list = groups.get(i.course);
      if (list) list.push(i);
      else groups.set(i.course, [i]);
    });
    return { min, max, total, todayMs, todayPct, groups: [...groups.entries()] };
  }, [items]);

  const selected = items.find((i) => i.key === selectedKey) ?? null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {preview && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
          <h3 className="text-sm font-bold">Timeline preview</h3>
          <p className="text-xs text-[#6B6860]">{toDayStr(preview.min)} to {toDayStr(preview.max)} &middot; {items.length} dated assignment{items.length === 1 ? '' : 's'} &middot; click a bar for details</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6860]">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500" /> Overdue</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" /> Due today</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#D97757]" /> Upcoming</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-px h-3 bg-sky-500" /> Today</span>
          </div>
          <div className="mt-3 space-y-4">
            {preview.groups.map(([course, list]) => (
              <div key={course}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B6860] mb-1">{course}</div>
                <div className="space-y-1.5">
                  {list.map((item) => {
                    const barStart = Math.max(preview.min, item.dueMs - 6 * DAY_MS);
                    const left = ((barStart - preview.min) / preview.total) * 100;
                    const width = Math.max(((item.dueMs - barStart + DAY_MS) / preview.total) * 100, 3);
                    const barCls = item.overdue
                      ? 'bg-rose-500/85 hover:bg-rose-500'
                      : item.dueToday
                        ? 'bg-amber-500/90 hover:bg-amber-500'
                        : 'bg-[#D97757]/85 hover:bg-[#D97757]';
                    const isActive = item.key === selectedKey;
                    return (
                      <div key={item.key} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-center gap-2">
                        <div className="truncate text-xs font-medium" title={`${item.name} — due ${item.due}`}>{item.name}</div>
                        <div className="relative h-6 rounded-lg bg-[#F1EFE7] dark:bg-[#26251F] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedKey(isActive ? null : item.key)}
                            title={`${item.name} — due ${item.due}`}
                            aria-label={`${item.name}, due ${item.due}`}
                            className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-opacity ${barCls} ${isActive ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                          />
                          {preview.todayPct !== null && (
                            <div
                              className="pointer-events-none absolute top-0 bottom-0 w-px bg-sky-500"
                              style={{ left: `${preview.todayPct}%` }}
                              title={`Today — ${toDayStr(preview.todayMs)}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 min-h-[2.5rem] text-xs rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] px-3 py-2">
            {selected ? (
              <span><span className="font-bold">{selected.name}</span> &middot; {selected.course} &middot; due {selected.due} &middot; {selected.overdue ? 'overdue' : selected.dueToday ? 'due today' : 'upcoming'}</span>
            ) : (
              <span className="text-[#6B6860]">Hover or tap any bar to see its title and due date.</span>
            )}
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><GanttChart className="w-5 h-5 text-[#D97757]" /> {t('gantt_title')}</h2>
        <p className="text-xs text-[#6B6860]">{t('gantt_sub')}</p>
        <pre className="mt-4 p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-mono whitespace-pre-wrap overflow-x-auto">{mermaidCode}</pre>
        <button onClick={()=>navigator.clipboard.writeText(mermaidCode)} className="mt-3 px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">{t('gantt_copy')}</button>
      </div>
    </div>
  );
};
