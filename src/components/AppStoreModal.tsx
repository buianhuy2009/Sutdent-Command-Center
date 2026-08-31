import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Pin,
  PinOff,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Download,
  Star,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

export interface AppStoreItem {
  id: string;
  name: string;
  category: 'LMS & Schedule' | 'STEM & Math' | 'Visual & Design' | 'Study & Retention' | 'Writing & Research';
  description: string;
  longOverview: string;
  features: string[];
  badge?: string;
  isDefaultPinned?: boolean;
  developer: string;
  rating: number;
  highlightCategory?: 'Featured' | 'STEM' | 'Research' | 'Dev';
}

export const APP_CATALOG: AppStoreItem[] = [
  // 1. LMS & Schedule
  {
    id: 'canvas',
    name: 'Canvas LMS',
    category: 'LMS & Schedule',
    description: 'Assignments, due dates, course rubrics, and grades synchronization.',
    longOverview: 'StudentOS Canvas LMS automatically synchronizes all your university and school coursework, course syllabi, assignment rubrics, and submission deadlines into a single high-density workspace.',
    features: ['Real-time iCal calendar & REST API syncing', 'AI 1-click subtask deconstruction', 'Google Drive 1-click submission integration', 'Automatic overdue & urgent deadline flagging'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'Instructure',
    rating: 4.9,
    highlightCategory: 'Featured',
  },
  {
    id: 'radar',
    name: 'Daily Schedule',
    category: 'LMS & Schedule',
    description: 'Unified chronological schedule, Google Calendar events & study blocks.',
    longOverview: 'A master visual timetable uniting Google Calendar events, Canvas assignment deadlines, and focus blocks into an organized daily agenda.',
    features: ['Live Google Calendar two-way sync', 'AI study block slot recommendation', 'Visual progress indicator for today', 'Direct Google Meet & Zoom launching'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'StudentOS Systems',
    rating: 4.8,
    highlightCategory: 'Featured',
  },
  {
    id: 'tracker',
    name: 'Assignment Tracker',
    category: 'LMS & Schedule',
    description: 'Master assignment checklist, Google Sheets sync, and priority risk scoring.',
    longOverview: 'The central command center for all coursework. Syncs two-way with your Google Sheets master tracker, offers AI-powered natural language task parsing, and calculates effort matrices.',
    features: ['Google Sheets spreadsheet two-way sync', 'Natural text AI parser ("Study AP Bio Ch 4 tomorrow high priority")', 'Dynamic AI risk scoring & time estimates', 'Slide-over assignment inspector sheet'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'StudentOS Lab',
    rating: 5.0,
    highlightCategory: 'Featured',
  },
  {
    id: 'gmail',
    name: 'Gmail AI',
    category: 'LMS & Schedule',
    description: 'Smart academic email filter, spam detection, promotions sorter & quick drafter.',
    longOverview: 'Scans your inbox, separates spam/promotions from primary announcements, extracts assignment due dates, and drafts respectful email replies.',
    features: ['Academic vs Spam/Promotions classification', '1-click "Create Task from Email" action', 'Context-aware email drafter', 'Master-detail two-pane reader'],
    badge: 'AI Powered',
    isDefaultPinned: true,
    developer: 'Google Workspace',
    rating: 4.9,
    highlightCategory: 'Featured',
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    category: 'LMS & Schedule',
    description: 'Live coursework sync from Google Classroom classes.',
    longOverview: 'Directly integrates with Google Classroom API to pull assignments, classroom announcements, course materials, and attachments into your unified queue.',
    features: ['Google Classroom coursework import', 'Course announcements feed', '1-click sync to Master Tracker Sheet', 'Classroom material attachments preview'],
    badge: 'Integration',
    developer: 'Google for Education',
    rating: 4.7,
  },
  {
    id: 'moodle',
    name: 'Moodle LMS',
    category: 'LMS & Schedule',
    description: 'Moodle iCal calendar sync and assignment feeds.',
    longOverview: 'Provides university Moodle integration via calendar feeds and tokenized REST endpoints, ensuring institutional tasks never slip through the cracks.',
    features: ['Moodle iCal calendar feed parser', 'REST token API integration', 'Automated deadline normalization', 'Export to Master Tracker'],
    badge: 'Integration',
    developer: 'Moodle Community',
    rating: 4.6,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'LMS & Schedule',
    description: 'Code repositories, commits, pull requests, and project tracker.',
    longOverview: 'Track your software projects, homework repositories, issue trackers, and pull requests directly from your workspace.',
    features: ['Direct repository quick-launch', 'Project milestone tracker', 'Code snippet repository', 'Commit streak accountability'],
    badge: 'Developer',
    developer: 'GitHub / Microsoft',
    rating: 4.9,
    highlightCategory: 'Dev',
  },
  {
    id: 'discord',
    name: 'Discord & Slack',
    category: 'LMS & Schedule',
    description: 'Study group servers, class channels, and office hour voice rooms.',
    longOverview: 'Organize all your Discord study servers, course Slack workspaces, and peer group chat channels in one focused launcher.',
    features: ['Direct study server bookmarks', 'Class workspace switchboard', 'Voice channel office hours launcher', 'Zero-tab distraction hub'],
    badge: 'Community',
    developer: 'Discord & Slack',
    rating: 4.8,
    highlightCategory: 'Dev',
  },
  {
    id: 'splitscreen',
    name: 'Dual Split Screen',
    category: 'LMS & Schedule',
    description: 'Side-by-side dual workspace for multi-tasking.',
    longOverview: 'Run any two tools side-by-side with an adjustable split ratio. Take notes while graphing on Desmos, or browse Google Drive while writing LaTeX.',
    features: ['Left & right independent pane selection', 'Adjustable 50/50, 60/40, and 70/30 split ratios', 'Swap panes with 1-click', 'Persistent multi-task state'],
    badge: 'Productivity',
    developer: 'StudentOS Systems',
    rating: 4.8,
  },

  // 2. STEM & Math
  {
    id: 'desmos-graphing',
    name: 'Desmos 2D Graphing',
    category: 'STEM & Math',
    description: 'High-performance interactive 2D function plotter.',
    longOverview: 'The gold-standard 2D graphing calculator. Plot explicit, implicit, parametric, and polar equations with interactive sliders.',
    features: ['Interactive sliders & parameter animations', 'Calculus tangent lines & derivatives', 'Table data import & regressions', 'Embedded offline calculation engine'],
    badge: 'STEM',
    developer: 'Desmos Studio',
    rating: 4.9,
    highlightCategory: 'STEM',
  },
  {
    id: 'desmos-scientific',
    name: 'Desmos Scientific',
    category: 'STEM & Math',
    description: 'Precision scientific calculator with fractions & trig.',
    longOverview: 'A clean, intuitive scientific calculator supporting fractions, square roots, trigonometric functions, statistics, and combinatorics.',
    features: ['Natural fraction and radical formatting', 'Trigonometric & logarithmic functions', 'Full calculation history replay', 'Degree and Radian modes'],
    badge: 'STEM',
    developer: 'Desmos Studio',
    rating: 4.8,
  },
  {
    id: 'wolfram-symbolab',
    name: 'Wolfram Alpha & Symbolab',
    category: 'STEM & Math',
    description: 'Step-by-step calculus, linear algebra, and chemistry solver.',
    longOverview: 'Enter complex mathematics, differential equations, integrals, and physics problems. Get step-by-step algebraic derivations, exact answers, and 1-click links to Wolfram Alpha and Symbolab.',
    features: ['Step-by-step algebraic equation derivation', 'Calculus integrals, limits & derivatives', 'Linear algebra matrix operations', 'Direct Wolfram Alpha & Symbolab query generator'],
    badge: 'Math Solver',
    developer: 'Wolfram & Symbolab',
    rating: 4.9,
    highlightCategory: 'STEM',
  },
  {
    id: 'geogebra',
    name: 'GeoGebra Math Suite',
    category: 'STEM & Math',
    description: 'Geometry, 3D graphing, and CAS algebra environment.',
    longOverview: 'Comprehensive dynamic mathematics software uniting geometry, algebra, spreadsheets, graphing, statistics, and calculus in an easy-to-use package.',
    features: ['Dynamic geometric construction tools', '3D surface & vector graphing', 'Computer Algebra System (CAS)', 'Interactive physics & polygon modeling'],
    badge: 'STEM',
    developer: 'GeoGebra Group',
    rating: 4.9,
    highlightCategory: 'STEM',
  },
  {
    id: 'phet',
    name: 'PhET Interactive Simulations',
    category: 'STEM & Math',
    description: 'Interactive STEM physics, chemistry & bio labs.',
    longOverview: 'Explore physics, chemistry, biology, and earth science concepts through award-winning interactive simulation labs developed by the University of Colorado Boulder.',
    features: ['Interactive circuit construction kits', 'Gravity and orbit orbital mechanics simulator', 'Acid-base solutions & chemical equilibrium', 'Faraday law electromagnetic labs'],
    badge: 'Simulations',
    developer: 'University of Colorado Boulder',
    rating: 5.0,
    highlightCategory: 'STEM',
  },
  {
    id: 'scribble-latex',
    name: 'Photo Math OCR',
    category: 'STEM & Math',
    description: 'OCR handwritten math, detect calculation errors.',
    longOverview: 'Upload a picture of your handwritten calculus or algebra solution. Gemini reads your equations, verifies each step, and highlights algebra errors with step-by-step corrections.',
    features: ['Multimodal OCR equation recognition', 'Step-by-step arithmetic verification', 'Error highlight & explanation', 'LaTeX formula copy & export'],
    badge: 'Vision',
    developer: 'StudentOS AI Labs',
    rating: 4.9,
  },

  // 3. Visual & Design
  {
    id: 'excalidraw',
    name: 'Excalidraw Whiteboard',
    category: 'Visual & Design',
    description: 'Virtual hand-drawn canvas for diagrams & equations.',
    longOverview: 'An infinite virtual whiteboard with an authentic hand-drawn aesthetic. Sketch mathematical proofs, draw system architectures, and collaborate visually.',
    features: ['Infinite vector drawing canvas', 'Smart shape recognition & arrows', 'PNG, SVG, and clipboard export', 'Dark and light canvas modes'],
    badge: 'Creative',
    developer: 'Excalidraw Open Source',
    rating: 4.9,
  },
  {
    id: 'mermaid',
    name: 'Mermaid.js Flowcharts',
    category: 'Visual & Design',
    description: 'Text-to-diagram flowcharts, sequences & mindmaps.',
    longOverview: 'Generate publication-grade flowcharts, sequence diagrams, state machines, and class hierarchies directly from simple markdown text or AI prompts.',
    features: ['Live markdown-to-diagram rendering', 'Flowchart, sequence, mindmap, & git graphs', 'SVG and PNG high-res export', 'AI text-to-diagram converter'],
    badge: 'Visual',
    developer: 'Mermaid.js Community',
    rating: 4.8,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'Visual & Design',
    description: 'Slide decks, posters, infographics, and graphics studio.',
    longOverview: 'Quick access to your Canva presentations, academic research posters, group project slide decks, and visual infographics.',
    features: ['Direct Canva workspace bridge', 'Poster & presentation templates', 'Group project visual collaboration', 'Export to PDF and slide decks'],
    badge: 'Design',
    developer: 'Canva',
    rating: 4.9,
  },

  // 4. Study & Retention
  {
    id: 'flashcards',
    name: 'Quizlet & Anki (SM-2)',
    category: 'Study & Retention',
    description: 'Spaced repetition flashcards with Quizlet and Anki deck import/export.',
    longOverview: 'A high-yield spaced repetition flashcard studio powered by the SuperMemo SM-2 algorithm. Generate decks from notes with AI, review cards daily, and export to Anki or Quizlet.',
    features: ['SuperMemo SM-2 spaced repetition engine', 'AI 1-click deck generator from text', 'CSV, Anki & Quizlet import/export', 'Mastery streak & ease factor tracking'],
    badge: 'Spaced Repetition',
    developer: 'StudentOS Cognitive Labs',
    rating: 5.0,
    highlightCategory: 'Featured',
  },
  {
    id: 'notebooklm',
    name: 'Google NotebookLM',
    category: 'Study & Retention',
    description: 'Google AI source binder & audio overview generator.',
    longOverview: 'Organize your course PDF readings, lecture notes, and Google Docs into AI notebooks. Prepare grounded source binders and listen to deep-dive audio discussions.',
    features: ['Source prepper & text synthesizer', '1-click save to Google Drive', 'Grounded AI citations & summaries', 'Direct NotebookLM portal link'],
    badge: 'AI Research',
    developer: 'Google Labs',
    rating: 4.9,
    highlightCategory: 'Research',
  },
  {
    id: 'viva',
    name: 'Oral Exam Practice (Viva)',
    category: 'Study & Retention',
    description: 'Simulated professor voice exam with live evaluation.',
    longOverview: 'Practice for high-stakes oral exams, thesis defenses, and professor questioning. AI asks progressive questions via voice synthesis and evaluates your spoken answers.',
    features: ['Interactive SpeechSynthesis professor audio', 'Speech-to-text live student dictation', '0-100 scoring & conceptual gap analysis', 'Multi-turn progressive oral examination'],
    badge: 'Voice AI',
    developer: 'StudentOS Cognitive Labs',
    rating: 4.9,
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Focus Station',
    category: 'Study & Retention',
    description: 'Fullscreen zen focus timer with ambient soundscapes.',
    longOverview: 'Enter deep uninterrupted flow states with a minimalist 25-minute Pomodoro timer, ambient white noise / rain synthesizer, and instant fullscreen zen mode.',
    features: ['Automatic fullscreen & zen focus mode', 'Web Audio API white noise & rain soundscapes', 'Daily session streak tracker', 'Distraction-free scratchpad'],
    badge: 'Zen Focus',
    developer: 'StudentOS Focus Station',
    rating: 4.8,
  },

  // 5. Writing & Research
  {
    id: 'drive',
    name: 'Google Drive',
    category: 'Writing & Research',
    description: 'Docs, Sheets, Slides, PDFs, and 1-click sharing.',
    longOverview: 'Browse your recent Google Docs, Sheets, Slides, and PDFs with 1-click peer sharing and instant Canvas assignment attachment.',
    features: ['Google Drive file index', '1-click peer & professor permission sharing', 'Direct open in Google Docs/Sheets', 'Integrated submission picker'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'Google Workspace',
    rating: 4.9,
    highlightCategory: 'Featured',
  },
  {
    id: 'google-scholar',
    name: 'Google Scholar & Citations',
    category: 'Writing & Research',
    description: 'Search papers & generate citations in APA 7th, MLA 9th, Chicago, and BibTeX.',
    longOverview: 'Search any academic source or paste paper titles to instantly generate verified bibliographic citations in APA, MLA, Chicago, Harvard, and BibTeX formats.',
    features: ['Instant citation formatter (APA 7, MLA 9, Chicago 17)', '1-click in-text citation copy (Author, Year)', 'Export to BibTeX and Zotero', 'Scholarly source metadata lookup'],
    badge: 'Citations',
    developer: 'Google Scholar & Zotero',
    rating: 4.9,
    highlightCategory: 'Research',
  },
  {
    id: 'overleaf',
    name: 'Overleaf LaTeX',
    category: 'Writing & Research',
    description: 'Cloud LaTeX document templates and PDF editor bridge.',
    longOverview: 'Quick access to your Overleaf LaTeX projects, research lab reports, IEEE paper templates, and math problem sets.',
    features: ['Direct Overleaf project launcher', 'LaTeX document template generator', 'Mathematical formula copy & paste', 'Cloud synchronization'],
    badge: 'LaTeX',
    developer: 'Overleaf / Digital Science',
    rating: 4.8,
    highlightCategory: 'Research',
  },
  {
    id: 'notes-markdown',
    name: 'Markdown Notes & LaTeX',
    category: 'Writing & Research',
    description: 'Split-view LaTeX math & markdown lecture note-taker.',
    longOverview: 'A rapid note-taker featuring live LaTeX math rendering via KaTeX, real-time word stats, and 1-click Markdown export.',
    features: ['KaTeX math equation rendering ($..$ & $$..$$)', 'Real-time word & estimated reading time stats', 'Local storage auto-persistence', 'Clean distraction-free typography'],
    badge: 'Writing',
    developer: 'StudentOS Notes',
    rating: 4.8,
  },
  {
    id: 'rubric',
    name: 'Essay Rubric Checker',
    category: 'Writing & Research',
    description: 'AI grading preview with actionable score improvements.',
    longOverview: 'Paste your draft essay and assignment grading rubric. Gemini grades your draft against each rubric criterion and gives actionable revisions.',
    features: ['Criterion-by-criterion score estimation', 'Weakness detection & revision coaching', 'Evidence-to-claim alignment check', 'Estimated letter grade preview'],
    badge: 'Feedback',
    developer: 'StudentOS Writing Lab',
    rating: 4.9,
  },
  {
    id: 'feynman',
    name: 'Feynman Concept Explainer',
    category: 'Writing & Research',
    description: 'Explain complex concepts at Simple, Intermediate & Advanced levels.',
    longOverview: 'Master difficult concepts by applying the Feynman Technique. AI translates dense theories into intuitive analogies, real-world models, and rigorous derivations.',
    features: ['3-tier conceptual translation (ELI5, HS, College)', 'Intuitive everyday real-world analogies', 'Identification of technical jargon & pitfalls', '1-click copy to notes'],
    badge: 'Pedagogy',
    developer: 'StudentOS Cognitive Labs',
    rating: 4.9,
  },
];

const CATEGORIES = [
  'Highlights',
  'All',
  'LMS & Schedule',
  'STEM & Math',
  'Visual & Design',
  'Study & Retention',
  'Writing & Research',
] as const;

const LOCAL_PINNED_APPS_KEY = 'scc_pinned_apps_v2';

export function loadPinnedAppIds(): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_PINNED_APPS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return ['canvas', 'radar', 'tracker', 'gmail', 'drive'];
}

export function savePinnedAppIds(ids: string[]) {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Highlights');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingApp, setViewingApp] = useState<AppStoreItem | null>(null);

  const filteredApps = useMemo(() => {
    return APP_CATALOG.filter((app) => {
      if (selectedCategory !== 'Highlights' && selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.name.toLowerCase().includes(q);
        const matchDesc = app.description.toLowerCase().includes(q);
        const matchCat = app.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const featuredApps = useMemo(() => APP_CATALOG.filter((a) => a.highlightCategory === 'Featured'), []);
  const stemApps = useMemo(() => APP_CATALOG.filter((a) => a.highlightCategory === 'STEM'), []);
  const researchApps = useMemo(() => APP_CATALOG.filter((a) => a.highlightCategory === 'Research'), []);
  const devApps = useMemo(() => APP_CATALOG.filter((a) => a.highlightCategory === 'Dev'), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] dark:bg-[#141413] flex flex-col animate-in fade-in duration-150 select-none">
      
      {/* Top Header Bar */}
      <header className="h-16 px-6 sm:px-10 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-white dark:bg-[#1A1917] shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          {viewingApp ? (
            <button
              onClick={() => setViewingApp(null)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#D97757] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-[#D97757]/20">
                S
              </div>
              <div>
                <h1 className="text-base font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                  StudentOS App Store
                </h1>
                <p className="text-[11px] text-[#8C897F]">
                  Connect and launch all your tools, websites &amp; integrations in one place
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center Search (Only on Catalog View) */}
        {!viewingApp && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#8C897F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, GitHub, LaTeX, Wolfram, Scholar, Canvas..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>
          </div>
        )}

        {/* Right Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-2xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Close App Store (Esc)"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* VIEW 1: DEDICATED APP DETAIL PAGE */}
        {viewingApp ? (
          <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Hero App Card */}
            <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <AppLogo id={viewingApp.id} size="xl" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {viewingApp.name}
                    </h2>
                    {viewingApp.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D97757]/15 text-[#D97757]">
                        {viewingApp.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8C897F]">
                    {viewingApp.developer} • {viewingApp.category}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 pt-0.5">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{viewingApp.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-[#8C897F] font-normal pl-1">
                      (Verified Tool)
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => onTogglePinApp(viewingApp.id)}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    pinnedAppIds.includes(viewingApp.id)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'
                  }`}
                >
                  {pinnedAppIds.includes(viewingApp.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Installed in Sidebar</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#D97757]" />
                      <span>Install in Sidebar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onLaunchApp(viewingApp.id);
                    onClose();
                  }}
                  className="flex-1 md:flex-initial px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open App</span>
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8C897F] mb-3">
                  About this App
                </h3>
                <p className="text-sm text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                  {viewingApp.longOverview}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8C897F] mb-3">
                  Key Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingApp.features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start gap-2.5 text-xs text-[#141413] dark:text-[#FAF9F5]"
                    >
                      <Zap className="w-4 h-4 text-[#D97757] shrink-0 mt-0.5" />
                      <span className="font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* VIEW 2: STORE CATALOG & HIGHLIGHTS */
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-8">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-white dark:bg-[#1A1917] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27]'
                  }`}
                >
                  {cat === 'Highlights' ? '✨ Highlights' : cat}
                </button>
              ))}
            </div>

            {/* DEFAULT HIGHLIGHTS VIEW */}
            {selectedCategory === 'Highlights' && !searchQuery.trim() ? (
              <div className="space-y-10">
                
                {/* 1. Essential Featured Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Top Suggested Apps
                      </h2>
                      <p className="text-xs text-[#8C897F]">
                        The core foundations most students use every day
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredApps.map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 2. STEM & Math Highlights */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                        STEM, Math &amp; Science Labs
                      </h2>
                      <p className="text-xs text-[#8C897F]">
                        Calculators, function plotters, physics simulations and solvers
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stemApps.map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 3. Research & Writing Highlights */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Research, Writing &amp; Citations
                      </h2>
                      <p className="text-xs text-[#8C897F]">
                        Google Scholar, Overleaf LaTeX, and source binders
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {researchApps.map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 4. Coding & Collaboration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Code, Repositories &amp; Study Servers
                      </h2>
                      <p className="text-xs text-[#8C897F]">
                        GitHub project tracking, Discord servers, and Slack channels
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devApps.map((app) => renderAppCard(app))}
                  </div>
                </div>

              </div>
            ) : (
              /* CATEGORY / SEARCH GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredApps.map((app) => renderAppCard(app))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );

  function renderAppCard(app: AppStoreItem) {
    const isPinned = pinnedAppIds.includes(app.id);

    return (
      <div
        key={app.id}
        onClick={() => setViewingApp(app)}
        className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs hover:shadow-md hover:border-[#D97757]/60 transition-all cursor-pointer flex flex-col justify-between group space-y-5"
      >
        <div className="space-y-4">
          {/* Top Row: App Logo & Badges */}
          <div className="flex items-start justify-between gap-3">
            <AppLogo id={app.id} size="lg" />
            <div className="flex flex-col items-end gap-1">
              {app.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97757]/15 text-[#D97757]">
                  {app.badge}
                </span>
              )}
              <span className="text-[10px] text-[#8C897F] font-semibold">
                {app.category}
              </span>
            </div>
          </div>

          {/* App Name & Brief */}
          <div>
            <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors">
              {app.name}
            </h3>
            <p className="text-xs text-[#8C897F] mt-1 leading-relaxed line-clamp-2">
              {app.description}
            </p>
          </div>
        </div>

        {/* Card Action Row */}
        <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onTogglePinApp(app.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
              isPinned
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            <span>{isPinned ? 'Installed' : 'Install'}</span>
          </button>

          <button
            onClick={() => {
              onLaunchApp(app.id);
              onClose();
            }}
            className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
