export type PriorityLevel = 'High' | 'Med' | 'Low';
export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Done';

export interface Assignment {
  id: string;
  subject: string;
  assignmentName: string;
  dueDate: string; // YYYY-MM-DD
  priority: PriorityLevel;
  status: AssignmentStatus;
  source?: 'Manual' | 'Gmail' | 'Canvas' | 'Google Sheet';
  canvasId?: string;
  docUrl?: string;
  notes?: string;
  sheetRowIndex?: number;
  estimatedMinutes?: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  description?: string;
  htmlLink?: string;
  hangoutLink?: string;
  isStudyBlock?: boolean;
  colorId?: string;
}

export interface EmailMessage {
  id: string;
  threadId?: string;
  sender: string;
  senderEmail?: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  unread?: boolean;
}

export type EmailCategory = 'ASSIGNMENT' | 'EXAM' | 'GRADE' | 'SCHEDULE' | 'ANNOUNCEMENT' | 'SPAM' | 'PROMOTION' | 'GENERAL';

export interface EmailAlert {
  id: string;
  sender: string;
  subject: string;
  oneLineSummary: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: EmailCategory;
  categoryLabel?: string;
  isSpam?: boolean;
  spamReason?: string;
  language?: 'vi' | 'en' | 'other';
  detectedAssignment?: {
    isAssignment: boolean;
    name: string;
    subject: string;
    dueDate: string;
    priority: PriorityLevel;
  };
  rawEmail?: EmailMessage;
}

export interface SchoolFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
  size?: string;
  sharedWithMe?: boolean;
}

export interface CanvasAssignment {
  id: string;
  name: string;
  courseName: string;
  courseId?: string;
  dueAt: string;
  pointsPossible?: number;
  htmlUrl?: string;
  description?: string;
  isSynced: boolean;
  isCompleted?: boolean;
  isInformational?: boolean;
  submissionTypes?: string[];
}

export interface CanvasSettings {
  calendarFeedUrl: string;
  apiDomain: string;
  apiToken: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface QuickDraftRequest {
  teacherName?: string;
  teacherEmail?: string;
  course?: string;
  subject?: string;
  topic?: string;
  context?: string;
  intent?: string;
  draftType?: string;
  studentNotes?: string;
  tone?: string;
  studentName?: string;
  language?: 'en' | 'vi' | 'other';
}

export interface QuickDraftResponse {
  subject: string;
  body: string;
  keyPoints: string[];
}

export interface CreateDocParams {
  title: string;
  subject: string;
  formatStyle: 'MLA' | 'APA' | 'Academic Standard';
  teacherName?: string;
  studentName?: string;
  objectives?: string;
  checklist?: string[];
  canvasDescription?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
  duration?: number;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

export interface ApiEnablementInfo {
  isServiceDisabled?: boolean;
  serviceName: string;
  serviceId: string;
  activationUrl?: string;
  projectId?: string;
  rawMessage?: string;
}

