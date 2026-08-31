import React, { useState } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { socraticRubricPreCheck } from '../../services/gemini';
import { RubricPreCheckResult } from '../../types';

export const RubricCheckerWorkspace: React.FC = () => {
  const [essayText, setEssayText] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<RubricPreCheckResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayText.trim() || !rubricText.trim()) return;

    setIsChecking(true);
    try {
      const res = await socraticRubricPreCheck({
        draftText: essayText,
        rubricText: rubricText,
      });
      setResult(res);
    } catch (err) {
      console.error('Rubric check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Essay Rubric Pre-Checker
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Evaluation
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Grade drafts against official rubric criteria before submission
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCheck} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-2 flex flex-col">
          <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
            1. Your Draft Essay / Paper Text
          </span>
          <textarea
            rows={12}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Paste your draft essay, introduction, argument body, or thesis statement..."
            className="flex-1 w-full p-4 text-xs font-sans bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] leading-relaxed resize-none"
          />
        </div>

        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="space-y-2 flex-1 flex flex-col">
            <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
              2. Assignment Rubric / Criteria
            </span>
            <textarea
              rows={9}
              value={rubricText}
              onChange={(e) => setRubricText(e.target.value)}
              placeholder="Paste rubric criteria (e.g. Thesis clarity, evidence integration, analytical depth, bibliography formatting)..."
              className="flex-1 w-full p-4 text-xs font-sans bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] leading-relaxed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isChecking || !essayText.trim() || !rubricText.trim()}
            className="w-full py-3 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isChecking ? 'Evaluating against rubric...' : 'Pre-Check Draft Score'}</span>
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                Estimated Rubric Score
              </span>
              <div className="text-3xl font-extrabold text-[#D97757] mt-1">
                {result.overallScore} / 100
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                Criteria Evaluated
              </span>
              <div className="text-sm font-bold text-emerald-600 mt-1">
                {result.criteria.length} Rubric Criteria
              </div>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              Criteria Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.criteria.map((c, idx) => (
                <div key={idx} className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#141413] dark:text-[#FAF9F5]">{c.criterion}</span>
                    <span className="text-[#D97757]">{c.pointsEarned} / {c.maxPoints}</span>
                  </div>
                  <p className="text-[11px] text-[#8C897F] leading-relaxed">{c.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Revisions */}
          {result.actionableRevisions && result.actionableRevisions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                Actionable Revisions
              </h3>
              <div className="space-y-2">
                {result.actionableRevisions.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start gap-2.5 text-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D97757] shrink-0 mt-0.5" />
                    <span className="text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                      {imp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
