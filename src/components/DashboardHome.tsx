import React, { useMemo } from 'react';
import { Quote, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { Assignment } from '../types';
import { getTodayQuote } from '../data/quotes';
import { MOCK_EMAIL_ALERTS } from '../data/mockData';

interface DashboardHomeProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => void;
  onNavigateWorkspace: (tabId: string) => void;
  onOpenQuickDraft?: any;
  onOpenAiSuite?: any;
  onOpenAppStore?: () => void;
  user?: User | null;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  assignments,
  onNavigateWorkspace,
  user,
}) => {
  // Real pending coursework count
  const pendingCount = assignments.filter((a) => a.status !== 'Done').length;

  // Real academic email alerts count
  const academicAlertsCount = MOCK_EMAIL_ALERTS.filter((e) => !e.isSpam).length;

  // Real focus sessions completed today (from localStorage)
  const completedFocusSessions = useMemo(() => {
    try {
      const saved = localStorage.getItem('scc_pomo_completed_v1');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  // Today's quote
  const todayQuote = useMemo(() => getTodayQuote(), []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#FAF9F5] dark:bg-[#141413] px-6 py-12 text-center animate-in fade-in duration-300 select-none">
      
      {/* Top Section: Branding / Welcome */}
      <div className="space-y-1.5 pt-6">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#8C897F] block">
          Academic Command Portal
        </span>
        <h2 className="text-sm font-bold tracking-tight text-[#141413] dark:text-[#FAF9F5] uppercase">
          StudentOS
        </h2>
      </div>

      {/* Middle Section: Centered Quote and Enter Button */}
      <div className="max-w-2xl w-full space-y-10 my-auto">
        {/* Beautiful Typography Quote */}
        <div className="space-y-4">
          <Quote className="w-6 h-6 text-[#D97757]/40 mx-auto" />
          <blockquote className="text-xl sm:text-2xl font-serif italic text-[#141413] dark:text-[#FAF9F5] leading-relaxed max-w-xl mx-auto">
            &ldquo;{todayQuote.quote}&rdquo;
          </blockquote>
          <cite className="text-xs font-bold text-[#8C897F] not-italic block mt-2">
            — {todayQuote.author} ({todayQuote.field})
          </cite>
        </div>

        {/* Insanely Short Summary */}
        <div className="flex items-center justify-center gap-2.5 text-xs text-[#8C897F] font-semibold tracking-wide">
          <span>{pendingCount} tasks pending</span>
          <span className="text-[#DFDACB] dark:text-[#2C2B27]">•</span>
          <span>{academicAlertsCount} academic notices</span>
          <span className="text-[#DFDACB] dark:text-[#2C2B27]">•</span>
          <span>{completedFocusSessions} focus sessions done</span>
        </div>

        {/* Enter Workspace Button */}
        <div>
          <button
            onClick={() => onNavigateWorkspace('canvas')}
            className="px-8 py-3.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#D97757]/15 hover:shadow-[#D97757]/25 hover:scale-[1.02] flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>Enter LMS Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Section: Footer metadata */}
      <div className="text-[10px] text-[#8C897F] font-mono select-none">
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </div>

    </div>
  );
};
