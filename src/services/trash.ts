import { db } from '../services/db';

/** Every delete goes to 30-day trash. Restore or purge from Settings → Trash. */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function moveToTrash(kind: string, label: string, data: any): Promise<string> {
  const now = new Date();
  const id = `trash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db.trash.put({
    id, kind, label, data,
    deletedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
  }).catch(() => {});
  return id;
}

export async function listTrash(): Promise<any[]> {
  try { return await db.trash.orderBy('deletedAt').reverse().toArray(); }
  catch { return []; }
}

export async function restoreFromTrash(id: string): Promise<any | null> {
  try {
    const item = await db.trash.get(id);
    if (!item) return null;
    await db.trash.delete(id).catch(() => {});
    return item;
  } catch { return null; }
}

export async function purgeExpiredTrash(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const expired = await db.trash.where('expiresAt').below(now).toArray();
    await Promise.all(expired.map((e) => db.trash.delete(e.id).catch(() => {})));
    return expired.length;
  } catch { return 0; }
}

export async function emptyTrash(): Promise<void> {
  try { await db.trash.clear(); } catch {}
}

/** Append a version snapshot to a Markdown note (keep last 20). */
export function withNoteSnapshot(note: any, label?: string): any {
  const history = Array.isArray(note.history) ? [...note.history] : [];
  history.push({ content: note.content, savedAt: new Date().toISOString(), label });
  return { ...note, history: history.slice(-20), updatedAt: new Date().toISOString() };
}
