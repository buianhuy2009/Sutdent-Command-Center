import React, { useState, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  FileText,
  Key,
  Search,
  Calendar,
  AlertTriangle,
  CheckSquare,
  FolderOpen,
  UploadCloud,
  SlidersHorizontal,
  Sparkles,
  Clock,
  ChevronRight,
  X,
  Share2,
  Sliders,
  Check,
  Brain,
} from 'lucide-react';
import { CanvasAssignment, CanvasSettings } from '../types';
import { loadCompletedCanvasIds, saveCompletedCanvasIds, resolveCanvasUrl, toMobileDeepLink } from '../services/canvas';
import { extractSubtasksFromCanvas, SubtaskResult, calculateGradePrediction } from '../services/gemini';
import { WhyIsThisHardModal } from './WhyIsThisHardModal';

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
  googleToken?: string;
  onConnectGoogle?: () => void;
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
  googleToken,
  onConnectGoogle,
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

  // Filters
  const [activeTab, setActiveTab] = useState<'UNFINISHED' | 'ALL' | 'FINISHED'>('UNFINISHED');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected row for Slide-Over Inspector Drawer
  const [selectedAssignment, setSelectedAssignment] = useState<CanvasAssignment | null>(null);
  const [whyIsThisHardCanvasAssignment, setWhyIsThisHardCanvasAssignment] = useState<CanvasAssignment | null>(null);

  // AI Sub-task Extractor state
  const [subtaskData, setSubtaskData] = useState<Record<string, SubtaskResult>>({});
  const [extractingIds, setExtractingIds] = useState<Record<string, boolean>>({});
  const [checkedSubtasks, setCheckedSubtasks] = useState<Record<string, Set<number>>>({});

  // Google Drive submission state
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isSubmittingDrive, setIsSubmittingDrive] = useState(false);
  // Grade predictor always visible — not just slider
  const [gradeCurrent, setGradeCurrent] = useState(84);
  const [gradeDesired, setGradeDesired] = useState(90);
  const [gradeFinalWeight, setGradeFinalWeight] = useState(30);

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
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveCompletedCanvasIds(next);
      return next;
    });
  };

  const handleExtractSubtasks = async (assignment: CanvasAssignment) => {
    setExtractingIds((prev) => ({ ...prev, [assignment.id]: true }));
    try {
      const result = await extractSubtasksFromCanvas(assignment);
      setSubtaskData((prev) => ({ ...prev, [assignment.id]: result }));
    } catch (err) {
      console.error('Error extracting subtasks:', err);
    } finally {
      setExtractingIds((prev) => ({ ...prev, [assignment.id]: false }));
    }
  };

  const handleToggleSubtaskCheck = (assignmentId: string, index: number) => {
    setCheckedSubtasks((prev) => {
      const current = new Set(prev[assignmentId] || []);
      if (current.has(index)) current.delete(index);
      else current.add(index);
      return { ...prev, [assignmentId]: current };
    });
  };

  const handleSubmitDriveFile = async (assignment: CanvasAssignment) => {
    if (!onSubmitAssignment || !selectedFileId) return;
    setIsSubmittingDrive(true);
    try {
      await onSubmitAssignment(assignment, selectedFileId);
      setSelectedFileId('');
    } finally {
      setIsSubmittingDrive(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await onSyncAllPending();
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Course list
  const courses = useMemo(() => {
    return Array.from(new Set(canvasAssignments.map((a) => a.courseName).filter(Boolean)));
  }, [canvasAssignments]);

  const unfinishedCount = useMemo(() => {
    return canvasAssignments.filter((a) => !a.isCompleted && !completedIds.includes(a.id)).length;
  }, [canvasAssignments, completedIds]);

  const pendingSyncAssignments = useMemo(() => {
    return canvasAssignments.filter((a) => !a.isSynced);
  }, [canvasAssignments]);

  const filteredAssignments = useMemo(() => {
    return canvasAssignments.filter((a) => {
      const isCompleted = a.isCompleted || completedIds.includes(a.id);
      if (activeTab === 'UNFINISHED' && isCompleted) return false;
      if (activeTab === 'FINISHED' && !isCompleted) return false;
      if (selectedCourse !== 'ALL' && a.courseName !== selectedCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchCourse = a.courseName.toLowerCase().includes(q);
        if (!matchName && !matchCourse) return false;
      }
      return true;
    });
  }, [canvasAssignments, activeTab, selectedCourse, searchQuery, completedIds]);

  const isConfigured = Boolean(settings.calendarFeedUrl || settings.apiToken);

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Header */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
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
          </button>
        </div>

        {/* Right: Search, Course Dropdown & Sync Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          {/* Course Selector */}
          {courses.length > 0 && (
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-[#141413] dark:text-[#FAF9F5] font-semibold cursor-pointer outline-none"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Sync All Button */}
          {pendingSyncAssignments.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Sync ({pendingSyncAssignments.length})</span>
            </button>
          )}

          {/* Config Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors cursor-pointer"
            title="Canvas LMS Connection Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Drawer Overlay if Opened */}
      {showSettingsDrawer && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#D97757]" />
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                Canvas LMS Connection Parameters
              </h3>
            </div>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Canvas Calendar Feed (.ics URL)
              </label>
              <input
                type="text"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://canvas.instructure.com/feeds/calendars/..."
                className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#D97757]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Canvas API Access Token (Optional)
              </label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Canvas -> Account -> Settings -> New Access Token"
                className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#D97757]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
              >
                {isSaving ? 'Saving & Syncing...' : 'Save & Sync Canvas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grade What-If Predictor — always visible */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs">
        <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-[#D97757]" strokeWidth={1.75} /> Grade Predictor — What-if Final Exam</h4>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <label className="space-y-1"><span className="text-[11px] font-bold text-[#6B6860]">Current %</span><input type="number" value={gradeCurrent} onChange={e=>setGradeCurrent(parseInt(e.target.value)||0)} className="w-full px-2 py-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-sm font-mono" /></label>
          <label className="space-y-1"><span className="text-[11px] font-bold text-[#6B6860]">Desired %</span><input type="number" value={gradeDesired} onChange={e=>setGradeDesired(parseInt(e.target.value)||0)} className="w-full px-2 py-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-sm font-mono" /></label>
          <label className="space-y-1"><span className="text-[11px] font-bold text-[#6B6860]">Final weight %</span><input type="range" min={10} max={50} value={gradeFinalWeight} onChange={e=>setGradeFinalWeight(parseInt(e.target.value))} className="w-full accent-[#D97757]" /><span className="text-[11px] font-mono">{gradeFinalWeight}%</span></label>
        </div>
        {(() => {
          const r = calculateGradePrediction({ currentGrade: gradeCurrent, desiredGrade: gradeDesired, finalExamWeight: gradeFinalWeight });
          return (
            <div className="mt-3 p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-xs space-y-1">
              <div className="flex items-center justify-between"><span className="font-bold">Need on final: <span className="text-[#D97757]">{r.requiredFinalScore}%</span></span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status==='Guaranteed'?'bg-emerald-100 text-emerald-700': r.status==='Achievable'?'bg-blue-100 text-blue-700': r.status==='Challenging'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{r.status}</span></div>
              <p className="text-[11px] text-[#6B6860]">{r.feedback}</p>
              <p className="text-[11px] text-[#6B6860] italic">Weighted GPA: Canvas grades auto-imported → GPA calculation uses same formula.</p>
            </div>
          );
        })()}
      </div>

      {/* Main High-Density macOS Table View (40px Rows) */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-[#8C897F] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#D97757]" />
            <span className="text-xs font-semibold">Syncing live Canvas assignments...</span>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-16 text-center text-[#8C897F] space-y-2">
            <Layers className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
              {isConfigured ? 'All caught up! Zero tasks in this view.' : 'Canvas LMS not yet connected'}
            </p>
            <p className="text-[11px] max-w-sm mx-auto">
              {isConfigured
                ? 'No pending coursework matching your active filters.'
                : 'Click the settings icon above to paste your Canvas calendar feed URL.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DFDACB]/80 dark:border-[#2C2B27]/80 bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[10px] font-bold uppercase tracking-wider text-[#8C897F]">
                  <th className="py-2.5 px-3 w-10 text-center">Done</th>
                  <th className="py-2.5 px-3 w-36">Course</th>
                  <th className="py-2.5 px-3">Assignment Title</th>
                  <th className="py-2.5 px-3 w-40">Due Date</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  <th className="py-2.5 px-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40 text-xs font-medium">
                {filteredAssignments.map((assignment) => {
                  const isCompleted = assignment.isCompleted || completedIds.includes(assignment.id);
                  const isSelected = selectedAssignment?.id === assignment.id;
                  const isDueSoon =
                    assignment.dueAt &&
                    new Date(assignment.dueAt).getTime() - Date.now() < 86400000 * 3 &&
                    new Date(assignment.dueAt).getTime() > Date.now();

                  return (
                    <tr
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
                      className={`h-10 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#FAF9F5] dark:bg-[#1F1E1B] font-semibold' : ''
                      } ${isCompleted ? 'opacity-60 line-through' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggleComplete(assignment.id)}
                          className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757] cursor-pointer"
                        />
                      </td>

                      {/* Course Badge */}
                      <td className="py-1.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 truncate max-w-[130px] border border-amber-200 dark:border-amber-800/60">
                          {assignment.courseName}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-[#141413] dark:text-[#FAF9F5] truncate ${isCompleted ? 'line-through text-[#8C897F]' : ''}`}>
                            {assignment.name}
                          </span>
                          {assignment.pointsPossible !== undefined && (
                            <span className="text-[10px] text-[#8C897F] font-mono shrink-0">
                              ({assignment.pointsPossible} pts)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-1.5 px-3 whitespace-nowrap text-[11px]">
                        <span className={isDueSoon ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-[#8C897F]'}>
                          {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Due Date'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-3 text-center">
                        {assignment.isSynced ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                            Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="p-1 text-[#8C897F] hover:text-[#D97757] rounded-lg hover:bg-[#EFECE2] dark:hover:bg-[#252422]"
                            title="Inspect Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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

      {/* SLIDE-OVER INSPECTOR DRAWER */}
      {selectedAssignment && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-[#1A1917] border-l border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-md">
                {selectedAssignment.courseName}
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

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            
            {/* Title & Metadata */}
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] mb-2">
                {selectedAssignment.name}
              </h3>
              <div className="space-y-1 text-[#8C897F] text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Due Date:</span>
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">
                    {selectedAssignment.dueAt ? new Date(selectedAssignment.dueAt).toLocaleString() : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Points Possible:</span>
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">
                    {selectedAssignment.pointsPossible ?? 'Unspecified'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Sub-task Extractor */}
            <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#141413] dark:text-[#FAF9F5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>AI Sub-task Extractor</span>
                </div>

                {!subtaskData[selectedAssignment.id] && (
                  <button
                    onClick={() => handleExtractSubtasks(selectedAssignment)}
                    disabled={extractingIds[selectedAssignment.id]}
                    className="px-2.5 py-1 bg-[#D97757] hover:bg-[#C86646] text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className={`w-3 h-3 ${extractingIds[selectedAssignment.id] ? 'animate-spin' : ''}`} />
                    <span>{extractingIds[selectedAssignment.id] ? 'Extracting...' : 'Deconstruct'}</span>
                  </button>
                )}
              </div>

              {subtaskData[selectedAssignment.id] && (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <div className="text-[10px] text-[#8C897F]">
                    Difficulty: {subtaskData[selectedAssignment.id].difficulty} (Est. {subtaskData[selectedAssignment.id].totalEstimatedMinutes}m)
                  </div>
                  <div className="space-y-1.5">
                    {subtaskData[selectedAssignment.id].subtasks.map((st, idx) => {
                      const isChecked = checkedSubtasks[selectedAssignment.id]?.has(idx);
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded-xl border transition-colors cursor-pointer text-[11px] ${
                            isChecked
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 line-through text-[#8C897F]'
                              : 'bg-white dark:bg-[#252422] border-[#DFDACB] dark:border-[#2C2B27] text-[#141413] dark:text-[#FAF9F5]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleToggleSubtaskCheck(selectedAssignment.id, idx)}
                            className="mt-0.5 rounded text-[#D97757] focus:ring-[#D97757]"
                          />
                          <span className="flex-1 leading-tight">{st.title} (~{st.estimatedMinutes}m)</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Google Drive Submission Picker */}
            {onSubmitAssignment && (
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-[#141413] dark:text-[#FAF9F5]">
                  <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Submit from Google Drive</span>
                </div>

                {recentFiles.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedFileId}
                      onChange={(e) => setSelectedFileId(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-[11px] outline-none"
                    >
                      <option value="">Select a Drive file to attach...</option>
                      {recentFiles.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleSubmitDriveFile(selectedAssignment)}
                      disabled={isSubmittingDrive || !selectedFileId}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      {isSubmittingDrive ? 'Submitting...' : 'Submit to Canvas'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#8C897F]">
                    No Google Drive files indexed yet. Connect Google Workspace to auto-submit assignments.
                  </p>
                )}
              </div>
            )}

            {/* Description & Rubric */}
            {selectedAssignment.description && (
              <div>
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Assignment Instructions
                </span>
                <div
                  className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] max-h-48 overflow-y-auto leading-relaxed prose dark:prose-invert prose-xs"
                  dangerouslySetInnerHTML={{ __html: selectedAssignment.description }}
                />
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWhyIsThisHardCanvasAssignment(selectedAssignment)}
                className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="AI Cognitive Deconstruction"
              >
                <Brain className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Why Is This Hard?</span>
              </button>

              <button
                onClick={() => onSyncToSheet(selectedAssignment)}
                className="px-3 py-1.5 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Sync to Sheet
              </button>
            </div>

            <a
              href={resolveCanvasUrl(
                selectedAssignment.htmlUrl,
                settings.apiDomain,
                settings.calendarFeedUrl,
                selectedAssignment.courseId,
                selectedAssignment.id
              )}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Open in Canvas</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Why Is This Hard Modal */}
      {whyIsThisHardCanvasAssignment && (
        <WhyIsThisHardModal
          isOpen={Boolean(whyIsThisHardCanvasAssignment)}
          onClose={() => setWhyIsThisHardCanvasAssignment(null)}
          assignmentTitle={whyIsThisHardCanvasAssignment.name}
          courseName={whyIsThisHardCanvasAssignment.courseName}
          description={whyIsThisHardCanvasAssignment.description}
        />
      )}
    </div>
  );
};
