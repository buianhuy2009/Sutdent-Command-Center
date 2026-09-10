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
  Wrench,
  ArrowLeftRight,
} from 'lucide-react';
import type { SignInDiagnosis } from '../services/firebase';

interface OAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryWorkspaceSignIn: () => void;
  onBasicSignIn: () => void;
  isLoggingIn?: boolean;
  projectId?: string;
  userEmail?: string;
  diagnosis?: SignInDiagnosis | null;
  onRunDiagnostics?: () => { label: string; ok: boolean; hint?: string }[];
  onRedirectSignIn?: () => void;
}

export const OAuthGuideModal: React.FC<OAuthGuideModalProps> = ({
  isOpen,
  onClose,
  onRetryWorkspaceSignIn,
  onBasicSignIn,
  isLoggingIn = false,
  projectId = 'studentcommandcenter-39cdc',
  userEmail = 'buianhuy2009@gmail.com',
  diagnosis = null,
  onRunDiagnostics,
  onRedirectSignIn,
}) => {
  const [activeView, setActiveView] = useState<'all_users' | 'test_user'>('all_users');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [envChecks, setEnvChecks] = useState<{ label: string; ok: boolean; hint?: string }[] | null>(null);

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
      <div className="bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D97757]/15 text-[#D97757] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                Google OAuth Access Configuration
              </h3>
              <p className="text-xs text-[#6B6860] dark:text-[#B5B2A8]">
                Connect Google so your calendar, mail and files show up here — read-only, revoke anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6860] hover:text-[#141413] dark:text-[#B5B2A8] dark:hover:text-[#FAF9F5] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* What actually went wrong (shown when sign-in just failed) */}
        {diagnosis && (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3.5 space-y-1.5" role="alert">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{diagnosis.title}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">{diagnosis.detail}</p>
            <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200"><strong>Fix: </strong>{diagnosis.fix}</p>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-[#FAF9F5] dark:bg-[#252422] rounded-xl">
          <button
            onClick={() => setActiveView('all_users')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeView === 'all_users'
                ? 'bg-white dark:bg-[#1A1917] text-[#D97757] dark:text-[#E8A07E] shadow-xs'
                : 'text-[#6B6860] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Allow ANY Email (Publish App)</span>
          </button>
          <button
            onClick={() => setActiveView('test_user')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeView === 'test_user'
                ? 'bg-white dark:bg-[#1A1917] text-[#D97757] dark:text-[#E8A07E] shadow-xs'
                : 'text-[#6B6860] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Add Specific Test User</span>
          </button>
        </div>

        {/* View 1: Publish App to Allow Any Email */}
        {activeView === 'all_users' && (
          <div className="mt-4 space-y-3">
            <div className="bg-[#D97757]/10 dark:bg-[#D97757]/15 border border-[#D97757]/30 rounded-xl p-3.5 text-xs text-[#141413] dark:text-[#FAF9F5] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-[#D97757] dark:text-[#E8A07E] shrink-0" />
                <span>One-Time Setup: Enable login for every user/email</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#5C5A54] dark:text-[#B5B2A8]">
                Switching your Google Cloud OAuth status from <strong>"Testing"</strong> to <strong>"In production"</strong> allows anyone with any Google account to sign in without adding them to a test list.
              </p>
            </div>

            {/* Steps */}
            <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#252422]/60 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Open OAuth Consent Screen
                </span>
                <a
                  href={consoleConsentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#D97757] hover:bg-[#C86646] text-white rounded-lg transition-colors cursor-pointer"
                >
                  <span>Open Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-[#6B6860] dark:text-[#B5B2A8]">
                Open Google Cloud Console for project <code className="font-mono text-[#5C5A54] dark:text-[#E6E4DC] bg-[#EFECE2] dark:bg-[#252422] px-1 py-0.5 rounded">{projectId}</code>
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#252422]/60 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Click "PUBLISH APP"
                </span>
              </div>
              <p className="text-[11px] text-[#6B6860] dark:text-[#B5B2A8]">
                Under <strong>Publishing status</strong> at the top of the page, click the <strong>PUBLISH APP</strong> button and confirm.
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#252422]/60 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                  How Users Sign In
                </span>
              </div>
              <p className="text-[11px] text-[#6B6860] dark:text-[#B5B2A8] leading-relaxed">
                When any user clicks sign-in, if Google shows <em>"Google hasn't verified this app"</em>, they click <strong>Advanced</strong> → <strong>Go to Student Command Center (unsafe)</strong> → <strong>Continue</strong>. All Google accounts will work!
              </p>
            </div>
          </div>
        )}

        {/* View 2: Add specific test user */}
        {activeView === 'test_user' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#252422]/60 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Add User to Test List
                </span>
                <button
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#EFECE2] dark:bg-[#252422] hover:bg-[#DFDACB] text-[#141413] dark:text-[#FAF9F5] rounded-lg transition-colors cursor-pointer"
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
              <p className="text-[11px] text-[#6B6860] dark:text-[#B5B2A8]">
                In Google Cloud Console under <strong>Test users</strong>, click <strong>+ ADD USERS</strong>, paste the email address, and click <strong>SAVE</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-[#DFDACB] dark:border-[#2C2B27] flex flex-col gap-2 shrink-0">
          <button
            onClick={onRetryWorkspaceSignIn}
            disabled={isLoggingIn}
            className="w-full py-2.5 px-4 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
            <span>{isLoggingIn ? 'Connecting...' : 'Retry Google Workspace Sign-In'}</span>
          </button>

          {onRedirectSignIn && (
            <button
              onClick={onRedirectSignIn}
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#1A1917] hover:bg-[#D97757]/10 text-[#D97757] text-xs font-bold rounded-xl border border-[#D97757]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Redirect sign-in instead (no popup needed)</span>
            </button>
          )}

          <button
            onClick={onBasicSignIn}
            disabled={isLoggingIn}
            className="w-full py-2 px-4 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2B27] text-[#141413] dark:text-[#FAF9F5] text-xs font-semibold rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Sign In with Basic Profile (Instant / No Extra Permissions)</span>
          </button>

          {onRunDiagnostics && (
            <div className="rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden">
              <button
                onClick={() => setEnvChecks(onRunDiagnostics())}
                className="w-full py-2 px-4 text-xs font-semibold text-[#6B6860] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Run connection check</span>
              </button>
              {envChecks && (
                <ul className="px-4 pb-3 space-y-1.5">
                  {envChecks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px]">
                      {c.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                      <span>
                        <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">{c.label}</span>
                        {c.hint && <span className="block text-[#6B6860] dark:text-[#B5B2A8]">{c.hint}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
