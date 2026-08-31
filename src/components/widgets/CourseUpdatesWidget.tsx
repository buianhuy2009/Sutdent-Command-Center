import React from 'react';
import {
  Bell,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface CourseUpdatesWidgetProps {
  onNavigate: (tabId: string) => void;
}

export const CourseUpdatesWidget: React.FC<CourseUpdatesWidgetProps> = ({
  onNavigate,
}) => {
  const updates = [
    {
      course: 'AP Physics C',
      instructor: 'Dr. Sarah Martinez',
      title: 'Lab 3 Discussion Guidelines & Rotational Dynamics Rubric posted',
      time: '2 hours ago',
      type: 'Announcement',
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    },
    {
      course: 'CS201 Data Structures',
      instructor: 'Prof. An Nguyen',
      title: 'Graph Traversal & Dijkstra Problem Set posted to Canvas',
      time: '5 hours ago',
      type: 'Assignment Update',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      course: 'AP Calculus BC',
      instructor: 'Prof. David Jenkins',
      title: 'Midterm 1 Review Session scheduled for Wednesday 4:00 PM',
      time: 'Yesterday',
      type: 'Milestone',
      badgeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Followed Course Reports &amp; News
            </h3>
          </div>
          <button
            onClick={() => onNavigate('canvas')}
            className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Canvas LMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {updates.map((update, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('canvas')}
              className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 transition-all cursor-pointer space-y-1.5 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5]">
                  {update.course}
                </span>
                <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${update.badgeColor}`}>
                  {update.type}
                </span>
              </div>

              <h4 className="text-xs font-bold text-[#D97757] group-hover:underline">
                {update.title}
              </h4>

              <div className="flex items-center justify-between text-[10px] text-[#8C897F] pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
                <span>By {update.instructor}</span>
                <span>{update.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>Synced with university LMS course stream</span>
        <button
          onClick={() => onNavigate('canvas')}
          className="text-[#D97757] hover:underline font-bold text-xs cursor-pointer"
        >
          View Full Feed
        </button>
      </div>
    </div>
  );
};
