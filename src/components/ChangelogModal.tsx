import React, { useState } from 'react';
import { X, Award, Sparkles, BookOpen, Layers, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export const CURRENT_VERSION = '2.4.0';

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
    version: '2.4.0',
    date: 'September 03, 2026',
    title: 'Study Smarter — Auto-Planner, Grade Simulator & 15 New Tools',
    badge: 'Latest Update',
    highlights: [
      'New one-tap focus planner — it looks at your free gaps and pending work, then suggests study blocks you can accept or drag around',
      'Grade simulator v2 — see what final-exam score you need, try “what if I drop my lowest quiz”, and plan your GPA across the semester',
      'Exam mode — countdown, a 14/7/2-day study plan, formula sheet starter, and a night-before checklist you can print',
      'Teacher follow-ups made easy — per-teacher cards show your last email and draft a polite follow-up in one tap',
      'Talk instead of type — voice dictation for essays and viva practice, plus listen-back in English, Vietnamese, Spanish or French',
      'Safer deletes — everything goes to a 30-day trash can, and your notes keep past versions you can restore',
      '15 new mini-apps — job tracker, budget, sleep-vs-focus, code runner, resume builder, flashcards that hide diagram labels, citation importer, study rooms and more',
      'Clearer privacy — tap any permission to see why we need it in plain words, revoke Google access, or wipe all data with one button',
    ],
    details: [
      'The focus planner (Schedule tab) reads your pending assignments and open calendar gaps between 8am and 10pm, then proposes blocks with breaks. Nothing is booked until you accept — drag any block to move it.',
      'Grade Forecaster now handles full courses: set your current score, target and final-exam weight to see the score you need, estimate GPA on the usual 4.0 scale, and simulate dropping your lowest quiz before you decide anything.',
      'Exam Mode builds a reverse plan from your exam date: broad review at 14 days, timed past papers at 7 days, formula-sheet-only at 2 days, plus a packing-and-sleep checklist the night before. Print it from the app.',
      'Teacher cards are built from your school email: last message, office-hours lines we spotted, and unread counts. The follow-up button drafts a short polite email you can edit before sending.',
      'Voice uses your browser’s built-in speech tools (free, nothing uploaded by us). Dictate a Feynman explanation or viva answer, then hear it back at slow speed to practice shadowing in a new language.',
      'Deletes are no longer permanent: assignments and notes sit in Trash for 30 days (Settings → Trash) and can be restored. Markdown notes also keep their last 20 versions automatically.',
      'New apps live in the App Store under Plan, Create, Learn and Research: Internship Tracker, Budget, Habit + Sleep, Timetable Optimizer, Code Runner (Python + JavaScript, no server), Resume Builder, Presentation Coach, Lab Report Builder, Essay Outliner, Image Occlusion flashcards, FSRS smart scheduling, Viva voice defense, Language Lab, Zotero import, Paper Chat and Dataset Finder.',
      'AI answers now show their sources (Canvas link, email, Drive file) under every reply, with a per-task model picker (light model for spam, strong model for essays), a token-usage meter, and optional Groq backup key for finals week. Add your own key in Settings → AI.',
      'Search is now one box for everything: Canvas, Gmail, Drive, notes and flashcards with a preview pane and actions (open, pin, make a task from an email). Press / to jump to it, ? to see all shortcuts.',
      'Getting started takes about a minute: connect Google, paste your Canvas feed (with a test button), pick up to 5 pinned apps. Sample data is now an explicit checkbox — we never mix demo data with your real work.',
      'Small screens get a bottom tab bar (Home, Tasks, Schedule, AI, More) plus a + button for quick-add. Printouts for rubrics, timetables and citations are clean one-pagers. Vietnamese translation covers the main screens (more coming).',
    ]
  },
  {
    version: '2.3.1',
    date: 'September 02, 2026',
    title: 'Clean & Simple — Menu, Pinned Tools & Easier Updates',
    badge: 'Latest Update',
    highlights: [
      'Top menu is now clean and simple — only your location, search, and AI Coach + notifications remain. No more clock, sync status, or extra buttons to distract you',
      'No more confusing “Academic Core” section — your 5 main tools (Canvas, Daily Schedule, Assignment Tracker, Gmail, and Drive) are now in “Pinned” and ready from day one. Add more from the App Store',
      'Google sign-in is more reliable — works even if your browser blocks popups, and shows clearer help if your account needs to be added as a test user',
      'Changelog is now easy to read — plain English with no tech jargon. Only the newest version shows “Latest” (fixed the bug where 4 versions said Latest)',
      'Small but important fixes: swipe to close the sidebar on mobile, bigger tap areas, smoother navigation, and clearer error messages',
    ],
    details: [
      'The top bar was too crowded. We removed the clock, date, sync spinning icon, music controls, focus timer, and collapse button. Now you just see where you are, a search box, and your AI Coach. Less to think about.',
      '“Academic Core” was just another name for your pinned apps, which was confusing. We removed it. Now you have one place — “Pinned” — with Canvas, Schedule, Tracker, Gmail, and Drive already pinned. You can pin or unpin anything from the App Store.',
      'Some students couldn’t connect Google — the login popup was blocked or showed a vague error. We now save your login more reliably, try a different login method if the popup is blocked, and show a clearer guide when Google asks to add your email as a test user.',
      'The update history used to be full of code words. We rewrote everything from version 2.0 onward in plain English so anyone can understand what changed. We also fixed the bug where four old versions incorrectly showed “Latest Update.”',
      'We also fixed small bugs: the mobile sidebar now closes with a swipe, buttons are easier to tap, notifications are less noisy, and the app handles offline mode more gracefully.',
    ]
  },
  {
    version: '2.3.0',
    date: 'September 02, 2026',
    title: 'Faster, Cleaner, and More Reliable',
    highlights: [
      'App loads noticeably faster — we cleaned up the code so the main download is smaller and tooltips appear quicker',
      'Works better offline — your assignments and notes save on your device and sync automatically when you are back online',
      'Cleaner look and easier on the eyes — softer colors, fewer themes to choose from, and smoother animations',
      'Tools are easier to find — grouped into Plan, Create, Learn, and Research, with “Why recommended?” hints like “Because you have Calculus”',
      'More reliable syncing with Canvas and Google — better handling when your internet is spotty or your login expires',
    ],
    details: [
      'We made the app lighter. Before, the main file was large and took longer to load. Now it is smaller, so the first screen appears faster, especially on slower connections.',
      'If you lose Wi-Fi in class or the dorm, your work is still safe. We save your assignments locally and try again automatically when you are online. If the same assignment was edited in two places, we now show a gentle reminder.',
      'We simplified the colors and themes. Instead of 7 choices, you now have a calm light and dark mode with one accent color, so the app feels consistent. Animations are smoother and respect your motion preferences.',
      'Landing page and app store are clearer. The main screenshot now loads early, the comparison table stays visible while you scroll, and the demo video no longer shows a confusing placeholder. The app store also explains why a tool is recommended for you.',
      'Behind the scenes, we improved how we talk to Canvas, Google Calendar, Gmail, Drive, and Sheets, so you see fewer errors and more up-to-date information.',
    ]
  },
  {
    version: '2.2.2',
    date: 'September 02, 2026',
    title: 'Fixed Blank Screen Bug',
    highlights: [
      'Fixed a bug where the app sometimes showed a blank screen instead of your dashboard',
      'Verified the fix on both computers and phones — the home screen now loads reliably',
      'No change to your data — just a stability improvement',
    ],
    details: [
      'Some students opened the app and saw only a blank background. This was due to a small coding mistake where the page tried to use a name before it was ready. We moved that code to the right place.',
      'We tested the fix by opening the app on different devices and screen sizes. The dashboard, hero, and footer now appear correctly every time.',
      'Your assignments, calendar, and emails were not affected. This was only a display issue.',
    ]
  },
  {
    version: '2.2.1',
    date: 'September 02, 2026',
    title: 'Less Clutter, Easier to Get Around',
    highlights: [
      'Removed floating buttons that got in the way on mobile',
      'All help and install options are now together in Settings → Help & Support',
      'Easier to find how to install the app or report a problem',
    ],
    details: [
      'We had floating “Install” and “Help” buttons that covered content on small screens. We removed them.',
      'You can now find everything in one place: open Settings, go to Help & Support, and you will see Install, feedback, and version info.',
      'This makes the app feel calmer, especially on phones.',
    ]
  },
  {
    version: '2.2.0',
    date: 'September 02, 2026',
    title: 'Major Cleanup — Speed, Design, and Everyday Fixes',
    highlights: [
      'Noticeably faster, especially on phones and slower networks',
      'Cleaner, more consistent design across light and dark modes',
      'Easier navigation with clearer menus and shortcuts',
      'Daily planner and assignment list are now better organized',
      'App store is simpler — easier to find and install tools',
    ],
    details: [
      'We trimmed the code, made the app store load only what you need, and reduced lag on phones. The app also handles slow or offline connections more gracefully.',
      'We unified colors, softened the background to be easier on the eyes for late-night studying, and made the spacing more consistent.',
      'We made the left menu clearer, improved the command palette (press Cmd+K or Ctrl+K), and added better keyboard shortcuts.',
      'Your daily plan now groups overdue, due today, and upcoming tasks more clearly, and the dashboard gives a quick glance at your day.',
      'The app store now shows 2 tools per row, highlights the top 8 essentials, and has better search.',
    ]
  },
  {
    version: '2.1.0',
    date: 'September 02, 2026',
    title: 'Better Organization and Navigation',
    highlights: [
      'Tools are now grouped more clearly: Plan, Create, Learn, Research',
      'Left menu shows your recent tools so you can jump back quickly',
      'Dashboard is simpler — welcome message and focus for the day front and center',
      'Assignment list is easier to drag, filter, and manage',
      'Canvas setup is clearer with better instructions',
    ],
    details: [
      'We reorganized the app so you always know where to find things. Plan is for schedules and tasks, Create for math and drawing, Learn for studying, Research for writing and reading.',
      'Your recently used tools now appear near the top of the menu, so you don’t have to hunt for them.',
      'The home screen now focuses on your greeting and today’s plan, with less scrolling needed.',
      'The assignment tracker now lets you drag tasks, filter more easily, and see clearer details.',
      'Connecting Canvas now has better guidance and shows your grades and upcoming work more clearly.',
    ]
  },
  {
    version: '2.0.0',
    date: 'September 01, 2026',
    title: 'A Fresh Start — StudentOS 2.0',
    highlights: [
      'A fresh, calmer design that’s easier on the eyes for long study sessions',
      'Faster and more reliable — works better even with spotty Wi-Fi',
      'All your school tools in one place: Canvas, Google Calendar, Gmail, Drive, and more',
      'Smarter help from AI — study plans, flashcards, and writing feedback that knows your actual assignments',
      'Built for phones as well as laptops — easier to use on the go',
    ],
    details: [
      'This was our biggest update. We rebuilt the app to be cleaner and faster, with a warm, soft background and a more consistent look across all pages.',
      'Your data now saves locally first, so you can keep working offline. When you’re back online, it syncs automatically.',
      'You can connect Canvas to pull in assignments and grades, see your Google Calendar and Gmail in one dashboard, and keep files organized with Drive.',
      'The AI coach can now make study plans based on your real deadlines, create flashcards from your notes, and give feedback on essays.',
      'We made sure the app works well on phones: easier to tap, no awkward zooming, and a menu that slides in and out smoothly.',
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
