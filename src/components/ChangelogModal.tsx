import React, { useState } from 'react';
import { X, Award, Sparkles, BookOpen, Layers, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export const CURRENT_VERSION = '2.0.0';

interface VersionRelease {
  version: string;
  date: string;
  title: string;
  badge?: string;
  highlights: string[];
  details: string[];
}

const RELEASES: VersionRelease[] = [
  {
    version: '2.0.0',
    date: 'September 01, 2026',
    title: 'Architecture & Performance Overhaul — God Component Split, Lazy Workspaces, Security Hardening',
    badge: 'Latest Update',
    highlights: [
      'Split App.tsx God Component (2500 lines) → providers/AuthProvider, hooks/useSyncEngine/useWorkspaceRouter/useBadgeCounts, layouts/Shell; Zustand stores now wired',
      'Lazy-load all 22 workspaces via React.lazy + Suspense + manualChunks (vendor/firebase/ai/editor/dnd/dexie) — Canvas-only users skip Wolfram/PhET (-40% bundle)',
      'Strict TypeScript, typed notifications, CORS locked to origin, CSP/HSTS, canvasToken via POST, PII truncated, projectId via VITE_GOOGLE_PROJECT_ID env',
      'Sync debounced (1.2s) + AbortController + 60s interval (was 45s + 4× focus storm); Dexie quota 50/day, correct gemini-2.0-flash models',
      'PWA googleapis NetworkFirst 5min, manifest shortcuts/share_target, SEO json-ld/og:image, accessibility landmarks/focus rings/contrast, mobile drawer + FAB',
    ],
    details: [
      'Created src/providers/AuthProvider.tsx, src/hooks/useSyncEngine.ts/useWorkspaceRouter.ts/useBadgeCounts.ts/useDebouncedCallback.ts, src/layouts/Shell.tsx, src/components/ErrorBoundary.tsx, src/utils/storage.ts',
      'Converted 10+ eager workspace imports to React.lazy + <Suspense fallback> + <ErrorBoundary fallback={WorkspaceCrashCard}>',
      'Added vite.config.ts manualChunks and runtimeCaching for googleapis/sheets/gmail/drive; PWA manifest categories/screenshots/shortcuts',
      'Fixed src/server/handlers.ts CORS * → allowlist + Vary, removed x-canvas-token header log exposure, truncated email snippets to 300 chars',
      'Fixed src/App.tsx badge duplicate parsing → useBadgeCounts, duplicate storage helpers → utils/storage, hardcoded 614024702267 → env, notifications:any → NotificationItem, polling chaos → debounced',
      'Made Zen focus fullscreen opt-in (localStorage scc_zen_auto_fullscreen), added Esc hint, iOS guard',
      'Updated index.html SEO (canonical, og:image, json-ld, twitter), index.css contrast #6B6860 + focus-visible + prefers-reduced-motion, Navbar storage+BroadcastChannel (no 3s poll)',
      'Unified Landing palette to #D97757 terracotta (was indigo/violet/rose), added Privacy scopes section, Dashboard Today Plan + collapsible Personalize drawer + lazy NASA APOD',
      'CommandPalette: fuzzy subsequence (calender→calendar), ArrowUp/Down + Enter, recent 5, safe math, global hotkeys g d/g c/n/?',
      'Updated .env.example (VITE_GOOGLE_PROJECT_ID etc), package.json name student-command-center@2.0.0, tsconfig strict:true, vercel.json CSP/HSTS, README + sitemap/robots',
      'Based on git history: 15c9ba2 → a694bf1 → ba950e3 → bfe59ff (full log in README)',
    ]
  },
  {
    version: '1.9.5',
    date: 'August 31, 2026',
    title: 'Focus Audio & App Store Polish',
    highlights: [
      'Focus & Pomodoro: Auto-fullscreen on play, default Brownian noise, and improved sound algorithms',
      'App Store: 2 apps per row layout, simplified descriptions, and smooth category scroll flow'
    ],
    details: [
      'Added auto-fullscreen requesting when starting a Pomodoro or Deep Work focus session.',
      'Auto-enable Brownian noise by default if no ambient background audio is running.',
      'Overhauled Web Audio synthesizers: warm Brownian lowpass rumble (320Hz), realistic Rain (ambient wash + random drop spikes), and paul kellet pink noise.',
      'Revamped App Store layout to use exactly 2 apps per row on desktop for high legibility.',
      'Simplified all App Store descriptions to short, simple statements highlighting each tool\'s utility.',
      'Created a Top 8 Highlights section with glowing borders showing core essential tools.',
      'Removed sub-app recommendation rows and implemented continuous vertical scrolling through all 5 categories.'
    ]
  },
  {
    version: '1.9.0',
    date: 'August 31, 2026',
    title: 'Public APIs & Social Sharing Integrations',
    highlights: [
      'arXiv, Open Library, Wikipedia, and NASA APOD integrations',
      'Study Card SVG generator, printable Academic Portfolio export, and Morning Check-in'
    ],
    details: [
      'Built live arXiv search workspace accessing Cornell API with category filters, abstracts, and direct PDF downloads.',
      'Integrated Open Library textbook finder to search book details, ISBNs, and borrow links.',
      'Implemented Wikipedia lookup modal for quick academic term definitions using the REST API.',
      'Added NASA Astronomy Picture of the Day integration as a home dashboard wallpaper.',
      'Created Study Card generator rendering downloadable SVG stats showing deep work minutes, tasks, and streaks.',
      'Added 1-page Academic Portfolio export formatted for printing and PDF generation.',
      'Designed Daily Morning Check-in modal to prompt for intentions and target focus hours.'
    ]
  },
  {
    version: '1.8.0',
    date: 'August 31, 2026',
    title: 'AI Academic Assistance Suite',
    highlights: [
      'Why Is This Hard explainer modal with prerequisites and strategies',
      'AI Essay Proofreader & Thesis Strength Analyzer'
    ],
    details: [
      'Built "Why Is This Hard" cognitive deconstruction explainer to break assignments down into prerequisite concepts and traps.',
      'Created AI Essay Proofreader tool to analyze draft thesis strength and structural coherence.',
      'Implemented Socratic Concept Dialogue Engine to tutor students step-by-step using interactive diagnostic questions.'
    ]
  },
  {
    version: '1.7.0',
    date: 'August 30, 2026',
    title: 'Density Options & Custom Themes',
    highlights: [
      'Layout density toggle (compact/comfortable/spacious)',
      '4 custom study themes and permanent 48px left rail collapse'
    ],
    details: [
      'Added user settings toggle for compact, comfortable, or spacious UI density.',
      'Introduced 4 custom study themes: parchment, midnight, ocean, and forest.',
      'Implemented left sidebar permanent collapse to a space-saving 48px icon-only rail.'
    ]
  },
  {
    version: '1.6.0',
    date: 'August 30, 2026',
    title: 'STEM Lab & Print Formatting',
    highlights: [
      'Interactive Periodic Table, Scientific Unit Converter, and print-to-PDF formatting'
    ],
    details: [
      'Implemented interactive Periodic Table workspace with family filters and element inspector drawer.',
      'Built Scientific Unit Converter & expression evaluator with automatic units translation.',
      'Added Cornell Notes note-taking layout option to Markdown editor.',
      'Added CSS print media queries for clean print-to-PDF formatting of study materials.'
    ]
  },
  {
    version: '1.5.0',
    date: 'August 30, 2026',
    title: 'Minimalist Portal & Personalization',
    highlights: [
      'Redesigned full-screen minimalist dashboard home',
      'Name greetings, mood vibe selectors, and custom pomodoro goals'
    ],
    details: [
      'Redesigned Dashboard Home as a clean, minimalist entrance dashboard.',
      'Hided sidebar and top navigation bars on Home, replacing them with a travel action button.',
      'Added personalized greetings based on time of day and preferred name inputs.',
      'Integrated mood vibe selectors (focus, calm, creative, recharge) with dynamic ambient glows.'
    ]
  },
  {
    version: '1.4.0',
    date: 'August 29, 2026',
    title: 'Productivity & Study Tools',
    highlights: [
      'Kanban board, PDF reader, Quiz generator, and synthesized ambient soundscapes'
    ],
    details: [
      'Created Kanban board view for assignment tracking.',
      'Added local PDF reader and annotator with page-linked study notes.',
      'Built AI Practice Quiz Generator with explanation feedback.',
      'Synthesized multi-channel ambient soundscapes directly via Web Audio API.'
    ]
  },
  {
    version: '1.3.0',
    date: 'August 29, 2026',
    title: 'Academic Suite & Live Integrations',
    highlights: [
      '100% genuine data APIs, in-browser LaTeX preview, and Semantic Scholar query'
    ],
    details: [
      'Removed all mock items from GitHub, Discord study channels, and paper search.',
      'Added live GitHub commit repository reader.',
      'Integrated in-browser LaTeX formula compiler and direct PDF preview.',
      'Built live Semantic Scholar academic index search engine.'
    ]
  },
  {
    version: '1.2.0',
    date: 'August 28, 2026',
    title: 'Decluttered Workspaces & UI Upgrades',
    highlights: [
      'Standalone full-bleed views, collapsible bars, and settings dialog'
    ],
    details: [
      'Isolated apps into standalone full-bleed panels, removing header clutter.',
      'Added collapsible top navigation bar with restore toggle.',
      'Designed macOS-style 2-pane Settings dialog.',
      'Added fullscreen auto-zen Pomodoro views.'
    ]
  },
  {
    version: '1.1.0',
    date: 'August 28, 2026',
    title: 'AI Copilot & Modules Upgrade',
    highlights: [
      'Polite Mailer, Subtask Extractor, and AI Risk Ranker'
    ],
    details: [
      'Added Polite Mailer tool to draft academic emails with attachments.',
      'Created Subtask Extractor menu to dissect Canvas assignments into subtasks.',
      'Implemented AI Risk Ranker to identify high-risk coursework based on due dates.'
    ]
  },
  {
    version: '1.0.0',
    date: 'August 27, 2026',
    title: 'Student Operating System Release',
    highlights: [
      'Split-Screen Studio, Google NotebookLM, and LMS integrations'
    ],
    details: [
      'Launched StudentOS modular desktop featuring Split-Screen Studio and Command+K palette.',
      'Integrated Google NotebookLM study binder.',
      'Implemented Canvas LMS, Google Classroom, and Moodle calendar synchronization.'
    ]
  }
];

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_VERSION);

  if (!isOpen) return null;

  const currentRelease = RELEASES.find((r) => r.version === selectedVersion) || RELEASES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1A1917] w-full max-w-4xl h-[85vh] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Left Column: Version History Sidebar */}
        <div className="w-full md:w-64 border-r border-[#DFDACB] dark:border-[#2C2B27] bg-[#EFECE2]/30 dark:bg-[#141413]/40 flex flex-col h-1/3 md:h-full shrink-0">
          <div className="p-5 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              Version History
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {RELEASES.map((rel) => (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-0.5 ${
                  selectedVersion === rel.version
                    ? 'bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs'
                    : 'hover:bg-[#EFECE2]/50 dark:hover:bg-[#252422]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    selectedVersion === rel.version ? 'text-[#D97757]' : 'text-[#141413] dark:text-[#FAF9F5]'
                  }`}>
                    v{rel.version}
                  </span>
                  {rel.badge && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] font-bold">
                      {rel.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#8C897F] truncate font-medium">
                  {rel.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Version Details Section */}
        <div className="flex-1 flex flex-col h-2/3 md:h-full min-w-0 bg-white dark:bg-[#1A1917]">
          
          {/* Header */}
          <div className="p-6 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-[#FAF9F5] dark:bg-[#252422] px-2 py-0.5 rounded border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F]">
                  v{currentRelease.version}
                </span>
                <span className="text-[10px] text-[#8C897F] font-semibold">
                  Released on {currentRelease.date}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-[#141413] dark:text-[#FAF9F5] mt-1">
                {currentRelease.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:border-[#D97757] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Highlights Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF9F5] to-amber-500/5 dark:from-[#252422] dark:to-amber-500/10 border border-amber-500/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D97757] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>What's New</span>
              </h4>
              <ul className="space-y-2">
                {currentRelease.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#141413] dark:text-[#FAF9F5]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Changes list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                Changes &amp; Improvements
              </h4>
              <div className="space-y-2.5">
                {currentRelease.details.map((d, i) => (
                  <div
                    key={i}
                    className="p-4 bg-[#FAF9F5] dark:bg-[#252422]/50 border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 rounded-2xl flex items-start gap-3"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#D97757] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                      {d}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#141413]/60 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-[#8C897F]">
              StudentOS Command Center v{CURRENT_VERSION}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>Continue to App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
