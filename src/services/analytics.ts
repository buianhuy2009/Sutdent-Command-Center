// Simple analytics stub — Plausible/gtag/PostHog hook
export type AnalyticsEvent = 'canvas_connected' | 'assignment_created' | 'pomodoro_complete' | 'syllabus_parsed' | 'command_executed' | 'focus_session' | 'grade_predicted' | 'page_view';
export function trackEvent(event: AnalyticsEvent, props?: Record<string, any>) {
  try {
    // Plausible
    (window as any).plausible?.(event, { props });
    // gtag
    (window as any).gtag?.('event', event, props);
    // PostHog
    (window as any).posthog?.capture(event, props);
    // console for dev
    console.debug('[analytics]', event, props);
    // Persist locally for offline funnel
    const raw = localStorage.getItem('scc_analytics_queue_v1');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ event, props, ts: Date.now() });
    if (arr.length > 200) arr.shift();
    localStorage.setItem('scc_analytics_queue_v1', JSON.stringify(arr));
  } catch {}
}
export function trackPageView(path: string) { trackEvent('page_view', { path }); }
