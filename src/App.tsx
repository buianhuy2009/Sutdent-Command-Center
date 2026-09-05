import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardHome } from './components/DashboardHome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useBadgeCounts } from './hooks/useBadgeCounts';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import { initTheme, setTheme, syncDarkToTheme } from './services/theme';
const AcademicRadarWorkspace = lazy(() => import('./components/workspaces/AcademicRadarWorkspace').then(m => ({ default: m.AcademicRadarWorkspace })));
const StemLabWorkspace = lazy(() => import('./components/workspaces/StemLabWorkspace').then(m => ({ default: m.StemLabWorkspace })));
const CreationStudioWorkspace = lazy(() => import('./components/workspaces/CreationStudioWorkspace').then(m => ({ default: m.CreationStudioWorkspace })));
const RetentionVaultWorkspace = lazy(() => import('./components/workspaces/RetentionVaultWorkspace').then(m => ({ default: m.RetentionVaultWorkspace })));
const DocumentHubWorkspace = lazy(() => import('./components/workspaces/DocumentHubWorkspace').then(m => ({ default: m.DocumentHubWorkspace })));
const DesmosWorkspace = lazy(() => import('./components/workspaces/DesmosWorkspace').then(m => ({ default: m.DesmosWorkspace })));
const GeoGebraWorkspace = lazy(() => import('./components/workspaces/GeoGebraWorkspace').then(m => ({ default: m.GeoGebraWorkspace })));
const ExcalidrawWorkspace = lazy(() => import('./components/workspaces/ExcalidrawWorkspace').then(m => ({ default: m.ExcalidrawWorkspace })));
const PhETWorkspace = lazy(() => import('./components/workspaces/PhETWorkspace').then(m => ({ default: m.PhETWorkspace })));
const MermaidWorkspace = lazy(() => import('./components/workspaces/MermaidWorkspace').then(m => ({ default: m.MermaidWorkspace })));
const WolframWorkspace = lazy(() => import('./components/workspaces/WolframWorkspace').then(m => ({ default: m.WolframWorkspace })));
const RubricCheckerWorkspace = lazy(() => import('./components/workspaces/RubricCheckerWorkspace').then(m => ({ default: m.RubricCheckerWorkspace })));
const FeynmanWorkspace = lazy(() => import('./components/workspaces/FeynmanWorkspace').then(m => ({ default: m.FeynmanWorkspace })));
const PhotoMathWorkspace = lazy(() => import('./components/workspaces/PhotoMathWorkspace').then(m => ({ default: m.PhotoMathWorkspace })));
const PdfReaderWorkspace = lazy(() => import('./components/workspaces/PdfReaderWorkspace').then(m => ({ default: m.PdfReaderWorkspace })));
const QuizGeneratorWorkspace = lazy(() => import('./components/workspaces/QuizGeneratorWorkspace').then(m => ({ default: m.QuizGeneratorWorkspace })));
const PomodoroWorkspace = lazy(() => import('./components/workspaces/PomodoroWorkspace').then(m => ({ default: m.PomodoroWorkspace })));
const PeriodicTableWorkspace = lazy(() => import('./components/workspaces/PeriodicTableWorkspace').then(m => ({ default: m.PeriodicTableWorkspace })));
const UnitConverterWorkspace = lazy(() => import('./components/workspaces/UnitConverterWorkspace').then(m => ({ default: m.UnitConverterWorkspace })));
const ArxivWorkspace = lazy(() => import('./components/workspaces/ArxivWorkspace').then(m => ({ default: m.ArxivWorkspace })));
const OpenLibraryWorkspace = lazy(() => import('./components/workspaces/OpenLibraryWorkspace').then(m => ({ default: m.OpenLibraryWorkspace })));
const CitationVaultWorkspace = lazy(() => import('./components/workspaces/CitationVaultWorkspace').then(m => ({ default: m.CitationVaultWorkspace })));
const TimetableWorkspace = lazy(() => import('./components/workspaces/TimetableWorkspace').then(m => ({ default: m.TimetableWorkspace })));
const ScholarshipTrackerWorkspace = lazy(() => import('./components/workspaces/ScholarshipTrackerWorkspace').then(m => ({ default: m.ScholarshipTrackerWorkspace })));
const GroupProjectWorkspace = lazy(() => import('./components/workspaces/GroupProjectWorkspace').then(m => ({ default: m.GroupProjectWorkspace })));
const PeerQAWorkspace = lazy(() => import('./components/workspaces/PeerQAWorkspace').then(m => ({ default: m.PeerQAWorkspace })));
const NotionImportWorkspace = lazy(() => import('./components/workspaces/NotionImportWorkspace').then(m => ({ default: m.NotionImportWorkspace })));
const DeadlineGanttWorkspace = lazy(() => import('./components/workspaces/DeadlineGanttWorkspace').then(m => ({ default: m.DeadlineGanttWorkspace })));
const GradeForecasterWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.GradeForecasterWorkspace })));
const ExamModeWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.ExamModeWorkspace })));
const InternshipTrackerWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.InternshipTrackerWorkspace })));
const BudgetWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.BudgetWorkspace })));
const HabitSleepWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.HabitSleepWorkspace })));
const TimetableOptimizerWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.TimetableOptimizerWorkspace })));
const CodeRunnerWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.CodeRunnerWorkspace })));
const ResumeBuilderWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.ResumeBuilderWorkspace })));
const PresentationCoachWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.PresentationCoachWorkspace })));
const LabReportWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.LabReportWorkspace })));
const EssayOutlinerWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.EssayOutlinerWorkspace })));
const ImageOcclusionWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.ImageOcclusionWorkspace })));
const FSRSSchedulerInfo = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.FSRSSchedulerInfo })));
const VivaWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.VivaWorkspace })));
const LanguageLabWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.LanguageLabWorkspace })));
const ZoteroImportWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.ZoteroImportWorkspace })));
const PaperChatWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.PaperChatWorkspace })));
const DatasetFinderWorkspace = lazy(() => import('./components/workspaces/NewAppsWorkspaces').then(m => ({ default: m.DatasetFinderWorkspace })));
const StudyRoomPanel = lazy(() => import('./components/collab').then(m => ({ default: m.StudyRoomPanel })));
const TeacherShareView = lazy(() => import('./components/collab').then(m => ({ default: m.TeacherShareView })));
const LectureCopilot = lazy(() => import('./components/collab').then(m => ({ default: m.LectureCopilot })));
const ApiDocsPanel = lazy(() => import('./components/collab').then(m => ({ default: m.ApiDocsPanel })));
const ExtensionHelper = lazy(() => import('./components/collab').then(m => ({ default: m.ExtensionHelper })));
const WikipediaLookupModal = lazy(() => import('./components/WikipediaLookupModal').then(m => ({ default: m.WikipediaLookupModal })));
const StudyCardModal = lazy(() => import('./components/StudyCardModal').then(m => ({ default: m.StudyCardModal })));
const PortfolioExportModal = lazy(() => import('./components/PortfolioExportModal').then(m => ({ default: m.PortfolioExportModal })));
const MorningCheckInModal = lazy(() => import('./components/MorningCheckInModal').then(m => ({ default: m.MorningCheckInModal })));
const OnboardingChecklist = lazy(() => import('./components/OnboardingChecklist').then(m => ({ default: m.OnboardingChecklist })));
const SplitScreenStudio = lazy(() => import('./components/SplitScreenStudio').then(m => ({ default: m.SplitScreenStudio })));
const DailyRadarTab = lazy(() => import('./components/DailyRadarTab').then(m => ({ default: m.DailyRadarTab })));
const GmailRadarTab = lazy(() => import('./components/GmailRadarTab').then(m => ({ default: m.GmailRadarTab })));
const AssignmentTrackerTab = lazy(() => import('./components/AssignmentTrackerTab').then(m => ({ default: m.AssignmentTrackerTab })));
const CanvasSyncTab = lazy(() => import('./components/CanvasSyncTab').then(m => ({ default: m.CanvasSyncTab })));
const GoogleDriveTab = lazy(() => import('./components/GoogleDriveTab').then(m => ({ default: m.GoogleDriveTab })));
const NotebookLMStudioTab = lazy(() => import('./components/NotebookLMStudioTab').then(m => ({ default: m.NotebookLMStudioTab })));
const FlashcardStudioTab = lazy(() => import('./components/FlashcardStudioTab').then(m => ({ default: m.FlashcardStudioTab })));
const CanvaStudioTab = lazy(() => import('./components/CanvaStudioTab').then(m => ({ default: m.CanvaStudioTab })));
const GoogleClassroomPanel = lazy(() => import('./components/GoogleClassroomPanel').then(m => ({ default: m.GoogleClassroomPanel })));
const MoodlePanel = lazy(() => import('./components/MoodlePanel').then(m => ({ default: m.MoodlePanel })));
import { AppStoreModal, loadPinnedAppIds, savePinnedAppIds } from './components/AppStoreModal';
import { ChangelogModal, CURRENT_VERSION } from './components/ChangelogModal';
const StudyPlanGeneratorModal = lazy(() => import('./components/StudyPlanGeneratorModal').then(m => ({ default: m.StudyPlanGeneratorModal })));
const InteractiveIntroModal = lazy(() => import('./components/InteractiveIntroModal').then(m => ({ default: m.InteractiveIntroModal })));
import { LandingPage } from './components/LandingPage';
const QuickDraftModal = lazy(() => import('./components/QuickDraftModal').then(m => ({ default: m.QuickDraftModal })));
const ScheduleStudyModal = lazy(() => import('./components/ScheduleStudyModal').then(m => ({ default: m.ScheduleStudyModal })));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const StudyAssistantChat = lazy(() => import('./components/StudyAssistantChat').then(m => ({ default: m.StudyAssistantChat })));
const AccountSettingsModal = lazy(() => import('./components/AccountSettingsModal').then(m => ({ default: m.AccountSettingsModal })));
import { ShortcutSettings, defaultShortcutSettings } from './components/AccountSettingsModal';
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));
const DeploymentModal = lazy(() => import('./components/DeploymentModal').then(m => ({ default: m.DeploymentModal })));
const OAuthGuideModal = lazy(() => import('./components/OAuthGuideModal').then(m => ({ default: m.OAuthGuideModal })));
const ApiActivationModal = lazy(() => import('./components/ApiActivationModal').then(m => ({ default: m.ApiActivationModal })));
const GeminiSettingsModal = lazy(() => import('./components/GeminiSettingsModal').then(m => ({ default: m.GeminiSettingsModal })));
const AiAcademicSuiteModal = lazy(() => import('./components/AiAcademicSuiteModal').then(m => ({ default: m.AiAcademicSuiteModal })));
const GoogleSyncHubModal = lazy(() => import('./components/GoogleSyncHubModal').then(m => ({ default: m.GoogleSyncHubModal })));
import { ToastContainer } from './components/Toast';
import confetti from 'canvas-confetti';
import { WorkspaceId, AgentAction } from './types';
import { loadSRSDecks, saveSRSDecks, createNewSRSCard, SRSDeck } from './services/srsEngine';
import { usePomodoroStore } from './stores/pomodoroStore';
import { trackEvent } from './services/analytics';
import { db } from './services/db';

import {
  signInWithGoogle,
  signInWithGoogleBasic,
  OAuthTestUserRequiredError,
  signOutUser,
  onAuthStateChangedListener,
  getStoredGoogleToken,
  getValidGoogleToken,
  needsGoogleReconnect,
  hasActiveGoogleWorkspaceToken,
  clearStoredGoogleToken,
} from './services/firebase';
import {
  fetchTodayCalendarEvents,
  insertCalendarEvent,
  fetchAcademicEmails,
  FetchEmailOptions,
  createGmailDraft,
  getOrCreateMasterSheet,
  fetchSheetAssignments,
  appendAssignmentToSheet,
  updateAssignmentInSheet,
  syncAllAssignmentsToSheet,
  fetchRecentSchoolFiles,
  shareGoogleDriveFile,
} from './services/googleWorkspace';
import { fetchAllClassroomAssignments } from './services/googleClassroom';
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
  PriorityLevel,
  ApiEnablementInfo,
} from './types';
import { sanitizeAssignments, sanitizeCanvasAssignments, sanitizeEmailAlerts, sanitizeRawEmails } from './utils/sanitize';

const LOCAL_ASSIGNMENTS_KEY = 'scc_user_assignments_v2';
const LOCAL_EMAIL_ALERTS_KEY = 'scc_cached_email_alerts_v2';
const LOCAL_RAW_EMAILS_KEY = 'scc_cached_raw_emails_v2';

function loadSavedAssignments(): Assignment[] {
  try {
    const saved = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Sanitize: legacy/corrupt entries with missing fields used to crash setState updaters (white screen)
      if (Array.isArray(parsed)) return sanitizeAssignments(parsed);
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

function loadSavedEmailAlerts(): EmailAlert[] {
  try {
    const saved = localStorage.getItem(LOCAL_EMAIL_ALERTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return sanitizeEmailAlerts(parsed);
    }
  } catch (e) {
    console.error('Error loading cached email alerts:', e);
  }
  return [];
}

function loadSavedRawEmails(): EmailMessage[] {
  try {
    const saved = localStorage.getItem(LOCAL_RAW_EMAILS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return sanitizeRawEmails(parsed);
    }
  } catch (e) {
    console.error('Error loading cached raw emails:', e);
  }
  return [];
}

function saveEmailAlerts(list: EmailAlert[]) {
  try {
    localStorage.setItem(LOCAL_EMAIL_ALERTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving cached email alerts:', e);
  }
}

function saveRawEmails(list: EmailMessage[]) {
  try {
    localStorage.setItem(LOCAL_RAW_EMAILS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving cached raw emails:', e);
  }
}

export default function App() {
  // Theme state — unified via src/services/theme.ts (single source)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scc_theme');
      if (saved) return saved === 'dark';
      const dataTheme = document.documentElement.getAttribute('data-theme');
      // User requirement: Light is default when signing up
      return false;
    } catch { return false; }
  });

  useEffect(() => {
    // unified via theme service
    syncDarkToTheme(darkMode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#1A1917' : '#D97757');
    try {
      const cur = localStorage.getItem('scc_color_theme_v1');
      if (!cur || cur==='parchment') {
        const next = darkMode ? 'midnight' : 'linen';
        if (!cur) {
          localStorage.setItem('scc_color_theme_v1', next);
          document.documentElement.setAttribute('data-theme', next);
        }
      }
    } catch {}
  }, [darkMode]);

  // Initialize Density & Palette Theme attributes via theme service
  useEffect(() => {
    initTheme();
    try {
      const savedDensity = localStorage.getItem('scc_ui_density_v1') || 'comfortable';
      document.documentElement.setAttribute('data-density', savedDensity);
      const autoSystem = localStorage.getItem('scc_auto_system_theme_v1') === 'true';
      if (autoSystem) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(isDark);
      }
    } catch (e) {
      console.error('Theme init error:', e);
    }
  }, []);

  // (Removed navClock/navDate — menu bar decluttered per user request)

  // PWA install prompt + beforeinstallprompt handling — now renders Install banner
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [installDismissedUntil, setInstallDismissedUntil] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('scc_install_dismissed_until')||'0',10); } catch { return 0; }
  });
  useEffect(() => {
    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      if (Date.now() < installDismissedUntil) return;
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    const onAppInstalled = () => { setShowInstallBtn(false); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onAppInstalled); };
  }, [installDismissedUntil]);

  const handleInstallPwa = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') trackEvent('pwa_install_accepted');
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    } catch {}
  }, [deferredPrompt]);

  const handleDismissPwa = useCallback(() => {
    const until = Date.now() + 7 * 86400000;
    try { localStorage.setItem('scc_install_dismissed_until', String(until)); } catch {}
    setInstallDismissedUntil(until);
    setShowInstallBtn(false);
  }, []);

  // Dexie migration single source — storage sprawl fix
  useEffect(() => {
    (async () => {
      try {
        const { migrateLocalStorageToDexie } = await import('./services/db');
        await migrateLocalStorageToDexie();
      } catch {}
    })();
  }, []);

  // Auth & User
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 5-Workspace Student OS Active Workspace
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(() => {
    try {
      const saved = localStorage.getItem('scc_active_workspace_v1');
      return (saved as WorkspaceId) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const handleWorkspaceTransition = useCallback((newWorkspace: WorkspaceId) => {
    setAiChatOpen(false);
    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setActiveWorkspace(newWorkspace);
      });
    } else {
      setActiveWorkspace(newWorkspace);
    }
    try {
      localStorage.setItem('scc_active_workspace_v1', newWorkspace);
    } catch {}
  }, []);

  // Active Tab - Dashboard Home is default entry point
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [aiSuiteOpen, setAiSuiteOpen] = useState(false);
  const [aiSuiteTab, setAiSuiteTab] = useState<'planner' | 'syllabus' | 'quiz' | 'grades'>('planner');
  const [clearedTabBadges, setClearedTabBadges] = useState<Set<string>>(new Set());
  const [isWikipediaModalOpen, setIsWikipediaModalOpen] = useState(false);
  const [wikipediaInitialQuery, setWikipediaInitialQuery] = useState('');
  const [isStudyCardOpen, setIsStudyCardOpen] = useState(false);
  const [isPortfolioExportOpen, setIsPortfolioExportOpen] = useState(false);
  const [isMorningCheckInOpen, setIsMorningCheckInOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isStudyPlanOpen, setIsStudyPlanOpen] = useState(false);
  const [isIntroTourOpen, setIsIntroTourOpen] = useState(false);
  const [showChangelogDot, setShowChangelogDot] = useState(false);
  const onboardingDialogRef = useRef<HTMLDialogElement | null>(null);

  // Dynamic title for SEO per workspace — MUST be after activeTab declaration to avoid TDZ
  useEffect(() => {
    const labelMap: Record<string,string> = { dashboard:'Dashboard', canvas:'Canvas LMS', radar:'Daily Schedule', tracker:'Assignment Tracker', gmail:'Gmail AI', drive:'Google Drive', splitscreen:'Split Screen' };
    const label = labelMap[activeTab] || activeTab || 'Dashboard';
    document.title = `StudentOS — ${label} | Canvas + Workspace Academic OS`;
  }, [activeTab]);

  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem('scc_tour_seen_v2');
      if (tourSeen !== 'true') {
        setIsIntroTourOpen(true);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const lastCheckIn = localStorage.getItem('scc_last_morning_checkin');
      if (lastCheckIn !== todayStr) {
        setIsMorningCheckInOpen(true);
      }
      
      // Changelog: show dot not modal — user clicks What's New dot to open
      const lastSeenVersion = localStorage.getItem('scc_last_seen_version');
      if (lastSeenVersion !== CURRENT_VERSION) {
        setShowChangelogDot(true);
      }
    } catch (e) {
      console.error('Error checking morning checkin and version seen:', e);
    }
  }, []);

  const handleSaveMorningIntention = (intention: string, targetHours: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('scc_last_morning_checkin', todayStr);
    localStorage.setItem('scc_daily_intention', intention);
    localStorage.setItem('scc_target_focus_hours', String(targetHours));
    // streak + confetti on 7-day
    try {
      const raw = localStorage.getItem('scc_streak_history');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(todayStr)) { arr.push(todayStr); localStorage.setItem('scc_streak_history', JSON.stringify(arr.slice(-30))); }
      if (arr.length % 7 === 0 && arr.length>0 && typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#D97757','#10b981','#7C3AED'] });
      }
    } catch {}
    addToast({
      type: 'success',
      title: 'Daily Intention Set',
      message: `Locked in ${targetHours}h deep work target for today.`,
    });
  };

  // Smooth View Transitions for workspace switching — now unified with workspaceStore + recent + usage tracking
  const handleTabTransition = useCallback((newTab: string) => {
    // Legacy mapping: academic workspace no longer exists (now Pinned)
    if (newTab === 'academic') newTab = 'canvas';
    if (newTab === 'ws-academic') newTab = 'canvas';
    if (newTab === 'ai-suite') {
      setAiSuiteTab('planner');
      setAiSuiteOpen(true);
      return;
    }

    setClearedTabBadges((prev) => new Set(prev).add(newTab));
    setAiChatOpen(false);

    // IA: Recent:3 + Most Used tracking for dynamic Top8
    try {
      const recentRaw = localStorage.getItem('scc_recent_tabs_v1');
      const recent: string[] = recentRaw ? JSON.parse(recentRaw) : [];
      const nextRecent = [newTab, ...recent.filter((x:string)=> x!==newTab)].slice(0,10);
      localStorage.setItem('scc_recent_tabs_v1', JSON.stringify(nextRecent));
      const usageRaw = localStorage.getItem('scc_app_usage_v1');
      const usage: Record<string, number> = usageRaw ? JSON.parse(usageRaw) : {};
      usage[newTab] = (usage[newTab]||0)+1;
      localStorage.setItem('scc_app_usage_v1', JSON.stringify(usage));
      // also sync to workspaceStore for single source of truth
      try { localStorage.setItem('scc_active_workspace_v1', newTab); } catch {}
    } catch {}
    try { trackEvent('command_executed', { command: newTab }); } catch {}

    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      try {
        (document as any).startViewTransition(() => {
          setActiveTab(newTab);
        });
      } catch {
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  }, []);

  // Breadcrumb navigation — StudentOS click → dashboard
  useEffect(() => {
    const onNav = (e: any) => { if (e.detail === 'dashboard') handleTabTransition('dashboard'); };
    window.addEventListener('scc-navigate' as any, onNav);
    return () => window.removeEventListener('scc-navigate' as any, onNav);
  }, [handleTabTransition]);

  // Confetti respects reduced motion already handled at trigger; also add global check

  // Real Data State (Zero Fake Data)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlert[]>(loadSavedEmailAlerts);
  const [rawEmails, setRawEmails] = useState<EmailMessage[]>(loadSavedRawEmails);
  const rawEmailsRef = useRef(rawEmails);
  rawEmailsRef.current = rawEmails;
  const emailAlertsRef = useRef(emailAlerts);
  emailAlertsRef.current = emailAlerts;
  const [assignments, setAssignments] = useState<Assignment[]>(loadSavedAssignments());
  const [recentFiles, setRecentFiles] = useState<SchoolFile[]>([]);
  const [canvasAssignments, setCanvasAssignments] = useState<CanvasAssignment[]>([]);
  const [classroomAssignments, setClassroomAssignments] = useState<CanvasAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('scc_cached_classroom_assignments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    if (mobileNavOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  // App Store & Pinned Tools State
  const [appStoreOpen, setAppStoreOpen] = useState(false);
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(loadPinnedAppIds);

  const handleTogglePinApp = useCallback((appId: string) => {
    setPinnedAppIds((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      savePinnedAppIds(next);
      return next;
    });
  }, []);

  const handleUnpinApp = useCallback((appId: string) => {
    setPinnedAppIds((prev) => {
      const next = prev.filter((id) => id !== appId);
      savePinnedAppIds(next);
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
      if (reducedMotion) document.documentElement.classList.add('reduce-motion');
      else document.documentElement.classList.remove('reduce-motion');
      document.documentElement.style.setProperty('--motion-reduce', reducedMotion ? '1' : '0');
    } catch {}
  }, [reducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem('scc_high_contrast', String(highContrast));
      if (highContrast) document.documentElement.classList.add('high-contrast');
      else document.documentElement.classList.remove('high-contrast');
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

  // Zen Focus: opt-in fullscreen (respects user preference, iOS-safe, Esc to exit)
  useEffect(() => {
    const prefersFullscreen = (() => { try { return localStorage.getItem('scc_zen_auto_fullscreen') === 'true'; } catch { return false; } })();
    if (!prefersFullscreen) return;
    // Guard iOS where requestFullscreen may fail
    if (zenFocusMode) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  }, [zenFocusMode]);

  // Badge counts — extracted to reusable hook (no duplicated parsing)
  const { canvasUnfinished: canvasUnfinishedCount, urgentEmail: urgentEmailCount, pendingAssignment: pendingAssignmentCount, flashcardDue: flashcardDueCount } = useBadgeCounts(canvasAssignments, assignments, emailAlerts);

  // Error States
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  // True when the stored Google token exists but is past its ~55 min TTL.
  // Google gives web clients no refresh token, so sync must pause and ask for
  // a 1-click reconnect instead of firing 401s that look like "sync is broken".
  const [googleSessionExpired, setGoogleSessionExpired] = useState(false);

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

  interface NotificationItem { id: string; tier: 'urgent' | 'updates' | 'activity'; title: string; description: string; link: string; source: string; }
  // Dynamic Aggregated Notification Center Model — strictly typed & null safe
  const notifications: NotificationItem[] = React.useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();

    // 1. Urgent Tiers (Deadlines in 24h, Grades posted)
    (canvasAssignments || []).forEach((c) => {
      if (!c) return;
      // Due in 24h
      if (c.dueAt && !c.isCompleted) {
        try {
          const dueIso = c.dueAt.includes('T') ? c.dueAt : `${c.dueAt}T23:59:59`;
          const dueTime = new Date(dueIso).getTime();
          if (!isNaN(dueTime)) {
            const diff = dueTime - now.getTime();
            if (diff > 0 && diff < 86400000) {
              list.push({
                id: `urgent-due-${c.id}`,
                tier: 'urgent',
                title: `Deadline: ${c.name || 'Assignment'} is due soon!`,
                description: `Subject: ${c.courseName || 'Course'} • Due in ${Math.round(diff / 3600000)} hours.`,
                link: c.htmlUrl || '#',
                source: 'Canvas',
              });
            }
          }
        } catch {}
      }

      // Grade Posted Feedback mapping directly back to commented Google Doc anchor locations
      const cName = (c.name || '').toLowerCase().trim();
      if (cName) {
        const matchingSheet = (assignments || []).find(
          (s) => s && (s.assignmentName || '').toLowerCase().trim() === cName
        );
        if (c.isCompleted && matchingSheet?.docUrl) {
          list.push({
            id: `urgent-grade-${c.id}`,
            tier: 'urgent',
            title: `Grade Posted: ${c.name || 'Assignment'}`,
            description: `Score details parsed. Click to open and read feedback directly in your Google Doc.`,
            link: matchingSheet.docUrl,
            source: 'Google Doc',
          });
        }
      }
    });

    // 2. Updates Tier (Announcements / Slide changes)
    (canvasAssignments || []).filter(c => c && c.isInformational).forEach((c) => {
      list.push({
        id: `update-announcement-${c.id}`,
        tier: 'updates',
        title: `Announcement: ${c.name || 'Course Update'}`,
        description: `Course post published in ${c.courseName || 'Canvas'}.`,
        link: c.htmlUrl || '#',
        source: 'Canvas',
      });
    });

    // Google Drive files modified in last 24h
    (recentFiles || []).slice(0, 5).forEach((f) => {
      if (!f) return;
      list.push({
        id: `update-file-${f.id}`,
        tier: 'updates',
        title: `Updated File: ${f.name || 'Drive File'}`,
        description: `Modified recently in your Google Drive.`,
        link: f.webViewLink || '#',
        source: 'Google Drive',
      });
    });

    // 3. Activity Tier (Discussion replies) — gated behind isDemoMode
    if (isDemoMode) {
      list.push({
        id: 'activity-discussion-demo',
        tier: 'activity',
        title: '[Demo] Discussion Reply: Peer feedback in AP Chemistry Group',
        description: 'Minh Nguyen replied to your comment on Lab 3 topic.',
        link: '#',
        source: 'Canvas',
      });
    }

    return list;
  }, [canvasAssignments, recentFiles, assignments, isDemoMode]);

  // Modals & Panels
  const [quickDraftModalOpen, setQuickDraftModalOpen] = useState(false);
  const [geminiSettingsOpen, setGeminiSettingsOpen] = useState(false);
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
  const [googleSyncHubOpen, setGoogleSyncHubOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Persistent error toasts (and duration: 0) stay until dismissed or retried
    if ((toast as any).persistent === true || toast.duration === 0) return;
    const timeout = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Deep-link ?demo=1 → Enable demo mode; Share target handling
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1') {
        setIsDemoMode(true);
        addToast({ type: 'info', title: 'Demo Mode enabled', message: 'Exploring with sample Canvas + emails + files' });
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (params.get('share-target') === '1') {
        const title = params.get('title') || '';
        const text = params.get('text') || '';
        const url = params.get('url') || '';
        const isPdf = url.toLowerCase().endsWith('.pdf') || title.toLowerCase().endsWith('.pdf');
        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url) || /\.(png|jpe?g|gif|webp)$/i.test(title);
        if (isPdf || isImage) {
          try { localStorage.setItem('scc_shared_file_url', url || text); } catch {}
          setTimeout(() => {
            handleTabTransition('pdf-reader');
            addToast({ type: 'info', title: 'Shared file opened', message: isPdf ? 'PDF opened in Reader' : 'Image shared' });
          }, 500);
        } else {
          const name = title || text.slice(0, 80) || url || 'Shared note';
          const assignmentName = name.slice(0, 120);
          const notes = [text, url].filter(Boolean).join('\n');
          setTimeout(() => {
            setAssignments(prev => [...prev, { id: `share-${Date.now()}`, assignmentName, subject: 'General', dueDate: new Date(Date.now()+86400000*3).toISOString().split('T')[0], priority: 'Med', status: 'Not Started', source: 'Manual', notes }]);
            addToast({ type: 'success', title: 'Shared content saved', message: `Created task from share: "${assignmentName}"` });
          }, 800);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
      // also handle file share via POST (if service worker forwards)
      if (params.get('fileShared') === '1') {
        handleTabTransition('pdf-reader');
      }
    } catch {}
  }, [addToast]);

  // Offline queue retry with exponential backoff via Dexie + navigator.onLine + Background Sync
  useEffect(() => {
    const retryQueue = async () => {
      if (!navigator.onLine) return;
      try {
        const queued = await db.assignmentsQueue.toArray();
        if (!queued.length) return;
        const token = getStoredGoogleToken();
        if (!token || !masterSheetId) return;
        for (const item of queued) {
          try {
            const anyItem: any = item;
            if (anyItem._op === 'update' && anyItem.sheetRowIndex) {
              await updateAssignmentInSheet(token, masterSheetId, anyItem.sheetRowIndex, anyItem);
            } else if (anyItem._op === 'delete' && anyItem.sheetRowIndex) {
              // delete not yet implemented on server — fallback to syncAll
              await syncAllAssignmentsToSheet(token, masterSheetId, assignments);
            } else {
              await appendAssignmentToSheet(token, masterSheetId, item);
            }
            await db.assignmentsQueue.delete(item.id);
          } catch (e) { console.warn('Queue retry failed', e); }
        }
      } catch {}
    };
    window.addEventListener('online', retryQueue);
    // Background Sync API if available
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in (window as any)) {
        navigator.serviceWorker.ready.then((reg: any) => {
          if (reg.sync) reg.sync.register('scc-queue-sync').catch(()=>{});
        });
      }
    } catch {}
    const onSyncMessage = (e: MessageEvent) => { if ((e.data as any)?.type === 'SYNC_QUEUE') retryQueue(); };
    navigator.serviceWorker?.addEventListener('message', onSyncMessage as any);
    const iv = setInterval(retryQueue, 30000);
    return () => { window.removeEventListener('online', retryQueue); navigator.serviceWorker?.removeEventListener('message', onSyncMessage as any); clearInterval(iv); };
  }, [masterSheetId, assignments]);

  const handleExecuteAgentAction = useCallback((action: AgentAction) => {
    switch (action.type) {
      case 'setWorkspaceLayout': {
        const splitConfig = {
          leftTool: action.payload.leftPane,
          rightTool: action.payload.rightPane,
          ratio: action.payload.ratio || '50/50',
          activeFullscreenPane: null,
        };
        try {
          localStorage.setItem('scc_splitscreen_config_v1', JSON.stringify(splitConfig));
        } catch {}
        handleWorkspaceTransition('splitscreen');
        break;
      }

      case 'injectDesmosEquation': {
        handleWorkspaceTransition('stem');
        addToast({
          type: 'success',
          title: 'Equations Injected',
          message: `Desmos ready with ${action.payload.expressions.length} equations plotted!`,
        });
        break;
      }

      case 'createCalendarMilestones': {
        const newEvents: Assignment[] = action.payload.events.map((evt, i) => ({
          id: `milestone-${Date.now()}-${i}`,
          assignmentName: evt.title,
          subject: 'Academic Milestone',
          dueDate: evt.date,
          status: 'Not Started',
          weight: evt.weight || 10,
          source: 'Manual',
          priority: 'High',
          notes: `Scheduled by StudentOS Agent (${evt.type})`,
        }));
        setAssignments((prev) => [...prev, ...newEvents]);
        addToast({
          type: 'success',
          title: 'Milestones Scheduled',
          message: `Created ${newEvents.length} calendar study milestones!`,
        });
        break;
      }

      case 'createSRSDeck': {
        const currentDecks = loadSRSDecks();
        const newDeck: SRSDeck = {
          id: `deck-${Date.now()}`,
          title: action.payload.deckTitle,
          subject: action.payload.subject || 'General',
          createdAt: new Date().toLocaleDateString(),
          updatedAt: new Date().toLocaleDateString(),
          cards: action.payload.cards.map((c) =>
            createNewSRSCard({ front: c.front, back: c.back, tags: c.tags })
          ),
        };
        saveSRSDecks([newDeck, ...currentDecks]);
        handleWorkspaceTransition('retention');
        addToast({
          type: 'success',
          title: 'SRS Deck Created',
          message: `Created "${action.payload.deckTitle}" with ${action.payload.cards.length} cards!`,
        });
        break;
      }

      case 'generateMermaidDiagram': {
        handleWorkspaceTransition('creation');
        addToast({
          type: 'info',
          title: 'Diagram Synthesized',
          message: `Rendered "${action.payload.title}" in Visual Studio!`,
        });
        break;
      }
    }
  }, [handleWorkspaceTransition, addToast]);

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

  // Listen to Auth State + onboarding post-login trigger (fixes onboarding not triggered after login)
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
        // onboarding: if never seen, show tour after login
        try {
          const tourSeen = localStorage.getItem('scc_tour_seen_v2');
          if (tourSeen !== 'true') setTimeout(() => setIsIntroTourOpen(true), 1200);
        } catch {}
      } else if (currentUser) {
        try {
          const tourSeen = localStorage.getItem('scc_tour_seen_v2');
          if (tourSeen !== 'true') setTimeout(() => setIsIntroTourOpen(true), 1500);
        } catch {}
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
      setGoogleSessionExpired(false);
    } catch (err: any) {
      console.error('Calendar fetch error:', err);
      const is401 = err?.status === 401 || /401|expired/i.test(err?.message || '');
      if (is401) {
        setGoogleSessionExpired(true);
        setCalendarError('Google session expired. Reconnect to resume Calendar sync — your events are kept.');
        if (!isSilent) {
          addToast({
            type: 'warning',
            title: 'Google session expired',
            message: 'Your sign-in expired after ~1 hour. One click reconnects — nothing is lost.',
            retryLabel: 'Reconnect now',
            persistent: true,
            reconnectGoogle: true,
          } as any);
        }
      } else {
        if (err?.isServiceDisabled) {
          setCalendarApiInfo({
            serviceName: err.serviceName || 'Google Calendar API',
            serviceId: err.serviceId || 'calendar-json.googleapis.com',
            activationUrl: err.activationUrl,
            projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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
      }
    } finally {
      if (!isSilent) setIsLoadingEvents(false);
    }
  }, [addToast]);

  // Fetch Academic Emails & Summarize with Gemini
  const loadEmailsAndAlerts = useCallback(async (isSilent = false, forceResort = false, options?: FetchEmailOptions) => {
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
      const emails = await fetchAcademicEmails(token, options);
      setEmailError(null);
      setGmailApiInfo(null);

      // Check if emails match cached emails (same IDs in same order)
      const currentRaw = rawEmailsRef.current;
      const currentAlerts = emailAlertsRef.current;
      const isSameSet =
        !forceResort &&
        currentRaw.length > 0 &&
        currentRaw.length === emails.length &&
        currentRaw.every((re, i) => re.id === emails[i]?.id);

      if (isSameSet && currentAlerts.length > 0) {
        // Cached classification is valid and up to date! Do not re-call Gemini!
        setRawEmails(sanitizeRawEmails(emails));
        return;
      }

      setRawEmails(sanitizeRawEmails(emails));
      saveRawEmails(sanitizeRawEmails(emails));

      if (emails.length > 0) {
        let alerts: EmailAlert[] = [];
        try {
          alerts = await summarizeEmailsWithGemini(emails);
        } catch (geminiErr) {
          console.warn('Gemini email summarizer unavailable, using rule-based classification:', geminiErr);
          alerts = emails.map((msg, idx) => {
            const text = `${msg.subject} ${msg.snippet}`.toLowerCase();
            const isExam = text.includes('exam') || text.includes('midterm') || text.includes('final') || text.includes('quiz') || text.includes('kiểm tra');
            const isDue = text.includes('due') || text.includes('assignment') || text.includes('homework') || text.includes('submit') || text.includes('deadline') || text.includes('hạn');
            const isSpam = text.includes('unsubscribe') || text.includes('newsletter') || text.includes('promo') || text.includes('discount');
            const isUrgent = isExam || isDue || text.includes('urgent') || text.includes('important');
            const summary = msg.snippet ? (msg.snippet.slice(0, 160) + (msg.snippet.length > 160 ? '...' : '')) : msg.subject;

            return {
              id: `alert-${msg.id || idx}`,
              sender: msg.sender,
              subject: msg.subject,
              oneLineSummary: summary,
              urgency: isUrgent ? ('HIGH' as const) : ('MEDIUM' as const),
              category: isExam ? ('EXAM' as const) : isDue ? ('ASSIGNMENT' as const) : isSpam ? ('ANNOUNCEMENT' as const) : ('GENERAL' as const),
              isSpam,
              detectedAssignment: isDue || isExam ? {
                isAssignment: true,
                name: msg.subject,
                subject: 'Coursework',
                dueDate: msg.date || 'Upcoming',
                priority: 'Med' as const,
              } : undefined,
              rawEmail: msg,
            };
          });
        }
        setEmailAlerts(sanitizeEmailAlerts(alerts));
        saveEmailAlerts(sanitizeEmailAlerts(alerts));
      } else {
        setEmailAlerts([]);
        try {
          localStorage.removeItem(LOCAL_EMAIL_ALERTS_KEY);
        } catch {}
      }
    } catch (err: any) {
      console.error('Email fetch error:', err);
      if (err?.isServiceDisabled) {
        setGmailApiInfo({
          serviceName: err.serviceName || 'Gmail API',
          serviceId: err.serviceId || 'gmail.googleapis.com',
          activationUrl: err.activationUrl,
          projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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
        // Merge not replace: preserve manual tasks not in sheet, handle conflict via updatedAt + toast.
        // All key access is null-safe: one malformed row must never crash the updater (white screen).
        const safeItems = sanitizeAssignments(items);
        let conflictCount = 0;
        const nameKey = (v: any): string => String(v?.assignmentName ?? '').toLowerCase().trim();
        setAssignments(prev => {
          const safePrev = sanitizeAssignments(prev);
          if (!safePrev.length) return safeItems;
          const sheetIds = new Set(safeItems.map((x: any) => x.id));
          const sheetNames = new Set(safeItems.map(nameKey));
          const manualOnly = safePrev.filter(p => !sheetIds.has(p.id) && !sheetNames.has(nameKey(p)));
          // conflict detection: same name but different updatedAt
          const overlapping = safePrev.filter(p => sheetNames.has(nameKey(p)));
          overlapping.forEach(p => {
            const matched = safeItems.find((s: any) => nameKey(s) === nameKey(p));
            if (matched && p.updatedAt && (matched as any).updatedAt && p.updatedAt !== (matched as any).updatedAt) conflictCount++;
          });
          const merged = [...safeItems];
          if (safeItems.length === 0 && manualOnly.length) return safePrev;
          return [...merged, ...manualOnly];
        });
        if (conflictCount>0) setTimeout(()=> addToast({ type: 'warning', title: 'Resolve conflict', message: `${conflictCount} assignments had concurrent edits — last write wins. Review Tracker.` }), 500);
      } else if (items && items.length === 0) {
        // sheet empty -> do NOT overwrite existing manual tasks
        console.warn('Sheet empty, preserving local assignments');
      }
      setSheetError(null);
      setSheetApiInfo(null);
      setGoogleSessionExpired(false);
    } catch (err: any) {
      console.error('Sheet fetch error:', err);
      const is401 = err?.status === 401 || /401|expired/i.test(err?.message || '');
      if (is401) {
        setGoogleSessionExpired(true);
        setSheetError('Google session expired. Reconnect to resume Sheet sync — your tasks are kept.');
      } else {
        if (err?.isServiceDisabled) {
          setSheetApiInfo({
            serviceName: err.serviceName || 'Google Sheets API',
            serviceId: err.serviceId || 'sheets.googleapis.com',
            activationUrl: err.activationUrl,
            projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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
      setGoogleSessionExpired(false);
    } catch (err: any) {
      console.error('Drive files error:', err);
      const is401 = err?.status === 401 || /401|expired/i.test(err?.message || '');
      if (is401) {
        setGoogleSessionExpired(true);
        setDriveError('Google session expired. Reconnect to resume Drive sync — your files list is kept.');
      } else {
        const errMsg = err?.message || 'Could not fetch Google Drive files.';
        if (err?.isServiceDisabled) {
          setDriveApiInfo({
            serviceName: err.serviceName || 'Google Drive API',
            serviceId: err.serviceId || 'drive.googleapis.com',
            activationUrl: err.activationUrl,
            projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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
      }
    } finally {
      if (!isSilent) setIsLoadingFiles(false);
    }
  }, [addToast]);

  // Fetch Google Classroom coursework
  const loadClassroomData = useCallback(async (isSilent = false) => {
    const token = getStoredGoogleToken();
    if (!token) {
      setClassroomError(null);
      return;
    }

    if (!isSilent) setIsLoadingClassroom(true);
    try {
      const list = await fetchAllClassroomAssignments(token);
      setClassroomAssignments(list);
      setClassroomError(null);
      try {
        localStorage.setItem('scc_cached_classroom_assignments', JSON.stringify(list));
      } catch {}
    } catch (err: any) {
      console.error('Classroom fetch error:', err);
      const errMsg = err?.message || 'Could not fetch Google Classroom coursework.';
      setClassroomError(errMsg);
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: 'Google Classroom Sync',
          message: errMsg,
        });
      }
    } finally {
      if (!isSilent) setIsLoadingClassroom(false);
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

      // 3. Intelligent Union Merge so all courses (KHTN, Ngữ Văn, etc.) are captured.
      // Malformed items are normalized, never allowed to throw and wipe the whole sync.
      const mergedMap = new Map<string, CanvasAssignment>();
      const mergeKey = (item: any): string => String(item?.name ?? item?.title ?? 'Canvas Assignment').toLowerCase().trim();

      // Put feed items first
      for (const item of feedFetched) {
        if (!item) continue;
        mergedMap.set(mergeKey(item), item);
      }

      // Merge API items, overlaying authentic live submission states & URLs
      for (const item of apiFetched) {
        if (!item) continue;
        const key = mergeKey(item);
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
        const sName = String(sheetItem?.assignmentName ?? '').toLowerCase().trim();
        const sSub = String(sheetItem?.subject ?? '').toLowerCase().trim();

        const matchingCanvas = crossRef.find((c) => {
          const cName = String(c?.name ?? '').toLowerCase().trim();
          const cCourse = String(c?.courseName ?? '').toLowerCase().trim();

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
      // Keep previously loaded assignments so the tab never goes blank on a transient failure
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

  // Comprehensive Auto-Sync Routine — debounced + AbortController + isSyncing guard
  const syncAbortRef = useRef<AbortController | null>(null);
  const runFullSync = useCallback(
    async (isSilent = true, externalSignal?: AbortSignal) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      const abort = externalSignal ? null : new AbortController();
      const signal = externalSignal || abort?.signal;
      if (abort) syncAbortRef.current = abort;
      try {
        if (signal?.aborted) return;
        await Promise.allSettled([
          loadCanvasData(isSilent),
          loadCalendarEvents(isSilent),
          loadEmailsAndAlerts(isSilent),
          loadSheetAssignments(isSilent),
          loadRecentFiles(isSilent),
          loadClassroomData(isSilent),
        ]);
        if (!signal?.aborted) setLastSyncedAt(new Date());
      } finally {
        isSyncingRef.current = false;
        if (abort) syncAbortRef.current = null;
      }
    },
    [
      loadCanvasData,
      loadCalendarEvents,
      loadEmailsAndAlerts,
      loadSheetAssignments,
      loadRecentFiles,
      loadClassroomData,
    ]
  );

  // Debounced wrapper for visibility/focus storm protection
  const debouncedSync = useDebouncedCallback(() => { runFullSync(true); }, 1200);

  // Manual Refresh All Data Button
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      // cancel any pending debounced sync and force immediate
      syncAbortRef.current?.abort();
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

  // 1. Auto-Sync on App Startup and when User Auth resolves or changes
  useEffect(() => {
    runFullSync(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Real-Time Background Auto-Sync (every 60s, debounced)
  useEffect(() => {
    const interval = setInterval(() => debouncedSync(), 60000);
    return () => clearInterval(interval);
  }, [debouncedSync]);

  // 3. Real-Time Auto-Sync on Tab Focus / Document Visibility Change — debounced to prevent 4x firestorm
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') debouncedSync();
    };
    const handleWindowFocus = () => debouncedSync();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [debouncedSync]);

  // Re-cross reference Canvas whenever assignments change.
  // Hardened: crossReference never throws on malformed items, and the updater
  // defensively sanitizes so a bad record can never unmount the app (white screen).
  useEffect(() => {
    try {
      setCanvasAssignments((prev) => crossReferenceCanvasWithSheet(sanitizeCanvasAssignments(prev), sanitizeAssignments(assignments)));
    } catch (e) {
      console.error('Re-cross-reference failed (non-fatal):', e);
    }
  }, [assignments]);

  // Proactive Google OAuth Token Expiry Warning — fires once per expiry with a working Reconnect action
  const expiryToastShownRef = useRef(false);
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (!needsGoogleReconnect()) {
        expiryToastShownRef.current = false;
        return;
      }
      setGoogleSessionExpired(true);
      if (expiryToastShownRef.current) return;
      expiryToastShownRef.current = true;
      addToast({
        type: 'warning',
        title: 'Google Session Expiring',
        message: 'Your Google sign-in is past its ~1 hour life. Reconnect to keep sync active — nothing is lost.',
        retryLabel: 'Reconnect now',
        persistent: true,
        reconnectGoogle: true,
      });
    };

    checkTokenExpiry();
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
      setGoogleSessionExpired(false);
      expiryToastShownRef.current = false;
      // Fresh sign-in: clear stale sync errors so reconnect visibly heals every tab
      setCalendarError(null);
      setEmailError(null);
      setSheetError(null);
      setDriveError(null);
      setCanvasError(null);
      setClassroomError(null);

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

  const handleDisconnectGoogle = useCallback(() => {
    clearStoredGoogleToken();
    setCalendarEvents([]);
    setEmailAlerts([]);
    setRawEmails([]);
    setRecentFiles([]);
    setClassroomAssignments([]);
    setClassroomError(null);
    setMasterSheetId(undefined);
    setMasterSheetUrl(undefined);
    addToast({
      type: 'info',
      title: 'Google Workspace Disconnected',
      message: 'Google Workspace token cleared. You can reconnect anytime.',
    });
  }, [addToast]);

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
        setClassroomAssignments([]);
        setClassroomError(null);
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

  const handleToggleAssignmentById = async (id: string) => {
    const target = assignments.find((a) => a.id === id);
    if (!target) return;
    const nextStatus: AssignmentStatus = target.status === 'Done' ? 'Not Started' : 'Done';
    await handleUpdateStatus(target, nextStatus);
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
          projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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
          projectId: err.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '',
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

      // 4. Sync done status to Master Google Sheet tracker (null-safe name match)
      const targetName = String((assignment as any)?.name ?? '').toLowerCase().trim();
      const targetSheetItem = targetName ? assignments.find(
        (a) => {
          const aName = String(a?.assignmentName ?? '').toLowerCase().trim();
          return aName !== '' && (aName === targetName || targetName.includes(aName));
        }
      ) : undefined;

      if (targetSheetItem) {
        await handleUpdateStatus(targetSheetItem, 'Done');
      }

      // 5. Update state
      setCanvasAssignments((prev) =>
        prev.map((c) => (c.id === assignment.id ? { ...c, isCompleted: true } : c))
      );

      // Trigger celebration confetti — respect prefers-reduced-motion
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
        });
      }

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


  // Keyboard Shortcuts — includes global hotkeys (g d, g c, n, ?, cmd+k) + roving palette
  const lastGRef = useRef<number>(0);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (isTyping) { if (e.key === 'Escape') target.blur(); return; }
      // Global cmd+k always works
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCommandPaletteOpen(p => !p); return;
      }
      if (e.key === '?' ) { if (!isTyping) { setShortcutsModalOpen(true); return; } }
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); handleTabTransition('tracker'); return;
      }
      // g + {d,c,n} sequence (go dashboard/canvas/new)
      if (e.key.toLowerCase() === 'g' && !e.metaKey) { lastGRef.current = Date.now(); return; }
      if (lastGRef.current && Date.now() - lastGRef.current < 800) {
        const seq = e.key.toLowerCase();
        if (seq === 'd') { e.preventDefault(); handleTabTransition('dashboard'); lastGRef.current = 0; return; }
        if (seq === 'c') { e.preventDefault(); handleTabTransition('canvas'); lastGRef.current = 0; return; }
        if (seq === 't') { e.preventDefault(); handleTabTransition('tracker'); lastGRef.current = 0; return; }
        if (seq === 'm') { e.preventDefault(); handleTabTransition('gmail'); lastGRef.current = 0; return; }
      }
      if (!shortcutSettings.masterEnabled) {
        if (e.key === 'Escape') { if (zenFocusMode) setZenFocusMode(false); setAccountSettingsOpen(false); setAiChatOpen(false); setCommandPaletteOpen(false); }
        return;
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) setZenFocusMode(p=>!p);
      else if (e.key === '0') handleTabTransition('dashboard');
      else if (e.key === '1') handleTabTransition('canvas');
      else if (e.key === '2') handleTabTransition('radar');
      else if (e.key === '3') handleTabTransition('tracker');
      else if (e.key === '4') handleTabTransition('gmail');
      else if (e.key === '5') handleTabTransition('drive');
      else if (e.key === '6') handleTabTransition('splitscreen');
      else if ((e.key === 'r' || e.key === 'R') && shortcutSettings.keys.sync) handleRefreshAll();
      else if (e.key === '?' && shortcutSettings.keys.help) setAccountSettingsOpen(true);
      else if (e.key === 'Escape') { if (zenFocusMode) setZenFocusMode(false); setAccountSettingsOpen(false); setAiChatOpen(false); setCommandPaletteOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefreshAll, shortcutSettings, handleWorkspaceTransition, zenFocusMode]);

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

  // reducedMotion already handled via CSS prefers-reduced-motion + index.css; MotionConfig not required (motion 12 export issue avoided)
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#FAF9F5] dark:bg-[#141413] text-[#141413] dark:text-[#FAF9F5] transition-colors flex flex-col font-sans selection:bg-[#D97757] selection:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-[#1A1917] focus:border focus:rounded-xl">Skip to content</a>
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
      {/* Left Navigation Rail (Desktop + Mobile drawer) */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Mobile hamburger — visible only <768px */}
        {!zenFocusMode && activeTab !== 'dashboard' && (
          <button onClick={()=>setMobileNavOpen(v=>!v)} className="md:hidden fixed top-2 left-2 z-40 p-2 rounded-xl bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] shadow-md" aria-label="Toggle navigation" aria-expanded={mobileNavOpen}>
            <span className="text-sm font-bold">☰</span>
          </button>
        )}
        {/* Desktop sidebar */}
        {!zenFocusMode && activeTab !== 'dashboard' && (
          <div className="hidden md:flex shrink-0">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(t)=>{ handleTabTransition(t); setMobileNavOpen(false); }}
              isExpanded={isSidebarExpanded}
              onToggleExpand={toggleSidebar}
              user={user}
              onSignIn={() => handleGoogleSignIn()}
              onSignOut={handleLogout}
              onOpenSettings={() => setAccountSettingsOpen(true)}
              onOpenAppStore={() => setAppStoreOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              darkMode={darkMode}
              pinnedAppIds={pinnedAppIds}
              onUnpinApp={handleUnpinApp}
              badges={{
                canvas: clearedTabBadges.has('canvas') ? 0 : canvasUnfinishedCount,
                schedule: clearedTabBadges.has('radar') ? 0 : calendarEvents.length,
                tracker: clearedTabBadges.has('tracker') ? 0 : pendingAssignmentCount,
                gmail: clearedTabBadges.has('gmail') ? 0 : urgentEmailCount,
                flashcards: clearedTabBadges.has('flashcards') ? 0 : flashcardDueCount,
                pomodoro: 0,
              }}
            />
          </div>
        )}
        {/* Mobile drawer overlay with swipe to close + Esc */}
        {mobileNavOpen && !zenFocusMode && activeTab !== 'dashboard' && (
          <div className="md:hidden fixed inset-0 z-30 flex" onTouchStart={(e)=>{ (e.currentTarget as any)._sx = e.touches[0].clientX; }} onTouchEnd={(e)=>{ const sx=(e.currentTarget as any)._sx||0; const dx=e.changedTouches[0].clientX - sx; if(dx < -60 || dx > 60) setMobileNavOpen(false); }} onKeyDown={(e)=>{ if(e.key==='Escape') setMobileNavOpen(false); }}>
            <div className="w-64 shrink-0 bg-[#EFECE2] dark:bg-[#1A1917] border-r border-[#DFDACB] dark:border-[#2C2B27] overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(t)=>{ handleTabTransition(t); setMobileNavOpen(false); }}
                isExpanded={true}
                onToggleExpand={()=>setMobileNavOpen(false)}
                user={user}
                onSignIn={() => handleGoogleSignIn()}
                onSignOut={handleLogout}
                onOpenSettings={() => setAccountSettingsOpen(true)}
                onOpenAppStore={() => setAppStoreOpen(true)}
                onOpenShortcuts={() => setShortcutsModalOpen(true)}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                darkMode={darkMode}
                pinnedAppIds={pinnedAppIds}
                onUnpinApp={handleUnpinApp}
                badges={{
                  canvas: clearedTabBadges.has('canvas') ? 0 : canvasUnfinishedCount,
                  schedule: clearedTabBadges.has('radar') ? 0 : calendarEvents.length,
                  tracker: clearedTabBadges.has('tracker') ? 0 : pendingAssignmentCount,
                  gmail: clearedTabBadges.has('gmail') ? 0 : urgentEmailCount,
                  flashcards: clearedTabBadges.has('flashcards') ? 0 : flashcardDueCount,
                  pomodoro: 0,
                }}
              />
            </div>
            <button className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setMobileNavOpen(false)} aria-label="Close navigation" />
          </div>
        )}

        {/* Right Main Column with Top Header, Scrollable Content, and Bottom Status Bar */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF9F5] dark:bg-[#141413]">
          {/* Top Header — simplified & error-guarded */}
          {activeTab !== 'dashboard' && (
            <ErrorBoundary fallback={<header className="h-12 bg-white dark:bg-[#141413] border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 flex items-center justify-between z-20 text-xs font-semibold text-[#6B6860]"><button onClick={() => window.dispatchEvent(new CustomEvent('scc-navigate', { detail: 'dashboard' }))} className="hover:text-[#D97757]">StudentOS / Dashboard</button></header>}>
            <Navbar
              activeTabLabel={
                {
                  canvas: 'Canvas LMS',
                  radar: 'Daily Schedule',
                  tracker: 'Assignment Tracker',
                  gmail: 'Gmail AI Scanner',
                  drive: 'Google Drive',
                  classroom: 'Google Classroom',
                  moodle: 'Moodle LMS',
                  notebooklm: 'Google NotebookLM',
                  flashcards: 'Quizlet & Anki Flashcards',
                  quizlet: 'Quizlet & Anki Flashcards',
                  anki: 'Quizlet & Anki Flashcards',
                  canva: 'Canva',
                  'desmos-graphing': 'Desmos Graphing',
                  'desmos-scientific': 'Desmos Scientific',
                  geogebra: 'GeoGebra Math Suite',
                  phet: 'PhET Simulations',
                  'scribble-latex': 'Photo Math OCR',
                  'wolfram-symbolab': 'Wolfram Alpha & Symbolab',
                  wolfram: 'Wolfram Alpha & Symbolab',
                  excalidraw: 'Excalidraw Whiteboard',
                  mermaid: 'Mermaid Flowcharts',
                  viva: 'Oral Exam Practice',
                  pomodoro: 'Focus Station',
                  'notes-markdown': 'Markdown Notes',
                  'pdf-reader': 'PDF Reader & Annotator',
                  'quiz-generator': 'AI Practice Quiz Generator',
                  'periodic-table': 'Interactive Periodic Table',
                  'unit-converter': 'Scientific Unit Converter',
                  arxiv: 'arXiv Research Papers',
                  'open-library': 'Open Library & Textbooks',
                  rubric: 'Essay Rubric Checker',
                  feynman: 'Feynman Concept Explainer',
                  splitscreen: 'Dual Split Screen',
                  dashboard: 'Academic Dashboard',
                }[activeTab] || 'Workspace'
              }
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
              notifications={notifications}
              isAiChatOpen={aiChatOpen}
              onOpenGoogleSync={() => setGoogleSyncHubOpen(true)}
              isGoogleConnected={hasActiveGoogleWorkspaceToken()}
              isSyncingGoogle={isRefreshingAll}
              onNotificationClick={(n)=>{
                if (n.source==='Canvas' || n.title?.includes('Canvas') || n.title?.includes('Deadline')) handleTabTransition('canvas');
                else if (n.source==='Google Drive') handleTabTransition('drive');
                else if (n.source==='Gmail' || n.title?.includes('Email')) handleTabTransition('gmail');
                else if (n.tier==='urgent') handleTabTransition('tracker');
                else handleTabTransition('radar');
                // pulse highlight after nav
                setTimeout(()=>{ window.dispatchEvent(new CustomEvent('scc-highlight-tracker')); }, 300);
              }}
            />
            </ErrorBoundary>
          )}

          {/* PWA Install Banner — simplified */}
          {showInstallBtn && !zenFocusMode && activeTab !== 'dashboard' && (
            <div className="mx-4 mt-2 p-3 bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2"><span>📲</span><span className="font-semibold">Install app for offline access</span></div>
              <div className="flex items-center gap-2">
                <button onClick={handleInstallPwa} className="px-3 py-1.5 bg-[#D97757] text-white rounded-xl font-bold hover:bg-[#C86646]">Install</button>
                <button onClick={handleDismissPwa} className="px-2 py-1 text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5]">Later</button>
              </div>
            </div>
          )}

          {/* Main Area: Full-Screen AI Coach View OR Tab Workspaces — lazy + suspense + error boundary */}
          {aiChatOpen ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full animate-spin" /><span className="ml-2 text-xs text-[#6B6860]">Loading AI Coach…</span></div>}>
              <StudyAssistantChat
                isOpen={true}
                onClose={() => setAiChatOpen(false)}
                assignments={assignments}
                events={calendarEvents}
                alerts={emailAlerts}
                isFullScreen={true}
              />
            </Suspense>
          ) : (
            <main id="main-content" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0" aria-label="Workspace content">
              <ErrorBoundary fallback={<div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 text-sm">Workspace failed to load. Try refreshing or switching tabs.</div>}>
              <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full animate-spin" /><span className="ml-2 text-xs text-[#8C897F]">Loading workspace…</span></div>}>
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
                    googleToken={getStoredGoogleToken() || undefined}
                    onConnectGoogle={() => handleGoogleSignIn(true)}
                    sessionExpired={googleSessionExpired}
                    onReconnectGoogle={() => handleGoogleSignIn(true)}
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
                    onNavigateToTab={handleTabTransition}
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
                    onOpenLibrarySearch={(q) => {
                      try { localStorage.setItem('scc_openlib_prefill_v1', q); } catch {}
                      handleTabTransition('open-library');
                    }}
                  />
                )}

                {activeTab === 'gmail' && (
                  <GmailRadarTab
                    emailAlerts={emailAlerts}
                    rawEmails={rawEmails}
                    isLoadingEmails={isLoadingEmails}
                    onRefreshEmails={(forceResort, options) => loadEmailsAndAlerts(false, forceResort ?? true, options)}
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

                {activeTab === 'drive' && (
                  <GoogleDriveTab
                    recentFiles={recentFiles}
                    isLoadingFiles={isLoadingFiles}
                    onRefreshFiles={() => loadRecentFiles(false)}
                    isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                    onConnectGoogle={() => handleGoogleSignIn(true)}
                    driveError={driveError}
                    driveApiInfo={driveApiInfo}
                    googleToken={getStoredGoogleToken() || undefined}
                  />
                )}

                {activeTab === 'classroom' && (
                  <GoogleClassroomPanel
                    googleToken={getStoredGoogleToken() || undefined}
                    isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                    onConnectGoogle={() => handleGoogleSignIn(true)}
                    onSyncToSheet={handleSyncCanvasToSheet}
                    classroomAssignments={classroomAssignments}
                    isLoading={isLoadingClassroom}
                    errorMessage={classroomError}
                    onRefresh={() => loadClassroomData(false)}
                  />
                )}

                {activeTab === 'moodle' && (
                  <MoodlePanel
                    onSyncToSheet={handleSyncCanvasToSheet}
                  />
                )}

                {activeTab === 'notebooklm' && (
                  <NotebookLMStudioTab
                    googleToken={getStoredGoogleToken() || undefined}
                    isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                  />
                )}

                {(activeTab === 'flashcards' || activeTab === 'quizlet' || activeTab === 'anki') && (
                  <FlashcardStudioTab />
                )}

                {activeTab === 'canva' && (
                  <CanvaStudioTab />
                )}

                {activeTab === 'desmos-graphing' && (
                  <DesmosWorkspace mode="graphing" />
                )}

                {activeTab === 'desmos-scientific' && (
                  <DesmosWorkspace mode="scientific" />
                )}

                {activeTab === 'geogebra' && (
                  <GeoGebraWorkspace />
                )}

                {activeTab === 'phet' && (
                  <PhETWorkspace />
                )}

                {activeTab === 'excalidraw' && (
                  <ExcalidrawWorkspace />
                )}

                {activeTab === 'mermaid' && (
                  <MermaidWorkspace />
                )}

                {(activeTab === 'wolfram' || activeTab === 'wolfram-symbolab') && (
                  <WolframWorkspace />
                )}

                {activeTab === 'scribble-latex' && (
                  <PhotoMathWorkspace />
                )}

                {activeTab === 'rubric' && (
                  <RubricCheckerWorkspace />
                )}

                {activeTab === 'feynman' && (
                  <FeynmanWorkspace />
                )}

                {activeTab === 'pdf-reader' && (
                  <PdfReaderWorkspace />
                )}

                {activeTab === 'quiz-generator' && (
                  <QuizGeneratorWorkspace />
                )}

                {activeTab === 'pomodoro' && (
                  <PomodoroWorkspace />
                )}

                {activeTab === 'periodic-table' && (
                  <PeriodicTableWorkspace />
                )}

                {activeTab === 'unit-converter' && (
                  <UnitConverterWorkspace />
                )}

                {activeTab === 'arxiv' && (
                  <ArxivWorkspace />
                )}

                {activeTab === 'open-library' && (
                  <OpenLibraryWorkspace />
                )}

                {activeTab === 'citation-vault' && (
                  <CitationVaultWorkspace />
                )}

                {activeTab === 'timetable' && (
                  <TimetableWorkspace />
                )}

                {activeTab === 'scholarship-tracker' && (
                  <ScholarshipTrackerWorkspace />
                )}

                {activeTab === 'group-project' && (
                  <GroupProjectWorkspace />
                )}

                {activeTab === 'peer-qa' && (
                  <PeerQAWorkspace />
                )}

                {activeTab === 'notion-import' && (
                  <NotionImportWorkspace />
                )}

                {activeTab === 'deadline-gantt' && (
                  <DeadlineGanttWorkspace assignments={assignments} canvasAssignments={canvasAssignments} />
                )}

                {activeTab === 'grade-forecaster' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading Grade Forecaster…</div>}>
                    <GradeForecasterWorkspace />
                  </Suspense>
                )}
                {activeTab === 'exam-mode' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading Exam Mode…</div>}>
                    <ExamModeWorkspace />
                  </Suspense>
                )}
                {activeTab === 'internship-tracker' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <InternshipTrackerWorkspace />
                  </Suspense>
                )}
                {activeTab === 'budget-tracker' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <BudgetWorkspace />
                  </Suspense>
                )}
                {activeTab === 'habit-sleep' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <HabitSleepWorkspace />
                  </Suspense>
                )}
                {activeTab === 'timetable-optimizer' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <TimetableOptimizerWorkspace />
                  </Suspense>
                )}
                {activeTab === 'code-runner' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <CodeRunnerWorkspace />
                  </Suspense>
                )}
                {activeTab === 'resume-builder' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <ResumeBuilderWorkspace />
                  </Suspense>
                )}
                {activeTab === 'presentation-coach' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <PresentationCoachWorkspace />
                  </Suspense>
                )}
                {activeTab === 'lab-report' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <LabReportWorkspace />
                  </Suspense>
                )}
                {activeTab === 'essay-outliner' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <EssayOutlinerWorkspace />
                  </Suspense>
                )}
                {activeTab === 'image-occlusion' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <ImageOcclusionWorkspace />
                  </Suspense>
                )}
                {activeTab === 'fsrs' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <FSRSSchedulerInfo />
                  </Suspense>
                )}
                {activeTab === 'viva-voice' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <VivaWorkspace />
                  </Suspense>
                )}
                {activeTab === 'language-lab' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <LanguageLabWorkspace />
                  </Suspense>
                )}
                {activeTab === 'zotero-import' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <ZoteroImportWorkspace />
                  </Suspense>
                )}
                {activeTab === 'paper-chat' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <PaperChatWorkspace />
                  </Suspense>
                )}
                {activeTab === 'dataset-finder' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <DatasetFinderWorkspace />
                  </Suspense>
                )}
                {activeTab === 'study-rooms' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <div className="max-w-2xl mx-auto"><StudyRoomPanel /></div>
                  </Suspense>
                )}
                {activeTab === 'teacher-view' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <div className="max-w-2xl mx-auto"><TeacherShareView upcoming={assignments.slice(0,5).map((a:any)=>`${a.assignmentName} — due ${a.dueDate}`)} focusMin={120} streak={3} /></div>
                  </Suspense>
                )}
                {activeTab === 'lecture-copilot' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <div className="max-w-2xl mx-auto"><LectureCopilot /></div>
                  </Suspense>
                )}
                {activeTab === 'api-docs' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <div className="max-w-2xl mx-auto"><ApiDocsPanel /></div>
                  </Suspense>
                )}
                {activeTab === 'extension' && (
                  <Suspense fallback={<div className="p-6 text-xs">Loading…</div>}>
                    <div className="max-w-2xl mx-auto"><ExtensionHelper /></div>
                  </Suspense>
                )}

                {activeTab === 'stem' && (
                  <StemLabWorkspace />
                )}

                {activeTab === 'creation' && (
                  <CreationStudioWorkspace />
                )}

                {(activeTab === 'viva' || activeTab === 'retention') && (
                  <RetentionVaultWorkspace
                    googleToken={getStoredGoogleToken() || undefined}
                    isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                    onStartFocus={() => setZenFocusMode(true)}
                  />
                )}

                {(activeTab === 'notes-markdown' || activeTab === 'documents') && (
                  <DocumentHubWorkspace
                    recentFiles={recentFiles}
                    isLoadingFiles={isLoadingFiles}
                    onRefreshFiles={() => loadRecentFiles(false)}
                    isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                    googleToken={getStoredGoogleToken() || undefined}
                  />
                )}

                {activeTab === 'splitscreen' && (
                  <SplitScreenStudio />
                )}

                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <OnboardingChecklist
                      onConnectCanvas={()=>handleTabTransition('canvas')}
                      onConnectGoogle={()=>handleGoogleSignIn(true)}
                      onCreateTask={()=>handleTabTransition('tracker')}
                      onStartPomodoro={()=>{ handleTabTransition('pomodoro'); setZenFocusMode(true); }}
                    />
                    <DashboardHome
                      assignments={assignments}
                      onToggleAssignment={handleToggleAssignmentById}
                      onNavigateWorkspace={(ws) => handleTabTransition(ws)}
                      onOpenQuickDraft={(emailAlert) => {
                        if (emailAlert) {
                          setDraftInitialEmail(emailAlert.rawEmail || null);
                          setDraftInitialAlert(emailAlert);
                        } else {
                          setDraftInitialEmail(null);
                          setDraftInitialAlert(null);
                        }
                        setQuickDraftModalOpen(true);
                      }}
                      onOpenAiSuite={(tab) => {
                        setAiSuiteTab(tab || 'planner');
                        setAiSuiteOpen(true);
                      }}
                      onOpenAppStore={() => setAppStoreOpen(true)}
                      user={user}
                      isGoogleConnected={Boolean(getStoredGoogleToken()) || isDemoMode}
                      onConnectGoogle={() => handleGoogleSignIn(true)}
                      onOpenStudyPlan={() => setIsStudyPlanOpen(true)}
                      calendarEvents={calendarEvents}
                      emailAlerts={emailAlerts}
                      isLoadingEvents={isLoadingEvents}
                    />
                  </div>
                )}
              </div>
              </Suspense>
              </ErrorBoundary>
            </main>
          )}
        </div>
      </div>

      {/* Unified 2-Column Account & Settings Modal — lazy wrapped in Suspense */}
      <Suspense fallback={null}>
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
        onOpenTour={() => setIsIntroTourOpen(true)}
        onOpenOAuthGuide={() => setOauthGuideModalOpen(true)}
        onOpenDeploymentGuide={() => setDeploymentModalOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        shortcutSettings={shortcutSettings}
        setShortcutSettings={setShortcutSettings}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
        pwaInstallAvailable={showInstallBtn && !!deferredPrompt}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        onDismissPwa={handleDismissPwa}
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

      {/* Google Workspace Sync Hub Modal */}
      {googleSyncHubOpen && (
        <Suspense fallback={null}>
          <GoogleSyncHubModal
            isOpen={googleSyncHubOpen}
            onClose={() => setGoogleSyncHubOpen(false)}
            user={user}
            hasGoogleToken={hasActiveGoogleWorkspaceToken()}
            isSyncing={isRefreshingAll}
            onSyncAll={async () => {
              await runFullSync(false);
            }}
            onConnectGoogle={() => handleGoogleSignIn(true)}
            onDisconnectGoogle={handleDisconnectGoogle}
            calendarEventsCount={calendarEvents.length}
            emailCount={rawEmails.length}
            schoolFilesCount={recentFiles.length}
            classroomCount={classroomAssignments.length}
            sheetUrl={masterSheetUrl}
            onSyncSheet={async () => {
              await loadSheetAssignments(false);
            }}
            isSyncingSheet={isLoadingAssignments}
            onSyncClassroom={async () => {
              await loadClassroomData(false);
            }}
            isSyncingClassroom={isLoadingClassroom}
          />
        </Suspense>
      )}

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        modal={confirmationModal}
        onClose={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectWorkspace={handleWorkspaceTransition}
        onOpenQuickDraft={() => {
          setDraftInitialEmail(null);
          setDraftInitialAlert(null);
          setQuickDraftModalOpen(true);
        }}
        onOpenNewAssignment={() => {
          handleWorkspaceTransition('academic');
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

      {/* App Store & Tool Catalog Modal */}
      <AppStoreModal
        isOpen={appStoreOpen}
        onClose={() => setAppStoreOpen(false)}
        onLaunchApp={(appId) => handleTabTransition(appId)}
        pinnedAppIds={pinnedAppIds}
        onTogglePinApp={handleTogglePinApp}
      />

      {/* AI Academic Suite Modal (Planner, Quiz, Syllabus, Grades) */}
      <AiAcademicSuiteModal
        isOpen={aiSuiteOpen}
        onClose={() => setAiSuiteOpen(false)}
        assignments={assignments}
        onAddAssignments={(newItems) => {
          newItems.forEach((item) => {
            handleAddAssignment({
              assignmentName: item.assignmentName || 'Assignment',
              subject: item.subject || 'General',
              dueDate: item.dueDate || 'Upcoming',
              priority: (item.priority as PriorityLevel) || 'Med',
              status: (item.status as AssignmentStatus) || 'Not Started',
              notes: item.notes || '',
            });
          });
        }}
        defaultTab={aiSuiteTab}
      />

      {/* Persistent Gemini & Groq AI Settings Modal */}
      <GeminiSettingsModal
        isOpen={geminiSettingsOpen}
        onClose={() => setGeminiSettingsOpen(false)}
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

      {/* Wikipedia Quick Look Modal */}
      <WikipediaLookupModal
        isOpen={isWikipediaModalOpen}
        onClose={() => setIsWikipediaModalOpen(false)}
        initialQuery={wikipediaInitialQuery}
      />

      {/* Study Card Modal */}
      <StudyCardModal
        isOpen={isStudyCardOpen}
        onClose={() => setIsStudyCardOpen(false)}
        userName={user?.displayName || 'Student'}
        completedTasksCount={assignments.filter((a) => a.status === 'Done').length}
      />

      {/* 1-Page Academic Portfolio Export Modal */}
      <PortfolioExportModal
        isOpen={isPortfolioExportOpen}
        onClose={() => setIsPortfolioExportOpen(false)}
        userName={user?.displayName || 'Student'}
        completedAssignments={assignments.filter((a) => a.status === 'Done')}
      />

      {/* Daily Morning Check-in Modal */}
      <MorningCheckInModal
        isOpen={isMorningCheckInOpen}
        onClose={() => setIsMorningCheckInOpen(false)}
        userName={user?.displayName || 'Student'}
        onSaveIntention={handleSaveMorningIntention}
      />

      {/* Changelog Releases Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* AI Daily Study Plan Generator Modal */}
      <StudyPlanGeneratorModal
        isOpen={isStudyPlanOpen}
        onClose={() => setIsStudyPlanOpen(false)}
        assignments={assignments}
        onAddStudyBlock={handleScheduleStudyBlock}
        onStartFocusSession={(mins) => {
          setActiveTab('pomodoro');
          setZenFocusMode(true);
        }}
      />

      {/* Interactive Step-by-Step Introduction Tour Modal */}
      <InteractiveIntroModal
        isOpen={isIntroTourOpen}
        onClose={() => setIsIntroTourOpen(false)}
      />

      </Suspense>

      {/* Toast Notification Container — pauseOnHover + undo (Feedback + PWA Install now live inside Settings → Help & Support) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} onRetry={(id:string)=>{
        // Expiry toasts reconnect Google; others run their own retry handler
        try {
          const t = toasts.find((x) => x.id === id) as any;
          if (t?.reconnectGoogle) {
            dismissToast(id);
            handleGoogleSignIn(true);
            return;
          }
          if (typeof t?.onRetry === 'function') t.onRetry();
        } catch {}
        dismissToast(id);
      }} onUndo={(id:string)=>{
        // undo delete-assignment: restore last deleted from localStorage stash
        try {
          const raw = localStorage.getItem('scc_last_deleted_assignment');
          if (raw) {
            const a = sanitizeAssignments([JSON.parse(raw)])[0];
            if (a) setAssignments(prev=> [...prev, a]);
            localStorage.removeItem('scc_last_deleted_assignment');
            addToast({ type:'success', title:'Restored', message: a?.assignmentName ?? 'Task' });
          }
        } catch {}
        dismissToast(id);
      }} />
    </div>
  );
}
