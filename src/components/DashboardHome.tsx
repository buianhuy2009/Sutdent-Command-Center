import React, { useState, useEffect, useMemo } from 'react';
import {
  Quote,
  ArrowRight,
  Edit2,
  Check,
  Shuffle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Assignment } from '../types';
import { getTodayQuote, QUOTE_BANK, DailyQuote } from '../data/quotes';
import { MOCK_EMAIL_ALERTS } from '../data/mockData';

const LOCAL_STORAGE_NAME_KEY = 'scc_user_preferred_name';
const LOCAL_STORAGE_INTENTION_KEY = 'scc_user_daily_intention';

interface DashboardHomeProps {
  assignments: Assignment[];
  onToggleAssignment?: (id: string) => void;
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
  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Personalized Preferred Name
  const [studentName, setStudentName] = useState<string>(() => {
    return (
      localStorage.getItem(LOCAL_STORAGE_NAME_KEY) ||
      user?.displayName?.split(' ')[0] ||
      'Student'
    );
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(studentName);

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Student';
    setStudentName(trimmed);
    localStorage.setItem(LOCAL_STORAGE_NAME_KEY, trimmed);
    setIsEditingName(false);
  };

  // Personalized Daily Intention
  const [dailyIntention, setDailyIntention] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_INTENTION_KEY) || '';
  });
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [intentionInput, setIntentionInput] = useState(dailyIntention);

  const handleSaveIntention = () => {
    const trimmed = intentionInput.trim();
    setDailyIntention(trimmed);
    localStorage.setItem(LOCAL_STORAGE_INTENTION_KEY, trimmed);
    setIsEditingIntention(false);
  };

  // Daily Quote with Shuffle
  const [quote, setQuote] = useState<DailyQuote>(() => getTodayQuote());

  const handleShuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTE_BANK.length);
    setQuote(QUOTE_BANK[randomIndex]);
  };

  // Real Counts (Zero Spoof)
  const pendingAssignments = useMemo(() => {
    return assignments.filter((a) => a.status !== 'Done');
  }, [assignments]);

  const nextUrgentAssignment = useMemo(() => {
    if (pendingAssignments.length === 0) return null;
    return [...pendingAssignments].sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    })[0];
  }, [pendingAssignments]);

  const academicAlertsCount = MOCK_EMAIL_ALERTS.filter((e) => !e.isSpam).length;

  const completedFocusSessions = useMemo(() => {
    try {
      const saved = localStorage.getItem('scc_pomo_completed_v1');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  const todayFormattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#FAF9F5] dark:bg-[#141413] px-6 py-10 text-center animate-in fade-in duration-300 select-none relative overflow-hidden">
      
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#D97757]/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 1. Top Section: Live Time, Date & Personalized Greeting */}
      <div className="space-y-3 pt-4 z-10">
        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#141413] dark:text-[#FAF9F5]">
          {currentTime}
        </div>

        <div className="flex items-center justify-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="px-3 py-0.5 text-sm font-bold bg-white dark:bg-[#1F1E1B] border border-[#D97757] rounded-xl focus:outline-none text-[#141413] dark:text-[#FAF9F5] text-center"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 bg-[#D97757] text-white rounded-lg cursor-pointer"
                title="Save name"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setNameInput(studentName); setIsEditingName(true); }}>
              <span className="text-sm sm:text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                {greetingTime}, {studentName}
              </span>
              <Edit2 className="w-3 h-3 text-[#8C897F] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Personalized Daily Intention */}
        <div className="max-w-md mx-auto">
          {isEditingIntention ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={intentionInput}
                onChange={(e) => setIntentionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveIntention()}
                placeholder="What is your main focus today?"
                className="w-full px-3 py-1 text-xs bg-white dark:bg-[#1F1E1B] border border-[#D97757] rounded-xl focus:outline-none text-[#141413] dark:text-[#FAF9F5] text-center"
                autoFocus
              />
              <button
                onClick={handleSaveIntention}
                className="p-1.5 bg-[#D97757] text-white rounded-lg cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p
              onClick={() => { setIntentionInput(dailyIntention); setIsEditingIntention(true); }}
              className="text-xs text-[#8C897F] hover:text-[#D97757] transition-colors cursor-pointer italic line-clamp-1"
              title="Click to edit your daily focus intention"
            >
              {dailyIntention ? `"${dailyIntention}"` : 'Set today\'s personal focus intention...'}
            </p>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Philosophical Quote & Travel Button */}
      <div className="max-w-2xl w-full space-y-8 my-auto z-10">
        
        {/* Daily Quote Card with Hover Shuffle */}
        <div className="space-y-4 relative group">
          <div className="flex items-center justify-center gap-2">
            <Quote className="w-5 h-5 text-[#D97757]/40" />
            <button
              onClick={handleShuffleQuote}
              className="p-1 text-[#8C897F] hover:text-[#D97757] rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Get another quote"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>

          <blockquote className="text-xl sm:text-2xl font-serif italic text-[#141413] dark:text-[#FAF9F5] leading-relaxed max-w-xl mx-auto px-4">
            &ldquo;{quote.quote}&rdquo;
          </blockquote>

          <cite className="text-xs font-bold text-[#8C897F] not-italic block">
            — {quote.author} <span className="text-[10px] font-mono text-[#8C897F]/70">({quote.field})</span>
          </cite>
        </div>

        {/* Short Status Summary */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#8C897F] font-semibold">
          <span>{pendingAssignments.length} tasks pending</span>
          <span className="text-[#DFDACB] dark:text-[#2C2B27]">•</span>
          <span>{academicAlertsCount} academic notices</span>
          <span className="text-[#DFDACB] dark:text-[#2C2B27]">•</span>
          <span>{completedFocusSessions} focus sprints done</span>
        </div>

        {/* Next Urgent Assignment Chip (If any) */}
        {nextUrgentAssignment && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] text-xs shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97757]">
              Next up:
            </span>
            <span className="font-bold text-[#141413] dark:text-[#FAF9F5] truncate max-w-xs">
              {nextUrgentAssignment.assignmentName}
            </span>
            <span className="text-[10px] font-mono text-[#8C897F]">
              ({nextUrgentAssignment.dueDate || 'Soon'})
            </span>
          </div>
        )}

        {/* Enter LMS Workspace Travel Button */}
        <div>
          <button
            onClick={() => onNavigateWorkspace('canvas')}
            className="px-8 py-3.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#D97757]/15 hover:shadow-[#D97757]/30 hover:scale-[1.02] flex items-center gap-2 mx-auto cursor-pointer group"
          >
            <span>Enter LMS Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* 3. Bottom Section: Date Metadata */}
      <div className="text-[11px] text-[#8C897F] font-mono select-none z-10">
        {todayFormattedDate}
      </div>

    </div>
  );
};
