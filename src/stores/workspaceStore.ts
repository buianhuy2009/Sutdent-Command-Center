import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WorkspaceId } from '../types';

export interface WorkspaceSlice {
  activeWorkspace: WorkspaceId;
  recentTabs: string[];
  setWorkspace: (id: WorkspaceId) => void;
  pushRecentTab: (id: string) => void;
}

export interface PinnedAppsSlice {
  pinnedAppIds: string[];
  pinApp: (id: string) => void;
  unpinApp: (id: string) => void;
  setPinned: (ids: string[]) => void;
}

export interface UISlice {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceSlice>()(
  persist(
    (set, get) => ({
      activeWorkspace: (localStorage.getItem('scc_active_workspace_v1') as WorkspaceId) || 'dashboard',
      recentTabs: (() => { try { const raw = localStorage.getItem('scc_recent_tabs_v1'); return raw ? JSON.parse(raw) : []; } catch { return []; } })(),
      setWorkspace: (id: WorkspaceId) => {
        try { localStorage.setItem('scc_active_workspace_v1', id); } catch {}
        set({ activeWorkspace: id });
        // also push recent
        const cur = get().recentTabs || [];
        const next = [id, ...cur.filter((x) => x !== id)].slice(0, 10);
        try { localStorage.setItem('scc_recent_tabs_v1', JSON.stringify(next)); } catch {}
        set({ recentTabs: next });
      },
      pushRecentTab: (id: string) => {
        const cur = get().recentTabs || [];
        const next = [id, ...cur.filter((x) => x !== id)].slice(0, 10);
        try { localStorage.setItem('scc_recent_tabs_v1', JSON.stringify(next)); } catch {}
        set({ recentTabs: next });
      },
    }),
    { name: 'scc_workspace_store', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ activeWorkspace: s.activeWorkspace, recentTabs: s.recentTabs }) }
  )
);

export const usePinnedAppsStore = create<PinnedAppsSlice>()(
  persist(
    (set, get) => ({
      pinnedAppIds: (() => { try { const s = localStorage.getItem('scc_pinned_apps_v2'); return s ? JSON.parse(s) : ['canvas','radar','tracker','gmail','drive']; } catch { return ['canvas','radar','tracker','gmail','drive']; } })(),
      pinApp: (id: string) => {
        const cur = get().pinnedAppIds;
        if (cur.includes(id)) return;
        const next = [...cur, id];
        try { localStorage.setItem('scc_pinned_apps_v2', JSON.stringify(next)); } catch {}
        set({ pinnedAppIds: next });
      },
      unpinApp: (id: string) => {
        const next = get().pinnedAppIds.filter(x => x !== id);
        try { localStorage.setItem('scc_pinned_apps_v2', JSON.stringify(next)); } catch {}
        set({ pinnedAppIds: next });
      },
      setPinned: (ids: string[]) => {
        try { localStorage.setItem('scc_pinned_apps_v2', JSON.stringify(ids)); } catch {}
        set({ pinnedAppIds: ids });
      },
    }),
    // single source of truth: scc_pinned_apps_v2 via localStorage, no duplicate persist key
    { name: 'scc_pinned_apps_v2', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ pinnedAppIds: s.pinnedAppIds }) }
  )
);

export const useUIStore = create<UISlice>()(
  persist(
    (set, get) => ({
      isSidebarExpanded: (() => { try { const s = localStorage.getItem('scc_sidebar_expanded'); return s !== null ? s === 'true' : true; } catch { return true; } })(),
      toggleSidebar: () => {
        const next = !get().isSidebarExpanded;
        try { localStorage.setItem('scc_sidebar_expanded', String(next)); } catch {}
        set({ isSidebarExpanded: next });
      },
      setSidebar: (v: boolean) => {
        try { localStorage.setItem('scc_sidebar_expanded', String(v)); } catch {}
        set({ isSidebarExpanded: v });
      },
    }),
    { name: 'scc_ui_store', storage: createJSONStorage(() => localStorage) }
  )
);
