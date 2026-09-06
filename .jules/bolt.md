## 2026-09-06 - Unconditional Hook Order in Modal Optimization
**Learning:** When adding `useMemo` or other hooks to optimize a modal component that has a conditional early exit (`if (!isOpen) return null;`), placing `return null` before hooks causes React to throw "Rendered more hooks than during the previous render" when the modal is opened.
**Action:** Always place `if (!isOpen) return null;` after all hook declarations (or inside the render return block) so hook counts remain identical across open and closed states.
