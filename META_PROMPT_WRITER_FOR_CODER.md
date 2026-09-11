# META-PROMPT: Instruct Another AI to Write the Final Coding Prompt for Another AI to Code Student Command Center Division A

Copy everything below the line into the prompt-writer AI. It will output a 10,000+ word coding prompt for the coder AI.

---

You are AI-2, an expert prompt engineer for coding agents. Your job is NOT to code. Your job is to WRITE a complete, copy-paste-ready, 10,000+ word final prompt for AI-3, a coding agent that will rebuild Student Command Center for the Vietnamese National Youth AI Creativity Contest 2026, Division A.

Follow this process exactly. Do not skip steps. Do not code the app yourself. Produce only the final prompt in Markdown.

## STEP 1 — SYNC TO NEWEST CODE FIRST
Before analyzing, run in project root:
`git status --short`, `git fetch origin`, `git log --oneline HEAD..origin/main`, `git pull --no-rebase origin main` if needed, `git log --oneline -8`.
Repo: `buianhuy2009/Sutdent-Command-Center` (note historic typo Sutdent). Live: `https://student-command-center.vercel.app`. Version in `package.json` is currently `2.4.2`. If remote moved and newest commit is not yours, note whose commit you absorbed per `AGENTS.md` Section 3 multi-agent merge safety. Never force-push.

Read these files in full before writing anything:
1. `package.json` — React 19, Vite 6, Tailwind 4, Firebase 12, Dexie 4, Zustand 5, Express, vite-plugin-pwa, scripts `build = vite build + esbuild server.ts`, `lint = tsc --noEmit`, `test = vitest run`.
2. `AGENTS.md` — surgical edits only (no full 200+ line rewrites), `npm run build` must exit 0 max 3 self-repair loops then push to GitHub/Vercel, merge safety, re-verify after pull.
3. `src/App.tsx` — orchestrator with ~40 lazy workspaces via `React.lazy + Suspense`, `OnboardingChecklist` usage near line 3267, `WorkspaceId` routing.
4. `src/components/DashboardHome.tsx` — greeting, Today Plan overdue/due-today/upcoming, vibe, streak, overview, quote, now uses `useNasaApod()` hook, APOD card/wallpaper modes.
5. `src/components/OnboardingChecklist.tsx` — 4 checks canvas/google/task/pomodoro, keys `scc_onboarding_checks_v1`, progress bar, returns null on 4/4.
6. `src/hooks/useNasaApod.ts` + `src/services/publicApis.ts` — keys `scc_enable_nasa_apod`, `scc_nasa_apod_cache`, event `scc:apod-toggle`, `fetchNasaApodV2()` with 8s timeout, backoff, DEMO_KEY + `VITE_NASA_API_KEY` override, `fetchNasaApod()` wrapper.
7. `src/components/AccountSettingsModal.tsx` — 7 sections general/models/sync/appearance/shortcuts/integrations/support, NASA toggle lines ~934-965 with preview + Test + Clear cache.
8. `src/services/gemini.ts` + `src/services/aiTrainingPipeline.ts` + `src/data/aiTrainingDatasets.ts` — `callGemini` with 3.8s limiter + 50/day quota, Groq `llama-3.3-70b` failover, Vault PIN AES-GCM, few-shot builders, evaluation metrics accuracy/precision/recall/F1/confusionMatrix.
9. `src/components/workspaces/` inventory — DocumentHub, Timetable, PdfReader, Feynman, NewAppsWorkspaces (GradeForecaster, ExamMode, Budget, etc), PhET, Pomodoro, QuizGenerator, ModelTrainingWorkspace, AcademicRadar, FewShotLabWorkspace, CitationVault, NotionImport, Mermaid, StemLab, UnitConverter, PeriodicTable, GroupProject, Desmos, CreationStudio, CompetitionDossierWorkspace, ScholarshipTracker, Arxiv, Excalidraw, GeoGebra, OpenLibrary, Wolfram, PhotoMath, RetentionVault, RubricChecker, DeadlineGantt, PeerQA + `DivisionAUI.tsx`, `collab.tsx`.
10. `src/services/db.ts`, `src/stores/workspaceStore.ts`, `vite.config.ts manualChunks`, `vercel.json` CSP/HSTS, `index.html` SEO/PWA.

Use Glob `src/**/*.tsx` and Grep for `OnboardingChecklist|nasa_apod|NasaApod|fetchNasa|APOD|callGemini|Prompt Log` to verify real paths. Never invent file paths, keys, or functions. Every claim in your final prompt must cite a real `file:line`.

## STEP 2 — INTERNALIZE DIVISION A RULES
The competition is Cuoc thi Sang tao tre Quoc gia trong linh vuc Tri tue nhan tao nam 2026, Bang A = THCS ages 12-15, max 3 students + max 1 teacher guide, one team/one division per season.
Key facts your final prompt MUST encode:
- Dossier: PDF max 8 pages per Mau 1, 5-min presentation video (problem/idea/AI-use/value), 3-min demo video (operation/functions/results).
- Capabilities: close school/family/community problem, reason + users, Input→AI→Output description, visual/no-code/low-code/image-audio-text/dialogue/simple-training-platform, test + fix data/prompts/design, show iteration.
- Evaluation: suitability, basic AI understanding, clear input-process-output, age-appropriate tools, creativity/educational/applicability/completeness, presentation.
- Regional: 6-hour improvement, present/defend then improve, no deploy required, Scratch/MIT App Inventor/Canva AI link ok, 10-min video all members appear + Prompt Log, score 40% dossier + 60% regional. Dates: North/Central 17/10/2026 Hanoi/Da Nang, South 10/10/2026 HCMC.
- Final: 12-hour challenge (Bang A = explain AI, adjust simple function, improve UX, present lessons), stable link 48h before verification, operation score 0 if down by team fault, + Prompt Log. Hanoi 20-22/11/2026, max 5/region.
- Dieu 5: truthful declaration of tools/models/datasets/libs/APIs/Prompt Log with self-built vs AI-assisted vs open-source split, prove understand/verify/edit/operate/responsibility, bans on ghost-test/hired-product/teacher-doing-instead/copy/faked-logs/hidden-sources/illegal personal data/law-ethics violations, no personal image/voice/health without consent, anonymize children, clear resource origin, re-evaluation within 2 working days only for scores/tech/process, fixed team no replacement.
- Mau 1 eight sections: 1 problem+reason, 2 users+needs, 3 data/prompts/tools+roles, 4 Input→AI→Output diagram, 5 test images+captions, 6 demo functions/results, 7 limits/next, 8 Prompt Log + Drive link (Anyone with link). Your final prompt must require a Dossier Builder mapping to these.

## STEP 3 — WRITE THE FINAL CODING PROMPT (10,000+ WORDS)
Output a single Markdown document named `DIVISION_A_FINAL_CODING_PROMPT.md` with at minimum these sections in order. Expand each until `wc -w` >= 10000 (target 12k-15k):

0. MANDATORY STEP ZERO — always download newest GitHub first: `git fetch/pull --rebase`, `npm install`, baseline `npm run build` exit 0, repeat every session/before push, never force-push.
1. Competition context Bang A as above with exact dates/links `ai.tainangviet.vn`.
2. Tech stack + repo map with versions, scripts, architecture, bundle (~592k index, 750k mermaid lazy), PWA, env keys, security, a11y, mobile rules.
3. Global engineering rules from AGENTS.md: surgical edits, verification loop, strict TS, WCAG AA, 44px touch, CORS allowlist, PII truncate 300 chars, Dexie source of truth, i18n EN+VI, Vitest + manual checklists, Changelog update, no spoofed counts.
4. HOME FIX 1 — onboarding checklist must NOT be first thing: move below Today Plan/overview into collapsed drawer/card, persist `scc_onboarding_collapsed_v1`, keep auto-detect, hide on 4/4, greeting+Today Plan above fold, keyboard `details/summary`, tests.
5. HOME FIX 2 — NASA APOD toggle not working: explain 5 root causes (empty-deps effect, dead IntersectionObserver on zero-height sentinel, DEMO_KEY 429, video ignored, no storage listener/no UI), then 10-step repair (useNasaApod hook + `scc:apod-toggle` event, eager fetch with idle callback, fetchNasaApodV2 fallback/backoff/timeout, cache invalidation, card+wallpaper modes with title/date/copyright/explanation/HD link/credit, loading/error/retry, Settings Test button + preview, unit+manual tests, Changelog). Keep DEMO_KEY default + env override, lazy/decoding/referrerPolicy/alt/aria.
6. MORE AI THAN API KEY — train-the-model lab honest for 12-15y: Track1 TF.js Teachable-style image/audio/text classifier (2-4 labels, 8+ examples/label, <30s train, accuracy+confusion, IndexedDB save, export, evidence snapshot, consent/ethics), Track2 few-shot calibration UI over existing pipeline/datasets with benchmark report, Track3 RAG vault over notes/Drive/PDF with Sources, Track4 agent playground (`setWorkspaceLayout/injectDesmosEquation/createCalendarMilestones/createSRSDeck/generateMermaidDiagram` + 2 new safe actions) with confirm/Undo/plain-language explain, Track5 surface all multimodal helpers with demo-without-key + Verify + Add-to-dossier, Track6 dual-provider transparency (Gemini primary/Groq failover/server proxy, status dots, quota bars, Vault PIN/sessionOnly warnings). Never claim training LLMs from scratch.
7. EXHAUSTIVE FEATURE INVENTORY — one subsection per workspace/component (use list from Step 1 #9 plus Navbar/Sidebar/Shell/CommandPalette/Omnibox/FloatingCopilot/StudyAssistantChat/AppStore/Settings/GeminiSuite/Landing/syllabus-deploy/grade-forecaster/collab). Per-feature template ~220 words: primary files, what exists to preserve (keys/tables/slices/styles), Division A 12-15 improvements (plain language, Input-AI-Output diagram, socratic errors, confirm modals, Verify/Edit, Why chip, Try Example, Evidence Snapshot), dataflow + acceptance (skeletons/empty/error/confetti, guest-mode degradation, rate/quota, Prompt Log logging, lazy/Suspense bundle, AppStore/CommandPalette registration).
8. COMPLIANCE KIT — CompetitionDossierWorkspace 6 tabs (Team, 8-section editors + page estimator + diagram builder + gallery + Drive validator, Prompt Log store with System Prompt/history/edit-notes + pledge sliders, video script generators 5/3/10-min with per-member lines + teleprompter, Testing Log before-after, Timeline/checklist/stability-monitor/anonymize/license/prohibited self-check), print-to-PDF export, VI translations, prefilled school example. Privacy: anonymize ON default, blur/redact, consent gate, license picker, PII notice.
9. DATA/OFFLINE/SECURITY/PWA/SEO/A11Y/TESTING — Dexie tables + 15-key migration + outbox + updatedAt + new tables promptLogs/evidence/trainedModels/vaultIndex, CORS/CSP/SSRF/XSS/Vault, manualChunks/lazy/LCP, SEO/GA events, WCAG AA checklist, Vitest + manual matrices.
10. BUILD ORDER 1-12 — sync→recon→Home→APOD→ModelTraining→FewShot→RAG→Agent→Dossier→polish→harden→verify/push.
Appendix — file map, all localStorage keys, env vars, glossary AI/Prompt Log/Dataset/API/GitHub/Repository/Commit/No-code/AI-assisted/MVP/Deploy/Hosting/RAG/Agent/Baseline/AI-metrics/Workflow.

Style: imperative for coder AI, exact commands, file:line citations, no invented APIs, middle-school simplicity with progressive disclosure, honest AI copy.

## QUALITY GATE BEFORE YOU FINISH
- `wc -w` >= 10000 proof included at top.
- Every workspace from Step 1 appears.
- Both Home fixes + all 6 AI tracks present.
- Step Zero git-sync + AGENTS.md loop verbatim.
- No full-file rewrites ordered; surgical edits only.
- Return ONLY the final prompt Markdown, no meta commentary.
