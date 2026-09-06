import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadJson, saveJson, STORAGE_KEYS } from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadJson', () => {
    it('returns fallback when key is not in localStorage', () => {
      const fallback = { a: 1 };
      const result = loadJson('non_existent_key', fallback);
      expect(result).toBe(fallback);
    });

    it('returns parsed data when valid JSON is present', () => {
      const data = { user: 'Alice', active: true, count: 42 };
      localStorage.setItem('test_key', JSON.stringify(data));
      const result = loadJson('test_key', {});
      expect(result).toEqual(data);
    });

    it('returns fallback and logs error when JSON is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('invalid_json_key', '{ bad json ');

      const fallback = ['default'];
      const result = loadJson('invalid_json_key', fallback);

      expect(result).toBe(fallback);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('loadJson invalid_json_key failed'),
        expect.any(Error)
      );
    });

    it('returns fallback and logs error when localStorage.getItem throws an error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      const fallback = { safe: true };
      const result = loadJson('restricted_key', fallback);

      expect(result).toBe(fallback);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('loadJson restricted_key failed'),
        expect.any(Error)
      );
    });
  });

  describe('saveJson', () => {
    it('serializes and saves object to localStorage', () => {
      const data = { foo: 'bar', num: 123 };
      saveJson('save_test_key', data);

      const raw = localStorage.getItem('save_test_key');
      expect(raw).toBe(JSON.stringify(data));
    });

    it('logs error when JSON serialization or setItem fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a circular reference object to make JSON.stringify throw
      const circularObj: Record<string, unknown> = {};
      circularObj.self = circularObj;

      saveJson('circular_key', circularObj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('saveJson circular_key failed'),
        expect.any(TypeError)
      );
    });
  });

  describe('STORAGE_KEYS', () => {
    it('contains expected key constants', () => {
      expect(STORAGE_KEYS).toEqual({
        assignments: 'scc_user_assignments_v2',
        emailAlerts: 'scc_cached_email_alerts_v2',
        rawEmails: 'scc_cached_raw_emails_v2',
        workspace: 'scc_active_workspace_v1',
        sidebarExpanded: 'scc_sidebar_expanded',
        pinnedApps: 'scc_pinned_apps_v2',
        geminiKey: 'scc_gemini_api_key',
        groqKey: 'scc_groq_api_key',
      });
    });
  });
});
