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
  Mic,
  MicOff,
  Send,
  Award,
  AlertCircle,
  GraduationCap,
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

  // --- AI Oral Exam / Viva Simulator State ---
  const [vivaSubject, setVivaSubject] = useState('Biology - Cell Respiration');
  const [vivaStarted, setVivaStarted] = useState(false);
  const [vivaHistory, setVivaHistory] = useState<VivaTurn[]>([]);
  const [vivaCurrentQuestion, setVivaCurrentQuestion] = useState('');
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [isVivaEvaluating, setIsVivaEvaluating] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

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

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else {
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Web Speech API Voice Dictation
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecordingVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in your browser. You can type your answer instead.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStudentAnswerText((prev) => `${prev} ${transcript}`.trim());
      };

      recognition.onerror = () => {
        setIsRecordingVoice(false);
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecordingVoice(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecordingVoice(false);
    }
  };

  // Start Oral Viva Exam
  const handleStartViva = () => {
    setVivaStarted(true);
    setVivaHistory([]);
    setVivaCurrentQuestion(
      `Welcome to your oral examination on "${vivaSubject}". To begin, please explain the central thesis and primary mechanism of this topic.`
    );
  };

  // Submit Answer to Viva Exam
  const handleSubmitVivaAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswerText.trim() || isVivaEvaluating) return;

    const answer = studentAnswerText.trim();
    setStudentAnswerText('');
    if (isRecordingVoice && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecordingVoice(false);
    }

    setIsVivaEvaluating(true);
    try {
      const currentTurn: VivaTurn = {
        questionNumber: vivaHistory.length + 1,
        question: vivaCurrentQuestion,
        studentAnswer: answer,
      };

      const evalResult = await vivaSimulatorTurn({
        subject: vivaSubject,
        history: [...vivaHistory, currentTurn],
        studentAnswer: answer,
      });

      const evaluatedTurn: VivaTurn = {
        ...currentTurn,
        score: evalResult.score,
        feedback: evalResult.feedback,
        missingPoints: evalResult.missingPoints,
      };

      setVivaHistory((prev) => [...prev, evaluatedTurn]);
      setVivaCurrentQuestion(evalResult.nextQuestion);
    } catch (err) {
      console.error('Failed to evaluate viva turn:', err);
    } finally {
      setIsVivaEvaluating(false);
    }
  };

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
              Pomodoro focus station, AI Oral Exam (Viva) simulator, SRS flashcards &amp; NotebookLM
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'focus', label: 'Focus Station', icon: Timer },
            { id: 'viva', label: 'AI Oral Exam (Viva)', icon: GraduationCap },
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

      {/* 2. AI Oral Exam / Viva Simulator */}
      {activeTab === 'viva' && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-[#D97757]" />
              <div>
                <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                  AI Oral Defense &amp; Viva Exam Simulator
                </h3>
                <p className="text-xs text-[#8C897F]">
                  Practice defending your knowledge verbally or in writing. Gemini scores conceptual accuracy and identifies omitted nuances.
                </p>
              </div>
            </div>

            {vivaStarted && (
              <button
                onClick={() => setVivaStarted(false)}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                End Exam
              </button>
            )}
          </div>

          {!vivaStarted ? (
            <div className="py-8 max-w-lg mx-auto text-center space-y-4">
              <Award className="w-12 h-12 text-[#D97757] mx-auto opacity-80" />
              <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                Prepare for your Oral Examination
              </h4>
              <p className="text-xs text-[#8C897F] leading-relaxed">
                Choose a topic or subject. You can speak your responses using your microphone or type them. Gemini will challenge your depth of knowledge with progressive follow-up questions.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1.5 text-left">
                  Oral Defense Subject / Topic *
                </label>
                <input
                  type="text"
                  value={vivaSubject}
                  onChange={(e) => setVivaSubject(e.target.value)}
                  placeholder="e.g. AP US History - Civil Rights Movement, or Quantum Mechanics..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <button
                onClick={handleStartViva}
                className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Start Viva Simulation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prior Turns */}
              {vivaHistory.map((turn) => (
                <div
                  key={turn.questionNumber}
                  className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#141413] dark:text-[#FAF9F5]">
                      Question {turn.questionNumber}: {turn.question}
                    </span>
                    {turn.score !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          turn.score >= 80
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        Score: {turn.score}/100
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-[#252422] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs text-[#5C5A54] dark:text-[#B5B2A8] italic">
                    &ldquo;{turn.studentAnswer}&rdquo;
                  </div>

                  {turn.feedback && (
                    <p className="text-xs text-[#141413] dark:text-[#FAF9F5]">
                      <strong>Feedback:</strong> {turn.feedback}
                    </p>
                  )}

                  {turn.missingPoints && turn.missingPoints.length > 0 && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Omitted Points:</strong> {turn.missingPoints.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Current Question */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Examiner&apos;s Question:</span>
                </span>
                <p className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  {vivaCurrentQuestion}
                </p>
              </div>

              {/* Answer Input (Speech & Text) */}
              <form onSubmit={handleSubmitVivaAnswer} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={studentAnswerText}
                    onChange={(e) => setStudentAnswerText(e.target.value)}
                    placeholder="Speak your defense response or type it here..."
                    className="w-full p-4 pr-12 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none"
                  />

                  {/* Speech Dictation Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                      isRecordingVoice
                        ? 'bg-rose-500 text-white animate-pulse shadow-md'
                        : 'bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
                    }`}
                    title={isRecordingVoice ? 'Stop voice recording' : 'Dictate with Web Speech API'}
                  >
                    {isRecordingVoice ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#8C897F]">
                    {isRecordingVoice ? '🎙️ Listening... speak clearly into your microphone.' : 'Type or click mic to dictate your answer.'}
                  </span>

                  <button
                    type="submit"
                    disabled={!studentAnswerText.trim() || isVivaEvaluating}
                    className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isVivaEvaluating ? 'animate-spin' : ''}`} />
                    <span>{isVivaEvaluating ? 'Grading Oral Response...' : 'Submit Defense Answer'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. Flashcard & SRS Vault */}
      {activeTab === 'flashcards' && <FlashcardStudioTab />}

      {/* 4. Google NotebookLM Studio */}
      {activeTab === 'notebooklm' && (
        <NotebookLMStudioTab
          googleToken={googleToken}
          isGoogleConnected={isGoogleConnected}
        />
      )}
    </div>
  );
};
