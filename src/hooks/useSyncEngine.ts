import { useCallback, useEffect, useRef } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';

interface SyncEngineOptions {
  runFullSync: (isSilent?: boolean, signal?: AbortSignal) => Promise<void>;
}

export function useSyncEngine({ runFullSync }: SyncEngineOptions) {
  const isSyncingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedSync = useDebouncedCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try { await runFullSync(true, ctrl.signal); } finally { isSyncingRef.current = false; }
  }, 800);

  useEffect(() => {
    // initial sync
    debouncedSync();
    const interval = window.setInterval(() => debouncedSync(), 60000); // 60s instead of 45s to reduce thrash
    const onVis = () => { if (document.visibilityState === 'visible') debouncedSync(); };
    const onFocus = () => debouncedSync();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onFocus); abortRef.current?.abort(); };
  }, [debouncedSync]);

  return { isSyncingRef, debouncedSync, abortRef };
}
