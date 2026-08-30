import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
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

export const basicProvider = new GoogleAuthProvider();

export const workspaceProvider = new GoogleAuthProvider();

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

WORKSPACE_SCOPES.forEach((scope) => {
  workspaceProvider.addScope(scope);
});

// Prompt for consent to ensure all workspace scopes are included in the returned token
workspaceProvider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline',
});

// Default provider for backwards compatibility
export const provider = workspaceProvider;

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

// Token Storage Key in sessionStorage (persists across page reloads in the browser tab)
const TOKEN_STORAGE_KEY = 'google_workspace_access_token';

// In-memory cache backed by sessionStorage
let cachedAccessToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    cachedAccessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    cachedAccessToken = null;
  }
}

let isSigningIn = false;

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const clearStoredGoogleToken = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};

export const hasActiveGoogleWorkspaceToken = (): boolean => {
  const token = getStoredGoogleToken();
  return Boolean(token && token.length > 10);
};

export const signInWithGoogle = async (
  options: { requestWorkspace?: boolean } = { requestWorkspace: true }
): Promise<{ user: User; accessToken: string } | null> => {
  const targetProvider = options.requestWorkspace ? workspaceProvider : basicProvider;

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, targetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Store access token in memory & sessionStorage
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
          sessionStorage.setItem('google_token_acquired_at', String(Date.now()));
        } catch {
          // ignore
        }
      }
    } else {
      cachedAccessToken = '';
    }
    
    return { user: result.user, accessToken: cachedAccessToken };
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
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
};

export const signOutUser = async () => {
  clearStoredGoogleToken();
  await signOut(auth);
};

export const logout = signOutUser;
