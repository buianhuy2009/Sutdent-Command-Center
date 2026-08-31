import React, { useState, useMemo } from 'react';
import {
  Layers,
  Compass,
  CheckSquare,
  Mail,
  HardDrive,
  GraduationCap,
  BookOpen,
  Brain,
  Palette,
  Calculator,
  PenTool,
  Network,
  FileText,
  Timer,
  Columns2,
  Sparkles,
  Search,
  X,
  Pin,
  PinOff,
  ExternalLink,
  Atom,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export interface AppStoreItem {
  id: string;
  name: string;
  category: 'LMS & Schedule' | 'STEM & Math' | 'Visual & Design' | 'Study & Retention' | 'Writing & Research';
  description: string;
  icon: any;
  badge?: string;
  isDefaultPinned?: boolean;
}

export const APP_CATALOG: AppStoreItem[] = [
  // Core Defaults
  {
    id: 'canvas',
    name: 'Canvas LMS',
    category: 'LMS & Schedule',
    description: 'Course assignments, due dates, and grading sync.',
    icon: Layers,
    badge: 'Core',
    isDefaultPinned: true,
  },
  {
    id: 'radar',
    name: 'Daily Schedule',
    category: 'LMS & Schedule',
    description: 'Unified chronological schedule and focus blocks.',
    icon: Compass,
    badge: 'Core',
    isDefaultPinned: true,
  },
  {
    id: 'tracker',
    name: 'Assignment Tracker',
    category: 'LMS & Schedule',
    description: 'Master assignment checklist and risk scoring.',
    icon: CheckSquare,
    badge: 'Core',
    isDefaultPinned: true,
  },
  {
    id: 'gmail',
    name: 'Gmail AI Scanner',
    category: 'LMS & Schedule',
    description: 'Smart academic email filter, spam detection & quick drafter.',
    icon: Mail,
    badge: 'AI Powered',
    isDefaultPinned: true,
  },
  {
    id: 'drive',
    name: 'Google Drive',
    category: 'Writing & Research',
    description: 'School files, lecture slides, and 1-click sharing.',
    icon: HardDrive,
    badge: 'Core',
    isDefaultPinned: true,
  },

  // Extended LMS & Integrations
  {
    id: 'classroom',
    name: 'Google Classroom',
    category: 'LMS & Schedule',
    description: 'Live coursework sync from Google Classroom classes.',
    icon: GraduationCap,
  },
  {
    id: 'moodle',
    name: 'Moodle LMS',
    category: 'LMS & Schedule',
    description: 'Moodle iCal calendar sync and assignment feeds.',
    icon: Layers,
  },
  {
    id: 'notebooklm',
    name: 'Google NotebookLM',
    category: 'Study & Retention',
    description: 'AI source binder and audio podcast study generator.',
    icon: BookOpen,
    badge: 'AI',
  },

  // STEM & Math
  {
    id: 'desmos-graphing',
    name: 'Desmos 2D Graphing',
    category: 'STEM & Math',
    description: 'Interactive graphing calculator with AI prompt-to-graph.',
    icon: Calculator,
  },
  {
    id: 'desmos-scientific',
    name: 'Desmos Scientific',
    category: 'STEM & Math',
    description: 'Full scientific calculator for algebra and statistics.',
    icon: Calculator,
  },
  {
    id: 'geogebra',
    name: 'GeoGebra Math Suite',
    category: 'STEM & Math',
    description: '3D geometry, CAS algebra, and calculus graphing.',
    icon: Calculator,
  },
  {
    id: 'phet',
    name: 'PhET Science Simulations',
    category: 'STEM & Math',
    description: 'Interactive Physics, Chemistry, and Biology virtual labs.',
    icon: Atom,
  },
  {
    id: 'scribble-latex',
    name: 'Photo Math Debugger',
    category: 'STEM & Math',
    description: 'OCR handwritten scratch work with yellow line error highlights.',
    icon: FileText,
    badge: 'AI Vision',
  },

  // Visual & Design
  {
    id: 'excalidraw',
    name: 'Excalidraw Whiteboard',
    category: 'Visual & Design',
    description: 'Infinite hand-drawn canvas for diagrams, derivations & notes.',
    icon: PenTool,
  },
  {
    id: 'mermaid',
    name: 'Mermaid.js Mindmaps',
    category: 'Visual & Design',
    description: 'Prompt-to-mindmap and system architecture with SVG export.',
    icon: Network,
    badge: 'AI',
  },
  {
    id: 'canva',
    name: 'Canva Design Studio',
    category: 'Visual & Design',
    description: 'Slides, infographics, and poster design workspace.',
    icon: Palette,
  },

  // Active Recall & Study
  {
    id: 'flashcards',
    name: 'Flashcard Studio (SM-2)',
    category: 'Study & Retention',
    description: 'Spaced repetition flashcards with Quizlet & Anki export.',
    icon: Brain,
  },
  {
    id: 'viva',
    name: 'AI Oral Exam (Viva)',
    category: 'Study & Retention',
    description: 'Voice-dictated viva voce defense with spoken examiner questions.',
    icon: GraduationCap,
    badge: 'Voice AI',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Focus Station',
    category: 'Study & Retention',
    description: '25/5 focus cycles with synthesized Web Audio rain & noise.',
    icon: Timer,
  },

  // Writing & Research
  {
    id: 'notes-markdown',
    name: 'Markdown & LaTeX Notes',
    category: 'Writing & Research',
    description: 'Live KaTeX split preview with word counts and reading time.',
    icon: FileText,
  },
  {
    id: 'rubric',
    name: 'Socratic Rubric Checker',
    category: 'Writing & Research',
    description: 'Pre-grade essay drafts against rubrics with structural tips.',
    icon: CheckSquare,
    badge: 'AI',
  },
  {
    id: 'feynman',
    name: '3-Tier Feynman Explainer',
    category: 'Writing & Research',
    description: 'ELI5, High School, and Undergrad concept simplifications.',
    icon: Sparkles,
    badge: 'AI',
  },
  {
    id: 'splitscreen',
    name: 'Dual-Pane Split Studio',
    category: 'LMS & Schedule',
    description: 'Dock any two apps side-by-side with Cmd+\\ toggle.',
    icon: Columns2,
  },
];

const LOCAL_PINNED_APPS_KEY = 'scc_pinned_apps_v2';

export function loadPinnedAppIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_PINNED_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['canvas', 'radar', 'gmail', 'tracker', 'drive'];
}

export function savePinnedAppIds(ids: string[]): void {
  try {
    localStorage.setItem(LOCAL_PINNED_APPS_KEY, JSON.stringify(ids));
  } catch {}
}

interface AppStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string) => void;
  pinnedAppIds: string[];
  onTogglePinApp: (appId: string) => void;
}

export const AppStoreModal: React.FC<AppStoreModalProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
  pinnedAppIds,
  onTogglePinApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'LMS & Schedule', 'STEM & Math', 'Visual & Design', 'Study & Retention', 'Writing & Research'];

  const filteredApps = useMemo(() => {
    return APP_CATALOG.filter((app) => {
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-[#D97757] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                StudentOS App Store &amp; Tool Hub
              </h2>
              <p className="text-xs text-[#8C897F]">
                Gather all your essential student tools into one place. Launch instantly or pin them to your sidebar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 bg-white dark:bg-[#1A1917] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps and tools..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* App Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            const isPinned = pinnedAppIds.includes(app.id);

            return (
              <div
                key={app.id}
                className="bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 flex flex-col justify-between transition-all group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#D97757] flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      {app.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D97757]/15 text-[#D97757] dark:bg-[#D97757]/25 rounded-md">
                          {app.badge}
                        </span>
                      )}
                      <button
                        onClick={() => onTogglePinApp(app.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isPinned
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-[#252422] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] border-[#DFDACB] dark:border-[#2C2B27]'
                        }`}
                        title={isPinned ? 'Unpin from Sidebar' : 'Pin to Sidebar'}
                      >
                        {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                    {app.name}
                  </h3>
                  <p className="text-xs text-[#8C897F] leading-relaxed line-clamp-2">
                    {app.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8C897F] uppercase tracking-wider">
                    {app.category}
                  </span>

                  <button
                    onClick={() => {
                      onLaunchApp(app.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex items-center justify-between text-xs text-[#8C897F]">
          <span>{filteredApps.length} tools available in StudentOS</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
