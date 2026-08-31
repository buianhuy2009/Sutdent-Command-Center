import React, { useState, useEffect } from 'react';
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
  ChevronRight,
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
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  SlidersHorizontal,
  AppWindow,
  Zap,
} from 'lucide-react';
import {
  getClientGeminiApiKey,
  setClientGeminiApiKey,
  testGeminiApiKey,
  getClientGroqApiKey,
  setClientGroqApiKey,
} from '../services/gemini';

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
  isSidebarExpanded?: boolean;
  toggleSidebar?: () => void;
}

type SettingsSection = 'general' | 'models' | 'sync' | 'appearance' | 'shortcuts' | 'integrations';

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
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // AI Keys state
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [geminiStatusMsg, setGeminiStatusMsg] = useState('');

  // UI Density & Themes
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => {
    return (localStorage.getItem('scc_ui_density_v1') as any) || 'comfortable';
  });
  const [colorTheme, setColorTheme] = useState<'parchment' | 'midnight' | 'ocean' | 'forest'>(() => {
    return (localStorage.getItem('scc_color_theme_v1') as any) || 'parchment';
  });
  const [autoSystemTheme, setAutoSystemTheme] = useState<boolean>(() => {
    return localStorage.getItem('scc_auto_system_theme_v1') === 'true';
  });

  const handleDensityChange = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    setDensity(newDensity);
    localStorage.setItem('scc_ui_density_v1', newDensity);
    document.documentElement.setAttribute('data-density', newDensity);
  };

  const handleThemeChange = (newTheme: 'parchment' | 'midnight' | 'ocean' | 'forest') => {
    setColorTheme(newTheme);
    localStorage.setItem('scc_color_theme_v1', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleAutoSystemThemeChange = (val: boolean) => {
    setAutoSystemTheme(val);
    localStorage.setItem('scc_auto_system_theme_v1', String(val));
    if (val) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isSystemDark);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const savedGemini = getClientGeminiApiKey();
      setGeminiKey(savedGemini);
      const savedGroq = getClientGroqApiKey();
      setGroqKey(savedGroq);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    setClientGeminiApiKey(geminiKey);
    setClientGroqApiKey(groqKey);
    setGeminiStatusMsg('Keys saved locally.');
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      setGeminiTestStatus('failed');
      setGeminiStatusMsg('Please enter a Gemini API key.');
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus('idle');
    setGeminiStatusMsg('Testing Gemini 2.5 Flash connection...');
    const ok = await testGeminiApiKey(geminiKey);
    setIsTestingGemini(false);
    if (ok) {
      setGeminiTestStatus('success');
      setGeminiStatusMsg('Gemini Connection Verified! Ready for multimodal & schema tasks.');
      setClientGeminiApiKey(geminiKey);
    } else {
      setGeminiTestStatus('failed');
      setGeminiStatusMsg('Connection failed. Please check your key.');
    }
  };

  const toggleAllShortcuts = (enabled: boolean) => {
    setShortcutSettings({
      masterEnabled: enabled,
      keys: {
        tab1: enabled,
        tab2: enabled,
        tab3: enabled,
        tab4: enabled,
        tab5: enabled,
        search: enabled,
        sync: enabled,
        help: enabled,
        esc: enabled,
      },
    });
  };

  const toggleIndividualKey = (keyName: keyof ShortcutSettings['keys']) => {
    setShortcutSettings((prev) => ({
      ...prev,
      keys: {
        ...prev.keys,
        [keyName]: !prev.keys[keyName],
      },
    }));
  };

  const navItems: Array<{ id: SettingsSection; label: string; icon: any }> = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'models', label: 'Models & AI Keys', icon: Bot },
    { id: 'sync', label: 'Google & Canvas Sync', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'integrations', label: 'Integrations & LMS', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl max-w-4xl w-full h-[620px] max-h-[90vh] flex border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* LEFT PANE: Categorized Sidebar matching uploaded reference */}
        <div className="w-60 shrink-0 bg-[#FAF9F5] dark:bg-[#1F1E1B] border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col justify-between p-4 select-none">
          <div className="space-y-4">
            <div className="px-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                Settings
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#EFECE2] dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] shadow-xs'
                        : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2]/60 dark:hover:bg-[#252422]/60 hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D97757]' : 'text-[#8C897F]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Account Card at Bottom of Dialog Sidebar */}
          <div className="pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27]">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#141413] border border-[#DFDACB] dark:border-[#2C2B27]">
              {user ? (
                <div className="w-8 h-8 rounded-lg bg-[#D97757] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (user.displayName || user.email || 'U').slice(0, 2).toUpperCase()
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#8C897F]/20 text-[#8C897F] flex items-center justify-center font-bold text-xs shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate leading-tight">
                  {user ? user.displayName || user.email?.split('@')[0] : 'Guest User'}
                </div>
                <div className="text-[10px] text-[#8C897F] truncate">
                  {user ? user.email : 'Local Storage Only'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Detail Settings Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#141413]">
          
          {/* Header with Title and Close X */}
          <div className="px-8 py-6 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                {navItems.find((n) => n.id === activeSection)?.label}
              </h2>
              <p className="text-xs text-[#8C897F] mt-0.5">
                {activeSection === 'general' && 'Configure execution preferences, storage policies, and session controls.'}
                {activeSection === 'models' && 'Manage Google Gemini and Groq API keys with dual-provider failover.'}
                {activeSection === 'sync' && 'Manage Canvas LMS sync tokens, Google Drive permissions, and Google Sheets.'}
                {activeSection === 'appearance' && 'Customize theme warmth, contrast, and motion reduction.'}
                {activeSection === 'shortcuts' && 'Keyboard navigation and quick action hotkeys.'}
                {activeSection === 'integrations' && 'Connected LMS hubs, Classroom, and external study utilities.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C897F] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            {/* SECTION 1: GENERAL */}
            {activeSection === 'general' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                    Execution &amp; Session
                  </span>

                  {/* Setting Card: Auto Sync */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Background Workspace Refresh
                      </div>
                      <div className="text-[11px] text-[#8C897F]">
                        Periodically sync Canvas assignments and Google Calendar events.
                      </div>
                    </div>
                    <button
                      onClick={onRefreshAll}
                      disabled={isRefreshing}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#D97757] ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  </div>

                  {/* Setting Card: Tour */}
                  {onOpenTour && (
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                          StudentOS Walkthrough Tour
                        </div>
                        <div className="text-[11px] text-[#8C897F]">
                          Re-open the interactive system onboarding tour.
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenTour();
                        }}
                        className="px-3.5 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Launch Tour
                      </button>
                    </div>
                  )}

                  {/* Setting Card: Local Storage Reset */}
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Clear Local Cache
                      </div>
                      <div className="text-[11px] text-[#8C897F]">
                        Clear cached emails, completed cards, and temporary drafts.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('scc_emails_cache_v3');
                        localStorage.removeItem('scc_email_alerts_v3');
                        alert('Local email and alert cache cleared.');
                      }}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-rose-500 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: MODELS & AI KEYS */}
            {activeSection === 'models' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Dual-Provider Redundancy Active</span>
                    Requests prioritize your local Gemini key, automatically falling back to Groq LLaMA 3.3 70B if limits are reached.
                  </div>
                </div>

                {/* Gemini Key */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block">
                        Google Gemini API Key
                      </label>
                      <span className="text-[11px] text-[#8C897F]">
                        Used for multimodal math OCR, structured JSON actions &amp; oral exams.
                      </span>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#D97757] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <Key className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-white dark:bg-[#141413] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#8C897F]">
                      {geminiStatusMsg || 'Stored locally in browser.'}
                    </span>
                    <button
                      onClick={handleTestGemini}
                      disabled={isTestingGemini || !geminiKey.trim()}
                      className="px-3 py-1 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTestingGemini ? 'animate-spin text-[#D97757]' : ''}`} />
                      <span>{isTestingGemini ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>

                {/* Groq Key */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block">
                        Groq API Key (Failover Engine)
                      </label>
                      <span className="text-[11px] text-[#8C897F]">
                        Instant fallback to LLaMA 3.3 70B if Gemini rate limit is hit.
                      </span>
                    </div>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#D97757] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Get Groq Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <Key className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-white dark:bg-[#141413] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveKeys}
                    className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Save API Keys
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: SYNC & GOOGLE */}
            {activeSection === 'sync' && (
              <div className="space-y-4">
                {/* Google Account */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Google Workspace Sync
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      {user ? `Connected as ${user.email}` : 'Not connected (Local Guest Mode)'}
                    </div>
                  </div>
                  {user ? (
                    <button
                      onClick={onLogout}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#252422] border border-rose-300 dark:border-rose-800 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={onGoogleSignIn}
                      disabled={isLoggingIn}
                      className="px-3.5 py-1.5 bg-[#D97757] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Connect Google
                    </button>
                  )}
                </div>

                {/* Google Sheets URL */}
                {sheetUrl && (
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Master Assignment Sheet
                      </div>
                      <div className="text-[11px] text-[#8C897F] truncate max-w-xs">
                        {sheetUrl}
                      </div>
                    </div>
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Guides */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {onOpenOAuthGuide && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenOAuthGuide();
                      }}
                      className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-left hover:border-[#D97757] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        OAuth &amp; Test Users Guide
                      </div>
                      <div className="text-[10px] text-[#8C897F] mt-0.5">
                        Setup instructions for Google Cloud Console.
                      </div>
                    </button>
                  )}
                  {onOpenDeploymentGuide && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDeploymentGuide();
                      }}
                      className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-left hover:border-[#D97757] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Vercel Deployment Guide
                      </div>
                      <div className="text-[10px] text-[#8C897F] mt-0.5">
                        Full-stack deployment steps and env vars.
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: APPEARANCE */}
            {activeSection === 'appearance' && (
              <div className="space-y-4">
                {/* Interface Density Toggle */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Display &amp; Layout Density
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Compact mode fits 35% more content onto 13-inch laptop displays.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#141413] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] shrink-0">
                    {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDensityChange(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          density === d
                            ? 'bg-[#D97757] text-white shadow-xs'
                            : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme Palette Selector */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        Atmospheric Color Palette
                      </div>
                      <div className="text-[11px] text-[#8C897F]">
                        Curated low-strain palettes for extended study sessions.
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#D97757] uppercase">
                      {colorTheme}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'parchment', name: 'Warm Parchment', color: 'bg-[#FAF9F5] text-[#141413] border-[#DFDACB]' },
                      { id: 'midnight', name: 'Midnight Slate', color: 'bg-[#0A0A0C] text-white border-zinc-700' },
                      { id: 'ocean', name: 'Ocean Navy', color: 'bg-[#0B132B] text-white border-blue-800' },
                      { id: 'forest', name: 'Forest Calm', color: 'bg-[#061A14] text-white border-emerald-800' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id as any)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex flex-col justify-between h-16 ${
                          t.color
                        } ${
                          colorTheme === t.id
                            ? 'ring-2 ring-[#D97757] scale-[1.02] shadow-xs'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-[#D97757]" />
                        <span className="text-[11px] truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark / Light Toggle */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Dark &amp; Light Mode
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Anti-eyestrain warm cream or low-light dark.
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#141413] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                    <button
                      onClick={() => setDarkMode(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        !darkMode ? 'bg-[#D97757] text-white shadow-xs' : 'text-[#8C897F]'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Cream</span>
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        darkMode ? 'bg-[#D97757] text-white shadow-xs' : 'text-[#8C897F]'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Auto-Follow System Theme */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Sync with Operating System
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Automatically switch between Light and Dark mode based on OS preferences.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSystemTheme}
                    onChange={(e) => handleAutoSystemThemeChange(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                  />
                </div>

                {/* Reduced Motion */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Reduced Motion
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Disable heavy transition animations for lower CPU usage.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                  />
                </div>

                {/* High Contrast */}
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      High Contrast Mode
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Increase border and text contrast for outdoor readability.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* SECTION 5: SHORTCUTS */}
            {activeSection === 'shortcuts' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Master Keyboard Shortcuts Switch
                    </div>
                    <div className="text-[11px] text-[#8C897F]">
                      Enable single-key shortcuts (1-5 for tabs, R to sync, ? for help).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shortcutSettings.masterEnabled}
                    onChange={(e) => toggleAllShortcuts(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Canvas LMS Tab', key: '1', settingKey: 'tab1' as const },
                    { label: 'Daily Schedule Tab', key: '2', settingKey: 'tab2' as const },
                    { label: 'Assignment Tracker', key: '3', settingKey: 'tab3' as const },
                    { label: 'Gmail AI Scanner', key: '4', settingKey: 'tab4' as const },
                    { label: 'Google Drive Tab', key: '5', settingKey: 'tab5' as const },
                    { label: 'Spotlight Search', key: 'Cmd+K', settingKey: 'search' as const },
                    { label: 'Refresh Data', key: 'R', settingKey: 'sync' as const },
                    { label: 'Exit Zen Focus', key: 'Esc', settingKey: 'esc' as const },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold block text-[#141413] dark:text-[#FAF9F5]">
                          {s.label}
                        </span>
                        <span className="font-mono text-[10px] text-[#D97757] font-bold">
                          [{s.key}]
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shortcutSettings.keys[s.settingKey]}
                        onChange={() => toggleIndividualKey(s.settingKey)}
                        className="w-3.5 h-3.5 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 6: INTEGRATIONS */}
            {activeSection === 'integrations' && (
              <div className="space-y-3">
                {[
                  { name: 'Canvas LMS', desc: 'Sync via iCal calendar URL & token', badge: 'Active', icon: Layers },
                  { name: 'Google Classroom', desc: 'Sync coursework and materials', badge: 'Ready', icon: GraduationCap },
                  { name: 'Moodle LMS', desc: 'Direct iCal and REST endpoints', badge: 'Ready', icon: BookOpen },
                  { name: 'Google NotebookLM', desc: 'AI source binder & study exporter', badge: 'Connected', icon: Bot },
                  { name: 'Canva Studio', desc: 'Direct presentation & slide design bridge', badge: 'Ready', icon: Palette },
                ].map((integ) => {
                  const Icon = integ.icon;
                  return (
                    <div
                      key={integ.name}
                      className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#141413] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-center text-[#D97757]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                            {integ.name}
                          </div>
                          <div className="text-[11px] text-[#8C897F]">{integ.desc}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#D97757]/15 text-[#D97757]">
                        {integ.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
