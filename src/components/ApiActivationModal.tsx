import React from 'react';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  FileSpreadsheet,
  Calendar,
  Mail,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ApiEnablementInfo } from '../types';

interface ApiActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: ApiEnablementInfo | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

const WORKSPACE_APIS = [
  {
    name: 'Google Drive API',
    id: 'drive.googleapis.com',
    icon: FolderOpen,
    desc: 'Browse, sync, and access files in Google Drive',
    url: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${(import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267'}`,
  },
  {
    name: 'Google Docs API',
    id: 'docs.googleapis.com',
    icon: FileText,
    desc: 'Auto-generate MLA/APA formatted project starters',
    url: `https://console.developers.google.com/apis/api/docs.googleapis.com/overview?project=${(import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267'}`,
  },
  {
    name: 'Google Sheets API',
    id: 'sheets.googleapis.com',
    icon: FileSpreadsheet,
    desc: 'Master Assignment Tracker two-way live spreadsheet sync',
    url: `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=${(import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267'}`,
  },
  {
    name: 'Google Calendar API',
    id: 'calendar-json.googleapis.com',
    icon: Calendar,
    desc: 'Schedule study blocks and sync daily deadlines',
    url: `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${(import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267'}`,
  },
  {
    name: 'Gmail API',
    id: 'gmail.googleapis.com',
    icon: Mail,
    desc: 'AI academic email scanner and teacher draft composer',
    url: `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${(import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267'}`,
  },
];

export const ApiActivationModal: React.FC<ApiActivationModalProps> = ({
  isOpen,
  onClose,
  info,
  onRetry,
  isRetrying = false,
}) => {
  if (!isOpen) return null;

  const projectId = info?.projectId || (import.meta as any).env?.VITE_GOOGLE_PROJECT_ID || '614024702267';
  const targetService = info?.serviceName || 'Google Drive API';
  const primaryActivationUrl =
    info?.activationUrl ||
    `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${projectId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="api-activation-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Enable {targetService} in Google Cloud
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Google Cloud Project ID: <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{projectId}</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Quick Summary Banner */}
          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Why is this required?</span>
            </div>
            <p className="leading-relaxed">
              Google Cloud requires each Workspace API to be enabled on your developer project before the app can read or create files. You only need to do this <strong>once</strong>.
            </p>
          </div>

          {/* 3 Simple Steps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              How to fix in 30 seconds
            </h4>
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Open Google Cloud Console
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Click the primary button below to visit the {targetService} page for project <code>{projectId}</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Click the blue &quot;ENABLE&quot; button
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    In the Google Cloud page that opens, click the <strong>&quot;ENABLE&quot;</strong> button at the top.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Return here and click Retry
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Give Google 30-60 seconds to propagate, then click &quot;Retry Sync&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-1">
            <a
              id="btn-open-cloud-console"
              href={primaryActivationUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Enable {targetService} in Cloud Console</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Enable All Workspace APIs list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Enable All Student Workspace APIs (Recommended)
              </h4>
              <span className="text-[10px] text-slate-400">1-click direct links</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WORKSPACE_APIS.map((api) => {
                const Icon = api.icon;
                const isCurrent = targetService.toLowerCase().includes(api.name.toLowerCase());
                return (
                  <a
                    key={api.id}
                    href={api.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs group ${
                      isCurrent
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {api.name}
                      </span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>I&apos;ve Enabled It — Retry Sync</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
