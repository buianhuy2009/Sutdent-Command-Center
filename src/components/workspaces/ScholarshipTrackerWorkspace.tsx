import React, { useState } from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';

type Stage = 'Not Started' | 'Applied' | 'Interview' | 'Offer';
const STAGES: Stage[] = ['Not Started','Applied','Interview','Offer'];
type Item = { id: string; title: string; stage: Stage; deadline?: string };
const fmtDue = (d: string) => { try { const [y,m,dd]=d.split('-').map(Number); if(!y||!m||!dd) return d; return new Date(y,m-1,dd).toLocaleDateString(undefined,{month:'short',day:'numeric'}); } catch { return d; } };
const dayDiff = (d: string): number | null => {
  try {
    const [y, m, dd] = d.split('-').map(Number);
    if (!y || !m || !dd) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const due = new Date(y, m - 1, dd); due.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - now.getTime()) / 86400000);
  } catch { return null; }
};

export const ScholarshipTrackerWorkspace: React.FC = () => {
  const [items, setItems] = useState<Item[]>(() => { try{ const r=localStorage.getItem('scc_scholarship_v1'); return r?JSON.parse(r):[];}catch{return[];}});
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const add = () => {
    if (!title.trim()) return;
    const next = [...items, { id: Date.now().toString(), title: title.trim(), stage: 'Not Started' as Stage, ...(deadline ? { deadline } : {}) }];
    setItems(next); setTitle(''); setDeadline(''); try{ localStorage.setItem('scc_scholarship_v1', JSON.stringify(next));}catch{}
  };
  const move = (id: string, stage: Stage) => {
    const next = items.map(i=> i.id===id? {...i, stage}: i);
    setItems(next); try{ localStorage.setItem('scc_scholarship_v1', JSON.stringify(next));}catch{}
  };
  const remove = (id: string) => {
    const next = items.filter(i=>i.id!==id);
    setItems(next); try{ localStorage.setItem('scc_scholarship_v1', JSON.stringify(next));}catch{}
  };
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#D97757]" /> Scholarship / Internship Tracker</h2>
          <p className="text-xs text-[#6B6860]">Kanban: Not Started → Applied → Interview → Offer</p>
        </div>
        <div className="flex gap-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add opportunity..." className="px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl w-48" />
          <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} aria-label="Deadline" className="px-2 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl w-32" />
          <button onClick={add} className="px-3 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map(stage=>(
          <div key={stage} className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 min-h-[300px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6860] pb-2 border-b border-[#DFDACB]/40">{stage} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[10px]">{items.filter(i=>i.stage===stage).length}</span></h4>
            <div className="mt-3 space-y-2">
              {items.filter(i=>i.stage===stage).map(i=>{
                const diff = i.deadline ? dayDiff(i.deadline) : null;
                const tint = diff !== null && diff < 0
                  ? 'bg-rose-50/60 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                  : diff === 0
                    ? 'bg-amber-50/60 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                    : diff === 1
                      ? 'bg-blue-50/60 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27]';
                return (
                <div key={i.id} className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${tint}`}>
                  <div className="font-bold truncate">{i.title}</div>
                  {i.deadline && (
                    <div className="text-[10px] text-[#6B6860] flex items-center gap-1.5 flex-wrap">
                      <span>Due {fmtDue(i.deadline)}</span>
                      {diff !== null && diff < 0 && <span className="px-1.5 py-px rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">Overdue</span>}
                      {diff === 0 && <span className="px-1.5 py-px rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Due today</span>}
                      {diff === 1 && <span className="px-1.5 py-px rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">Due tomorrow</span>}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {STAGES.map(s=> s!==stage && <button key={s} onClick={()=>move(i.id,s)} className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg hover:border-[#D97757]">{s}</button>)}
                    <button onClick={()=>remove(i.id)} className="ml-auto p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                );
              })}
              {items.filter(i=>i.stage===stage).length===0 && <p className="text-[11px] text-[#6B6860] italic py-4 text-center">No items</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
