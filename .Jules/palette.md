## 2026-09-11 - Modal Accessible Dialog Attributes and Keyboard Dismissal
**Learning:** Custom confirmation modal components easily miss standard WAI-ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) and global key listeners for `Escape`, creating accessibility friction for keyboard-only and screen reader users.
**Action:** When creating or editing modal overlays in React, always attach `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, an explicit `aria-label` for icon-only close buttons, and an `Escape` key event listener in a `useEffect`.
