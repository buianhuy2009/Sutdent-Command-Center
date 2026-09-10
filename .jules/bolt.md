# Bolt's Journal - Critical Learnings

## 2025-05-18 - Atomic Zustand Selectors & Polling Cache Signatures
**Learning:** Destructuring full Zustand store objects without selectors (`usePomodoroStore()`) in top-level components forces re-renders on any store update. Additionally, 4-second interval polling for badge counts running un-memoized `JSON.parse` operations degrades main thread idle performance.
**Action:** Always use atomic store selectors (`usePomodoroStore(state => state.field)`) and string signature caching on `localStorage` polling functions to skip unnecessary parsing and re-renders.
