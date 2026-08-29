import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckSquare,
  Compass,
  FileText,
  Layers,
  Sparkles,
  Send,
  Plus,
  Moon,
  Sun,
  X,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { Assignment } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenQuickDraft: () => void;
  onOpenNewAssignment: () => void;
  onToggleAiChat: () => void;
  onToggleDarkMode: () => void;
  assignments: Assignment[];
  sheetUrl?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenQuickDraft,
  onOpenNewAssignment,
  onToggleAiChat,
  onToggleDarkMode,
  assignments,
  sheetUrl,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'tab-canvas',
      title: 'Go to Canvas LMS Hub (Prioritized)',
      category: 'Navigation',
      icon: Layers,
      run: () => {
        onSelectTab('canvas');
        onClose();
      },
    },
    {
      id: 'tab-radar',
      title: 'Go to Daily Schedule & Calendar',
      category: 'Navigation',
      icon: Compass,
      run: () => {
        onSelectTab('radar');
        onClose();
      },
    },
    {
      id: 'tab-gmail',
      title: 'Go to Gmail AI Scanner (Spam & Multi-language Filter)',
      category: 'Navigation',
      icon: Mail,
      run: () => {
        onSelectTab('gmail');
        onClose();
      },
    },
    {
      id: 'tab-tracker',
      title: 'Go to Master Assignment Tracker',
      category: 'Navigation',
      icon: CheckSquare,
      run: () => {
        onSelectTab('tracker');
        onClose();
      },
    },
    {
      id: 'tab-projects',
      title: 'Go to Project Starter & Drive Files',
      category: 'Navigation',
      icon: FileText,
      run: () => {
        onSelectTab('projects');
        onClose();
      },
    },
    {
      id: 'act-new-assignment',
      title: 'Create New Assignment (Google Sheet)',
      category: 'Actions',
      icon: Plus,
      run: () => {
        onSelectTab('tracker');
        onOpenNewAssignment();
        onClose();
      },
    },
    {
      id: 'act-quick-draft',
      title: 'Quick Draft Email to Teacher (English / Tiếng Việt)',
      category: 'Actions',
      icon: Send,
      run: () => {
        onOpenQuickDraft();
        onClose();
      },
    },
    {
      id: 'act-ai-chat',
      title: 'Open AI Study Coach Chat',
      category: 'Actions',
      icon: Sparkles,
      run: () => {
        onToggleAiChat();
        onClose();
      },
    },
    {
      id: 'act-theme',
      title: 'Toggle Dark / Light Mode',
      category: 'Settings',
      icon: Moon,
      run: () => {
        onToggleDarkMode();
        onClose();
      },
    },
  ];

  // Filter actions and assignments by search query
  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchedAssignments = assignments
    .filter(
      (a) =>
        a.assignmentName.toLowerCase().includes(query.toLowerCase()) ||
        a.subject.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      id="command-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, assignment name, or class..."
            className="w-full text-sm bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Commands & Navigation
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {action.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {action.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignments Search Results */}
          {query.trim() && matchedAssignments.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Assignments
              </div>
              <div className="space-y-1 mt-1">
                {matchedAssignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectTab('tracker');
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {a.assignmentName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {a.subject} • Due {a.dueDate} • {a.status}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                      Open in Tracker
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback if empty */}
          {filteredActions.length === 0 && matchedAssignments.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Student Command Center Search</span>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Master Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
