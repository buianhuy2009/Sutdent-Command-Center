## 2026-09-10 - Secure Mermaid SVG Diagram Rendering
**Vulnerability:** `mermaid.initialize({ securityLevel: 'loose' })` permitted execution of scripts and HTML event handlers inside rendered Mermaid diagrams. Additionally, diagram SVGs were injected via `dangerouslySetInnerHTML` without HTML sanitization in `CreationStudioWorkspace.tsx`.
**Learning:** Using `securityLevel: 'loose'` allows malicious prompt injection or user input containing HTML/script tags in diagram nodes to execute XSS in the client context.
**Prevention:** Always initialize Mermaid with `securityLevel: 'strict'` and sanitize all rendered SVG strings using `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } })` before passing to `dangerouslySetInnerHTML`.
