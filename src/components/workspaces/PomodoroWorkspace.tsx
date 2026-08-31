import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Flame,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type SoundType = 'rain' | 'brown' | 'pink' | 'white' | 'binaural' | 'none';

export const PomodoroWorkspace: React.FC = () => {
  // Timer States
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scc_pomo_completed_v1');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Ambient Sound Engine (Web Audio API)
  const [activeSound, setActiveSound] = useState<SoundType>('none');
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<any[]>([]);

  // Scratchpad State
  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    try {
      return localStorage.getItem('scc_pomo_scratchpad_v1') || '';
    } catch {
      return '';
    }
  });

  // Switch timer presets
  const setPreset = (type: 'work' | 'short' | 'long', mins: number) => {
    setMode(type);
    setDurationMinutes(mins);
    setTimeLeftSeconds(mins * 60);
    setIsRunning(false);
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'work') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        try {
          localStorage.setItem('scc_pomo_completed_v1', nextCount.toString());
        } catch {}
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeftSeconds, mode, completedSessions]);

  // Clean Web Audio sound synthesizer
  const stopAudio = () => {
    sourceNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {}
    });
    sourceNodesRef.current = [];
  };

  const startSynthesizer = (type: SoundType) => {
    stopAudio();
    if (type === 'none') {
      setActiveSound('none');
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = soundVolume;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      if (type === 'brown') {
        // True Brownian / Red noise with warm bass resonance
        const bufferSize = 3 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = lastOut * 3.2;
        }

        const brownSource = ctx.createBufferSource();
        brownSource.buffer = noiseBuffer;
        brownSource.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 320;
        lowpass.Q.value = 1.0;

        brownSource.connect(lowpass);
        lowpass.connect(gainNode);
        brownSource.start();
        sourceNodesRef.current.push(brownSource);
      } else if (type === 'rain') {
        // Multi-layered realistic rain: ambient wash + randomized raindrop patter
        const bufferSize = 4 * ctx.sampleRate;
        const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = rainBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise generator core
          b0 = 0.99765 * b0 + white * 0.0990460;
          b1 = 0.96300 * b1 + white * 0.2965164;
          b2 = 0.57000 * b2 + white * 1.0526913;
          let sample = (b0 + b1 + b2 + white * 0.1848) * 0.18;

          // Randomized raindrop texture
          if (Math.random() < 0.012) {
            sample += (Math.random() * 2 - 1) * 0.5;
          }
          output[i] = sample;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = rainBuffer;
        rainSource.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1400;
        bandpass.Q.value = 0.6;

        rainSource.connect(bandpass);
        bandpass.connect(gainNode);
        rainSource.start();
        sourceNodesRef.current.push(rainSource);
      } else if (type === 'pink') {
        // True Paul Kellet 3dB/octave pink noise
        const bufferSize = 3 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const pinkSource = ctx.createBufferSource();
        pinkSource.buffer = noiseBuffer;
        pinkSource.loop = true;
        pinkSource.connect(gainNode);
        pinkSource.start();
        sourceNodesRef.current.push(pinkSource);
      } else if (type === 'white') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.12;
        }
        const whiteSource = ctx.createBufferSource();
        whiteSource.buffer = noiseBuffer;
        whiteSource.loop = true;
        whiteSource.connect(gainNode);
        whiteSource.start();
        sourceNodesRef.current.push(whiteSource);
      } else if (type === 'binaural') {
        // 40Hz Gamma Focus frequency (200Hz Left, 240Hz Right)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = 200;
        oscL.connect(merger, 0, 0);

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.value = 240;
        oscR.connect(merger, 0, 1);

        merger.connect(gainNode);
        oscL.start();
        oscR.start();
        sourceNodesRef.current.push(oscL, oscR);
      }

      setActiveSound(type);
    } catch (err) {
      console.error('Audio synthesizer error:', err);
    }
  };

  const handleToggleTimer = () => {
    if (!isRunning) {
      // 1. Auto-fullscreen if permitted
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } catch (e) {}

      // 2. Auto-turn on Brown Noise by default if silent
      if (activeSound === 'none') {
        startSynthesizer('brown');
      }

      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  // Update volume live
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = soundVolume;
    }
  }, [soundVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((durationMinutes * 60 - timeLeftSeconds) / (durationMinutes * 60)) * 100;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150 max-w-5xl mx-auto">
      
      {/* 1. Top Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 font-bold">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Pomodoro Focus Station &amp; Soundscapes
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                Web Audio Synthesizer
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Deep work intervals with pure synthesized ambient soundscapes
            </p>
          </div>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2 text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{completedSessions} Intervals Completed Today</span>
          </div>
        </div>
      </div>

      {/* 2. Main Dual Panel: Clock + Soundscapes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Pomodoro Clock (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs flex flex-col items-center justify-center space-y-6 text-center">
          
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1.5 rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
            <button
              onClick={() => setPreset('work', 25)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'work' && durationMinutes === 25
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => setPreset('work', 50)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'work' && durationMinutes === 50
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
              }`}
            >
              Deep Work (50m)
            </button>
            <button
              onClick={() => setPreset('short', 5)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'short'
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => setPreset('long', 15)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'long'
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Huge Timer Digits */}
          <div className="space-y-2 py-4">
            <div className="text-7xl sm:text-8xl font-mono font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tighter">
              {formatTime(timeLeftSeconds)}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5] dark:bg-[#252422] text-[#8C897F] border border-[#DFDACB] dark:border-[#2C2B27]">
              {mode === 'work' ? 'Deep Work Interval' : 'Rest & Recharge'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md h-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-full overflow-hidden border border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <div
              className="h-full bg-[#D97757] transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                isRunning
                  ? 'bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413]'
                  : 'bg-[#D97757] hover:bg-[#C86646] text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause Session' : 'Start Focus Session'}</span>
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeftSeconds(durationMinutes * 60);
              }}
              className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#8C897F] hover:text-[#141413] transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Ambient Sound Synthesizer & Scratchpad (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Ambient Soundscape Synthesizer */}
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#D97757]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                  Synthesized Soundscapes
                </span>
              </div>
              {activeSound !== 'none' && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Synthesizing
                </span>
              )}
            </div>

            {/* Sound Selector Grid */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'rain', label: 'Rain on Window' },
                  { id: 'brown', label: 'Brown Noise (Deep)' },
                  { id: 'pink', label: 'Pink Noise (Reading)' },
                  { id: 'white', label: 'White Noise (Masking)' },
                  { id: 'binaural', label: '40Hz Gamma Beat' },
                  { id: 'none', label: 'Mute Audio' },
                ] as const
              ).map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => startSynthesizer(snd.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    activeSound === snd.id
                      ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]/60'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {activeSound !== 'none' && (
              <div className="pt-2 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-[#8C897F] shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#D97757] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-[#8C897F] w-10 text-right">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Focus Scratchpad */}
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <FileText className="w-4 h-4 text-[#D97757]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                Focus Thought Dump
              </span>
            </div>

            <textarea
              value={scratchpadText}
              onChange={(e) => {
                setScratchpadText(e.target.value);
                try {
                  localStorage.setItem('scc_pomo_scratchpad_v1', e.target.value);
                } catch {}
              }}
              placeholder="Dump distracting thoughts here to stay focused on your active interval..."
              rows={4}
              className="w-full p-3 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
