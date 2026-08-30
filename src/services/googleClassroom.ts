import { CanvasAssignment, ApiEnablementInfo } from '../types';
import { parseGoogleApiResponseError } from './googleWorkspace';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  alternateLink?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
  maxPoints?: number;
}

export interface ClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  alternateLink?: string;
  creationTime?: string;
}

/**
 * Fetch all active Google Classroom courses for the signed-in student
 */
export async function fetchClassroomCourses(token: string): Promise<ClassroomCourse[]> {
  try {
    const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw parseGoogleApiResponseError(res.status, errBody, 'Google Classroom API', 'classroom.googleapis.com');
    }

    const data = await res.json();
    return data.courses || [];
  } catch (error) {
    console.error('Error fetching Google Classroom courses:', error);
    throw error;
  }
}

/**
 * Fetch coursework (assignments, projects, quizzes) for a specific course
 */
export async function fetchCourseWork(token: string, courseId: string): Promise<ClassroomCourseWork[]> {
  try {
    const res = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?courseWorkStates=PUBLISHED`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw parseGoogleApiResponseError(res.status, errBody, 'Google Classroom API', 'classroom.googleapis.com');
    }

    const data = await res.json();
    return data.courseWork || [];
  } catch (error) {
    console.error(`Error fetching coursework for course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Fetch all upcoming coursework across all active courses
 */
export async function fetchAllClassroomAssignments(token: string): Promise<CanvasAssignment[]> {
  try {
    const courses = await fetchClassroomCourses(token);
    if (!courses || courses.length === 0) return [];

    const assignments: CanvasAssignment[] = [];

    await Promise.all(
      courses.map(async (course) => {
        try {
          const works = await fetchCourseWork(token, course.id);
          works.forEach((w) => {
            let dueAt = '';
            if (w.dueDate) {
              const y = w.dueDate.year;
              const m = String(w.dueDate.month).padStart(2, '0');
              const d = String(w.dueDate.day).padStart(2, '0');
              dueAt = `${y}-${m}-${d}`;
            }

            assignments.push({
              id: `gclass-${w.id}`,
              name: w.title,
              courseName: course.name,
              courseId: course.id,
              dueAt,
              pointsPossible: w.maxPoints,
              htmlUrl: w.alternateLink || course.alternateLink,
              description: w.description || '',
              isSynced: false,
              submissionTypes: ['online_upload'],
            });
          });
        } catch (e) {
          console.warn(`Could not load coursework for course ${course.id}:`, e);
        }
      })
    );

    return assignments;
  } catch (error) {
    console.error('Error fetching all Classroom assignments:', error);
    throw error;
  }
}

/**
 * Demo fallback courses & assignments for testing when Classroom API is not yet activated on GCP
 */
export function getDemoClassroomAssignments(): CanvasAssignment[] {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

  return [
    {
      id: 'gclass-demo-1',
      name: 'AP Chemistry: Chemical Equilibrium Problem Set 4',
      courseName: 'AP Chemistry Period 3',
      courseId: 'chem-301',
      dueAt: tomorrow,
      pointsPossible: 50,
      htmlUrl: 'https://classroom.google.com',
      description: 'Complete problems 1-12 on page 412. Show all work and unit cancellations. Upload PDF scan to Google Classroom.',
      isSynced: false,
      submissionTypes: ['online_upload'],
    },
    {
      id: 'gclass-demo-2',
      name: 'World History: Primary Source Analysis - Silk Road Trade',
      courseName: 'AP World History',
      courseId: 'hist-201',
      dueAt: nextWeek,
      pointsPossible: 100,
      htmlUrl: 'https://classroom.google.com',
      description: 'Read the three excerpted travel logs and answer the 4 document-based synthesis prompts. Include citations.',
      isSynced: false,
      submissionTypes: ['online_text_entry', 'online_upload'],
    },
  ];
}
