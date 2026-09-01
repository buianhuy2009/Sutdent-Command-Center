import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delayMs: number): T {
  const timer = useRef<number | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const debounced = useCallback(((...args: any[]) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fnRef.current(...args), delayMs);
  }) as T, [delayMs]);
  return debounced;
}
