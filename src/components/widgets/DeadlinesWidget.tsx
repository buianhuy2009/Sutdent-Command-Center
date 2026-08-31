import React from 'react';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  Circle,
  Plus,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Assignment } from '../../types';

interface DeadlinesWidgetProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => void;
  onNavigate: (tabId: string) => void;
}

export const DeadlinesWidget: React.FC<DeadlinesWidgetProps> = ({
  assignments,
  onToggleAssignment,
  onNavigate,
}) => {
  const pendingAssignments = assignments
    .filter((a) => a.status !== 'Done')
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 5);

  const doneCount = assignments.filter((a) => a.status === 'Done').length;

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Upcoming Deadlines ({pendingAssignments.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('tracker')}
            className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Master Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {pendingAssignments.length === 0 ? (
            <div className="py-10 text-center text-[#8C897F] text-xs space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-[#141413] dark:text-[#FAF9F5]">No pending deadlines!</p>
              <p className="text-[11px]">All assigned coursework is complete.</p>
            </div>
          ) : (
            pendingAssignments.map((task) => {
              const isHigh = task.priority === 'High';

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 hover:border-[#D97757]/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                        onToggleAssignment(task.id);
                      }}
                      className="text-[#8C897F] hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      title="Mark as done"
                    >
                      <Circle className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded truncate max-w-[110px]">
                          {task.subject}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate mt-0.5">
                        {task.assignmentName}
                      </h4>
                    </div>
                  </div>

                  <span className="text-[11px] text-[#8C897F] font-mono shrink-0">
                    {task.dueDate || 'Soon'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>{doneCount} assignments completed this term</span>
        <button
          onClick={() => onNavigate('tracker')}
          className="text-[#D97757] hover:underline font-bold text-xs cursor-pointer"
        >
          Open Board View
        </button>
      </div>
    </div>
  );
};
