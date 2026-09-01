import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export const OnboardingChecklist: React.FC<{ onConnectCanvas: ()=>void; onConnectGoogle: ()=>void; onCreateTask: ()=>void; onStartPomodoro: ()=>void }> = ({ onConnectCanvas, onConnectGoogle, onCreateTask, onStartPomodoro }) => {
  const [checks, setChecks] = useState(() => {
    try { const raw = localStorage.getItem('scc_onboarding_checks_v1'); return raw ? JSON.parse(raw) : { canvas:false, google:false, task:false, pomodoro:false }; } catch { return { canvas:false, google:false, task:false, pomodoro:false }; }
  });
  const save = (next: any) => { setChecks(next); try { localStorage.setItem('scc_onboarding_checks_v1', JSON.stringify(next)); } catch {} };
  // auto-detect
  useEffect(()=>{
    const hasCanvas = Boolean(localStorage.getItem('scc_canvas_settings_v1'));
    const hasGoogle = Boolean(localStorage.getItem('google_access_token') || localStorage.getItem('scc_gemini_api_key'));
    const hasTask = (()=>{ try{ const r=localStorage.getItem('scc_user_assignments_v2'); return r && JSON.parse(r).length>0; } catch{return false; }})();
    const hasPomo = (()=>{ try{ return Boolean(localStorage.getItem('scc_pomo_completed_v1')); } catch{return false; }})();
    const next = { canvas: hasCanvas||checks.canvas, google: hasGoogle||checks.google, task: hasTask||checks.task, pomodoro: hasPomo||checks.pomodoro };
    if (JSON.stringify(next)!==JSON.stringify(checks)) save(next);
  }, []);
  const progress = Object.values(checks).filter(Boolean).length;
  if (progress===4) return null;
  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider">Onboarding Checklist</h4>
        <span className="text-[11px] font-mono text-[#6B6860]">{progress}/4 completed</span>
      </div>
      <div className="h-1.5 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden"><div className="h-full bg-[#D97757]" style={{width: `${(progress/4)*100}%`}} /></div>
      <div className="space-y-2">
        {([
          { key:'canvas', label:'Connect Canvas', done: checks.canvas, action: onConnectCanvas },
          { key:'google', label:'Connect Google Workspace', done: checks.google, action: onConnectGoogle },
          { key:'task', label:'Create 1 task', done: checks.task, action: onCreateTask },
          { key:'pomodoro', label:'Start Pomodoro', done: checks.pomodoro, action: onStartPomodoro },
        ] as const).map(item=>(
          <button key={item.key} onClick={()=>{ if (!item.done) item.action(); }} className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold text-left ${item.done ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>
            <span className="flex items-center gap-2">{item.done? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-[#6B6860]" />} {item.label}</span>
            {!item.done && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
};
