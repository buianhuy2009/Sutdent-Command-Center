import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Calendar,
  Sparkles,
  Timer,
  Zap,
  BookOpen,
  AppWindow,
  Compass,
} from 'lucide-react';

interface IntroStep {
  title: string;
  subtitle: string;
  tag: string;
  points: string[];
  icon: any;
  accentBg: string;
  accentText: string;
  shortcutTip?: string;
}

const INTRO_STEPS: IntroStep[] = [
  {
    title: 'All Your Deadlines in One Place',
    subtitle: 'Stop switching between 10 different tabs.',
    tag: 'Step 1: Unified Queue',
    icon: Layers,
    accentBg: 'bg-[#D97757]/15 text-[#D97757]',
    accentText: 'text-[#D97757]',
    points: [
      'Syncs Canvas LMS, Google Classroom, and Google Sheets.',
      'Auto-flags urgent submissions and overdue homework.',
    ],
    shortcutTip: 'Press 1 to jump to Canvas or 3 for Assignment Tracker',
  },
  {
    title: 'Your Entire Day in Chronological Order',
    subtitle: 'Know exactly what is next with zero mental clutter.',
    tag: 'Step 2: Daily Agenda',
    icon: Calendar,
    accentBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    points: [
      'Merges your Google Calendar classes and study sessions.',
      'Displays today\'s real submission deadlines alongside classes.',
    ],
    shortcutTip: 'Press 2 to open your Daily Schedule',
  },
  {
    title: '20+ Academic Tools & Fast Split-Screen',
    subtitle: 'Everything you need to write, calculate, and study.',
    tag: 'Step 3: Built-in App Store',
    icon: AppWindow,
    accentBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    points: [
      'Desmos, GeoGebra, Excalidraw, arXiv research, and Periodic Table.',
      'Dual Split Screen lets you take notes while graphing or reading PDFs.',
    ],
    shortcutTip: 'Press Cmd+K to search and launch any tool instantly',
  },
  {
    title: 'One-Click Deep Work Focus Station',
    subtitle: 'Block out distractions and get into the flow state.',
    tag: 'Step 4: Focus & Flow',
    icon: Timer,
    accentBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    points: [
      'Press Play to automatically enter fullscreen focus mode.',
      'Authentic Brownian noise and realistic rain soundscapes included.',
    ],
    shortcutTip: 'Toggle Zen Mode anytime with the Top Bar switch',
  },
];

interface InteractiveIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveIntroModal: React.FC<InteractiveIntroModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = INTRO_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === INTRO_STEPS.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem('scc_tour_seen_v2', 'true');
    } catch {}
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1A1917] w-full max-w-lg rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-white dark:bg-[#1A1917] shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97757]/15 text-[#D97757]">
              StudentOS Guide
            </span>
            <span className="text-xs text-[#8C897F] font-semibold">
              Step {currentStep + 1} of {INTRO_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Step Icon & Title */}
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

            {/* Bite-sized bullets (no heavy paragraphs) */}
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

            {/* Shortcut Tip */}
            {step.shortcutTip && (
              <div className="p-3 bg-[#EFECE2]/50 dark:bg-[#141413]/60 rounded-xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center gap-2 text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">
                <Zap className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
                <span>{step.shortcutTip}</span>
              </div>
            )}
          </div>

          {/* Progress Indicators & Navigation Controls */}
          <div className="pt-4 border-t border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3">
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {INTRO_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-[#D97757]'
                      : 'w-2 bg-[#DFDACB] dark:bg-[#2C2B27] hover:bg-[#8C897F]'
                  }`}
                  aria-label={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next / Back Buttons */}
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
                <span>{isLast ? 'Get Started' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
