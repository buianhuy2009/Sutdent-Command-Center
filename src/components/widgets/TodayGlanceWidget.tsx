import React from 'react';
import {
  Clock,
  Calendar,
  Mail,
  Timer,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Assignment, EmailAlert } from '../../types';
import { getMockTodayEvents, MOCK_EMAIL_ALERTS } from '../../data/mockData';

interface TodayGlanceWidgetProps {
  assignments: Assignment[];
  onNavigate: (tabId: string) => void;
  onOpenQuickDraft?: (emailAlert?: EmailAlert) => void;
}

export const TodayGlanceWidget: React.FC<TodayGlanceWidgetProps> = ({
  assignments,
  onNavigate,
  onOpenQuickDraft,
}) => {
  // 1. Next Upcoming Deadline
  const nextDeadline = assignments
    .filter((a) => a.status !== 'Done')
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    })[0];

  // 2. Next Calendar Event / Class
  const todayEvents = getMockTodayEvents();
  const nextEvent = todayEvents[0];

  // 3. Most Urgent Academic Email Alert (AI Classified)
  const urgentEmail = MOCK_EMAIL_ALERTS.find((e) => e.urgency === 'HIGH' && !e.isSpam) || MOCK_EMAIL_ALERTS[0];

  // 4. Focus Streak / Pomodoro Sessions
  const completedFocusSessions = (() => {
    try {
      const saved = localStorage.getItem('scc_pomo_completed_v1');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="bg-gradient-to-br from-white via-white to-amber-50/30 dark:from-[#1A1917] dark:via-[#1A1917] dark:to-[#252422] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D97757]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
            Today at a Glance
          </h3>
        </div>
        <span className="text-[11px] text-[#8C897F] font-semibold">
          High-Priority Realtime Sync
        </span>
      </div>

      {/* 4 Hero Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Next Deadline */}
        <div
          onClick={() => onNavigate('tracker')}
          className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] transition-all cursor-pointer space-y-2 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Next Deadline</span>
            </span>
            {nextDeadline && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {nextDeadline.priority}
              </span>
            )}
          </div>

          {nextDeadline ? (
            <div>
              <span className="text-[10px] font-bold text-[#D97757] block truncate">
                {nextDeadline.subject}
              </span>
              <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] line-clamp-1 group-hover:text-[#D97757] transition-colors">
                {nextDeadline.assignmentName}
              </h4>
              <p className="text-[11px] text-[#8C897F] font-mono mt-0.5">
                Due: {nextDeadline.dueDate || 'Today'}
              </p>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>All caught up!</span>
            </div>
          )}

          <div className="text-[10px] font-bold text-[#D97757] flex items-center gap-1 pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
            <span>View Tracker</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Next Class / Event */}
        <div
          onClick={() => onNavigate('radar')}
          className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] transition-all cursor-pointer space-y-2 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Next Class / Lab</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Live Schedule
            </span>
          </div>

          {nextEvent ? (
            <div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block truncate">
                {nextEvent.location || 'Campus'}
              </span>
              <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] line-clamp-1 group-hover:text-blue-600 transition-colors">
                {nextEvent.summary}
              </h4>
              <p className="text-[11px] text-[#8C897F] font-mono mt-0.5">
                {new Date(nextEvent.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(nextEvent.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-[#8C897F]">
              <span>No remaining events today</span>
            </div>
          )}

          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
            <span>Open Schedule</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: AI-Classified Important Email */}
        <div
          onClick={() => {
            if (onOpenQuickDraft && urgentEmail) {
              onOpenQuickDraft(urgentEmail);
            } else {
              onNavigate('gmail');
            }
          }}
          className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] transition-all cursor-pointer space-y-2 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>Important Email</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              AI Urgent
            </span>
          </div>

          {urgentEmail ? (
            <div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                {urgentEmail.sender}
              </span>
              <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] line-clamp-1 group-hover:text-[#D97757] transition-colors">
                {urgentEmail.subject}
              </h4>
              <p className="text-[11px] text-[#8C897F] line-clamp-1 mt-0.5">
                {urgentEmail.oneLineSummary}
              </p>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-[#8C897F]">
              <span>Inbox clean</span>
            </div>
          )}

          <div className="text-[10px] font-bold text-[#D97757] flex items-center gap-1 pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
            <span>Quick AI Reply</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Focus Station & Daily Sprints */}
        <div
          onClick={() => onNavigate('pomodoro')}
          className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] transition-all cursor-pointer space-y-2 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Focus Station</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Web Audio
            </span>
          </div>

          <div>
            <div className="text-xl font-mono font-extrabold text-[#141413] dark:text-[#FAF9F5]">
              {completedFocusSessions} Sprints
            </div>
            <p className="text-[11px] text-[#8C897F] mt-0.5">
              {completedFocusSessions > 0
                ? `${completedFocusSessions * 25} minutes of deep work completed today`
                : 'Start a 25-minute focus session with ambient soundscapes'}
            </p>
          </div>

          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
            <span>Launch Pomodoro</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
};
