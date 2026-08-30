import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  FileText,
  Key,
  Globe,
  Search,
  Calendar,
  AlertTriangle,
  CheckSquare,
  FolderOpen,
  UploadCloud,
  Filter,
  MoreVertical,
  SlidersHorizontal,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CanvasAssignment, CanvasSettings } from '../types';
import { loadCompletedCanvasIds, saveCompletedCanvasIds, resolveCanvasUrl, toMobileDeepLink } from '../services/canvas';
import { extractSubtasksFromCanvas, SubtaskResult } from '../services/gemini';

interface CanvasSyncTabProps {
  settings: CanvasSettings;
  onSaveSettings: (settings: CanvasSettings) => void;
  canvasAssignments: CanvasAssignment[];
  isLoading: boolean;
  errorMessage?: string | null;
  lastSyncedAt?: Date | null;
  onFetchCanvas: () => void;
  onSyncToSheet: (assignment: CanvasAssignment) => Promise<void>;
  onSyncAllPending: () => Promise<void>;
  recentFiles?: any[];
  isGoogleConnected?: boolean;
  onSubmitAssignment?: (assignment: CanvasAssignment, fileId: string) => Promise<void>;
}

export const CanvasSyncTab: React.FC<CanvasSyncTabProps> = ({
  settings,
  onSaveSettings,
  canvasAssignments,
  isLoading,
  errorMessage,
  lastSyncedAt,
  onFetchCanvas,
  onSyncToSheet,
  onSyncAllPending,
  recentFiles = [],
  isGoogleConnected = true,
  onSubmitAssignment,
}) => {
  const [feedUrl, setFeedUrl] = useState(settings.calendarFeedUrl || '');
  const [apiDomain, setApiDomain] = useState(settings.apiDomain || 'https://canvas.instructure.com');
  const [apiToken, setApiToken] = useState(settings.apiToken || '');
  const [autoSync, setAutoSync] = useState(settings.autoSync ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Completion state loaded from local storage
  const [completedIds, setCompletedIds] = useState<string[]>(() => loadCompletedCanvasIds());

  // Tabs: 'UNFINISHED' (default on open), 'ALL', 'FINISHED'
  const [activeTab, setActiveTab] = useState<string>('UNFINISHED');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // AI Sub-task Extractor state
  const [subtaskData, setSubtaskData] = useState<Record<string, SubtaskResult>>({});
  const [extractingIds, setExtractingIds] = useState<Record<string, boolean>>({});
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<Set<string>>(new Set());
  const [checkedSubtasks, setCheckedSubtasks] = useState<Record<string, Set<number>>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Google Drive submission state variables
  const [expandedSubmitId, setExpandedSubmitId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = {
      calendarFeedUrl: feedUrl.trim(),
      apiDomain: apiDomain.trim(),
      apiToken: apiToken.trim(),
      autoSync,
      lastSyncedAt: new Date().toISOString(),
    };
    onSaveSettings(updated);
    setTimeout(() => {
      setIsSaving(false);
      onFetchCanvas();
      setShowSettingsDrawer(false);
    }, 300);
  };

  const handleToggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const arr = Array.from(set);
      saveCompletedCanvasIds(arr);
      return arr;
    });
  };

  // Distinct courses
  const courses = useMemo(() => {
    const set = new Set<string>();
    canvasAssignments.forEach((a) => {
      if (a.courseName) set.add(a.courseName);
    });
    return Array.from(set);
  }, [canvasAssignments]);

  const unfinishedCount = useMemo(() => {
    return canvasAssignments.filter((a) => !a.isCompleted && !completedIds.includes(a.id)).length;
  }, [canvasAssignments, completedIds]);

  const finishedCount = useMemo(() => {
    return canvasAssignments.filter((a) => a.isCompleted || completedIds.includes(a.id)).length;
  }, [canvasAssignments, completedIds]);

  const pendingSyncAssignments = canvasAssignments.filter((a) => !a.isSynced);

  // Filtered assignments based on activeTab (UNFINISHED by default) & selectedCourse
  const filteredAssignments = useMemo(() => {
    return canvasAssignments.filter((item) => {
      const isDone = item.isCompleted || completedIds.includes(item.id);

      if (activeTab === 'UNFINISHED') {
        if (isDone) return false;
      } else if (activeTab === 'FINISHED') {
        if (!isDone) return false;
      }

      if (selectedCourse !== 'ALL' && item.courseName !== selectedCourse) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCourse = item.courseName.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCourse && !matchDesc) return false;
      }

      return true;
    });
  }, [canvasAssignments, completedIds, activeTab, selectedCourse, searchQuery]);

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await onSyncAllPending();
    } finally {
      setIsSyncingAll(false);
    }
  };

  const isConfigured = Boolean(settings.calendarFeedUrl || settings.apiToken);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Clean Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Canvas LMS
              </h2>
              {isConfigured && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded-full">
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Synced coursework, assignments, and quizzes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{showSettingsDrawer ? 'Close Settings' : 'Settings'}</span>
          </button>

          <button
            id="btn-fetch-canvas-feed"
            onClick={onFetchCanvas}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Feed'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Canvas Connection Alert</p>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Edit Feed URL
            </button>
            <button
              onClick={onFetchCanvas}
              disabled={isLoading}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <section className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
            Canvas LMS Connection Configuration
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Option A: Canvas Calendar Feed URL (.ics / webcal://)
              </label>
              <input
                type="text"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="webcal://canvas.instructure.com/feeds/calendars/user_...ics"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Found on Canvas ➔ Calendar ➔ Calendar Feed (bottom right of screen).
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Option B: Canvas API Access Token (Recommended for Auto-Submitted Detection)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 rounded-md">
                  Auto-Detects Done Tasks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Connecting with your API token automatically detects which assignments you have submitted or completed on Canvas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Canvas Domain / School URL
                  </label>
                  <input
                    type="text"
                    value={apiDomain}
                    onChange={(e) => setApiDomain(e.target.value)}
                    placeholder="https://canvas.instructure.com"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Canvas API Access Token
                  </label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Canvas -> Account -> Settings -> New Access Token"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save & Sync Canvas'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Streamlined Status & Filter Bar */}
      {(isConfigured || canvasAssignments.length > 0) && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Primary Status Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('UNFINISHED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'UNFINISHED'
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                <span>Unfinished</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                  activeTab === 'UNFINISHED' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
                }`}>
                  {unfinishedCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-[#141413] text-white dark:bg-[#FAF9F5] dark:text-[#141413] shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                  activeTab === 'ALL' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#141413]' : 'bg-black/5 dark:bg-white/10'
                }`}>
                  {canvasAssignments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('FINISHED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'FINISHED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                <span>Finished</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                  activeTab === 'FINISHED' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
                }`}>
                  {finishedCount}
                </span>
              </button>
            </div>

            {/* Right Controls: Subject Dropdown + Filter & Search Toggle */}
            <div className="flex items-center gap-2">
              {/* Clean Subject Dropdown (replaces wrapping pills) */}
              {courses.length > 0 && (
                <div className="flex items-center gap-1">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] cursor-pointer outline-none focus:ring-1 focus:ring-[#D97757] max-w-[180px] truncate"
                    title="Filter by specific course subject"
                  >
                    <option value="ALL">All Subjects</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter & Search Collapsible Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                  showFilters || searchQuery.trim()
                    ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/40'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26]'
                }`}
                title="Search and bulk sync tools"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showFilters ? 'Hide Tools' : 'Search & Tools'}</span>
                {searchQuery.trim() && (
                  <span className="w-2 h-2 rounded-full bg-[#D97757]" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Utility Panel (Search & Bulk Sync) */}
          {showFilters && (
            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assignments, quizzes, instructions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] placeholder:text-[#8C897F]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] text-xs font-bold cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {pendingSyncAssignments.length > 0 && (
                <button
                  id="btn-sync-all-canvas-top"
                  onClick={handleSyncAll}
                  disabled={isSyncingAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isSyncingAll ? 'Syncing...' : `Sync All to Sheet (${pendingSyncAssignments.length})`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assignment Grid Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-orange-500 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Syncing live assignments from Canvas LMS...
            </p>
            <p className="text-xs text-slate-400 mt-1">Connecting via secure reverse proxy</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500 dark:text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {isConfigured
                ? activeTab === 'UNFINISHED'
                  ? 'All Caught Up! Zero Unfinished Assignments'
                  : 'No assignments found in this view'
                : 'Canvas LMS not yet connected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isConfigured
                ? activeTab === 'UNFINISHED'
                  ? 'You have completed all assignments currently listed in this feed. Great job!'
                  : `No assignments found for "${activeTab}".`
                : 'Add your Canvas Calendar URL above to sync your real school tasks.'}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const isCompleted = assignment.isCompleted || completedIds.includes(assignment.id);
            const isDueSoon =
              assignment.dueAt &&
              new Date(assignment.dueAt).getTime() - Date.now() < 86400000 * 3 &&
              new Date(assignment.dueAt).getTime() > Date.now();

            const canvasLink = resolveCanvasUrl(
              assignment.htmlUrl,
              settings.apiDomain,
              settings.calendarFeedUrl,
              assignment.courseId,
              assignment.id
            );

            return (
              <div
                key={assignment.id}
                id={`canvas-assignment-card-${assignment.id}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/10 opacity-80'
                    : isDueSoon
                    ? 'border-rose-200 dark:border-rose-900/70 hover:border-rose-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-300'
                }`}
              >
                <div>
                  {/* Top line: Course badge, Status pill & Finished Toggle */}
                  <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300 uppercase tracking-wider">
                        {assignment.courseName}
                      </span>

                      {assignment.isInformational ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          READING / INFO
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>FINISHED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          UNFINISHED
                        </span>
                      )}

                      {assignment.isSynced && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          In Sheet
                        </span>
                      )}
                    </div>

                    {/* Mark as Finished Toggle Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(assignment.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                      title={isCompleted ? 'Click to mark as Unfinished' : 'Click to mark as Finished'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600 fill-emerald-100 dark:fill-emerald-950' : 'text-slate-400'}`} />
                      <span>{isCompleted ? 'Finished' : 'Mark Done'}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h4 className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug ${
                    isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''
                  }`}>
                    {assignment.name}
                  </h4>

                  {/* Due date & points */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        isDueSoon && !isCompleted
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Due: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No date'}</span>
                    </span>

                    {assignment.pointsPossible !== undefined && (
                      <span>• {assignment.pointsPossible} pts</span>
                    )}
                  </div>

                  {/* Description snippet */}
                  {assignment.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {assignment.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                  )}

                  {/* Google Drive submission picker panel with Fluid CSS Grid Accordion */}
                  <div className={`accordion-wrapper ${expandedSubmitId === assignment.id ? 'is-expanded' : ''}`}>
                    <div className="accordion-inner">
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-500 fill-blue-50 shrink-0" viewBox="0 0 24 24">
                              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4" />
                            </svg>
                            <span>Google Drive Submitter</span>
                          </h5>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <Plus className="w-3 h-3 text-emerald-500" /> Auto-Sharing Access
                          </span>
                        </div>
                        
                        {!isGoogleConnected ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400 py-1">
                            ⚠️ Connect your Google Account in the header to select Drive files.
                          </div>
                        ) : recentFiles.length === 0 ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400 py-1">
                            No recent files loaded from Google Drive. Try refreshing your workspace.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={fileSearchQuery}
                              onChange={(e) => setFileSearchQuery(e.target.value)}
                              placeholder="Search your Drive files..."
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <select
                              value={selectedFileId}
                              onChange={(e) => setSelectedFileId(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="">-- Choose a document from Drive --</option>
                              {recentFiles
                                .filter((f) => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()))
                                .map((file) => (
                                  <option key={file.id} value={file.id}>
                                    {file.name}
                                  </option>
                                ))}
                            </select>
                            
                            <button
                              disabled={!selectedFileId || submittingIds[assignment.id]}
                              onClick={async () => {
                                if (!onSubmitAssignment) return;
                                setSubmittingIds((prev) => ({ ...prev, [assignment.id]: true }));
                                try {
                                  await onSubmitAssignment(assignment, selectedFileId);
                                  setExpandedSubmitId(null);
                                } finally {
                                  setSubmittingIds((prev) => ({ ...prev, [assignment.id]: false }));
                                }
                              }}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              {submittingIds[assignment.id] ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sharing & Submitting...</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>Share & Submit directly</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar with Direct Redirect Button & Clean Dropdown */}
                <div className="mt-4 pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isCompleted && onSubmitAssignment ? (
                      <button
                        onClick={() => {
                          if (expandedSubmitId === assignment.id) {
                            setExpandedSubmitId(null);
                          } else {
                            setExpandedSubmitId(assignment.id);
                            setSelectedFileId('');
                            setFileSearchQuery('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          expandedSubmitId === assignment.id
                            ? 'bg-[#D97757] border-[#D97757] text-white shadow-xs'
                            : 'bg-[#D97757]/10 border-[#D97757]/30 text-[#D97757] hover:bg-[#D97757]/20'
                        }`}
                        title="Submit directly from Google Drive"
                      >
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>Submit Work</span>
                      </button>
                    ) : assignment.isSynced ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Master Sheet</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Direct link to Canvas */}
                    <a
                      href={toMobileDeepLink(canvasLink)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Open this assignment directly on Canvas"
                    >
                      <span>Canvas</span>
                      <ExternalLink className="w-3 h-3 text-[#8C897F]" />
                    </a>

                    {/* Clean More Actions Menu (...) */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === assignment.id ? null : assignment.id)}
                        className="p-1.5 rounded-xl text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27] transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === assignment.id && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95">
                          {!assignment.isSynced && (
                            <button
                              onClick={() => {
                                onSyncToSheet(assignment);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-xs text-left hover:bg-[#EFECE2] dark:hover:bg-[#252422] flex items-center gap-2 text-[#141413] dark:text-[#FAF9F5] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sync to Master Sheet</span>
                            </button>
                          )}

                          {/* AI Sub-task Extractor */}
                          <button
                            onClick={async () => {
                              setActiveMenuId(null);
                              if (subtaskData[assignment.id]) {
                                // Toggle expand/collapse
                                setExpandedSubtaskIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(assignment.id)) next.delete(assignment.id);
                                  else next.add(assignment.id);
                                  return next;
                                });
                                return;
                              }
                              setExtractingIds((prev) => ({ ...prev, [assignment.id]: true }));
                              try {
                                const result = await extractSubtasksFromCanvas(assignment);
                                setSubtaskData((prev) => ({ ...prev, [assignment.id]: result }));
                                setExpandedSubtaskIds((prev) => new Set(prev).add(assignment.id));
                              } catch (err) {
                                console.error('Sub-task extraction failed:', err);
                              } finally {
                                setExtractingIds((prev) => ({ ...prev, [assignment.id]: false }));
                              }
                            }}
                            disabled={extractingIds[assignment.id]}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-[#EFECE2] dark:hover:bg-[#252422] flex items-center gap-2 text-[#141413] dark:text-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{extractingIds[assignment.id] ? 'Extracting...' : subtaskData[assignment.id] ? 'Show Sub-tasks' : '⚡ Extract Sub-tasks'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Sub-task Checklist Panel */}
                  {expandedSubtaskIds.has(assignment.id) && subtaskData[assignment.id] && (
                    <div className="mt-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Sub-tasks ({subtaskData[assignment.id].subtasks.length})</span>
                          <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400 ml-1">
                            ~{subtaskData[assignment.id].totalEstimatedMinutes}min • {subtaskData[assignment.id].difficulty}
                          </span>
                        </h5>
                        <button
                          onClick={() => setExpandedSubtaskIds((prev) => { const n = new Set(prev); n.delete(assignment.id); return n; })}
                          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 p-0.5 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {subtaskData[assignment.id].subtasks
                          .sort((a, b) => a.order - b.order)
                          .map((st, idx) => {
                            const checked = checkedSubtasks[assignment.id]?.has(idx) ?? false;
                            return (
                              <label
                                key={idx}
                                className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group ${
                                  checked
                                    ? 'bg-emerald-100/60 dark:bg-emerald-950/40 line-through opacity-60'
                                    : 'hover:bg-amber-100/60 dark:hover:bg-amber-900/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setCheckedSubtasks((prev) => {
                                      const set = new Set(prev[assignment.id] || []);
                                      if (set.has(idx)) set.delete(idx); else set.add(idx);
                                      return { ...prev, [assignment.id]: set };
                                    });
                                  }}
                                  className="mt-0.5 w-3.5 h-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-[#141413] dark:text-[#FAF9F5] font-medium">{st.title}</span>
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1.5 inline-flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />{st.estimatedMinutes}m
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
