// Google OAuth offline-grant engine — permanent Workspace sessions.
//
// Problem it solves: GIS/Firebase popup access tokens die after ~1 hour, which
// used to surface a manual "session expired, reconnect" banner. This module:
//   1. Requests an offline grant via GIS `initCodeClient` (access_type=offline,
//      prompt=consent) so Google issues a long-lived `refresh_token`.
//   2. Exchanges the one-time code server-side (/api/auth/google/exchange) —
//      the client secret never ships to the browser.
//   3. Silently mints fresh access tokens (/api/auth/google/refresh) whenever
//      the current one is within 5 minutes of expiring, plus one retry on 401.
//
// Refresh-token storage: Firestore `users/{uid}/integrations/google` when a
// Firebase user is present (owner-only via security rules), mirrored to
// IndexedDB + localStorage for offline-first boot. Unauthenticated mode
// degrades to the local mirror only. The raw refresh token is never logged.

import {
  getStoredGoogleToken,
  setStoredGoogleToken,
  getValidGoogleToken,
  getGoogleTokenAgeMs,
  CORE_WORKSPACE_SCOPES,
  WORKSPACE_SCOPES,
} from './firebase';

const REFRESH_LS_KEY = 'scc_google_refresh_v1';
const REFRESH_IDB_KEY = 'google_refresh_grant_v1';
// Real Google access-token lifetime is 3,600s; start renewing 5 min early.
const REFRESH_EARLY_MS = 55 * 60 * 1000;
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export function getGoogleOAuthClientId(): string {
  try {
    const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {};
    return metaEnv.VITE_GOOGLE_CLIENT_ID || (typeof process !== 'undefined' ? (process as any).env?.VITE_GOOGLE_CLIENT_ID : '') || '';
  } catch {
    return '';
  }
}

/** Offline grant flow is available when a Web OAuth client id is configured. */
export function isOfflineGrantSupported(): boolean {
  return Boolean(getGoogleOAuthClientId()) && typeof window !== 'undefined';
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const w = window as any;
      if (w?.google?.accounts?.oauth2?.initCodeClient) return resolve();
      if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
        // Script tag present but library not ready yet — poll briefly.
        let tries = 0;
        const iv = setInterval(() => {
          tries++;
          if (w?.google?.accounts?.oauth2?.initCodeClient) {
            clearInterval(iv);
            resolve();
          } else if (tries > 50) {
            clearInterval(iv);
            reject(new Error('Google sign-in library did not load. Check your connection or ad-blocker, then retry.'));
          }
        }, 100);
        return;
      }
      const s = document.createElement('script');
      s.src = GIS_SCRIPT_URL;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load Google sign-in library. Check your connection or ad-blocker, then retry.'));
      document.head.appendChild(s);
    } catch (e) {
      reject(e);
    }
  });
}

interface RefreshGrant {
  rt: string;
  at: number;
  scope: string;
}

let cachedGrant: RefreshGrant | null | undefined; // undefined = not yet read

function readGrantSync(): RefreshGrant | null {
  if (cachedGrant !== undefined) return cachedGrant;
  try {
    const raw = localStorage.getItem(REFRESH_LS_KEY);
    cachedGrant = raw ? (JSON.parse(raw) as RefreshGrant) : null;
    if (cachedGrant && typeof cachedGrant.rt !== 'string') cachedGrant = null;
  } catch {
    cachedGrant = null;
  }
  return cachedGrant;
}

async function persistGrant(grant: RefreshGrant | null, uid?: string | null): Promise<void> {
  cachedGrant = grant;
  try {
    if (grant) localStorage.setItem(REFRESH_LS_KEY, JSON.stringify(grant));
    else localStorage.removeItem(REFRESH_LS_KEY);
  } catch {}
  try {
    const { db } = await import('./db');
    if (grant) await db.preferences.put({ key: REFRESH_IDB_KEY, value: JSON.stringify(grant) });
    else await db.preferences.delete(REFRESH_IDB_KEY);
  } catch {}
  // Cross-device home for the grant: owner-only Firestore doc (best effort —
  // offline or restrictive rules fall back to the local mirror silently).
  try {
    if (uid) {
      const [{ getFirestore, doc, setDoc }, { getApps }] = await Promise.all([
        import('firebase/firestore'),
        import('firebase/app'),
      ]);
      const apps = getApps();
      if (apps.length) {
        const dbf = getFirestore(apps[0]);
        if (grant) {
          await setDoc(
            doc(dbf, 'users', uid, 'integrations', 'google'),
            { refresh_token: grant.rt, scope: grant.scope, updated_at: new Date().toISOString() },
            { merge: true }
          );
        }
      }
    }
  } catch {}
}

/** Pull a cross-device grant down (e.g. fresh login on a second laptop). */
export async function hydrateRefreshGrant(uid?: string | null): Promise<boolean> {
  if (readGrantSync()) return true;
  try {
    const [{ getFirestore, doc, getDoc }, { getApps }] = await Promise.all([
      import('firebase/firestore'),
      import('firebase/app'),
    ]);
    const apps = getApps();
    const id = uid || (await import('./firebase')).auth?.currentUser?.uid;
    if (!apps.length || !id) return false;
    const snap = await getDoc(doc(getFirestore(apps[0]), 'users', id, 'integrations', 'google'));
    const rt = snap.exists() ? (snap.data() as any)?.refresh_token : null;
    if (typeof rt === 'string' && rt.length > 10) {
      await persistGrant({ rt, at: Date.now(), scope: (snap.data() as any)?.scope || '' }, id);
      return true;
    }
  } catch {}
  // IndexedDB mirror (survives localStorage clears within the same browser profile)
  try {
    const { db } = await import('./db');
    const row: any = await db.preferences.get(REFRESH_IDB_KEY);
    if (row?.value) {
      const parsed = JSON.parse(row.value) as RefreshGrant;
      if (parsed?.rt) {
        cachedGrant = parsed;
        try { localStorage.setItem(REFRESH_LS_KEY, row.value); } catch {}
        return true;
      }
    }
  } catch {}
  return false;
}

/** Synchronous: is there a stored offline grant that can mint access tokens? */
export function hasRefreshToken(): boolean {
  const g = readGrantSync();
  return Boolean(g && typeof g.rt === 'string' && g.rt.length > 10);
}

/** Forget the offline grant everywhere (revoked, or user disconnected). */
export async function clearRefreshGrant(uid?: string | null): Promise<void> {
  await persistGrant(null);
  try {
    const id = uid || (await import('./firebase')).auth?.currentUser?.uid;
    if (id) {
      const [{ getFirestore, doc, deleteDoc }, { getApps }] = await Promise.all([
        import('firebase/firestore'),
        import('firebase/app'),
      ]);
      if (getApps().length) {
        await deleteDoc(doc(getFirestore(getApps()[0]), 'users', id, 'integrations', 'google')).catch(() => {});
      }
    }
  } catch {}
}

// ---- Silent refresh (single-flight so parallel syncs share one request) ----

let inflightRefresh: Promise<boolean> | null = null;

/**
 * Mint a fresh access token from the stored refresh token.
 * Returns true when a usable access token is stored afterwards.
 * Revoked/invalid grants are forgotten and report false (caller reconnects).
 */
export function refreshGoogleAccessToken(force = false): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const grant = readGrantSync();
      if (!grant?.rt) return false;
      if (!force) {
        // Skip the network trip when the current token is comfortably fresh.
        const current = getValidGoogleToken();
        const age = getGoogleTokenAgeMs();
        if (current && (age === null || age < REFRESH_EARLY_MS)) return true;
      }
      const res = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: grant.rt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data?.error === 'refresh_revoked') {
        await clearRefreshGrant();
        return false;
      }
      if (!res.ok || !data?.access_token) return false;
      setStoredGoogleToken(data.access_token);
      return true;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

/**
 * Resolve a usable Google access token, refreshing silently when the current
 * one is missing, expired, or within ~5 minutes of expiring. Returns null only
 * when there is no grant at all (or the grant was revoked).
 */
export async function ensureFreshGoogleToken(): Promise<string | null> {
  try {
    const current = getValidGoogleToken();
    const age = getGoogleTokenAgeMs();
    if (current && (age === null || age < REFRESH_EARLY_MS)) return current;
    if (current && age !== null && age >= REFRESH_EARLY_MS) {
      // Aging token: try to renew, but the current one still works meanwhile.
      const ok = await refreshGoogleAccessToken(true);
      return ok ? getStoredGoogleToken() || current : current;
    }
    // Missing/expired: refresh is the only path (no nagging reconnect UI).
    if (hasRefreshToken()) {
      const ok = await refreshGoogleAccessToken(true);
      if (ok) return getStoredGoogleToken();
    }
    return current;
  } catch {
    return getStoredGoogleToken();
  }
}

/** Fetch wrapper for Google APIs: fresh token in, one silent retry on 401. */
export async function googleFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await ensureFreshGoogleToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const ok = await refreshGoogleAccessToken(true);
    if (ok) {
      const retryToken = getStoredGoogleToken();
      const retryHeaders = new Headers(init.headers || {});
      if (retryToken) retryHeaders.set('Authorization', `Bearer ${retryToken}`);
      res = await fetch(input, { ...init, headers: retryHeaders });
    }
  }
  return res;
}

// ---- Offline consent grant (one-time per device, permanent afterwards) ----

/**
 * Open the Google consent popup requesting OFFLINE access and exchange the
 * returned code server-side. Returns the fresh access token, or null when the
 * user dismisses / the flow is unavailable (caller keeps existing behavior).
 */
export async function requestOfflineGrant(opts: { gmail?: boolean } = {}): Promise<string | null> {
  if (!isOfflineGrantSupported()) return null;
  await loadGisScript();
  const clientId = getGoogleOAuthClientId();
  const scopes = opts.gmail ? WORKSPACE_SCOPES : CORE_WORKSPACE_SCOPES;
  const code: string = await new Promise((resolve, reject) => {
    try {
      const client = (window as any).google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        ux_mode: 'popup',
        callback: (resp: any) => {
          if (resp?.code) resolve(resp.code);
          else reject(new Error(resp?.error || 'Google consent was dismissed.'));
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || err?.type || 'Google consent failed.'));
        },
      });
      client.requestCode();
    } catch (e) {
      reject(e);
    }
  }).catch((e: any) => {
    const msg = String(e?.message || e || '');
    // Dismissals are not errors — stay silent and keep the current session.
    if (/dismiss|closed|popup_closed|cancel/i.test(msg)) return null as unknown as string;
    throw e;
  });
  if (!code) return null;
  const res = await fetch('/api/auth/google/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: 'postmessage' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error || 'Could not complete Google connection.');
  }
  setStoredGoogleToken(data.access_token);
  if (data.refresh_token) {
    let uid: string | null = null;
    try {
      uid = (await import('./firebase')).auth?.currentUser?.uid || null;
    } catch {}
    await persistGrant({ rt: data.refresh_token, at: Date.now(), scope: data.scope || scopes.join(' ') }, uid);
  }
  try {
    window.dispatchEvent(new CustomEvent('scc-google-token-updated', { detail: { token: data.access_token } }));
  } catch {}
  return data.access_token as string;
}

/** Forget everything Google-related on this device (plus server doc). */
export async function clearGoogleGrant(): Promise<void> {
  try {
    const { clearStoredGoogleToken } = await import('./firebase');
    clearStoredGoogleToken();
  } catch {}
  await clearRefreshGrant();
}
