import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import type { WorkspaceId } from '../types';

/**
 * URL-routed tabs (?w=tracker) as the single source of truth.
 * - Deep-linkable + shareable: every tab change writes ?w= to the URL
 * - Back/forward history for activeTab with scroll preserved per tab
 * - Zustand stays the store; the URL is the router
 */
const SCROLL_POS = new Map<string, number>();

export function useAppRouter(defaultTab = 'dashboard') {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const pushRecentTab = useWorkspaceStore((s) => s.pushRecentTab);
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('w') || localStorage.getItem('scc_active_tab_v1') || defaultTab;
    } catch { return defaultTab; }
  });
  const [history, setHistory] = useState<string[]>([defaultTab]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const skipPush = useRef(false);

  const navigate = useCallback((tab: string, workspace?: WorkspaceId) => {
    // preserve scroll of current tab
    try { SCROLL_POS.set(activeTab, window.scrollY); } catch {}
    const apply = () => {
      setActiveTab(tab);
      try { localStorage.setItem('scc_active_tab_v1', tab); } catch {}
      pushRecentTab(tab);
      if (workspace) setWorkspace(workspace);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('w', tab);
        window.history.pushState({ tab }, '', url.toString());
      } catch {}
      if (!skipPush.current) {
        setHistory((h) => {
          const next = [...h.slice(0, historyIdx + 1), tab].slice(-50);
          return next;
        });
        setHistoryIdx((i) => Math.min(i + 1, 49));
      }
      skipPush.current = false;
      // restore scroll for the new tab (0 if never visited)
      requestAnimationFrame(() => {
        try { window.scrollTo(0, SCROLL_POS.get(tab) ?? 0); } catch {}
      });
    };
    const doc = document as any;
    if (doc.startViewTransition && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(apply);
    else apply();
  }, [activeTab, historyIdx, pushRecentTab, setWorkspace]);

  const back = useCallback(() => {
    if (historyIdx <= 0) { window.history.back(); return; }
    skipPush.current = true;
    const prev = history[historyIdx - 1];
    setHistoryIdx(historyIdx - 1);
    navigate(prev);
    skipPush.current = true;
  }, [history, historyIdx, navigate]);

  const forward = useCallback(() => {
    if (historyIdx >= history.length - 1) { window.history.forward(); return; }
    skipPush.current = true;
    const next = history[historyIdx + 1];
    setHistoryIdx(historyIdx + 1);
    navigate(next);
    skipPush.current = true;
  }, [history, historyIdx, navigate]);

  useEffect(() => {
    const onPop = () => {
      try {
        const w = new URL(window.location.href).searchParams.get('w');
        if (w && w !== activeTab) {
          skipPush.current = true;
          setActiveTab(w);
          try { localStorage.setItem('scc_active_tab_v1', w); } catch {}
        }
      } catch {}
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [activeTab]);

  return { activeTab, navigate, back, forward, canBack: historyIdx > 0, canForward: historyIdx < history.length - 1, activeWorkspace, crumbs: history.slice(Math.max(0, historyIdx - 2), historyIdx + 1) };
}
