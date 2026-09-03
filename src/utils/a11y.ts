/** Focus trap for modals + aria-live announcer + 44px touch-target audit helper. */

export function trapFocus(container: HTMLElement): () => void {
  const selector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const els = [...container.querySelectorAll<HTMLElement>(selector)].filter((el) => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0]; const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKey);
  // focus first element on open
  const first = container.querySelector<HTMLElement>(selector);
  try { (first ?? container).focus?.(); } catch {}
  return () => container.removeEventListener('keydown', onKey);
}

let liveRegion: HTMLElement | null = null;
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  try {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = '';
    requestAnimationFrame(() => { if (liveRegion) liveRegion.textContent = message; });
  } catch {}
}

/** Dev-only audit: returns elements smaller than 44px touch target. */
export function auditTouchTargets(root: ParentNode = document): HTMLElement[] {
  const bad: HTMLElement[] = [];
  try {
    root.querySelectorAll<HTMLElement>('button, a').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44) && !el.closest('[data-compact-ok]')) bad.push(el);
    });
  } catch {}
  return bad;
}
