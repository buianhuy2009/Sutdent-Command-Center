## 2025-05-18 - Safe Expression Evaluation in Client Workspaces
**Vulnerability:** Client-side workspace components (like `UnitConverterWorkspace.tsx`) used `new Function('return ' + expr)()` for dynamic expression evaluation, opening up arbitrary JavaScript execution vulnerabilities.
**Learning:** Evaluators that rely on `new Function(...)` or `eval()` violate Content Security Policy (CSP) `unsafe-eval` restrictions and allow malicious string inputs to run arbitrary JavaScript code in the browser context.
**Prevention:** Always parse user math/formula expressions using a non-evaluating tokenizer and shunting-yard RPN parser rather than dynamic JS execution engines.
