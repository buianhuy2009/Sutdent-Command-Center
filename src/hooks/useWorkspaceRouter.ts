import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceId } from '../types';

// Lightweight router using ?w= query + localStorage, prepares for wouter migration
export function useWorkspaceRouter(defaultWs: WorkspaceId = 'dashboard') {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(() => {
    try {
      const url = new URL(window.location.href);
      const w = url.searchParams.get('w') as WorkspaceId | null;
      if (w) return w;
      const saved = localStorage.getItem('scc_active_workspace_v1') as WorkspaceId | null;
      return saved || defaultWs;
    } catch { return defaultWs; }
  });

  const navigate = useCallback((ws: WorkspaceId) => {
    const doSet = () => setActiveWorkspace(ws);
    // @ts-ignore viewTransition
    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      (document as any).startViewTransition(doSet);
    } else doSet();
    try { localStorage.setItem('scc_active_workspace_v1', ws); } catch {}
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('w', ws);
      window.history.pushState({}, '', url.toString());
    } catch {}
  }, []);

  useEffect(() => {
    const onPop = () => {
      try { const w = new URL(window.location.href).searchParams.get('w') as WorkspaceId | null; if (w) setActiveWorkspace(w); } catch {}
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { activeWorkspace, navigate };
}
