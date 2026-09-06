import { useState, useEffect, useCallback } from 'react';
import {
  NasaApod,
  NASA_APOD_ENABLED_KEY,
  NASA_APOD_TOGGLE_EVENT,
  fetchNasaApodV2,
  getApodCache,
  setApodCache,
  clearApodCache,
  isApodCacheFresh,
} from '../services/publicApis';

export function isNasaApodEnabled(): boolean {
  try { return localStorage.getItem(NASA_APOD_ENABLED_KEY) === 'true'; } catch { return false; }
}

export function setNasaApodEnabled(val: boolean): void {
  try { localStorage.setItem(NASA_APOD_ENABLED_KEY, String(val)); } catch {}
  if (!val) clearApodCache();
  try { window.dispatchEvent(new Event('storage')); } catch {}
  try { window.dispatchEvent(new CustomEvent(NASA_APOD_TOGGLE_EVENT, { detail: { enabled: val } })); } catch {}
}

export function useNasaApod() {
  const [enabled, setEnabled] = useState<boolean>(() => isNasaApodEnabled());
  const [apod, setApod] = useState<NasaApod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isNasaApodEnabled()) {
      setApod(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    // Serve fresh cache instantly (any media type with a url), then revalidate in background
    const cached = getApodCache();
    if (cached && isApodCacheFresh(cached.date) && cached.data?.url) {
      setApod(cached.data);
      setLoading(false);
      return;
    }
    // Show stale (yesterday) cache while fetching so offline still shows something
    if (cached?.data?.url) setApod(cached.data);
    const data = await fetchNasaApodV2();
    if (data && data.url) {
      setApod(data);
      setApodCache(data);
      setError(null);
    } else if (!cached?.data?.url) {
      setError('NASA rate limit reached or offline. Showing a starry fallback — tap Retry.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === NASA_APOD_ENABLED_KEY) {
        setEnabled(isNasaApodEnabled());
        load();
      }
    };
    const onToggle = () => {
      setEnabled(isNasaApodEnabled());
      load();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(NASA_APOD_TOGGLE_EVENT, onToggle as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(NASA_APOD_TOGGLE_EVENT, onToggle as EventListener);
    };
  }, [load]);

  return { enabled, apod, loading, error, reload: load };
}
