import React, { useState } from "react";
import {
  X,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Link2,
  Unlink,
  Calendar,
  Mail,
  Table,
  HardDrive,
  GraduationCap,
  Key,
} from "lucide-react";
import { AppLogo } from "./AppLogo";
import { setStoredGoogleToken } from "../services/firebase";

interface GoogleSyncHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  hasGoogleToken: boolean;
  isSyncing: boolean;
  onSyncAll: () => Promise<void>;
  onConnectGoogle: () => Promise<void>;
  onDisconnectGoogle: () => void;
  calendarEventsCount?: number;
  emailCount?: number;
  schoolFilesCount?: number;
  sheetUrl?: string;
  onSyncSheet?: () => Promise<void>;
  isSyncingSheet?: boolean;
}

export const GoogleSyncHubModal: React.FC<GoogleSyncHubModalProps> = ({
  isOpen,
  onClose,
  user,
  hasGoogleToken,
  isSyncing,
  onSyncAll,
  onConnectGoogle,
  onDisconnectGoogle,
  calendarEventsCount = 0,
  emailCount = 0,
  schoolFilesCount = 0,
  sheetUrl,
  onSyncSheet,
  isSyncingSheet = false,
}) => {
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isSavingManualToken, setIsSavingManualToken] = useState(false);

  if (!isOpen) return null;

  const handleSaveManualToken = async () => {
    if (!manualToken.trim()) return;
    setIsSavingManualToken(true);
    try {
      setStoredGoogleToken(manualToken.trim());
      await onSyncAll();
      setShowManualToken(false);
      setManualToken("");
    } finally {
      setIsSavingManualToken(false);
    }
  };

  const services = [
    {
      id: "sheets",
      name: "Google Sheets",
      appId: "tracker",
      description: "Auto-sync master assignments, deadlines, status, and course tracking.",
      status: hasGoogleToken ? "Connected" : "Disconnected",
      stat: sheetUrl ? "Spreadsheet Linked" : "Auto-created on sync",
      action: onSyncSheet,
      isActionLoading: isSyncingSheet,
      actionLabel: "Sync Sheet",
      externalUrl: sheetUrl,
      externalLabel: "Open Sheet",
    },
    {
      id: "calendar",
      name: "Google Calendar",
      appId: "radar",
      description: "Class timetable, lecture alerts, and study schedule blocks.",
      status: hasGoogleToken ? "Connected" : "Disconnected",
      stat: hasGoogleToken ? `${calendarEventsCount} events synced` : "Ready to link",
      externalUrl: "https://calendar.google.com",
      externalLabel: "Open Calendar",
    },
    {
      id: "gmail",
      name: "Gmail Academic",
      appId: "gmail",
      description: "Scans instructor announcements, due dates, quizzes, and grading notes.",
      status: hasGoogleToken ? "Connected" : "Disconnected",
      stat: hasGoogleToken ? `${emailCount} academic emails` : "Ready to link",
      externalUrl: "https://mail.google.com",
      externalLabel: "Open Gmail",
    },
    {
      id: "drive",
      name: "Google Drive & Docs",
      appId: "drive",
      description: "Recent syllabus, lecture slides, assignment documents, and lab PDFs.",
      status: hasGoogleToken ? "Connected" : "Disconnected",
      stat: hasGoogleToken ? `${schoolFilesCount} school files` : "Ready to link",
      externalUrl: "https://drive.google.com",
      externalLabel: "Open Drive",
    },
    {
      id: "classroom",
      name: "Google Classroom",
      appId: "classroom",
      description: "Enrolled courses, active student coursework, and teacher posts.",
      status: hasGoogleToken ? "Connected" : "Disconnected",
      stat: hasGoogleToken ? "Coursework synced" : "Ready to link",
      externalUrl: "https://classroom.google.com",
      externalLabel: "Open Classroom",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-sync-hub-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FAF9F5] dark:bg-[#141413] border border-[#DFDACB] dark:border-[#2C2B27] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-white/60 dark:bg-[#1A1917]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-center shadow-xs">
              <AppLogo id="drive" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="google-sync-hub-title" className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Google Workspace Sync Hub
                </h2>
                {hasGoogleToken ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6860] dark:text-[#B5B2A8] mt-0.5">
                {user?.email ? `Connected as ${user.email}` : "Connect your Google account to sync all channels"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B6860] hover:text-[#141413] dark:text-[#B5B2A8] dark:hover:text-[#FAF9F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Banner */}
        <div className="px-6 py-3 bg-[#D97757]/10 dark:bg-[#D97757]/15 border-b border-[#D97757]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#141413] dark:text-[#FAF9F5]">
            <Sparkles className="w-4 h-4 text-[#D97757]" />
            <span>Bi-directional real-time sync with Google ecosystem</span>
          </div>

          <div className="flex items-center gap-2">
            {hasGoogleToken ? (
              <>
                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D97757] hover:bg-[#C86646] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing All..." : "Sync All Channels"}
                </button>
                <button
                  onClick={onDisconnectGoogle}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1"
                  title="Disconnect Google account"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#D97757] hover:bg-[#C86646] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect Google Account
              </button>
            )}
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-4 transition-all hover:border-[#D97757]/40 hover:shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AppLogo id={svc.appId} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                      {svc.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hasGoogleToken
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {svc.stat}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6860] dark:text-[#B5B2A8] truncate mt-0.5">
                    {svc.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {svc.action && (
                  <button
                    onClick={svc.action}
                    disabled={svc.isActionLoading || !hasGoogleToken}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF9F5] dark:bg-[#262523] hover:bg-[#DFDACB]/50 dark:hover:bg-[#383632] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${svc.isActionLoading ? "animate-spin text-[#D97757]" : ""}`} />
                    {svc.isActionLoading ? "Syncing..." : svc.actionLabel}
                  </button>
                )}

                {svc.externalUrl && (
                  <a
                    href={svc.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#6B6860] hover:text-[#141413] dark:text-[#B5B2A8] dark:hover:text-[#FAF9F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                    title={svc.externalLabel}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Manual Access Token / Power User Option */}
          <div className="pt-2 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <button
              onClick={() => setShowManualToken(!showManualToken)}
              className="text-[11px] font-semibold text-[#6B6860] hover:text-[#D97757] flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showManualToken ? "Hide Manual Token Entry" : "Manual Token / Power User Setup"}</span>
            </button>

            {showManualToken && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] space-y-2 text-xs">
                <p className="text-[11px] text-[#6B6860]">
                  Paste a valid Google OAuth Bearer access token to connect or refresh sync instantly:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="ya29.a0AfH6..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] font-mono text-xs outline-none focus:border-[#D97757]"
                  />
                  <button
                    onClick={handleSaveManualToken}
                    disabled={isSavingManualToken || !manualToken.trim()}
                    className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    {isSavingManualToken ? "Saving..." : "Save & Sync"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5]/80 dark:bg-[#141413]/80 flex items-center justify-between text-xs text-[#6B6860] dark:text-[#B5B2A8]">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Auto-sync occurs in the background every 60 seconds</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
