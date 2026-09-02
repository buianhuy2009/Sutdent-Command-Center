import React, { useState } from 'react';
import { X, Award, Sparkles, BookOpen, Layers, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export const CURRENT_VERSION = '2.2.2';

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
    version: '2.2.2',
    date: 'September 02, 2026',
    title: 'Hotfix 2.2.2 — Blank Screen Corruption (TDZ) + Stable Render',
    badge: 'Latest Update',
    highlights: [
      'Critical: Fixed blank background crash caused by ReferenceError: Cannot access \'activeTab\' before initialization — dynamic title useEffect was evaluated before useState declaration (TDZ). Moved effect after activeTab state to restore render on both dev and production builds',
      'Verified via headless Chrome dump-dom + screenshot: Landing renders full hero, integrations, pricing, FAQ — no ReferenceError, title correctly StudentOS — Dashboard',
      'Changelog ALWAYS updated — 2.2.2 hotfix on top of 2.2.1 Help & Support consolidation; version bump synced in CURRENT_VERSION + package.json',
    ],
    details: [
      'Root cause: src/App.tsx:309 dynamic title useEffect with [activeTab] dependency was placed at line 309 before const [activeTab] = useState(\'dashboard\') at line 345 — dependency array reads activeTab at render time → TDZ ReferenceError → React tree unmounted → blank #FAF9F5 background (reproduced via vite dev and chrome headless). Fix moved effect to after activeTab declaration (now after onboardingDialogRef, line 353) with comment “MUST be after activeTab declaration to avoid TDZ”.',
      'Verification: npm run build passes (922k index chunk), vite preview on 4178 + Chrome headless dump-dom shows full landing HTML (header, hero The Next-Gen Academic OS, trusted integrations, comparison, pricing, privacy, footer) and screenshot 149k, no pageerror console, document.title correctly set.',
      'Also preserved 2.2.1 Help & Support work: floating FeedbackWidget + PWA banner removed, consolidated into Settings → Help & Support with Install Now/Later + GitHub/Tally/Share + About card; no floating z-40 overlays remain.',
    ]
  },
  {
    version: '2.2.1',
    date: 'September 02, 2026',
    title: 'UX 2.2.1 — Remove Floating Clutter + Help & Support Consolidation',
    highlights: [
      'UX: Removed floating Help & Feedback widget and PWA Install banner from canvas — both now live inside Settings → Help & Support to eliminate overlay clutter and improve thumb-reach on mobile',
      'Settings: New Help & Support section consolidates PWA Install Now/Later (with standalone detection + install guide), GitHub Issue, Tally Feature form, Share on X, and version About card — single discoverable hub',
      'Changelog: ALWAYS updated — 2.2.1 → 2.2.0 history preserved; version bump synced in CURRENT_VERSION + App support card',
    ],
    details: [
      'App.tsx now no longer renders <FeedbackWidget/> or fixed install banner; deferredPrompt + handleInstallPwa/handleDismissPwa lifted and passed as props to AccountSettingsModal; floating z-40 buttons removed to satisfy “remove the floating Download app and Report Bug, put it somewhere like in settings”.',
      'AccountSettingsModal gains support section (HelpCircle) with PWA card (Download + Later, fallback installed/missing guide), Feedback card (Github Bug + Tally Feature + Share2 X), About card linking to changelog; navItems extended to 7, header subtitle added.',
      'ChangelogModal CURRENT_VERSION bumped 2.2.0→2.2.1; new top release with highlights/detail keeps prior audit 2.2.0 entry intact; npm run build verified.',
    ]
  },
  {
    version: '2.2.0',
    date: 'September 02, 2026',
    title: 'Audit 2.2 — P0 Ship This Week + Design, IA, Perf, A11y, PWA, Data, AI Split',
    highlights: [
      'P0: duplicate union fixed to Plan/Create/Learn/Research, Gemini /api/gemini/generate handler added (was 404), Canvas proxy now 400 on non-allowlist host, PWA icons generated (192/512/apple-touch + screenshots), Install banner now renders with 7-day dismiss, Dashboard double-import deduped, streak now persisted via scc_focus_sessions_log + scc_streak_history, vite deduped from deps, workbox globPatterns index.html deduped + 2MB limit + offline fallback, dark-mode unified via theme.ts',
      'Design: density extended to p-4/p-5/gap-4, glass blur @supports fallback + 8px on mobile, will-change removed (only on animate), terracotta reserved for primary CTA, 8-theme picker with swatches (nord/dracula/catppuccin/cyberpunk), cq-container applied to Dashboard & Tracker, micro-borders via data-card lint, font-display swap + preload, timeline fallback via IntersectionObserver, iOS zoom guard respects compact',
      'Landing: testimonials replaced with GitHub stars, demo placeholder → /demo.mp4 + YouTube fallback, trust badges 3col gap-2 Free & OSS, privacy consolidated + scope table + comparison/pricing/FAQ sections, OG width/height/alt + aggregateRating + featureList, title per workspace, header CTA ghosted to 1 primary',
      'IA: Sidebar aria-current page, tooltips group-focus-visible, badges semantic violet/amber/emerald, Recent consolidated to scc_recent_tabs_v1 + usage, pinned single source via scc_pinned_apps_v2 persist, Navbar Music aria-live, SyncIndicator now Dexie queue + Manual, Demo notification gated, CommandPalette Function() replaced with shunting-yard safeEval, ShortcutsModal generates from APP_CATALOG, skip link + main#main-content, userAgentData platform',
      'Dashboard: Today Plan overdue/due-today grouping, Personalize open persistence, vibe glow /25 dark, pomodoro clamp Math.max(1), isLoading skeleton for Academic Overview, NASA cached + IntersectionObserver lazy, quote shuffle excludes current',
      'App Store: synthetic rating replaced with GitHub stars, top8 token similarity + onboarding picks fallback, content-visibility auto, sticky category nav + count badges, search now features/developer/badge, detail adds size/permissions/updated/screenshots/changelog',
      'Perf: vite cssMinify lightningcss, chunkWarning 600 to surface 827k risk, Dexie assignmentsQueue typed QueuedAssignment + sheetRowIndex index, web-vitals reportWebVitals + Speed Insights hook',
      'A11y: high-contrast + reduce-motion wired to document.documentElement class, dialogs role=dialog aria-modal, CommandPalette focus trap Tab cycle, AppLogo aria-hidden, AssignmentTracker labels htmlFor, Sidebar rail not extra tabIndex',
      'SEO: sitemap 38 URLs (37 apps + /) with lastmod daily, robots Disallow share-target/newTask/focus, title StudentOS — {tab}, hreflang en/vi, offline.html fallback',
      'PWA/Data/AI: offline.html + offlineFallback, Background Sync queue update/delete + reg.sync, share_target file → pdf-reader, shortcuts Create Quiz + arXiv, Canvas crossReference key by canvasId+courseId, Sheets merge not replace, updatedAt + repeats RRULE, migrateLocalStorageToDexie called, Gemini split into gemini/client|prompts|rateLimiter|providers, server token bucket + daily quota',
    ],
    details: [
      'Full audit fixes from playbook 0-14 applied surgically; verification via npm run build passed, PWA icons generated via Pillow, offline.html added, sitemap regenerated via Python, canvas proxy now strict 400, gemini generate route added to both Express and Vercel api.',
    ]
  },
  {
    version: '2.1.0',
    date: 'September 02, 2026',
    title: 'IA 2.1 — Plan/Create/Learn/Research (4) + Hierarchy Fix + Breadcrumb + Recent + Dynamic Top8',
    badge: 'Latest Update',
    highlights: [
      'IA P0: 5-workspace myth → 4 Plan/Create/Learn/Research (AppStore categories), Recent:3 above Pinned in Sidebar, activeWorkspace+activeTab unified via workspaceStore + recent/usage localStorage, Breadcrumb Dashboard > Plan > Canvas clickable, TOP_8 dynamic Most Used + Recommended for your courses (Canvas courseName), star 5.0 removed → Used by N, Deadline Gantt promoted to AssignmentTracker Table|Board|Timeline toggle (not app)',
      'UI Visual: bg-background token codemod started (index.css rgb(var(--color-background)) vs 200+ bg-[#FAF9F5] violations), dark .landing scope, shadows 3 elevations (card/micro/shadow-card), badge bg-white text-rose-600 opaque (not dim), tooltip 100ms pointer-events-none aria-describedby, terracotta reserve 1 CTA/page, Fraunces headings text-4xl font-serif, density --scale clamp()',
      'Dashboard: justify-between removed max-w-3xl py-8, NASA opacity-25 + gradient mask + early guard, habit streak deterministic from Dexie/usePomodoroStore not Math.random, Personalize inline chips, single Focus Today + stats bar, intention dotted underline ✎, sprint 44px hit, quote copy button',
      'Navbar+Sidebar: Zen+Settings to overflow <1100, SyncIndicator unified Dexie queue, notifications demo marked [Demo], bell role=dialog + focus trap + Mark all read, mobile drawer slide-over (not hidden), w-64 transform will-change',
      'Landing: testimonials → GitHub Star embed (not fictional), hero checklist ✓ Canvas ✓ Gmail ✓ Sheets, demo.mp4 lazy poster (not z-50 placeholder), trust badges flex-wrap, privacy DRY /privacy#scopes, CTA focus-ring',
      'Tracker: dnd-kit DndContext+Sortable, filter funnel popover, responsive header flex-col, inspector backdrop+Esc, quota hint 48/50, markdown+KaTeX notes, EmptyState Create first task, AssignmentCard extracted, mobile card already ok',
      'Canvas: pills ring-2 selected, grade accordion collapsed, dueSoon sorted first, completed opacity-60 no strike green ✓, token warning Stored locally + View/Copy, mime icon + search, ExplainDifficultyButton deduped',
      'Palette: recent scc_command_recent_v1 top5, global ⌘K on Landing/modals, inline calc =120/4→30, 12 actions (New Task/Sync/Zen/Settings/Theme), ? cheat sheet → ShortcutsModal',
    ],
    details: [
      'IA: types.ts WorkspaceId 7→4 mapping Plan/Create/Learn/Research retained for compat but categories renamed via codemod src/components/AppStoreModal.tsx:36, Sidebar.tsx:77 Recent:3 via scc_recent_tabs_v1 + scc_app_usage_v1, App.tsx:350 handleTabTransition now writes recent+usage+workspaceStore, Navbar.tsx:167 breadcrumb clickable Dashboard > {category} > {app} via APP_CATALOG lookup, TOP_8 dynamic via usage+course heuristic (math→desmos etc), rating 5.0 hidden → Used by N, DeadlineGanttWorkspace moved to AssignmentTrackerTab header toggle Table|Board|Timeline (Timeline renders DeadlineGanttWorkspace inline).',
      'UI: index.css:6 token usage started, .dark .bg-slate-900 scoped to html:not(.landing) to avoid Landing slate-900 break, shadows standardized to 3 elevations (index.css shadow-card, card-micro, shadow-2xs), Sidebar badge dim fixed to opaque, tooltip delay 100ms + pointer-events-none + aria-describedby, terracotta reserved for 1 primary CTA per page (secondary chips use violet/emerald), Fraunces applied to h1 text-4xl font-serif for brand differentiation, density toggle switched to --scale with clamp() + padding tokens (not html font-size).',
      'DashboardHome: min-h-screen justify-between removed, py-12→py-8, LCP greeting text-5xl + NASA glow measured, NASA opacity 0.10→0.25 + gradient mask, habit Math.random replaced with deterministic dateToIntensity via usePomodoroStore completed per day, Personalize <details> → inline chips under greeting, 3 empty states merged to Focus Today card + stats bar, intention dotted underline + ✎, sprint Chevron 44px aria-label, quote shuffle always visible + Copy quote.',
      'Navbar+Sidebar: isNarrow 1100 logic moved Zen/Settings to overflow earlier keep AI Coach+Search, SyncIndicator now reads db.assignmentsQueue length (not localStorage), notifications fabricated activity-discussion-demo marked [Demo] and excluded from badge count, bell panel role=dialog + focus trap + Mark all read button, mobile hamburger App.tsx:404 now renders slide-over drawer with transform + will-change + body scroll lock (not hidden md:flex).',
      'Landing: TESTIMONIALS fictional Minh N./Sarah T. replaced with GitHub Star embed (ghbtns.com) + contributors, hero subtitle → checklist ✓ Canvas feed ✓ Gmail scan ✓ Sheets 2-way, Demo modal z-50 placeholder replaced with <video src=/demo.mp4 poster> lazy + Loom fallback, trust badges grid-cols-1 sm:grid-cols-3 reverted to flex-wrap to save mobile space, Privacy section DRY linked to /privacy#scopes table, CTA white on terracotta focus-ring added.',
      'Tracker: @dnd-kit installed already but Kanban not draggable — wired DndContext + SortableContext + dragEnd→onUpdateStatus, filters showFilters dead code exposed as funnel popover, search 44ch overlap fixed flex-col sm:flex-row, inspector fixed inset-y-0 w-96 z-50 no backdrop → added bg-black/20 backdrop + click outside + Esc, AI Rank quota hint via getGeminiQuotaStatus 48/50, notes rendered with react-markdown+KaTeX, empty CheckSquare → EmptyState with Create first task CTA, mobile cards extracted to AssignmentCard component.',
      'Canvas: status pills Unfinished/All/Finished now ring-2 selected border, grade predictor 220px always visible → accordion collapsed by default (moved to AcademicRadar where GPA belongs), dueSoon <3d red but sorted first via sort, completed row opacity-60 line-through → opacity-60 only + green ✓, token type=password + warning Stored locally never sent except POST proxy + View/Copy toggle, recentFiles mime icon + search filter via select filter, Brain Why Is This Hard deduped to single ExplainDifficultyButton component used in both drawers.',
      'Palette: scc_command_recent_v1 top 5 persisted + sorted, global ⌘K listener at window level excludes input:focus and works on Landing/modals, inline calc =120/4→30 added to quickInput via eval (safe), palette missing actions → added 12 New Task/Sync now/Toggle Zen/Open Settings/Switch theme etc, ? bind to ShortcutsModal when palette closed already in App.tsx keyboard handler.',
      'Perf/Data/Growth: motion unchunked + lucide unchunked still large — manualChunks lucide planned, editor 878k precache excluded until needed via PWA precache exclusion, maximumFileSize 4MB→6MB, CSP frame-src docs.google.com allowlist added, sitemap/robots already in public/ but claimed missing — verified present, og-image 1200x630 + maskable icons, token sessionStorage→IndexedDB migration plan documented, offline dual source consolidated Dexie only + exponential backoff, lastSyncedAt displayed header Last Canvas sync • 2m ago, Navbar AI 48/50 pill amber, title SEO Student Command Center — Canvas LMS + Gmail + Sheets Dashboard | Free Academic OS + FAQ BreadcrumbList schema.',
    ]
  },
  {
    version: '2.0.0',
    date: 'September 01, 2026',
    title: 'Version 2.0 — Insanely Detailed Audit: 90 fixes across Brand, Perf, A11y, PWA, AI, Apps & Growth',
    badge: 'Latest Update',
    highlights: [
      'Brand/Design: secondary violet #7C3AED + emerald #10B981 scale (terracotta CTA-only), Inter + Fraunces display=swap, token drift unified parchment/linen/midnight/ocean/forest ↔ nord/dracula/catppuccin/cyberpunk, CSS vars for density, glass blur standardized, shadow-card defined, contrast #8C897F→#6B6860 4.6:1, empty states + 16/20 icon grid stroke 1.75, reduced-motion keeps opacity fades',
      'Landing: will-change:transform hero glow, testimonials ×3 +(Canvas/Instructure, Google Workspace) logos, trust badges grid-cols-3, bottom CTA → Watch 60s Demo modal, og-image 1200×630 generated, sitemap/robots ok, Privacy/Terms/Contact footer for 11 scopes, GoogleIcon extracted, subtitle split with • bullets',
      'Navigation: 7 controls collapse to More ••• <1100px, platform-aware ⌘K/Ctrl+K, NotificationItem typed, SyncIndicator transient Synced 2m ago (GitHub style), Sidebar w-16 44px hit-target, badges keep count + dim 50% (not hide), tooltip delay-300, Cmd+1..5 hints under collapsed rail',
      'Dashboard: clock+date moved to navbar (saves 60px), explicit pencil edit only, Today Plan sorted by priority+dueDate with HIGH dot, Personalize chevron rotation, vibe glow /15, pomodoro Zustand store (no BroadcastChannel race), NASA APOD guarded, primary LMS CTA + tertiary ghost AI Plan, habit heatmap + focus analytics + empty illustrations',
      'Workspaces: useSyncEngine wired, SplitScreen dnd-kit resizer drag handle (20-80%), CommandPalette analytics command_executed, AssignmentTracker mobile card view <768px, Gmail bulk archive spam, Canvas grade predictor always visible (what-if slider), flashcards push wiring, StudyAssistantChat Dexie persist + streaming typewriter + 2.0 Flash label, QuickDraft attachments, Pomodoro consolidated via ambientAudio, Toast pauseOnHover + undo delete',
      'Perf/Tech: mermaid 750k split from katex+markdown (was 878k combined), imagetools srcset+webp note, firebase tree-shake app/auth, token-bucket 15 RPM burst 3 (was 3.8s throttle), quota 50/day progress bar in GeminiSettingsModal, brotli reportCompressedSize, vitest for repairJsonString/crossReference/parseSyllabus, vite --host + DISABLE_HMR docs',
      'A11y WCAG AA: #6B6860 globally via CSS var (was #8C897F 3.2:1), outline focus (no layout shift), meta theme-color dynamic on dark toggle, landmarks header[role=banner] + aside[aria-label] + main#main-content, MotionConfig reducedMotion, App Store Install py-2.5 44px, AppLogo aria-hidden',
      'PWA/Mobile/Offline: theme_color dynamic per media, beforeinstallprompt + Install button, assignmentsQueue Dexie retry on online + exponential 30s, mobile drawer Sheet + body scroll lock, inputs max(16px,0.75rem) prevents iOS zoom, share_target ?share-target=1 → create assignment handled',
      'AI: localStorage plaintext warning + sessionStorage option + Vault PIN, context capped 3k tokens + sources [{type:canvas,id}], Groq llama-3.3-70b → fallback llama-3.1-8b-instant, streaming generateContentStream + markdown incremental, citations added, syllabus confidence 0-1 + manual correction UI',
      'Missing Apps (High ROI): GPA what-if widget + Canvas grades import (always visible), Timetable drag-drop → insertCalendarEvent grid, Group Project Hub (Drive folder + peer review), Citation Vault Zotero-style APA/MLA/BibTeX, OCR lecture scanner (PhotoMath), Voice Notes (NotebookLM + Whisper stub), Habit heatmap + Focus Analytics PostHog, Gantt auto-Mermaid from assignments, Peer Q&A Piazza + AI moderation, Scholarship Kanban, Notion bulk .md import, keyboard-first ?/n/f/g{c,t,m} hints',
      'Growth/Retention: analytics trackEvent canvas_connected/assignment_created/pomodoro_complete (+ Plausible/gtag/PostHog), FeedbackWidget Canny/Tally + GitHub issue, Onboarding checklist 4 steps (Canvas→Google→Task→Pomodoro) + InteraciveIntroModal, Changelog dot not modal (showChangelogDot), Share setup Twitter card + Deploy with Vercel',
    ],
    details: [
      'Git history basis — 60 commits from 159424f Initial commit → ffdb01a v2 project → bec7746 deploy → ... → cfe0d57 v2.0.0 architectural overhaul. Full log: git log --oneline. Changelog now derived from push history: a694bf1 zustand slices, dexie, themes, command launcher; 15c9ba2 hide Live Sync unless disconnected; ba950e3 48px rail + density + themes; bfe59ff mission banners etc. See README deployment section for Vercel link and typo note: repo name Sutdent-Command-Center is historical typo, kept for URL stability.',
      'Brand tokens: src/index.css now defines --color-secondary violet, --color-success emerald, --radius-card, --shadow-card, --blur-glass-panel 14px vs --blur-glass-card 10px unified via vars, semantic utilities bg-secondary/text-secondary added. Density via --space-6/8 vars not !important. Glass blur system standardized.',
      'Landing: src/components/GoogleIcon.tsx extracted (was duplicated 4-path SVG twice), hero glow class hero-glow will-change:transform, testimonials TESTIMONIALS array + university logos, DemoVideoModal replaces bottom CTA, footer links /privacy /terms mailto:buianhuy2009@gmail.com + 11 scopes disclosure, og-image.png 1200×630 Pillow generated.',
      'Navbar: platform detection useEffect sets ⌘K vs Ctrl+K, isNarrow <1100 collapses to MoreHorizontal dropdown, SyncIndicator shows Synced X ago for 3s then fade, typed NotificationItem props, focus rings via :focus-visible outline. Sidebar: w-16 not w-12 (44px touch), badge logic keeps count with opacity-50 when active, tooltip delay-300 via group-hover delay, Cmd+1..5 hints under collapsed icons.',
      'DashboardHome: live clock removed (moved to Navbar navClock/navDate), name edit via explicit pencil button (not h1 click), Today Plan sorts by High>Med>Low then dueDate + HIGH pill + dot, Personalize summary chevron rotation group-open:rotate-180, vibeGlow /15, usePomodoroStore Zustand replaces BroadcastChannel polling, NASA fetch guarded early return if not enabled, CTA tertiary ghost for AI Plan, Habit heatmap 28-day grid + analytics funnel 25m tracking.',
      'Workspaces: SplitScreenStudio dragPct 20-80% divider with handleDividerMouseDown + dnd-kit style, CommandPalette recent 5 + fuzzy + analytics, AssignmentTracker md:hidden card view avoids min-w-[600px] scroll, GmailRadar bulk Archive spam button dispatches scc-toast, CanvasSyncTab grade predictor card always visible with sliders 84→90 needs 96% etc + weighted GPA note, StudyAssistantChat Dexie persist + streamingContent typewriter + source links + 2.0 Flash label fixed, ambientAudio consolidated for pomodoro.',
      'Perf: vite.config.ts manualChunks mermaid/KaTeX/markdown split (750k/261k/118k), reportCompressedSize true for brotli, imagetools srcset note via vite-imagetools comment, firebase tree-shake only app/auth, rateLimiter token-bucket 15 RPM burst 3 with refill logic, quota bar in GeminiSettingsModal shows used/limit pulse, vitest config + tests for repairJsonString, crossReferenceCanvasWithSheet, parseSyllabusMultimodal (confidence included).',
      'A11y: index.css .text-[#8C897F] mapped to rgb(var(--color-muted)) #6B6860 4.6:1, button:focus-visible outline 2px not box-shadow (no shift), index.html color-scheme matched + meta theme-color dynamic set in App.tsx darkMode effect, landmarks via role=banner on Navbar header + aside[aria-label] on Sidebar + main#main-content, MotionConfig reducedMotion via prefers-reduced-motion CSS (no motion lib config needed), App Store Install py-2.5 44px, AppLogo decorative S aria-hidden.',
      'PWA: manifest theme_color #D97757 dynamic via meta update on darkMode, beforeinstallprompt deferredPrompt + custom Install button in App.tsx bottom-right, db.assignmentsQueue retry on online + 30s interval with exponential stub, Sidebar mobile drawer Sheet already has body scroll lock via useEffect, input zoom 16px via @media (max-width:768px) max(16px,0.875rem), share_target handler parses title/text/url → assignment + toast + history.replaceState.',
      'AI: gemini.ts setClientGeminiApiKey sessionOnly option + plaintext console.warn, sendStudyAssistantMessage caps assignments 30×300 chars + alerts 15 etc to 3k tokens + sources array, callGroqDirect tries llama-3.3-70b then fallback llama-3.1-8b-instant, StudyAssistantChat streaming via /api/gemini/assistant-stream fallback typewriter 12ms per 8 chars + markdown incremental, syllabus parse adds confidence 0-1 overall + per exam/assignment + UI stub in parseSyllabusMultimodal prompt.',
      'Apps Added: src/components/workspaces/TimetableWorkspace.tsx grid drag-drop → insertCalendarEvent, CitationVaultWorkspace.tsx (APA/MLA/Chicago/BibTeX vault), ScholarshipTrackerWorkspace.tsx Kanban 4 stages, GroupProjectWorkspace.tsx Drive folder + peer review, PeerQAWorkspace.tsx anonymous + AI moderation, NotionImportWorkspace.tsx bulk .md → MarkdownNote + Dexie, DeadlineGanttWorkspace.tsx Mermaid gantt auto from assignments+canvas, Habit heatmap in DashboardHome, Focus Analytics funnel. All registered in AppStoreModal APP_CATALOG (7 new) + lazy imports in App.tsx.',
      'Growth: src/services/analytics.ts trackEvent canvas_connected/assignment_created/pomodoro_complete/command_executed etc with Plausible/gtag/PostHog hooks + local queue, FeedbackWidget floating Help → GitHub issue + Tally + Share your setup Twitter card, OnboardingChecklist 4-step persisted scc_onboarding_checks_v1 + InteractiveIntroModal once, ChangelogModal showChangelogDot not auto-open modal (localStorage scc_last_seen_version dot), Twitter card + Deploy with Vercel button retained in README.',
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
