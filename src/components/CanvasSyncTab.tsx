import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  FileText,
  Key,
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { CanvasAssignment, CanvasSettings, Assignment } from '../types';

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
  onCreateDocFromCanvas: (assignment: CanvasAssignment) => void;
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
  onCreateDocFromCanvas,
}) => {
  const [feedUrl, setFeedUrl] = useState(settings.calendarFeedUrl || '');
  const [apiDomain, setApiDomain] = useState(settings.apiDomain || 'https://canvas.instructure.com');
  const [apiToken, setApiToken] = useState(settings.apiToken || '');
  const [autoSync, setAutoSync] = useState(settings.autoSync ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [syncFilter, setSyncFilter] = useState<'ALL' | 'UNSYNCED' | 'SYNCED'>('ALL');

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

  // Distinct courses
  const courses = useMemo(() => {
    const set = new Set<string>();
    canvasAssignments.forEach((a) => {
      if (a.courseName) set.add(a.courseName);
    });
    return Array.from(set);
  }, [canvasAssignments]);

  const pendingAssignments = canvasAssignments.filter((a) => !a.isSynced);
  const syncedAssignments = canvasAssignments.filter((a) => a.isSynced);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return canvasAssignments.filter((item) => {
      if (selectedCourse !== 'ALL' && item.courseName !== selectedCourse) {
        return false;
      }
      if (syncFilter === 'UNSYNCED' && item.isSynced) {
        return false;
      }
      if (syncFilter === 'SYNCED' && !item.isSynced) {
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
  }, [canvasAssignments, selectedCourse, syncFilter, searchQuery]);

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
              Coursework, due dates, and rubrics
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

      {/* Settings Box (Collapsible) */}
      {showSettingsDrawer && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs animate-in fade-in">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Canvas Connection Settings
            </h3>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calendar Feed URL (.ics)
              </label>
              <input
                id="input-canvas-feed"
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://canvas.instructure.com/feeds/calendars/user_...ics"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Found on Canvas under <strong>Calendar → Calendar Feed</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Canvas Domain (Optional)
                </label>
                <input
                  type="text"
                  value={apiDomain}
                  onChange={(e) => setApiDomain(e.target.value)}
                  placeholder="https://canvas.instructure.com"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Access Token (Optional)
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Canvas Settings → Access Token"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span>Background auto-sync</span>
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Clean Connect Card if not configured yet */}
      {!isConfigured && !showSettingsDrawer && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Connect Canvas Calendar Feed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Paste your Canvas calendar URL below to import assignments and due dates.
          </p>

          <form onSubmit={handleSave} className="mt-4 max-w-lg mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="Paste Canvas .ics feed URL..."
              required
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSaving || !feedUrl.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {isSaving ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        </section>
      )}

      {/* Filter & Search Bar */}
      {isConfigured && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Canvas assignments, courses, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Sync status pills */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSyncFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  syncFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({canvasAssignments.length})
              </button>
              <button
                onClick={() => setSyncFilter('UNSYNCED')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  syncFilter === 'UNSYNCED'
                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pending ({pendingAssignments.length})
              </button>
              <button
                onClick={() => setSyncFilter('SYNCED')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  syncFilter === 'SYNCED'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Synced ({syncedAssignments.length})
              </button>
            </div>

            {/* Bulk Sync Button */}
            {pendingAssignments.length > 0 && (
              <button
                id="btn-sync-all-canvas-top"
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isSyncingAll ? 'Syncing...' : `Sync All Pending (${pendingAssignments.length})`}</span>
              </button>
            )}
          </div>

          {/* Course Filter Pills */}
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Course:
              </span>
              <button
                onClick={() => setSelectedCourse('ALL')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCourse === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Courses
              </button>
              {courses.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCourse(c)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedCourse === c
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {c}
                </button>
              ))}
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
                ? 'No Canvas assignments found in feed'
                : 'Canvas LMS not yet connected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isConfigured
                ? searchQuery
                  ? `No assignments found matching "${searchQuery}".`
                  : 'You have zero pending assignments in this calendar feed right now. Auto-sync is active.'
                : 'Add your Canvas Calendar URL above to sync your real school tasks.'}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const isDueSoon =
              assignment.dueAt &&
              new Date(assignment.dueAt).getTime() - Date.now() < 86400000 * 3 &&
              new Date(assignment.dueAt).getTime() > Date.now();

            return (
              <div
                key={assignment.id}
                id={`canvas-assignment-card-${assignment.id}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
                  !assignment.isSynced
                    ? 'border-orange-200 dark:border-orange-950/70 bg-orange-50/15 dark:bg-orange-950/10 hover:border-orange-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top line: Course & Sync status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300 uppercase tracking-wider">
                      {assignment.courseName}
                    </span>

                    {assignment.isSynced ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>SYNCED TO SHEET</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        PENDING SYNC
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {assignment.name}
                  </h4>

                  {/* Due date & points */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        isDueSoon
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
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      {assignment.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!assignment.isSynced ? (
                      <button
                        onClick={() => onSyncToSheet(assignment)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Sync to Sheet</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>In Master Sheet</span>
                      </span>
                    )}

                    <button
                      onClick={() => onCreateDocFromCanvas(assignment)}
                      className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Generate formatted MLA/APA Doc for this assignment"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="hidden sm:inline">Start Doc</span>
                    </button>
                  </div>

                  {assignment.htmlUrl && (
                    <a
                      href={assignment.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="Open on Canvas"
                    >
                      <span className="hidden lg:inline text-[11px]">Canvas</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
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

