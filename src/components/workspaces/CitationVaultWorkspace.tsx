import React, { useState } from 'react';
import { BookMarked, Search, Copy, Check } from 'lucide-react';
import { generateCitations, AcademicCitationResult } from '../../services/gemini';
import { saveBibliographyEntry, loadBibliography } from '../../services/bibliography';

export const CitationVaultWorkspace: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AcademicCitationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const vault = loadBibliography();
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await generateCitations(query);
      setResult(res);
      saveBibliographyEntry({ id: Date.now().toString(), title: res.title, authors: res.authors, year: res.year, apa: res.apa, mla: res.mla, chicago: res.chicago, bibtex: res.bibtex, source: query, createdAt: new Date().toISOString() });
    } finally { setLoading(false); }
  };
  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(''),1500); };
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><BookMarked className="w-5 h-5 text-[#D97757]" /> Citation Vault — Zotero-style</h2>
        <p className="text-xs text-[#6B6860] mt-1">Search a book, article, or topic → get APA / MLA / Chicago / BibTeX + save to vault.</p>
        <div className="mt-4 flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} placeholder="e.g. To Kill a Mockingbird Harper Lee or Quantum Entanglement" className="flex-1 px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
          <button onClick={handleSearch} disabled={loading} className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1">{loading?'Searching...':<><Search className="w-3.5 h-3.5" /> Generate</>}</button>
        </div>
      </div>
      {result && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 space-y-3">
          <h3 className="font-bold">{result.title} <span className="text-xs text-[#6B6860]">— {result.authors} ({result.year})</span></h3>
          {([{label:'APA 7th', text: result.apa, key:'apa'}, {label:'MLA 9th', text: result.mla, key:'mla'}, {label:'Chicago 17th', text: result.chicago, key:'chi'}, {label:'BibTeX', text: result.bibtex, key:'bib'}] as const).map(f=>(
            <div key={f.key} className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold">{f.label}</span><button onClick={()=>copy(f.text, f.key)} className="px-2 py-1 text-xs bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg flex items-center gap-1">{copied===f.key?<><Check className="w-3 h-3 text-emerald-600" /> Copied</>:<><Copy className="w-3 h-3" /> Copy</>}</button></div>
              <pre className="text-xs whitespace-pre-wrap break-words font-mono text-[#141413] dark:text-[#FAF9F5]">{f.text}</pre>
            </div>
          ))}
          <p className="text-[11px] text-[#6B6860]">In-text: {result.inText} — verify against Purdue OWL for edge cases.</p>
        </div>
      )}
      {vault.length>0 && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6860]">Vault ({vault.length})</h4>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {vault.slice(0,20).map(v=>(
              <div key={v.id} className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-xs">
                <div className="font-bold truncate">{v.title}</div><div className="text-[11px] text-[#6B6860] truncate">{v.apa.slice(0,120)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
