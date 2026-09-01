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