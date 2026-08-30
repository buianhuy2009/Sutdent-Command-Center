import React from 'react';
import { User } from 'firebase/auth';
import {
  X,
  User as UserIcon,
  Moon,
  Sun,
  RefreshCw,
  ExternalLink,
  Keyboard,
  Globe,
  Shield,
  LogOut,
  LogIn,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

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
  onOpenShortcuts: () => void;
  onOpenDeploymentGuide?: () => void;
  onOpenOAuthGuide?: () => void;
  onOpenTour?: () => void;
}

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
  onOpenShortcuts,
  onOpenDeploymentGuide,
  onOpenOAuthGuide,
  onOpenTour,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF9F6] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Account & Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your profile, sync, and display preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* User Profile Card */}
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
                  {user ? (user.displayName || user.email || 'S').charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user ? user.displayName || 'Signed In Student' : 'Guest Account'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'Sign in with Google to sync school data'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {user ? 'Google Workspace Connected' : 'Local Offline Mode'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {user ? (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800/80 cursor-pointer"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Theme & Display Settings */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
              Appearance
            </h5>
            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">
                    Theme Mode
                  </h6>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {darkMode ? 'Comfortable elevated dark slate' : '#FAF9F6 anti-eyestrain linen'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                {darkMode ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>

          {/* Sync & Workspace Integration */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
              Data & Integrations
            </h5>
            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              {sheetUrl && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-xs font-semibold text-slate-900 dark:text-white">Master Google Sheet</h6>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Synced bi-directional checklist</p>
                    </div>
                  </div>
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <h6 className="text-xs font-semibold text-slate-900 dark:text-white">Sync All Services</h6>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Fetch latest Canvas, Calendar, & Gmail updates</p>
                </div>
                <button
                  onClick={onRefreshAll}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Workspace (R)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Help Guides */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
              Help & Tools
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenShortcuts();
                  onClose();
                }}
                className="p-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
              >
                <Keyboard className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h6>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Press ? anytime</p>
                </div>
              </button>

              {onOpenTour && (
                <button
                  onClick={() => {
                    onOpenTour();
                    onClose();
                  }}
                  className="p-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white">App Walkthrough</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Quick feature tour</p>
                  </div>
                </button>
              )}

              {onOpenOAuthGuide && (
                <button
                  onClick={() => {
                    onOpenOAuthGuide();
                    onClose();
                  }}
                  className="p-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white">OAuth Test Users</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Invite Gmail accounts</p>
                  </div>
                </button>
              )}

              {onOpenDeploymentGuide && (
                <button
                  onClick={() => {
                    onOpenDeploymentGuide();
                    onClose();
                  }}
                  className="p-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white">Deployment Guide</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Vercel & Domain setup</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Student Command Center v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
