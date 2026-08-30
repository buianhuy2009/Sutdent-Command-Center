import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckSquare,
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
  Calculator,
  PenTool,
  Atom,
  Brain,
  FolderOpen,
  Columns2,
  Timer,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { Assignment, WorkspaceId } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (workspace: WorkspaceId) => void;
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
  onSelectWorkspace,
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

  // Simple math solver for equations like "25 * 4" or "15 + 85"
  let mathResult: string | null = null;
  if (/^[0-9+\-*/().\s^%]+$/.test(query.trim()) && /[0-9]/.test(query.trim()) && /[+\-*/^%]/.test(query.trim())) {
    try {
      // Safe evaluation of pure math expressions
      const sanitized = query.replace(/\^/g, '**');
      const val = Function(`'use strict'; return (${sanitized})`)();
      if (typeof val === 'number' && !isNaN(val)) {
        mathResult = `${query.trim()} = ${val}`;
      }
    } catch {}
  }

  const actions = [
    // Workspaces
    {
      id: 'ws-dashboard',
      title: 'Home Dashboard (Overview)',
      category: 'Workspaces',
      icon: CheckSquare,
      run: () => {
        onSelectWorkspace('dashboard');
        onClose();
      },
    },
    {
      id: 'ws-academic',
      title: 'Academic Radar & LMS Hub (Canvas, Classroom, Deadlines)',
      category: 'Workspaces',
      icon: Layers,
      run: () => {
        onSelectWorkspace('academic');
        onClose();
      },
    },
    {
      id: 'ws-stem',
      title: 'STEM & Calculation Lab (Desmos, GeoGebra, PhET)',
      category: 'Workspaces',
      icon: Atom,
      run: () => {
        onSelectWorkspace('stem');
        onClose();
      },
    },
    {
      id: 'ws-creation',
      title: 'Creation & Whiteboard Studio (Excalidraw, Canva)',
      category: 'Workspaces',
      icon: PenTool,
      run: () => {
        onSelectWorkspace('creation');
        onClose();
      },
    },
    {
      id: 'ws-retention',
      title: 'Active Study & Retention Vault (Pomodoro, SRS, NotebookLM)',
      category: 'Workspaces',
      icon: Brain,
      run: () => {
        onSelectWorkspace('retention');
        onClose();
      },
    },
    {
      id: 'ws-documents',
      title: 'Document & Resource Hub (Markdown, Google Drive)',
      category: 'Workspaces',
      icon: FolderOpen,
      run: () => {
        onSelectWorkspace('documents');
        onClose();
      },
    },
    {
      id: 'ws-split',
      title: 'Split-Screen Dual-Pane Dock',
      category: 'Workspaces',
      icon: Columns2,
      run: () => {
        onSelectWorkspace('splitscreen');
        onClose();
      },
    },

    // Quick Actions
    {
      id: 'act-new-assignment',
      title: 'Create New Assignment',
      category: 'Actions',
      icon: Plus,
      run: () => {
        onSelectWorkspace('academic');
        onOpenNewAssignment();
        onClose();
      },
    },
    {
      id: 'act-quick-draft',
      title: 'Draft Teacher Email (AI Quick-Drafter)',
      category: 'Actions',
      icon: Send,
      run: () => {
        onOpenQuickDraft();
        onClose();
      },
    },
    {
      id: 'act-ai-coach',
      title: 'Open AI Study Coach',
      category: 'Actions',
      icon: Sparkles,
      run: () => {
        onToggleAiChat();
        onClose();
      },
    },
    // AI Slash Commands
    {
      id: 'slash-split',
      title: '/split [left-tool] [right-tool] — Dock two academic tools side-by-side in Dual-Pane Studio',
      category: 'AI Slash Commands',
      icon: Columns2,
      run: () => {
        onSelectWorkspace('splitscreen');
        onClose();
      },
    },
    {
      id: 'slash-explain',
      title: '/explain [concept] — 3-Tier Feynman Simplification (ELI5, High School, Undergrad)',
      category: 'AI Slash Commands',
      icon: Sparkles,
      run: () => {
        onSelectWorkspace('documents');
        onClose();
      },
    },
    {
      id: 'slash-graph',
      title: '/graph [equation] — Natural language prompt-to-graph injector for Desmos',
      category: 'AI Slash Commands',
      icon: Calculator,
      run: () => {
        onSelectWorkspace('stem');
        onClose();
      },
    },
    {
      id: 'slash-breakdown',
      title: '/breakdown [assignment-id] — Deconstruct assignment into 4 actionable sub-tasks',
      category: 'AI Slash Commands',
      icon: Layers,
      run: () => {
        onSelectWorkspace('academic');
        onClose();
      },
    },
    {
      id: 'slash-focus',
      title: '/focus 25 — Start 25m customizable focus session with Lo-Fi ambient sound',
      category: 'AI Slash Commands',
      icon: Timer,
      run: () => {
        onSelectWorkspace('retention');
        onClose();
      },
    },
    {
      id: 'slash-pomodoro',
      title: '/pomodoro 25 — Launch Pomodoro sprint in Active Recall Vault',
      category: 'AI Slash Commands',
      icon: Timer,
      run: () => {
        onSelectWorkspace('retention');
        onClose();
      },
    },
    {
      id: 'slash-viva',
      title: '/viva [subject] — Start AI Oral Exam with voice dictation & speech synthesis',
      category: 'AI Slash Commands',
      icon: GraduationCap,
      run: () => {
        onSelectWorkspace('retention');
        onClose();
      },
    },
    {
      id: 'slash-quiz',
      title: '/quiz [subject] — Generate active recall flashcards with SM-2 spaced repetition',
      category: 'AI Slash Commands',
      icon: Brain,
      run: () => {
        onSelectWorkspace('retention');
        onClose();
      },
    },

    // Settings
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

  const filteredActions = actions.filter(
    (a) =>
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
      <div className="bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <Search className="w-5 h-5 text-[#8C897F] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a workspace, tool, equation (e.g. 25*4), or course..."
            className="w-full text-sm bg-transparent border-none outline-none text-[#141413] dark:text-[#FAF9F5] placeholder:text-[#8C897F]"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#FAF9F5] dark:bg-[#252422] text-[#8C897F] rounded border border-[#DFDACB] dark:border-[#2C2B27]">
            ESC
          </kbd>
        </div>

        {/* Math Calculation Quick Solve */}
        {mathResult && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-mono font-bold">{mathResult}</span>
            </div>
            <span className="text-[10px] opacity-75">Calculated in real-time</span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Matched Assignments */}
          {matchedAssignments.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-[#8C897F] uppercase tracking-wider">
                Matching Assignments
              </div>
              <div className="space-y-1 mt-1">
                {matchedAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onSelectWorkspace('academic');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-4 h-4 text-[#D97757] shrink-0" />
                      <span className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] truncate">
                        {a.assignmentName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C897F]">
                      {a.subject} • Due {a.dueDate}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions & Navigation */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-[#8C897F] uppercase tracking-wider">
                Workspaces &amp; Commands
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#5C5A54] dark:text-[#B5B2A8] flex items-center justify-center group-hover:bg-[#D97757] group-hover:text-white transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] truncate">
                          {action.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C897F] font-medium shrink-0 ml-2">
                        {action.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
