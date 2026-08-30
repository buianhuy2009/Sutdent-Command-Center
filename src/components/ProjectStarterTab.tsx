import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  RefreshCw,
  Folder,
  CheckCircle2,
  Sparkles,
  Trash2,
  Search,
  Layers,
  X,
  AlertTriangle,
} from 'lucide-react';
import { CreateDocParams, SchoolFile, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';
import { shareGoogleDriveFile } from '../services/googleWorkspace';

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
  googleToken?: string;
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
  googleToken,
}) => {
  // Create Doc Form State - clean defaults (no pre-filled dummy content)
  const [docTitle, setDocTitle] = useState('');
  const [docSubject, setDocSubject] = useState('');
  const [formatStyle, setFormatStyle] = useState<'MLA' | 'APA' | 'Academic Standard'>('MLA');
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [objectives, setObjectives] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Lightbox Modal state
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; id?: string } | null>(null);

  // Drive files categorization & search
  const [fileCategory, setFileCategory] = useState<'ALL' | 'DOCS' | 'SHEETS' | 'SLIDES' | 'PDF'>('ALL');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

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
      subject: docSubject.trim() || 'General',
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

  // Drive Categorization Counts
  const docsCount = useMemo(
    () => recentFiles.filter((f) => f.mimeType.includes('document') || f.mimeType.includes('docx')).length,
    [recentFiles]
  );
  const sheetsCount = useMemo(
    () => recentFiles.filter((f) => f.mimeType.includes('spreadsheet') || f.mimeType.includes('sheet')).length,
    [recentFiles]
  );
  const slidesCount = useMemo(
    () => recentFiles.filter((f) => f.mimeType.includes('presentation') || f.mimeType.includes('slides')).length,
    [recentFiles]
  );
  const pdfCount = useMemo(
    () => recentFiles.filter((f) => f.mimeType.includes('pdf')).length,
    [recentFiles]
  );

  // Categorized & Filtered files
  const filteredFiles = useMemo(() => {
    return recentFiles.filter((file) => {
      const isDoc = file.mimeType.includes('document') || file.mimeType.includes('docx');
      const isSheet = file.mimeType.includes('spreadsheet') || file.mimeType.includes('sheet');
      const isSlide = file.mimeType.includes('presentation') || file.mimeType.includes('slides');
      const isPdf = file.mimeType.includes('pdf');

      if (fileCategory === 'DOCS' && !isDoc) return false;
      if (fileCategory === 'SHEETS' && !isSheet) return false;
      if (fileCategory === 'SLIDES' && !isSlide) return false;
      if (fileCategory === 'PDF' && !isPdf) return false;

      if (fileSearchQuery.trim()) {
        const q = fileSearchQuery.toLowerCase();
        if (!file.name.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [recentFiles, fileCategory, fileSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Section: Recent Google Drive Files with Category Organization */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider">
              Google Drive Files
            </h2>
            {isGoogleConnected && recentFiles.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {recentFiles.length} Total
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshFiles}
              disabled={isLoadingFiles}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Open Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* API Disabled or Error Banner */}
        {driveApiInfo ? (
          <div className="mt-4">
            <ApiActivationBanner
              info={driveApiInfo}
              onRetry={onRefreshFiles}
              isRetrying={isLoadingFiles}
            />
          </div>
        ) : driveError ? (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
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

        {/* Category Filter Tabs & Search Bar */}
        {isGoogleConnected && recentFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'All Files', count: recentFiles.length },
                  { id: 'DOCS', label: 'Docs', count: docsCount },
                  { id: 'SHEETS', label: 'Sheets', count: sheetsCount },
                  { id: 'SLIDES', label: 'Slides', count: slidesCount },
                  { id: 'PDF', label: 'PDFs', count: pdfCount },
                ].map((tab) => {
                  const isActive = fileCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFileCategory(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search bar */}
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter Drive files..."
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Files Cards */}
        <div className="mt-4">
          {!isGoogleConnected ? (
            <div className="py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Folder className="w-10 h-10 mx-auto text-indigo-500 mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Workspace Disconnected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Connect your Google account with Drive permissions to view and categorize your school documents live.
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
          ) : filteredFiles.length === 0 ? (
            <div className="py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {fileSearchQuery ? `No files match "${fileSearchQuery}"` : 'No files in this category'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create a new document below or in Google Docs, and click refresh to sync.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredFiles.map((file) => (
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
                    <button
                      onClick={() => setPreviewFile({ name: file.name, url: file.webViewLink, id: file.id })}
                      className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      <span>Preview</span>
                      <Layers className="w-3.5 h-3.5" />
                    </button>
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
                placeholder="e.g. AP US History, Physics, Literature..."
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
              placeholder="List key objectives or rubric requirements (optional)..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Row 4: Checklist Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              II. Action Checklist Builder
            </label>

            {/* Checklist Items list */}
            {checklistItems.length === 0 ? (
              <div className="py-4 px-3 mb-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500">
                No milestone steps added yet. Add custom milestone steps below.
              </div>
            ) : (
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
            )}

            {/* Add Step Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newChecklistText.trim()) {
                      setChecklistItems([...checklistItems, newChecklistText.trim()]);
                      setNewChecklistText('');
                    }
                  }
                }}
                placeholder="Add custom milestone step (e.g. 'Draft bibliography')..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isCreatingDoc || !docTitle.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isCreatingDoc ? 'Formatting & Generating Doc...' : 'Generate Google Doc'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Dynamic Lightbox Doc Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Lightbox Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" viewBox="0 0 24 24">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4" />
                </svg>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                  Preview: {previewFile.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Permission Fallback UI (displayed at top of iframe) */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 px-4 py-2 text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  Is the preview blank? Google restricts embedding for unauthorized accounts.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    if (previewFile.id && googleToken) {
                      try {
                        await shareGoogleDriveFile(googleToken, previewFile.id);
                        alert('Successfully shared! Refreshing preview...');
                        // Force refresh preview by rebuilding URL
                        setPreviewFile({ ...previewFile });
                      } catch (e: any) {
                        alert('Sharing failed: ' + (e.message || e));
                      }
                    } else {
                      alert('Please connect Google Account to auto-share.');
                    }
                  }}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Auto-Share File
                </button>
                <a
                  href="https://accounts.google.com/SignOutOptions"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-amber-900 dark:hover:text-amber-200"
                >
                  Switch Account
                </a>
              </div>
            </div>

            {/* Embedded IFrame */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative">
              <iframe
                src={previewFile.url.replace('/edit', '/preview')}
                className="absolute inset-0 w-full h-full border-0"
                title={previewFile.name}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
