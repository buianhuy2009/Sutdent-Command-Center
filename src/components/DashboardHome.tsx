import React, { useState, useEffect, useMemo } from 'react';
import {
  Quote,
  ArrowRight,
  Edit2,
  Check,
  Shuffle,
  Clock,
  Sparkles,
  Calendar,
  BookOpen,
  Mail,
  Timer,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Assignment, CalendarEvent, EmailAlert } from '../types';
import { getTodayQuote, QUOTE_BANK, DailyQuote } from '../data/quotes';
import { MOCK_EMAIL_ALERTS, getMockTodayEvents } from '../data/mockData';
import { fetchNasaApod, NasaApod } from '../services/publicApis';

const LOCAL_STORAGE_NAME_KEY = 'scc_user_preferred_name';
const LOCAL_STORAGE_INTENTION_KEY = 'scc_user_daily_intention';
const LOCAL_STORAGE_VIBE_KEY = 'scc_user_selected_vibe';
const LOCAL_STORAGE_SPRINT_GOAL_KEY = 'scc_user_sprint_goal';

interface DashboardHomeProps {
  assignments: Assignment[];
  onToggleAssignment?: (id: string) => void;
  onNavigateWorkspace: (tabId: string) => void;
  onOpenQuickDraft?: any;
  onOpenAiSuite?: any;
  onOpenAppStore?: () => void;
  user?: User | null;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onOpenStudyPlan?: () => void;
  calendarEvents?: CalendarEvent[];
  emailAlerts?: EmailAlert[];
}

type VibeType = 'focus' | 'calm' | 'creative' | 'recharge';

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  assignments,
  onNavigateWorkspace,
  user,
  isGoogleConnected = false,
  onConnectGoogle,
  onOpenStudyPlan,
  calendarEvents = [],
  emailAlerts = [],
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

  // Time-aware greeting prefix
  const greetingPrefix = useMemo(() => {
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

  // Personalized Daily Vibe/Theme selector
  const [selectedVibe, setSelectedVibe] = useState<VibeType>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_VIBE_KEY) as VibeType) || 'focus';
  });

  const handleSelectVibe = (vibe: VibeType) => {
    setSelectedVibe(vibe);
    localStorage.setItem(LOCAL_STORAGE_VIBE_KEY, vibe);
  };

  // Personalized Focus Sprint Goal
  const [sprintGoal, setSprintGoal] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SPRINT_GOAL_KEY);
    return saved ? parseInt(saved, 10) : 4;
  });

  const handleAdjustSprintGoal = (amount: number) => {
    setSprintGoal((prev) => {
      const next = Math.max(1, Math.min(10, prev + amount));
      localStorage.setItem(LOCAL_STORAGE_SPRINT_GOAL_KEY, next.toString());
      return next;
    });
  };

  // Today's quote
  const [quote, setQuote] = useState<DailyQuote>(() => getTodayQuote());

  const handleShuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTE_BANK.length);
    setQuote(QUOTE_BANK[randomIndex]);
  };

  // Real Counts & Overviews (No Spoofing)
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

  const todayEvents = useMemo(() => {
    if (!isGoogleConnected) return [];
    return calendarEvents;
  }, [calendarEvents, isGoogleConnected]);

  const academicAlertsCount = useMemo(() => {
    if (!isGoogleConnected) return 0;
    return emailAlerts.filter((e) => !e.isSpam).length;
  }, [emailAlerts, isGoogleConnected]);

  const [completedFocusSessions, setCompletedFocusSessions] = useState<number>(() => {
    try { const saved = localStorage.getItem('scc_pomo_completed_v1'); return saved ? parseInt(saved, 10) : 0; } catch { return 0; }
  });
  useEffect(() => {
    const poll = () => {
      try { const v = localStorage.getItem('scc_pomo_completed_v1'); setCompletedFocusSessions(v ? parseInt(v, 10) : 0); } catch {}
    };
    let bc: BroadcastChannel | null = null; try { bc = new BroadcastChannel('scc-pomo'); } catch {}
    const onStorage = (e: StorageEvent) => { if (e.key === 'scc_pomo_completed_v1') poll(); };
    const onFocus = () => poll();
    const onBc = () => poll();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    bc?.addEventListener('message', onBc as any);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus); bc?.close(); };
  }, []);

  const todayFormattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // Vibe background glow settings
  const vibeGlowClass = {
    focus: 'from-[#D97757]/10',
    calm: 'from-blue-500/8 dark:from-blue-900/10',
    creative: 'from-violet-500/8 dark:from-violet-900/10',
    recharge: 'from-emerald-500/8 dark:from-emerald-900/10',
  }[selectedVibe];

  const vibeBorderHoverClass = {
    focus: 'hover:border-[#D97757]',
    calm: 'hover:border-blue-500',
    creative: 'hover:border-violet-500',
    recharge: 'hover:border-emerald-500',
  }[selectedVibe];

  const vibeTextAccentClass = {
    focus: 'text-[#D97757]',
    calm: 'text-blue-500 dark:text-blue-400',
    creative: 'text-violet-500 dark:text-violet-400',
    recharge: 'text-emerald-600 dark:text-emerald-400',
  }[selectedVibe];

  const [nasaApod, setNasaApod] = useState<NasaApod | null>(null);

  useEffect(() => {
    const isApodEnabled = localStorage.getItem('scc_enable_nasa_apod') === 'true';
    if (isApodEnabled) {
      fetchNasaApod().then((data) => {
        if (data && data.mediaType === 'image') {
          setNasaApod(data);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#FAF9F5] dark:bg-[#141413] px-6 py-12 text-center animate-in fade-in duration-300 select-none relative overflow-y-auto">
      
      {/* NASA APOD — lazy loaded img with srcset for LCP */}
      {nasaApod && (
        <img
          src={nasaApod.url}
          alt={nasaApod.title || 'NASA Astronomy Picture of the Day'}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none transition-opacity duration-1000"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Dynamic Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br ${vibeGlowClass} via-transparent to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-700`} />

      {/* Top Bar metadata */}
      <div className="w-full max-w-4xl flex items-center justify-between text-[11px] text-[#8C897F] font-mono z-10 shrink-0">
        <span>{todayFormattedDate}</span>
        <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
          <Clock className="w-3.5 h-3.5" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Main Centered Personalization Hub */}
      <div className="max-w-3xl w-full space-y-12 my-auto py-8 z-10">
        
        {/* Large Typographic Piece: The Personalized Greeting */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="px-4 py-1.5 text-4xl sm:text-5xl font-extrabold bg-white dark:bg-[#1F1E1B] border-2 border-[#D97757] rounded-2xl focus:outline-none text-[#141413] dark:text-[#FAF9F5] text-center max-w-md shadow-xs"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-3 bg-[#D97757] text-white rounded-xl shadow-sm cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center gap-3.5 group cursor-pointer"
                onClick={() => {
                  setNameInput(studentName);
                  setIsEditingName(true);
                }}
                title="Click to change preferred name"
              >
                <h1 className="text-4xl sm:text-6xl font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight leading-tight">
                  {greetingPrefix}, {studentName}
                </h1>
                <Edit2 className="w-5 h-5 text-[#8C897F] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* Inline Daily Intention under Greeting */}
          <div className="max-w-lg mx-auto">
            {isEditingIntention ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={intentionInput}
                  onChange={(e) => setIntentionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveIntention()}
                  placeholder="What is your focus priority today?"
                  className="w-full px-4 py-1.5 text-sm bg-white dark:bg-[#1F1E1B] border border-[#D97757] rounded-xl focus:outline-none text-[#141413] dark:text-[#FAF9F5] text-center"
                  autoFocus
                />
                <button
                  onClick={handleSaveIntention}
                  className="p-2 bg-[#D97757] text-white rounded-lg cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p
                onClick={() => {
                  setIntentionInput(dailyIntention);
                  setIsEditingIntention(true);
                }}
                className="text-xs sm:text-sm text-[#8C897F] hover:text-[#D97757] transition-colors cursor-pointer italic leading-relaxed"
                title="Click to update focus intention"
              >
                {dailyIntention ? `"${dailyIntention}"` : 'Set today\'s focus intention...'}
              </p>
            )}
          </div>
        </div>

        {/* Today's Plan — centered value (3 next actions + CTA) */}
        {pendingAssignments.length > 0 && (
          <div className="bg-white/70 dark:bg-[#1C1B19]/60 backdrop-blur-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 text-left space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#D97757]" /><span>Today&apos;s Plan — Next 3 Actions</span></h3>
            <div className="space-y-2">
              {pendingAssignments.slice(0,3).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#DFDACB]/40 text-xs">
                  <span className="font-semibold truncate">{a.assignmentName}</span>
                  <span className="text-[11px] text-[#8C897F] ml-2 shrink-0">{a.subject} • Due {a.dueDate}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>onNavigateWorkspace('tracker')} className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">Open Assignment Tracker <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Personalize — collapsible drawer (moved from center) */}
        <details className="bg-white/40 dark:bg-[#1C1B19]/30 backdrop-blur-md rounded-3xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 p-4 sm:p-5 text-xs text-left group">
          <summary className="list-none flex items-center justify-between cursor-pointer font-bold text-[#8C897F] uppercase tracking-wider">Personalize <span className="text-[10px] bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] px-2 py-0.5 rounded-full">Edit</span></summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Left: Vibe / Ambient Light Selection */}
          <div className="space-y-2">
            <span className="font-bold text-[#8C897F] uppercase tracking-wider block">
              Personalized Vibe &amp; Glow
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'focus', label: 'Study Focus', color: 'bg-[#D97757] text-white border-[#D97757]' },
                  { id: 'calm', label: 'Mindful Calm', color: 'bg-blue-500 text-white border-blue-500' },
                  { id: 'creative', label: 'Creative flow', color: 'bg-violet-500 text-white border-violet-500' },
                  { id: 'recharge', label: 'Recharge rest', color: 'bg-emerald-500 text-white border-emerald-500' },
                ] as const
              ).map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => handleSelectVibe(vibe.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                    selectedVibe === vibe.id
                      ? `${vibe.color} shadow-2xs`
                      : 'bg-white/70 dark:bg-[#1E1D1B]/50 border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  {vibe.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Daily Sprint Target Goal */}
          <div className="space-y-2 flex flex-col justify-center">
            <span className="font-bold text-[#8C897F] uppercase tracking-wider block">
              Daily Pomodoro Target
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/70 dark:bg-[#1E1D1B]/50 border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl px-3 py-1 font-bold">
                <span className="font-mono text-sm text-[#141413] dark:text-[#FAF9F5]">
                  {completedFocusSessions} / {sprintGoal} Sprints
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/70 dark:bg-[#1E1D1B]/50 border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl p-0.5">
                <button
                  onClick={() => handleAdjustSprintGoal(-1)}
                  className="p-1 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors"
                  title="Decrease target"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAdjustSprintGoal(1)}
                  className="p-1 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors"
                  title="Increase target"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          </div>
        </details>

        {/* Real-time Academic Overview Block */}
        <div className="bg-white/60 dark:bg-[#1C1B19]/50 backdrop-blur-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 sm:p-6 text-left space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D97757]" />
              <span>Real-Time Academic Overview</span>
            </h3>
            <span className="text-[10px] text-[#8C897F] font-mono">
              Live State Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            {/* Column 1: Deadlines */}
            <div className="space-y-2 p-3 bg-[#FAF9F5]/80 dark:bg-[#1A1917]/80 rounded-2xl border border-[#DFDACB]/40">
              <div className="flex items-center gap-1.5 font-bold text-[#8C897F]">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                <span>Coursework</span>
              </div>
              <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                {pendingAssignments.length} deadlines pending
              </p>
              {nextUrgentAssignment && (
                <p className="text-[11px] text-[#8C897F] truncate">
                  Next: {nextUrgentAssignment.assignmentName}
                </p>
              )}
            </div>

            {/* Column 2: Scheduled Events */}
            <div className="space-y-2 p-3 bg-[#FAF9F5]/80 dark:bg-[#1A1917]/80 rounded-2xl border border-[#DFDACB]/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#8C897F]">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Today&apos;s Schedule</span>
                </div>
                {isGoogleConnected ? (
                  <>
                    <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {todayEvents.length} events scheduled
                    </p>
                    {todayEvents[0] ? (
                      <p className="text-[11px] text-[#8C897F] truncate">
                        Next: {todayEvents[0].summary}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#8C897F] italic">
                        No remaining events
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Google disconnected
                    </p>
                    <button
                      onClick={onConnectGoogle}
                      className="w-full mt-1.5 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] hover:text-[#C86646] rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      Connect Calendar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Column 3: Email alerts */}
            <div className="space-y-2 p-3 bg-[#FAF9F5]/80 dark:bg-[#1A1917]/80 rounded-2xl border border-[#DFDACB]/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#8C897F]">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Inbox Scanner</span>
                </div>
                {isGoogleConnected ? (
                  <>
                    <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {academicAlertsCount} academic notices
                    </p>
                    <p className="text-[11px] text-[#8C897F]">
                      All analyzed by local AI
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Google disconnected
                    </p>
                    <button
                      onClick={onConnectGoogle}
                      className="w-full mt-1.5 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] hover:text-[#C86646] rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      Re-sync Gmail/Drive
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigateWorkspace('canvas')}
            className={`px-8 py-3.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#D97757]/15 hover:shadow-[#D97757]/30 hover:scale-[1.02] flex items-center gap-2 cursor-pointer group`}
          >
            <span>Enter LMS Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {onOpenStudyPlan && (
            <button
              onClick={onOpenStudyPlan}
              className="px-6 py-3.5 bg-white dark:bg-[#1F1E1B] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#D97757]" />
              <span>AI Daily Study Plan</span>
            </button>
          )}
        </div>

        {/* Serif Quote Block */}
        <div className="space-y-3.5 pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 relative group">
          <div className="flex items-center justify-center gap-2">
            <Quote className="w-4 h-4 text-[#D97757]/30 mx-auto" />
            <button
              onClick={handleShuffleQuote}
              className="p-1 text-[#8C897F] hover:text-[#D97757] rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer absolute right-2"
              title="Get another quote"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
          <blockquote className="text-base sm:text-lg font-serif italic text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed max-w-xl mx-auto">
            &ldquo;{quote.quote}&rdquo;
          </blockquote>
          <cite className="text-xs font-bold text-[#8C897F] not-italic block">
            — {quote.author} <span className="text-[10px] font-mono text-[#8C897F]/75">({quote.field})</span>
          </cite>
        </div>

      </div>

      {/* Bottom Section: Command Center Label */}
      <div className="text-[10px] text-[#8C897F] font-mono select-none uppercase tracking-wider shrink-0">
        Student Command Center • Version 2.0
      </div>

    </div>
  );
};
