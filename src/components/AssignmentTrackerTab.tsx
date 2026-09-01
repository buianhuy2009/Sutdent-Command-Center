import React, { useState, useMemo } from 'react';
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
  X,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowRight,
  Brain,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Assignment, PriorityLevel, AssignmentStatus, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';
import { estimateAssignmentEffort, EffortEstimate } from '../services/gemini';
import { WhyIsThisHardModal } from './WhyIsThisHardModal';

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
  onOpenLibrarySearch?: (query: string) => void;
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
  onOpenLibrarySearch,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [isClearingDone, setIsClearingDone] = useState(false);
  const [showAiAdd, setShowAiAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');

  // Selected row for Slide-Over Inspector Sheet
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [whyIsThisHardTask, setWhyIsThisHardTask] = useState<Assignment | null>(null);

  // AI Dynamic Priority & Effort state
  const [effortEstimates, setEffortEstimates] = useState<Record<string, EffortEstimate>>({});
  const [isEstimating, setIsEstimating] = useState(false);
  const [sortByAIFocus, setSortByAIFocus] = useState(false);

  const handleRunAIEstimates = async () => {
    setIsEstimating(true);
    try {
      const estimates = await estimateAssignmentEffort(assignments);
      const map: Record<string, EffortEstimate> = {};
      estimates.forEach((e) => {
        map[e.id] = e;
      });
      setEffortEstimates(map);
      setSortByAIFocus(true);
    } catch (err) {
      console.error('Error running AI estimates:', err);
    } finally {
      setIsEstimating(false);
    }
  };

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

  const subjects = useMemo(() => {
    return Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));
  }, [assignments]);

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
        notes: newNotes.trim() || undefined,
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusClick = async (assignment: Assignment) => {
    let nextStatus: AssignmentStatus = 'In Progress';
    if (assignment.status === 'Not Started') {
      nextStatus = 'In Progress';
    } else if (assignment.status === 'In Progress') {
      nextStatus = 'Done';
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
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

  const { filteredAssignments, oldCompletedCount } = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let oldDone = 0;

    const filtered = assignments.filter((a) => {
      const isDone = a.status === 'Done';
      const dueDateMs = a.dueDate ? new Date(a.dueDate).getTime() : 0;

      if (isDone && dueDateMs && dueDateMs < oneWeekAgo && !showArchived && filterStatus !== 'Done') {
        oldDone++;
        return false;
      }

      if (filterSubject !== 'ALL' && a.subject !== filterSubject) return false;
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && a.priority !== filterPriority) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.assignmentName.toLowerCase().includes(q);
        const matchSub = a.subject.toLowerCase().includes(q);
        const matchNotes = (a.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchSub && !matchNotes) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const aDone = a.status === 'Done';
      const bDone = b.status === 'Done';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

      if (sortByAIFocus) {
        const aOrder = effortEstimates[a.id]?.focusOrder ?? 999;
        const bOrder = effortEstimates[b.id]?.focusOrder ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }

      return aDate - bDate;
    });

    return { filteredAssignments: filtered, oldCompletedCount: oldDone };
  }, [assignments, searchQuery, filterSubject, filterStatus, filterPriority, showArchived, sortByAIFocus, effortEstimates]);

  const doneCount = assignments.filter((a) => a.status === 'Done').length;
  const highCount = assignments.filter((a) => a.priority === 'High' && a.status !== 'Done').length;

  const handleSyncClick = () => {
    if (!isGoogleConnected) {
      // Show guidance instead of silent fail
      return;
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Google Sheets Disconnected Guidance Banner */}
      {!isGoogleConnected && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Google Sheets Not Connected</h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Sync to your Master Tracker Sheet requires Google sign-in. Your tasks are saved locally for now.
                <br />
                <span className="font-semibold">Setup:</span> 1) Click Connect Google → 2) Approve Sheets + Drive scopes → 3) Return and click Sync Sheet. Enables 2-way sheet row sync.
              </p>
              {sheetError && <p className="text-[11px] text-rose-600 mt-1 font-mono">{sheetError}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onConnectGoogle && (
              <button
                onClick={onConnectGoogle}
                className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Connect Google</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              className="px-3 py-2 bg-white dark:bg-[#1A1917] border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Try Sync Anyway
            </button>
          </div>
        </div>
      )}
      {sheetApiInfo && (
        <ApiActivationBanner info={sheetApiInfo} onRetry={onRefresh} compact />
      )}
      {/* Top Header & Filter Ribbon */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Left: Summary Stats & Status Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] px-1">
            Master Tracker
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {highCount} High Priority
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {doneCount} Done
          </span>
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracker..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          {/* View Mode Toggle: Table vs Kanban */}
          <div className="flex items-center bg-[#FAF9F5] dark:bg-[#1F1E1B] p-0.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#252422] text-[#D97757] shadow-2xs'
                  : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#252422] text-[#D97757] shadow-2xs'
                  : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-[#252422] text-[#D97757] shadow-2xs'
                  : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
              }`}
              title="Timeline Gantt View"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Ranker */}
          <button
            onClick={handleRunAIEstimates}
            disabled={isEstimating || assignments.length === 0}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              sortByAIFocus
                ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border-[#DFDACB] dark:border-[#2C2B27]'
            }`}
            title="AI Dynamic Priority & Effort Matrix"
          >
            <Zap className={`w-3.5 h-3.5 text-[#D97757] ${sortByAIFocus ? 'text-white' : ''} ${isEstimating ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isEstimating ? 'Analyzing...' : sortByAIFocus ? 'AI Ranked' : 'AI Rank'}</span>
          </button>

          {/* Smart Add Toggle */}
          <button
            onClick={() => setShowAiAdd(!showAiAdd)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAiAdd
                ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border-[#DFDACB] dark:border-[#2C2B27]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${showAiAdd ? 'text-white' : 'text-[#D97757]'}`} />
            <span className="hidden sm:inline">Smart Add</span>
          </button>

          {/* New Task Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Smart Add Bar */}
      {showAiAdd && (
        <form
          onSubmit={handleQuickSubmit}
          className="bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl p-3 shadow-xs flex items-center gap-2 animate-in fade-in"
        >
          <Sparkles className="w-4 h-4 text-[#D97757] shrink-0 ml-1" />
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Type anything e.g. 'Read AP Bio Ch 14 due Friday high priority'..."
            className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
          />
          <button
            type="submit"
            disabled={isParsingAI || !quickInput.trim()}
            className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isParsingAI ? 'Parsing...' : 'Add'}
          </button>
        </form>
      )}

      {/* VIEW RENDERER: TABLE | BOARD | TIMELINE — Deadline Gantt promoted from app to toggle */}
      {viewMode === 'timeline' ? (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6860] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#D97757]" /> Timeline — Deadline Gantt (Mermaid)</h4>
          <div className="mt-3 p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">{`gantt
    title Deadline Radar Timeline
    dateFormat YYYY-MM-DD
${filteredAssignments.slice(0,8).map(a => `    section ${a.subject}
    ${a.assignmentName.slice(0,20).replace(/:/g,' ')} : ${a.dueDate}, 1d`).join('\n')}`}</pre>
          </div>
          <p className="text-[11px] text-[#6B6860] mt-2">Copy to MermaidWorkspace for rendering. Auto-generated from filtered assignments.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          {(
            [
              { id: 'Not Started', label: 'To Do', color: 'border-amber-200 dark:border-amber-900/60' },
              { id: 'In Progress', label: 'In Progress', color: 'border-blue-200 dark:border-blue-900/60' },
              { id: 'Done', label: 'Completed', color: 'border-emerald-200 dark:border-emerald-900/60' },
            ] as const
          ).map((col) => {
            const colTasks = filteredAssignments.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                      {col.label}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF9F5] dark:bg-[#252422] text-[#8C897F] border border-[#DFDACB] dark:border-[#2C2B27]">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-[11px] text-[#8C897F]">
                      No tasks in {col.label.toLowerCase()}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isHigh = task.priority === 'High';
                      const isDone = task.status === 'Done';

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedAssignment(task)}
                          className={`p-3.5 rounded-xl border bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/80 transition-all cursor-pointer space-y-2.5 shadow-2xs group ${
                            isDone ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 truncate max-w-[130px]">
                              {task.subject}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                isHigh
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4
                            className={`text-xs font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug line-clamp-2 ${
                              isDone ? 'line-through text-[#8C897F]' : ''
                            }`}
                          >
                            {task.assignmentName}
                          </h4>

                          {effortEstimates[task.id] && (
                            <div className="text-[10px] text-[#D97757] font-semibold flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>Est. {effortEstimates[task.id].estimatedMinutes} min</span>
                            </div>
                          )}

                          {/* Footer with Due Date & Status Mover */}
                          <div
                            className="flex items-center justify-between pt-2 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40 text-[11px] text-[#8C897F]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{task.dueDate || 'No due date'}</span>

                            {/* Status Mover Quick Actions */}
                            <div className="flex items-center gap-1">
                              {col.id === 'Not Started' && (
                                <button
                                  onClick={() => onUpdateStatus(task, 'In Progress')}
                                  className="px-2 py-0.5 rounded bg-white dark:bg-[#252422] border border-[#DFDACB] hover:border-[#D97757] text-[10px] font-bold text-[#141413] dark:text-[#FAF9F5] transition-colors"
                                  title="Move to In Progress"
                                >
                                  Start
                                </button>
                              )}
                              {col.id === 'In Progress' && (
                                <button
                                  onClick={() => {
                                    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                                    onUpdateStatus(task, 'Done');
                                  }}
                                  className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold transition-colors"
                                  title="Mark Completed"
                                >
                                  Complete
                                </button>
                              )}
                              {col.id === 'Done' && (
                                <button
                                  onClick={() => onUpdateStatus(task, 'Not Started')}
                                  className="px-2 py-0.5 rounded bg-white dark:bg-[#252422] border border-[#DFDACB] text-[10px] font-bold text-[#8C897F] hover:text-[#141413] transition-colors"
                                  title="Reopen"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-16 text-center text-[#8C897F] flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#D97757]" />
              <span className="text-xs font-semibold">Syncing master sheet...</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-16 text-center text-[#8C897F] space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                No tasks found in this view
              </p>
            </div>
          ) : (
            <>
            {/* Mobile card view <768px — avoids min-w-[600px] horizontal scroll */}
            <div className="md:hidden p-3 space-y-2">
              {filteredAssignments.map(a=>{
                const isDone = a.status==='Done';
                return (
                  <div key={a.id} onClick={()=>setSelectedAssignment(a)} className={`p-3 rounded-2xl border bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] flex flex-col gap-1.5 ${isDone?'opacity-60':''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 truncate">{a.subject}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.priority==='High'?'bg-rose-50 text-rose-700 border border-rose-200':'bg-slate-100 text-slate-600'}`}>{a.priority}</span>
                    </div>
                    <div className={`text-xs font-bold truncate ${isDone?'line-through text-[#6B6860]':''}`}>{a.assignmentName}</div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B6860]">
                      <span>Due {a.dueDate || 'No date'}</span>
                      <span className="text-[10px]">{a.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DFDACB]/80 dark:border-[#2C2B27]/80 bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[10px] font-bold uppercase tracking-wider text-[#6B6860]">
                    <th className="py-2.5 px-3 w-10 text-center">Done</th>
                    <th className="py-2.5 px-3 w-32">Subject</th>
                    <th className="py-2.5 px-3">Assignment Name</th>
                    <th className="py-2.5 px-3 w-36">Due Date</th>
                    <th className="py-2.5 px-3 w-24 text-center">Priority</th>
                    <th className="py-2.5 px-3 w-20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40 text-xs font-medium">
                  {filteredAssignments.map((assignment) => {
                    const isDone = assignment.status === 'Done';
                    const isSelected = selectedAssignment?.id === assignment.id;
                    const isHigh = assignment.priority === 'High';

                    return (
                      <tr
                        key={assignment.id}
                        onClick={() => setSelectedAssignment(assignment)}
                        className={`h-10 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#FAF9F5] dark:bg-[#1F1E1B] font-semibold' : ''
                        } ${isDone ? 'opacity-60' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStatusClick(assignment)}
                            className="text-[#8C897F] hover:text-[#D97757] transition-colors"
                          >
                            {isDone ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Subject Badge */}
                        <td className="py-1.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 truncate max-w-[120px] border border-amber-200 dark:border-amber-800/60">
                            {assignment.subject}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[#141413] dark:text-[#FAF9F5] truncate ${isDone ? 'line-through text-[#8C897F]' : ''}`}>
                              {assignment.assignmentName}
                            </span>
                            {effortEstimates[assignment.id] && (
                              <span className="text-[10px] text-[#D97757] font-mono shrink-0">
                                (~{effortEstimates[assignment.id].estimatedMinutes}m)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="py-1.5 px-3 whitespace-nowrap text-[11px] text-[#8C897F]">
                          {assignment.dueDate || 'No Due Date'}
                        </td>

                        {/* Priority */}
                        <td className="py-1.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {assignment.priority}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-1.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="p-1 text-[#8C897F] hover:text-[#D97757] rounded-lg hover:bg-[#EFECE2] dark:hover:bg-[#252422]"
                            title="Inspect Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}

      {/* SLIDE-OVER INSPECTOR DRAWER */}
      {selectedAssignment && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-[#1A1917] border-l border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-md">
                {selectedAssignment.subject}
              </span>
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Inspector</span>
            </div>

            <button
              onClick={() => setSelectedAssignment(null)}
              className="p-1.5 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#252422] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] mb-2">
                {selectedAssignment.assignmentName}
              </h3>
              <div className="space-y-1 text-[#8C897F] text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">{selectedAssignment.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Due Date:</span>
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">{selectedAssignment.dueDate || 'None'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Priority:</span>
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">{selectedAssignment.priority}</span>
                </div>
              </div>
            </div>

            {/* AI Estimation Card if present */}
            {effortEstimates[selectedAssignment.id] && (
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#D97757]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Effort Matrix</span>
                </div>
                <div className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">
                  {effortEstimates[selectedAssignment.id].aiTip}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-[#8C897F]">
                  <span>Est. Time: {effortEstimates[selectedAssignment.id].estimatedMinutes} mins</span>
                  <span>•</span>
                  <span>Risk Score: {effortEstimates[selectedAssignment.id].riskScore}/10</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedAssignment.notes && (
              <div>
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">Notes</span>
                <div className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                  {selectedAssignment.notes}
                </div>
              </div>
            )}

            {/* Open Library Shortcut */}
            {onOpenLibrarySearch && (
              <button
                onClick={() => {
                  const q = selectedAssignment.subject && selectedAssignment.subject !== 'General' ? selectedAssignment.subject : selectedAssignment.assignmentName;
                  onOpenLibrarySearch(q);
                  setSelectedAssignment(null);
                }}
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Textbook for "{selectedAssignment.subject}" in Open Library</span>
              </button>
            )}
          </div>

          <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWhyIsThisHardTask(selectedAssignment)}
                className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="AI Cognitive Deconstruction"
              >
                <Brain className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Why Is This Hard?</span>
              </button>

              <button
                onClick={() => {
                  onScheduleStudyBlock(selectedAssignment);
                  setSelectedAssignment(null);
                }}
                className="px-3 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Schedule Block</span>
              </button>
            </div>

            <button
              onClick={() => handleStatusClick(selectedAssignment)}
              className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedAssignment.status === 'Done' ? 'Mark Incomplete' : 'Mark Done'}
            </button>
          </div>
        </div>
      )}

      {/* Why Is This Hard Modal */}
      {whyIsThisHardTask && (
        <WhyIsThisHardModal
          isOpen={Boolean(whyIsThisHardTask)}
          onClose={() => setWhyIsThisHardTask(null)}
          assignmentTitle={whyIsThisHardTask.assignmentName}
          courseName={whyIsThisHardTask.subject}
          description={whyIsThisHardTask.notes}
          onStartFocusSession={(title) => {
            onScheduleStudyBlock(whyIsThisHardTask);
          }}
        />
      )}

      {/* Manual Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl max-w-md w-full border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">New Assignment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label htmlFor="assign-title" className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                  Assignment Title
                </label>
                <input
                  id="assign-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Problem Set"
                  className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="assign-subject" className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">Subject</label>
                  <input
                    id="assign-subject"
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                  />
                </div>

                <div>
                  <label htmlFor="assign-due" className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">Due Date</label>
                  <input
                    id="assign-due"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="assign-priority" className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">Priority</label>
                <select
                  id="assign-priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                >
                  <option value="High">High</option>
                  <option value="Med">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label htmlFor="assign-notes" className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">Notes (Optional)</label>
                <textarea
                  id="assign-notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Rubric notes or instructions..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
