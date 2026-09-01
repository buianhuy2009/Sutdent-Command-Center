import React, { useMemo } from 'react';
import { Keyboard, X } from 'lucide-react';
import { APP_CATALOG } from './AppStoreModal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const dynamicAppShortcuts = useMemo(() => {
    return APP_CATALOG.slice(0, 12).map((app, idx) => ({
      key: idx < 5 ? `${idx+1}` : `g ${app.id.slice(0,2)}`,
      description: `Open ${app.name} (${app.category})`,
    }));
  }, []);

  const shortcuts = [
    { key: '⌘ + K / Ctrl + K', description: 'Open Quick Command Palette & Search' },
    { key: '1', description: 'Switch to Canvas LMS Hub (Prioritized)' },
    { key: '2', description: 'Switch to Daily Schedule' },
    { key: '3', description: 'Switch to Assignment Tracker' },
    { key: '4', description: 'Switch to Gmail AI Scanner' },
    { key: '5', description: 'Switch to Google Drive' },
    ...dynamicAppShortcuts.slice(5, 8),
    { key: 'R', description: 'Sync & Refresh all Workspace Data' },
    { key: 'D', description: 'Toggle Dark / Light Mode' },
    { key: 'A', description: 'Toggle AI Study Coach Slide-over' },
    { key: '?', description: 'Show this Keyboard Shortcuts cheat-sheet (global ?)' },
    { key: 'Esc', description: 'Close active modal or drawer' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      id="shortcuts-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up your workflow with hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {sc.description}
              </span>
              <kbd className="px-2 py-1 font-mono text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-200 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
