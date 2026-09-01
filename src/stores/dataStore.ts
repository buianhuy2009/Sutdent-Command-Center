import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Assignment } from '../types';

interface DataSlice {
  assignments: Assignment[];
  setAssignments: (a: Assignment[]) => void;
  addAssignment: (a: Assignment) => void;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
}

export const useDataStore = create<DataSlice>()(
  persist(
    (set, get) => ({
      assignments: (() => { try { const s = localStorage.getItem('scc_user_assignments_v2'); return s ? JSON.parse(s) : []; } catch { return []; } })(),
      setAssignments: (assignments) => { try { localStorage.setItem('scc_user_assignments_v2', JSON.stringify(assignments)); } catch {} set({ assignments }); },
      addAssignment: (a) => {
        const next = [...get().assignments, a];
        try { localStorage.setItem('scc_user_assignments_v2', JSON.stringify(next)); } catch {}
        set({ assignments: next });
      },
      updateAssignment: (id, patch) => {
        const next = get().assignments.map(x => x.id === id ? { ...x, ...patch } : x);
        try { localStorage.setItem('scc_user_assignments_v2', JSON.stringify(next)); } catch {}
        set({ assignments: next });
      },
    }),
    { name: 'scc_data_store' }
  )
);
