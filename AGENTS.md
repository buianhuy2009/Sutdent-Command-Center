# StudentOS Development & Agent Rules

## 0. GOLDEN RULE
Finish work → `git fetch origin` + check `HEAD..origin/main` → if remote moved, `git pull --no-rebase origin main` and merge/rebuild first → only then push. Never push blind. Never commit tokens/secrets.

## 1. TOKEN EFFICIENCY & CODE CONSTRAINTS
- Make precise, surgical line edits. Do not rewrite full 200+ line files when modifying small functions.
- Do not re-index the entire codebase unless explicitly instructed.

## 2. VERIFICATION & DEPLOYMENT LOOP
Whenever a change is requested:
1. Edit the targeted files.
2. Run `npm run build` in the terminal to verify syntax and bundling.
3. If the build fails: Inspect the terminal error stack and self-repair (Max 3 retry loops).
4. Once `npm run build` passes with exit code 0: Push the Code to the Github Repository
5. Inform the user that the build passed and the update is pushing to Vercel.

## 4. CHANGELOG DISCIPLINE (MANDATORY EVERY UPDATE, BIG OR SMALL)
Every user-visible change must update the changelog in the same session — no silent fixes.
1. Add a `VersionRelease` entry at the top of `RELEASES` in `src/components/ChangelogModal.tsx` (plain English: `highlights` = 1-line student benefits, `details` = what changed + where to find it). Only the newest entry keeps `badge: 'Latest Update'`.
2. Bump `CURRENT_VERSION` in `ChangelogModal.tsx` AND `version` in `package.json` together (patch for fixes, minor for features).
3. Append an `<item>` to `public/changelog.xml` with matching version, date (UTC), title and 1-sentence description.
4. `npm run build` must pass before push. Never leave `RELEASES`, `package.json` and `changelog.xml` out of sync.

## 3. MULTI-AGENT MERGE SAFETY (MANDATORY EVERY SESSION)
Multiple agents/users work on `main` in parallel. NEVER push blind.
1. **Session start**: run `git fetch origin` and `git log --oneline HEAD..origin/main`. If the remote moved and the newest commit is NOT yours (check author/message), another session landed work while you were away.
2. **Before pushing**: `git fetch origin` again. If `HEAD..origin/main` is non-empty, `git pull --no-rebase origin main` FIRST (never force-push, never `push --force`).
3. **After any pull/merge**: review the incoming diff for coherence with your in-progress work —
   - resurrected code you deliberately deleted (banners, legacy themes, dead flows),
   - duplicate state/effects for the same concern (two writers of one localStorage key / DOM class),
   - changed signatures of shared services (`services/firebase.ts`, `services/theme.ts`, `services/googleAuth.ts`, `services/canvas.ts`) — keep them backward compatible (optional params, additive exports) and update all call sites.
4. **Re-verify**: run `npm run build` again after the merge resolves. Only push when the merged tree builds with exit code 0.
5. **Report**: tell the user whose commit you absorbed, what it touched, and anything you adjusted to keep the merge coherent.