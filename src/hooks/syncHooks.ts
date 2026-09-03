import { useEffect } from 'react';

/** Extracted sync hooks (App.tsx slim-down): one hook per provider. */

export function useCalendarSync(opts: { enabled: boolean; onEvents: (events: any[]) => void }) {
  useEffect(() => {
    if (!opts.enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../services/googleWorkspace');
        const events = await (mod as any).fetchTodayCalendarEvents?.().catch(() => []);
        if (!cancelled && events) opts.onEvents(events);
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);
}

export function useGmailSync(opts: { enabled: boolean; onEmails: (emails: any[]) => void }) {
  useEffect(() => {
    if (!opts.enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../services/googleWorkspace');
        const emails = await (mod as any).fetchAcademicEmails?.({ maxResults: 25 }).catch(() => []);
        if (!cancelled && emails) opts.onEmails(emails);
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);
}

export function useCanvasSync(opts: { enabled: boolean; feedUrl?: string; onAssignments: (a: any[]) => void }) {
  useEffect(() => {
    if (!opts.enabled || !opts.feedUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../services/canvas');
        const list = await (mod as any).fetchCanvasAssignmentsFromFeed?.(opts.feedUrl).catch(() => []);
        if (!cancelled && list) opts.onAssignments(list);
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.feedUrl]);
}

export function useDriveSync(opts: { enabled: boolean; onFiles: (f: any[]) => void }) {
  useEffect(() => {
    if (!opts.enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../services/googleWorkspace');
        const files = await (mod as any).fetchRecentSchoolFiles?.().catch(() => []);
        if (!cancelled && files) opts.onFiles(files);
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);
}

/** Background-sync queue flush: processes scc-queue-sync tag work when back online. */
export async function flushOfflineQueue(process: (item: any) => Promise<void>): Promise<number> {
  try {
    const { db } = await import('../services/db');
    const queued = await db.assignmentsQueue.toArray().catch(() => []);
    let done = 0;
    for (const q of queued as any[]) {
      try { await process(q); await db.assignmentsQueue.delete(q.id).catch(() => {}); done++; }
      catch { /* keep for next retry with backoff */ }
    }
    return done;
  } catch { return 0; }
}
