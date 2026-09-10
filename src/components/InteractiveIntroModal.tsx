import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Calendar,
  Search,
  RefreshCw,
  Sparkles,
  Timer,
  Zap,
  MapPin,
} from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  tag: string;
  points: string[];
  icon: any;
  accentBg: string;
  where: string;
  actionLabel: string;
  action: 'sidebar' | 'search' | 'sync' | 'tracker' | 'coach' | 'focus';
  tip?: string;
}

function isMac(): boolean {
  try {
    const uaData = (navigator as any).userAgentData;
    const platform = uaData?.platform || (navigator as any).platform || navigator.userAgent || '';
    return /Mac|iPhone|iPad|iPod/.test(platform);
  } catch { return true; }
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Your 5 home bases live in the sidebar',
    subtitle: 'Canvas, Schedule, Tracker, Gmail and Drive — always one click away.',
    tag: 'Stop 1 of 6 · Sidebar',
    icon: Layers,
    accentBg: 'bg-[#D97757]/15 text-[#D97757]',
    where: 'Look left — the sidebar lists your pinned tools with urgency badges.',
    actionLabel: 'Highlight sidebar',
    action: 'sidebar',
    points: [
      'Badges tell you what is urgent — no need to open every app.',
      'Add more tools anytime from the App Store (+ button).',
    ],
  },
  {
    title: 'One search for everything',
    subtitle: 'Assignments, files, emails and tools — with a preview and quick actions.',
    tag: 'Stop 2 of 6 · Search',
    icon: Search,
    accentBg: 'bg-[#D97757]/15 text-[#D97757]',
    where: 'Top bar, center — the “Search or jump…” box.',
    actionLabel: 'Open search',
    action: 'search',
    points: [
      'Find a Canvas task, Drive file or Gmail thread in seconds.',
      'Math in search copies the answer straight to your clipboard.',
    ],
    tip: 'SHORTCUT_TIP',
  },
  {
    title: 'Connect Google once, stay in sync',
    subtitle: 'Calendar, Gmail and Drive power your deadlines and files.',
    tag: 'Stop 3 of 6 · Google Sync',
    icon: RefreshCw,
    accentBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    where: 'Top bar, right — the “Connect Google” button.',
    actionLabel: 'Open Sync Hub',
    action: 'sync',
    points: [
      'Read-only access — StudentOS never sends mail for you.',
      'Revoke anytime in Settings. Cached work stays on your device.',
    ],
  },
  {
    title: 'All deadlines, one list',
    subtitle: 'Paste your Canvas calendar link once — new work lands here.',
    tag: 'Stop 4 of 6 · Assignment Tracker',
    icon: Calendar,
    accentBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    where: 'Sidebar → Assignment Tracker.',
    actionLabel: 'Show Tracker',
    action: 'tracker',
    points: [
      'In Tracker: paste the link, press Test feed, then Save.',
      'Overdue and due-today badges keep today honest.',
    ],
  },
  {
    title: 'Stuck? Ask the AI Coach',
    subtitle: 'Study plans, essay feedback and email drafts — grounded in your work.',
    tag: 'Stop 5 of 6 · AI Coach',
    icon: Sparkles,
    accentBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    where: 'Top bar, right — the orange “AI Coach” button.',
    actionLabel: 'Open AI Coach',
    action: 'coach',
    points: [
      'Ask with an assignment open for cited, specific help.',
      'It shows sources — Canvas, mail or Drive — under every answer.',
    ],
  },
  {
    title: 'Focus without distractions',
    subtitle: 'Start a 25-minute Pomodoro. Fullscreen is optional.',
    tag: 'Stop 6 of 6 · Focus',
    icon: Timer,
    accentBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    where: 'Sidebar → Pomodoro Focus.',
    actionLabel: 'Show Focus',
    action: 'focus',
    points: [
      'Press Play to start. Press Esc to exit — your streak is saved.',
      'Rain and brown-noise soundscapes are built in, free.',
    ],
  },
];

function flashTarget(selector: string) {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('scc-tour-flash');
    setTimeout(() => el.classList.remove('scc-tour-flash'), 1600);
    return true;
  } catch { return false; }
}

interface InteractiveIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onOpenSearch?: () => void;
  onOpenAiCoach?: () => void;
  onOpenGoogleSync?: () => void;
}

export const InteractiveIntroModal: React.FC<InteractiveIntroModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSearch,
  onOpenAiCoach,
  onOpenGoogleSync,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [shortcutTip, setShortcutTip] = useState('Press ⌘K to search');

  useEffect(() => {
    setShortcutTip(isMac() ? 'Press ⌘K to search from anywhere' : 'Press Ctrl+K to search from anywhere');
  }, []);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const markSeen = (finished: boolean) => {
    try {
      if (finished) localStorage.setItem('scc_tour_seen_v2', 'true');
    } catch {}
  };

  const handleFinish = () => {
    markSeen(true);
    onClose();
  };

  const handleDismiss = () => {
    // X = snooze, not done: leave the key unset so it can reappear next visit,
    // but close now. "Get started" / Back-to-app marks it seen.
    onClose();
  };

  const handleNext = () => {
    if (isLast) handleFinish();
    else setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleShowMe = () => {
    switch (step.action) {
      case 'sidebar':
        flashTarget('aside[aria-label="Primary navigation"]');
        break;
      case 'search':
        if (onOpenSearch) onOpenSearch();
        else flashTarget('[data-tour="search"]');
        break;
      case 'sync':
        if (onOpenGoogleSync) onOpenGoogleSync();
        else flashTarget('#btn-nav-google-sync');
        break;
      case 'tracker':
        if (onNavigate) onNavigate('tracker');
        break;
      case 'coach':
        if (onOpenAiCoach) onOpenAiCoach();
        else flashTarget('#btn-nav-ai-coach');
        break;
      case 'focus':
        if (onNavigate) onNavigate('pomodoro');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1A1917] w-full max-w-lg rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-white dark:bg-[#1A1917] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97757]/15 text-[#D97757]">
              StudentOS Tour
            </span>
            <span className="text-xs text-[#8C897F] font-semibold">
              {step.tag}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors cursor-pointer"
            title="Close for now (tour returns next visit)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${step.accentBg} flex items-center justify-center shrink-0 shadow-xs`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#141413] dark:text-[#FAF9F5] leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs text-[#8C897F] mt-1 font-medium">
                  {step.subtitle}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {step.points.map((pt, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-white dark:bg-[#252422] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-3 text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#EFECE2]/50 dark:bg-[#141413]/60 rounded-xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center gap-2 text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">
              <MapPin className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
              <span>{step.where}</span>
            </div>

            {step.tip === 'SHORTCUT_TIP' && (
              <div className="p-3 bg-[#EFECE2]/50 dark:bg-[#141413]/60 rounded-xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center gap-2 text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">
                <Zap className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
                <span>{shortcutTip}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
            <button
              onClick={handleShowMe}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#252422] border border-[#D97757]/40 hover:border-[#D97757] text-[#D97757] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{step.actionLabel} — take me there</span>
            </button>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentStep === idx
                        ? 'w-6 bg-[#D97757]'
                        : 'w-2 bg-[#DFDACB] dark:bg-[#2C2B27] hover:bg-[#8C897F]'
                    }`}
                    aria-label={`Jump to stop ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3.5 py-2 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isLast ? 'Start studying' : 'Next stop'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
