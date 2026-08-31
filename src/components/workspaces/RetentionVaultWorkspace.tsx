import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Flame,
  CloudRain,
  Wind,
  Layers,
  Brain,
  Mic,
  MicOff,
  Send,
  Award,
  AlertCircle,
  GraduationCap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FlashcardStudioTab } from '../FlashcardStudioTab';
import { NotebookLMStudioTab } from '../NotebookLMStudioTab';
import { vivaSimulatorTurn } from '../../services/gemini';
import { VivaTurn } from '../../types';

type VaultTab = 'focus' | 'viva' | 'flashcards' | 'notebooklm';
type AmbientSound = 'none' | 'rain' | 'whitenoise';

interface RetentionVaultWorkspaceProps {
  googleToken?: string;
  isGoogleConnected?: boolean;
  onStartFocus?: () => void;
}

export const RetentionVaultWorkspace: React.FC<RetentionVaultWorkspaceProps> = ({
  googleToken,
  isGoogleConnected,
  onStartFocus,
}) => {
  const [activeTab, setActiveTab] = useState<VaultTab>('focus');

  // --- Pomodoro State ---
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // --- AI Oral Exam / Viva Simulator State ---
  const [vivaSubject, setVivaSubject] = useState('Biology - Cell Respiration');
  const [vivaStarted, setVivaStarted] = useState(false);
  const [vivaHistory, setVivaHistory] = useState<VivaTurn[]>([]);
  const [vivaCurrentQuestion, setVivaCurrentQuestion] = useState('');
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [isVivaEvaluating, setIsVivaEvaluating] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speakQuestion = (text: string) => {
    if (isVoiceMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
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

  const toggleTimer = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (nextRunning) {
      if (onStartFocus) onStartFocus();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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

  // Web Audio Synth for White Noise and Rain
  const playAmbientAudio = (type: AmbientSound) => {
    stopAmbientAudio();
    if (type === 'none') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === 'whitenoise') {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      } else if (type === 'rain') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = type === 'rain' ? 0.15 : 0.05;

      whiteNoise.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start(0);

      noiseNodeRef.current = whiteNoise;
      setAmbientSound(type);
    } catch (e) {
      console.error('Audio synthesizer error:', e);
    }
  };

  const stopAmbientAudio = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop();
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

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  // AI Oral Defense Start
  const handleStartViva = async () => {
    setVivaStarted(true);
    setVivaHistory([]);
    setVivaCurrentQuestion(`Welcome to your oral examination on "${vivaSubject}". Let us begin: Can you define the core foundational principles of this topic and explain why they matter?`);
    speakQuestion(`Welcome to your oral examination on "${vivaSubject}". Let us begin: Can you define the core foundational principles of this topic and explain why they matter?`);
  };

  // Voice Recognition Dictation
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecordingVoice(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported in this browser. Please type your answer below.');
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setStudentAnswerText((prev) => prev + ' ' + finalTranscript + interimTranscript);
    };

    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e);
      setIsRecordingVoice(false);
    };

    rec.onend = () => {
      setIsRecordingVoice(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecordingVoice(true);
  };

  // Submit Oral Answer to AI
  const handleSubmitOralAnswer = async () => {
    if (!studentAnswerText.trim() || isVivaEvaluating) return;
    if (isRecordingVoice && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecordingVoice(false);
    }

    setIsVivaEvaluating(true);
    const currentQ = vivaCurrentQuestion;
    const answer = studentAnswerText.trim();
    setStudentAnswerText('');

    try {
      const currentTurn: VivaTurn = {
        questionNumber: vivaHistory.length + 1,
        question: currentQ,
        studentAnswer: answer,
      };

      const evaluation = await vivaSimulatorTurn({
        subject: vivaSubject,
        history: [...vivaHistory, currentTurn],
        studentAnswer: answer,
      });

      const newTurn: VivaTurn = {
        questionNumber: vivaHistory.length + 1,
        question: currentQ,
        studentAnswer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        missingPoints: evaluation.missingPoints,
      };

      setVivaHistory((prev) => [...prev, newTurn]);
      setVivaCurrentQuestion(evaluation.nextQuestion);
      speakQuestion(evaluation.nextQuestion);
    } catch (err) {
      console.error('Error in viva evaluation:', err);
    } finally {
      setIsVivaEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalModeSeconds = pomodoroMode === 'work' ? 25 * 60 : pomodoroMode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalModeSeconds - timeLeft) / totalModeSeconds) * 100;

  return (
    <div className="space-y-6 select-none">
      
      {/* Workspace Header & Tab Selector */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'focus', label: 'Pomodoro Focus', icon: Timer },
            { id: 'viva', label: 'Oral Exam (Viva)', icon: Mic },
            { id: 'flashcards', label: 'Flashcards (SM-2)', icon: Layers },
            { id: 'notebooklm', label: 'NotebookLM Studio', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Focus Station: Minimalist Pomodoro + Web Audio Synthesizer */}
      {activeTab === 'focus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Pomodoro Timer Card */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                  <Timer className="w-4 h-4 text-[#D97757]" />
                  <span>Pomodoro Focus Station</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{completedSessions} Streak</span>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
                    title="Toggle Fullscreen Focus"
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mode Selectors */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {[
                  { id: 'work', label: '25m Focus' },
                  { id: 'shortBreak', label: '5m Short Break' },
                  { id: 'longBreak', label: '15m Long Break' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => switchMode(m.id as any)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pomodoroMode === m.id
                        ? 'bg-[#D97757] text-white shadow-xs'
                        : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757] border border-[#DFDACB] dark:border-[#2C2B27]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Giant Digits Display */}
              <div className="my-8 text-center">
                <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-[#141413] dark:text-[#FAF9F5]">
                  {formatTime(timeLeft)}
                </div>

                <div className="w-full max-w-xs mx-auto bg-[#EFECE2] dark:bg-[#252422] rounded-full h-2 mt-6 overflow-hidden">
                  <div
                    className="bg-[#D97757] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
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
                  className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ambient Soundscapes */}
            <div className="pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <span className="text-[11px] font-bold text-[#8C897F] uppercase tracking-wider block mb-2.5">
                Soundscapes
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
                  <span>{ambientSound === 'rain' ? 'Rain (Playing)' : 'Rain'}</span>
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
                  <span>Mute</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Scratchpad */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] mb-4">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                  <Radio className="w-4 h-4 text-[#D97757]" />
                  <span>Lecture Scratchpad</span>
                </div>
                <span className="text-[10px] text-[#8C897F] font-mono">Auto-saved</span>
              </div>

              <textarea
                rows={16}
                value={scratchpadText}
                onChange={handleScratchpadChange}
                placeholder="Capture quick lecture notes, formulas, or reminders during your focus session..."
                className="w-full flex-1 p-4 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Oral Exam (Viva) Simulator */}
      {activeTab === 'viva' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              <GraduationCap className="w-4 h-4 text-[#D97757]" />
              <span>AI Oral Exam Simulator (Viva Voce)</span>
            </div>

            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className="p-1.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] flex items-center gap-1.5 cursor-pointer"
            >
              {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
              <span>{isVoiceMuted ? 'Voice Muted' : 'Audio On'}</span>
            </button>
          </div>

          {!vivaStarted ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D97757]/15 text-[#D97757] mx-auto flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                Practice High-Stakes Oral Defense
              </h3>
              <p className="text-xs text-[#8C897F]">
                Enter your subject topic below. The AI examiner will ask progressive questions, listen to your spoken answers, and grade your conceptual precision.
              </p>

              <input
                type="text"
                value={vivaSubject}
                onChange={(e) => setVivaSubject(e.target.value)}
                placeholder="e.g. AP Biology - Photosynthesis & Calvin Cycle"
                className="w-full px-4 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />

              <button
                onClick={handleStartViva}
                className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Begin Oral Defense
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Box */}
              <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Examiner Question</span>
                </div>
                <p className="text-sm font-semibold text-[#141413] dark:text-[#FAF9F5]">
                  {vivaCurrentQuestion}
                </p>
              </div>

              {/* History Turns */}
              {vivaHistory.length > 0 && (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {vivaHistory.map((turn, i) => (
                    <div key={i} className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2 text-xs">
                      <div className="font-bold text-[#141413] dark:text-[#FAF9F5]">Q: {turn.question}</div>
                      <div className="text-[#8C897F]">A: "{turn.studentAnswer}"</div>
                      <div className="flex items-center gap-2 pt-1 font-bold text-emerald-600">
                        <Award className="w-3.5 h-3.5" />
                        <span>Score: {turn.score}/100</span>
                      </div>
                      <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">{turn.feedback}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Spoken Answer Input */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={studentAnswerText}
                    onChange={(e) => setStudentAnswerText(e.target.value)}
                    placeholder="Speak into microphone or type your defense answer..."
                    className="w-full p-4 pr-12 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                  <button
                    onClick={toggleVoiceRecording}
                    className={`absolute right-3 top-3 p-2 rounded-xl border transition-colors cursor-pointer ${
                      isRecordingVoice
                        ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                        : 'bg-white dark:bg-[#252422] text-[#8C897F] hover:text-[#D97757] border-[#DFDACB] dark:border-[#2C2B27]'
                    }`}
                    title={isRecordingVoice ? 'Stop Recording' : 'Dictate with Microphone'}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitOralAnswer}
                    disabled={isVivaEvaluating || !studentAnswerText.trim()}
                    className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isVivaEvaluating ? (
                      <span>Evaluating defense...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Flashcards */}
      {activeTab === 'flashcards' && <FlashcardStudioTab />}

      {/* 4. NotebookLM */}
      {activeTab === 'notebooklm' && (
        <NotebookLMStudioTab googleToken={googleToken} isGoogleConnected={isGoogleConnected} />
      )}
    </div>
  );
};
