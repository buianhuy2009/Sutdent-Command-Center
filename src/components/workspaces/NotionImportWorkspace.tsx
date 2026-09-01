import React, { useState } from 'react';
import { FileText, Upload, Download } from 'lucide-react';
import { db } from '../../services/db';

export const NotionImportWorkspace: React.FC = () => {
  const [count, setCount] = useState(0);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let imported = 0;
    for (const file of Array.from(files)) {
      const text = await file.text();
      const title = file.name.replace(/\.md$/, '');
      const note = { id: `note-${Date.now()}-${imported}`, title, subject: 'Imported', content: text, updatedAt: new Date().toLocaleDateString() };
      try {
        const raw = localStorage.getItem('scc_markdown_notes_v1');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(note);
        localStorage.setItem('scc_markdown_notes_v1', JSON.stringify(arr));
        await db.notes.put(note as any).catch(()=>{});
        imported++;
      } catch {}
    }
    setCount(imported);
  };
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-[#D97757]" /> Notion Import — Bulk Markdown Notes</h2>
        <p className="text-xs text-[#6B6860]">Import your Notion export (Markdown .md or .zip unpacked). Creates MarkdownNote entries with subject grouping.</p>
        <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> Choose .md files
          <input type="file" accept=".md" multiple className="hidden" onChange={handleFiles} />
        </label>
        {count>0 && <p className="text-xs text-emerald-600 mt-2">Imported {count} notes → Document Hub / Markdown Notes</p>}
        <p className="text-[11px] text-[#6B6860] mt-2">Tip: Export Notion as Markdown & CSV, unzip, select all .md files at once.</p>
      </div>
    </div>
  );
};
