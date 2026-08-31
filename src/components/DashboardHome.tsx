import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  Calculator,
  PenTool,
  BookOpen,
  FolderOpen,
  Brain,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  ArrowRight,
  CheckSquare,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Assignment, DashboardWidgetConfig, WorkspaceId } from '../types';

const LOCAL_WIDGETS_KEY = 'scc_dashboard_widgets_v1';

function loadSavedWidgetConfig(): DashboardWidgetConfig {
  try {
    const saved = localStorage.getItem(LOCAL_WIDGETS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading widget config:', e);
  }
  return {
    showDeadlines: true,
    showPomodoroStreak: true,
    showPinnedTools: true,
    showScratchpad: true,
  };
}

function saveWidgetConfig(config: DashboardWidgetConfig) {
  try {
    localStorage.setItem(LOCAL_WIDGETS_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving widget config:', e);
  }
}

interface DashboardHomeProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
  onOpenQuickDraft: () => void;
  onOpenAiSuite?: (tab?: 'planner' | 'syllabus' | 'quiz' | 'grades') => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  assignments,
  onToggleAssignment,
  onNavigateWorkspace,
  onOpenQuickDraft,
  onOpenAiSuite,
}) => {
  const [widgetConfig, setWidgetConfig] = useState<DashboardWidgetConfig>(loadSavedWidgetConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Scratchpad State
  const [scratchpad, setScratchpad] = useState<string>(() => {
    try {
      return localStorage.getItem('scc_dashboard_scratchpad') || '';
    } catch {
      return '';
    }
  });

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpad(val);
    try {
      localStorage.setItem('scc_dashboard_scratchpad', val);
    } catch {}
  };

  const updateWidget = (key: keyof DashboardWidgetConfig, val: boolean) => {
    const updated = { ...widgetConfig, [key]: val };
    setWidgetConfig(updated);
    saveWidgetConfig(updated);
  };

  const upcomingDeadlines = assignments
    .filter((a) => a.status !== 'Done')
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      assignmentName: a.assignmentName,
      subject: a.subject || 'General',
      dueDate: a.dueDate || 'Upcoming',
    }));

  const completedCount = assignments.filter((a) => a.status === 'Done').length;
  const totalCount = assignments.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  // Streak state from localStorage
  const pomodoroStreak = (() => {
    try {
      const saved = localStorage.getItem('scc_pomodoro_streak_today');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  })();

  // 28-day study heatmap mock data (GitHub contribution style)
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const isToday = i === 27;
    const intensity = isToday ? (pomodoroStreak > 3 ? 4 : pomodoroStreak > 0 ? 2 : 0) : (i * 7) % 5;
    return {
      day: i + 1,
      intensity, // 0 = none, 1 = light, 2 = medium, 3 = high, 4 = max
      isToday,
    };
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner: Academic Summary & AI Suite Launcher */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#141413] dark:text-[#FAF9F5]">
              Academic Command Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Semester Active
            </span>
          </div>
          <p className="text-xs text-[#8C897F]">
            {totalCount - completedCount} pending assignments • {completedCount} completed ({completionPercent}%) • {pomodoroStreak} focus sprints today
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onOpenAiSuite?.('planner')}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Study Planner</span>
          </button>

          <button
            onClick={() => onOpenAiSuite?.('quiz')}
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Practice Quiz</span>
          </button>

          <button
            onClick={() => onOpenAiSuite?.('syllabus')}
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Parse Syllabus</span>
          </button>
        </div>
      </div>

      {/* Grid Section 1: Study Velocity Heatmap & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Upcoming Deadlines */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                <Clock className="w-4 h-4 text-[#D97757]" />
                <span>Upcoming Coursework Deadlines</span>
              </div>
              <button
                onClick={() => onNavigateWorkspace('academic')}
                className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-[#8C897F] text-xs">
                  <p>No pending deadlines due soon! You&apos;re completely caught up.</p>
                </div>
              ) : (
                upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 hover:border-[#D97757]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleAssignment(item.id)}
                        className="w-4 h-4 rounded border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] flex items-center justify-center shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#D97757] block truncate">
                          {item.subject}
                        </span>
                        <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                          {item.assignmentName}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#8C897F] font-mono shrink-0">
                      {item.dueDate}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
            <span>{completedCount} assignments completed this semester</span>
            <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">{completionPercent}% on-track</span>
          </div>
        </section>

        {/* Right 5 cols: Study Velocity Heatmap & Focus */}
        <section className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>28-Day Study Velocity</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {pomodoroStreak} Sprints Today
              </span>
            </div>

            {/* Contribution Grid */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-7 gap-1.5">
                {heatmapDays.map((d) => {
                  const colors = [
                    'bg-[#EFECE2] dark:bg-[#252422]',
                    'bg-[#D97757]/30',
                    'bg-[#D97757]/60',
                    'bg-[#D97757]/80',
                    'bg-[#D97757]',
                  ];
                  return (
                    <div
                      key={d.day}
                      className={`h-6 rounded-md ${colors[d.intensity]} ${
                        d.isToday ? 'ring-2 ring-amber-500' : ''
                      } transition-all`}
                      title={`Day ${d.day}: ${d.intensity > 0 ? `${d.intensity * 25} mins` : 'Rest day'}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#8C897F] pt-1">
                <span>4 Weeks Ago</span>
                <span className="font-bold text-[#D97757]">Today</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
            <span className="text-[11px] text-[#8C897F]">Ready for another sprint?</span>
            <button
              onClick={() => onNavigateWorkspace('retention')}
              className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Focus Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* Grid Section 2: Quick Pinned Tools & Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 cols: Pinned Tools */}
        <section className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97757]" />
            <span>Academic Tools Switchboard</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Desmos 2D', icon: Calculator, ws: 'stem' as WorkspaceId, color: 'text-blue-500' },
              { label: 'Excalidraw', icon: PenTool, ws: 'creation' as WorkspaceId, color: 'text-purple-500' },
              { label: 'NotebookLM', icon: BookOpen, ws: 'retention' as WorkspaceId, color: 'text-indigo-500' },
              { label: 'Flashcards (SM-2)', icon: Brain, ws: 'retention' as WorkspaceId, color: 'text-amber-500' },
              { label: 'Google Drive', icon: FolderOpen, ws: 'documents' as WorkspaceId, color: 'text-emerald-500' },
              { label: 'Dual Split Screen', icon: SlidersHorizontal, ws: 'splitscreen' as WorkspaceId, color: 'text-rose-500' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.label}
                  onClick={() => onNavigateWorkspace(tool.ws)}
                  className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                  <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right 6 cols: Scratchpad */}
        <section className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#D97757]" />
                <span>Persistent Lecture Scratchpad</span>
              </h3>
              <span className="text-[10px] text-[#8C897F] font-mono">Auto-saved</span>
            </div>

            <textarea
              rows={6}
              value={scratchpad}
              onChange={handleScratchpadChange}
              placeholder="Jot down quick homework reminders, professor tips, formulas, or lecture thoughts..."
              className="w-full mt-3 p-4 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 text-[11px] text-[#8C897F] flex items-center justify-between">
            <span>Auto-persisted locally</span>
            <button
              onClick={() => onNavigateWorkspace('documents')}
              className="text-[#D97757] hover:underline font-semibold cursor-pointer"
            >
              Open Full Markdown Studio
            </button>
          </div>
        </section>
      </div>

    </div>
  );
};
