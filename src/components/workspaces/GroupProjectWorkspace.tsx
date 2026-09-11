import React, { useState } from 'react';
import { Users, FolderPlus, CheckSquare } from 'lucide-react';
import { t, useLang } from '../../services/i18n';

export const GroupProjectWorkspace: React.FC = () => {
  useLang();
  const [projects, setProjects] = useState<any[]>(()=>{ try{ const r=localStorage.getItem('scc_group_projects_v1'); return r?JSON.parse(r):[];}catch{return[];}});
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const persist = (next: any[]) => { setProjects(next); try{ localStorage.setItem('scc_group_projects_v1', JSON.stringify(next)); }catch{} };
  const toTasks = (tasks: any): { id: string; text: string; done: boolean }[] => {
    if (!Array.isArray(tasks)) return [];
    const out: { id: string; text: string; done: boolean }[] = [];
    tasks.forEach((t: any, i: number) => {
      if (typeof t === 'string') { if (t.trim()) out.push({ id: `${i}-${t.length}`, text: t, done: false }); return; }
      if (t && typeof t === 'object' && typeof (t as any).text === 'string') {
        out.push({ id: String((t as any).id ?? `${i}-${(t as any).text.length}`), text: (t as any).text, done: !!(t as any).done });
      }
    });
    return out;
  };
  const addTask = (projectId: string) => {
    const text = (drafts[projectId] ?? '').trim();
    if (!text) return;
    const next = projects.map(p => p.id === projectId
      ? { ...p, tasks: [...toTasks(p.tasks), { id: Date.now().toString(), text, done: false }] }
      : p);
    persist(next);
    setDrafts(d => ({ ...d, [projectId]: '' }));
  };
  const toggleTask = (projectId: string, taskId: string) => {
    const next = projects.map(p => p.id === projectId
      ? { ...p, tasks: toTasks(p.tasks).map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
      : p);
    persist(next);
  };
  const add = () => {
    if (!name.trim()) return;
    const next = [...projects, { id: Date.now().toString(), name: name.trim(), tasks: [], members: [], folderUrl: '' }];
    setProjects(next); setName(''); try{ localStorage.setItem('scc_group_projects_v1', JSON.stringify(next)); }catch{}
  };
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-[#D97757]" /> {t('grp_title')}</h2>
        <p className="text-xs text-[#6B6860]">{t('grp_sub')}</p>
        <div className="mt-4 flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder={t('grp_name_ph')} className="flex-1 px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
          <button onClick={add} className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1"><FolderPlus className="w-3.5 h-3.5" /> {t('create')}</button>
        </div>
      </div>
      {projects.map(p=>{
        const tasks = toTasks(p.tasks);
        const done = tasks.filter(t=>t.done).length;
        return (
        <div key={p.id} className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4">
          <h4 className="font-bold text-sm flex items-center justify-between gap-2"><span>{p.name}</span><span className="text-xs font-normal text-[#6B6860]">{done}/{tasks.length} {t('done').toLowerCase()}</span></h4>
          <p className="text-xs text-[#6B6860]">{t('grp_stub_note')}</p>
          <div className="mt-3 flex gap-2">
            <input value={drafts[p.id] ?? ''} onChange={e=>setDrafts(d=>({ ...d, [p.id]: e.target.value }))} onKeyDown={e=>e.key==='Enter'&&addTask(p.id)} placeholder={t('grp_task_ph')} className="flex-1 px-3 py-1.5 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
            <button onClick={()=>addTask(p.id)} className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">{t('add')}</button>
          </div>
          <div className="mt-2 space-y-1">
            {tasks.map(t=>(
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={t.done} onChange={()=>toggleTask(p.id, t.id)} className="accent-[#D97757]" />
                <span className={t.done ? 'line-through text-[#6B6860]' : ''}>{t.text}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs"><CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> {t('grp_peer_review')}</div>
        </div>
        );
      })}
    </div>
  );
};
