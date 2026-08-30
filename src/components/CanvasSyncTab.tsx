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
} from 'lucide-react';
import { CanvasAssignment, CanvasSettings } from '../types';
import { loadCompletedCanvasIds, saveCompletedCanvasIds, resolveCanvasUrl } from '../services/canvas';

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

  // Completion state loaded from local storage
  const [completedIds, setCompletedIds] = useState<string[]>(() => loadCompletedCanvasIds());

  // Tabs: 'UNFINISHED' (default on open), 'ALL', 'FINISHED', or Course Name
  const [activeTab, setActiveTab] = useState<string>('UNFINISHED');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtered assignments based on activeTab (UNFINISHED by default)
  const filteredAssignments = useMemo(() => {
    return canvasAssignments.filter((item) => {
      const isDone = item.isCompleted || completedIds.includes(item.id);

      if (activeTab === 'UNFINISHED') {
        if (isDone) return false;
      } else if (activeTab === 'FINISHED') {
        if (!isDone) return false;
      } else if (activeTab !== 'ALL') {
        // Course name selected: show both finished & unfinished for this course
        if (item.courseName !== activeTab) return false;
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
  }, [canvasAssignments, completedIds, activeTab, searchQuery]);

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

      {/* Primary Status & Course Tabs */}
      {(isConfigured || canvasAssignments.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assignments, quizzes, courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Bulk Sync Button */}
            {pendingSyncAssignments.length > 0 && (
              <button
                id="btn-sync-all-canvas-top"
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isSyncingAll ? 'Syncing...' : `Sync All to Sheet (${pendingSyncAssignments.length})`}</span>
              </button>
            )}
          </div>

          {/* Navigation Filter Tabs: Unfinished (Default), All Assignments, Finished, and Course Subjects */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 1. Unfinished Tab (DEFAULT) */}
            <button
              onClick={() => setActiveTab('UNFINISHED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'UNFINISHED'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Unfinished</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                activeTab === 'UNFINISHED' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {unfinishedCount}
              </span>
            </button>

            {/* 2. All Assignments Tab */}
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Assignments</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {canvasAssignments.length}
              </span>
            </button>

            {/* 3. Finished Tab */}
            <button
              onClick={() => setActiveTab('FINISHED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'FINISHED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Finished</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                activeTab === 'FINISHED' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {finishedCount}
              </span>
            </button>

            {/* 4. Course / Subject Pills (shows both finished & unfinished for that subject) */}
            {courses.map((course) => {
              const isActive = activeTab === course;
              const courseCount = canvasAssignments.filter((a) => a.courseName === course).length;
              return (
                <button
                  key={course}
                  onClick={() => setActiveTab(course)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{course}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {courseCount}
                  </span>
                </button>
              );
            })}
          </div>
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
                </div>

                {/* Bottom Actions Bar with Direct Redirect Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
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

                  {/* Prominent Redirect Button to Canvas */}
                  <a
                    href={canvasLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open this quiz or assignment directly in Canvas"
                  >
                    <span>Open on Canvas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
