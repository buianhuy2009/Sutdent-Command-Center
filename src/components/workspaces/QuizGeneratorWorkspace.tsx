import React, { useState } from 'react';
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
import { generateInteractiveQuiz, QuizQuestion } from '../../services/gemini';

export const QuizGeneratorWorkspace: React.FC = () => {
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

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setUserAnswers({});
    setIsSubmitted(false);

    try {
      const questions = await generateInteractiveQuiz(inputText.trim());
      if (questions && questions.length > 0) {
        setQuizQuestions(questions);
      } else {
        throw new Error('Could not generate quiz questions from this text.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate quiz.');
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
                AI Practice Quiz Generator
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                Retrieval Practice Engine
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Paste lecture notes, slides, or study outlines to generate practice exams with explanations
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
                <span>Retry Incorrect Only ({quizQuestions.filter((q, idx) => userAnswers[idx] !== q.correctIndex).length})</span>
              </button>
            )}
            <button
              onClick={handleResetQuiz}
              className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D97757]" />
              <span>Retake Quiz</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Generation Input Card (When no quiz is active) */}
      {quizQuestions.length === 0 ? (
        <form onSubmit={handleGenerateQuiz} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              Paste Lecture Material, Textbook Excerpt, or Study Notes
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. In thermodynamics, the second law states that the total entropy of an isolated system always increases over time. Carnot efficiency is given by 1 - (Tc / Th)..."
              rows={8}
              className="w-full p-4 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8C897F]">Questions:</span>
              <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                {[3, 5, 8].map((count) => (
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

                  <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                    {q.question}
                  </h3>

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
                          <span>{opt}</span>
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
                      <p className="leading-relaxed">{q.explanation}</p>
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
