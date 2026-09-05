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
      result = await signInWithPopup(auth, targetProvider);
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
    if (credential?.accessToken) {
      setStoredGoogleToken(credential.accessToken);
    } else {
      cachedAccessToken = '';
    }
    
    return { user: result.user, accessToken: cachedAccessToken || '' };
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
