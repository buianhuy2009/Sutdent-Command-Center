# StudentOS Development & Agent Rules

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