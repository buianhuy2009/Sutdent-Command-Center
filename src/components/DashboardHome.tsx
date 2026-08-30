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
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  assignments,
  onToggleAssignment,
  onNavigateWorkspace,
  onOpenQuickDraft,
}) => {
  const [widgetConfig, setWidgetConfig] = useState<DashboardWidgetConfig>(loadSavedWidgetConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Scratchpad State
  const [scratchpad, setScratchpad] = useState<string>(() => {
    try {
      return localStorage.getItem('scc_lecture_scratchpad') || '';
    } catch {
      return '';
    }
  });

  const pomodoroStreak = (() => {
    try {
      const saved = localStorage.getItem('scc_pomodoro_streak_today');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  })();

  const updateWidget = (key: keyof DashboardWidgetConfig, value: boolean) => {
    const updated = { ...widgetConfig, [key]: value };
    setWidgetConfig(updated);
    saveWidgetConfig(updated);
  };

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setScratchpad(text);
    try {
      localStorage.setItem('scc_lecture_scratchpad', text);
    } catch {}
  };

  // Urgent today & upcoming deadlines
  const upcomingDeadlines = assignments
    .filter((a) => a.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#FAF9F5] to-[#F5F2EB] dark:from-[#1A1917] dark:to-[#22211E] rounded-3xl p-6 sm:p-8 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/20 uppercase tracking-wider">
              Student OS Active
            </span>
            <span className="text-xs text-[#8C897F]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight mt-2">
            Academic Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#8C897F] mt-1 max-w-xl">
            Unified workspace for course deadlines, STEM calculators, whiteboards, focus sprints, and research.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateWorkspace('splitscreen')}
            className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Split-Screen Dock
          </button>

          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="p-2 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl transition-colors cursor-pointer"
            title="Configure Dashboard Widgets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Customizer Dropdown */}
      {showConfigModal && (
        <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="text-[#8C897F] uppercase tracking-wider text-[10px]">Toggle Widgets:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={widgetConfig.showDeadlines}
              onChange={(e) => updateWidget('showDeadlines', e.target.checked)}
              className="rounded text-[#D97757] focus:ring-[#D97757]"
            />
            <span>Upcoming Due Dates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={widgetConfig.showPomodoroStreak}
              onChange={(e) => updateWidget('showPomodoroStreak', e.target.checked)}
              className="rounded text-[#D97757] focus:ring-[#D97757]"
            />
            <span>Pomodoro Streak</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={widgetConfig.showPinnedTools}
              onChange={(e) => updateWidget('showPinnedTools', e.target.checked)}
              className="rounded text-[#D97757] focus:ring-[#D97757]"
            />
            <span>Pinned Study Tools</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={widgetConfig.showScratchpad}
              onChange={(e) => updateWidget('showScratchpad', e.target.checked)}
              className="rounded text-[#D97757] focus:ring-[#D97757]"
            />
            <span>Quick Scratchpad</span>
          </label>
        </div>
      )}

      {/* Modular Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget 1: Upcoming Due Dates (7 cols) */}
        {widgetConfig.showDeadlines && (
          <section className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D97757]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                    Upcoming Due Dates
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateWorkspace('academic')}
                  className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Agenda</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-8 text-center text-[#8C897F] text-xs">
                    <p>No pending deadlines due soon! You&apos;re completely caught up.</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 hover:border-[#D97757]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleAssignment(item.id)}
                          className="w-4 h-4 rounded border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] flex items-center justify-center shrink-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#D97757] block truncate">
                            {item.subject}
                          </span>
                          <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate mt-0.5">
                            {item.assignmentName}
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#8C897F] font-mono shrink-0">
                        {item.dueDate}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
              <span>{assignments.filter((a) => a.status === 'Done').length} assignments completed so far</span>
            </div>
          </section>
        )}

        {/* Widget 2: Daily Pomodoro Streak & Focus (5 cols) */}
        {widgetConfig.showPomodoroStreak && (
          <section className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                    Daily Focus Streak
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                  {pomodoroStreak} Sprints
                </span>
              </div>

              <div className="my-6 text-center">
                <div className="text-4xl font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                  {pomodoroStreak * 25} Minutes
                </div>
                <p className="text-xs text-[#8C897F] mt-1">Deep work focused today</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#8C897F]">Ready for your next sprint?</span>
              <button
                onClick={() => onNavigateWorkspace('retention')}
                className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Launch Focus Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* Widget 3: Pinned Study Tools (6 cols) */}
        {widgetConfig.showPinnedTools && (
          <section className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97757]" />
              <span>Pinned Academic Tools</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Desmos Grapher', icon: Calculator, ws: 'stem' as WorkspaceId, color: 'text-blue-500' },
                { label: 'Excalidraw', icon: PenTool, ws: 'creation' as WorkspaceId, color: 'text-purple-500' },
                { label: 'NotebookLM', icon: BookOpen, ws: 'retention' as WorkspaceId, color: 'text-indigo-500' },
                { label: 'Flashcard SRS', icon: Brain, ws: 'retention' as WorkspaceId, color: 'text-amber-500' },
                { label: 'Drive Files', icon: FolderOpen, ws: 'documents' as WorkspaceId, color: 'text-emerald-500' },
                { label: 'Split-Screen', icon: SlidersHorizontal, ws: 'splitscreen' as WorkspaceId, color: 'text-rose-500' },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    onClick={() => onNavigateWorkspace(tool.ws)}
                    className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Icon className={`w-5 h-5 ${tool.color}`} />
                    <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Widget 4: Quick Scratchpad (6 cols) */}
        {widgetConfig.showScratchpad && (
          <section className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#D97757]" />
                  <span>Persistent Scratchpad</span>
                </h3>
                <span className="text-[10px] text-[#8C897F] font-mono">Synced locally</span>
              </div>

              <textarea
                rows={5}
                value={scratchpad}
                onChange={handleScratchpadChange}
                placeholder="Jot down quick homework reminders, formulas, or thoughts..."
                className="w-full mt-3 p-3 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2 text-[11px] text-[#8C897F] flex items-center justify-between">
              <span>Auto-saved continuously</span>
              <button
                onClick={() => onNavigateWorkspace('documents')}
                className="text-[#D97757] hover:underline font-semibold cursor-pointer"
              >
                Open Full Markdown Notes
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
