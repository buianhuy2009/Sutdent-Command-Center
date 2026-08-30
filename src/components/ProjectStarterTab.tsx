import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  RefreshCw,
  Folder,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Copy,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { CreateDocParams, SchoolFile, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';

interface ProjectStarterTabProps {
  recentFiles: SchoolFile[];
  isLoadingFiles: boolean;
  onRefreshFiles: () => void;
  onCreateDoc: (params: CreateDocParams) => Promise<string | null>;
  isCreatingDoc: boolean;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  driveError?: string | null;
  driveApiInfo?: ApiEnablementInfo | null;
  onOpenActivationModal?: (info: ApiEnablementInfo) => void;
}

export const ProjectStarterTab: React.FC<ProjectStarterTabProps> = ({
  recentFiles,
  isLoadingFiles,
  onRefreshFiles,
  onCreateDoc,
  isCreatingDoc,
  isGoogleConnected = true,
  onConnectGoogle,
  driveError,
  driveApiInfo,
  onOpenActivationModal,
}) => {
  // Create Doc Form State
  const [docTitle, setDocTitle] = useState('');
  const [docSubject, setDocSubject] = useState('AP US History');
  const [formatStyle, setFormatStyle] = useState<'MLA' | 'APA' | 'Academic Standard'>('MLA');
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [objectives, setObjectives] = useState(
    '1. Analyze primary and secondary source arguments with critical context.\n2. Develop a defensible thesis statement with structured evidentiary paragraphs.\n3. Follow formal academic citation guidelines.'
  );
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Synthesize core thesis & prompt guidelines',
    'Compile at least 4 verified references / citations',
    'Draft body paragraphs with textual evidence',
    'Self-review against rubric standards',
    'Final proofread and bibliography formatting',
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklistItems([...checklistItems, newChecklistText.trim()]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const url = await onCreateDoc({
      title: docTitle.trim(),
      subject: docSubject.trim(),
      formatStyle,
      teacherName: teacherName.trim() || undefined,
      studentName: studentName.trim() || undefined,
      objectives: objectives.trim(),
      checklist: checklistItems,
    });

    if (url) {
      setCreatedDocUrl(url);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getFileBadge = (mimeType: string) => {
    if (mimeType.includes('document') || mimeType.includes('docx')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Google Doc
        </span>
      );
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Google Sheet
        </span>
      );
    }
    if (mimeType.includes('presentation') || mimeType.includes('slides')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Google Slide
        </span>
      );
    }
    if (mimeType.includes('pdf')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          PDF File
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Drive File
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Section: Recent Google Drive & School Files */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider">
              Recent Google Drive Files
            </h2>
            {isGoogleConnected && recentFiles.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {recentFiles.length} Live Files
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshFiles}
              disabled={isLoadingFiles}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Refresh Google Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <span>Drive Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* API Disabled or Error Alert if Drive API failed */}
        {driveApiInfo ? (
          <div className="mt-4">
            <ApiActivationBanner
              info={driveApiInfo}
              onRetry={onRefreshFiles}
              isRetrying={isLoadingFiles}
            />
          </div>
        ) : driveError ? (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{driveError}</span>
            </div>
            {onConnectGoogle && (
              <button
                onClick={onConnectGoogle}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer text-xs"
              >
                Reconnect Drive
              </button>
            )}
          </div>
        ) : null}

        {/* Files Cards */}
        <div className="mt-4">
          {!isGoogleConnected ? (
            <div className="py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Folder className="w-10 h-10 mx-auto text-indigo-500 mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Workspace Disconnected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Connect your Google account with Drive permissions to see and sync all your Google Docs, Sheets, and files live.
              </p>
              {onConnectGoogle && (
                <button
                  onClick={onConnectGoogle}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Connect Google Account</span>
                </button>
              )}
            </div>
          ) : isLoadingFiles ? (
            <div className="py-10 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-medium">Scanning Google Drive for recent documents...</p>
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Recent Documents Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create a new document below or in Google Docs, and click refresh to sync.
              </p>
              <button
                onClick={onRefreshFiles}
                className="mt-3 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Drive</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  id={`recent-file-${file.id}`}
                  className="group relative bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-3 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      {getFileBadge(file.mimeType)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRelativeTime(file.modifiedTime)}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {file.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{file.size || 'Google Cloud'}</span>
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Section: "Create Assignment Doc" Studio */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider">
              Project Doc Starter Studio
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
            MLA / APA Formatted
          </span>
        </div>

        {/* Success Banner if Doc Created */}
        {createdDocUrl && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Google Doc Generated Successfully!
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Your formatted document is live in your Google Drive.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={createdDocUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open in Google Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
          {/* Row 1: Title & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assignment Title *
              </label>
              <input
                id="input-doc-title"
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Cold War DBQ: Geopolitics & Foreign Policy 1945-1975"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Course *
              </label>
              <input
                id="input-doc-subject"
                type="text"
                required
                value={docSubject}
                onChange={(e) => setDocSubject(e.target.value)}
                placeholder="e.g. AP US History"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Row 2: Format Style, Teacher Name, Student Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Academic Formatting Style
              </label>
              <select
                value={formatStyle}
                onChange={(e) => setFormatStyle(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium"
              >
                <option value="MLA">MLA 9th Edition (Standard)</option>
                <option value="APA">APA 7th Edition (Running Head)</option>
                <option value="Academic Standard">Clean Academic Header</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructor / Teacher Name
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Dr. Rebecca Vance"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          {/* Row 3: Objectives */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              I. Objectives & Requirements (Pre-formatted in Doc)
            </label>
            <textarea
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Outline the core targets and prompt rules..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Row 4: Checklist Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              II. Action Checklist Builder
            </label>

            {/* Checklist Items list */}
            <div className="space-y-2 mb-3">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 truncate">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add custom milestone step (e.g. 'Draft bibliography')..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer"
              >
                + Add Step
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              id="btn-submit-create-doc"
              type="submit"
              disabled={isCreatingDoc || !docTitle.trim()}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isCreatingDoc ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Google Doc in Drive...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Assignment Doc in Drive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
