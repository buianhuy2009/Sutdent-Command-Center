import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  User as UserIcon,
  Moon,
  Sun,
  RefreshCw,
  ExternalLink,
  Keyboard,
  HelpCircle,
  LogOut,
  LogIn,
  CheckCircle2,
  Palette,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Shield,
  Layers,
  Compass,
  Mail,
  CheckSquare,
  FileText,
  Bot,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

export interface ShortcutSettings {
  masterEnabled: boolean;
  keys: {
    tab1: boolean;
    tab2: boolean;
    tab3: boolean;
    tab4: boolean;
    tab5: boolean;
    search: boolean;
    sync: boolean;
    help: boolean;
    esc: boolean;
  };
}

export const defaultShortcutSettings: ShortcutSettings = {
  masterEnabled: false,
  keys: {
    tab1: false,
    tab2: false,
    tab3: false,
    tab4: false,
    tab5: false,
    search: false,
    sync: false,
    help: false,
    esc: false,
  },
};

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  sheetUrl: string | null;
  onOpenTour?: () => void;
  onOpenOAuthGuide?: () => void;
  onOpenDeploymentGuide?: () => void;
  shortcutSettings: ShortcutSettings;
  setShortcutSettings: React.Dispatch<React.SetStateAction<ShortcutSettings>>;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'shortcuts' | 'help';

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onGoogleSignIn,
  onLogout,
  isLoggingIn,
  darkMode,
  setDarkMode,
  onRefreshAll,
  isRefreshing,
  sheetUrl,
  onOpenTour,
  onOpenOAuthGuide,
  onOpenDeploymentGuide,
  shortcutSettings,
  setShortcutSettings,
  reducedMotion,
  setReducedMotion,
  highContrast,
  setHighContrast,
  isSidebarExpanded,
  toggleSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleAllShortcuts = (enable: boolean) => {
    setShortcutSettings({
      masterEnabled: enable,
      keys: {
        tab1: enable,
        tab2: enable,
        tab3: enable,
        tab4: enable,
        tab5: enable,
        search: enable,
        sync: enable,
        help: enable,
        esc: enable,
      },
    });
  };

  const toggleIndividualShortcut = (keyName: keyof ShortcutSettings['keys']) => {
    setShortcutSettings((prev) => ({
      ...prev,
      keys: {
        ...prev.keys,
        [keyName]: !prev.keys[keyName],
      },
    }));
  };

  const shortcutsList = [
    { id: 'tab1', key: '1', label: 'Canvas LMS Hub', desc: 'Jump to Canvas coursework & submissions' },
    { id: 'tab2', key: '2', label: 'Daily Schedule', desc: 'Open integrated timetable & focus blocks' },
    { id: 'tab3', key: '3', label: 'Gmail AI Scanner', desc: 'Open filtered school communications' },
    { id: 'tab4', key: '4', label: 'Assignment Tracker', desc: 'Jump to master assignment checklist' },
    { id: 'tab5', key: '5', label: 'Project Starter', desc: 'Open Google Drive documents generator' },
    { id: 'search', key: '⌘ + K', label: 'Command Palette Search', desc: 'Search assignments, courses, and quick actions' },
    { id: 'sync', key: 'R', label: 'Sync Workspace Data', desc: 'Fetch latest updates across all services' },
    { id: 'help', key: '?', label: 'Open Settings & Help', desc: 'Trigger this settings dialog anytime' },
    { id: 'esc', key: 'Esc', label: 'Dismiss Active Dialogs', desc: 'Close open modal or return from coach' },
  ] as const;

  const faqs = [
    {
      q: 'How does Canvas LMS synchronization work?',
      a: 'The Command Center connects directly to your Canvas account using either your Canvas calendar iCal feed or your Canvas personal API token. Assignments, due dates, quizzes, and course tags are synchronized and cross-referenced with your Master Google Sheet.',
    },
    {
      q: 'How does the inline Google Drive submission picker work?',
      a: 'Inside each Canvas assignment card, clicking "Submit Work" reveals an inline Google Drive picker. Selecting your Google Doc automatically verifies view/edit permissions and shares the file with your instructor upon submission.',
    },
    {
      q: 'Is my Google Workspace data private and secure?',
      a: 'Yes. All Google OAuth tokens remain strictly on your client browser and are only used for direct communication with the official Google Drive, Calendar, Sheets, and Gmail APIs. Zero private email or document data is permanently stored on external servers.',
    },
    {
      q: 'Can I test the application without connecting real accounts?',
      a: 'Yes! Student Command Center features a realistic Live Demo Mode preloaded with AP US History, Physics, English Literature, and Mathematics coursework so you can test all features without connecting real credentials.',
    },
    {
      q: 'How does the AI Study Coach work?',
      a: 'The AI Study Coach utilizes Google Gemini 2.5 Flash with real-time context of your active assignments, schedule focus blocks, and scanned email alerts to generate step-by-step study plans, draft polite extension requests, or summarize difficult study materials.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF9F5] dark:bg-[#141413] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-3xl shadow-2xl w-full max-w-4xl h-[640px] max-h-[92vh] flex overflow-hidden">
        
        {/* Left Navigation Column */}
        <aside className="w-56 sm:w-64 bg-[#EFECE2] dark:bg-[#1F1E1B] border-r border-[#DFDACB] dark:border-[#2C2B27] p-4 flex flex-col justify-between shrink-0 select-none">
          <div>
            <div className="px-3 pt-2 pb-4">
              <span className="text-[11px] font-bold text-[#8C897F] uppercase tracking-wider">
                Settings
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'general', label: 'General', icon: Sliders },
                { id: 'appearance', label: 'Appearance', icon: Palette },
                { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
                { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#FAF9F5] dark:bg-[#2C2A26] text-[#D97757] shadow-xs'
                        : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#E5E2D8] dark:hover:bg-[#262421]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Student Profile Card in Left Rail Footer */}
          <div className="pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
            <div className="flex items-center gap-2.5 p-1.5 rounded-xl">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Student'}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#D97757]/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user ? (user.displayName || user.email || 'S').charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate leading-tight text-[#141413] dark:text-[#FAF9F5]">
                  {user ? user.displayName || user.email?.split('@')[0] : 'Guest Student'}
                </p>
                <p className="text-[10px] text-[#8C897F] truncate">
                  {user?.email || 'Local mode'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800/80 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onGoogleSignIn();
                  onClose();
                }}
                disabled={isLoggingIn}
                className="w-full px-3 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connect Google</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAF9F5] dark:bg-[#141413]">
          {/* Header */}
          <div className="p-5 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5] leading-tight">
                {activeTab === 'general' && 'General Settings'}
                {activeTab === 'appearance' && 'Appearance & Display'}
                {activeTab === 'shortcuts' && 'Keyboard Shortcuts'}
                {activeTab === 'help' && 'System Overview & Help'}
              </h3>
              <p className="text-xs text-[#8C897F]">
                {activeTab === 'general' && 'Manage your account connection and data synchronization.'}
                {activeTab === 'appearance' && 'Customize theme, contrast, and visual animations.'}
                {activeTab === 'shortcuts' && 'Configure automated keybindings and shortcut switches.'}
                {activeTab === 'help' && 'Academic Command Center architecture, guides, and answers.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-xl hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Google Connection Card */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Google Workspace Integration</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      Syncs Google Drive files, Calendar events, and Gmail inbox.
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-[#8C897F]'}`}>
                    {user ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Master Google Sheet Card */}
                {sheetUrl && (
                  <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Master Google Sheet</h4>
                      <p className="text-[11px] text-[#8C897F] mt-0.5">
                        Bi-directionally connected assignment checklist.
                      </p>
                    </div>
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-bold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/20 rounded-xl border border-[#D97757]/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Sync Workspace Card */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Refresh Workspace Data</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      Fetch fresh data from Canvas, Google Calendar, and Gmail.
                    </p>
                  </div>
                  <button
                    onClick={onRefreshAll}
                    disabled={isRefreshing}
                    className="px-3.5 py-1.5 bg-[#EFECE2] dark:bg-[#2A2825] hover:bg-[#E5E2D8] dark:hover:bg-[#33312C] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D97757]' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync Now (R)'}</span>
                  </button>
                </div>

                {/* Academic Integrations Hub Card */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Multi-Platform Academic Hub</h4>
                      <p className="text-[11px] text-[#8C897F] mt-0.5">
                        Connected LMS and design tools configured in your Command Center.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { label: 'Google Classroom', status: user ? 'Ready' : 'Not Connected', color: user ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' : 'text-slate-500 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
                      { label: 'Canvas LMS', status: 'Active', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800' },
                      { label: 'Moodle LMS', status: 'Ready', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
                      { label: 'Google NotebookLM', status: 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
                      { label: 'Canva Studio', status: 'Active', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
                      { label: 'Flashcard Studio', status: 'Active', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' },
                    ].map((item) => (
                      <div key={item.label} className={`p-2.5 rounded-xl border text-center ${item.color}`}>
                        <div className="text-[11px] font-bold truncate">{item.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{item.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Developer / OAuth Setup */}
                {onOpenOAuthGuide && (
                  <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Google OAuth Test Users</h4>
                      <p className="text-[11px] text-[#8C897F] mt-0.5">
                        Instructions to permit additional school Gmail accounts.
                      </p>
                    </div>
                    <button
                      onClick={onOpenOAuthGuide}
                      className="px-3 py-1.5 text-xs font-bold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/20 rounded-xl border border-[#D97757]/30 transition-colors cursor-pointer"
                    >
                      View Setup
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Theme Mode Toggle Card */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-center text-[#D97757]">
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Theme Mode</h4>
                      <p className="text-[11px] text-[#8C897F] mt-0.5">
                        {darkMode ? 'Dark Charcoal (#141413) elevated mode' : 'Warm Cream (#FAF9F5) anti-eyestrain mode'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D97757] text-white hover:bg-[#C86646] transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>Switch to {darkMode ? 'Light' : 'Dark'}</span>
                  </button>
                </div>

                {/* Accent Color Badge Card */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#D97757] ring-4 ring-[#D97757]/20 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Terracotta Accent</h4>
                      <p className="text-[11px] text-[#8C897F] mt-0.5">Official accent color: #D97757</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#D97757] bg-[#D97757]/10 px-2.5 py-1 rounded-lg border border-[#D97757]/30">
                    #D97757
                  </span>
                </div>

                {/* Reduced Motion Toggle */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Reduced Motion</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      Disables view transitions and entry reveals for minimal distraction.
                    </p>
                  </div>
                  <button
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      reducedMotion ? 'bg-[#D97757]' : 'bg-[#E5E2D8] dark:bg-[#2C2A26]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* High Contrast Borders Toggle */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Enhanced Card Contrast</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      Crisp defined boundaries between cards and backgrounds.
                    </p>
                  </div>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      highContrast ? 'bg-[#D97757]' : 'bg-[#E5E2D8] dark:bg-[#2C2A26]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        highContrast ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sidebar Default View */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Sidebar Display</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      Current state: {isSidebarExpanded ? 'Expanded (Labels & Shortcuts)' : 'Compact (Icons only)'}
                    </p>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="px-3 py-1.5 text-xs font-bold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/20 rounded-xl border border-[#D97757]/30 transition-colors cursor-pointer"
                  >
                    {isSidebarExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>
            )}

            {/* 3. SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                {/* Master Shortcuts Switch & Bulk Buttons */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Global Keyboard Shortcuts</h4>
                    <p className="text-[11px] text-[#8C897F] mt-0.5">
                      {shortcutSettings.masterEnabled ? 'Active — single keystroke navigation enabled' : 'Disabled by default'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllShortcuts(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/20 rounded-lg border border-[#D97757]/30 transition-colors cursor-pointer"
                    >
                      Turn All On
                    </button>
                    <button
                      onClick={() => toggleAllShortcuts(false)}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] bg-[#EFECE2] dark:bg-[#2A2825] hover:bg-[#E5E2D8] dark:hover:bg-[#33312C] rounded-lg transition-colors cursor-pointer"
                    >
                      Turn All Off
                    </button>
                    <button
                      onClick={() =>
                        setShortcutSettings((prev) => ({
                          ...prev,
                          masterEnabled: !prev.masterEnabled,
                        }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ml-2 ${
                        shortcutSettings.masterEnabled ? 'bg-[#D97757]' : 'bg-[#E5E2D8] dark:bg-[#2C2A26]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          shortcutSettings.masterEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Individual Shortcut List */}
                <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] divide-y divide-[#DFDACB]/60 dark:divide-[#2C2B27]">
                  {shortcutsList.map((item) => {
                    const isKeyActive = shortcutSettings.masterEnabled && shortcutSettings.keys[item.id as keyof ShortcutSettings['keys']];
                    return (
                      <div key={item.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-14 text-center px-2 py-1 text-xs font-mono font-bold bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#D97757] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg shrink-0">
                            {item.key}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                              {item.label}
                            </h5>
                            <p className="text-[10px] text-[#8C897F] truncate">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleIndividualShortcut(item.id as keyof ShortcutSettings['keys'])}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                            isKeyActive ? 'bg-[#D97757]' : 'bg-[#E5E2D8] dark:bg-[#2C2A26]'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              isKeyActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. HELP & FAQ TAB */}
            {activeTab === 'help' && (
              <div className="space-y-5">
                {/* Website Overview Section */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#D97757]" />
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider">
                      Student Command Center Overview
                    </h4>
                  </div>
                  <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                    Student Command Center is a cohesive academic operating system that bridges the gap between Canvas LMS coursework and your daily Google Workspace ecosystem. It eliminates tedious tab hopping by displaying course assignments, inline Google Drive submissions, calendar focus blocks, and urgent teacher communications in one streamlined dashboard.
                  </p>
                </div>

                {/* Introduction of the Parts (6 Modules) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#8C897F] uppercase tracking-wider px-1">
                    System Workspaces & Modules
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { icon: Layers, title: '1. Canvas LMS Hub', desc: 'Syncs coursework, due dates, and submissions with an inline Google Drive picker that automatically manages sharing permissions.' },
                      { icon: Compass, title: '2. Daily Schedule', desc: 'Merges Canvas deadlines with Google Calendar meetings and classes into high-focus daily timeline cards.' },
                      { icon: Mail, title: '3. Gmail AI Scanner', desc: 'Uses Google Gemini to scan your school inbox, separating high-priority teacher notices from automated campus newsletters.' },
                      { icon: CheckSquare, title: '4. Assignment Tracker', desc: 'A live master checklist synced bi-directionally with your Master Google Sheet with zero latency.' },
                      { icon: FileText, title: '5. Project Starter', desc: 'One-click MLA/APA essay builder with ready-to-write Google Docs directly stored in your school Google Drive.' },
                      { icon: Bot, title: '6. AI Study Coach', desc: 'Full-screen personal study coach powered by Gemini 2.5 Flash with full context of your assignments and schedule.' },
                    ].map((mod, idx) => {
                      const Icon = mod.icon;
                      return (
                        <div key={idx} className="p-3 bg-white dark:bg-[#1A1917] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] dark:bg-[#252422] text-[#D97757] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">{mod.title}</h5>
                            <p className="text-[11px] text-[#8C897F] mt-0.5 leading-snug">{mod.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FAQ Accordion Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#8C897F] uppercase tracking-wider px-1">
                    Frequently Asked Questions
                  </h4>
                  <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] divide-y divide-[#DFDACB]/60 dark:divide-[#2C2B27]">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="p-3 sm:p-4">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full flex items-center justify-between text-left cursor-pointer gap-2"
                        >
                          <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                            {faq.q}
                          </span>
                          {openFaqIndex === idx ? (
                            <ChevronUp className="w-4 h-4 text-[#D97757] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#8C897F] shrink-0" />
                          )}
                        </button>
                        {openFaqIndex === idx && (
                          <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] mt-2 leading-relaxed animate-in fade-in duration-150">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour Launch Button */}
                {onOpenTour && (
                  <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Need an interactive walkthrough?</h5>
                      <p className="text-[11px] text-[#8C897F]">Step through the guided onboarding tour again.</p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenTour();
                      }}
                      className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Start Tour
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#EFECE2] dark:bg-[#1F1E1B] border-t border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between text-[11px] text-[#8C897F] shrink-0">
            <span>Student Command Center • Academic OS</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#FAF9F5] dark:bg-[#2A2825] hover:bg-[#E5E2D8] dark:hover:bg-[#33312C] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
