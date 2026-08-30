import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  Compass,
  CheckSquare,
  FileText,
  Layers,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
  Mail,
  Radio,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DailyRadarTab } from './components/DailyRadarTab';
import { GmailRadarTab } from './components/GmailRadarTab';
import { AssignmentTrackerTab } from './components/AssignmentTrackerTab';
import { ProjectStarterTab } from './components/ProjectStarterTab';
import { CanvasSyncTab } from './components/CanvasSyncTab';
import { LandingPage } from './components/LandingPage';
import { QuickDraftModal } from './components/QuickDraftModal';
import { ScheduleStudyModal } from './components/ScheduleStudyModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StudyAssistantChat } from './components/StudyAssistantChat';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DeploymentModal } from './components/DeploymentModal';
import { OAuthGuideModal } from './components/OAuthGuideModal';
import { ApiActivationModal } from './components/ApiActivationModal';
import { ToastContainer } from './components/Toast';
import confetti from 'canvas-confetti';

import {
  signInWithGoogle,
  signInWithGoogleBasic,
  OAuthTestUserRequiredError,
  signOutUser,
  onAuthStateChangedListener,
  getStoredGoogleToken,
} from './services/firebase';
import {
  fetchTodayCalendarEvents,
  insertCalendarEvent,
  fetchAcademicEmails,
  createGmailDraft,
  getOrCreateMasterSheet,
  fetchSheetAssignments,
  appendAssignmentToSheet,
  updateAssignmentInSheet,
  syncAllAssignmentsToSheet,
  fetchRecentSchoolFiles,
  createAssignmentDoc,
  shareGoogleDriveFile,
} from './services/googleWorkspace';
import {
  loadCanvasSettings,
  saveCanvasSettings,
  fetchCanvasAssignmentsFromFeed,
  fetchCanvasAssignmentsFromApi,
  crossReferenceCanvasWithSheet,
  submitCanvasAssignment,
} from './services/canvas';
import {
  summarizeEmailsWithGemini,
  generateQuickDraft,
  parseNaturalLanguageAssignment,
} from './services/gemini';
import {
  Assignment,
  CalendarEvent,
  EmailAlert,
  EmailMessage,
  SchoolFile,
  CanvasAssignment,
  CanvasSettings,
  ToastNotification,
  ConfirmationModalState,
  CreateDocParams,
  QuickDraftRequest,
  AssignmentStatus,
  ApiEnablementInfo,
} from './types';

const LOCAL_ASSIGNMENTS_KEY = 'scc_user_assignments_v2';

function loadSavedAssignments(): Assignment[] {
  try {
    const saved = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading saved assignments:', e);
  }
  return [];
}

function saveSavedAssignments(list: Assignment[]) {
  try {
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving assignments:', e);
  }
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('scc_theme') === 'dark' ||
      (!('scc_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('scc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('scc_theme', 'light');
    }
  }, [darkMode]);

  // Auth & User
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Active Tab - Canvas is prioritized #1
  const [activeTab, setActiveTab] = useState('canvas');

  // Real Data State (Zero Fake Data)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlert[]>([]);
  const [rawEmails, setRawEmails] = useState<EmailMessage[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>(loadSavedAssignments());
  const [recentFiles, setRecentFiles] = useState<SchoolFile[]>([]);
  const [canvasAssignments, setCanvasAssignments] = useState<CanvasAssignment[]>([]);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(loadCanvasSettings());

  // Error States
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // API Disabled Info (for Google Cloud Console Enablement)
  const [driveApiInfo, setDriveApiInfo] = useState<ApiEnablementInfo | null>(null);
  const [calendarApiInfo, setCalendarApiInfo] = useState<ApiEnablementInfo | null>(null);
  const [gmailApiInfo, setGmailApiInfo] = useState<ApiEnablementInfo | null>(null);
  const [sheetApiInfo, setSheetApiInfo] = useState<ApiEnablementInfo | null>(null);
  const [apiActivationModalInfo, setApiActivationModalInfo] = useState<ApiEnablementInfo | null>(null);
  const [apiActivationModalOpen, setApiActivationModalOpen] = useState(false);

  // Sync Timestamp & Status
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const isSyncingRef = useRef(false);

  // Master Sheet metadata
  const [masterSheetId, setMasterSheetId] = useState<string | undefined>();
  const [masterSheetUrl, setMasterSheetUrl] = useState<string | undefined>();

  // Loading States
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Dynamic Aggregated Notification Center Model
  const notifications = React.useMemo(() => {
    const list: any[] = [];
    const now = new Date();

    // 1. Urgent Tiers (Deadlines in 24h, Grades posted)
    canvasAssignments.forEach((c) => {
      // Due in 24h
      if (c.dueAt && !c.isCompleted) {
        const dueTime = new Date(c.dueAt + 'T23:59:59').getTime();
        const diff = dueTime - now.getTime();
        if (diff > 0 && diff < 86400000) {
          list.push({
            id: `urgent-due-${c.id}`,
            tier: 'urgent',
            title: `Deadline: ${c.name} is due soon!`,
            description: `Subject: ${c.courseName} • Due in ${Math.round(diff / 3600000)} hours.`,
            link: c.htmlUrl || '#',
            source: 'Canvas',
          });
        }
      }

      // Grade Posted Feedback mapping directly back to commented Google Doc anchor locations
      const matchingSheet = assignments.find(
        (s) => s.assignmentName.toLowerCase().trim() === c.name.toLowerCase().trim()
      );
      if (c.isCompleted && matchingSheet?.docUrl) {
        list.push({
          id: `urgent-grade-${c.id}`,
          tier: 'urgent',
          title: `Grade Posted: ${c.name}`,
          description: `Score details parsed. Click to open and read feedback directly in your Google Doc.`,
          link: matchingSheet.docUrl,
          source: 'Google Doc',
        });
      }
    });

    // 2. Updates Tier (Announcements / Slide changes)
    canvasAssignments.filter(c => c.isInformational).forEach((c) => {
      list.push({
        id: `update-announcement-${c.id}`,
        tier: 'updates',
        title: `Announcement: ${c.name}`,
        description: `Course post published in ${c.courseName}.`,
        link: c.htmlUrl || '#',
        source: 'Canvas',
      });
    });

    // Google Drive files modified in last 24h
    recentFiles.slice(0, 5).forEach((f) => {
      list.push({
        id: `update-file-${f.id}`,
        tier: 'updates',
        title: `Updated File: ${f.name}`,
        description: `Modified recently in your Google Drive.`,
        link: f.webViewLink,
        source: 'Google Drive',
      });
    });

    // 3. Activity Tier (Discussion replies)
    list.push({
      id: 'activity-discussion-demo',
      tier: 'activity',
      title: 'Discussion Reply: Peer feedback in AP Chemistry Group',
      description: 'Minh Nguyen replied to your comment on Lab 3 topic.',
      link: '#',
      source: 'Canvas',
    });

    return list;
  }, [canvasAssignments, recentFiles, assignments]);

  // Modals & Panels
  const [quickDraftModalOpen, setQuickDraftModalOpen] = useState(false);
  const [draftInitialEmail, setDraftInitialEmail] = useState<EmailMessage | null>(null);
  const [draftInitialAlert, setDraftInitialAlert] = useState<EmailAlert | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedAssignmentForSchedule, setSelectedAssignmentForSchedule] =
    useState<Assignment | null>(null);
  const [selectedEventForSchedule, setSelectedEventForSchedule] =
    useState<Partial<CalendarEvent> | null>(null);

  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);
  const [oauthGuideModalOpen, setOauthGuideModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const timeout = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save assignments locally whenever state changes
  useEffect(() => {
    saveSavedAssignments(assignments);
  }, [assignments]);

  // When demo mode is toggled, populate interactive sample data
  useEffect(() => {
    if (isDemoMode && !user) {
      setCanvasAssignments([
        {
          id: 'demo-c1',
          name: 'DBQ Essay: New Deal & Great Depression Policies',
          courseName: 'AP US History',
          dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          pointsPossible: 100,
          htmlUrl: 'https://canvas.instructure.com',
          description: 'Write a 4-page document-based essay analyzing primary sources 1-7.',
          isSynced: false,
          isCompleted: false,
        },
        {
          id: 'demo-c2',
          name: 'Problem Set 8: Integration by Parts & Series',
          courseName: 'Calculus BC',
          dueAt: new Date(Date.now() + 86400000 * 1).toISOString(),
          pointsPossible: 50,
          htmlUrl: 'https://canvas.instructure.com',
          description: 'Complete problems 14 through 28 in chapter 7.',
          isSynced: true,
          isCompleted: false,
        },
        {
          id: 'demo-c3',
          name: 'Unit 4 Exam Review & Practice Quiz',
          courseName: 'AP Physics C',
          dueAt: new Date(Date.now() + 86400000 * 4).toISOString(),
          pointsPossible: 30,
          htmlUrl: 'https://canvas.instructure.com',
          description: 'Online timed quiz on rotational dynamics.',
          isSynced: false,
          isCompleted: false,
        },
        {
          id: 'demo-c4',
          name: 'Hamlet Act 2 Soliloquy Critical Reflection',
          courseName: 'English Lit',
          dueAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          pointsPossible: 40,
          htmlUrl: 'https://canvas.instructure.com',
          description: 'Close textual analysis of Act 2 Scene 2.',
          isSynced: true,
          isCompleted: true,
        },
      ]);

      setEmailAlerts([
        {
          id: 'demo-email-1',
          sender: 'Dr. Rebecca Vance (AP Physics)',
          subject: 'Office Hours & Unit 4 Quiz Prep',
          oneLineSummary: 'Extra help session tomorrow at 3:30 PM in Room 204.',
          urgency: 'HIGH',
          category: 'EXAM',
          categoryLabel: 'Lịch thi / Kiểm tra',
          isSpam: false,
          language: 'en',
          rawEmail: {
            id: 'demo-raw-1',
            threadId: 't1',
            sender: 'Dr. Rebecca Vance',
            senderEmail: 'rvance@school.edu',
            subject: 'Office Hours & Unit 4 Quiz Prep',
            snippet: 'Hi students, I will be holding extra office hours tomorrow at 3:30 PM for anyone needing help before Friday quiz.',
            date: new Date().toISOString(),
            unread: true,
          },
        },
        {
          id: 'demo-email-2',
          sender: 'Mr. David Miller (AP US History)',
          subject: 'DBQ Rubric & Primary Source Packet',
          oneLineSummary: 'Updated rubric uploaded to Canvas. Due date unchanged.',
          urgency: 'MEDIUM',
          category: 'ASSIGNMENT',
          categoryLabel: 'Bài tập & Hạn nộp',
          isSpam: false,
          language: 'en',
          rawEmail: {
            id: 'demo-raw-2',
            threadId: 't2',
            sender: 'Mr. David Miller',
            senderEmail: 'dmiller@school.edu',
            subject: 'DBQ Rubric & Primary Source Packet',
            snippet: 'Please review the attached rubric for the New Deal DBQ. Be sure to cite at least 4 documents.',
            date: new Date().toISOString(),
            unread: false,
          },
        },
        {
          id: 'demo-email-3',
          sender: 'Shopee Deals',
          subject: 'Super Flash Sale 50% Off Back to School',
          oneLineSummary: 'Limited time coupon discounts on supplies.',
          urgency: 'INFO',
          category: 'SPAM',
          categoryLabel: 'Thư rác / Quảng cáo',
          isSpam: true,
          spamReason: 'Commercial e-commerce promotion',
          language: 'en',
          rawEmail: {
            id: 'demo-raw-3',
            threadId: 't3',
            sender: 'Shopee Deals',
            senderEmail: 'promo@shopee.vn',
            subject: 'Super Flash Sale 50% Off Back to School',
            snippet: 'Claim your 50% voucher today only! Click to view discounts on stationery and backpacks.',
            date: new Date().toISOString(),
            unread: false,
          },
        },
        {
          id: 'demo-email-4',
          sender: 'Spotify Student',
          subject: 'Your Weekly Student Playlist is Ready',
          oneLineSummary: 'Music playlist digest newsletter.',
          urgency: 'INFO',
          category: 'SPAM',
          categoryLabel: 'Thư rác / Quảng cáo',
          isSpam: true,
          spamReason: 'Marketing subscription newsletter',
          language: 'en',
          rawEmail: {
            id: 'demo-raw-4',
            threadId: 't4',
            sender: 'Spotify',
            senderEmail: 'no-reply@spotify.com',
            subject: 'Your Weekly Student Playlist is Ready',
            snippet: 'Check out new study focus tracks curated for university students this week.',
            date: new Date().toISOString(),
            unread: false,
          },
        },
      ]);

      setRecentFiles([
        {
          id: 'demo-file-1',
          name: 'AP US History - DBQ Thesis Outline.docx',
          mimeType: 'application/vnd.google-apps.document',
          webViewLink: 'https://docs.google.com',
          modifiedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
          size: '24 KB',
        },
        {
          id: 'demo-file-2',
          name: 'Physics Lab 3 - Pendulum Data & Graphs.xlsx',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          webViewLink: 'https://sheets.google.com',
          modifiedTime: new Date(Date.now() - 3600000 * 5).toISOString(),
          size: '48 KB',
        },
        {
          id: 'demo-file-3',
          name: 'Calculus BC - Series & Tests Presentation.pptx',
          mimeType: 'application/vnd.google-apps.presentation',
          webViewLink: 'https://slides.google.com',
          modifiedTime: new Date(Date.now() - 86400000 * 1).toISOString(),
          size: '3.2 MB',
        },
        {
          id: 'demo-file-4',
          name: 'Hamlet Act 2 Text & Critical Commentary.pdf',
          mimeType: 'application/pdf',
          webViewLink: 'https://drive.google.com',
          modifiedTime: new Date(Date.now() - 86400000 * 2).toISOString(),
          size: '1.5 MB',
        },
      ]);
    }
  }, [isDemoMode, user]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      setUser(currentUser);
      if (currentUser && getStoredGoogleToken()) {
        setIsDemoMode(false);
        addToast({
          type: 'success',
          title: 'Google Workspace Connected',
          message: `Signed in as ${currentUser.displayName || currentUser.email}`,
        });
      }
    });
    return () => unsubscribe();
  }, [addToast]);

  // Fetch Google Calendar Events
  const loadCalendarEvents = useCallback(async (isSilent = false) => {
    const token = getStoredGoogleToken();
    if (!token) {
      setCalendarEvents([]);
      setCalendarError(null);
      setCalendarApiInfo(null);
      return;
    }

    if (!isSilent) setIsLoadingEvents(true);
    try {
      const items = await fetchTodayCalendarEvents(token);
      setCalendarEvents(items);
      setCalendarError(null);
      setCalendarApiInfo(null);
    } catch (err: any) {
      console.error('Calendar fetch error:', err);
      if (err?.isServiceDisabled) {
        setCalendarApiInfo({
          serviceName: err.serviceName || 'Google Calendar API',
          serviceId: err.serviceId || 'calendar-json.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
      } else {
        setCalendarApiInfo(null);
      }
      setCalendarError(err.message || 'Could not fetch live Calendar events.');
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: err?.isServiceDisabled ? 'Calendar API Disabled' : 'Google Calendar Sync',
          message: err.message || 'Could not fetch live Calendar schedule.',
          actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
          actionUrl: err?.activationUrl,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingEvents(false);
    }
  }, [addToast]);

  // Fetch Academic Emails & Summarize with Gemini
  const loadEmailsAndAlerts = useCallback(async (isSilent = false) => {
    const token = getStoredGoogleToken();
    if (!token) {
      setRawEmails([]);
      setEmailAlerts([]);
      setEmailError(null);
      setGmailApiInfo(null);
      return;
    }

    if (!isSilent) setIsLoadingEmails(true);
    try {
      const emails = await fetchAcademicEmails(token);
      setRawEmails(emails);
      setEmailError(null);
      setGmailApiInfo(null);

      if (emails.length > 0) {
        const alerts = await summarizeEmailsWithGemini(emails);
        setEmailAlerts(alerts);
      } else {
        setEmailAlerts([]);
      }
    } catch (err: any) {
      console.error('Email fetch error:', err);
      if (err?.isServiceDisabled) {
        setGmailApiInfo({
          serviceName: err.serviceName || 'Gmail API',
          serviceId: err.serviceId || 'gmail.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
      } else {
        setGmailApiInfo(null);
      }
      setEmailError(err.message || 'Could not scan live Gmail inbox.');
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: err?.isServiceDisabled ? 'Gmail API Disabled' : 'Gmail Scanner',
          message: err.message || 'Could not scan live Gmail inbox.',
          actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
          actionUrl: err?.activationUrl,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingEmails(false);
    }
  }, [addToast]);

  // Fetch Master Sheet Assignments
  const loadSheetAssignments = useCallback(async (isSilent = false) => {
    const token = getStoredGoogleToken();
    if (!token) {
      setSheetError(null);
      setSheetApiInfo(null);
      return;
    }

    if (!isSilent) setIsLoadingAssignments(true);
    try {
      const sheet = await getOrCreateMasterSheet(token);
      setMasterSheetId(sheet.spreadsheetId);
      setMasterSheetUrl(sheet.spreadsheetUrl);

      const items = await fetchSheetAssignments(token, sheet.spreadsheetId);
      if (items && items.length > 0) {
        setAssignments(items);
      }
      setSheetError(null);
      setSheetApiInfo(null);
    } catch (err: any) {
      console.error('Sheet fetch error:', err);
      if (err?.isServiceDisabled) {
        setSheetApiInfo({
          serviceName: err.serviceName || 'Google Sheets API',
          serviceId: err.serviceId || 'sheets.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
      } else {
        setSheetApiInfo(null);
      }
      setSheetError(err.message || 'Could not sync Master Sheet.');
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: err?.isServiceDisabled ? 'Google Sheets API Disabled' : 'Google Sheet Sync',
          message: err.message || 'Could not sync Master Google Sheet.',
          actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
          actionUrl: err?.activationUrl,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingAssignments(false);
    }
  }, [addToast]);

  // Fetch Recent Files
  const loadRecentFiles = useCallback(async (isSilent = false) => {
    const token = getStoredGoogleToken();
    if (!token) {
      setRecentFiles([]);
      setDriveError(null);
      setDriveApiInfo(null);
      return;
    }

    if (!isSilent) setIsLoadingFiles(true);
    try {
      const files = await fetchRecentSchoolFiles(token);
      setRecentFiles(files);
      setDriveError(null);
      setDriveApiInfo(null);
    } catch (err: any) {
      console.error('Drive files error:', err);
      const errMsg = err?.message || 'Could not fetch Google Drive files.';
      if (err?.isServiceDisabled) {
        setDriveApiInfo({
          serviceName: err.serviceName || 'Google Drive API',
          serviceId: err.serviceId || 'drive.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
      } else {
        setDriveApiInfo(null);
      }
      setDriveError(errMsg);
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: err?.isServiceDisabled ? 'Google Drive API Disabled' : 'Google Drive Sync Failed',
          message: errMsg,
          actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
          actionUrl: err?.activationUrl,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingFiles(false);
    }
  }, [addToast]);

  // Fetch Canvas assignments (Zero fake data)
  const loadCanvasData = useCallback(async (isSilent = false) => {
    if (!canvasSettings.calendarFeedUrl && !canvasSettings.apiToken) {
      setCanvasAssignments([]);
      setCanvasError(null);
      return;
    }

    if (!isSilent) setIsLoadingCanvas(true);
    try {
      let apiFetched: CanvasAssignment[] = [];
      let feedFetched: CanvasAssignment[] = [];

      // 1. Fetch via REST API if configured
      if (canvasSettings.apiToken && canvasSettings.apiDomain) {
        try {
          apiFetched = await fetchCanvasAssignmentsFromApi(
            canvasSettings.apiDomain,
            canvasSettings.apiToken
          );
        } catch (e) {
          console.warn('Canvas REST API query error:', e);
        }
      }

      // 2. Fetch via Calendar Feed if configured
      if (canvasSettings.calendarFeedUrl) {
        try {
          feedFetched = await fetchCanvasAssignmentsFromFeed(canvasSettings.calendarFeedUrl);
        } catch (e) {
          console.warn('Canvas Calendar Feed query error:', e);
        }
      }

      // 3. Intelligent Union Merge so all courses (KHTN, Ngữ Văn, etc.) are captured
      const mergedMap = new Map<string, CanvasAssignment>();

      // Put feed items first
      for (const item of feedFetched) {
        const key = item.name.toLowerCase().trim();
        mergedMap.set(key, item);
      }

      // Merge API items, overlaying authentic live submission states & URLs
      for (const item of apiFetched) {
        const key = item.name.toLowerCase().trim();
        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, {
            ...existing,
            ...item,
            htmlUrl: item.htmlUrl || existing.htmlUrl,
            courseName: item.courseName || existing.courseName,
            isCompleted: Boolean(item.isCompleted),
          });
        } else {
          mergedMap.set(key, item);
        }
      }

      const fetched = Array.from(mergedMap.values());

      const crossRef = crossReferenceCanvasWithSheet(fetched, assignments);
      setCanvasAssignments(crossRef);
      setCanvasError(null);
      setLastSyncedAt(new Date());

      // Auto-Sync Canvas Completion to Master Sheet Tracker
      const token = getStoredGoogleToken();
      let updatedSheetCount = 0;

      const updatedAssignments = assignments.map((sheetItem) => {
        const sName = sheetItem.assignmentName.toLowerCase().trim();
        const sSub = sheetItem.subject.toLowerCase().trim();

        const matchingCanvas = crossRef.find((c) => {
          const cName = c.name.toLowerCase().trim();
          const cCourse = c.courseName.toLowerCase().trim();

          const exactName = sName === cName;
          const substringMatch =
            (sName.length >= 3 && cName.includes(sName)) ||
            (cName.length >= 3 && sName.includes(cName));
          const courseMatch =
            (sSub.length >= 2 && cCourse.includes(sSub)) ||
            (cCourse.length >= 2 && sSub.includes(cCourse));

          return exactName || (substringMatch && (courseMatch || !sSub || sSub === 'general'));
        });

        if (matchingCanvas && matchingCanvas.isCompleted && sheetItem.status !== 'Done') {
          updatedSheetCount++;
          const doneItem = { ...sheetItem, status: 'Done' as const };
          if (token && masterSheetId && sheetItem.sheetRowIndex) {
            updateAssignmentInSheet(token, masterSheetId, doneItem).catch((e) =>
              console.warn('Auto-sync status to sheet error:', e)
            );
          }
          return doneItem;
        }
        return sheetItem;
      });

      if (updatedSheetCount > 0) {
        setAssignments(updatedAssignments);
      }

      if (!isSilent) {
        addToast({
          type: 'success',
          title: 'Canvas LMS Synced Live',
          message: `Loaded ${crossRef.length} real assignments from your Canvas feed.${
            updatedSheetCount > 0 ? ` Marked ${updatedSheetCount} completed tasks as Done in Tracker.` : ''
          }`,
        });
      }
    } catch (err: any) {
      console.error('Canvas load error:', err);
      const errMsg = err.message || 'Failed to fetch Canvas feed. Please verify the URL.';
      setCanvasError(errMsg);
      setCanvasAssignments([]);
      if (!isSilent) {
        addToast({
          type: 'error',
          title: 'Canvas Sync Failed',
          message: errMsg,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingCanvas(false);
    }
  }, [canvasSettings, assignments, addToast]);

  // Comprehensive Auto-Sync Routine
  const runFullSync = useCallback(
    async (isSilent = true) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        await Promise.allSettled([
          loadCanvasData(isSilent),
          loadCalendarEvents(isSilent),
          loadEmailsAndAlerts(isSilent),
          loadSheetAssignments(isSilent),
          loadRecentFiles(isSilent),
        ]);
        setLastSyncedAt(new Date());
      } finally {
        isSyncingRef.current = false;
      }
    },
    [
      loadCanvasData,
      loadCalendarEvents,
      loadEmailsAndAlerts,
      loadSheetAssignments,
      loadRecentFiles,
    ]
  );

  // Manual Refresh All Data Button
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await runFullSync(false);
      addToast({
        type: 'info',
        title: 'All Channels Synced',
        message: 'Canvas LMS and Google Workspace data updated.',
      });
    } finally {
      setIsRefreshingAll(false);
    }
  }, [runFullSync, addToast]);

  // 1. Initial Auto-Sync on App Startup / Web Open
  useEffect(() => {
    runFullSync(true);
  }, [runFullSync]);

  // 2. Real-Time Background Auto-Sync (Every 45 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      runFullSync(true);
    }, 45000);

    return () => clearInterval(interval);
  }, [runFullSync]);

  // 3. Real-Time Auto-Sync on Tab Focus / Document Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runFullSync(true);
      }
    };

    const handleWindowFocus = () => {
      runFullSync(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [runFullSync]);

  // Re-cross reference Canvas whenever assignments change
  useEffect(() => {
    setCanvasAssignments((prev) => crossReferenceCanvasWithSheet(prev, assignments));
  }, [assignments]);

  // Proactive Google OAuth Token Expiry Warning
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = getStoredGoogleToken();
      if (!token) return;

      const acquiredAtStr = sessionStorage.getItem('google_token_acquired_at');
      if (!acquiredAtStr) return;

      const acquiredAt = parseInt(acquiredAtStr, 10);
      const age = Date.now() - acquiredAt;
      const fiftyMins = 50 * 60 * 1000;

      if (age > fiftyMins) {
        addToast({
          type: 'warning',
          title: 'Google Session Expiring',
          message: 'Your Google workspace token will expire soon. Reconnect to keep sync active.',
          actionLabel: 'Reconnect',
          actionUrl: '#reconnect-google',
        });
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [addToast]);

  // Google Sign In Handler
  const handleGoogleSignIn = async (requestWorkspace = true) => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle({ requestWorkspace });
      if (!result) {
        // User closed or dismissed the popup - clean exit
        return;
      }
      setUser(result.user);
      setIsDemoMode(false);
      setOauthGuideModalOpen(false);

      if (result.accessToken) {
        await runFullSync(false);
        addToast({
          type: 'success',
          title: 'Google Workspace Connected',
          message: `Signed in as ${result.user.displayName || result.user.email || 'User'}.`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Signed in (Basic Profile)',
          message: `Signed in as ${result.user.displayName || result.user.email || 'User'}. Follow the OAuth setup to enable live Sheets & Drive sync.`,
          duration: 6000,
        });
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (
        err instanceof OAuthTestUserRequiredError ||
        err?.isOAuthBlocked ||
        err?.message?.includes('OAuth Verification') ||
        err?.message?.includes('Test users') ||
        err?.message?.includes('verification process')
      ) {
        setOauthGuideModalOpen(true);
        addToast({
          type: 'warning',
          title: 'Google Test User Setup Needed',
          message: 'Google requires adding your email to "Test users" in Google Cloud Console for Workspace access.',
          duration: 8000,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Sign In Failed',
          message: err.message || 'Could not complete Google sign in.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBasicSignIn = async () => {
    await handleGoogleSignIn(false);
  };

  // Logout Handler
  const handleLogout = async () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Disconnect Google Workspace?',
      description:
        'This will sign you out of Google Workspace features (Sheets, Drive, Gmail, Calendar). Your local tracker and Canvas feed remain active.',
      isDestructive: true,
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        await signOutUser();
        setUser(null);
        setCalendarEvents([]);
        setEmailAlerts([]);
        setRawEmails([]);
        setRecentFiles([]);
        setMasterSheetId(undefined);
        setMasterSheetUrl(undefined);
        addToast({
          type: 'info',
          title: 'Disconnected',
          message: 'Google Workspace disconnected.',
        });
      },
    });
  };

  // Add Assignment
  const handleAddAssignment = async (newAssign: Omit<Assignment, 'id'>) => {
    const token = getStoredGoogleToken();
    const tempId = `assign-${Date.now()}`;
    const fullAssign: Assignment = { ...newAssign, id: tempId };

    if (token && masterSheetId) {
      try {
        const added = await appendAssignmentToSheet(token, masterSheetId, fullAssign);
        setAssignments((prev) => [...prev, added]);
        addToast({
          type: 'success',
          title: 'Saved to Master Sheet',
          message: `Added "${fullAssign.assignmentName}" to Google Sheets.`,
          actionLabel: 'Open Sheet',
          actionUrl: masterSheetUrl,
        });
      } catch (err: any) {
        console.error('Error appending to sheet:', err);
        setAssignments((prev) => [...prev, fullAssign]);
        addToast({
          type: 'warning',
          title: 'Saved Locally',
          message: 'Could not append to Google Sheet. Saved locally in tracker.',
        });
      }
    } else {
      setAssignments((prev) => [...prev, fullAssign]);
      addToast({
        type: 'success',
        title: 'Assignment Added',
        message: `Added "${fullAssign.assignmentName}" to Master Tracker.`,
      });
    }
  };

  // Update Status
  const handleUpdateStatus = async (assignment: Assignment, newStatus: AssignmentStatus) => {
    const updated = { ...assignment, status: newStatus };
    setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? updated : a)));

    const token = getStoredGoogleToken();
    if (token && masterSheetId && assignment.sheetRowIndex) {
      try {
        await updateAssignmentInSheet(token, masterSheetId, updated);
        addToast({
          type: 'info',
          title: 'Status Updated in Sheet',
          message: `Marked "${assignment.assignmentName}" as ${newStatus}.`,
        });
      } catch (err) {
        console.error('Error updating status in sheet:', err);
      }
    } else {
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: `Marked "${assignment.assignmentName}" as ${newStatus}.`,
      });
    }
  };

  // Clear / Purge all completed assignments from Master Sheet and tracker
  const handleClearCompletedAssignments = async () => {
    const activeOnly = assignments.filter((a) => a.status !== 'Done');
    const token = getStoredGoogleToken();

    if (token && masterSheetId) {
      try {
        const synced = await syncAllAssignmentsToSheet(token, masterSheetId, activeOnly);
        setAssignments(synced);
        addToast({
          type: 'success',
          title: 'Completed Tasks Cleared',
          message: 'Cleaned finished assignments from your Master Google Sheet.',
        });
      } catch (err: any) {
        console.error('Error clearing completed from sheet:', err);
        setAssignments(activeOnly);
        addToast({
          type: 'info',
          title: 'Cleared Locally',
          message: 'Removed finished tasks from local view.',
        });
      }
    } else {
      setAssignments(activeOnly);
      addToast({
        type: 'success',
        title: 'Completed Tasks Cleared',
        message: 'Removed finished tasks from Master Tracker.',
      });
    }
  };

  // Natural Language Task Parse
  const handleParseNaturalText = async (text: string) => {
    setIsParsingAI(true);
    try {
      const parsed = await parseNaturalLanguageAssignment(text);
      await handleAddAssignment({
        assignmentName: parsed.assignmentName || text,
        subject: parsed.subject || 'General',
        dueDate: parsed.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        priority: parsed.priority || 'Med',
        status: 'Not Started',
        notes: parsed.notes || `Added via AI Smart Parse: "${text}"`,
        source: 'Manual',
      });
    } catch (err: any) {
      console.error('Parse error:', err);
      await handleAddAssignment({
        assignmentName: text,
        subject: 'General',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        priority: 'Med',
        status: 'Not Started',
        source: 'Manual',
      });
    } finally {
      setIsParsingAI(false);
    }
  };

  // Schedule Study Block in Google Calendar
  const handleScheduleStudyBlock = async (eventData: {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }) => {
    setIsScheduling(true);
    const token = getStoredGoogleToken();

    try {
      if (token) {
        const createdEvent = await insertCalendarEvent(token, {
          summary: eventData.title,
          description: eventData.description,
          start: { dateTime: eventData.startDateTime },
          end: { dateTime: eventData.endDateTime },
          location: eventData.location,
        });

        setCalendarEvents((prev) => [
          ...prev,
          { ...createdEvent, isStudyBlock: true },
        ]);

        addToast({
          type: 'success',
          title: 'Study Block Scheduled in Google Calendar!',
          message: `Added focus session: "${eventData.title}"`,
          actionLabel: 'Open Calendar',
          actionUrl: createdEvent.htmlLink || 'https://calendar.google.com',
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Connect Google Account',
          message: 'Sign in to Google Calendar to schedule live calendar events.',
        });
      }
    } catch (err: any) {
      console.error('Error adding study block:', err);
      if (err?.isServiceDisabled) {
        setApiActivationModalInfo({
          serviceName: err.serviceName || 'Google Calendar API',
          serviceId: err.serviceId || 'calendar-json.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
        setApiActivationModalOpen(true);
      }
      addToast({
        type: 'error',
        title: err?.isServiceDisabled ? 'Calendar API Disabled' : 'Scheduling Failed',
        message: err.message || 'Could not insert event into Google Calendar.',
        actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
        actionUrl: err?.activationUrl,
      });
    } finally {
      setIsScheduling(false);
    }
  };

  // Create Assignment Doc in Drive
  const handleCreateDoc = async (params: CreateDocParams): Promise<string | null> => {
    setIsCreatingDoc(true);
    const token = getStoredGoogleToken();

    try {
      if (token) {
        const res = await createAssignmentDoc(token, params);
        const docUrl = res.webViewLink;

        await loadRecentFiles();

        addToast({
          type: 'success',
          title: 'Google Doc Created in Drive!',
          message: `Created "${params.title}" with MLA/APA formatting.`,
          actionLabel: 'Open Document',
          actionUrl: docUrl,
        });

        // Prompt to add to Master Assignment Tracker if not already there
        const existsInTracker = assignments.some(
          (a) => a.assignmentName.toLowerCase() === params.title.toLowerCase()
        );
        if (!existsInTracker) {
          setConfirmationModal({
            isOpen: true,
            title: 'Add New Doc to Master Assignment Tracker?',
            description: `Would you like to link "${params.title}" (${params.subject}) to your Master Google Sheet tracker?`,
            confirmLabel: 'Add to Sheet Tracker',
            cancelLabel: 'Skip',
            onConfirm: async () => {
              await handleAddAssignment({
                assignmentName: params.title,
                subject: params.subject,
                dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
                priority: 'Med',
                status: 'In Progress',
                docUrl: docUrl,
                notes: params.objectives,
                source: 'Manual',
              });
            },
          });
        }

        return docUrl;
      } else {
        addToast({
          type: 'warning',
          title: 'Google Drive Not Connected',
          message: 'Connect your Google account to create live Google Docs in Drive.',
        });
        return null;
      }
    } catch (err: any) {
      console.error('Doc creation error:', err);
      if (err?.isServiceDisabled) {
        setApiActivationModalInfo({
          serviceName: err.serviceName || 'Google Docs API',
          serviceId: err.serviceId || 'docs.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
        setApiActivationModalOpen(true);
      }
      addToast({
        type: 'error',
        title: err?.isServiceDisabled ? 'Docs/Drive API Disabled' : 'Doc Creation Failed',
        message: err.message || 'Could not generate Google Doc in Drive.',
        actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
        actionUrl: err?.activationUrl,
      });
      return null;
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Save Gmail Draft
  const handleSaveToGmailDrafts = async (to: string, subject: string, body: string) => {
    setIsSavingDraft(true);
    const token = getStoredGoogleToken();

    try {
      if (token) {
        await createGmailDraft(token, to, subject, body);
        addToast({
          type: 'success',
          title: 'Draft Saved to Gmail!',
          message: `Email to ${to || 'teacher'} is ready in your Gmail Drafts folder.`,
          actionLabel: 'Open Gmail',
          actionUrl: 'https://mail.google.com/mail/u/0/#drafts',
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Gmail Not Connected',
          message: 'Connect your Google account to save drafts directly into Gmail.',
        });
      }
    } catch (err: any) {
      console.error('Save draft error:', err);
      if (err?.isServiceDisabled) {
        setApiActivationModalInfo({
          serviceName: err.serviceName || 'Gmail API',
          serviceId: err.serviceId || 'gmail.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || '614024702267',
        });
        setApiActivationModalOpen(true);
      }
      addToast({
        type: 'error',
        title: err?.isServiceDisabled ? 'Gmail API Disabled' : 'Draft Save Failed',
        message: err.message || 'Could not save draft to Gmail.',
        actionLabel: err?.activationUrl ? 'Enable in Cloud' : undefined,
        actionUrl: err?.activationUrl,
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Extract Assignment from Scanned Email Alert
  const handleExtractAssignment = (alert: EmailAlert) => {
    if (!alert.detectedAssignment) return;
    const { name, subject, dueDate, priority } = alert.detectedAssignment;

    setConfirmationModal({
      isOpen: true,
      title: 'Add Scanned Assignment to Sheet?',
      description: `Auto-extracted from email "${alert.subject}":\n"${name}" (${subject}) due ${dueDate}.`,
      confirmLabel: 'Add to Master Sheet',
      onConfirm: async () => {
        await handleAddAssignment({
          assignmentName: name,
          subject: subject,
          dueDate: dueDate,
          priority: priority,
          status: 'Not Started',
          source: 'Gmail',
          notes: `Scanned from email alert: ${alert.oneLineSummary}`,
        });
      },
    });
  };

  // Sync single Canvas assignment to Google Sheet
  const handleSyncCanvasToSheet = async (canvasItem: CanvasAssignment) => {
    await handleAddAssignment({
      assignmentName: canvasItem.name,
      subject: canvasItem.courseName,
      dueDate: canvasItem.dueAt,
      priority: canvasItem.pointsPossible && canvasItem.pointsPossible >= 50 ? 'High' : 'Med',
      status: 'Not Started',
      source: 'Canvas',
      notes: canvasItem.description || `Canvas Assignment (${canvasItem.pointsPossible || 0} pts)`,
    });

    setCanvasAssignments((prev) =>
      prev.map((c) => (c.id === canvasItem.id ? { ...c, isSynced: true } : c))
    );
  };

  // Sync All Pending Canvas to Sheet
  const handleSyncAllPendingCanvas = async () => {
    const pending = canvasAssignments.filter((a) => !a.isSynced);
    if (pending.length === 0) return;

    for (const item of pending) {
      await handleSyncCanvasToSheet(item);
    }

    addToast({
      type: 'success',
      title: 'Canvas Batch Sync Complete',
      message: `Added ${pending.length} pending Canvas tasks to your Master Google Sheet!`,
      actionLabel: masterSheetUrl ? 'Open Sheet' : undefined,
      actionUrl: masterSheetUrl,
    });
  };

  // Create Doc from Canvas Assignment
  const handleCreateDocFromCanvas = (canvasItem: CanvasAssignment) => {
    setActiveTab('projects');
    handleCreateDoc({
      title: canvasItem.name,
      subject: canvasItem.courseName,
      formatStyle: 'MLA',
      objectives: canvasItem.description || `Complete ${canvasItem.name} for ${canvasItem.courseName}.`,
      checklist: [
        'Review Canvas prompt guidelines & rubric breakdown',
        'Gather research citations & references',
        'Draft structured sections & analysis',
        'Final proofread & submit to Canvas portal',
      ],
    });
  };

  // Google Drive & Canvas direct submission workflow
  const handleSubmitAssignment = async (assignment: CanvasAssignment, fileId: string) => {
    const token = getStoredGoogleToken();
    if (!token && !isDemoMode) {
      addToast({
        type: 'error',
        title: 'Google Connection Required',
        message: 'Please connect your Google Account to submit files from Google Drive.',
      });
      return;
    }

    try {
      // 1. Auto-share document permissions (anyone with link can view)
      if (token) {
        await shareGoogleDriveFile(token, fileId);
      }

      // 2. Generate standard document URL
      const fileUrl = `https://docs.google.com/document/d/${fileId}/edit`;

      // 3. Submit directly to Canvas if REST API credentials exist
      if (canvasSettings.apiToken && canvasSettings.apiDomain && assignment.courseId) {
        await submitCanvasAssignment(
          canvasSettings.apiDomain,
          canvasSettings.apiToken,
          assignment.courseId,
          assignment.id,
          fileUrl
        );
      }

      // 4. Sync done status to Master Google Sheet tracker
      const targetSheetItem = assignments.find(
        (a) =>
          a.assignmentName.toLowerCase().trim() === assignment.name.toLowerCase().trim() ||
          assignment.name.toLowerCase().includes(a.assignmentName.toLowerCase().trim())
      );

      if (targetSheetItem) {
        await handleUpdateStatus(targetSheetItem, 'Done');
      }

      // 5. Update state
      setCanvasAssignments((prev) =>
        prev.map((c) => (c.id === assignment.id ? { ...c, isCompleted: true } : c))
      );

      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
      });

      addToast({
        type: 'success',
        title: 'Assignment Submitted!',
        message: `Successfully shared and submitted "${assignment.name}" to Canvas.`,
      });
    } catch (err: any) {
      console.error('Canvas submit workflow error:', err);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Failed to complete Canvas submission.',
      });
      throw err;
    }
  };


  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '1') {
        setActiveTab('canvas');
      } else if (e.key === '2') {
        setActiveTab('radar');
      } else if (e.key === '3') {
        setActiveTab('gmail');
      } else if (e.key === '4') {
        setActiveTab('tracker');
      } else if (e.key === '5') {
        setActiveTab('projects');
      } else if (e.key === 'r' || e.key === 'R') {
        handleRefreshAll();
      } else if (e.key === 'd' || e.key === 'D') {
        setDarkMode((prev) => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        setAiChatOpen((prev) => !prev);
      } else if (e.key === '?') {
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefreshAll]);

  if (!user && !isDemoMode) {
    return (
      <LandingPage
        onSignIn={() => handleGoogleSignIn(true)}
        onExploreDemo={() => setIsDemoMode(true)}
        isLoggingIn={isLoggingIn}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100/70 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Demo Mode Top Alert */}
      {!user && isDemoMode && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            <span>You are viewing in <strong>Live Demo Mode</strong>. Connect Google to sync live Canvas & Google Workspace.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGoogleSignIn(true)}
              disabled={isLoggingIn}
              className="px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Sign In with Google
            </button>
            <button
              onClick={() => setIsDemoMode(false)}
              className="px-2 py-1 text-indigo-100 hover:text-white text-xs cursor-pointer"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}
      {/* Left Navigation Rail (Desktop) + Main Area Container */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Sleek Navy Navigation Rail */}
        <nav
          aria-label="Primary Navigation"
          className="w-20 bg-[#0F172A] hidden md:flex flex-col items-center py-5 border-r border-slate-800 shadow-xl shrink-0 justify-between z-30 select-none h-full"
        >
          {/* Brand Logo Monogram */}
          <div
            onClick={() => setActiveTab('canvas')}
            className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/40 hover:scale-105 transition-transform cursor-pointer"
            title="Canvas LMS Hub & Student Command Center"
          >
            S
          </div>

          {/* Navigation Icons with Active States */}
          <div className="flex flex-col space-y-4 my-auto">
            {/* 1. Canvas LMS Tab (Prioritized) */}
            <button
              id="rail-tab-canvas"
              onClick={() => setActiveTab('canvas')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Canvas LMS Hub (Press 1)"
            >
              <Layers className="w-5 h-5" />
              <span className="sr-only">Canvas LMS</span>
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                Canvas LMS <span className="text-indigo-400 font-bold ml-1">[1]</span>
              </span>
            </button>

            {/* 2. Daily Schedule Tab */}
            <button
              id="rail-tab-radar"
              onClick={() => setActiveTab('radar')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Daily Schedule (Press 2)"
            >
              <Compass className="w-5 h-5" />
              <span className="sr-only">Daily Schedule</span>
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                Daily Schedule <span className="text-slate-400 ml-1">[2]</span>
              </span>
            </button>

            {/* 3. Gmail Scanner Tab */}
            <button
              id="rail-tab-gmail"
              onClick={() => setActiveTab('gmail')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'gmail'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Gmail AI Scanner (Press 3)"
            >
              <Mail className="w-5 h-5" />
              <span className="sr-only">Gmail Scanner</span>
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                Gmail AI Scanner <span className="text-rose-400 ml-1">[3]</span>
              </span>
            </button>

            {/* 4. Assignment Tracker Tab */}
            <button
              id="rail-tab-tracker"
              onClick={() => setActiveTab('tracker')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Master Assignment Tracker (Press 4)"
            >
              <CheckSquare className="w-5 h-5" />
              <span className="sr-only">Assignment Tracker</span>
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                Assignment Tracker <span className="text-slate-400 ml-1">[4]</span>
              </span>
            </button>

            {/* 5. Project Starter Tab */}
            <button
              id="rail-tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Project Starter & Files (Press 5)"
            >
              <FileText className="w-5 h-5" />
              <span className="sr-only">Project Starter</span>
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                Project Starter <span className="text-slate-400 ml-1">[5]</span>
              </span>
            </button>
          </div>

          {/* Bottom Avatar / Profile Badge */}
          <div className="mt-auto">
            {user ? (
              <div
                className="w-10 h-10 rounded-full bg-slate-700 border-2 border-indigo-400/50 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors shadow-sm"
                title={`Signed in as ${user.displayName || user.email}`}
                onClick={() => setCommandPaletteOpen(true)}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (user.displayName || user.email || 'JD').slice(0, 2).toUpperCase()
                )}
              </div>
            ) : (
              <div
                onClick={() => handleGoogleSignIn()}
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 cursor-pointer hover:bg-slate-700 hover:border-indigo-500 transition-colors shadow-sm"
                title="Sign in with Google"
              >
                JD
              </div>
            )}
          </div>
        </nav>

        {/* Right Main Column with Top Header, Scrollable Content, and Bottom Status Bar */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120]">
          {/* Top Header */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            isDemoMode={isDemoMode}
            setIsDemoMode={setIsDemoMode}
            onGoogleSignIn={() => handleGoogleSignIn()}
            onLogout={handleLogout}
            isLoggingIn={isLoggingIn}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshingAll}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenShortcuts={() => setShortcutsModalOpen(true)}
            onOpenDeploymentGuide={() => setDeploymentModalOpen(true)}
            onOpenOAuthGuide={() => setOauthGuideModalOpen(true)}
            onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
            onOpenNewAssignment={() => setActiveTab('tracker')}
            sheetUrl={masterSheetUrl}
            notifications={notifications}
          />

          {/* Mobile Tab Navigation Bar (shown only on small screens) */}
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex space-x-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'canvas', label: 'Canvas LMS', icon: Layers },
              { id: 'radar', label: 'Daily Schedule', icon: Compass },
              { id: 'gmail', label: 'Gmail Scanner', icon: Mail },
              { id: 'tracker', label: 'Assignment Tracker', icon: CheckSquare },
              { id: 'projects', label: 'Project Starter', icon: FileText },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Main Content Container */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0">
            <div className="max-w-7xl mx-auto space-y-6">
              {activeTab === 'canvas' && (
                <CanvasSyncTab
                  settings={canvasSettings}
                  onSaveSettings={(newSettings) => {
                    setCanvasSettings(newSettings);
                    saveCanvasSettings(newSettings);
                  }}
                  canvasAssignments={canvasAssignments}
                  isLoading={isLoadingCanvas}
                  errorMessage={canvasError}
                  lastSyncedAt={lastSyncedAt}
                  onFetchCanvas={() => loadCanvasData(false)}
                  onSyncToSheet={handleSyncCanvasToSheet}
                  onSyncAllPending={handleSyncAllPendingCanvas}
                  onCreateDocFromCanvas={handleCreateDocFromCanvas}
                  recentFiles={recentFiles}
                  isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  onSubmitAssignment={handleSubmitAssignment}
                />
              )}

              {activeTab === 'radar' && (
                <DailyRadarTab
                  events={calendarEvents}
                  isLoadingEvents={isLoadingEvents}
                  onRefreshEvents={loadCalendarEvents}
                  onOpenScheduleModal={(evt) => {
                    setSelectedEventForSchedule(evt || null);
                    setSelectedAssignmentForSchedule(null);
                    setScheduleModalOpen(true);
                  }}
                  onNavigateToTab={setActiveTab}
                  urgentCanvasItems={canvasAssignments.filter((c) => !c.isSynced).slice(0, 3)}
                  allCanvasAssignments={canvasAssignments}
                  isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  onConnectGoogle={() => handleGoogleSignIn(true)}
                  calendarError={calendarError}
                  calendarApiInfo={calendarApiInfo}
                />
              )}

              {activeTab === 'gmail' && (
                <GmailRadarTab
                  emailAlerts={emailAlerts}
                  rawEmails={rawEmails}
                  isLoadingEmails={isLoadingEmails}
                  onRefreshEmails={loadEmailsAndAlerts}
                  onOpenQuickDraft={(email, alert) => {
                    setDraftInitialEmail(email || null);
                    setDraftInitialAlert(alert || null);
                    setQuickDraftModalOpen(true);
                  }}
                  onExtractAssignment={handleExtractAssignment}
                  isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  onConnectGoogle={() => handleGoogleSignIn(true)}
                  emailError={emailError}
                  gmailApiInfo={gmailApiInfo}
                />
              )}

              {activeTab === 'tracker' && (
                <AssignmentTrackerTab
                  assignments={assignments}
                  sheetUrl={masterSheetUrl}
                  sheetId={masterSheetId}
                  isLoading={isLoadingAssignments}
                  onRefresh={loadSheetAssignments}
                  onAddAssignment={handleAddAssignment}
                  onUpdateStatus={handleUpdateStatus}
                  onScheduleStudyBlock={(assignment) => {
                    setSelectedAssignmentForSchedule(assignment);
                    setSelectedEventForSchedule(null);
                    setScheduleModalOpen(true);
                  }}
                  onParseNaturalText={handleParseNaturalText}
                  isParsingAI={isParsingAI}
                  isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  onConnectGoogle={() => handleGoogleSignIn(true)}
                  onClearCompleted={handleClearCompletedAssignments}
                  sheetError={sheetError}
                  sheetApiInfo={sheetApiInfo}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectStarterTab
                  recentFiles={recentFiles}
                  isLoadingFiles={isLoadingFiles}
                  onRefreshFiles={() => loadRecentFiles(false)}
                  onCreateDoc={handleCreateDoc}
                  isCreatingDoc={isCreatingDoc}
                  isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  onConnectGoogle={() => handleGoogleSignIn(true)}
                  driveError={driveError}
                  driveApiInfo={driveApiInfo}
                  onOpenActivationModal={(info) => {
                    setApiActivationModalInfo(info);
                    setApiActivationModalOpen(true);
                  }}
                  googleToken={getStoredGoogleToken() || undefined}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Floating AI Coach Button if closed */}
      {!aiChatOpen && (
        <button
          id="btn-floating-ai-coach"
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/25 flex items-center gap-2 font-bold text-xs hover:scale-105 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AI Study Coach</span>
        </button>
      )}

      {/* Slide-over / Popup AI Study Coach */}
      <StudyAssistantChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        assignments={assignments}
        events={calendarEvents}
        alerts={emailAlerts}
      />

      {/* Quick Draft Modal */}
      <QuickDraftModal
        isOpen={quickDraftModalOpen}
        onClose={() => {
          setQuickDraftModalOpen(false);
          setDraftInitialEmail(null);
          setDraftInitialAlert(null);
        }}
        initialEmail={draftInitialEmail}
        initialAlert={draftInitialAlert}
        onGenerateDraft={generateQuickDraft}
        onSaveToGmailDrafts={handleSaveToGmailDrafts}
        isSavingDraft={isSavingDraft}
      />

      {/* Schedule Study Session Modal */}
      <ScheduleStudyModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedAssignmentForSchedule(null);
          setSelectedEventForSchedule(null);
        }}
        assignment={selectedAssignmentForSchedule}
        initialEvent={selectedEventForSchedule}
        onSchedule={handleScheduleStudyBlock}
        isScheduling={isScheduling}
      />

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        modal={confirmationModal}
        onClose={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onOpenQuickDraft={() => {
          setDraftInitialEmail(null);
          setDraftInitialAlert(null);
          setQuickDraftModalOpen(true);
        }}
        onOpenNewAssignment={() => {
          setActiveTab('tracker');
        }}
        onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        assignments={assignments}
        sheetUrl={masterSheetUrl}
      />

      {/* Keyboard Shortcuts Cheat-sheet Modal */}
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Vercel Deployment & Integrations Guide Modal */}
      <DeploymentModal
        isOpen={deploymentModalOpen}
        onClose={() => setDeploymentModalOpen(false)}
      />

      {/* Google OAuth & Test Users Setup Guide Modal */}
      <OAuthGuideModal
        isOpen={oauthGuideModalOpen}
        onClose={() => setOauthGuideModalOpen(false)}
        onRetryWorkspaceSignIn={() => handleGoogleSignIn(true)}
        onBasicSignIn={handleBasicSignIn}
        isLoggingIn={isLoggingIn}
        projectId="studentcommandcenter-39cdc"
        userEmail="buianhuy2009@gmail.com"
      />

      {/* Google Cloud API Enablement Modal */}
      <ApiActivationModal
        isOpen={apiActivationModalOpen}
        onClose={() => setApiActivationModalOpen(false)}
        info={apiActivationModalInfo}
        onRetry={() => {
          setApiActivationModalOpen(false);
          handleRefreshAll();
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
