export interface BibEntry {
  id: string;
  type: 'article' | 'book' | 'misc';
  title: string;
  authors: string;
  year: string;
  journal?: string;
  publisher?: string;
  url?: string;
  doi?: string;
  isbn?: string;
}

const KEY = 'scc_bibliography_v1';

export function loadBibliography(): BibEntry[] {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
export function saveBibliography(list: BibEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}
export function addBibEntry(e: BibEntry) {
  const cur = loadBibliography();
  cur.unshift(e);
  saveBibliography(cur);
}
export function toBibTeX(entries: BibEntry[]): string {
  return entries.map(e=>{
    const key = e.authors.split(' ')[0]?.toLowerCase() + e.year + e.title.split(' ')[0]?.toLowerCase();
    if (e.type==='article') return `@article{${key},\n  title={${e.title}},\n  author={${e.authors}},\n  year={${e.year}},\n  journal={${e.journal||'arXiv'}},\n  url={${e.url||''}}\n}`;
    if (e.type==='book') return `@book{${key},\n  title={${e.title}},\n  author={${e.authors}},\n  year={${e.year}},\n  publisher={${e.publisher||'Open Library'}},\n  isbn={${e.isbn||''}}\n}`;
    return `@misc{${key},\n  title={${e.title}},\n  author={${e.authors}},\n  year={${e.year}},\n  url={${e.url||''}}\n}`;
  }).join('\n\n');
}
export function toAPA(e: BibEntry): string {
  return `${e.authors} (${e.year}). ${e.title}. ${e.journal||e.publisher||''}. ${e.url||''}`.trim();
}
export function toMLA(e: BibEntry): string {
  return `${e.authors}. "${e.title}." ${e.journal||e.publisher||''}, ${e.year}.`;
}
