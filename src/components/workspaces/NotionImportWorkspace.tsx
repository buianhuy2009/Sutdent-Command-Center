import React, { useState } from 'react';
import { FileText, Upload, Archive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';
import { t, useLang } from '../../services/i18n';

const NOTES_KEY = 'scc_markdown_notes_v1';

type ImportResult = {
  name: string;
  status: 'imported' | 'skipped' | 'error';
  detail: string;
};

function cleanTitle(path: string, fallback: string): string {
  const base = path.split('/').pop()?.split('\\').pop() ?? fallback;
  const withoutExt = base.replace(/\.(md|markdown|txt|csv|zip)$/i, '');
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 80);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { pushField(); }
      else if (c === '\n') { pushField(); pushRow(); }
      else if (c === '\r') { /* skip, \n handles it */ }
      else { field += c; }
    }
  }
  pushField();
  pushRow();
  // Drop a single trailing empty row from final newline
  if (rows.length > 0 && rows[rows.length - 1].every((c) => c.trim() === '')) rows.pop();
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function escapeCell(cell: string): string {
  return cell.replace(/\|/g, '\\|').replace(/\n/g, '<br/>').trim();
}

function csvToMarkdown(csvText: string, sourceLabel: string): string {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return `# ${sourceLabel}\n\n_Empty CSV — no rows found._`;
  const MAX_ROWS = 500;
  const truncated = rows.length > MAX_ROWS;
  const kept = truncated ? rows.slice(0, MAX_ROWS) : rows;
  const colCount = Math.max(...kept.map((r) => r.length));
  const norm = kept.map((r) => {
    const copy = [...r];
    while (copy.length < colCount) copy.push('');
    return copy.map(escapeCell);
  });
  const header = norm[0];
  const body = norm.slice(1);
  const lines = [
    `# ${sourceLabel}`,
    '',
    `_Imported from CSV (${rows.length} row${rows.length === 1 ? '' : 's'}${truncated ? `, showing first ${MAX_ROWS}` : ''})._`,
    '',
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ];
  if (truncated) lines.push('', `_Truncated: only the first ${MAX_ROWS} rows were imported to keep the note fast._`);
  return lines.join('\n');
}

function saveNote(title: string, content: string, subject: string) {
  const note = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    subject,
    content,
    updatedAt: new Date().toLocaleDateString(),
  };
  const raw = localStorage.getItem(NOTES_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(arr)) throw new Error('Notes storage is corrupted (expected a list). Clear Markdown Notes and retry.');
  arr.unshift(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(arr));
  void db.notes.put(note as never).catch(() => {});
}

export const NotionImportWorkspace: React.FC = () => {
  useLang();
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const push = (all: ImportResult[], r: ImportResult) => { all.push(r); };

  const importZip = async (file: File, all: ImportResult[]) => {
    let zip: { files: Record<string, { dir: boolean; name: string; async: (t: 'string') => Promise<string> }> };
    try {
      // jszip is lazy-loaded so the main bundle stays lean; it uses `export =`,
      // so support both default and namespace shapes.
      const mod = (await import('jszip')) as unknown as { default?: unknown };
      const ctor = ((mod as { default?: unknown }).default ?? mod) as {
        loadAsync: (f: File) => Promise<{ files: Record<string, { dir: boolean; name: string; async: (t: 'string') => Promise<string> }> }>;
      };
      zip = await ctor.loadAsync(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const looksLikeLoadFailure = /load|open|zip|corrupt|invalid/i.test(msg);
      push(all, {
        name: file.name,
        status: 'error',
        detail: looksLikeLoadFailure
          ? `Could not open this zip (${msg}). It may be corrupted — try re-exporting from Notion.`
          : `Could not load the zip reader (${msg}). Check your connection and retry — nothing was imported from this file.`,
      });
      return;
    }
    const entries = Object.values(zip.files);
    const candidates = entries.filter((e) => !e.dir && /\.(md|markdown|txt|csv)$/i.test(e.name) && !/(^|\/)__MACOSX\//.test(e.name) && !/\.DS_Store$/.test(e.name));
    const ignored = entries.filter((e) => !candidates.includes(e) && !e.dir).length;
    if (candidates.length === 0) {
      push(all, {
        name: file.name,
        status: 'error',
        detail: `No .md or .csv found inside this zip${ignored > 0 ? ` (${ignored} other file${ignored === 1 ? '' : 's'} like images/PDFs were skipped — only .md/.csv import)` : ''}. Export from Notion as Markdown & CSV and retry.`,
      });
      return;
    }
    let ok = 0;
    for (const entry of candidates) {
      try {
        const text = await entry.async('string');
        if (!text.trim()) {
          push(all, { name: `${file.name} → ${entry.name}`, status: 'skipped', detail: 'Empty file — nothing to import.' });
          continue;
        }
        const isCsv = /\.csv$/i.test(entry.name);
        const title = cleanTitle(entry.name, 'Untitled import');
        const content = isCsv ? csvToMarkdown(text, title) : text;
        saveNote(title, content, 'Imported');
        ok++;
        push(all, { name: `${file.name} → ${entry.name}`, status: 'imported', detail: isCsv ? 'CSV converted to a table note.' : 'Markdown imported as-is.' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        push(all, { name: `${file.name} → ${entry.name}`, status: 'error', detail: `Failed to import (${msg}).` });
      }
    }
    if (ok === 0) {
      push(all, { name: file.name, status: 'error', detail: 'Zip opened but nothing could be imported — every entry was empty or failed. See lines above.' });
    }
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setResults([]);
    setCount(0);
    const all: ImportResult[] = [];
    let imported = 0;
    try {
      for (const file of Array.from(files)) {
        const lower = file.name.toLowerCase();
        try {
          if (lower.endsWith('.zip')) {
            const before = all.length;
            await importZip(file, all);
            imported += all.slice(before).filter((r) => r.status === 'imported').length;
          } else if (/\.(md|markdown|txt)$/.test(lower)) {
            const text = await file.text();
            if (!text.trim()) {
              push(all, { name: file.name, status: 'skipped', detail: 'Empty file — nothing to import.' });
              continue;
            }
            saveNote(cleanTitle(file.name, 'Untitled import'), text, 'Imported');
            imported++;
            push(all, { name: file.name, status: 'imported', detail: 'Markdown imported as-is.' });
          } else if (lower.endsWith('.csv')) {
            const text = await file.text();
            if (!text.trim()) {
              push(all, { name: file.name, status: 'skipped', detail: 'Empty CSV — nothing to import.' });
              continue;
            }
            const title = cleanTitle(file.name, 'Untitled table');
            saveNote(title, csvToMarkdown(text, title), 'Imported');
            imported++;
            push(all, { name: file.name, status: 'imported', detail: 'CSV converted to a table note.' });
          } else {
            push(all, { name: file.name, status: 'skipped', detail: 'Unsupported type — only .md, .csv, and Notion .zip import. Other files are never silently dropped; they are listed here.' });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          push(all, { name: file.name, status: 'error', detail: `Failed (${msg}). Nothing was imported from this file.` });
        }
      }
    } finally {
      setCount(imported);
      setResults([...all]);
      setBusy(false);
      e.target.value = '';
    }
  };

  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-[#D97757]" /> {t('noti_title')}</h2>
        <p className="text-xs text-[#6B6860]">{t('noti_sub')}</p>

        <div className="mt-3 rounded-2xl border border-dashed border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F6] dark:bg-[#211F1C] p-4">
          <p className="text-xs font-bold flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> What lands where</p>
          <ul className="mt-1.5 text-[11px] leading-relaxed text-[#6B6860] list-disc pl-4 space-y-0.5">
            <li>Each <b>.md</b> becomes one note, each <b>.csv</b> becomes one table-note.</li>
            <li>Everything lands in <b>Markdown Notes</b> (the same list your other notes use) — nothing uploads, the zip is unzipped in your browser.</li>
            <li>Images, PDFs, and other files inside a zip are <b>listed as skipped</b>, never silently dropped.</li>
            <li>From Notion: Export as <b>Markdown &amp; CSV</b>, then drop the <b>.zip</b> here — or pick single .md/.csv files.</li>
          </ul>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> {busy ? 'Importing…' : t('noti_choose')}
          <input type="file" accept=".md,.markdown,.txt,.csv,.zip" multiple className="hidden" onChange={handleFiles} disabled={busy} />
        </label>
        {count>0 && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{t('noti_imported')} {count} {t('noti_notes_to')}</p>}
        {results.length > 0 && count === 0 && errors === 0 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Nothing imported — every file was skipped. See the list below for why.</p>
        )}
        {errors > 0 && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors} file{errors === 1 ? '' : 's'} had errors — nothing from {errors === 1 ? 'it' : 'them'} was imported. Details below.</p>
        )}
        {results.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden">
            <p className="px-3 py-2 text-[11px] font-bold bg-[#FAF9F6] dark:bg-[#211F1C]">Imported {count} · Skipped {skipped} · Errors {errors}</p>
            <ul className="max-h-44 overflow-auto divide-y divide-[#EFEBE0] dark:divide-[#2C2B27] bg-white dark:bg-[#1A1917]">
              {results.map((r, i) => (
                <li key={i} className="px-3 py-1.5 text-[11px] flex gap-2">
                  <span className={r.status === 'imported' ? 'text-emerald-600 font-bold' : r.status === 'skipped' ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                    {r.status === 'imported' ? '✓' : r.status === 'skipped' ? '–' : '✕'}
                  </span>
                  <span><b className="break-all">{r.name}</b> — {r.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] text-[#6B6860] mt-2">{t('noti_tip')}</p>
      </div>
    </div>
  );
};
