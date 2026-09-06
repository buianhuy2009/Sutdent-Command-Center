import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadMoodleSettings,
  saveMoodleSettings,
  fetchMoodleAssignmentsFromIcs,
  fetchMoodleAssignmentsFromApi,
  MoodleSettings,
} from './moodle';
import * as canvasService from './canvas';

describe('moodle service', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadMoodleSettings & saveMoodleSettings', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      const storageMock = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
        length: 0,
        key: () => null,
      };
      vi.stubGlobal('localStorage', storageMock);
    });

    it('returns default settings when storage is empty', () => {
      const settings = loadMoodleSettings();
      expect(settings).toEqual({
        moodleUrl: '',
        moodleToken: '',
        calendarFeedUrl: '',
      });
    });

    it('saves and loads settings from localStorage', () => {
      const newSettings: MoodleSettings = {
        moodleUrl: 'https://moodle.university.edu',
        moodleToken: 'token123456',
        calendarFeedUrl: 'https://moodle.university.edu/calendar/export_execute.php',
        lastSyncedAt: '2026-03-30T10:00:00Z',
      };

      saveMoodleSettings(newSettings);
      const loaded = loadMoodleSettings();
      expect(loaded).toEqual(newSettings);
    });

    it('returns default settings when localStorage JSON is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage['scc_moodle_settings_v1'] = '{ invalid json }';
      const settings = loadMoodleSettings();
      expect(settings).toEqual({
        moodleUrl: '',
        moodleToken: '',
        calendarFeedUrl: '',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error loading Moodle settings:', expect.any(Error));
    });

    it('catches and logs error when localStorage throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('Storage disabled');
        },
        setItem: () => {
          throw new Error('Storage full');
        },
      });

      const loaded = loadMoodleSettings();
      expect(loaded).toEqual({
        moodleUrl: '',
        moodleToken: '',
        calendarFeedUrl: '',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error loading Moodle settings:', expect.any(Error));

      saveMoodleSettings({ moodleUrl: 'https://test.edu' });
      expect(consoleSpy).toHaveBeenCalledWith('Error saving Moodle settings:', expect.any(Error));
    });
  });

  describe('fetchMoodleAssignmentsFromIcs', () => {
    it('fetches and maps assignments with moodle prefix', async () => {
      const mockCanvasAssignments = [
        {
          id: '101',
          name: 'Essay 1',
          courseName: 'CS 101',
          courseId: '1',
          dueAt: '2026-04-01',
          description: 'Write an essay',
          isSynced: false,
        },
        {
          id: '102',
          name: 'Quiz 1',
          courseName: '',
          courseId: '2',
          dueAt: '2026-04-05',
          description: '',
          isSynced: false,
        },
      ];

      vi.spyOn(canvasService, 'fetchCanvasAssignmentsFromFeed').mockResolvedValue(
        mockCanvasAssignments as any
      );

      const result = await fetchMoodleAssignmentsFromIcs('https://moodle.edu/calendar.ics');

      expect(canvasService.fetchCanvasAssignmentsFromFeed).toHaveBeenCalledWith(
        'https://moodle.edu/calendar.ics'
      );
      expect(result).toEqual([
        {
          id: 'moodle-101',
          name: 'Essay 1',
          courseName: '[Moodle] CS 101',
          courseId: '1',
          dueAt: '2026-04-01',
          description: 'Write an essay',
          isSynced: false,
        },
        {
          id: 'moodle-102',
          name: 'Quiz 1',
          courseName: '[Moodle Course]',
          courseId: '2',
          dueAt: '2026-04-05',
          description: '',
          isSynced: false,
        },
      ]);
    });

    it('re-throws error when feed fetching fails', async () => {
      vi.spyOn(canvasService, 'fetchCanvasAssignmentsFromFeed').mockRejectedValue(
        new Error('Network error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        fetchMoodleAssignmentsFromIcs('https://moodle.edu/bad.ics')
      ).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing Moodle calendar feed:', expect.any(Error));
    });
  });

  describe('fetchMoodleAssignmentsFromApi', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('constructs correct proxy URL stripping trailing slashes from moodleUrl', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ courses: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchMoodleAssignmentsFromApi('https://moodle.school.edu///', 'mytoken123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const expectedTarget =
        'https://moodle.school.edu/webservice/rest/server.php?wstoken=mytoken123&wsfunction=mod_assign_get_assignments&moodlewsrestformat=json';
      const expectedProxyUrl = `/api/canvas-proxy?url=${encodeURIComponent(expectedTarget)}`;
      expect(mockFetch).toHaveBeenCalledWith(expectedProxyUrl);
    });

    it('maps valid courses and assignments successfully', async () => {
      const moodleApiResponse = {
        courses: [
          {
            id: 12,
            shortname: 'BIO101',
            fullname: 'Biology 101',
            assignments: [
              {
                id: 501,
                cmid: 991,
                name: 'Lab Report 1',
                duedate: 1774915200, // 2026-03-31T00:00:00.000Z
                gradingdue: 1775001600,
                intro: '<p>Submit your <b>lab report</b> PDF.</p>',
              },
              {
                id: 502,
                name: 'Homework 2',
                duedate: 0, // no due date
                intro: 'No HTML tags here',
              },
            ],
          },
          {
            id: 15,
            fullname: 'History 201', // no shortname
            assignments: [
              {
                id: 503,
                // no cmid, falls back to id in htmlUrl
                duedate: 1774915200,
              },
            ],
          },
        ],
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => moodleApiResponse,
      }));

      const assignments = await fetchMoodleAssignmentsFromApi(
        'https://moodle.school.edu',
        'token123'
      );

      expect(assignments).toEqual([
        {
          id: 'moodle-501',
          name: 'Lab Report 1',
          courseName: '[Moodle] BIO101',
          courseId: '12',
          dueAt: '2026-03-31',
          pointsPossible: 100,
          htmlUrl: 'https://moodle.school.edu/mod/assign/view.php?id=991',
          description: 'Submit your lab report PDF.',
          isSynced: false,
          submissionTypes: ['online_upload'],
        },
        {
          id: 'moodle-502',
          name: 'Homework 2',
          courseName: '[Moodle] BIO101',
          courseId: '12',
          dueAt: '',
          pointsPossible: undefined,
          htmlUrl: 'https://moodle.school.edu/mod/assign/view.php?id=502',
          description: 'No HTML tags here',
          isSynced: false,
          submissionTypes: ['online_upload'],
        },
        {
          id: 'moodle-503',
          name: 'Moodle Assignment',
          courseName: '[Moodle] History 201',
          courseId: '15',
          dueAt: '2026-03-31',
          pointsPossible: undefined,
          htmlUrl: 'https://moodle.school.edu/mod/assign/view.php?id=503',
          description: '',
          isSynced: false,
          submissionTypes: ['online_upload'],
        },
      ]);
    });

    it('handles empty courses or empty assignments list', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          courses: [
            { id: 1, fullname: 'Course Without Assignments' },
          ],
        }),
      }));

      const assignments = await fetchMoodleAssignmentsFromApi(
        'https://moodle.school.edu',
        'token123'
      );

      expect(assignments).toEqual([]);
    });

    it('throws error when HTTP status is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }));

      await expect(
        fetchMoodleAssignmentsFromApi('https://moodle.school.edu', 'token123')
      ).rejects.toThrow('Moodle API returned HTTP 404');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calling Moodle Web Services API:',
        expect.any(Error)
      );
    });

    it('throws error when Moodle API payload contains exception or errorcode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          exception: 'moodle_exception',
          errorcode: 'invalidtoken',
          message: 'Invalid token - token not found',
        }),
      }));

      await expect(
        fetchMoodleAssignmentsFromApi('https://moodle.school.edu', 'badtoken')
      ).rejects.toThrow('Invalid token - token not found');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calling Moodle Web Services API:',
        expect.any(Error)
      );
    });

    it('falls back to errorcode or default message when payload message is absent', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errorcode: 'accessexception',
        }),
      }));

      await expect(
        fetchMoodleAssignmentsFromApi('https://moodle.school.edu', 'token')
      ).rejects.toThrow('accessexception');

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          exception: 'unknown_exception',
        }),
      }));

      await expect(
        fetchMoodleAssignmentsFromApi('https://moodle.school.edu', 'token')
      ).rejects.toThrow('Moodle API Error');
    });

    it('handles network rejections during fetch', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

      await expect(
        fetchMoodleAssignmentsFromApi('https://moodle.school.edu', 'token')
      ).rejects.toThrow('Failed to fetch');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calling Moodle Web Services API:',
        expect.any(Error)
      );
    });
  });
});
