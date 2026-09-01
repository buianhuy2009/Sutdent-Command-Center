import React from 'react';
import { Calendar, CheckSquare, HardDrive, Inbox } from 'lucide-react';

export const EmptyState: React.FC<{ icon?: any; title: string; description: string; actionLabel?: string; onAction?: () => void; }> = ({ icon: Icon = Inbox, title, description, actionLabel, onAction }) => (
  <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
    <div className="w-16 h-16 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-center">
      <Icon className="w-7 h-7 text-[#D97757] opacity-80" aria-hidden="true" />
    </div>
    <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">{title}</h4>
    <p className="text-xs text-[#6B6860] max-w-sm leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-2 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
        {actionLabel}
      </button>
    )}
  </div>
);

export const EmptyTodayEvents = (props: { onConnect?: () => void }) => <EmptyState icon={Calendar} title="No events today" description="Your calendar is clear — perfect time for a deep-work block." actionLabel={props.onConnect ? "Connect Calendar" : undefined} onAction={props.onConnect} />;
export const EmptyAssignments = () => <EmptyState icon={CheckSquare} title="All caught up" description="No pending assignments — add a task or sync Canvas to get started." />;
export const EmptyFiles = () => <EmptyState icon={HardDrive} title="No recent files" description="Connect Google Drive to see your Docs, Sheets and Slides here." />;
