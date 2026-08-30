import { CanvasAssignment, CanvasSettings, Assignment } from '../types';

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  calendarFeedUrl: '',
  apiDomain: 'https://canvas.instructure.com',
  apiToken: '',
  autoSync: true,
  lastSyncedAt: undefined,
};

const LOCAL_STORAGE_CANVAS_KEY = 'scc_canvas_settings_v1';

export function loadCanvasSettings(): CanvasSettings {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CANVAS_KEY);
    if (saved) {
      return { ...DEFAULT_CANVAS_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading Canvas settings:', e);
  }
  return DEFAULT_CANVAS_SETTINGS;
}

export function saveCanvasSettings(settings: CanvasSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CANVAS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving Canvas settings:', e);
  }
}

/**
 * Parse an iCalendar (.ics) string from Canvas Calendar Feed
 */
export function parseCanvasICS(icsText: string): CanvasAssignment[] {
  if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
    if (icsText && icsText.includes('error')) {
      throw new Error(`Invalid Canvas calendar feed response: ${icsText.slice(0, 100)}`);
    }
  }

  const assignments: CanvasAssignment[] = [];
  const lines = icsText.split(/\r\n|\n|\r/);

  let inEvent = false;
  let currentSummary = '';
  let currentDtEnd = '';
  let currentDtStart = '';
  let currentDescription = '';
  let currentUrl = '';
  let currentUid = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle folded lines (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].substring(1);
      i++;
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentSummary = '';
      currentDtEnd = '';
      currentDtStart = '';
      currentDescription = '';
      currentUrl = '';
      currentUid = '';
    } else if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      if (currentSummary) {
        // Canvas ICS summary format is usually: "Assignment Title [Course Name]" or "[Course] Assignment"
        let name = currentSummary;
        let courseName = 'Canvas Course';

        const bracketMatch = currentSummary.match(/^(.*?)\s*\[(.*?)\]$/);
        const prefixBracketMatch = currentSummary.match(/^\[(.*?)\]\s*(.*)$/);

        if (bracketMatch) {
          name = bracketMatch[1].trim();
          courseName = bracketMatch[2].trim();
        } else if (prefixBracketMatch) {
          courseName = prefixBracketMatch[1].trim();
          name = prefixBracketMatch[2].trim();
        }

        // Parse due date
        const dateRaw = currentDtEnd || currentDtStart;
        let dueAt = '';
        if (dateRaw) {
          // Format could be YYYYMMDDTHHMMSSZ or YYYYMMDD
          const cleanDate = dateRaw.replace(/[^0-9T]/g, '');
          if (cleanDate.length >= 8) {
            const year = cleanDate.substring(0, 4);
            const month = cleanDate.substring(4, 6);
            const day = cleanDate.substring(6, 8);
            dueAt = `${year}-${month}-${day}`;
          }
        }

        // Clean description
        const cleanDesc = currentDescription
          .replace(/\\n/g, '\n')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .replace(/\\\\/g, '\\');

        // Extract points if in description
        const pointsMatch = cleanDesc.match(/(\d+(\.\d+)?)\s*(pts|points)/i);
        const pointsPossible = pointsMatch ? parseFloat(pointsMatch[1]) : undefined;

        assignments.push({
          id: currentUid || `canvas-ics-${Math.random().toString(36).substring(2, 9)}`,
          name,
          courseName,
          dueAt: dueAt || new Date().toISOString().split('T')[0],
          pointsPossible,
          htmlUrl: currentUrl || (cleanDesc.match(/https?:\/\/[^\s]+/)?.[0] || ''),
          description: cleanDesc,
          isSynced: false,
        });
      }
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentSummary = line.substring(8).trim();
      } else if (line.startsWith('DTEND:') || line.startsWith('DTEND;')) {
        currentDtEnd = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('DTSTART:') || line.startsWith('DTSTART;')) {
        currentDtStart = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentDescription = line.substring(12).trim();
      } else if (line.startsWith('URL:')) {
        currentUrl = line.substring(4).trim();
      } else if (line.startsWith('UID:')) {
        currentUid = line.substring(4).trim();
      }
    }
  }

  return assignments;
}

/**
 * Fetch Canvas assignments from Calendar Feed (.ics) via proxy with authentic error handling
 */
export async function fetchCanvasAssignmentsFromFeed(feedUrl: string): Promise<CanvasAssignment[]> {
  const cleanUrl = feedUrl.trim();
  if (!cleanUrl) {
    return [];
  }

  // Handle webcal:// prefix from Apple/Canvas copy link
  const normalizedUrl = cleanUrl.replace(/^webcal:\/\//i, 'https://');

  const proxyUrl = `/api/canvas/proxy?url=${encodeURIComponent(normalizedUrl)}`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson.error) errorDetail = errJson.error;
    } catch {
      // Ignore text parse errors
    }
    throw new Error(`Canvas feed fetch failed (${res.status}): ${errorDetail}`);
  }

  const icsText = await res.text();
  if (!icsText || icsText.trim().length === 0) {
    throw new Error('Canvas feed returned empty content');
  }

  return parseCanvasICS(icsText);
}

/**
 * Fetch Canvas assignments directly via Canvas REST API (using Access Token)
 * Automatically fetches all active courses and inspects live submission status
 */
export async function fetchCanvasAssignmentsFromApi(
  domain: string,
  token: string
): Promise<CanvasAssignment[]> {
  if (!domain || !token) return [];

  const cleanDomain = domain.replace(/\/$/, '');
  const headers = { 'x-canvas-token': token };
  const allAssignments: CanvasAssignment[] = [];

  // Method 1: Fetch active courses and their assignments with full submission metadata
  try {
    const coursesUrl = `${cleanDomain}/api/v1/courses?enrollment_state=active&per_page=50`;
    const proxyCoursesUrl = `/api/canvas/proxy?url=${encodeURIComponent(coursesUrl)}`;
    const coursesRes = await fetch(proxyCoursesUrl, { headers });

    if (coursesRes.ok) {
      const courses = await coursesRes.json();
      if (Array.isArray(courses) && courses.length > 0) {
        const coursePromises = courses
          .filter((c: any) => c.id && (c.name || c.course_code))
          .map(async (course: any) => {
            try {
              const assignUrl = `${cleanDomain}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=50&order_by=due_at`;
              const proxyAssignUrl = `/api/canvas/proxy?url=${encodeURIComponent(assignUrl)}`;
              const assignRes = await fetch(proxyAssignUrl, { headers });
              if (!assignRes.ok) return [];

              const assignData = await assignRes.json();
              if (!Array.isArray(assignData)) return [];

              return assignData.map((a: any) => {
                const sub = a.submission || {};
                const isSubmitted = Boolean(
                  sub.submitted_at ||
                  sub.workflow_state === 'submitted' ||
                  sub.workflow_state === 'graded' ||
                  sub.workflow_state === 'pending_review' ||
                  (sub.score !== undefined && sub.score !== null) ||
                  (sub.grade !== undefined && sub.grade !== null) ||
                  a.has_submitted_submissions ||
                  a.user_submitted
                );

                return {
                  id: `canvas-assign-${a.id}`,
                  name: a.name || 'Canvas Assignment',
                  courseName: course.name || course.course_code || 'Canvas Course',
                  courseId: String(course.id),
                  dueAt: (a.due_at || a.lock_at || '').split('T')[0] || '',
                  pointsPossible: a.points_possible,
                  htmlUrl: a.html_url,
                  description: a.description || '',
                  isSynced: false,
                  isCompleted: isSubmitted,
                  submissionTypes: a.submission_types,
                };
              });
            } catch (err) {
              console.warn(`Error fetching assignments for course ${course.id}:`, err);
              return [];
            }
          });

        const courseResults = await Promise.all(coursePromises);
        courseResults.flat().forEach((a) => allAssignments.push(a));

        if (allAssignments.length > 0) {
          return allAssignments;
        }
      }
    }
  } catch (err) {
    console.warn('Canvas courses assignment query error:', err);
  }

  // Method 2: Planner Items with 6-month window
  try {
    const startDate = new Date(Date.now() - 86400000 * 90).toISOString();
    const plannerUrl = `${cleanDomain}/api/v1/planner/items?start_date=${startDate}&order=desc&per_page=100`;
    const proxyPlannerUrl = `/api/canvas/proxy?url=${encodeURIComponent(plannerUrl)}`;
    const plannerRes = await fetch(proxyPlannerUrl, { headers });

    if (plannerRes.ok) {
      const items = await plannerRes.json();
      if (Array.isArray(items) && items.length > 0) {
        return items
          .filter((item: any) => item.plannable_type === 'assignment' || item.plannable_type === 'quiz' || item.plannable)
          .map((item: any) => {
            const p = item.plannable || {};
            const sub = item.submissions || {};
            const isSubmitted = Boolean(
              sub.submitted ||
              sub.graded ||
              item.workflow_state === 'completed' ||
              sub.workflow_state === 'submitted' ||
              sub.workflow_state === 'graded' ||
              sub.submitted_at
            );

            return {
              id: `canvas-planner-${item.plannable_id || item.id}`,
              name: p.title || item.plannable_title || 'Canvas Assignment',
              courseName: item.context_name || 'Canvas Course',
              courseId: item.course_id ? String(item.course_id) : undefined,
              dueAt: (p.due_at || item.plannable_date || '').split('T')[0] || '',
              pointsPossible: p.points_possible,
              htmlUrl: item.html_url || p.html_url,
              description: p.details || p.description || '',
              isSynced: false,
              isCompleted: isSubmitted,
            };
          });
      }
    }
  } catch (err) {
    console.warn('Planner items query failed:', err);
  }

  // Method 3: Upcoming events fallback
  const url = `${cleanDomain}/api/v1/users/self/upcoming_events?include[]=submission`;
  const proxyUrl = `/api/canvas/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { headers });

  if (res.ok) {
    const events = await res.json();
    if (Array.isArray(events)) {
      return events
        .filter((e: any) => e.assignment || e.type === 'assignment')
        .map((e: any) => {
          const a = e.assignment || {};
          const sub = a.submission || {};
          const isSubmitted = Boolean(
            a.user_submitted ||
            a.has_submitted_submissions ||
            sub.workflow_state === 'submitted' ||
            sub.workflow_state === 'graded' ||
            sub.submitted_at ||
            (sub.score !== undefined && sub.score !== null)
          );

          return {
            id: `canvas-api-${e.id || a.id}`,
            name: a.name || e.title || 'Canvas Task',
            courseName: e.context_name || 'Course',
            courseId: e.context_code,
            dueAt: (a.due_at || e.start_at || '').split('T')[0] || '',
            pointsPossible: a.points_possible,
            htmlUrl: a.html_url || e.html_url,
            description: a.description || '',
            isSynced: false,
            isCompleted: isSubmitted,
          };
        });
    }
  }

  return [];
}

const LOCAL_STORAGE_CANVAS_COMPLETED_KEY = 'scc_canvas_completed_ids_v1';

export function loadCompletedCanvasIds(): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CANVAS_COMPLETED_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading completed Canvas IDs:', e);
  }
  return [];
}

export function saveCompletedCanvasIds(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CANVAS_COMPLETED_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error saving completed Canvas IDs:', e);
  }
}

/**
 * Cross-reference Canvas assignments with Master Google Sheet assignments and completion status
 */
export function crossReferenceCanvasWithSheet(
  canvasList: CanvasAssignment[],
  sheetAssignments: Assignment[],
  completedIds: string[] = loadCompletedCanvasIds()
): CanvasAssignment[] {
  if (!Array.isArray(canvasList)) return [];

  const completedSet = new Set(completedIds);

  return canvasList.map((canvasItem) => {
    const matchingSheetItem = (sheetAssignments || []).find((sheetItem) => {
      const nameMatch =
        sheetItem.assignmentName.toLowerCase().trim() ===
        canvasItem.name.toLowerCase().trim();
      const courseMatch =
        sheetItem.subject.toLowerCase().includes(canvasItem.courseName.toLowerCase().slice(0, 5)) ||
        canvasItem.courseName.toLowerCase().includes(sheetItem.subject.toLowerCase().slice(0, 5));
      return nameMatch || (courseMatch && sheetItem.dueDate === canvasItem.dueAt);
    });

    const isAlreadyInSheet = Boolean(matchingSheetItem);
    const isDoneInSheet = matchingSheetItem?.status === 'Done';
    const isCompleted = completedSet.has(canvasItem.id) || isDoneInSheet || Boolean(canvasItem.isCompleted);

    return {
      ...canvasItem,
      isSynced: isAlreadyInSheet,
      isCompleted,
    };
  });
}

