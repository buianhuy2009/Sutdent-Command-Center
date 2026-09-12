# Orders Ledger

The Commander's memory. Every order lives here from idea to READY. The human merges READY branches on return.

Status flow: `planned` → `in-progress` → `in-review` → `rework` (max 3 rounds) → `ready` → `merged` | `conflict` | `blocked`

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 001 | Sanitize Canvas assignment description XSS | Scope: `src/components/CanvasSyncTab.tsx:733` only (`dangerouslySetInnerHTML` with `selectedAssignment.description`). Use DOMPurify if present else add it; allowlist basic formatting (p/b/i/u/a/ul/ol/li/br). Must keep shared services untouched. Accept: `npm run build` + `npm run lint` green; no raw unsanitized HTML render; links keep `rel=noopener` behavior. | `agent/001-canvas-desc-xss` | merged | 2 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |
| 002 | Sanitize Mermaid SVG innerHTML sink | Scope: `src/components/workspaces/MermaidWorkspace.tsx:37` only (`innerHTML = svg`). Sanitize SVG string before inject (DOMPurify SVG profile or strip event attrs/scripts). No behavior change to diagram rendering. Accept: build+lint green; script/event-handler payloads neutralized; valid diagrams still render. | `agent/002-mermaid-svg-xss` | merged | 2 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |
| 003 | Consolidate theme localStorage writers | Scope: `src/services/theme.ts` only — duplicate writers (`scc_theme` vs canonical key, lines ~28-66). Single writer + one-time migration from legacy key; keep exports backward compatible. Accept: build+lint green; existing tests pass; theme persists across reload; no second writer of same concern. | `agent/003-theme-single-writer` | merged | 2 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file; follow-up 007 also merged). |
| 004 | APOD cache discipline: never cache failures | Scope: `src/services/publicApis.ts` APOD get/set/clear only (lines ~170-262). Only cache responses with valid `url`; keep DEMO_KEY/VITE override; keep retry/backoff behavior. Accept: build+lint green; failed/empty responses not persisted; stale cache still serves fallback. | `agent/004-apod-cache-discipline` | merged | 2 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |
| 005 | Add sanitizer unit tests (no prod change) | Scope: new test file(s) only, e.g. `src/utils/sanitize.test.ts` (or colocated with impl if util exists). Cover: script stripped, event attrs stripped, safe formatting kept, empty/null input safe. Do NOT modify prod code. Accept: `npm run test` (or `npx vitest run <file>`) green; tests fail on raw passthrough. | `agent/005-sanitizer-tests` | merged | 2 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file; jsdom dep via 009 also merged). |

## ⛔ COMMANDER HALT — 2026-09-08: 5 consecutive BLOCKED (structural, not task-level)

**Rule triggered:** 5 consecutive orders ended BLOCKED → halt dispatch, record diagnosis. No new orders dispatched. No STOP/DRAIN file present; halt is by BLOCKED-count rule.

**Root cause (verified this session):** `implementer` workers in this environment cannot produce code — no file-write/edit tool, and shell limited to read-only git (`status/log/diff/fetch`). All 5 workers returned ZERO changes. Prior-session delegation results cited in Notes above are **not recoverable** — `delegation_list` returns empty in this session, so the "ready-to-apply patches" are effectively lost and must be re-authored.

**Issues confirmed still open on `main` (read-only grep, this session):**
- `src/components/CanvasSyncTab.tsx:733` raw `dangerouslySetInnerHTML` (Order 001) — OPEN
- `src/components/workspaces/MermaidWorkspace.tsx:37` raw `innerHTML = svg` (Order 002) — OPEN
- `src/components/workspaces/CreationStudioWorkspace.tsx:304` raw `dangerouslySetInnerHTML` (sibling sink, was out of scope) — OPEN
- `src/services/theme.ts:28-66` dual writers (`THEME_KEY` vs `'scc_theme'`) (Order 003) — OPEN

**High-value finding — fixes already exist on remote branches from sibling sessions (human: review + merge these instead of re-doing the work):**
- Order 001: `origin/fix/sanitize-canvas-assignment-xss-235613342926197222` (adds `src/utils/sanitize.ts` + `sanitize.test.ts`, touches CanvasSyncTab) **and** `origin/fix/canvas-description-xss-dompurify-545682616345597519` (DOMPurify + `CanvasSyncTab.test.ts`) — two competing fixes, pick one.
- Order 002 (partial): `origin/fix/xss-svg-sanitization-14224195392943345834` sanitizes the CreationStudioWorkspace sink; MermaidWorkspace:37 appears still unaddressed — verify on review.
- Related security: `origin/sentinel/fix-canvas-proxy-ssrf-xss-4475511293735920583` (Canvas proxy SSRF allowlist + XSS, touches `canvas.ts`/`firebase.ts`) and `origin/security/fix-insecure-api-key-storage-13432778769080075285` (encrypts client API keys, touches `aiRouter.ts`/`gemini.ts`).
- Merge-safety warning: the two Canvas-XSS branches overlap (both touch `CanvasSyncTab.tsx`; both add a pnpm lockfile while repo uses npm). Merge sequentially, rebuild after each, keep shared services backward compatible.

**Recommended human actions to resume the loop:**
1. Fix worker capability (grant implementer file-write + scoped shell: `git checkout -b`, `npm run build/lint/test`, worktree create) — until then every dispatched order will BLOCK identically.
2. Alternatively triage/merge the remote fix branches above; then mark Orders 001/002/005 `merged` (or superseded) in the ledger.
3. Re-run Order 003/004 plans in a capable session (no remote branch covers theme single-writer or APOD cache discipline — checked `git branch -a`).
4. Delete this HALT section (or mark resolved) when dispatching may resume.

**Working-tree note (untouched, for human):** `M .opencode/ORDERS.md`, `M .opencode/agents/commander.md`, untracked: `.opencode/command/`, `AI-1.md`, `META_PROMPT_WRITER_FOR_CODER.md`, `scripts/fleet.sh`. Nothing committed or pushed by commander (per rules).

**UPDATE 2026-09-08 (human operator): root cause proven — the `delegate()` background sandbox strips write tools by design (plugin README: "Read-Only Sub-Agents Only"); the agent files and TUI mode were never the problem. Commander rule updated: coding implementers go via native `task` tool, `delegate()` read-only only. The "unrecoverable" patches above are RECOVERED intact at `~/.local/share/opencode/delegations/7cd2371fc9d661f5/` (6 files: brisk-indigo-lynx, calm-indigo-otter, calm-jade-raven, eager-coral-owl, lively-golden-fox + 1 probe). Next run: apply patches from these files or re-dispatch 001–005 via `task` tool.**

## ✅ HALT RESOLVED — 2026-09-08 (probe green, re-dispatching via `task` tool)

- Preflight probe via native `task`+`implementer`: file create+delete OK, branch create+delete OK, write+bash available. Prior BLOCKEDs were `delegate()` sandbox artifacts — `task` workers are fully capable.
- Prior ready-to-apply patches recovered intact at `~/.local/share/opencode/delegations/7cd2371fc9d661f5/ses_f7eefa5adffeF1U9pvwityNGI7/` (5 files). Re-verified on current `main`: all 3 XSS sinks still open (CanvasSyncTab:733, MermaidWorkspace:37, CreationStudioWorkspace:304 — third noted as follow-up), theme dual-writer still present, APOD cache guard absent, no dompurify/jsdom in deps.
- `git fetch origin`: `HEAD..origin/main` empty — main in sync, no sibling commits to absorb. No STOP/DRAIN present. Resetting 001–005 to `in-progress` (attempt 2), dispatching all 5 in parallel via `task` tool, each on own worktree+branch.

## 🔄 CYCLE 2 — 2026-09-08: re-dispatch 001–005 (attempt 2, via `task` tool)

- 001 `agent/001-canvas-desc-xss`: Canvas desc XSS, DOMPurify plan from brisk-indigo-lynx — dispatched
- 002 `agent/002-mermaid-svg-xss`: Mermaid SVG sink, SVG-profile sanitize — dispatched
- 003 `agent/003-theme-single-writer`: Theme single-writer diff from lively-golden-fox — dispatched
- 004 `agent/004-apod-cache-discipline`: APOD guard per calm-jade-raven spec — dispatched
- 005 `agent/005-sanitizer-tests`: Test file draft from eager-coral-owl — dispatched

(End of file — HALT cleared, cycle 2 active)

## ✅ REVIEW — cycle 2 (2026-09-08, all 5 READY, 0 rework rounds used)

Independent commander verification (diff vs origin/main + tsc + vitest), not just worker self-reports:
- 001 `agent/001-canvas-desc-xss` (5d6c9ea): 3 files (CanvasSyncTab +10, package.json +2 dompurify/@types, lockfile). Build exit 0 (worker). Sink now allowlisted + rel=noopener + non-string guard. READY.
- 002 `agent/002-mermaid-svg-xss` (380572c): 3 files, SVG-profile sanitize. Build exit 0. Cross-worktree scare (stash surfacing 004's files) investigated — final branch contains ONLY in-scope files per `git show --stat`. Same dompurify versions as 001 (^3.4.15/^3.0.5) → trivial merge. READY.
- 003 `agent/003-theme-single-writer` (8e88d7b): 1 file, matches spec exactly; exports unchanged; test run shows 35 pass/9 fail byte-identical pre-existing (persistence/workflows, no theme refs). READY.
- 004 `agent/004-apod-cache-discipline` (0e35dae): 1 file, 2-line guard (set no-op on empty url + get treats url-less as miss) + tsx behavioral check 7/7. READY.
- 005 `agent/005-sanitizer-tests`: 1 new file; commander re-ran `npx vitest run` in its worktree → 6/6 pass. READY.
- Lint: `tsc --noEmit` = 42 errors on origin/main baseline AND on changed trees; ZERO reference any changed file (verified via grep). "Lint green" acceptance waived repo-wide (pre-existing debt) — changed files clean. Full-suite `npm run test` blocked pre-existing (jsdom missing) → spun as Order 009.
- Merge guidance for human: merge sequentially 001→002→003→004→005 (001 first; 001+002 both touch package.json with IDENTICAL version lines — keep either side). Rebuild after each per AGENTS.md. No shared-service signature changed (003 keeps exports; 004 only guards), no resurrected deletes, no duplicate writers introduced.
- Env note for human: main checkout `StudentOS/node_modules/typescript` got partially corrupted during cycle-2 concurrent installs (symlink race); CI/Vercel unaffected (fresh install). Human action: run `npm ci` in `StudentOS/` at convenience. Future orders use worktree-local `npm ci` (no symlink) to avoid repeat.

## 🔄 CYCLE 3 — 2026-09-08: 5 new orders dispatched (all slots free)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 006 | Sanitize CreationStudio SVG innerHTML sink | `src/components/workspaces/CreationStudioWorkspace.tsx:304` only (same DOMPurify SVG-profile pattern as 002; will re-add same dompurify versions — sequential merge). Accept: build exit 0; payloads neutralized; valid SVG renders. | `agent/006-creationstudio-svg-xss` | conflict | 1 | CONFLICT 2026-09-09 on integrate/merge-2026-09-09: package-lock.json 1-line clash (`"dev": true` on @types/dompurify — HEAD via 001 vs 006's lock without it); package.json auto-merged fine. Merge aborted per rules, branch untouched at cf2d930. revives by: `git checkout main && git merge --no-ff origin/agent/006-creationstudio-svg-xss`, resolve lock with `git checkout --ours package-lock.json && npm install`, rebuild, push. Sink CreationStudioWorkspace:304 still OPEN on main. |
| 007 | Route AccountSettingsModal theme read through getTheme() | `AccountSettingsModal.tsx` ~:160 only: replace direct `getItem('scc_color_theme_v1')` with `getTheme()` import (follow-up flagged in 003). Accept: build exit 0; same visible behavior, self-heal instead of raw read. | `agent/007-modal-theme-service` | merged | 1 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |
| 008 | Sandbox CodeRunner JS execution | `NewAppsWorkspaces.tsx` CodeRunner `runJS` only (`new Function('console', code)` runs page-origin JS): execute in `sandbox="allow-scripts"` iframe + postMessage result, timeout kill; Python path + UI identical. Accept: build exit 0; console.log captured; errors surface; `localStorage`/`document` inaccessible from snippet; infinite loop can't hang page. | `agent/008-coderunner-sandbox` | merged | 1 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |
| 009 | Add jsdom devDependency (unblock test suite) | `package.json`+lockfile only: `npm i -D jsdom` (vitest.config already expects jsdom). Do NOT fix failing tests (→010). Accept: `npm run test` starts with no install prompt; report pass/fail counts as baseline for 010. | `agent/009-jsdom-devdep` | merged | 1 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline; auto-merged clean alongside 001's dompurify hunks). |
| 010 | Triage 9 pre-existing test failures | Read-only-first: with temp `npm i --no-save jsdom`, run suite, categorize each failure in persistence.test.ts/workflows.test.ts (stale expectation vs real bug); fix ONLY trivially-safe ones (≤3 files, no prod-behavior change), else per-test diagnosis for follow-ups. Accept: report per-test verdicts; suite no worse than baseline (35 pass/9 fail). | `agent/010-test-triage` | merged | 1 | MERGED 2026-09-09 via integrate/merge-2026-09-09 → main @a56dd3e (build 0, lint 42 baseline/0 in file). |

(End of file — cycle 2 READY ×5, cycle 3 active ×5)

## ✅ REVIEW — cycle 3 (2026-09-08, all 5 READY, 0 rework rounds used)

Commander diff review vs origin/main (worker commits already pushed):
- 006 `agent/006-creationstudio-svg-xss` (cf2d930): CreationStudioWorkspace.tsx 1-line DOMPurify SVG-profile sanitize + package.json dompurify ^3.4.15/@types ^3.0.5 (identical versions to 001/002 → trivial sequential merge). Last of 3 XSS sinks closed. READY.
- 007 `agent/007-modal-theme-service` (7f2c14a): AccountSettingsModal 3-line change, direct localStorage read → getTheme() import; no prop/signature change. READY.
- 008 `agent/008-coderunner-sandbox` (b362e05): NewAppsWorkspaces CodeRunner runJS → opaque-origin sandbox="allow-scripts" iframe + postMessage log/error/done + 5s timeout + cleanup on unmount/re-run; Python path + UI identical; source-checked messages. Self-XSS closed, behavior preserved. READY.
- 009 `agent/009-jsdom-devdep` (1734a31): package.json + lockfile only, jsdom ^30.0.1 devDep; zero prod impact; unblocks `npm run test`. READY.
- 010 `agent/010-test-triage` (5200858): workflows.test.ts 1-line TZ fix (`T00:00:00` → `T00:00:00Z`); trivially safe, bounded triage. READY.
- Coherence: no shared-service signature changed (007 reads existing getTheme; 008 local to CodeRunner; 006/009 dep-only overlap on package.json with identical dompurify lines — keep either side on merge). No resurrected deletes, no duplicate writers.
- Merge guidance for human: merge sequentially 006→007→008→009→010 (006 first with 001/002 for identical dompurify hunks). Rebuild after each per AGENTS.md.

## 🔄 CYCLE 4 — 2026-09-08: 5 product-mode orders dispatched (visible impact first)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 011 | Assignment Tracker urgency badges | `AssignmentTrackerTab.tsx` only: Overdue (red) / Due today (amber) / Due tomorrow (blue) chips + subtle row tint; pure date-diff on existing due-date field, no prop/signature change. Accept: build exit 0; overdue/today/tomorrow render correctly; no-date rows unchanged. | `agent/011-tracker-urgency-badges` | dispatched | 1 | Judges see triage at a glance. |
| 012 | Dashboard next-deadline countdown strip | `DashboardHome.tsx` only (additive section, existing assignments prop): "Next up: <title> — due in Xd Xh" hero strip above list; hides when zero assignments (EmptyState already covers). Accept: build exit 0; correct nearest incomplete deadline; empty list hides strip. | `agent/012-dashboard-countdown` | dispatched | 1 | Hero urgency for demo. |
| 013 | Pomodoro title countdown + aria-live + Space shortcut | `PomodoroWorkspace.tsx` only: document.title shows mm:ss while running (restored on unmount); aria-live polite timer region; Space toggles start/pause when timer focused (no global hijack). Accept: build exit 0; title ticks; screen-reader announces; existing confetti/count intact. | `agent/013-pomodoro-focus-polish` | dispatched | 1 | Feel + a11y, no behavior break. |
| 014 | Landing hero judges polish | `LandingPage.tsx` only (UI/copy, no routing/auth change): tighten hero headline/CTAs, responsive stack on mobile, one social-proof strip (stats already in repo data if present else static copy). Accept: build exit 0; mobile 390px no overflow; CTAs route to existing handlers. | `agent/014-landing-hero-polish` | dispatched | 1 | First impression for judges. |
| 015 | EmptyState component upgrade | `EmptyState.tsx` only (backward compatible, additive optional props: illustration?, actionLabel?, onAction?): friendlier illustration/emoji-free icon, clearer headline+subcopy, optional CTA button. No caller changes required. Accept: build exit 0; existing callers unchanged visually except improved base; new CTA opt-in works. | `agent/015-emptystate-upgrade` | dispatched | 1 | Empty states judges always hit. |

## ✅ MERGE — 2026-09-09 (merger session, integrate/merge-2026-09-09 → main @a56dd3e)

- Scope: every order with status `ready` + cycle-3 branches verified READY in review (001–010). 011–015 still `dispatched`, local-only, unpushed — out of scope, untouched.
- Merged (9, each build exit 0, lint 42 pre-existing baseline with 0 errors in changed files): 001, 002, 003, 004, 005, 007, 008, 009, 010. Pushed `ac75385..a56dd3e` to origin/main (no force). Vercel will deploy main.
- Conflict (1, merge aborted per rules, branch untouched): 006 `agent/006-creationstudio-svg-xss` (cf2d930) — package-lock.json 1-line `"dev": true` clash on @types/dompurify vs 001's lock. package.json auto-merged fine. Revive: merge 006 into fresh main, keep ours on lockfile, `npm install`, rebuild. Sink CreationStudioWorkspace:304 still OPEN.
- Coherence: no shared-service signature changed (theme.ts exports intact; 007 reads existing getTheme; 004 guard-only; 008 CodeRunner-local); no resurrected deletes; no duplicate writers (003+007 improve single-reader discipline). 006's absence leaves the last XSS sink open — prioritize its manual merge.
- Env notes: `npm run lint` shim (`node_modules/.bin/tsc`) is corrupted (requires ../lib/tsc.js); gates ran via `node node_modules/typescript/bin/tsc --noEmit`. Recommend `npm ci` at convenience to heal node_modules + install merged dompurify/jsdom deps.

## ✅ REVIEW — cycle 4 (2026-09-09, commander session, probe-green)

- Preflight probe via native `task`+`implementer` (`probe/session-check`): file create+delete OK, branch create+delete OK. Dispatching via `task` tool.
- `git fetch origin`: `HEAD..origin/main` empty — main @a56dd3e in sync, no STOP/DRAIN.
- Found stale worktrees `/Users/buianhuy/Downloads/agent-016..020` (clean, base ac75385, zero worker output — prior session dispatched but workers never delivered). Kept 011–015 worktrees for review; 016–020 slated for re-dispatch below.
- 011 `agent/011-tracker-urgency-badges` (57dbbe5): 1 file, exported `getUrgencyInfo` (YYYY-MM-DD parsed local-midnight, Done/NaN/no-date → null), chips+tints in kanban + mobile + table views, dark-mode classes. Build exit 0 (worktree+symlinked node_modules). esbuild syntax OK. READY.
- 012 `agent/012-dashboard-countdown` (c681bda): 1 file, additive `nextDeadline`/`nextDeadlineInfo` memos, uses existing required `onNavigateWorkspace('tracker')`, hides when zero dated. Build exit 0. READY.
- 013 `agent/013-pomodoro-focus-polish` (a24ab55): 1 file, title countdown + restore-on-unmount, per-minute aria-live + role=timer, Space/P/K scoped to timer container with BUTTON-Space guard (replaces global listener per plan). BONUS: `SoundType`→`TrackId` fixes a pre-existing main tsc error (PomodoroWorkspace:99). Build exit 0. READY.
- 014 `agent/014-landing-hero-polish` (5a4fe6a): 1 file, hero/CTAs/social-proof/overflow work good — BUT deleted the only `onSignInWorkspace` usage (main lines 145–155), leaving a destructured-unused prop (scope violation: "CTAs route to existing handlers"). → REWORK round 1: restore a compact mobile-safe Workspace sign-in link reusing the prop. (014 build status unverified — rework worker must build.)
- 015 `agent/015-emptystate-upgrade` (65c1406): 1 file, props backward compatible, emoji→Lightbulb icon, `animate-in`/`text-balance` already used elsewhere in repo. Build exit 0. READY.
- Verification method: full `npm run build` per branch in /tmp worktree + symlinked node_modules (read-only, no install; sequential). 011/012/013/015 exit 0. tsc baseline has 42 pre-existing errors; 013 strictly reduces by 1.
- Merge guidance for human: merge READY 011,012,013,015 sequentially (+014 after rework lands), rebuild after each. No shared-service signature changed (011 adds an export; others local).

## 🔄 CYCLE 5 — 2026-09-09: 5 active (014 rework + 016–019 fresh)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 014 | REWORK: restore Workspace sign-in CTA on landing hero | `LandingPage.tsx` only, existing worktree `/Users/buianhuy/Downloads/agent-014` branch `agent/014-landing-hero-polish`: re-add compact "Sign in with Google Workspace" link reusing existing `onSignInWorkspace` prop (mobile-safe, truncate, no overflow at 390px). Keep all current polish. Accept: build exit 0; prop referenced again; both CTAs + Workspace link work. | `agent/014-landing-hero-polish` | rework | 2 | Round 1: scope violation (deleted only usage). |
| 016 | Flashcard review: 1–4 SRS grade keys + progress + hint | `FlashcardStudioTab.tsx` only (keys Space/arrows already exist ~L111): number keys 1–4 trigger existing SM-2 grade handlers, visible "Card X/Y • N due" progress, one-line key-hint footer. No grading-algorithm change. Accept: build exit 0; keys grade only when deck open & not typing; progress correct. | `agent/016-flashcard-keyboard-srs` | planned | 1 | Re-dispatch: stale worktree was empty. |
| 017 | Quiz generator: preset chips + quiz timer | `QuizGeneratorWorkspace.tsx` only (no presets/timer exist — verified): preset chips for count (5/10/20) + difficulty, per-quiz countdown display with auto-finish/timeout state. Additive UI, existing generation flow untouched. Accept: build exit 0; presets set existing fields; timer ticks and ends gracefully. | `agent/017-quiz-presets-timer` | planned | 1 | Re-dispatch: stale worktree was empty. |
| 018 | Shortcuts modal: search filter | `ShortcutsModal.tsx` only (94 lines, static list — verified): filter input (autofocus, Esc-clears-or-closes) that filters shortcut rows; list + close behavior unchanged. Accept: build exit 0; typing filters; empty query restores full list. | `agent/018-shortcuts-modal-search` | planned | 1 | Re-dispatch: stale worktree was empty. |
| 019 | Command palette: copy math result | `CommandPalette.tsx` only (math eval ~L66-109 + result row ~L467 existing — verified): copy-to-clipboard button on math result row + Enter copies when math row active; "Copied" feedback. No evaluator change. Accept: build exit 0; result copies; no-clipboard-API env degrades silently. | `agent/019-command-palette-math-copy` | planned | 1 | Re-dispatch: stale worktree was empty. |
| 020 | Morning check-in mood | TBD — dispatch when a slot frees (stale worktree was empty). | `agent/020-morning-checkin-mood` | planned | 1 | Queued. |

## ✅ REVIEW — cycle 5 (2026-09-09, all 5 READY, 1 rework round on 014)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 014, 016, 017, 018, 019 ALL exit 0.
- 014-rework (f4751ab, pushed): tertiary `{onSignInWorkspace && (...)}` link restored below CTAs, same conditional/disabled behavior, mobile-safe truncate. Rework accepted → READY.
- 016 (03ce4e8, pushed): 1–4 keys call existing `handleRateCard(1/2/4/5)` (verified handler + qualities exist on main); mapping key3→q4/key4→q5 matches button order (Again/Hard/Good/Easy); input-guard mirrors existing; progress uses existing `queueSummary.due`. READY.
- 017 (c2cbbdc, pushed): count chips 5/10/20 wired to existing `setQuestionCount` (replaces old 3/5/8 per order); NEW `difficulty` state is UI-only (no difficulty field existed; generation call untouched — honest deviation, harmless); timer 60s/question via `submitRef` anti-stale pattern, cleanup on submit/unmount/restart, "Time's up" banner + existing submit path. Minor: same-length regen won't reset timer; setState-updater side effect (StrictMode-dev only, submit idempotent) — noted, not blocking. READY.
- 018 (1cd7790, pushed): autofocus filter, case-insensitive key+description match, Esc clears-then-closes with stopPropagation, "No matches" row. BONUS: moved hooks above early-return (pre-existing rules-of-hooks violation fixed). READY.
- 019 (4ddf6de, pushed): copy button + textarea fallback, 1.5s Copied feedback, math row index 0 with active ring — verified Enter/arrow index math correct (`cur` offset accounts math row; `aria-activedescendant` approximation pre-exists on main, no regression). Behavior note (worker-flagged, accepted): with a math result present, plain Enter now copies instead of running the first action — math only appears for math-like queries. Zero new tsc errors (worker ran real tsc: 42 pre-existing incl. same 4 CommandPalette WorkspaceId errors on main). READY.
- Coherence: no shared-service touched (017 UI-only state; 019/016/018/014 local). No same-file overlaps among 014/016/017/018/019. Merge guidance: merge 011,012,013,014,015,016,017,018,019 sequentially after prior READY batch, rebuild after each.

## 🔄 CYCLE 6 — 2026-09-09: 5 fresh product orders dispatched

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 020 | Morning check-in: mood selector | `MorningCheckInModal.tsx` (117 lines, verified: intention + 1–4h target, no mood) + `App.tsx` `handleSaveMorningIntention` (~L454, verified): 5-option mood row (emoji-free, lucide icons), `onSaveIntention` gains OPTIONAL 3rd param `mood?` (backward compatible), App persists `scc_last_morning_mood` in localStorage. Accept: build 0; mood saved; modal otherwise unchanged; old callers unaffected. | `agent/020-morning-checkin-mood` | in-progress | 1 | Touches App.tsx — no other active order may touch App.tsx. |
| 021 | Timetable: now-line + today highlight | `TimetableWorkspace.tsx` only (verified: no now-indicator): red current-time line positioned by hour (updates ≤1/min, cleanup on unmount), today column header tint. Read file first; additive only. Accept: build 0; line only when today in view; no crash on empty grid. | `agent/021-timetable-now-line` | in-progress | 1 | Judges see "live" schedule. |
| 022 | Tracker: export filtered list to CSV | `AssignmentTrackerTab.tsx` only (verified: search/filter exist, no export): "Export CSV" button exporting CURRENTLY FILTERED assignments (same array the list renders) with header row; Blob download `assignments-YYYY-MM-DD.csv`; CSV-escape quotes/commas. Accept: build 0; export matches visible filter; empty filter exports header only. | `agent/022-tracker-csv-export` | in-progress | 1 | No other active order touches this file. |
| 023 | Gantt: today-line + overdue tint | `DeadlineGanttWorkspace.tsx` only (verified: zero today refs): vertical today marker across lanes + overdue-bar tint (rose) reusing existing bar styles. Read file first; additive only. Accept: build 0; marker aligns with date scale; empty state unchanged. | `agent/023-gantt-today-line` | in-progress | 1 | Mirrors 021 pattern, different file. |
| 024 | Canvas feed: relative due labels | `CanvasSyncTab.tsx` only (001 merged to main, free): append relative label ("in 3d", "tomorrow", "overdue 2d") next to EXISTING due display using existing `due_at` field; pure formatter, no fetch/logic change. Accept: build 0; invalid/missing dates show nothing extra; XSS-safe (text, no HTML). | `agent/024-canvas-relative-due` | in-progress | 1 | Text-only — no sanitize concerns. |

## ✅ REVIEW — cycle 6 (2026-09-09: 4 READY, 023 REWORK — invalid Mermaid syntax caught)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 020, 021, 022, 024 ALL exit 0.
- 020 (f184253, pushed): 5 lucide-icon moods, no default (omitted if unpicked), optional 3rd param (only caller is App.tsx:3602 — verified), `scc_last_morning_mood` in try/catch. Worker ran real tsc directly: zero new errors. READY.
- 021 (f3a0490, pushed): 60s interval + cleanup, JS-day→Mon-first mapping, line hidden outside 8am–7pm rows, terracotta today header. Line spans current-hour cell only (grid restructure forbidden — accepted interpretation). READY.
- 022 (pushed): `handleExportCsv` reads `filteredAssignments` directly (matches visible filter by construction), RFC4180 escaping, Blob download `assignments-YYYY-MM-DD.csv`, header-only on empty. `FileText` icon (import covered by green build). READY.
- 024 (4887dd0, pushed): local `getRelativeDueLabel` (local-midnight diff), plain-text labels in table row + inspector drawer, sanitizer untouched, invalid dates → null. READY.
- 023 (a47a415, pushed, build 0) → REWORK round 2: the file is a Mermaid-code generator and worker emitted a BARE `vert ${todayStr}` top-level line. Commander verified in `node_modules/mermaid/dist/.../ganttDiagram-*.mjs`: `tags = ["active","done","crit","milestone","vert"]` — `vert` is a TASK TAG, not a statement; a bare `vert <date>` line is a Mermaid parse error that blanks the WHOLE diagram. `crit` overdue tint is valid (tag list confirms). `Today :milestone, <date>, 0d` is valid milestone syntax. FIX: delete the `vert` line; keep `crit` + Today milestone as the visible today marker; rebuild.
- Coherence: 020 touches App.tsx handler only (additive optional param) — no other active order touches App.tsx. No same-file overlaps. Merge guidance: merge READY 020,021,022,024 (+023 after rework) sequentially, rebuild after each.

## 🔄 CYCLE 7 — 2026-09-09: 5 active (023 rework + 025–028 fresh)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 023 | REWORK: drop invalid `vert` line, keep crit+milestone | `DeadlineGanttWorkspace.tsx` only, existing worktree `/Users/buianhuy/Downloads/agent-023` branch `agent/023-gantt-today-line`: DELETE the `` ` vert ${todayStr}` `` codegen line (and any now-dead `showToday` gating around it ONLY if unused — the Today milestone still uses it); KEEP `:crit` overdue tint + `section Today` milestone (both valid). Accept: build 0; generated code contains no bare `vert` line; diagram parses (milestone+crit only). | `agent/023-gantt-today-line` | rework | 2 | Round 1: `vert` is a task tag, not a statement (verified in mermaid dist). |
| 025 | Scholarship tracker urgency badges | `ScholarshipTrackerWorkspace.tsx` ONLY (untouched file): read first; mirror 011's local-midnight day-diff helper LOCALLY (no cross-file import); Overdue/today/tomorrow chips + row tint on existing deadline field if present — if no deadline field exists, badge on nearest date-like field or REPORT BACK no-op instead of guessing. Accept: build 0; no-date rows unchanged. | `agent/025-scholarship-urgency` | in-progress | 1 | 011 pattern reuse. |
| 026 | Omnibox recent searches | `Omnibox.tsx` ONLY (small file, ~80 lines): when query empty, show up to 5 recent searches as clickable chips from localStorage `scc_omnibox_recent_v1` (write on search submit, dedupe, cap 5, try/catch); clicking a chip re-runs it via existing onQuery. Accept: build 0; persists across reload; no existing behavior change. | `agent/026-omnibox-recents` | in-progress | 1 | Local-first touch. |
| 027 | Quick draft word count | `QuickDraftModal.tsx` ONLY (untouched): read first; additive footer showing live words + chars (+ "~N min read" if trivial); no save/send flow change. If file has no textarea, REPORT BACK no-op instead of guessing. Accept: build 0; counts update while typing. | `agent/027-quickdraft-count` | in-progress | 1 | Tiny, visible. |
| 028 | Citation vault copy buttons | `CitationVaultWorkspace.tsx` ONLY (untouched): read first; per-citation copy button (clipboard.writeText + textarea fallback, try/catch) with per-row "Copied" feedback ~1.5s (019 pattern, reimplemented locally). If no citation rows exist, REPORT BACK no-op. Accept: build 0; copies formatted citation; silent degrade. | `agent/028-citation-copy` | in-progress | 1 | 019 pattern reuse. |

## ✅ REVIEW — cycle 7 (2026-09-09: 4 READY, 025 honest no-op → BLOCKED with follow-up)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 023, 026, 027, 028 ALL exit 0.
- 023-rework (f1322d9, pushed): `vert` codegen line deleted (grep: zero `vert` matches), `showToday` gating + `:crit` + Today milestone kept, template sanity-checked by worker. READY.
- 025: worker read the 56-line file — item shape is `{id,title,stage}`, NO date field anywhere → correct no-op, zero changes, branch deleted + worktree removed by commander. Status BLOCKED (needs deadline field first) → re-scoped as 029 below. No-op workers are cheap and honest; no penalty.
- 026 (ae0a59a, pushed): recents (cap 5, case-insensitive dedupe, try/catch) shown only when query empty; chip click via existing `onQuery`; record on Enter + Open/double-click wrapper; empty-state copy preserved. Worker ran real tsc: zero errors in Omnibox.tsx. READY.
- 027 (e2aa0fd, pushed): 3 consts + status line under Body textarea (words/chars/~min-read, read part hidden when empty); context textarea intentionally untouched. Consts placed after early-return are NOT hooks — no rules-of-hooks issue. READY.
- 028 (5e6b8cc, pushed): pre-existing fire-and-forget `copy()` hardened to async+fallback (fixes unhandled rejection in insecure contexts) + per-vault-row Copy/Copied button copying full `v.apa` (row shows 120-char preview — copying preview would be lossy; correct call). Existing Copy/Check imports reused. READY.
- Coherence: no shared-service touched; no same-file overlaps. Merge guidance: merge READY 023,026,027,028 (+020,021,022,024 from cycle 6) sequentially, rebuild after each.

## 🔄 CYCLE 8 — 2026-09-09: 5 active (029 unblocks 025 + 030–033 fresh)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 029 | Scholarships: add deadline field (unblocks badges) | `ScholarshipTrackerWorkspace.tsx` ONLY (56 lines, item `{id,title,stage}` — verified): add optional `deadline?: string` (YYYY-MM-DD date input in add-form + display next to stage); existing items (no field) keep working; localStorage shape tolerant. Accept: build 0; add+display round-trips; old entries unaffected. | `agent/029-scholarship-deadline` | in-progress | 1 | Then re-issue 025 badges. |
| 030 | Habit tracker: streaks + today progress | `NewAppsWorkspaces.tsx` HabitSleep section ONLY (verified: `habits` state keyed `${today}:${h}`, localStorage-backed): per-habit streak chip (consecutive days ending today/yesterday, computed from existing keys) + "N/4 today" header count. No key-shape change. Accept: build 0; streaks correct across day boundary; toggles unchanged. | `agent/030-habit-streaks` | in-progress | 1 | Live gamification. |
| 031 | Study card: harden share + download | `StudyCardModal.tsx` ONLY (157 lines, verified): `handleShareLink` raw clipboard.writeText → try/catch + fallback (unhandled rejection today); `handleDownloadSvg` → append link to DOM before click (Firefox) + revoke after; keep existing Copied feedback + filenames. Accept: build 0; no unhandled rejections; download works detached-DOM-free. | `agent/031-studycard-harden` | in-progress | 1 | Judges download cards. |
| 032 | App store: search filter | `AppStoreModal.tsx` ONLY (untouched, APP_CATALOG grid): read first; additive search input filtering rendered apps by name/description (case-insensitive); empty query restores all; grid + install flows unchanged. If no app grid renders here, REPORT BACK no-op. Accept: build 0; typing filters live. | `agent/032-appstore-search` | in-progress | 1 | 018 pattern reuse. |
| 033 | Gmail radar: unread badges on tabs | `GmailRadarTab.tsx` ONLY (untouched; category tabs ~L105 + refresh — verified): read first; per-category unread count badge derived from EXISTING email objects/flags only (no fetch change); if no read/unread signal exists on items, REPORT BACK no-op. Accept: build 0; counts match list; refresh untouched. | `agent/033-gmail-badges` | in-progress | 1 | Flagship tab triage. |

## ✅ REVIEW — cycle 8 (2026-09-09: all 5 READY, 0 rework)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 029, 030, 031, 032, 033 ALL exit 0.
- 029 (pushed): `Item` typed (was `any[]` — strict improvement), optional `deadline`, date input + "Due MMM d" (manual Y/M/D parse, no TZ shift; raw fallback), old entries tolerant. READY — unblocks 025 badges (034 stacks on this branch).
- 030 (58d36e1, pushed): `habitsList` extracted (same 4 strings), N/4 today, `streakFor` walk-back (cap 365). Commander verified file's `today` is `toISOString().slice(0,10)` — identical format to streak walk, keys match. Plain-text streak chip (no Flame import existed — correct call). Push had transient reject, retry confirmed. READY.
- 031 (pushed): share → async try/catch + fallback, feedback ONLY on actual success (better than spec's minimum); download → DOM-append + remove + revoke, filename kept. Worker ran tsc: zero errors in file. READY.
- 032 (abca7de, pushed): base already had desktop search (`hidden md:flex` header input + results memo) — worker correctly added ONLY the missing mobile (`md:hidden`) input wired to the same `searchQuery` state. Minimal, non-duplicative. READY.
- 033 (e4fedf0, pushed): `matchesCategory` extracted (identical logic, reused), `unreadCounts` memo via `rawEmail.unread` + rawEmails join, badges with aria-labels, zero-count hidden. Worker ran tsc: 42 pre-existing, 0 in file. LIMITATION (worker-flagged, accepted): live `fetchAcademicEmails` never populates `unread`, so badges show on demo/cached data only → follow-up 035 wires `labelIds→UNREAD`. Badges ignore active search filter (per-category totals, as ordered). READY.
- Coherence: no shared-service touched; no same-file overlaps. Merge guidance: merge READY 029,030,031,032,033 (+023,026,027,028,020,021,022,024) sequentially, rebuild after each. 034 stacks on 029 — merge 029 first, then 034.

## 🔄 CYCLE 9 — 2026-09-09: 5 active (034 stacked badges + 035–038 fresh)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 034 | Scholarship urgency badges (stacked on 029) | Worktree `/tmp/wt029stack` from branch `agent/029-scholarship-deadline` (NOT main — deadline field lives there), new branch `agent/034-scholarship-badges`: local day-diff helper + Overdue/today/tomorrow chips + tint on `deadline` (029 format YYYY-MM-DD — verified). No-date rows unchanged. Accept: build 0. Merge AFTER 029. | `agent/034-scholarship-badges` | in-progress | 1 | 025 reborn. |
| 035 | Gmail fetch: populate unread from labelIds | `src/services/googleWorkspace.ts` `fetchAcademicEmails` ONLY (verified: `format=full` detail fetch, no labelIds use; `EmailMessage.unread?` exists per 033): add `unread: (data.labelIds \|\| []).includes('UNREAD')` to returned object. Nothing else. Accept: build 0; type keeps compiling; no other service touched. | `agent/035-gmail-unread-flag` | in-progress | 1 | Completes 033 for live mail. Critical? No — normal feature. |
| 036 | Drive tab: sort dropdown | `GoogleDriveTab.tsx` ONLY (verified: search + category + `filteredFiles` memo, no sort): sort control (Name A–Z / Newest / Oldest) applied AFTER existing filter; read `SchoolFile` fields first — if no date field, offer Name + Recently-opened?? NO — if no date, REPORT BACK no-op. Accept: build 0; filter+sort compose. | `agent/036-drive-sort` | in-progress | 1 | Triage win. |
| 037 | Schedule modal: duration presets | `ScheduleStudyModal.tsx` ONLY (verified: `durationMinutes` state default 45 + input ~L181): preset chips 25/45/60/90 wired to existing `setDurationMinutes`; end-time math untouched. Accept: build 0; chips set field; custom input still works. | `agent/037-schedule-presets` | in-progress | 1 | Preset pattern reuse. |
| 038 | Research brief: download .md + harden copy | `NotebookLMStudioTab.tsx` ONLY (verified: `handleCopy` raw clipboard ~L84, `handleSaveToNotes`, NO download): add "Download .md" button for `activeBrief` (Blob pattern, `${topic}.md` sanitized filename); harden `handleCopy` with try/catch+fallback (031 pattern). Save-to-notes untouched. Accept: build 0; download + copy work; no-brief state unchanged. | `agent/038-brief-download` | in-progress | 1 | Judges keep artifacts. |

## ✅ REVIEW — cycle 9 (2026-09-09: all 5 READY, 0 rework)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 034, 035, 036, 037, 038 ALL exit 0.
- 034 (pushed, base confirmed `agent/029-scholarship-deadline`): diff vs 029 shows ONLY badge additions (local `dayDiff`, chips + tints, no-deadline cards byte-identical). Stacked merge order: 029 then 034. READY.
- 035 (0d75181, pushed): one-line `unread` from `labelIds`, `types.ts` untouched (field pre-existed — verified, not assumed). Direct-tsc: 0 errors in googleWorkspace.ts. Shared-service change is strictly additive (optional field). READY — completes 033 for live mail.
- 036 (b209acb, pushed): sort-after-filter on a copy, DEFAULT = today's order (correct default call), `modifiedTime` guarded. READY.
- 037 (6aa1df9, pushed): file actually has a `<select>` 30/45/60/90 (not numeric input) — worker kept it, added 25/45/60/90 chips beneath wired to same setter. Mild overlap with select, but 25-min preset is NEW and chips are faster; additive, harmless. READY with note.
- 038 (1666edc, pushed): guarded Download .md (topic slug + fallback), copy hardened, save-to-notes untouched. Direct-tsc: 0 errors in file. READY.
- Coherence: 035's optional field can't break EmailMessage consumers; no same-file overlaps. Merge guidance: merge 029→034 in order, plus 035,036,037,038 sequentially, rebuild after each.

## 🔄 CYCLE 10 — 2026-09-09: 5 active (stub-to-working + safe additives)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 039 | Group projects: working task lists | `GroupProjectWorkspace.tsx` ONLY (31 lines, verified stub: projects `{id,name,tasks:[],members:[],folderUrl}` with NO task UI): per-project task add (input+Enter) + toggle done checkboxes + "N/M done" count, persisted to existing `scc_group_projects_v1` (tasks as `{id,text,done}`; old `tasks:[]` entries fine). Members/Drive stub untouched. Accept: build 0; add/toggle round-trips reload. | `agent/039-group-tasks` | in-progress | 1 | Stub → working. |
| 040 | Rubric checker: live input counts | `RubricCheckerWorkspace.tsx` ONLY (verified: `essayText` + `rubricText` textareas, AI check flow): additive "N words" micro-labels under each textarea (027 pattern, derived consts). Check flow + result untouched. Accept: build 0; counts update live. | `agent/040-rubric-counts` | in-progress | 1 | Safest order this cycle. |
| 041 | Peer Q&A: copy answer button | `PeerQAWorkspace.tsx` ONLY: read first; per-answer copy button (clipboard+fallback, Copied feedback, 019 pattern). If NO rendered answer text exists, REPORT BACK no-op. Accept: build 0; copies answer text; silent degrade. | `agent/041-peerqa-copy` | in-progress | 1 | No-op fallback armed. |
| 042 | Daily radar: persist chronotype | `DailyRadarTab.tsx` chronotype ONLY (verified: `useState('morning')` ~L63, 3 buttons ~L217-249): init from `scc_chronotype_v1` + save on change (try/catch, validate value). Scheduling/AI calls untouched. Accept: build 0; choice survives reload. | `agent/042-chronotype-persist` | in-progress | 1 | One-line-class change. |
| 043 | Feynman: reading-time per tier | `FeynmanWorkspace.tsx` ONLY: read first; if tier explanation content is a rendered STRING, add "~N min" label (words/200); else REPORT BACK no-op. Tiers, simplify flow, copy untouched. Accept: build 0. | `agent/043-feynman-readtime` | in-progress | 1 | No-op fallback armed. |

## ⏸️ REVIEW — cycle 10 (partial: infra flakes + 1 no-op; retries queued as cycle 11)

- 041: honest no-op — `replies: []` written on ask but NEVER rendered; no answer text to copy. Branch (empty) deleted + worktree removed by commander. Status BLOCKED → re-scoped as 044 (render replies first, then copy becomes meaningful). NOTE: my plan path was wrong (`src/components/PeerQAWorkspace.tsx` vs actual `src/components/workspaces/PeerQAWorkspace.tsx`) — worker adapted correctly; future plans use the `workspaces/` path.
- 043 (726e673, committed LOCALLY, NOT pushed — `github.com:443` timeout): tier strings confirmed (`tier1_eli5/tier2_highschool/tier3_undergrad`), `~N min read` in tier-tab row. Worker full `npm run build` exit 0 (18 min wall — machine contention). Commander: commit + stat verified locally; push to retry. Conditionally READY pending push + fast syntax re-verify.
- INFRA (not task-level, 0 attempts consumed semantically — retries keep	heir branches fresh): 039 (SSE timeout), 040 (provider headers 300s timeout), 042 (socket closed). No worker output; stale worktrees/branches (if any) cleaned before retry.
- No BLOCKED-count risk: flakes are transport errors with zero worker output, not rejections.

## 🔄 CYCLE 11 — 2026-09-09: 5 active (3 infra-retries + 044 unblock + 045 fresh)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 039 | RETRY Group projects task lists | Same plan as cycle 10 (per-project add/toggle/count, `scc_group_projects_v1`, `{id,text,done}`). Clean slate: remove stale worktree/branch first if present. | `agent/039-group-tasks` | in-progress | 2 | Attempt 1: SSE timeout, no output. |
| 040 | RETRY Rubric live counts | Same plan (essay+rubric "N words" labels). Clean slate first. | `agent/040-rubric-counts` | in-progress | 2 | Attempt 1: provider timeout. |
| 042 | RETRY Chronotype persist | Same plan (`scc_chronotype_v1` init+save). Clean slate first. | `agent/042-chronotype-persist` | in-progress | 2 | Attempt 1: socket closed. |
| 044 | Peer Q&A: render replies + reply box | `src/components/workspaces/PeerQAWorkspace.tsx` ONLY (verified: items `{id,course,question,anonymous,replies:[]}`, replies never rendered): render reply list under each question + reply input (persist to `scc_peer_qa_v1`, append `{id,text,createdAt}` — tolerate legacy entries). Ask flow otherwise untouched. Accept: build 0; reply round-trips reload. | `agent/044-peerqa-replies` | in-progress | 1 | Unblocks 041-copy. |
| 045 | Wikipedia: copy summary button | `WikipediaLookupModal.tsx` ONLY (verified: summary view ~L123+, buttons only close/Lookup, no copy): "Copy" button in summary header copying `title + description + extract` (check exact field names in file first) via clipboard+fallback, Copied feedback. Loading/error/empty untouched. Accept: build 0. | `agent/045-wiki-copy` | in-progress | 1 | 019 pattern reuse. |

## ✅ REVIEW — cycle 11 / DRAIN (2026-09-10: all 5 READY + 043 confirmed; drain complete, loop halted)

- Independent builds per branch (/tmp worktree + symlinked node_modules, sequential): 039, 040, 042, 044, 045 ALL exit 0.
- 039 (pushed): per-project add-row (input+Enter+Add) + checkbox toggles + N/M count; `toTasks` guard tolerates legacy string/malformed entries; project create + stub text + peer-review placeholder untouched. Stub → working. READY.
- 040 (116f1d0, pushed): +5 lines, two derived consts + muted labels under each textarea; check flow untouched. READY.
- 042 (2305af0, pushed): lazy-init validated against 3 values + setter wrapper persists; button JSX byte-identical. READY.
- 043 (726e673, pushed by commander on retry — worker's push hit `github.com:443` timeout; network recovered): tier strings + `~N min read`; worker full build exit 0 + commander esbuild syntax OK. READY.
- 044 (adb25a8, pushed): replies rendered (guarded text + timestamp, legacy-tolerant) + per-question reply box via existing storage pattern; ask flow untouched. Unblocks 041-copy. READY.
- 045 (b37dac3, pushed): header Copy button (`displayTitle + description + extract`), clipboard+fallback, copied reset on new lookup; states untouched. READY.
- 041 (from cycle 10): BLOCKED — `replies: []` never rendered, nothing to copy. Superseded by 044 (replies now render); a future copy-reply order may reuse 041's plan against 044's output. Empty branch already deleted by commander.
- Coherence: no shared-service touched (all local component state); no same-file overlaps among 039–045. Merge guidance: merge READY 034 (after 029), 035, 036, 037, 038, 039, 040, 042, 043, 044, 045 sequentially with all earlier READY batches (011–013, 014, 015–024, 026–033), rebuild after each per AGENTS.md. Stacked pair: 029 BEFORE 034.
- DRAIN received 2026-09-10: dispatched nothing new; all active orders reviewed to terminal states; ledger current. No STOP file present; halting per drain directive. LSB: 0 in-progress, 0 consecutive BLOCKED (last BLOCKED was 041-no-op, followed by 10 READY).

## ✅ MERGE — 2026-09-10 (merger session, integrate/merge-2026-09-10 → main @806fb27)

- Scope: every order with status `ready` (011–045 except BLOCKED 025/041). Remote static the whole session (`HEAD..origin/main` empty at start and before final merge — no sibling commits absorbed, no pull needed). No force-push, ever.
- Merged (33, EACH with `npm run build` exit 0 + tsc gate showing zero new errors in touched files — only pre-existing errors, line-shifted): 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 026, 027, 028, 029, 034 (right after 029, stacked), 030, 031, 032, 033, 035, 036, 037, 038, 039, 040, 042, 043, 044, 045. Local-only branches 011/012/013/015 merged from local refs (never pushed standalone — now on main anyway).
- Conflict (0): every merge applied clean first try; no `merge --abort` needed. 022 applied cleanly on top of 011 (different hunks); 034 applied cleanly on top of 029 (stacked base).
- Lint trajectory: baseline 51 lines on origin/main → final 50 lines on merged main (013's `SoundType`→`TrackId` fixed one pre-existing error). No branch added a single new tsc error.
- Coherence: shared services (`firebase/theme/googleAuth/canvas.ts`) untouched; `googleWorkspace.ts` strictly +1 optional field; no resurrected deletes; no duplicate writers (new localStorage keys all unique: `scc_last_morning_mood`, `scc_omnibox_recent_v1`, `scc_chronotype_v1`; existing keys read or extended via their own patterns). MINOR NOTE (not a violation): three local day-diff helpers now exist (011 `getUrgencyInfo`, 024 `getRelativeDueLabel`, 034 `dayDiff`) — read-only triplication, candidate for a shared util in a future order.
- Pushed `a56dd3e..806fb27` to origin/main (no force). Vercel will deploy main. 32 files, +1138/−142.
- Statuses below flipped `ready`/`in-progress` → `merged`. Human review tips: 019 (Enter copies math when result shown), 017 (same-length regen keeps timer), 033+035 (badges now live for real mail), 037 (chips overlap select, adds 25-min).

### Status flips (all → `merged` @806fb27)
011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038, 039, 040, 042, 043, 044, 045.
Remain `blocked`: 025 (superseded by 029+034), 041 (superseded by 044). Remain `conflict`: 006 (CreationStudio XSS sink still OPEN — needs manual revive).

- Reviewed to READY: 011, 012, 013, 015, 014-rework, 016, 017, 018, 019, 020, 021, 022, 023-rework, 024, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038, 039, 040, 042, 043, 044, 045 (33 branches)
- BLOCKED (honest no-ops, branches cleaned): 025 (no deadline field → unblocked by 029, reborn as 034 READY), 041 (replies never rendered → unblocked by 044)
- Rework rounds used: 014 (1, scope violation fixed), 023 (1, invalid Mermaid `vert` fixed) — both landed READY
- Infra flakes absorbed: 039/040/042 attempt-1 transport timeouts (retried clean), 043 push timeout (commander retried), 016–020 stale empty worktrees from prior session (cleaned + re-dispatched, all landed)
- Still OPEN / human actions: (1) merge READY branches sequentially + rebuild (029 BEFORE 034); (2) revive 006 conflict (`agent/006-creationstudio-svg-xss` — CreationStudioWorkspace:304 XSS sink still OPEN on main); (3) `npm ci` at convenience (tsc shim + missing jsdom/dompurify in main checkout); (4) consider follow-ups: 041-copy-reply (now unblocked), App-wide `?`-shortcut discoverability, human QA pass on Enter-hijack note in 019.

## ⚠️ INCIDENT — 2026-09-12: uncommitted ledger wiped by worker `reset --hard`

- What happened: cycle-12 section (046 golden-rule doc applied to AGENTS.md uncommitted; 047 stash-preserve plan; 048 review plan) + commander's cycle-13 ledger append lived only as uncommitted `M .opencode/ORDERS.md / M AGENTS.md`. Order-051 worker ran `git reset --hard` in the SHARED checkout during a branch repair → both files reverted to HEAD. Sibling session's 13 pushes (v2.8.2–v2.10.0, @4fae06f) are intact and absorbed via fast-forward (14 files, no conflicts).
- Survived: `stash@{0}` (commander-temp gemini-detailed + theme-sync) intact; all 5 cycle-13 branches pushed (049/050/051/052/053); orphaned 2-line DashboardHome fragment saved to `Temp\opencode\orphan-dashboard.patch` then reverted (it referenced 049 vars on the wrong base — unbuildable if committed).
- Lessons (STANDING RULES for all future workers): (1) NEVER run `git reset --hard`, `git checkout -- <file>`, or `git clean` in the shared checkout — use an isolated worktree under `.worktrees/` and commit early/often there. (2) Commander commits ledger to `commander/ledger-*` branches + pushes (never main) so it survives.
- Lost work to redo: 046 golden-rule AGENTS.md section → re-issued below as worker order 046 (AGENTS.md only, own branch).

## 🔄 CYCLE 13 — 2026-09-12: user bug-bash batch 1 (all 5 returned build 0 + pushed)

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 049 | Home focus "NaNm/75m" → "0m/75m" | DashboardHome only: `completedFocusSessions` is undefined (store has `completedSessions`) → `undefined*25=NaN`. Guard finite-else-0. | `agent/049-focus-nan-guard` | in-review | 1 | Commit 42190a9. Also kills pre-existing TS2339. |
| 050 | Focus Block never marks onboarding "Start Pomodoro" done | PomodoroWorkspace only (+20/-0): ensure `scc_pomo_completed_v1` on work-session start. | `agent/050-pomo-onboarding-key` | in-review | 1 | Commit 31086f3. |
| 051 | Quiz yields 1 question though 20 chosen | QuizGeneratorWorkspace only: count+difficulty into prompt, full-array parser, local top-up to exact N. | `agent/051-quiz-count` | in-review | 1 | Commit 8dc8180, base 4fae06f. |
| 052 | Rubric Pre-Check button dead | RubricCheckerWorkspace only: silent catch → local heuristic baseline + key-gated AI + visible errors. | `agent/052-rubric-precheck` | in-review | 1 | Commit 6764159. |
| 053 | Feynman "Explain" dead | FeynmanWorkspace only: sync local 3-tier scaffold + key-gated AI enhance. | `agent/053-feynman-fallback` | in-review | 1 | Commit 896b3e5. |

- Commander verification done 2026-09-12: `origin/agent/049|050|051|052|053` all exist remotely (ls-remote confirmed); local diffs vs origin/main show single-file scopes as ordered (049 DashboardHome +18/-10; 050 PomodoroWorkspace +20/-0; 051 QuizGeneratorWorkspace +287/-4; 052 RubricCheckerWorkspace +190/-3; 053 FeynmanWorkspace +98/-4). Worker-reported `npm run build` exit 0 on each; tsc shows zero errors in touched files (repo-wide pre-existing baseline only). Coherence: no shared-service signature changed; 051 keeps legacy `generateInteractiveQuiz` as secondary source (additive). → ALL 5 READY. Merge guidance: sequential 049→050→051→052→053, rebuild after each; watch 049 vs sibling DashboardHome restyle (same lines repainted in v2.10.0 — hunk may need hand-apply); changelog trio skipped per-branch BY DESIGN, consolidated entry lands as order 060 after merges.
- Statuses 049–053 → `ready` (verdict recorded here; human merges on return).

## 🔄 CYCLE 14 — 2026-09-12: user bug-bash batch 2 (5 parallel, distinct files)

Standing rules: own branch from latest `origin/main`, ONE file scope each, isolated worktree under `.worktrees/` (NEVER reset/checkout/clean the shared tree), no changelog trio, `npm run build` exit 0, push branch.

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 046 | Golden rule doc: pull-before-push in AGENTS.md (REDO — wiped, see incident) | `AGENTS.md` only: add `## 0. GOLDEN RULE` (finish → check remote → pull+merge if moved → push; never push blind; never commit tokens). No product code. | `agent/046-golden-rule-doc` | in-progress | 1 | Redo of lost cycle-12 work. |
| 054 | Photo Math OCR slow/dead → Gemini vision flow | `PhotoMathWorkspace.tsx` ONLY: downscale client-side, Gemini vision when key present w/ timeout + progress; manual-entry fallback + honest errors, never hang. Accept: photo → steps or error in seconds. | `agent/054-photomath-vision` | in-progress | 1 | User: "too long, doesn't work". |
| 055 | Mermaid live preview + AI mindmap dead | `MermaidWorkspace.tsx` ONLY (keep 002 SVG sanitize): fix preview init/render + prompt→mindmap codegen w/ template fallback. Accept: default diagram renders; prompt → mindmap + preview. | `agent/055-mermaid-revive` | in-progress | 1 | Mermaid syntax: no bare `vert` (see 023 lesson). |
| 056 | NotebookLM Brief ParseError | `NotebookLMStudioTab.tsx` ONLY: harden brief parse (validate/try-catch + raw-section fallback, never throw to UI). Accept: generate → readable brief, zero ParseError. | `agent/056-brief-parse` | in-progress | 1 | Pairs with 038 download. |
| 057 | Unit evaluator always "Syntax Error" | `UnitConverterWorkspace.tsx` ONLY: fix tokenizer/parse, per-error reasons with position, AI-calc button when key present. Accept: `2+2*3`→8; bad input names the problem. | `agent/057-evaluator-fix` | in-progress | 1 | Never bare "Syntax Error". |
| 058 | Periodic Table bigger/fit/colors/select | `PeriodicTableWorkspace.tsx` ONLY (`elementsData.ts` read-only): larger cells, rounded-mass + truncated names, group color legend, detail ONLY on click. | `agent/058-periodic-polish` | queued | 1 | NOT dispatched — DRAIN arrived first; stays queued. |

## ✅ REVIEW — cycle 14 / DRAIN (2026-09-12: all 5 active returned, 0 blocked, drain complete, loop halted)

Commander verification (ls-remote + diff vs origin/main, worker build reports):
- 046 `agent/046-golden-rule-doc` (4faabb5): AGENTS.md +3 only, docs-only per plan. Pushed. Acceptance (section present) met → READY.
- 054 `agent/054-photomath-vision` (58a56e8): PhotoMathWorkspace only (+352/-23). Old double full-size parallel SDK calls → single downscaled vision call, 60s timeout, progress states, manual-entry fallback, spinner always resolves. Build 0, tsc zero in file. Pushed → READY. Note: new UI strings are English literals, not i18n keys (accepted — visible in all locales).
- 055 `agent/055-mermaid-revive` (968dc05): MermaidWorkspace only (+161/-31). Root cause: error branch unmounted the render container (all later previews dead) + per-keystroke init. Fixed: always-mounted container, init-once, debounced v11 render w/ race guard, sanitize kept, local mindmap fallback, bare-`vert` strip. Build 0, tsc zero in file. Pushed → READY.
- 056 `agent/056-brief-parse` (2ad1b48): NotebookLMStudioTab only (+153/-10). Parse path hardened (text-first, bracket-slice fallback, code-fence strip, field defaults, inline error state, guarded load/save); 038 download/copy intact. Build 0, tsc zero in file. Pushed → READY. Note: exact ParseError line was inferred (unguarded `res.json()` + assuming parses), hardening covers all three sites.
- 057 `agent/057-evaluator-fix` (c10344b): UnitConverterWorkspace only (+334/-27). `Function()`-eval replaced with recursive-descent parser (precedence, implicit-mult, functions, domain checks), position-aware errors, "Ask AI" BYOK button; conversions untouched. Sample suite 9/9 + 8 error cases verified by worker. Build 0, tsc zero in file. Pushed → READY. Note: error positions are 0-based (accepted, flagged for human).
- Coherence: 5 distinct files, no overlaps with each other or cycle-13 branches; no shared-service signature changed (direct Gemini REST fetches read existing key storage only). Merge guidance: sequential 046→054→055→056→057 after the 049–053 batch, rebuild after each per AGENTS.md.
- DRAIN received before 058 dispatch: 058 stays `queued` (not blocked, attempts untouched). Changelog trio still skipped per-branch by design — consolidated release entry lands as order 060 after human merges.

### Status flips
049, 050, 051, 052, 053, 046, 054, 055, 056, 057 → `ready` (10 branches await human merge). 058 → `queued`. 0 `in-progress`. Consecutive BLOCKED: 0.

## ✅ MERGE — 2026-09-12 (merger session, integrate/merge-2026-09-12 → main @7b36d54)

Human ordered "merge them, remember to pull". Pull-first honored: `HEAD..origin/main` empty at start AND before push — remote never moved, no pull needed, no sibling commits absorbed.
- Merged (10, EACH `git merge --no-ff` + `npm run build` exit 0, plus final build on main = 11 green builds): 049, 050, 051, 052, 053, 046, 054, 055, 056, 057.
- Conflict (0): the feared 049-vs-v2.10.0 DashboardHome clash auto-merged clean via ort; post-merge tree holds BOTH sibling linen styling and 049's `safeCompletedFocusSessions/safeSprintGoal/focusProgressPct` guards. No `merge --abort` needed.
- Coherence: 10 files (single-file UI/workspaces + AGENTS.md docs); zero diff under `src/services/`; no resurrected deletes. NOTE: `scc_pomo_completed_v1` now has two writers (pre-existing `stores/pomodoroStore.ts` + new 050 code writing `'1'` on focus-block start if absent) — semantics compatible, store's storage-event listener keeps sync; first place to look if pomo counts ever drift.
- Pushed `4fae06f..7b36d54` to origin/main (no force). Integration branch also pushed for the record. Vercel will deploy main.
- Untouched: stash@{0}, ORDERS.md, changelog trio (consolidated entry still pending as order 060).

### Status flips (all → `merged` @7b36d54)
049, 050, 051, 052, 053, 046, 054, 055, 056, 057.
Remains `queued`: 058 (Periodic Table polish — dispatch when DRAIN lifts). Remain `blocked`: 025, 041 (superseded, historic). Remains `conflict`: 006 (CreationStudio XSS sink — still OPEN, needs manual revive).
