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
import { fetchNasaApod, NasaApod } from '../services/publicApis';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { EmptyTodayEvents, EmptyAssignments } from './EmptyState';

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
  isLoadingEvents?: boolean;
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
  isLoadingEvents = false,
}) => {
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

  // Personalized Focus Sprint Goal — now via Zustand (prevents BroadcastChannel race), clamped floor 1
  const { sprintGoal, setSprintGoal, completedFocusSessions, completedSessions } = usePomodoroStore();
  const handleAdjustSprintGoal = (amount: number) => {
    setSprintGoal(Math.max(1, sprintGoal + amount));
  };

  // Streak heatmap — memoized once per render (not 28 JSON.parse per cell)
  const streakMap = useMemo(() => {
    try {
      const raw = localStorage.getItem('scc_focus_sessions_log');
      const log: {date:string, minutes:number}[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, number>();
      log.forEach(e => map.set(e.date, (map.get(e.date)||0)+e.minutes));
      if (map.size===0 && completedFocusSessions>0) {
        const today = new Date().toISOString().slice(0,10);
        map.set(today, completedFocusSessions*25);
      }
      return map;
    } catch { return new Map<string, number>(); }
  }, [completedFocusSessions]);

  // Today's quote — exclude current index on shuffle
  const [quote, setQuote] = useState<DailyQuote>(() => getTodayQuote());

  const handleShuffleQuote = () => {
    const currentIdx = QUOTE_BANK.findIndex(q => q.quote === quote.quote);
    let randomIndex = Math.floor(Math.random() * QUOTE_BANK.length);
    if (QUOTE_BANK.length > 1 && randomIndex === currentIdx) {
      randomIndex = (randomIndex + 1 + Math.floor(Math.random() * (QUOTE_BANK.length - 1))) % QUOTE_BANK.length;
      if (randomIndex === currentIdx) randomIndex = (randomIndex + 1) % QUOTE_BANK.length;
    }
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

  // todayFormattedDate kept for potential use but not shown above fold (moved to navbar)
  const todayFormattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // Vibe background glow — bumped to /25 in dark for visibility
  const vibeGlowClass = {
    focus: 'from-[#D97757]/15 dark:from-[#D97757]/25',
    calm: 'from-blue-500/15 dark:from-blue-900/25',
    creative: 'from-violet-500/15 dark:from-violet-900/25',
    recharge: 'from-emerald-500/15 dark:from-emerald-900/25',
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
  const apodRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    const isApodEnabled = localStorage.getItem('scc_enable_nasa_apod') === 'true';
    if (!isApodEnabled) return;
    const cacheKey='scc_nasa_apod_cache';
    const cached = (()=>{ try{ const raw=localStorage.getItem(cacheKey); if(raw){ const d=JSON.parse(raw); if(d.date===new Date().toISOString().slice(0,10)) return d.data; } }catch{} return null; })();
    if (cached && cached.mediaType==='image') { setNasaApod(cached); return; }
    const observer = new IntersectionObserver((entries)=>{
      if(entries[0].isIntersecting){
        fetchNasaApod().then((data) => {
          if (data && data.mediaType === 'image') {
            setNasaApod(data);
            try{ localStorage.setItem(cacheKey, JSON.stringify({date:new Date().toISOString().slice(0,10), data})); }catch{}
          }
        });
        observer.disconnect();
      }
    }, {rootMargin:'200px'});
    if (apodRef.current) observer.observe(apodRef.current);
    else {
      // fallback immediate fetch if ref not yet
      fetchNasaApod().then((data) => {
        if (data && data.mediaType === 'image') {
          setNasaApod(data);
          try{ localStorage.setItem(cacheKey, JSON.stringify({date:new Date().toISOString().slice(0,10), data})); }catch{}
        }
      });
    }
    return ()=> observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#FAF9F5] dark:bg-[#141413] px-6 py-12 text-center animate-in fade-in duration-300 select-none relative overflow-y-auto">
      
      {/* NASA APOD — lazy IntersectionObserver, cached DEMO_KEY */}
      <div ref={apodRef as any} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      {nasaApod && (
        <img
          src={nasaApod.url}
          alt={nasaApod.title || 'NASA Astronomy Picture of the Day'}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none transition-opacity duration-1000"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Dynamic Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br ${vibeGlowClass} via-transparent to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-700`} />

      {/* Main Centered Personalization Hub — above-fold tightened (clock moved to navbar) */}
      <div className="max-w-3xl w-full space-y-8 my-auto py-6 z-10">
        
        {/* Large Typographic Piece: The Personalized Greeting — explicit edit button only */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
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
                  <Check className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 min-w-0 max-w-full">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight leading-tight truncate min-w-0 max-w-[60vw] sm:max-w-none">
                  {greetingPrefix}, <span className="truncate">{studentName}</span>
                </h1>
                <button
                  onClick={() => {
                    setNameInput(studentName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#6B6860] hover:text-[#D97757] hover:border-[#D97757]/40 transition-colors shrink-0"
                  aria-label="Edit name"
                  title="Edit name"
                >
                  <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
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

        {/* Today's Plan — overdue grouping + due today */}
        {pendingAssignments.length > 0 ? (
          <div className="bg-white/70 dark:bg-[#1C1B19]/60 backdrop-blur-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 text-left space-y-3">
            {(() => {
              const todayStr = new Date().toISOString().slice(0,10);
              const overdue = pendingAssignments.filter(a => a.dueDate && a.dueDate < todayStr);
              const dueToday = pendingAssignments.filter(a => a.dueDate === todayStr);
              const upcoming = pendingAssignments.filter(a => !a.dueDate || a.dueDate > todayStr);
              const sorted = (arr: typeof pendingAssignments) => [...arr].sort((a,b)=>{
                const pri = { High:0, Med:1, Low:2 } as any;
                const pa = pri[a.priority] ?? 1; const pb = pri[b.priority] ?? 1;
                if (pa !== pb) return pa - pb;
                const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return da - db;
              });
              return (
                <>
                  {overdue.length>0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Overdue • {overdue.length}</h4>
                      {sorted(overdue).slice(0,2).map(a=>(
                        <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs">
                          <span className="font-semibold truncate flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />{a.assignmentName}</span>
                          <span className="text-[11px] text-rose-700 ml-2 shrink-0">{a.subject} • {a.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dueToday.length>0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Due Today • {dueToday.length}</h4>
                      {sorted(dueToday).slice(0,2).map(a=>(
                        <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
                          <span className="font-semibold truncate flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{a.assignmentName}</span>
                          <span className="text-[11px] text-amber-800 ml-2 shrink-0">{a.subject} • Today</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B6860] flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#D97757]" />Upcoming</h4>
                    {sorted(upcoming).slice(0,3).map(a=>(
                      <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#DFDACB]/40 text-xs">
                        <span className="font-semibold truncate flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.priority==='High'?'bg-rose-500': a.priority==='Med'?'bg-amber-500':'bg-emerald-500'}`} />{a.assignmentName}</span>
                        <span className="text-[11px] text-[#6B6860] ml-2 shrink-0">{a.subject} • Due {a.dueDate} {a.priority==='High' && <span className="ml-1 px-1 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">HIGH</span>}</span>
                      </div>
                    ))}
                    {upcoming.length===0 && overdue.length===0 && dueToday.length===0 && <div className="text-xs text-[#6B6860] italic">All caught up — no upcoming tasks.</div>}
                  </div>
                </>
              );
            })()}
            <button onClick={()=>onNavigateWorkspace('tracker')} className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]">Open Assignment Tracker <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} /></button>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-[#1C1B19]/60 backdrop-blur-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 text-center">
            <EmptyAssignments />
          </div>
        )}

        {/* Personalize — collapsible drawer; defaults true for first-run (persist scc_dashboard_personalize_open) */}
        <details
          className="bg-white/40 dark:bg-[#1C1B19]/30 backdrop-blur-md rounded-3xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 p-4 sm:p-5 text-xs text-left group"
          open={(() => { try { const v=localStorage.getItem('scc_dashboard_personalize_open'); return v===null ? true : v==='true'; } catch { return true; } })()}
          onToggle={(e)=>{ try{ localStorage.setItem('scc_dashboard_personalize_open', String((e.currentTarget as HTMLDetailsElement).open)); }catch{} }}
        >
          <summary className="list-none flex items-center justify-between cursor-pointer font-bold text-[#6B6860] uppercase tracking-wider">Personalize <span className="flex items-center gap-1.5 text-[10px] bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] px-2 py-0.5 rounded-full">Edit <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" strokeWidth={1.75} /></span></summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Left: Vibe / Ambient Light Selection */}
          <div className="space-y-2">
            <span className="font-bold text-[#6B6860] uppercase tracking-wider block">
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
            <span className="font-bold text-[#6B6860] uppercase tracking-wider block">
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
                  className="p-1 text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors"
                  title="Decrease target"
                >
                  <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => handleAdjustSprintGoal(1)}
                  className="p-1 text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors"
                  title="Increase target"
                >
                  <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
          </div>
        </details>

        {/* Real-time Academic Overview Block — with empty illustrations + container query */}
        <div className="cq-container bg-white/60 dark:bg-[#1C1B19]/50 backdrop-blur-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 sm:p-6 text-left space-y-4 card-micro">
          <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6860] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D97757]" strokeWidth={1.75} />
              <span>Real-Time Academic Overview</span>
            </h3>
            <span className="text-[10px] text-[#6B6860] font-mono">
              Live State Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            {/* Column 1: Deadlines */}
            <div className="space-y-2 p-3 bg-[#FAF9F5]/80 dark:bg-[#1A1917]/80 rounded-2xl border border-[#DFDACB]/40">
              <div className="flex items-center gap-1.5 font-bold text-[#6B6860]">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
                <span>Coursework</span>
              </div>
              {pendingAssignments.length === 0 ? (
                <EmptyAssignments />
              ) : (
                <>
                  <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                    {pendingAssignments.length} deadlines pending
                  </p>
                  {nextUrgentAssignment && (
                    <p className="text-[11px] text-[#6B6860] truncate">
                      Next: {nextUrgentAssignment.assignmentName}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Column 2: Scheduled Events */}
            <div className="space-y-2 p-3 bg-[#FAF9F5]/80 dark:bg-[#1A1917]/80 rounded-2xl border border-[#DFDACB]/40 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#6B6860]">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
                  <span>Today&apos;s Schedule</span>
                </div>
                {isLoadingEvents ? (
                  <div className="space-y-2 animate-pulse"><div className="h-3 bg-[#EFECE2] dark:bg-[#252422] rounded w-3/4" /><div className="h-3 bg-[#EFECE2] dark:bg-[#252422] rounded w-1/2" /></div>
                ) : isGoogleConnected ? (
                  todayEvents.length === 0 ? <EmptyTodayEvents /> : (
                    <>
                      <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        {todayEvents.length} events scheduled
                      </p>
                      <p className="text-[11px] text-[#6B6860] truncate">
                        Next: {todayEvents[0].summary}
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Google disconnected
                    </p>
                    <button
                      onClick={onConnectGoogle}
                      className="w-full mt-1.5 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] hover:text-[#C86646] rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center min-h-[44px]"
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
                <div className="flex items-center gap-1.5 font-bold text-[#6B6860]">
                  <Mail className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                  <span>Inbox Scanner</span>
                </div>
                {isGoogleConnected ? (
                  academicAlertsCount === 0 ? (
                    <p className="text-[11px] text-[#6B6860] italic">No academic notices — inbox clear</p>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        {academicAlertsCount} academic notices
                      </p>
                      <p className="text-[11px] text-[#6B6860]">
                        All analyzed by local AI
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Google disconnected
                    </p>
                    <button
                      onClick={onConnectGoogle}
                      className="w-full mt-1.5 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] hover:text-[#C86646] rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center min-h-[44px]"
                    >
                      Re-sync Gmail/Drive
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Habit Streak — memoized via streakMap (single JSON.parse) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-card text-left">
            <h4 className="text-xs font-bold text-[#6B6860] uppercase tracking-wider flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-[#D97757]" strokeWidth={1.75} /> Habit Streak • Last 28 days</h4>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {Array.from({length:28}).map((_,i)=>{
                const d=new Date(); d.setDate(d.getDate()-(27-i));
                const dateStr=d.toISOString().slice(0,10);
                let mins = streakMap.get(dateStr) || 0;
                if(mins===0 && dateStr===new Date().toISOString().slice(0,10) && completedFocusSessions>0 && streakMap.size<=1) mins=completedFocusSessions*25;
                let intensity='bg-[#EFECE2] dark:bg-[#252422]';
                if(mins>=60) intensity='bg-emerald-600';
                else if(mins>=45) intensity='bg-emerald-500';
                else if(mins>=25) intensity='bg-emerald-300';
                else if(mins>0) intensity='bg-emerald-200 dark:bg-emerald-900/50';
                return <div key={i} className={`w-full aspect-square rounded-sm ${intensity}`} title={`${dateStr}: ${mins}m`} />
              })}
            </div>
            <p className="text-[11px] text-[#6B6860] mt-2">{completedFocusSessions} focus sprints • {sprintGoal} daily target</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-card text-left">
            <h4 className="text-xs font-bold text-[#6B6860] uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" strokeWidth={1.75} /> Focus Analytics</h4>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs"><span>Deep work today</span><span className="font-mono font-bold">{completedFocusSessions * 25}m / {sprintGoal * 25}m</span></div>
              <div className="h-2 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden"><div className="h-full bg-[#D97757]" style={{width: `${Math.min(100, (completedFocusSessions/sprintGoal)*100)}%`}} /></div>
              <p className="text-[11px] text-[#6B6860]">Completion funnel: {assignments.filter(a=>a.status==='Done').length}/{assignments.length} tasks done</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row — primary terracotta CTA only, secondary tertiary ghost */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigateWorkspace('canvas')}
            className={`px-8 py-3.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#D97757]/15 hover:shadow-[#D97757]/30 hover:scale-[1.02] flex items-center gap-2 cursor-pointer group min-h-[44px]`}
          >
            <span>Enter LMS Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          </button>

          {onOpenStudyPlan && (
            <button
              onClick={onOpenStudyPlan}
              className="px-2 py-2 text-xs font-semibold text-[#D97757] hover:text-[#C86646] hover:underline underline-offset-4 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>AI Daily Study Plan — text link</span>
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
        Student Command Center • Version 2.3.1
      </div>

    </div>
  );
};
