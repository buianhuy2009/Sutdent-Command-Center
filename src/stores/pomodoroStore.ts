import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PomodoroState {
  sprintGoal: number;
  completedSessions: number;
  setSprintGoal: (n: number) => void;
  incrementCompleted: () => void;
  setCompleted: (n: number) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      sprintGoal: (() => { try { const v = localStorage.getItem('scc_user_sprint_goal'); return v ? parseInt(v,10) : 4; } catch { return 4; } })(),
      completedSessions: (() => { try { const v = localStorage.getItem('scc_pomo_completed_v1'); return v ? parseInt(v,10) : 0; } catch { return 0; } })(),
      setSprintGoal: (n) => {
        const next = Math.max(1, Math.min(10, n));
        try { localStorage.setItem('scc_user_sprint_goal', String(next)); } catch {}
        set({ sprintGoal: next });
      },
      incrementCompleted: () => {
        const next = get().completedSessions + 1;
        try { localStorage.setItem('scc_pomo_completed_v1', String(next)); } catch {}
        try {
          const today=new Date().toISOString().slice(0,10);
          const raw=localStorage.getItem('scc_focus_sessions_log');
          const log: {date:string, minutes:number}[] = raw? JSON.parse(raw):[];
          log.push({date: today, minutes: 25});
          localStorage.setItem('scc_focus_sessions_log', JSON.stringify(log));
          // also maintain scc_streak_history for compatibility
          const shRaw=localStorage.getItem('scc_streak_history');
          const sh: Record<string,number>=shRaw? JSON.parse(shRaw):{};
          sh[today]=(sh[today]||0)+1;
          localStorage.setItem('scc_streak_history', JSON.stringify(sh));
        } catch {}
        try { new BroadcastChannel('scc-pomo').postMessage({ type: 'increment', value: next }); } catch {}
        set({ completedSessions: next });
      },
      setCompleted: (n) => {
        try { localStorage.setItem('scc_pomo_completed_v1', String(n)); } catch {}
        set({ completedSessions: n });
      },
    }),
    { name: 'scc_pomo_store', storage: createJSONStorage(()=>localStorage) }
  )
);

// Sync across tabs via BroadcastChannel & storage
if (typeof window !== 'undefined') {
  try {
    const bc = new BroadcastChannel('scc-pomo');
    bc.addEventListener('message', () => {
      try { const v = localStorage.getItem('scc_pomo_completed_v1'); const n = v ? parseInt(v,10) : 0; usePomodoroStore.setState({ completedSessions: n }); } catch {}
    });
  } catch {}
  window.addEventListener('storage', (e) => {
    if (e.key === 'scc_pomo_completed_v1') {
      try { const n = e.newValue ? parseInt(e.newValue,10) : 0; usePomodoroStore.setState({ completedSessions: n }); } catch {}
    }
  });
  window.addEventListener('focus', () => {
    try { const v = localStorage.getItem('scc_pomo_completed_v1'); const n = v ? parseInt(v,10) : 0; usePomodoroStore.setState({ completedSessions: n }); } catch {}
  });
}
