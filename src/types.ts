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
  attachments?: { name: string; url: string }[];
  links?: string[];
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

export type WorkspaceId =
  | 'dashboard'
  | 'academic'
  | 'stem'
  | 'creation'
  | 'retention'
  | 'documents'
  | 'splitscreen';

export type SplitScreenToolId =
  | 'desmos-graphing'
  | 'desmos-scientific'
  | 'geogebra'
  | 'excalidraw'
  | 'canvas-agenda'
  | 'notes-markdown'
  | 'pomodoro'
  | 'phet-sims'
  | 'flashcards'
  | 'notebooklm'
  | 'canva';

export interface SplitScreenConfig {
  leftTool: SplitScreenToolId;
  rightTool: SplitScreenToolId;
  ratio: '50/50' | '60/40' | '70/30' | '40/60' | '30/70';
  activeFullscreenPane?: 'left' | 'right' | null;
}

export type DashboardWidgetId =
  | 'today-glance'
  | 'upcoming-deadlines'
  | 'important-emails'
  | 'pinned-tools'
  | 'quote-of-day'
  | 'course-updates'
  | 'scratchpad';

export interface DashboardLayout {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
}

export interface DashboardWidgetConfig {
  showDeadlines: boolean;
  showPomodoroStreak: boolean;
  showPinnedTools: boolean;
  showScratchpad: boolean;
}

export interface MarkdownNote {
  id: string;
  title: string;
  subject?: string;
  content: string;
  updatedAt: string;
}

// --- AI Deep Integration Interfaces ---
export interface SyllabusExamMilestone {
  examName: string;
  course: string;
  examDate: string; // YYYY-MM-DD
  weightPercent?: number;
  topics?: string[];
  timeline: {
    prep14Days: string; // YYYY-MM-DD
    sprint7Days: string;
    finalReview2Days: string;
  };
}

export interface SyllabusParsedResult {
  courseName: string;
  instructor?: string;
  confidence?: number; // 0-1 overall parse confidence
  exams: (SyllabusExamMilestone & { confidence?: number })[];
  keyAssignments: {
    title: string;
    dueDate: string;
    weightPercent?: number;
    confidence?: number;
  }[];
}

export interface AssignmentSubTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  isCompleted: boolean;
}

export interface DesmosEquation {
  id: string;
  latex: string;
  color?: string;
  label?: string;
}

export interface StemChatTurn {
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
}

export interface MermaidDiagramResult {
  title: string;
  code: string;
  description?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category?: string;
  mastered?: boolean;
}

export interface VivaTurn {
  questionNumber: number;
  question: string;
  studentAnswer?: string;
  score?: number; // 0 - 100
  feedback?: string;
  missingPoints?: string[];
}

export interface RubricCriterionResult {
  criterion: string;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
  suggestion: string;
}

export interface RubricPreCheckResult {
  overallScore: number;
  overallFeedback: string;
  criteria: RubricCriterionResult[];
  actionableRevisions: string[];
}

// --- Agent Action Dispatcher Interfaces ---
export type AgentAction =
  | {
      type: 'setWorkspaceLayout';
      payload: {
        leftPane: SplitScreenToolId;
        rightPane: SplitScreenToolId;
        ratio?: '50/50' | '60/40' | '70/30' | '40/60' | '30/70';
      };
    }
  | {
      type: 'injectDesmosEquation';
      payload: {
        expressions: string[];
        title?: string;
      };
    }
  | {
      type: 'createCalendarMilestones';
      payload: {
        events: Array<{
          title: string;
          date: string;
          type: string;
          weight?: number;
        }>;
      };
    }
  | {
      type: 'createSRSDeck';
      payload: {
        deckTitle: string;
        subject?: string;
        cards: Array<{
          front: string;
          back: string;
          tags?: string[];
        }>;
      };
    }
  | {
      type: 'generateMermaidDiagram';
      payload: {
        code: string;
        title: string;
      };
    };

export interface MathDebugResult {
  fullLatex: string[];
  hasError: boolean;
  errorLineIndex?: number;
  errorDescription?: string;
  socraticHint?: string;
  solutionDerivationGuidance?: string[];
}

export interface ThreeTierFeynmanResult {
  concept: string;
  corePrinciple: string;
  tier1_eli5: string;
  tier2_highschool: string;
  tier3_undergrad: string;
  analogy: string;
}

export interface DeployedSemesterResult {
  milestonesCount: number;
  lectureNotesCount: number;
  flashcardDecksCount: number;
  createdEvents: Array<{ title: string; date: string; type: string }>;
  createdNotes: Array<{ title: string; subject: string }>;
  createdDeckTitle: string;
}


