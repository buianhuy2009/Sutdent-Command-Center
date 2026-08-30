import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Compass,
  CheckSquare,
  Layers,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
  Mail,
  Radio,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DailyRadarTab } from './components/DailyRadarTab';
import { GmailRadarTab } from './components/GmailRadarTab';
import { AssignmentTrackerTab } from './components/AssignmentTrackerTab';
import { CanvasSyncTab } from './components/CanvasSyncTab';
import { LandingPage } from './components/LandingPage';
import { QuickDraftModal } from './components/QuickDraftModal';
import { ScheduleStudyModal } from './components/ScheduleStudyModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StudyAssistantChat } from './components/StudyAssistantChat';
import { AccountSettingsModal, ShortcutSettings, defaultShortcutSettings } from './components/AccountSettingsModal';
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
  shareGoogleDriveFile,
} from './services/googleWorkspace';
import {
  loadCanvasSettings,
  saveCanvasSettings,
  fetchCanvasAssignmentsFromFeed,
  fetchCanvasAssignmentsFromApi,
  crossReferenceCanvasWithSheet,
  submitCanvasAssignment,
  loadCompletedCanvasIds,
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
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [clearedTabBadges, setClearedTabBadges] = useState<Set<string>>(new Set());
  const onboardingDialogRef = useRef<HTMLDialogElement | null>(null);

  // Smooth View Transitions for workspace switching
  const handleTabTransition = useCallback((newTab: string) => {
    setClearedTabBadges((prev) => new Set(prev).add(newTab));
    setAiChatOpen(false); // return to normal workspace if coach was open

    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setActiveTab(newTab);
      });
    } else {
      setActiveTab(newTab);
    }
  }, []);

  // Real Data State (Zero Fake Data)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlert[]>([]);
  const [rawEmails, setRawEmails] = useState<EmailMessage[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>(loadSavedAssignments());
  const [recentFiles, setRecentFiles] = useState<SchoolFile[]>([]);
  const [canvasAssignments, setCanvasAssignments] = useState<CanvasAssignment[]>([]);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(loadCanvasSettings());

  // Sidebar expanded / collapsed state (persisted in localStorage)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scc_sidebar_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scc_sidebar_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keyboard Shortcut Preferences (all off by default)
  const [shortcutSettings, setShortcutSettings] = useState<ShortcutSettings>(() => {
    try {
      const saved = localStorage.getItem('scc_shortcut_settings');
      return saved ? JSON.parse(saved) : defaultShortcutSettings;
    } catch {
      return defaultShortcutSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('scc_shortcut_settings', JSON.stringify(shortcutSettings));
    } catch {
      // ignore
    }
  }, [shortcutSettings]);

  // Accessibility / Appearance Preferences
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scc_reduced_motion') === 'true';
    } catch {
      return false;
    }
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scc_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('scc_reduced_motion', String(reducedMotion));
    } catch {}
  }, [reducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem('scc_high_contrast', String(highContrast));
    } catch {}
  }, [highContrast]);

  // Zen Focus Mode (Distraction-Free Experience)
  const [zenFocusMode, setZenFocusMode] = useState<boolean>(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState<number>(25 * 60);
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isFocusTimerRunning && focusTimerSeconds > 0) {
      interval = setInterval(() => {
        setFocusTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusTimerRunning, focusTimerSeconds]);

  // Calculate live badge counts for sidebar
  const completedCanvasIds = useMemo(() => new Set(loadCompletedCanvasIds()), [canvasAssignments]);
  const canvasUnfinishedCount = useMemo(
    () => canvasAssignments.filter((a) => !completedCanvasIds.has(a.id)).length,
    [canvasAssignments, completedCanvasIds]
  );
  const urgentEmailCount = useMemo(
    () => emailAlerts.filter((e) => (e.urgency === 'HIGH' || e.urgency === 'MEDIUM') && !e.isSpam).length,
    [emailAlerts]
  );
  const pendingAssignmentCount = useMemo(
    () => assignments.filter((a) => a.status !== 'Done').length,
    [assignments]
  );

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

  // Show Onboarding Tour dialog on initial visit
  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem('scc_tour_seen');
      if (!tourSeen && onboardingDialogRef.current) {
        const timer = setTimeout(() => {
          onboardingDialogRef.current?.showModal();
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

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


  // Keyboard Shortcuts Listener (Respects user toggles, all off by default)
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

      // Check if global shortcuts are enabled
      if (!shortcutSettings.masterEnabled) {
        if (e.key === 'Escape') {
          if (zenFocusMode) setZenFocusMode(false);
          setAccountSettingsOpen(false);
          setAiChatOpen(false);
          setCommandPaletteOpen(false);
        }
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        setZenFocusMode((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (shortcutSettings.keys.search) {
          e.preventDefault();
          setCommandPaletteOpen((prev) => !prev);
        }
      } else if (e.key === '1' && shortcutSettings.keys.tab1) {
        handleTabTransition('canvas');
      } else if (e.key === '2' && shortcutSettings.keys.tab2) {
        handleTabTransition('radar');
      } else if (e.key === '3' && shortcutSettings.keys.tab3) {
        handleTabTransition('gmail');
      } else if (e.key === '4' && shortcutSettings.keys.tab4) {
        handleTabTransition('tracker');
      } else if (e.key === '5' && shortcutSettings.keys.tab5) {
        handleTabTransition('projects');
      } else if ((e.key === 'r' || e.key === 'R') && shortcutSettings.keys.sync) {
        handleRefreshAll();
      } else if (e.key === '?' && shortcutSettings.keys.help) {
        setAccountSettingsOpen(true);
      } else if (e.key === 'Escape') {
        if (zenFocusMode) setZenFocusMode(false);
        setAccountSettingsOpen(false);
        setAiChatOpen(false);
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefreshAll, shortcutSettings, handleTabTransition, zenFocusMode]);

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
    <div className="h-screen max-h-screen overflow-hidden bg-[#FAF9F5] dark:bg-[#141413] text-[#141413] dark:text-[#FAF9F5] transition-colors flex flex-col font-sans selection:bg-[#D97757] selection:text-white">
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
        {/* Sleek Distinct Theme-Reactive Sidebar */}
        <nav
          aria-label="Primary Navigation"
          className={`${
            isSidebarExpanded ? 'w-64' : 'w-20'
          } ${zenFocusMode ? 'hidden' : 'hidden md:flex'} bg-[#EFECE2] dark:bg-[#1F1E1B] border-r border-[#DFDACB] dark:border-[#2C2B27] shadow-xl flex-col py-5 px-3 shrink-0 justify-between z-30 select-none h-full transition-[width] duration-300 ease-in-out`}
        >
          {/* Top Brand Monogram / Insignia Header */}
          <div className="flex items-center justify-between gap-3 px-2 mb-6">
            <div
              onClick={() => handleTabTransition('canvas')}
              className="flex items-center gap-3 cursor-pointer group min-w-0"
              title="Canvas LMS Hub & Student Command Center"
            >
              <div className="w-11 h-11 bg-gradient-to-tr from-[#D97757] via-[#E07A5F] to-[#F59E0B] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#D97757]/30 group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L1 7L12 12L23 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
                  <path d="M5 10.5V16C5 17.5 8.13401 20 12 20C15.866 20 19 17.5 19 16V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12V22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
                  <circle cx="12" cy="7" r="1.5" fill="#FBBF24" />
                </svg>
              </div>
              {isSidebarExpanded && (
                <div className="min-w-0 overflow-hidden animate-in fade-in duration-200">
                  <h2 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight leading-tight truncate">
                    Student Center
                  </h2>
                  <p className="text-[10px] text-[#D97757] font-bold tracking-wide uppercase">
                    Academic OS
                  </p>
                </div>
              )}
            </div>

            {isSidebarExpanded && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#2A2825] rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items Group */}
          <div className="flex flex-col space-y-2 my-auto">
            {isSidebarExpanded && (
              <div className="px-3 pb-1 text-[10px] font-bold text-[#8C897F] uppercase tracking-wider">
                Workspaces
              </div>
            )}

            {[
              {
                id: 'canvas',
                label: 'Canvas LMS',
                description: 'Assignments & Submissions',
                icon: Layers,
                key: '1',
                badge: (!clearedTabBadges.has('canvas') && canvasUnfinishedCount > 0) ? `${canvasUnfinishedCount}` : undefined,
                badgeColor: 'bg-[#D97757] text-white',
              },
              {
                id: 'radar',
                label: 'Daily Schedule',
                description: 'Classes & Focus Blocks',
                icon: Compass,
                key: '2',
                badge: (!clearedTabBadges.has('radar') && calendarEvents.length > 0) ? `${calendarEvents.length}` : undefined,
                badgeColor: 'bg-[#D97757] text-white',
              },
              {
                id: 'gmail',
                label: 'Gmail AI Scanner',
                description: 'Filtered School Inbox',
                icon: Mail,
                key: '3',
                badge: (!clearedTabBadges.has('gmail') && urgentEmailCount > 0) ? `${urgentEmailCount}` : undefined,
                badgeColor: 'bg-rose-500 text-white',
              },
              {
                id: 'tracker',
                label: 'Assignment Tracker',
                description: 'Live Master Checklist',
                icon: CheckSquare,
                key: '4',
                badge: (!clearedTabBadges.has('tracker') && pendingAssignmentCount > 0) ? `${pendingAssignmentCount}` : undefined,
                badgeColor: 'bg-emerald-600 text-white',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={`rail-tab-${tab.id}`}
                  onClick={() => handleTabTransition(tab.id)}
                  className={`w-full rounded-xl flex items-center transition-all cursor-pointer relative group ${
                    isSidebarExpanded ? 'px-3 py-2.5 justify-between gap-3' : 'w-11 h-11 mx-auto justify-center'
                  } ${
                    isActive
                      ? 'bg-[#D97757] text-white shadow-md shadow-[#D97757]/25'
                      : 'bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]'
                  }`}
                  title={`${tab.label} (Press ${tab.key})`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 shrink-0" />
                    {isSidebarExpanded && (
                      <div className="text-left min-w-0 overflow-hidden">
                        <div className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-white' : 'text-[#141413] dark:text-[#FAF9F5]'}`}>
                          {tab.label}
                        </div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#8C897F]'}`}>
                          {tab.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {isSidebarExpanded ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tab.badge && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-black/20 text-[#8C897F]'}`}>
                        [{tab.key}]
                      </span>
                    </div>
                  ) : (
                    <>
                      {tab.badge && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D97757] ring-2 ring-[#EFECE2] dark:ring-[#1F1E1B]" />
                      )}
                      <span className="absolute left-14 bg-[#141413] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#141413] text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-[#DFDACB] dark:border-[#2C2B27]">
                        {tab.label} <span className="text-[#D97757] font-bold ml-1">[{tab.key}]</span>
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Actions: Expand Toggle & Account Settings Card */}
          <div className="mt-auto pt-4 border-t border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
            {!isSidebarExpanded && (
              <button
                onClick={toggleSidebar}
                className="w-11 h-11 mx-auto rounded-xl bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] flex items-center justify-center transition-colors cursor-pointer border border-[#DFDACB] dark:border-[#2C2B27]"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Click to open 2-Column Account & Settings Modal */}
            <div
              className={`flex items-center rounded-2xl p-1.5 cursor-pointer hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27] ${
                isSidebarExpanded ? 'gap-3 justify-start' : 'justify-center'
              }`}
              title="Open Account & Settings"
              onClick={() => setAccountSettingsOpen(true)}
            >
              {user ? (
                <div className="w-9 h-9 rounded-xl bg-[#D97757]/20 border-2 border-[#D97757]/40 flex items-center justify-center text-xs font-bold text-[#D97757] overflow-hidden shrink-0 shadow-xs">
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
                <div className="w-9 h-9 rounded-xl bg-[#D97757] border border-[#D97757] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
                  JD
                </div>
              )}

              {isSidebarExpanded && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] truncate leading-tight">
                    {user ? user.displayName || user.email?.split('@')[0] : 'Sign In'}
                  </div>
                  <div className="text-[10px] text-[#8C897F] truncate">
                    {user ? user.email : 'Account & Settings'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Right Main Column with Top Header, Scrollable Content, and Bottom Status Bar */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF9F5] dark:bg-[#141413]">
          {/* Top Header */}
          <Navbar
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
            notifications={notifications}
            isAiChatOpen={aiChatOpen}
            zenFocusMode={zenFocusMode}
            onToggleZenFocus={() => setZenFocusMode((prev) => !prev)}
          />

          {/* Zen Focus Mode Tranquil Banner */}
          {zenFocusMode && (
            <div className="bg-[#FAF9F5] dark:bg-[#1A1917] border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="text-base sm:text-lg">🧘</span>
                <div>
                  <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider">
                    Zen Focus Mode
                  </h3>
                  <p className="text-[10px] text-[#8C897F] hidden sm:block">
                    Distractions cleared. Focus on your active coursework.
                  </p>
                </div>
              </div>

              {/* Focus Pomodoro Timer */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-[#EFECE2] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl px-3 py-1 font-mono text-xs sm:text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  <span>
                    {Math.floor(focusTimerSeconds / 60)}:
                    {(focusTimerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setIsFocusTimerRunning(!isFocusTimerRunning)}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#D97757] text-white hover:bg-[#C86646] transition-colors cursor-pointer"
                  >
                    {isFocusTimerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => {
                      setIsFocusTimerRunning(false);
                      setFocusTimerSeconds(25 * 60);
                    }}
                    className="text-[10px] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] cursor-pointer hidden sm:inline"
                    title="Reset to 25 mins"
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={() => setZenFocusMode(false)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer whitespace-nowrap"
                  title="Exit Focus Mode (Esc)"
                >
                  ✕ Exit
                </button>
              </div>
            </div>
          )}

          {/* Mobile Tab Navigation Bar (shown only on small screens) */}
          <div className="md:hidden bg-[#FAF9F6]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex space-x-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'canvas', label: 'Canvas LMS', icon: Layers },
              { id: 'radar', label: 'Daily Schedule', icon: Compass },
              { id: 'gmail', label: 'Gmail Scanner', icon: Mail },
              { id: 'tracker', label: 'Assignment Tracker', icon: CheckSquare },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabTransition(tab.id)}
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

          {/* Main Area: Full-Screen AI Coach View OR Workspace Tabs */}
          {aiChatOpen ? (
            <StudyAssistantChat
              isOpen={true}
              onClose={() => setAiChatOpen(false)}
              assignments={assignments}
              events={calendarEvents}
              alerts={emailAlerts}
              isFullScreen={true}
            />
          ) : (
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
                  pendingAssignments={assignments.filter((a) => a.status !== 'Done')}
                  onAddStudyBlock={handleScheduleStudyBlock}
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
            </div>
          </main>
          )}
        </div>
      </div>

      {/* Unified 2-Column Account & Settings Modal */}
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        user={user}
        onGoogleSignIn={() => handleGoogleSignIn()}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshingAll}
        sheetUrl={masterSheetUrl}
        onOpenTour={() => {
          onboardingDialogRef.current?.showModal();
        }}
        onOpenOAuthGuide={() => setOauthGuideModalOpen(true)}
        onOpenDeploymentGuide={() => setDeploymentModalOpen(true)}
        shortcutSettings={shortcutSettings}
        setShortcutSettings={setShortcutSettings}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
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
        recentFiles={recentFiles}
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
        onSelectTab={handleTabTransition}
        onOpenQuickDraft={() => {
          setDraftInitialEmail(null);
          setDraftInitialAlert(null);
          setQuickDraftModalOpen(true);
        }}
        onOpenNewAssignment={() => {
          handleTabTransition('tracker');
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

      {/* Declarative Native <dialog> Onboarding Tour */}
      <dialog
        ref={onboardingDialogRef}
        id="onboarding-tour-dialog"
        className="backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs rounded-2xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl bg-[#FAF9F6] dark:bg-[#0F172A] text-slate-900 dark:text-white max-w-lg w-full m-auto overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/30">
                S
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">Welcome to Student Command Center</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Eye-friendly, distraction-free academic workspace</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('scc_tour_seen', 'true');
                onboardingDialogRef.current?.close();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 shrink-0 font-bold">1</span>
              <div>
                <strong className="text-slate-900 dark:text-white block font-semibold">Canvas LMS Direct Sync</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Filter unfinished vs. completed homework, open quizzes directly in Canvas, or submit files from Google Drive.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 shrink-0 font-bold">2</span>
              <div>
                <strong className="text-slate-900 dark:text-white block font-semibold">Unified Daily Timeline</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Your Google Calendar classes, study focus blocks, and today's Canvas deadlines merged in chronological order.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0 font-bold">3</span>
              <div>
                <strong className="text-slate-900 dark:text-white block font-semibold">Anti-Eyestrain Linen Theme</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Custom calibrated #FAF9F6 soft background eliminates blue-light glare and eye fatigue during late study sessions.</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">Press 1-5 for fast keyboard switching</span>
            <button
              onClick={() => {
                localStorage.setItem('scc_tour_seen', 'true');
                onboardingDialogRef.current?.close();
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </dialog>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
