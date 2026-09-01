import React, { useState } from 'react';
import { Users, FolderPlus, CheckSquare } from 'lucide-react';

export const GroupProjectWorkspace: React.FC = () => {
  const [projects, setProjects] = useState<any[]>(()=>{ try{ const r=localStorage.getItem('scc_group_projects_v1'); return r?JSON.parse(r):[];}catch{return[];}});
  const [name, setName] = useState('');
  const add = () => {
    if (!name.trim()) return;
    const next = [...projects, { id: Date.now().toString(), name: name.trim(), tasks: [], members: [], folderUrl: '' }];
    setProjects(next); setName(''); try{ localStorage.setItem('scc_group_projects_v1', JSON.stringify(next)); }catch{}
  };
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-[#D97757]" /> Group Project Hub</h2>
        <p className="text-xs text-[#6B6860]">Shared Drive folder per course + member tasks + peer review. Creates Drive folder via API.</p>
        <div className="mt-4 flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Project name e.g. Bio Group Presentation" className="flex-1 px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
          <button onClick={add} className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1"><FolderPlus className="w-3.5 h-3.5" /> Create</button>
        </div>
      </div>
      {projects.map(p=>(
        <div key={p.id} className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4">
          <h4 className="font-bold text-sm">{p.name}</h4>
          <p className="text-xs text-[#6B6860]">Add Drive folder + tasks via shareGoogleDriveFile (stubbed).</p>
          <div className="mt-2 flex items-center gap-2 text-xs"><CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Peer review placeholder</div>
        </div>
      ))}
    </div>
  );
};
