import { CanvasAssignment } from '../types';
import { fetchCanvasAssignmentsFromFeed } from './canvas';

export interface MoodleSettings {
  moodleUrl: string;
  moodleToken?: string;
  calendarFeedUrl?: string;
  lastSyncedAt?: string;
}

const LOCAL_MOODLE_KEY = 'scc_moodle_settings_v1';

export function loadMoodleSettings(): MoodleSettings {
  try {
    const saved = localStorage.getItem(LOCAL_MOODLE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading Moodle settings:', e);
  }
  return {
    moodleUrl: '',
    moodleToken: '',
    calendarFeedUrl: '',
  };
}

export function saveMoodleSettings(settings: MoodleSettings) {
  try {
    localStorage.setItem(LOCAL_MOODLE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving Moodle settings:', e);
  }
}

/**
 * Fetch Moodle assignments via iCal feed export
 */
export async function fetchMoodleAssignmentsFromIcs(calendarUrl: string): Promise<CanvasAssignment[]> {
  try {
    const assignments = await fetchCanvasAssignmentsFromFeed(calendarUrl);
    return assignments.map((a) => ({
      ...a,
      id: `moodle-${a.id}`,
      courseName: a.courseName ? `[Moodle] ${a.courseName}` : '[Moodle Course]',
    }));
  } catch (error) {
    console.error('Error parsing Moodle calendar feed:', error);
    throw error;
  }
}

/**
 * Fetch Moodle assignments via Moodle Web Services REST API
 */
export async function fetchMoodleAssignmentsFromApi(
  moodleUrl: string,
  token: string
): Promise<CanvasAssignment[]> {
  try {
    const cleanUrl = moodleUrl.replace(/\/+$/, '');
    const apiUrl = `/api/canvas-proxy?url=${encodeURIComponent(
      `${cleanUrl}/webservice/rest/server.php?wstoken=${token}&wsfunction=mod_assign_get_assignments&moodlewsrestformat=json`
    )}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`Moodle API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.exception || data.errorcode) {
      throw new Error(data.message || data.errorcode || 'Moodle API Error');
    }

    const assignments: CanvasAssignment[] = [];
    const courses = data.courses || [];

    for (const c of courses) {
      const courseName = c.shortname || c.fullname || 'Moodle Course';
      for (const a of c.assignments || []) {
        let dueAt = '';
        if (a.duedate && a.duedate > 0) {
          dueAt = new Date(a.duedate * 1000).toISOString().split('T')[0];
        }

        assignments.push({
          id: `moodle-${a.id}`,
          name: a.name || 'Moodle Assignment',
          courseName: `[Moodle] ${courseName}`,
          courseId: String(c.id),
          dueAt,
          pointsPossible: a.gradingdue ? 100 : undefined,
          htmlUrl: `${cleanUrl}/mod/assign/view.php?id=${a.cmid || a.id}`,
          description: (a.intro || '').replace(/<[^>]*>?/gm, '').trim(),
          isSynced: false,
          submissionTypes: ['online_upload'],
        });
      }
    }

    return assignments;
  } catch (error) {
    console.error('Error calling Moodle Web Services API:', error);
    throw error;
  }
}

/**
 * Demo Moodle assignments for instant testing
 */
export function getDemoMoodleAssignments(): CanvasAssignment[] {
  const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
  const inSixDays = new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0];

  return [
    {
      id: 'moodle-demo-1',
      name: 'Linear Algebra: Eigenvalues & Matrix Diagonalization Quiz',
      courseName: '[Moodle] MATH 250: Linear Algebra',
      courseId: 'math-250',
      dueAt: inThreeDays,
      pointsPossible: 20,
      htmlUrl: 'https://moodle.org',
      description: 'Moodle online quiz. 45 minutes time limit with 2 attempts permitted. Bring formula reference sheet.',
      isSynced: false,
      submissionTypes: ['online_quiz'],
    },
    {
      id: 'moodle-demo-2',
      name: 'Computer Science: Dijkstra Algorithm Graph Implementation',
      courseName: '[Moodle] CS 210: Data Structures',
      courseId: 'cs-210',
      dueAt: inSixDays,
      pointsPossible: 100,
      htmlUrl: 'https://moodle.org',
      description: 'Submit your solution in Python/C++. Must achieve O((V+E)log V) time complexity and pass all test vectors.',
      isSynced: false,
      submissionTypes: ['online_upload'],
    },
  ];
}
