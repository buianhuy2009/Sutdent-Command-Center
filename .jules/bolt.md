## 2025-05-18 - Memoizing Inline Partitioning in Top-Level Dashboard
**Learning:** Performing O(N) array filtering and sorting inside an unmemoized inline IIFE within a top-level component's render body causes redundant computations on every keystroke or local state change in parent controls (such as inputting preferred name or daily intention).
**Action:** Extract inline array partitioning and sorting into a single O(N) pass inside `useMemo` with explicit dependency tracking.
