/**
 * Tiny local RAG vault — keyword BM25-lite fallback (no API key needed).
 * Chunks notes/briefs into ~500-char windows with 100-char overlap,
 * retrieves top-3 chunks for a query, shows file name + snippet as Sources.
 * No data leaves the browser; Gemini calls (if any) use truncated snippets.
 */

export interface VaultDoc { id: string; title: string; content: string; subject?: string }
export interface VaultChunk { docId: string; title: string; snippet: string; score: number }
export interface VaultStats { docs: number; chunks: number; updatedAt: string }

const STATS_KEY = 'scc_vault_stats_v1';

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
}

export function chunkText(content: string, size = 500, overlap = 100): string[] {
  if (!content) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < content.length) {
    chunks.push(content.slice(i, i + size));
    if (i + size >= content.length) break;
    i += size - overlap;
  }
  return chunks;
}

/** Score chunks by query-term overlap (BM25-lite). Pure — exported for Vitest. */
export function scoreChunks(query: string, chunks: { docId: string; title: string; snippet: string }[]): VaultChunk[] {
  const qTerms = new Set(tokenize(query));
  if (qTerms.size === 0) return [];
  return chunks
    .map(c => {
      const cTerms = tokenize(c.snippet);
      const cSet = new Set(cTerms);
      let hits = 0;
      qTerms.forEach(t => { if (cSet.has(t)) hits++; });
      const score = hits / Math.max(1, qTerms.size);
      return { ...c, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function buildVaultIndex(docs: VaultDoc[]): { docId: string; title: string; snippet: string }[] {
  const out: { docId: string; title: string; snippet: string }[] = [];
  for (const d of docs) {
    for (const snippet of chunkText(d.content || '')) {
      out.push({ docId: d.id, title: d.title, snippet: snippet.slice(0, 300) });
    }
  }
  return out;
}

export async function loadVaultDocs(): Promise<VaultDoc[]> {
  const docs: VaultDoc[] = [];
  try {
    const raw = localStorage.getItem('scc_markdown_notes_v1');
    if (raw) {
      const notes = JSON.parse(raw);
      if (Array.isArray(notes)) {
        for (const n of notes.slice(0, 60)) {
          docs.push({ id: String(n.id || n.title), title: String(n.title || 'Untitled note'), content: String(n.content || ''), subject: n.subject });
        }
      }
    }
  } catch {}
  try {
    const { db } = await import('./db');
    const briefs = await (db as any).table?.('briefs')?.toArray?.().catch(() => []);
    if (Array.isArray(briefs)) {
      for (const b of briefs.slice(0, 30)) {
        docs.push({ id: String(b.id), title: String(b.topic || b.id), content: String(b.brief || '') });
      }
    }
  } catch {}
  return docs.filter(d => d.content && d.content.trim().length > 0);
}

export async function queryVault(query: string): Promise<VaultChunk[]> {
  const docs = await loadVaultDocs();
  const index = buildVaultIndex(docs);
  const stats: VaultStats = { docs: docs.length, chunks: index.length, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
  return scoreChunks(query, index);
}

export function getVaultStats(): VaultStats | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
