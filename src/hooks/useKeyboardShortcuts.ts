import { useEffect } from 'react';

/**
 * Keyboard-first: core shortcuts ON by default (g then c, g then t, c, /, cmd+k).
 * `?` opens the overlay like Gmail/Linear. j/k move in lists.
 */
export interface ShortcutHandlers {
  onGoCanvas: () => void;
  onGoTracker: () => void;
  onCreate: () => void;
  onSearch: () => void;
  onPalette: () => void;
  onHelp: () => void;
  onMove?: (dir: 1 | -1) => void;
}

export const DEFAULT_SHORTCUTS = [
  { keys: 'g then c', action: 'Go to Canvas' },
  { keys: 'g then t', action: 'Go to Tracker' },
  { keys: 'c', action: 'Create task / note' },
  { keys: '/', action: 'Focus search' },
  { keys: '⌘/Ctrl K', action: 'Command palette' },
  { keys: 'j / k', action: 'Move in lists' },
  { keys: '?', action: 'This shortcut help' },
];

export function useKeyboardShortcuts(h: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let pendingG = false;
    let gTimer = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); h.onPalette(); return; }
      if (typing) { if (e.key === 'Escape') (target as HTMLElement).blur(); return; }
      if (e.key === '?') { h.onHelp(); return; }
      if (e.key === '/') { e.preventDefault(); h.onSearch(); return; }
      if (e.key === 'c' && !pendingG) { h.onCreate(); return; }
      if (e.key === 'j') { h.onMove?.(1); return; }
      if (e.key === 'k') { h.onMove?.(-1); return; }
      if (e.key.toLowerCase() === 'g') {
        pendingG = true;
        window.clearTimeout(gTimer);
        gTimer = window.setTimeout(() => { pendingG = false; }, 800);
        return;
      }
      if (pendingG) {
        pendingG = false;
        if (e.key.toLowerCase() === 'c') h.onGoCanvas();
        if (e.key.toLowerCase() === 't') h.onGoTracker();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, h]);
}
