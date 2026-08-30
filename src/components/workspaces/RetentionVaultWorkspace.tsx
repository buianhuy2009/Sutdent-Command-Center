import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Coffee,
  CloudRain,
  Radio,
  Wind,
} from 'lucide-react';
import { FlashcardStudioTab } from '../FlashcardStudioTab';
import { NotebookLMStudioTab } from '../NotebookLMStudioTab';

type VaultTab = 'focus' | 'flashcards' | 'notebooklm';
type AmbientSound = 'none' | 'rain' | 'whitenoise';

interface RetentionVaultWorkspaceProps {
  googleToken?: string;
  isGoogleConnected?: boolean;
}

export const RetentionVaultWorkspace: React.FC<RetentionVaultWorkspaceProps> = ({
  googleToken,
  isGoogleConnected,
}) => {
  const [activeTab, setActiveTab] = useState<VaultTab>('focus');

  // --- Pomodoro State ---
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scc_pomodoro_streak_today');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // --- Scratchpad State ---
  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    try {
      return localStorage.getItem('scc_lecture_scratchpad') || '';
    } catch {
      return '';
    }
  });

  // --- Ambient Sound Synthesizer (Web Audio API) ---
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed interval!
      setIsRunning(false);
      if (pomodoroMode === 'work') {
        const updated = completedSessions + 1;
        setCompletedSessions(updated);
        try {
          localStorage.setItem('scc_pomodoro_streak_today', updated.toString());
        } catch {}
        setPomodoroMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setPomodoroMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, pomodoroMode, completedSessions]);

  // Scratchpad Persistence
  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpadText(val);
    try {
      localStorage.setItem('scc_lecture_scratchpad', val);
    } catch {}
  };

  const switchMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setPomodoroMode(mode);
    if (mode === 'work') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (pomodoroMode === 'work') setTimeLeft(25 * 60);
    else if (pomodoroMode === 'shortBreak') setTimeLeft(5 * 60);
    else if (pomodoroMode === 'longBreak') setTimeLeft(15 * 60);
  };

  // Web Audio Ambient Synthesizer
  const stopAmbientAudio = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.disconnect();
      } catch {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    setAmbientSound('none');
  };

  const playAmbientAudio = (type: AmbientSound) => {
    if (ambientSound === type) {
      stopAmbientAudio();
      return;
    }
    stopAmbientAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate Pink Noise for Rain / White Noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Softer brownian filter
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else {
          // White noise
          data[i] = white * 0.15;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(type === 'rain' ? 0.25 : 0.08, ctx.currentTime);

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      noiseNodeRef.current = noise;
      setAmbientSound(type);
    } catch (e) {
      console.warn('Web Audio Ambient Synthesizer could not start:', e);
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent =
    pomodoroMode === 'work'
      ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
      : pomodoroMode === 'shortBreak'
      ? ((5 * 60 - timeLeft) / (5 * 60)) * 100
      : ((15 * 60 - timeLeft) / (15 * 60)) * 100;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Active Study &amp; Retention Vault
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Pomodoro focus station, spaced repetition flashcards, and NotebookLM studio
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'focus', label: 'Focus Station (Pomodoro)', icon: Timer },
            { id: 'flashcards', label: 'Flashcard Vault (SRS)', icon: Brain },
            { id: 'notebooklm', label: 'NotebookLM Studio', icon: BookOpen },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VaultTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Focus Station: Pomodoro + Ambient Soundscapes + Scratchpad */}
      {activeTab === 'focus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Pomodoro Timer & Ambient Sounds (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#D97757]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                    Pomodoro Focus Cycle
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>{completedSessions} Sessions Completed Today</span>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {[
                  { id: 'work', label: '25m Focus' },
                  { id: 'shortBreak', label: '5m Short Break' },
                  { id: 'longBreak', label: '15m Long Break' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => switchMode(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      pomodoroMode === m.id
                        ? 'bg-[#D97757] text-white shadow-xs'
                        : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757] border border-[#DFDACB] dark:border-[#2C2B27]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Digital Countdown Display with Progress Bar */}
              <div className="my-8 text-center">
                <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-[#141413] dark:text-[#FAF9F5]">
                  {formatTime(timeLeft)}
                </div>

                <div className="w-full max-w-xs mx-auto bg-[#EFECE2] dark:bg-[#252422] rounded-full h-2 mt-5 overflow-hidden">
                  <div
                    className="bg-[#D97757] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#D97757] hover:bg-[#C86646] text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Focus</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetTimer}
                  className="p-2.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ambient Audio Soundscapes */}
            <div className="mt-8 pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider block mb-2.5">
                Ambient Study Soundscapes (Zero-Distraction Web Audio)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => playAmbientAudio('rain')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    ambientSound === 'rain'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                  <span>{ambientSound === 'rain' ? 'Rain (Playing)' : 'Rain Ambience'}</span>
                </button>

                <button
                  onClick={() => playAmbientAudio('whitenoise')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    ambientSound === 'whitenoise'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 text-purple-700 dark:text-purple-300'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5 text-purple-500" />
                  <span>{ambientSound === 'whitenoise' ? 'White Noise (Playing)' : 'White Noise'}</span>
                </button>

                <button
                  onClick={stopAmbientAudio}
                  disabled={ambientSound === 'none'}
                  className="p-2.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#5C5A54] dark:text-[#B5B2A8] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <VolumeX className="w-3.5 h-3.5 text-[#8C897F]" />
                  <span>Mute Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick Lecture Scratchpad (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#D97757]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                    Quick Lecture Scratchpad
                  </span>
                </div>
                <span className="text-[10px] text-[#8C897F] font-mono">Auto-saved locally</span>
              </div>

              <p className="text-xs text-[#8C897F] mt-2">
                Capture fleeting lecture thoughts, formulas, and questions during your Pomodoro sprint without losing focus.
              </p>

              <div className="mt-4">
                <textarea
                  rows={14}
                  value={scratchpadText}
                  onChange={handleScratchpadChange}
                  placeholder="Capture quick lecture notes, professor quotes, formulas to review later, or quick homework reminders..."
                  className="w-full p-4 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between text-[11px] text-[#8C897F]">
              <span>Tip: Clear scratchpad once your session is done and export key terms to Flashcards.</span>
              <button
                onClick={() => {
                  setScratchpadText('');
                  localStorage.removeItem('scc_lecture_scratchpad');
                }}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Clear Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Flashcard & SRS Vault */}
      {activeTab === 'flashcards' && <FlashcardStudioTab />}

      {/* 3. Google NotebookLM Studio */}
      {activeTab === 'notebooklm' && (
        <NotebookLMStudioTab
          googleToken={googleToken}
          isGoogleConnected={isGoogleConnected}
        />
      )}
    </div>
  );
};
