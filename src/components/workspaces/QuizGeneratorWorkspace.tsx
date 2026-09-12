import React, { useEffect, useRef, useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathMarkdown } from '../MathMarkdown';
import { generateInteractiveQuiz, callGemini, QuizQuestion } from '../../services/gemini';
import { t, useLang } from '../../services/i18n';

// --- Count-enforcement helpers (051): guarantee the rendered quiz always
// --- matches the requested question count, even when the AI under-delivers.

function quizTopicLabel(source: string): string {
  const firstLine = source.split('\n').map((s) => s.trim()).filter(Boolean)[0] || source.trim();
  return firstLine.slice(0, 60) || 'this topic';
}

// (a) Count-aware prompt: explicitly demands EXACTLY N questions in a
// parseable numbered format (also valid JSON for the strict parser path).
function buildQuizPrompt(source: string, count: number, difficulty: string): string {
  return `You are an expert university examiner and professor.
Based on the following lecture notes or study topic:
"${source.slice(0, 5000)}"

Generate EXACTLY ${count} high-yield multiple-choice practice quiz questions (difficulty: ${difficulty}) to test deep understanding. You MUST return EXACTLY ${count} questions — no more, no fewer.
Write any math with KaTeX delimiters: inline $...$, display $$...$$ (one block per line, never two on one line).
Use this parseable numbered format AND make it valid JSON:
[
  {
    "id": "q1",
    "question": "1. What is ...?",
    "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
    "correctIndex": 0,
    "explanation": "Option A is correct because...",
    "topic": "Key Sub-topic"
  }
]
Rules: number every question sequentially from 1 to ${count}; give every question exactly 4 options labeled A) B) C) D); include "correctIndex" (0-3) and a 1-sentence "explanation" per question. Output ONLY valid raw JSON.`;
}

function normalizeQuizQuestion(raw: any, index: number, topicLabel: string): QuizQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const questionText = String(raw.question ?? raw.questionText ?? raw.prompt ?? '').replace(/^\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:\-]\s*/i, '').trim();
  if (!questionText) return null;
  let options: string[] = Array.isArray(raw.options)
    ? raw.options.map((o: any) => String(o ?? '').replace(/^\s*[A-D]\s*[).:\-]\s*/, '').trim()).filter(Boolean)
    : Array.isArray(raw.choices)
      ? raw.choices.map((o: any) => String(o ?? '').trim()).filter(Boolean)
      : [];
  const padPool = [
    'None of the above',
    'Cannot be determined from the material',
    'Only under unrelated conditions',
    'An unrelated concept from outside the topic',
  ];
  for (const pad of padPool) {
    if (options.length >= 4) break;
    if (!options.includes(pad)) options.push(pad);
  }
  options = options.slice(0, 4);
  if (options.length < 2) return null;
  let correctIndex = 0;
  const rawAnswer = raw.correctIndex ?? raw.correct ?? raw.answer;
  if (typeof rawAnswer === 'number' && Number.isFinite(rawAnswer)) {
    correctIndex = rawAnswer >= 0 && rawAnswer < options.length ? rawAnswer : 0;
  } else if (typeof rawAnswer === 'string') {
    const letter = rawAnswer.trim().toUpperCase().match(/[A-D]/);
    if (letter) correctIndex = letter[0].charCodeAt(0) - 65;
    else {
      const asNum = parseInt(rawAnswer, 10);
      if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= options.length) correctIndex = asNum - 1;
    }
  }
  correctIndex = Math.max(0, Math.min(options.length - 1, correctIndex));
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `q${index + 1}`,
    question: questionText,
    options,
    correctIndex,
    explanation: String(raw.explanation ?? '').trim() || `The correct option follows directly from the material on ${topicLabel}.`,
    topic: String(raw.topic ?? '').trim() || topicLabel,
  };
}

// (b) Full-coverage parser: extracts ALL items (JSON array, {questions:[...]},
/// or numbered "1. ... A) ... Answer: B" text) — never just the first.
function parseQuizPayload(rawText: string, topicLabel: string): QuizQuestion[] {
  if (!rawText || !rawText.trim()) return [];
  const cleaned = rawText.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const tryParse = (s: string): any | null => {
    try { return JSON.parse(s); } catch { return null; }
  };
  let parsed = tryParse(cleaned);
  if (!parsed) {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end > start) parsed = tryParse(cleaned.slice(start, end + 1));
  }
  const arr = Array.isArray(parsed) ? parsed : parsed?.questions ?? parsed?.quiz ?? null;
  if (Array.isArray(arr)) {
    return arr
      .map((q, i) => normalizeQuizQuestion(q, i, topicLabel))
      .filter((q): q is QuizQuestion => q !== null);
  }
  // Numbered-text fallback: split into one block per question, parse each.
  const blocks = cleaned
    .split(/\n(?=\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:\-])/i)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: QuizQuestion[] = [];
  blocks.forEach((block, i) => {
    const optMatches = [...block.matchAll(/(^|\n)\s*([A-D])\s*[).:\-]\s*(.+)/gi)];
    if (optMatches.length < 2) return;
    const options = optMatches.map((m) => m[3].trim()).slice(0, 4);
    const answerMatch = block.match(/(?:correct\s*answer|answer)\s*[:\-]\s*([A-D1-4])/i);
    let correctIndex = 0;
    if (answerMatch) {
      const token = answerMatch[1].toUpperCase();
      if (/[A-D]/.test(token)) correctIndex = token.charCodeAt(0) - 65;
      else {
        const n = parseInt(token, 10);
        if (!Number.isNaN(n)) correctIndex = Math.max(0, Math.min(options.length - 1, n - 1));
      }
    }
    const questionLine = block.split('\n')[0].replace(/^\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:\-]\s*/i, '').trim();
    const explMatch = block.match(/explanation\s*[:\-]\s*(.+)/is);
    const normalized = normalizeQuizQuestion(
      {
        id: `q${i + 1}`,
        question: questionLine || block.slice(0, 140),
        options,
        correctIndex,
        explanation: (explMatch?.[1] ?? '').trim(),
        topic: topicLabel,
      },
      i,
      topicLabel,
    );
    if (normalized) out.push(normalized);
  });
  return out;
}

function splitSourceSentences(source: string): string[] {
  return source
    .split(/[\n]+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && s.length <= 280);
}

const QUIZ_STOPWORDS = new Set(
  'the,and,for,are,but,not,you,all,any,can,had,her,was,one,our,out,has,have,that,this,with,from,they,will,would,there,their,what,when,which,who,whom,about,into,over,after,before,between,through,during,each,other,some,such,only,also,than,then,them,these,those,because,while,where'.split(','),
);

function extractTopicKeywords(source: string, limit: number): string[] {
  const words = source.replace(/[^a-zA-Z0-9\s-]/g, ' ').split(/\s+/).map((w) => w.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (w.length < 5 || QUIZ_STOPWORDS.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    out.push(w);
    if (out.length >= limit) break;
  }
  return out;
}

// (c) Local fallback bank derived from the user's own source text/topic so the
// rendered count always equals the request when the AI under-delivers.
function buildLocalFallbackQuestions(source: string, needed: number, startIndex: number): QuizQuestion[] {
  if (needed <= 0) return [];
  const label = quizTopicLabel(source);
  const sentences = splitSourceSentences(source);
  const keywords = extractTopicKeywords(source, Math.max(needed, 4));
  const out: QuizQuestion[] = [];
  for (let k = 0; k < needed; k++) {
    const idx = startIndex + k;
    const sentence = sentences.length > 0 ? sentences[k % sentences.length] : `The core principles of ${label}.`;
    const keyword = keywords.length > 0 ? keywords[k % keywords.length] : label;
    const correctSlot = k % 4;
    let question = '';
    let correct = '';
    let distractors: string[] = [];
    switch (k % 4) {
      case 0:
        question = `According to your material on ${label}, which statement is accurate?`;
        correct = sentence;
        distractors = [
          `The opposite of what your material states about ${label}.`,
          `A claim your material explicitly rules out for ${label}.`,
          `An unrelated fact that does not appear in your material on ${label}.`,
        ];
        break;
      case 1:
        question = `In the context of ${label}, what does "${keyword}" most closely relate to?`;
        correct = `A key idea from your notes: ${sentence}`;
        distractors = [
          `An unrelated term with no link to ${label}.`,
          `A concept your notes distinguish from "${keyword}".`,
          `A generic definition that ignores your material on ${label}.`,
        ];
        break;
      case 2:
        question = `Which question best tests understanding of "${sentence.slice(0, 90)}..."?`;
        correct = `Explaining why that claim about ${label} holds true.`;
        distractors = [
          `Memorizing an isolated date with no link to ${label}.`,
          `Restating the sentence without explaining ${label}.`,
          `Contradicting the sentence without evidence from ${label}.`,
        ];
        break;
      default:
        question = `To apply your notes on ${label}, which action is most appropriate?`;
        correct = `Use the principle "${sentence.slice(0, 80)}..." to solve a related problem.`;
        distractors = [
          `Ignore the material and guess without reasoning about ${label}.`,
          `Apply a rule your notes reserve for a different topic.`,
          `Repeat terminology from ${label} without using it.`,
        ];
        break;
    }
    const options: string[] = [];
    const pool = [...distractors];
    for (let s = 0; s < 4; s++) {
      if (s === correctSlot) options.push(correct);
      else options.push(pool.shift() ?? `An alternative view on ${label}.`);
    }
    out.push({
      id: `q${idx}`,
      question,
      options,
      correctIndex: correctSlot,
      explanation: `This follows from your material on ${label}: "${sentence.slice(0, 160)}".`,
      topic: label,
    });
  }
  return out;
}

function ensureExactCount(questions: QuizQuestion[], count: number, source: string): QuizQuestion[] {
  const seen = new Set<string>();
  const deduped: QuizQuestion[] = [];
  for (const q of questions) {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(q);
  }
  const topped = deduped.length >= count
    ? deduped.slice(0, count)
    : [...deduped, ...buildLocalFallbackQuestions(source, count - deduped.length, deduped.length + 1)];
  return topped.slice(0, count).map((q, i) => ({ ...q, id: `q${i + 1}` }));
}

export const QuizGeneratorWorkspace: React.FC = () => {
  useLang();
  const [inputText, setInputText] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<Array<{ date: string; score: number; total: number }>>(() => {
    try { const s = localStorage.getItem('scc_quiz_history_v1'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [retryMode, setRetryMode] = useState(false);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Mixed' | 'Hard'>('Mixed');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setTimedOut(false);

    // The count preset (5/10/20) previously never reached the AI: the service
    // call below hardcodes "exactly 5" and the error fallback yields 1 item.
    const requested = Math.max(1, Math.min(50, questionCount));
    const source = inputText.trim();
    const topicLabel = quizTopicLabel(source);

    try {
      let pooled: QuizQuestion[] = [];

      // 1) Count-aware attempt: prompt explicitly demands EXACTLY N questions.
      try {
        const raw = await callGemini({
          contents: buildQuizPrompt(source, requested, difficulty),
          config: { responseMimeType: 'application/json' },
        });
        pooled = parseQuizPayload(raw, topicLabel);
      } catch (err) {
        console.warn('Count-aware quiz call failed, trying legacy generator:', err);
      }

      // 2) Legacy generator as a secondary source (normalised + merged).
      if (pooled.length < requested) {
        try {
          const legacy = await generateInteractiveQuiz(source);
          const existing = new Set(pooled.map((q) => q.question.trim().toLowerCase()));
          (Array.isArray(legacy) ? legacy : []).forEach((q, i) => {
            const normalized = normalizeQuizQuestion(q, pooled.length + i, topicLabel);
            if (normalized && !existing.has(normalized.question.trim().toLowerCase())) {
              existing.add(normalized.question.trim().toLowerCase());
              pooled.push(normalized);
            }
          });
        } catch (err) {
          console.warn('Legacy quiz generator failed:', err);
        }
      }

      // 3) Local fallback top-up so the rendered count always equals requested.
      const finalQuestions = ensureExactCount(pooled, requested, source);
      if (finalQuestions.length > 0) {
        setQuizQuestions(finalQuestions);
      } else {
        throw new Error(t('quiz_gen_fail'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('quiz_gen_fail2'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    setRetryMode(false);
    let correct = 0;
    quizQuestions.forEach((q, idx) => { if (userAnswers[idx] === q.correctIndex) correct++; });
    const entry = { date: new Date().toLocaleString(), score: correct, total: quizQuestions.length };
    const updated = [entry, ...scoreHistory].slice(0, 20);
    setScoreHistory(updated);
    try { localStorage.setItem('scc_quiz_history_v1', JSON.stringify(updated)); } catch {}
    if (correct / quizQuestions.length >= 0.7 && document.visibilityState === 'visible') {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }
  };

  const handleRetryIncorrect = () => {
    const incorrect = quizQuestions.filter((q, idx) => userAnswers[idx] !== q.correctIndex);
    if (incorrect.length === 0) return;
    setQuizQuestions(incorrect);
    setUserAnswers({});
    setIsSubmitted(false);
    setRetryMode(true);
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
  };

  const submitRef = useRef<() => void>(() => {});
  submitRef.current = handleSubmitQuiz;

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (quizQuestions.length === 0 || isSubmitted) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (quizQuestions.length === 0) setTimeLeft(null);
      return;
    }
    const initial = quizQuestions.length > 0 ? quizQuestions.length * 60 : 600;
    setTimeLeft(initial);
    setTimedOut(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setTimedOut(true);
          setTimeout(() => submitRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [quizQuestions.length, isSubmitted]);

  const correctCount = quizQuestions.filter((q, idx) => userAnswers[idx] === q.correctIndex).length;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                {t('quiz_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                {t('quiz_badge')}
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              {t('quiz_sub')}
            </p>
          </div>
        </div>

        {quizQuestions.length > 0 && isSubmitted && (
          <div className="flex items-center gap-2">
            {quizQuestions.filter((q, idx) => userAnswers[idx] !== q.correctIndex).length > 0 && (
              <button
                onClick={handleRetryIncorrect}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('quiz_retry_btn')} ({quizQuestions.filter((q, idx) => userAnswers[idx] !== q.correctIndex).length})</span>
              </button>
            )}
            <button
              onClick={handleResetQuiz}
              className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D97757]" />
              <span>{t('quiz_retake')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Generation Input Card (When no quiz is active) */}
      {quizQuestions.length === 0 ? (
        <form onSubmit={handleGenerateQuiz} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              {t('quiz_input_label')}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('quiz_input_ph')}
              rows={8}
              className="w-full p-4 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8C897F]">{t('quiz_questions')}</span>
              <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      questionCount === count
                        ? 'bg-[#D97757] text-white shadow-2xs'
                        : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8C897F]">{t('quiz_difficulty')}</span>
              <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                {(['Easy', 'Mixed', 'Hard'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      difficulty === level
                        ? 'bg-[#D97757] text-white shadow-2xs'
                        : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !inputText.trim()}
              className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Questions...' : 'Generate Practice Quiz'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      ) : (
        /* 3. Interactive Quiz Taking View */
        <div className="space-y-6">
          
          {/* Score History */}
          {scoreHistory.length > 0 && (
            <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C897F] mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Score History (last {scoreHistory.length})</h4>
              <div className="flex gap-2 overflow-x-auto">
                {scoreHistory.slice(0, 8).map((h, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-mono shrink-0">
                    <span className={h.score / h.total >= 0.7 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{h.score}/{h.total}</span>
                    <span className="text-[10px] text-[#8C897F] ml-1">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {retryMode && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">Retry Mode: Showing {quizQuestions.length} incorrect question(s) only</div>
          )}
          {/* Quiz countdown + timeout state */}
          {!isSubmitted && timeLeft !== null && (
            <div className="px-4 py-2.5 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] flex items-center justify-between">
              <span>Time remaining</span>
              <span className="font-mono text-sm text-[#141413] dark:text-[#FAF9F5]">{formatTime(timeLeft)}</span>
            </div>
          )}
          {timedOut && isSubmitted && (
            <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">Time&apos;s up — answers locked. Review your results below.</div>
          )}
          {/* Score Header (When Submitted) */}
          {isSubmitted && (
            <div className="p-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                    Quiz Complete: {correctCount} / {quizQuestions.length} Correct ({Math.round((correctCount / quizQuestions.length) * 100)}%)
                  </h3>
                  <p className="text-xs text-[#8C897F]">
                    {correctCount === quizQuestions.length
                      ? 'Mastery achieved! All concepts thoroughly understood.'
                      : 'Review the explanations below to reinforce your weaker areas.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizQuestions([]);
                  setUserAnswers({});
                  setIsSubmitted(false);
                  setTimedOut(false);
                }}
                className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Create New Quiz
              </button>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {quizQuestions.map((q, qIdx) => {
              const selectedOpt = userAnswers[qIdx];
              const hasAnswered = selectedOpt !== undefined;
              const isCorrect = isSubmitted && selectedOpt === q.correctIndex;

              return (
                <div
                  key={qIdx}
                  className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                      Question {qIdx + 1} of {quizQuestions.length}
                    </span>

                    {isSubmitted && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                    <MathMarkdown>{q.question}</MathMarkdown>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      const isCorrectOption = optIdx === q.correctIndex;

                      let btnStyle = 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8]';

                      if (isSubmitted) {
                        if (isCorrectOption) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold';
                        } else if (isOptionSelected && !isCorrectOption) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 line-through';
                        }
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 font-bold shadow-xs';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          disabled={isSubmitted}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <MathMarkdown>{opt}</MathMarkdown>
                          {isSubmitted && isCorrectOption && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isSubmitted && isOptionSelected && !isCorrectOption && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conceptual Explanation Callout (Shown after submit) */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-xs text-[#5C5A54] dark:text-[#B5B2A8] space-y-1">
                      <strong className="text-purple-950 dark:text-purple-300 block">Explanation:</strong>
                      <div className="leading-relaxed"><MathMarkdown>{q.explanation}</MathMarkdown></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Submit Action */}
          {!isSubmitted && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length === 0}
                className="px-8 py-3 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Submit &amp; View Explanations</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
