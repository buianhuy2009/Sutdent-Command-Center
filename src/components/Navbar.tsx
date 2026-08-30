import React, { useState } from 'react';
import {
  Compass,
  CheckSquare,
  FileText,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Keyboard,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Shield,
  Zap,
  Plus,
  Mail,
  Globe,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onToggleAiChat: () => void;
  onOpenNewAssignment?: () => void;
  onOpenDeploymentGuide?: () => void;
  onOpenOAuthGuide?: () => void;
  sheetUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isDemoMode,
  setIsDemoMode,
  onGoogleSignIn,
  onLogout,
  isLoggingIn,
  darkMode,
  setDarkMode,
  onRefreshAll,
  isRefreshing,
  onOpenCommandPalette,
  onOpenShortcuts,
  onToggleAiChat,
  onOpenNewAssignment,
  onOpenDeploymentGuide,
  onOpenOAuthGuide,
  sheetUrl,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: 'canvas', label: 'Canvas LMS', icon: Layers, badge: 'Hub' },
    { id: 'radar', label: 'Daily Schedule', icon: Compass, badge: 'Today' },
    { id: 'gmail', label: 'Gmail Scanner', icon: Mail, badge: 'AI Radar' },
    { id: 'tracker', label: 'Assignment Tracker', icon: CheckSquare, badge: 'Live Sheets' },
    { id: 'projects', label: 'Project Starter', icon: FileText, badge: 'Docs & Files' },
  ];

  return (
    <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shadow-xs z-20 shrink-0 transition-colors">
      {/* Left: Brand & Connection Status */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        {/* Mobile App Icon */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/30 md:hidden shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>

        <div className="flex items-center space-x-3 truncate">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            Command Center
          </h1>
          <div className="h-5 sm:h-6 w-[1px] bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />
          
          {/* Status Indicator */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 items-center shrink-0 hidden sm:flex">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                <span>Live Sync Active</span>
              </span>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={isLoggingIn}
              className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/80 items-center shrink-0 transition-colors hidden sm:flex cursor-pointer"
              title="Connect your Google Account to enable live Sheets, Drive, Gmail, & Calendar sync"
            >
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2" />
              <span>Connect Google Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Quick Search, New Assignment, and Action Buttons */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Quick search input */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            readOnly
            onClick={onOpenCommandPalette}
            placeholder="Quick search (⌘+K)..."
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-4 pr-10 text-sm w-48 xl:w-64 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 cursor-pointer placeholder:text-slate-400"
          />
          <span className="absolute right-3 top-2 text-slate-400 text-xs font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ⌘K
          </span>
        </div>

        {/* New Assignment Primary Action */}
        <button
          id="btn-nav-new-assignment"
          onClick={onOpenNewAssignment || onOpenCommandPalette}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Assignment</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Master Sheet Link */}
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
            title="Open Master Google Sheet"
          >
            <span>Master Sheet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* AI Study Coach Button */}
        <button
          id="btn-nav-ai-coach"
          onClick={onToggleAiChat}
          className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
          title="Open AI Study Coach"
        >
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="hidden md:inline">AI Coach</span>
        </button>

        {/* Sync / Refresh Button */}
        <button
          id="btn-nav-refresh-all"
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Sync all data (R)"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="btn-nav-theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Dark Mode (D)"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Shortcuts Cheat-sheet */}
        <button
          id="btn-nav-shortcuts"
          onClick={onOpenShortcuts}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Vercel Deployment Guide */}
        {onOpenDeploymentGuide && (
          <button
            id="btn-nav-deploy-guide"
            onClick={onOpenDeploymentGuide}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Vercel Deployment & Integrations Guide"
          >
            <Globe className="w-4 h-4" />
          </button>
        )}

        {/* Auth / Account Profile Button */}
        {user ? (
          <div className="relative">
            <button
              id="btn-nav-user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {(user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="max-w-[70px] truncate hidden md:inline">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Student'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="px-2 py-1 space-y-0.5">
                  {onOpenOAuthGuide && (
                    <button
                      onClick={() => {
                        onOpenOAuthGuide();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <span>OAuth Test Users Setup</span>
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  )}
                  {onOpenDeploymentGuide && (
                    <button
                      onClick={() => {
                        onOpenDeploymentGuide();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <span>Vercel Integration Guide</span>
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsDemoMode(!isDemoMode);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <span>Switch to {isDemoMode ? 'Live Workspace' : 'Demo Mode'}</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-2">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect Account
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            id="btn-nav-google-signin"
            onClick={onGoogleSignIn}
            disabled={isLoggingIn}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xs transition-all shrink-0"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="hidden sm:inline">{isLoggingIn ? 'Connecting...' : 'Sign In'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
