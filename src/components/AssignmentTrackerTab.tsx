import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  Circle,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Assignment, PriorityLevel, AssignmentStatus, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';

interface AssignmentTrackerTabProps {
  assignments: Assignment[];
  sheetUrl?: string;
  sheetId?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  onUpdateStatus: (assignment: Assignment, newStatus: AssignmentStatus) => Promise<void>;
  onScheduleStudyBlock: (assignment: Assignment) => void;
  onParseNaturalText: (text: string) => Promise<void>;
  isParsingAI: boolean;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onClearCompleted?: () => Promise<void>;
  sheetError?: string | null;
  sheetApiInfo?: ApiEnablementInfo | null;
}

export const AssignmentTrackerTab: React.FC<AssignmentTrackerTabProps> = ({
  assignments,
  sheetUrl,
  sheetId,
  isLoading,
  onRefresh,
  onAddAssignment,
  onUpdateStatus,
  onScheduleStudyBlock,
  onParseNaturalText,
  isParsingAI,
  isGoogleConnected = true,
  onConnectGoogle,
  onClearCompleted,
  sheetError,
  sheetApiInfo,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [isClearingDone, setIsClearingDone] = useState(false);

  // New assignment modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('AP Calculus BC');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Med');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique subjects
  const subjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    await onParseNaturalText(quickInput.trim());
    setQuickInput('');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddAssignment({
        assignmentName: newTitle.trim(),
        subject: newSubject.trim() || 'General',
        dueDate: newDueDate,
        priority: newPriority,
        status: 'Not Started',
        notes: newNotes.trim(),
        source: 'Manual',
      });
      setNewTitle('');
      setNewNotes('');
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusClick = async (assignment: Assignment) => {
    let nextStatus: AssignmentStatus = 'In Progress';
    if (assignment.status === 'Not Started') nextStatus = 'In Progress';
    else if (assignment.status === 'In Progress') {
      nextStatus = 'Done';
      // Fire confetti celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'],
      });
    } else {
      nextStatus = 'Not Started';
    }

    await onUpdateStatus(assignment, nextStatus);
  };

  const handleClearDone = async () => {
    if (!onClearCompleted) return;
    setIsClearingDone(true);
    try {
      await onClearCompleted();
    } finally {
      setIsClearingDone(false);
    }
  };

  // Filtered and sorted assignments (Active at top, Done at bottom, Old done archived)
  const { filteredAssignments, oldCompletedCount } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let oldDone = 0;

    const filtered = assignments.filter((a) => {
      const matchesSearch =
        a.assignmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = filterSubject === 'ALL' || a.subject === filterSubject;
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchesPriority = filterPriority === 'ALL' || a.priority === filterPriority;

      if (!matchesSearch || !matchesSubject || !matchesStatus || !matchesPriority) {
        return false;
      }

      // Check if this task was completed and due > 7 days ago
      if (a.status === 'Done' && a.dueDate) {
        const due = new Date(a.dueDate + 'T00:00:00');
        const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          oldDone++;
          if (!showArchived && filterStatus !== 'Done') {
            return false;
          }
        }
      }

      return true;
    });

    // Smart Sort:
    // 1. Incomplete / Active tasks (Not Started, In Progress) ALWAYS on top, sorted by due date ascending
    // 2. Completed tasks (Done) ALWAYS on bottom
    filtered.sort((a, b) => {
      const aDone = a.status === 'Done';
      const bDone = b.status === 'Done';

      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

      if (aDone && bDone) {
        return bDate - aDate;
      }

      return aDate - bDate;
    });

    return { filteredAssignments: filtered, oldCompletedCount: oldDone };
  }, [assignments, searchQuery, filterSubject, filterStatus, filterPriority, showArchived]);

  // Calculate relative due date
  const getDueBadge = (dueDateStr: string) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr + 'T00:00:00');
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
          Due Today
        </span>
      );
    } else if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Due Tomorrow
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          In {diffDays} days
        </span>
      );
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
            High
          </span>
        );
      case 'Med':
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Low
          </span>
        );
    }
  };

  const getSubjectColorClass = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math') || s.includes('calc')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (s.includes('physics') || s.includes('chem') || s.includes('bio') || s.includes('science')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (s.includes('history') || s.includes('apush') || s.includes('gov')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (s.includes('english') || s.includes('lit') || s.includes('writing')) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    if (s.includes('cs') || s.includes('computer') || s.includes('code')) {
      return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const highCount = assignments.filter((a) => a.priority === 'High' && a.status !== 'Done').length;
  const doneCount = assignments.filter((a) => a.status === 'Done').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Master Spreadsheet Header & Live Sync Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Assignment Tracker
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {assignments.length} total • {doneCount} completed • {highCount} high priority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <span>Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Reload from Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {doneCount > 0 && onClearCompleted && (
            <button
              onClick={handleClearDone}
              disabled={isClearingDone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              title="Clear and remove finished tasks from your tracker and Google Sheet"
            >
              {isClearingDone ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span>Clear Done ({doneCount})</span>
            </button>
          )}

          <button
            id="btn-add-assignment-top"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* API Disabled or Error Banner */}
      {sheetApiInfo ? (
        <ApiActivationBanner
          info={sheetApiInfo}
          onRetry={onRefresh}
          isRetrying={isLoading}
        />
      ) : sheetError ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{sheetError}</span>
          </div>
          {onConnectGoogle && (
            <button
              onClick={onConnectGoogle}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer text-xs"
            >
              Reconnect Sheets
            </button>
          )}
        </div>
      ) : null}

      {/* AI Quick Task Input Bar */}
      <form
        onSubmit={handleQuickSubmit}
        className="bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 pl-1 shrink-0">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">
            Quick AI Parse:
          </span>
        </div>

        <input
          id="input-quick-assignment"
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Type naturally: 'AP Physics Lab 3 report due this Friday high priority'..."
          disabled={isParsingAI}
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
        />

        <button
          type="submit"
          id="btn-quick-parse-submit"
          disabled={isParsingAI || !quickInput.trim()}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          {isParsingAI ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing AI...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Add</span>
            </>
          )}
        </button>
      </form>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="High">High</option>
            <option value="Med">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Auto-Archived Tasks Notice */}
      {oldCompletedCount > 0 && filterStatus !== 'Done' && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              📁 {oldCompletedCount} finished {oldCompletedCount === 1 ? 'task' : 'tasks'} auto-archived (&gt; 7 days ago)
            </span>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showArchived ? 'Hide Archived' : `Show Archived (${oldCompletedCount})`}
          </button>
        </div>
      )}

      {/* Main Assignment Table with Professional Polish Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Ribbon */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider">
              Master Assignment Tracker
            </h2>
            <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
              {highCount} High
            </span>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
              {doneCount} Done
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            Total Items: {filteredAssignments.length}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-medium">Syncing Master Spreadsheet from Google Sheets...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-base font-semibold">No assignments match your filters</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a new task using the Quick Parse bar or New Assignment button!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assignment Name</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredAssignments.map((assignment) => {
                  const isDone = assignment.status === 'Done';
                  const isHigh = assignment.priority === 'High';
                  const isMed = assignment.priority === 'Med';

                  return (
                    <tr
                      key={assignment.id}
                      id={`assignment-row-${assignment.id}`}
                      className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isDone ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-70' : ''
                      }`}
                    >
                      {/* Status Toggle Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleStatusClick(assignment)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title={`Current: ${assignment.status}. Click to advance status.`}
                        >
                          {assignment.status === 'Done' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                          ) : assignment.status === 'In Progress' ? (
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Subject Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getSubjectColorClass(
                            assignment.subject
                          )}`}
                        >
                          {assignment.subject}
                        </span>
                      </td>

                      {/* Assignment Name & Notes */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p
                            className={`font-semibold text-slate-900 dark:text-white ${
                              isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {assignment.assignmentName}
                          </p>
                          {assignment.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                              {assignment.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                            {assignment.dueDate || 'No Date'}
                          </span>
                          {getDueBadge(assignment.dueDate)}
                        </div>
                      </td>

                      {/* Priority Dot & Label */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`w-2 h-2 rounded-full inline-block mr-2 ${
                            isHigh
                              ? 'bg-rose-500'
                              : isMed
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {assignment.priority}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Schedule 45-min Study Block button */}
                          <button
                            id={`btn-schedule-study-${assignment.id}`}
                            onClick={() => onScheduleStudyBlock(assignment)}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded transition-colors font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Schedule 45-minute focus session in open slot on Google Calendar"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Study Block</span>
                          </button>

                          {/* Doc Link if present */}
                          {assignment.docUrl && (
                            <a
                              href={assignment.docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                              title="Open Associated Google Doc"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Assignment to Google Sheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronizes directly to your Master Spreadsheet.
            </p>

            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AP Calculus Problem Set 5"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. AP Physics C"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                  >
                    <option value="High">High</option>
                    <option value="Med">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Duration
                  </label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white">
                    <option value="45">45 Minutes (1 Study Block)</option>
                    <option value="90">90 Minutes (2 Study Blocks)</option>
                    <option value="30">30 Minutes Quick Task</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Requirements (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Key problems to solve, rubric requirements, page count..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Appending to Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save to Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
