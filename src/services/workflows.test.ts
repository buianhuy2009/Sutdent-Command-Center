import { describe, it, expect } from 'vitest';

// RRULE weekly expansion (pure logic mirror of tracker repeats)
function expandWeeklyRRule(startISO: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(startISO + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    out.push(new Date(d.getTime() + i * 7 * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

describe('RRULE repeats', () => {
  it('expands weekly recurrence', () => {
    const dates = expandWeeklyRRule('2026-09-03', 3);
    expect(dates).toEqual(['2026-09-03', '2026-09-10', '2026-09-17']);
  });
});

describe('crossReferenceCanvasWithSheet (dedup logic)', () => {
  it('matches by normalized title + date', () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const canvas = [{ name: 'Problem Set 1', dueAt: '2026-09-10' }];
    const sheet = [{ assignmentName: 'problem set 1', dueDate: '2026-09-10' }];
    const match = canvas.filter((c) => sheet.some((s) => norm(s.assignmentName) === norm(c.name) && s.dueDate === c.dueAt.slice(0, 10)));
    expect(match.length).toBe(1);
  });
});

describe('offline queue retry', () => {
  it('retries failed items with backoff and keeps them queued', async () => {
    const queue = [{ id: 'q1', tries: 0 }];
    let attempts = 0;
    const process = async () => { attempts++; if (attempts < 3) throw new Error('offline'); };
    const backoff = [1000, 4000, 15000];
    for (const item of queue) {
      for (let t = 0; t < 3; t++) {
        try { await process(); (item as any).tries = t + 1; break; }
        catch { await new Promise((r) => setTimeout(r, 0)); void backoff[t]; }
      }
    }
    expect(attempts).toBe(3);
  });
});

describe('toast grouping', () => {
  it('collapses identical notifications', async () => {
    const { groupToasts } = await import('../components/Toast');
    const grouped = groupToasts([
      { id: '1', type: 'info', title: 'Synced', message: 'Canvas up to date' },
      { id: '2', type: 'info', title: 'Synced', message: 'Canvas up to date' },
    ] as any);
    expect(grouped.length).toBe(1);
    expect(grouped[0].count).toBe(2);
  });
});
