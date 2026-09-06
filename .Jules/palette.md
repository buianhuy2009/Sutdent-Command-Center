## 2024-05-24 - Add aria-labels to icon-only buttons
**Learning:** Found multiple icon-only buttons (like Trash and X icons) missing `aria-label` attributes across different components (e.g. `DocumentHubWorkspace.tsx`, `ScholarshipTrackerWorkspace.tsx`, `LandingPage.tsx`), which severely impacts screen reader accessibility since the purpose of these buttons cannot be communicated.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons.
