import { describe, expect, it } from 'vitest';
import {
  normKey,
  sanitizeAssignment,
  sanitizeAssignments,
  sanitizeCanvasAssignment,
  sanitizeCanvasAssignments,
  sanitizeEmailAlert,
  sanitizeEmailAlerts,
  sanitizeRawEmails,
} from './sanitize';

describe('sanitize utils', () => {
  describe('normKey', () => {
    it('normalizes string values by trimming and lowercasing', () => {
      expect(normKey('  Hello World  ')).toBe('hello world');
    });

    it('handles null and undefined gracefully', () => {
      expect(normKey(null)).toBe('');
      expect(normKey(undefined)).toBe('');
    });

    it('converts non-string values to string and normalizes', () => {
      expect(normKey(12345)).toBe('12345');
      expect(normKey(true)).toBe('true');
    });
  });

  describe('sanitizeAssignment', () => {
    it('returns null for non-object or null inputs', () => {
      expect(sanitizeAssignment(null)).toBeNull();
      expect(sanitizeAssignment(undefined)).toBeNull();
      expect(sanitizeAssignment('invalid')).toBeNull();
      expect(sanitizeAssignment(123)).toBeNull();
    });

    it('sanitizes a valid assignment object with all fields', () => {
      const input = {
        id: 'task-1',
        subject: 'Math',
        assignmentName: 'Calculus Homework',
        dueDate: '2025-05-01',
        priority: 'High',
        status: 'In Progress',
        source: 'Canvas',
        canvasId: 'c123',
        docUrl: 'https://docs.google.com/123',
        notes: 'Chapter 4 problems',
        sheetRowIndex: 5,
        estimatedMinutes: 60,
        updatedAt: '2025-04-20',
        repeats: 'weekly',
        rrule: 'FREQ=WEEKLY',
        subtasks: [{ title: 'Subtask 1' }],
        attachments: ['file1.pdf'],
        submission: { submitted: true },
        trashedAt: '2025-04-21',
      };

      const result = sanitizeAssignment(input, 0);

      expect(result).toEqual({
        id: 'task-1',
        subject: 'Math',
        assignmentName: 'Calculus Homework',
        dueDate: '2025-05-01',
        priority: 'High',
        status: 'In Progress',
        source: 'Canvas',
        canvasId: 'c123',
        docUrl: 'https://docs.google.com/123',
        notes: 'Chapter 4 problems',
        sheetRowIndex: 5,
        estimatedMinutes: 60,
        updatedAt: '2025-04-20',
        repeats: 'weekly',
        rrule: 'FREQ=WEEKLY',
        subtasks: [{ title: 'Subtask 1' }],
        attachments: ['file1.pdf'],
        submission: { submitted: true },
        trashedAt: '2025-04-21',
      });
    });

    it('falls back to title or name when assignmentName is missing', () => {
      expect(sanitizeAssignment({ title: 'Title Assignment' })?.assignmentName).toBe('Title Assignment');
      expect(sanitizeAssignment({ name: 'Name Assignment' })?.assignmentName).toBe('Name Assignment');
      expect(sanitizeAssignment({})?.assignmentName).toBe('Untitled Assignment');
      expect(sanitizeAssignment({ assignmentName: '  ' })?.assignmentName).toBe('Untitled Assignment');
    });

    it('falls back to default priority and status when given invalid values', () => {
      const result = sanitizeAssignment({ priority: 'Urgent', status: 'Pending' });
      expect(result?.priority).toBe('Med');
      expect(result?.status).toBe('Not Started');
    });

    it('generates a default ID when ID is missing', () => {
      const result = sanitizeAssignment({}, 2);
      expect(result?.id).toMatch(/^task-\d+-2$/);
    });

    it('handles non-number sheetRowIndex and estimatedMinutes', () => {
      const result = sanitizeAssignment({
        sheetRowIndex: '5',
        estimatedMinutes: '60',
      });
      expect(result?.sheetRowIndex).toBeUndefined();
      expect(result?.estimatedMinutes).toBeUndefined();
    });

    it('handles non-array subtasks and attachments', () => {
      const result = sanitizeAssignment({
        subtasks: 'not-an-array',
        attachments: { key: 'value' },
      });
      expect(result?.subtasks).toBeUndefined();
      expect(result?.attachments).toBeUndefined();
    });

    it('sets trashedAt to null if not provided', () => {
      const result = sanitizeAssignment({});
      expect(result?.trashedAt).toBeNull();
    });
  });

  describe('sanitizeAssignments', () => {
    it('returns an empty array for non-array inputs', () => {
      expect(sanitizeAssignments(null)).toEqual([]);
      expect(sanitizeAssignments(undefined)).toEqual([]);
      expect(sanitizeAssignments('not an array')).toEqual([]);
    });

    it('sanitizes an array of assignments and filters out nulls', () => {
      const input = [
        { id: '1', assignmentName: 'Task 1' },
        null,
        'invalid item',
        { id: '2', title: 'Task 2' },
      ];

      const result = sanitizeAssignments(input);

      expect(result).toHaveLength(2);
      expect(result[0].assignmentName).toBe('Task 1');
      expect(result[1].assignmentName).toBe('Task 2');
    });
  });

  describe('sanitizeCanvasAssignment', () => {
    it('returns null for non-object or null inputs', () => {
      expect(sanitizeCanvasAssignment(null)).toBeNull();
      expect(sanitizeCanvasAssignment('string')).toBeNull();
    });

    it('sanitizes a valid Canvas assignment', () => {
      const input = {
        id: 'c101',
        name: 'Essay 1',
        courseName: 'English 101',
        courseId: 101,
        dueAt: '2025-05-10',
        pointsPossible: 100,
        htmlUrl: 'https://canvas.edu/assignments/101',
        description: 'Write an essay',
        isSynced: 1,
        isCompleted: true,
        isInformational: false,
        submissionTypes: ['online_upload'],
      };

      const result = sanitizeCanvasAssignment(input, 0);

      expect(result).toEqual({
        id: 'c101',
        name: 'Essay 1',
        courseName: 'English 101',
        courseId: '101',
        dueAt: '2025-05-10',
        pointsPossible: 100,
        htmlUrl: 'https://canvas.edu/assignments/101',
        description: 'Write an essay',
        isSynced: true,
        isCompleted: true,
        isInformational: false,
        submissionTypes: ['online_upload'],
      });
    });

    it('falls back to course_code or title when courseName or name are missing', () => {
      const result = sanitizeCanvasAssignment({
        title: 'Quiz 1',
        course_code: 'CS101',
      });

      expect(result?.name).toBe('Quiz 1');
      expect(result?.courseName).toBe('CS101');
    });

    it('uses defaults when fields are missing', () => {
      const result = sanitizeCanvasAssignment({}, 3);

      expect(result?.id).toMatch(/^canvas-\d+-3$/);
      expect(result?.name).toBe('Canvas Assignment');
      expect(result?.courseName).toBe('Canvas Course');
      expect(result?.courseId).toBeUndefined();
      expect(result?.pointsPossible).toBeUndefined();
      expect(result?.isSynced).toBe(false);
      expect(result?.isCompleted).toBe(false);
      expect(result?.submissionTypes).toBeUndefined();
    });
  });

  describe('sanitizeCanvasAssignments', () => {
    it('returns an empty array for non-array inputs', () => {
      expect(sanitizeCanvasAssignments(null)).toEqual([]);
    });

    it('maps list and filters null values', () => {
      const input = [{ name: 'Assignment 1' }, null, { title: 'Assignment 2' }];
      const result = sanitizeCanvasAssignments(input);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Assignment 1');
      expect(result[1].name).toBe('Assignment 2');
    });
  });

  describe('sanitizeEmailAlert', () => {
    it('returns null for non-object or null inputs', () => {
      expect(sanitizeEmailAlert(null)).toBeNull();
      expect(sanitizeEmailAlert(123)).toBeNull();
    });

    it('sanitizes valid email alert and respects valid urgency', () => {
      const result = sanitizeEmailAlert({
        id: 'alert-1',
        urgency: 'HIGH',
        message: 'Exam tomorrow',
      });

      expect(result).toEqual({
        id: 'alert-1',
        urgency: 'HIGH',
        message: 'Exam tomorrow',
      });
    });

    it('falls back to INFO urgency for invalid urgency strings', () => {
      const result = sanitizeEmailAlert({ urgency: 'CRITICAL' });
      expect(result?.urgency).toBe('INFO');
    });

    it('generates a default ID when ID is missing', () => {
      const result = sanitizeEmailAlert({}, 1);
      expect(result?.id).toMatch(/^alert-\d+-1$/);
    });
  });

  describe('sanitizeEmailAlerts', () => {
    it('returns an empty array for non-array inputs', () => {
      expect(sanitizeEmailAlerts(undefined)).toEqual([]);
    });

    it('sanitizes email alerts list and filters invalid entries', () => {
      const input = [{ id: 'a1', urgency: 'MEDIUM' }, null];
      const result = sanitizeEmailAlerts(input);

      expect(result).toHaveLength(1);
      expect(result[0].urgency).toBe('MEDIUM');
    });
  });

  describe('sanitizeRawEmails', () => {
    it('returns an empty array for non-array inputs', () => {
      expect(sanitizeRawEmails(null)).toEqual([]);
    });

    it('filters out non-objects and normalizes email messages', () => {
      const input = [
        null,
        'string',
        {
          id: 'email-123',
          threadId: 'thread-1',
          sender: 'Professor',
          senderEmail: 'prof@univ.edu',
          subject: 'Homework update',
          date: '2025-05-01',
          snippet: 'Please check the file',
          body: 'Full body content',
          unread: true,
        },
        {},
      ];

      const result = sanitizeRawEmails(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'email-123',
        threadId: 'thread-1',
        sender: 'Professor',
        senderEmail: 'prof@univ.edu',
        subject: 'Homework update',
        date: '2025-05-01',
        snippet: 'Please check the file',
        body: 'Full body content',
        unread: true,
      });

      // Default fallback values for empty object input
      expect(result[1].sender).toBe('Unknown sender');
      expect(result[1].subject).toBe('(no subject)');
      expect(result[1].id).toMatch(/^email-\d+-1$/);
    });
  });
});
