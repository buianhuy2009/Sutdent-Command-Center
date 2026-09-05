import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser, onAuthStateChangedListener, getStoredGoogleToken } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  isLoggingIn: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (v: boolean) => void;
  signIn: (requestWorkspace?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredGoogleToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChangedListener((u) => {
      setUser(u);
      const curToken = getStoredGoogleToken();
      setToken(curToken);
      if (u && curToken) setIsDemoMode(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleTokenUpdate = (e: any) => {
      const updated = e.detail?.token ?? getStoredGoogleToken();
      setToken(updated);
    };
    window.addEventListener('scc-google-token-updated', handleTokenUpdate);
    return () => window.removeEventListener('scc-google-token-updated', handleTokenUpdate);
  }, []);

  const signIn = useCallback(async (requestWorkspace = true) => {
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle({ requestWorkspace });
      if (res?.user) {
        setUser(res.user);
        setToken(res.accessToken || getStoredGoogleToken());
      }
    } finally { setIsLoggingIn(false); }
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggingIn, isDemoMode, setIsDemoMode, signIn, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
