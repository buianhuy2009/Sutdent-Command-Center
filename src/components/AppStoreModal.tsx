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
  Zap,
  Layers,
  Award,
  BookOpen,
  Calculator,
  Palette,
  Timer,
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
}

export const APP_CATALOG: AppStoreItem[] = [
  // 1. LMS & Schedule
  {
    id: 'canvas',
    name: 'Canvas LMS',
    category: 'LMS & Schedule',
    description: 'Sync coursework, due dates, course rubrics, and grades.',
    longOverview: 'Synchronize your university and school coursework, course syllabi, assignment rubrics, and submission deadlines into a single high-density workspace.',
    features: ['Real-time iCal calendar & REST API syncing', 'AI 1-click subtask deconstruction', 'Google Drive 1-click submission integration', 'Automatic overdue deadline alerts'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'Instructure',
    rating: 4.9,
  },
  {
    id: 'radar',
    name: 'Daily Schedule',
    category: 'LMS & Schedule',
    description: 'Chronological agenda merging Google Calendar classes & focus blocks.',
    longOverview: 'A master visual timetable uniting Google Calendar events, Canvas assignment deadlines, and focus blocks into an organized daily agenda.',
    features: ['Live Google Calendar two-way sync', 'AI study block slot recommendation', 'Visual progress indicator for today', 'Direct Google Meet & Zoom launching'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'StudentOS Systems',
    rating: 4.8,
  },
  {
    id: 'tracker',
    name: 'Assignment Tracker',
    category: 'LMS & Schedule',
    description: 'Master assignment checklist with Google Sheets two-way sync.',
    longOverview: 'The central command center for all coursework. Syncs two-way with your Google Sheets master tracker, offers AI-powered natural language task parsing, and calculates effort matrices.',
    features: ['Google Sheets spreadsheet two-way sync', 'Natural text AI parser ("Study AP Bio tomorrow high priority")', 'Dynamic AI risk scoring & time estimates', 'Slide-over assignment inspector sheet'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'StudentOS Lab',
    rating: 5.0,
  },
  {
    id: 'gmail',
    name: 'Gmail AI',
    category: 'LMS & Schedule',
    description: 'Filter academic emails, catch deadlines, and draft replies.',
    longOverview: 'Scans your inbox, separates spam and promotions from primary announcements, extracts assignment due dates, and drafts respectful email replies.',
    features: ['Academic vs Spam classification', '1-click "Create Task from Email" action', 'Context-aware email drafter', 'Master-detail two-pane reader'],
    badge: 'AI Powered',
    isDefaultPinned: true,
    developer: 'Google Workspace',
    rating: 4.9,
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    category: 'LMS & Schedule',
    description: 'Sync assignments, announcements, and files from Google Classroom.',
    longOverview: 'Directly integrates with Google Classroom to pull assignments, classroom announcements, course materials, and attachments into your unified queue.',
    features: ['Google Classroom coursework import', 'Course announcements feed', '1-click sync to Master Tracker Sheet', 'Classroom material attachments preview'],
    badge: 'Integration',
    developer: 'Google for Education',
    rating: 4.7,
  },
  {
    id: 'moodle',
    name: 'Moodle LMS',
    category: 'LMS & Schedule',
    description: 'Sync university Moodle calendar feeds and deadlines.',
    longOverview: 'Provides university Moodle integration via calendar feeds and tokenized REST endpoints, ensuring institutional tasks never slip through the cracks.',
    features: ['Moodle iCal calendar feed parser', 'REST token API integration', 'Automated deadline normalization', 'Export to Master Tracker'],
    badge: 'Integration',
    developer: 'Moodle Community',
    rating: 4.6,
  },
  {
    id: 'splitscreen',
    name: 'Dual Split Screen',
    category: 'LMS & Schedule',
    description: 'Run any two tools side-by-side with adjustable split ratios.',
    longOverview: 'Run any two tools side-by-side with an adjustable split ratio. Take notes while graphing on Desmos, or browse Google Drive while writing equations.',
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
    description: 'Plot equations, calculus curves, and functions with live sliders.',
    longOverview: 'The gold-standard 2D graphing calculator. Plot explicit, implicit, parametric, and polar equations with interactive sliders.',
    features: ['Interactive sliders & parameter animations', 'Calculus tangent lines & derivatives', 'Table data import & regressions', 'Embedded offline calculation engine'],
    badge: 'STEM',
    developer: 'Desmos Studio',
    rating: 4.9,
  },
  {
    id: 'desmos-scientific',
    name: 'Desmos Scientific',
    category: 'STEM & Math',
    description: 'Scientific calculator with fractions, radicals, and trig functions.',
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
    description: 'Step-by-step math solver for calculus, algebra, and physics.',
    longOverview: 'Quickly access Wolfram Alpha computational knowledge engine and Symbolab step-by-step equation solvers directly inside your workspace.',
    features: ['Calculus integrals & derivative steps', 'Symbolic equation factoring', 'Unit conversions & physical constants', 'Direct computation bridge'],
    badge: 'Solver',
    developer: 'Wolfram & Symbolab',
    rating: 4.9,
  },
  {
    id: 'geogebra',
    name: 'GeoGebra Math Suite',
    category: 'STEM & Math',
    description: '3D geometry, algebraic graphing, and calculus animations.',
    longOverview: 'Comprehensive mathematics suite for 3D geometry, dynamic vectors, conic sections, probability distributions, and coordinate geometry.',
    features: ['Interactive 3D geometry & spatial graphs', 'Dynamic vector arithmetic', 'Probability distribution curves', 'Constrained geometric constructions'],
    badge: 'Geometry',
    developer: 'GeoGebra',
    rating: 4.8,
  },
  {
    id: 'phet',
    name: 'PhET Interactive Simulations',
    category: 'STEM & Math',
    description: 'Interactive physics, chemistry, and biology laboratory simulations.',
    longOverview: 'Over 100 interactive STEM laboratory simulations from the University of Colorado Boulder. Experiment with circuit construction, optics, projectile motion, and chemical kinetics.',
    features: ['Circuit construction AC/DC simulator', 'Wave interference & optics sandbox', 'Atomic orbital & molecular geometry models', 'Interactive projectile physics lab'],
    badge: 'Simulations',
    developer: 'University of Colorado Boulder',
    rating: 5.0,
  },
  {
    id: 'scribble-latex',
    name: 'Photo Math OCR',
    category: 'STEM & Math',
    description: 'Scan handwritten math into formatted LaTeX and step-by-step solutions.',
    longOverview: 'Upload a picture of handwritten equations or textbook problems. Gemini Multimodal OCR parses the math, formats clean LaTeX, and solves the derivation step-by-step.',
    features: ['Multimodal handwriting to LaTeX parsing', 'Step-by-step error diagnostic breakdown', 'Desmos-compatible equation export', '1-click copy LaTeX code to clipboard'],
    badge: 'OCR & Vision',
    developer: 'StudentOS Cognitive Labs',
    rating: 4.9,
  },
  {
    id: 'periodic-table',
    name: 'Interactive Periodic Table',
    category: 'STEM & Math',
    description: '118-element periodic table with atomic stats & electron configs.',
    longOverview: 'Explore all 118 chemical elements with accurate atomic masses, electron configurations, Pauling electronegativities, and chemical classifications.',
    features: ['118-element IUPAC standard periodic table', 'Element family filters (Alkali, Halogens, Noble Gases)', 'Search by name, symbol, or atomic number', 'Detailed element inspector drawer'],
    badge: 'Chemistry',
    developer: 'StudentOS STEM Lab',
    rating: 5.0,
  },
  {
    id: 'unit-converter',
    name: 'Scientific Unit Converter',
    category: 'STEM & Math',
    description: 'Convert length, mass, temperature, speed, energy, and storage units.',
    longOverview: 'Convert length, mass, temperature, speed, energy, pressure, and digital storage units with high precision. Includes built-in expression calculator.',
    features: ['7 major scientific unit categories', 'Two-way live conversion with instant swap', 'Built-in trigonometric & algebraic expression evaluator', '1-click copy equation to clipboard'],
    badge: 'Physics & STEM',
    developer: 'StudentOS STEM Lab',
    rating: 4.9,
  },

  // 3. Visual & Design
  {
    id: 'excalidraw',
    name: 'Excalidraw Whiteboard',
    category: 'Visual & Design',
    description: 'Hand-drawn virtual whiteboard for diagrams, brainstorming, and sketching.',
    longOverview: 'A rapid virtual whiteboard for sketching mind maps, diagramming proofs, drawing anatomy models, and visual brainstorms with high fidelity.',
    features: ['Hand-drawn organic aesthetic', 'Vector shapes, arrows, and text labels', 'Full undo/redo history', 'Local storage autosave & PNG export'],
    badge: 'Diagramming',
    developer: 'Excalidraw Open Source',
    rating: 4.9,
  },
  {
    id: 'mermaid',
    name: 'Mermaid Flowcharts',
    category: 'Visual & Design',
    description: 'Generate clean architectural diagrams, flowcharts, and mind maps from text.',
    longOverview: 'Create flowcharts, state machines, sequence diagrams, and class hierarchies simply by describing relationships in text or letting AI generate the syntax.',
    features: ['AI text-to-diagram generation', 'Flowcharts, Sequence, Gantt & Mindmaps', 'Live syntax error detection', '1-click SVG & PNG export'],
    badge: 'Architecture',
    developer: 'Mermaid JS',
    rating: 4.8,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'Visual & Design',
    description: 'Design presentation slides, research posters, and infographics.',
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
    description: 'SM-2 active recall flashcards with Anki & Quizlet import/export.',
    longOverview: 'A high-yield spaced repetition flashcard studio powered by the SuperMemo SM-2 algorithm. Generate decks from notes with AI, review cards daily, and export to Anki or Quizlet.',
    features: ['SuperMemo SM-2 spaced repetition engine', 'AI 1-click deck generator from text', 'CSV, Anki & Quizlet import/export', 'Mastery streak & ease factor tracking'],
    badge: 'Spaced Repetition',
    developer: 'StudentOS Cognitive Labs',
    rating: 5.0,
  },
  {
    id: 'notebooklm',
    name: 'Google NotebookLM',
    category: 'Study & Retention',
    description: 'Google AI source binder and research notes synthesizer.',
    longOverview: 'Organize your course PDF readings, lecture notes, and Google Docs into AI notebooks. Prepare grounded source binders and listen to deep-dive audio discussions.',
    features: ['Source prepper & text synthesizer', '1-click save to Google Drive', 'Grounded AI citations & summaries', 'Direct NotebookLM portal link'],
    badge: 'AI Research',
    developer: 'Google Labs',
    rating: 4.9,
  },
  {
    id: 'viva',
    name: 'Oral Exam Practice (Viva)',
    category: 'Study & Retention',
    description: 'Simulated professor voice examination with live spoken feedback.',
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
    description: 'Fullscreen focus timer with warm ambient soundscapes.',
    longOverview: 'Enter deep uninterrupted flow states with a minimalist 25-minute Pomodoro timer, ambient Brownian noise / rain synthesizer, and instant fullscreen zen mode.',
    features: ['Automatic fullscreen on session start', 'Authentic Brownian noise & realistic rain synthesizer', 'Daily session streak tracker', 'Distraction-free scratchpad'],
    badge: 'Zen Focus',
    developer: 'StudentOS Focus Station',
    rating: 4.8,
  },
  {
    id: 'quiz-generator',
    name: 'AI Practice Quiz Generator',
    category: 'Study & Retention',
    description: 'Generate practice multiple-choice quizzes with explanations from notes.',
    longOverview: 'Paste lecture notes, study outlines, or textbook excerpts to instantly generate multiple choice quizzes with detailed conceptual explanations for each answer choice.',
    features: ['Instant active retrieval question generation', 'Interactive test taking with instant feedback', 'Detailed rationale explanations per question', 'Score tracking and mastery review'],
    badge: 'Quizzes',
    developer: 'StudentOS Cognitive Labs',
    rating: 5.0,
  },

  // 5. Writing & Research
  {
    id: 'drive',
    name: 'Google Drive',
    category: 'Writing & Research',
    description: 'Browse Google Docs, Sheets, Slides, and attach files in 1-click.',
    longOverview: 'Browse your recent Google Docs, Sheets, Slides, and PDFs with 1-click peer sharing and instant Canvas assignment attachment.',
    features: ['Google Drive file index', '1-click peer & professor permission sharing', 'Direct open in Google Docs/Sheets', 'Integrated submission picker'],
    badge: 'Essential',
    isDefaultPinned: true,
    developer: 'Google Workspace',
    rating: 4.9,
  },
  {
    id: 'notes-markdown',
    name: 'Markdown Notes & LaTeX',
    category: 'Writing & Research',
    description: 'Live Markdown and LaTeX math lecture note-taker.',
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
    description: 'AI essay pre-checker with thesis evaluation and rubric scoring.',
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
    description: 'Translate dense academic theories into simple analogies and models.',
    longOverview: 'Master difficult concepts by applying the Feynman Technique. AI translates dense theories into intuitive analogies, real-world models, and rigorous derivations.',
    features: ['3-tier conceptual translation (ELI5, HS, College)', 'Intuitive everyday real-world analogies', 'Identification of technical jargon & pitfalls', '1-click copy to notes'],
    badge: 'Pedagogy',
    developer: 'StudentOS Cognitive Labs',
    rating: 4.9,
  },
  {
    id: 'pdf-reader',
    name: 'PDF Reader & Annotator',
    category: 'Writing & Research',
    description: 'Read course PDFs, annotate pages, and export markdown notes.',
    longOverview: 'View your course slides, syllabus, and textbook PDFs directly inside StudentOS. Add page-referenced study notes and export clean Markdown summaries with zero server uploads.',
    features: ['In-browser PDF rendering with page jumping', 'Page-linked markdown study notes', 'Live word count and local auto-save', 'Zero server upload (100% private)'],
    badge: 'Study Tool',
    developer: 'StudentOS Document Hub',
    rating: 4.8,
  },
  {
    id: 'arxiv',
    name: 'arXiv Research Papers',
    category: 'Writing & Research',
    description: 'Search Cornell arXiv preprints in CS, Math, and Physics with direct PDFs.',
    longOverview: 'Search the complete global arXiv preprint repository. Read abstracts, inspect author credits, copy formatted APA citations, and download official research PDFs.',
    features: ['Live query to export.arxiv.org API', 'Filters across CS, Math, Physics, Biology & Econ', '1-click APA citation copy', 'Direct PDF access'],
    badge: 'Research',
    developer: 'Cornell University (Open Access)',
    rating: 5.0,
  },
  {
    id: 'open-library',
    name: 'Open Library Textbooks',
    category: 'Writing & Research',
    description: 'Search course textbooks with ISBNs and Internet Archive borrow links.',
    longOverview: 'Search millions of textbooks, classic literature, and syllabus readings from the Open Library global catalog. View cover art, publication years, ISBNs, and read links.',
    features: ['Live query to openlibrary.org API', 'Textbook and author search', 'ISBN lookup & 1-click copy', 'Direct Internet Archive read/borrow links'],
    badge: 'Books',
    developer: 'Internet Archive',
    rating: 4.9,
  },
  {
    id: 'timetable',
    name: 'Weekly Timetable',
    category: 'LMS & Schedule',
    description: 'Drag-drop weekly class grid → Google Calendar events.',
    longOverview: 'Weekly timetable grid for all courses. Drag-drop to reschedule, click to add, syncs directly to Google Calendar via insertCalendarEvent.',
    features: ['Mon-Sun 8am-8pm grid', 'Drag-drop reschedule', 'Google Calendar two-way sync', 'Local persistence + offline'],
    badge: 'New',
    developer: 'StudentOS',
    rating: 4.9,
  },
  {
    id: 'citation-vault',
    name: 'Citation Vault',
    category: 'Writing & Research',
    description: 'Zotero-style vault: APA/MLA/Chicago/BibTeX generator + vault.',
    longOverview: 'Generate accurate academic citations via Gemini for any source, preview APA/MLA/Chicago/BibTeX, copy 1-click, and save to local vault.',
    features: ['APA 7th / MLA 9th / Chicago 17th / BibTeX', 'Gemini AI citation generation', '1-click copy & vault save', '20-item local vault'],
    badge: 'New',
    developer: 'StudentOS Writing Lab',
    rating: 5.0,
  },
  {
    id: 'scholarship-tracker',
    name: 'Scholarship Tracker',
    category: 'LMS & Schedule',
    description: 'Kanban for scholarships & internships: Not Started → Offer.',
    longOverview: 'Track scholarship and internship applications through Kanban stages, move cards, and store locally.',
    features: ['4-stage Kanban', 'Add/move/archive cards', 'Local persistence', 'Progress count per stage'],
    badge: 'New',
    developer: 'StudentOS',
    rating: 4.8,
  },
  {
    id: 'group-project',
    name: 'Group Project Hub',
    category: 'LMS & Schedule',
    description: 'Shared Drive folder per course + member tasks + peer review.',
    longOverview: 'Create group projects, link a shared Drive folder, add member tasks and peer review stubs.',
    features: ['Project per course', 'Drive folder link', 'Member tasks', 'Peer review placeholder'],
    badge: 'Collab',
    developer: 'StudentOS',
    rating: 4.7,
  },
  {
    id: 'peer-qa',
    name: 'Peer Q&A',
    category: 'Study & Retention',
    description: 'Anonymous course Q&A (Piazza-style) with AI moderation.',
    longOverview: 'Ask questions anonymously per course, peers reply, AI moderation flags spam/abuse.',
    features: ['Anonymous per-course Q&A', 'AI moderation', 'Course filtering', 'Local persistence'],
    badge: 'Community',
    developer: 'StudentOS',
    rating: 4.6,
  },
  {
    id: 'notion-import',
    name: 'Notion Import',
    category: 'Writing & Research',
    description: 'Bulk import Notion markdown notes → Markdown vault.',
    longOverview: 'Select multiple .md files from Notion export, bulk import to MarkdownNote vault with Dexie persistence.',
    features: ['Multi-.md bulk import', 'Subject grouping', 'Dexie + localStorage sync', 'Instant vault access'],
    badge: 'Import',
    developer: 'StudentOS',
    rating: 4.8,
  },
  {
    id: 'deadline-gantt',
    name: 'Deadline Gantt',
    category: 'LMS & Schedule',
    description: 'Gantt timeline auto-generated from assignments & Canvas.',
    longOverview: 'Mermaid Gantt code auto-generated from your assignments and Canvas deadlines, grouping by course for Mermaid rendering.',
    features: ['Auto Gantt from assignments', 'Grouped by course', 'Copy Mermaid code', 'MermaidWorkspace render'],
    badge: 'Timeline',
    developer: 'StudentOS',
    rating: 4.8,
  },
];

// Top 8 Recommended Highlight Apps (Exactly 8)
export const TOP_8_HIGHLIGHT_IDS = [
  'canvas',
  'radar',
  'tracker',
  'gmail',
  'desmos-graphing',
  'pomodoro',
  'flashcards',
  'drive',
];

const CATEGORIES = [
  'Highlights',
  'LMS & Schedule',
  'STEM & Math',
  'Visual & Design',
  'Study & Retention',
  'Writing & Research',
  'All Apps',
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

  // Top 8 Highlight Apps
  const top8Highlights = useMemo(() => {
    return TOP_8_HIGHLIGHT_IDS.map((id) => APP_CATALOG.find((a) => a.id === id)!).filter(Boolean);
  }, []);

  // Filtered Apps when a specific category tab is selected
  const categoryApps = useMemo(() => {
    if (selectedCategory === 'All Apps') return APP_CATALOG;
    return APP_CATALOG.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return APP_CATALOG.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
                  Connect and launch all your academic tools &amp; integrations in one place
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center Search Bar */}
        {!viewingApp && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#8C897F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, Canvas, Desmos, Wolfram, Quizlet, Notes..."
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

      {/* Main Scrollable Content Area */}
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

              {/* Key Capabilities */}
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
          /* VIEW 2: STORE CATALOG & CONTINUOUS FLOW */
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-8">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat && !searchQuery.trim()
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-white dark:bg-[#1A1917] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* SEARCH RESULTS VIEW (If Search Active) */}
            {searchQuery.trim() ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                    Search Results ({searchResults.length})
                  </h2>
                  <span className="text-xs text-[#8C897F]">Query: "{searchQuery}"</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="py-20 text-center text-[#8C897F] text-xs space-y-2">
                    <Search className="w-8 h-8 mx-auto opacity-30" />
                    <p>No tools match "{searchQuery}". Try a different keyword.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((app) => renderAppCard(app))}
                  </div>
                )}
              </div>
            ) : selectedCategory === 'Highlights' ? (
              /* CONTINUOUS SMOOTH FLOW: HIGHLIGHTS -> CATEGORIES */
              <div className="space-y-12 animate-in fade-in duration-200">
                
                {/* 1. TOP 8 HIGHLIGHT SECTION (Visual Highlight Effect) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF9F5] to-amber-500/5 dark:from-[#1A1917] dark:to-amber-500/10 border-2 border-[#D97757]/40 shadow-md space-y-6 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D97757] text-white flex items-center justify-center shadow-sm">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-[#141413] dark:text-[#FAF9F5]">
                            Top 8 Recommended Essentials
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D97757] text-white uppercase tracking-wider">
                            Featured
                          </span>
                        </div>
                        <p className="text-xs text-[#8C897F] mt-0.5">
                          The curated core tools every student needs for daily academic workflow
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 Apps Per Row Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {top8Highlights.map((app) => renderAppCard(app, true))}
                  </div>
                </div>

                {/* 2. LMS & SCHEDULE SECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <Layers className="w-4 h-4 text-[#D97757]" />
                    <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      LMS &amp; Schedule
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_CATALOG.filter((a) => a.category === 'LMS & Schedule').map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 3. STEM & MATH SECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <Calculator className="w-4 h-4 text-cyan-600" />
                    <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Math &amp; Science (STEM)
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_CATALOG.filter((a) => a.category === 'STEM & Math').map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 4. VISUAL & DESIGN SECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Visual &amp; Design
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_CATALOG.filter((a) => a.category === 'Visual & Design').map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 5. STUDY & RETENTION SECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <Timer className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Study &amp; Retention
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_CATALOG.filter((a) => a.category === 'Study & Retention').map((app) => renderAppCard(app))}
                  </div>
                </div>

                {/* 6. WRITING & RESEARCH SECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Writing &amp; Research
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_CATALOG.filter((a) => a.category === 'Writing & Research').map((app) => renderAppCard(app))}
                  </div>
                </div>

              </div>
            ) : (
              /* SPECIFIC CATEGORY VIEW (2 APPS PER ROW) */
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                  <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                    {selectedCategory} ({categoryApps.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryApps.map((app) => renderAppCard(app))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );

  function renderAppCard(app: AppStoreItem, isHighlighted = false) {
    const isPinned = pinnedAppIds.includes(app.id);

    return (
      <div
        key={app.id}
        onClick={() => setViewingApp(app)}
        className={`bg-white dark:bg-[#1A1917] rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4 ${
          isHighlighted
            ? 'border-[#D97757]/40 hover:border-[#D97757]'
            : 'border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60'
        }`}
      >
        <div className="space-y-3">
          {/* Top Row: App Logo & Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AppLogo id={app.id} size="md" />
              <div>
                <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors leading-tight">
                  {app.name}
                </h3>
                <span className="text-[10px] text-[#8C897F] font-semibold">
                  {app.category}
                </span>
              </div>
            </div>

            {app.badge && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#D97757]/15 text-[#D97757] shrink-0">
                {app.badge}
              </span>
            )}
          </div>

          {/* Simple, Short, Demonstrative Description */}
          <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed line-clamp-2">
            {app.description}
          </p>
        </div>

        {/* Card Action Row */}
        <div className="pt-3 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
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
