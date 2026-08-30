import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  Globe,
} from 'lucide-react';

interface OAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryWorkspaceSignIn: () => void;
  onBasicSignIn: () => void;
  isLoggingIn?: boolean;
  projectId?: string;
  userEmail?: string;
}

export const OAuthGuideModal: React.FC<OAuthGuideModalProps> = ({
  isOpen,
  onClose,
  onRetryWorkspaceSignIn,
  onBasicSignIn,
  isLoggingIn = false,
  projectId = 'studentcommandcenter-39cdc',
  userEmail = 'buianhuy2009@gmail.com',
}) => {
  const [activeView, setActiveView] = useState<'all_users' | 'test_user'>('all_users');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const consoleConsentUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${projectId}`;

  const copyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Google OAuth Access Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allow any email or configure test users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveView('all_users')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeView === 'all_users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Allow ANY Email (Publish App)</span>
          </button>
          <button
            onClick={() => setActiveView('test_user')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeView === 'test_user'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Add Specific Test User</span>
          </button>
        </div>

        {/* View 1: Publish App to Allow Any Email */}
        {activeView === 'all_users' && (
          <div className="mt-4 space-y-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-3.5 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>One-Time Setup: Enable login for every user/email</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
                Switching your Google Cloud OAuth status from <strong>"Testing"</strong> to <strong>"In production"</strong> allows anyone with any Google account to sign in without adding them to a test list.
              </p>
            </div>

            {/* Steps */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Open OAuth Consent Screen
                </span>
                <a
                  href={consoleConsentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <span>Open Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Open Google Cloud Console for project <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{projectId}</code>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Click "PUBLISH APP"
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Under <strong>Publishing status</strong> at the top of the page, click the <strong>PUBLISH APP</strong> button and confirm.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  How Users Sign In
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                When any user clicks sign-in, if Google shows <em>"Google hasn't verified this app"</em>, they click <strong>Advanced</strong> → <strong>Go to Student Command Center (unsafe)</strong> → <strong>Continue</strong>. All Google accounts will work!
              </p>
            </div>
          </div>
        )}

        {/* View 2: Add specific test user */}
        {activeView === 'test_user' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Add User to Test List
                </span>
                <button
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                In Google Cloud Console under <strong>Test users</strong>, click <strong>+ ADD USERS</strong>, paste the email address, and click <strong>SAVE</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0">
          <button
            onClick={onRetryWorkspaceSignIn}
            disabled={isLoggingIn}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
            <span>{isLoggingIn ? 'Connecting...' : 'Retry Google Workspace Sign-In'}</span>
          </button>

          <button
            onClick={onBasicSignIn}
            disabled={isLoggingIn}
            className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sign In with Basic Profile (Instant / No Extra Permissions)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
