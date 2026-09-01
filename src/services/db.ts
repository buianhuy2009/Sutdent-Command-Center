import Dexie, { type Table } from 'dexie';
import type { MarkdownNote } from '../types';
import type { SRSCard } from '../services/srsEngine';

export interface PersistedBrief { id: string; topic: string; subject: string; brief: string; createdAt: string; }

export interface QueuedAssignment { id: string; assignmentName: string; subject: string; dueDate: string; priority: string; status: string; sheetRowIndex?: number; source?: string; queuedAt?: string; }

export class StudentOSDatabase extends Dexie {
  notes!: Table<MarkdownNote, string>;
  srsCards!: Table<SRSCard & { deckId: string }, string>;
  briefs!: Table<PersistedBrief, string>;
  assignmentsQueue!: Table<QueuedAssignment, string>;

  constructor() {
    super('StudentOSDatabase');
    this.version(1).stores({
      notes: 'id, subject, title, updatedAt',
      srsCards: 'id, deckId, dueDate, easeFactor, repetitions',
      briefs: 'id, subject, topic, createdAt',
      assignmentsQueue: 'id, dueDate, status',
    });
    this.version(2).stores({
      notes: 'id, subject, title, updatedAt',
      srsCards: 'id, deckId, dueDate, easeFactor, repetitions',
      briefs: 'id, subject, topic, createdAt',
      assignmentsQueue: 'id, dueDate, status, sheetRowIndex',
      bibliography: 'id, source, year',
    });
    // @ts-ignore extra table for BIB
    (this as any).bibliography = (this as any).table('bibliography');
  }
}

export const db = new StudentOSDatabase();

// Migration helper: hydrate from localStorage once
export async function migrateLocalStorageToDexie(): Promise<void> {
  try {
    const notesRaw = localStorage.getItem('scc_markdown_notes_v1');
    if (notesRaw) {
      const notes = JSON.parse(notesRaw) as MarkdownNote[];
      if (notes.length) await db.notes.bulkPut(notes as any).catch(() => {});
    }
    const decksRaw = localStorage.getItem('scc_srs_decks_v2') || localStorage.getItem('scc_flashcard_decks_v1');
    if (decksRaw) {
      const decks = JSON.parse(decksRaw);
      const flat: any[] = [];
      for (const d of decks) {
        for (const c of (d.cards || [])) flat.push({ ...c, deckId: d.id, id: c.id || `card-${Date.now()}-${Math.random()}` });
      }
      if (flat.length) await db.srsCards.bulkPut(flat).catch(() => {});
    }
  } catch (e) { console.warn('Dexie migration skipped', e); }
}

export async function getNotesIndexedBySubject(subject: string): Promise<MarkdownNote[]> {
  return db.notes.where('subject').equals(subject).toArray() as any;
}
