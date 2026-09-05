import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
} from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';

// Support Vite client-side environment variable overrides for custom deployments (like Vercel)
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

export const effectiveFirebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId || '',
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey || '',
  authDomain:
    metaEnv.VITE_FIREBASE_AUTH_DOMAIN ||
    rawFirebaseConfig.authDomain ||
    `${rawFirebaseConfig.projectId}.firebaseapp.com`,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket || '',
  messagingSenderId:
    metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId || '',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || rawFirebaseConfig.measurementId || '',
};

const app = getApps().length === 0 ? initializeApp(effectiveFirebaseConfig) : getApp();
export const auth = getAuth(app);
// Ensure local persistence survives reloads and tab closes
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  // Handle redirect result (fallback for popup-blocked browsers)
  getRedirectResult(auth).then((result) => {
    if (result?.user) {
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (cred?.accessToken) {
        setStoredGoogleToken(cred.accessToken);
      }
    }
  }).catch(() => {});
}

export const basicProvider = new GoogleAuthProvider();
basicProvider.setCustomParameters({
  prompt: 'select_account',
});

export const workspaceProvider = new GoogleAuthProvider();
export const coreWorkspaceProvider = new GoogleAuthProvider();

// Google Workspace Scopes
// Core Workspace Scopes: non-restricted student scopes (Calendar, Sheets, Drive files created by app, Docs, Classroom).
// Free of restricted scopes (gmail.* and drive.readonly) so Google OAuth will NOT block unverified apps!
export const CORE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

// Full Workspace Scopes: Core plus restricted Gmail & Drive scopes (requires GCP Test Users or verification)
export const WORKSPACE_SCOPES = [
  ...CORE_WORKSPACE_SCOPES,
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

CORE_WORKSPACE_SCOPES.forEach((scope) => {
  coreWorkspaceProvider.addScope(scope);
});

WORKSPACE_SCOPES.forEach((scope) => {
  workspaceProvider.addScope(scope);
});

// Prompt to select account seamlessly
coreWorkspaceProvider.setCustomParameters({
  prompt: 'select_account',
});
workspaceProvider.setCustomParameters({
  prompt: 'select_account',
});

// Default provider for backwards compatibility defaults to core student workspace
export const provider = coreWorkspaceProvider;

// Custom error for Google OAuth Test Users block
export class OAuthTestUserRequiredError extends Error {
  isOAuthBlocked: boolean;
  projectId: string;
  constructor(message: string, projectId: string = 'studentcommandcenter-39cdc') {
    super(message);
    this.name = 'OAuthTestUserRequiredError';
    this.isOAuthBlocked = true;
    this.projectId = projectId;
  }
}

/** Granted sign-in but Google returned no workspace access token — retryable, never silent. */
export class GoogleWorkspaceGrantMissingError extends Error {
  isOAuthBlocked = false;
  retryable = true;
  constructor(message = 'Google signed you in but did not return a workspace access token. Please try again — if it repeats, use redirect sign-in.') {
    super(message);
    this.name = 'GoogleWorkspaceGrantMissingError';
  }
}

export type SignInFailureKind =
  | 'test-user' | 'admin-blocked' | 'unverified' | 'unauthorized-domain'
  | 'api-key' | 'popup-blocked' | 'popup-closed' | 'timeout' | 'network'
  | 'token-missing' | 'unknown';

export interface SignInDiagnosis {
  kind: SignInFailureKind;
  title: string;
  detail: string;
  fix: string;
}

/** Map raw Firebase/Google errors to a plain-language diagnosis with a concrete fix. */
export function classifySignInError(error: any): SignInDiagnosis {
  const code = error?.code || '';
  const msg = error?.message || '';
  const all = `${code} ${msg} ${String(error || '')}`;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';

  if (error instanceof GoogleWorkspaceGrantMissingError || code === 'auth/no-auth-token') {
    return {
      kind: 'token-missing',
      title: 'Google sign-in finished without permissions',
      detail: 'Google closed the loop but did not hand back a workspace token. Your account is fine — the handshake just dropped the token.',
      fix: 'Tap “Retry Google Workspace Sign-In”. If it happens twice, use “Redirect sign-in instead” below — it is slower but far more reliable.',
    };
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
    return { kind: 'popup-closed', title: 'Sign-in window was closed', detail: 'The Google window closed before finishing.', fix: 'Tap sign-in again and keep the Google window open until it closes by itself.' };
  }
  if (code === 'auth/popup-blocked') {
    return { kind: 'popup-blocked', title: 'Browser blocked the sign-in window', detail: 'Your browser stopped Google from opening its sign-in window.', fix: 'Allow popups for this site, then retry — or use “Redirect sign-in instead”, which needs no popup at all.' };
  }
  if (/admin|policy|disallowed|org_internal|access blocked by/i.test(all)) {
    return {
      kind: 'admin-blocked',
      title: 'Blocked by your Google Workspace admin',
      detail: 'School/work Google accounts are often locked down by an administrator so third-party study apps cannot be connected, even though you personally granted permission.',
      fix: 'Use a personal Gmail account instead — it takes 30 seconds and unlocks Calendar, Gmail and Drive sync. Or ask your school admin to allow this app.',
    };
  }
  if (code === 'auth/unauthorized-domain' || /unauthorized-domain/i.test(all)) {
    return {
      kind: 'unauthorized-domain',
      title: 'This website address is not approved in Firebase',
      detail: `Google refused the login because “${host}” is not listed under Authorized Domains. This is a one-time setup step, not a problem with your account.`,
      fix: `In Firebase Console → Authentication → Settings → Authorized Domains, add “${host}”, then retry. Takes one minute.`,
    };
  }
  if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key' || /api-key-not-valid/i.test(all)) {
    return {
      kind: 'api-key',
      title: 'Firebase key rejected (often on preview links)',
      detail: 'The Firebase browser key does not accept this website address — common on preview/deploy links when the key is locked to the main domain.',
      fix: 'Open the main site address (not a preview link) and sign in there, or ask the app owner to add this address to the key’s allowed websites.',
    };
  }
  if (/verification process|Test users|unverified|access_denied|403|admin-restricted|internal-error/i.test(all)) {
    return {
      kind: 'test-user',
      title: 'Google needs your email on the access list',
      detail: 'Because the app asks for Calendar/Gmail/Drive access, Google only lets listed test accounts through until verification finishes.',
      fix: 'Follow the steps below (publish the app once, or add your email as a test user), then retry. Basic-profile sign-in below always works instantly.',
    };
  }
  if (code === 'auth/network-request-failed' || /network/i.test(all)) {
    return { kind: 'network', title: 'Network interrupted sign-in', detail: 'The request to Google never completed — usually Wi-Fi, VPN or an ad-blocker.', fix: 'Check your connection, pause ad-blockers for this site, then retry.' };
  }
  if (/timeout|timed out/i.test(all)) {
    return { kind: 'timeout', title: 'Sign-in timed out', detail: 'Google took too long to answer (often strict popup/cookie blockers).', fix: 'Use “Redirect sign-in instead” — it survives popup and cookie blockers.' };
  }
  return { kind: 'unknown', title: 'Sign in failed', detail: msg || 'Google did not complete sign-in.', fix: 'Retry once. If it repeats, use redirect sign-in, or basic-profile sign-in to get in immediately.' };
}

/** Best-effort environment check shown alongside failures (config, host, cookies, popups). */
export function diagnoseSignInEnvironment(): { label: string; ok: boolean; hint?: string }[] {
  const out: { label: string; ok: boolean; hint?: string }[] = [];
  const cfg = effectiveFirebaseConfig;
  out.push({
    label: 'Firebase config present',
    ok: Boolean(cfg.apiKey && cfg.projectId && cfg.authDomain),
    hint: !cfg.apiKey ? 'Missing API key — redeploy with VITE_FIREBASE_API_KEY set.' : undefined,
  });
  try {
    out.push({ label: `This address: ${window.location.hostname}`, ok: true, hint: 'If sign-in says “unauthorized-domain”, add this exact address in Firebase → Authorized Domains.' });
  } catch { out.push({ label: 'Page address', ok: false }); }
  try {
    const w = window.open('', '_blank', 'width=10,height=10');
    if (w) { w.close(); out.push({ label: 'Popups allowed', ok: true }); }
    else out.push({ label: 'Popups blocked', ok: false, hint: 'Allow popups for this site, or use redirect sign-in.' });
  } catch { out.push({ label: 'Popups blocked', ok: false, hint: 'Allow popups for this site, or use redirect sign-in.' }); }
  try {
    document.cookie = 'scc_cookie_test=1; SameSite=Lax';
    const ok = document.cookie.includes('scc_cookie_test=1');
    document.cookie = 'scc_cookie_test=; Max-Age=0; SameSite=Lax';
    out.push({ label: 'Cookies enabled', ok, hint: ok ? undefined : 'Enable cookies for this site — Google sign-in needs them.' });
  } catch { out.push({ label: 'Cookies enabled', ok: false }); }
  return out;
}

// Token Storage Key — now in IndexedDB (via Dexie) + sessionStorage mirror for sync access
const TOKEN_STORAGE_KEY = 'google_workspace_access_token';
const TOKEN_IDB_KEY = 'google_workspace_access_token_v2';

// In-memory cache backed by sessionStorage, localStorage & IndexedDB
let cachedAccessToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    cachedAccessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    // hydrate from IndexedDB if storage empty (survives tab close)
    if (!cachedAccessToken) {
      try {
        // async hydrate — will populate cache next tick
        import('./db').then(({ db }) => {
          db.preferences.get(TOKEN_IDB_KEY).then((row: any) => {
            if (row?.value) {
              cachedAccessToken = row.value;
              try {
                sessionStorage.setItem(TOKEN_STORAGE_KEY, row.value);
                localStorage.setItem(TOKEN_STORAGE_KEY, row.value);
                window.dispatchEvent(new CustomEvent('scc-google-token-updated', { detail: { token: row.value } }));
              } catch {}
            }
          }).catch(()=>{});
        });
      } catch {}
    }
  } catch {
    cachedAccessToken = null;
  }
}
async function persistTokenToIDB(token: string | null) {
  try {
    const { db } = await import('./db');
    if (token) await db.preferences.put({ key: TOKEN_IDB_KEY, value: token });
    else await db.preferences.delete(TOKEN_IDB_KEY);
  } catch {}
}

let isSigningIn = false;

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const setStoredGoogleToken = (token: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem('google_token_acquired_at', String(Date.now()));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem('google_token_acquired_at', String(Date.now()));
      persistTokenToIDB(token);
      import('./db').then(({ db }) => db.preferences.put({ key: 'google_token_acquired_at', value: String(Date.now()) }).catch(()=>{}));
      window.dispatchEvent(new CustomEvent('scc-google-token-updated', { detail: { token } }));
    } catch {}
  }
};

export const clearStoredGoogleToken = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem('google_token_acquired_at');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('google_token_acquired_at');
    } catch {}
    persistTokenToIDB(null);
    try {
      window.dispatchEvent(new CustomEvent('scc-google-token-updated', { detail: { token: null } }));
    } catch {}
  }
};

export const hasActiveGoogleWorkspaceToken = (): boolean => {
  return Boolean(getValidGoogleToken());
};

/**
 * Google OAuth access tokens expire after ~60 minutes and the web client gets
 * no refresh token — an old token string looks "connected" while every API
 * call 401s. These helpers make expiry explicit so sync surfaces a Reconnect
 * prompt instead of failing silently.
 */
export const GOOGLE_TOKEN_TTL_MS = 55 * 60 * 1000; // refresh 5 min before the real ~60 min expiry
const TOKEN_ACQUIRED_AT_KEY = 'google_token_acquired_at';

export function getGoogleTokenAgeMs(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      sessionStorage.getItem(TOKEN_ACQUIRED_AT_KEY) ||
      localStorage.getItem(TOKEN_ACQUIRED_AT_KEY);
    if (!raw) return null; // signed in before timestamps existed → unknown, treat as fresh
    const age = Date.now() - parseInt(raw, 10);
    return Number.isFinite(age) && age >= 0 ? age : null;
  } catch {
    return null;
  }
}

export function isGoogleTokenExpired(): boolean {
  const token = getStoredGoogleToken();
  if (!token) return false; // nothing to expire
  const age = getGoogleTokenAgeMs();
  if (age === null) return false; // unknown age → preserve current behavior
  return age > GOOGLE_TOKEN_TTL_MS;
}

/** Returns the token only if present AND fresh; null otherwise (missing or expired). */
export function getValidGoogleToken(): string | null {
  const token = getStoredGoogleToken();
  if (!token) return null;
  return isGoogleTokenExpired() ? null : token;
}

/** True when a token exists but is past its TTL — i.e. user must reconnect. */
export function needsGoogleReconnect(): boolean {
  return getStoredGoogleToken() !== null && isGoogleTokenExpired();
}

export const signInWithGoogle = async (
  options: { requestWorkspace?: boolean; includeGmail?: boolean } = { requestWorkspace: true }
): Promise<{ user: User; accessToken: string } | null> => {
  const targetProvider = !options.requestWorkspace
    ? basicProvider
    : options.includeGmail
    ? workspaceProvider
    : coreWorkspaceProvider;

  try {
    isSigningIn = true;
    // Ensure persistence before popup
    try { await setPersistence(auth, browserLocalPersistence); } catch {}
    let result: any;
    try {
      // Watchdog: never spin forever if the popup hangs (strict blockers, lost postMessage).
      // A late success still lands via onAuthStateChanged, so racing is safe.
      const POPUP_TIMEOUT_MS = 90000;
      result = await Promise.race([
        signInWithPopup(auth, targetProvider),
        new Promise((_res, rej) => setTimeout(() => rej(new Error('Google sign-in timed out after 90 seconds. The sign-in window may be blocked from answering — please use redirect sign-in instead.')), POPUP_TIMEOUT_MS)),
      ]);
    } catch (popupErr: any) {
      const code = popupErr?.code || '';
      // Fallback to redirect if popup blocked by browser
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, targetProvider);
          return null; // redirect will reload page
        } catch {}
      }
      throw popupErr;
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Store access token in memory, localStorage, sessionStorage & IndexedDB
    // ONLY when workspace access was explicitly requested!
    if (options.requestWorkspace && credential?.accessToken) {
      setStoredGoogleToken(credential.accessToken);
    } else if (!options.requestWorkspace) {
      // Basic login: ensure stale workspace token is not falsely assumed active
      cachedAccessToken = null;
    }

    // Workspace was requested and granted, but no token arrived — never downgrade
    // silently to "basic" (that dead-ends sync with zero explanation). Throw so the
    // UI offers a real retry / redirect path.
    if (options.requestWorkspace && !credential?.accessToken) {
      throw new GoogleWorkspaceGrantMissingError();
    }
    
    return {
      user: result.user,
      accessToken: options.requestWorkspace ? (credential?.accessToken || '') : '',
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';
    const errorString = String(error || '');

    // Handle normal user popup dismissals gracefully without console.error or exceptions
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/user-cancelled' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('cancelled-popup-request')
    ) {
      console.info('Google Sign-In popup was closed or dismissed.');
      return null;
    }

    if (errorCode === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked by browser. Please allow popups for this site.');
      throw new Error('Sign-in popup was blocked by browser. Please allow popups for this site.');
    }

    console.error('Sign in error:', error);

    // Detect Google OAuth verification / Test Users 403 block
    if (
      errorMsg.includes('access_denied') ||
      errorMsg.includes('verification process') ||
      errorMsg.includes('403') ||
      errorString.includes('access_denied') ||
      errorCode === 'auth/admin-restricted-operation' ||
      errorCode === 'auth/internal-error'
    ) {
      throw new OAuthTestUserRequiredError(
        'Google OAuth Verification required: Because sensitive Workspace scopes are requested, your Google account must be added to "Test users" in Google Cloud Console, or use Basic Profile login.',
        effectiveFirebaseConfig.projectId
      );
    }

    if (
      errorCode === 'auth/api-key-not-valid' ||
      errorCode === 'auth/invalid-api-key' ||
      errorMsg.includes('api-key-not-valid') ||
      errorMsg.includes('API key')
    ) {
      throw new Error(
        'Firebase API key is invalid or needs to be provisioned. Click "Demo Mode" to preview immediately, or accept the Firebase setup prompt to configure active Firebase credentials.'
      );
    }

    if (
      errorCode === 'auth/unauthorized-domain' ||
      errorMsg.includes('unauthorized-domain')
    ) {
      const currentHost =
        typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      throw new Error(
        `Firebase Unauthorized Domain: Add '${currentHost}' to Firebase Console → Authentication → Settings → Authorized Domains.`
      );
    }

    if (errorCode === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by browser. Please allow popups for this site.');
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signInWithGoogleBasic = async (): Promise<{ user: User; accessToken: string } | null> => {
  return signInWithGoogle({ requestWorkspace: false });
};

export const signInWithGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  return signInWithGoogle({ requestWorkspace: true, includeGmail: true });
};

/**
 * Popup-hostile browsers (blocked popups, strict cookie/COOP policies) need the
 * redirect flow: Google takes over the whole tab, then returns. Nothing resolves
 * here — call consumeRedirectResult() on the next load to finish the job.
 */
export const signInWithRedirectFlow = async (
  options: { requestWorkspace?: boolean; includeGmail?: boolean } = { requestWorkspace: true }
): Promise<void> => {
  const targetProvider = !options.requestWorkspace
    ? basicProvider
    : options.includeGmail
    ? workspaceProvider
    : coreWorkspaceProvider;
  try { await setPersistence(auth, browserLocalPersistence); } catch {}
  await signInWithRedirect(auth, targetProvider);
};

/**
 * Finish a redirect sign-in after Google returns to the app. Returns the user +
 * workspace token (if granted) or null when this load was not a redirect return.
 * Safe to call on every startup; resolves null immediately otherwise.
 */
export const consumeRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) setStoredGoogleToken(credential.accessToken);
    return { user: result.user, accessToken: credential?.accessToken || '' };
  } catch {
    return null;
  }
};

export const googleSignIn = signInWithGoogle;

export const getStoredGoogleToken = (): string | null => {
  if (cachedAccessToken && cachedAccessToken.length > 5) {
    return cachedAccessToken;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored && stored.length > 5) {
        cachedAccessToken = stored;
        return stored;
      }
      const localStored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (localStored && localStored.length > 5) {
        cachedAccessToken = localStored;
        try { sessionStorage.setItem(TOKEN_STORAGE_KEY, localStored); } catch {}
        return localStored;
      }
    } catch {
      // ignore
    }
  }
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return getStoredGoogleToken();
};

export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      persistTokenToIDB(token);
    } catch {}
  }
};

export const signOutUser = async () => {
  clearStoredGoogleToken();
  await signOut(auth);
};

export const logout = signOutUser;
