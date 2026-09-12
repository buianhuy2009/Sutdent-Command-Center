import React, { useState } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { socraticRubricPreCheck } from '../../services/gemini';
import { RubricPreCheckResult } from '../../types';

const STOPWORDS = new Set(
  'about,above,after,again,against,among,arent,around,because,before,being,below,between,cannot,could,doesn,doing,down,each,other,should,these,those,through,under,until,while,with,within,without,your,from,they,them,then,than,that,this,what,when,where,which,will,into,and,the,for,are,but,not,you,all,any,can,had,her,was,one,our,out,has,have,more,very,upon,using,used,use,based,include,includes,clear,clarity,good,strong,effective,proper'.split(','),
);

function hasAiKey(): boolean {
  try {
    const stored = localStorage.getItem('scc_gemini_api_key');
    if (stored && stored.trim()) return true;
  } catch {
    /* storage unavailable — fall through to env check */
  }
  try {
    const envKey = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env
      ?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim()) return true;
  } catch {
    /* env unavailable */
  }
  return false;
}

function splitCriteria(rubricText: string): string[] {
  const lines = rubricText
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^(\d+\s*[.)\-:]+|[-*•]\s+)/, '').trim())
    .filter((l) => l.length > 1);
  if (lines.length === 0) return ['Overall quality'];
  if (lines.length === 1) {
    const only = lines[0];
    if (only.includes(';')) {
      const parts = only.split(';').map((s) => s.trim()).filter((s) => s.length > 1);
      if (parts.length > 1) return parts.slice(0, 6);
    }
    if (only.split(',').length >= 3) {
      const parts = only.split(',').map((s) => s.trim()).filter((s) => s.length > 1);
      if (parts.length > 1) return parts.slice(0, 6);
    }
    return [only];
  }
  return lines.slice(0, 6);
}

function extractKeywords(criterion: string): string[] {
  const words = criterion.toLowerCase().match(/[a-z]{4,}/g) || [];
  const seen = new Set<string>();
  for (const w of words) {
    if (!STOPWORDS.has(w) && !seen.has(w)) seen.add(w);
    if (seen.size >= 12) break;
  }
  return [...seen];
}

function computeLocalPreCheck(draftText: string, rubricText: string): RubricPreCheckResult {
  const draft = draftText.trim();
  const draftLower = draft.toLowerCase();
  const words = draft ? draft.split(/\s+/) : [];
  const wordCount = words.length;
  const sentences = draft.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const sentenceCount = sentences.length;
  const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
  const avgSentenceLen = sentenceLengths.length
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')).filter(Boolean));
  const variety = wordCount > 0 ? uniqueWords.size / wordCount : 0;
  const paragraphs = draft.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const paraCount = paragraphs.length || (draft ? 1 : 0);

  const transitionHits = (
    draftLower.match(/\b(however|moreover|furthermore|therefore|thus|consequently|nevertheless|in addition|for example|for instance|in conclusion|as a result|on the other hand|first|second|finally)\b/g) || []
  ).length;
  const evidenceHits = (
    draftLower.match(/\b(according to|study|studies|data|research|evidence|example|because|since|citation|source|figure|table|experiment)\b/g) || []
  ).length + (draft.match(/["“”]/g) || []).length * 0.5 + (draft.match(/\[[^\]]+\]/g) || []).length;
  const hasConclusion = /\b(in conclusion|to conclude|in summary|overall|finally)\b/.test(draftLower) || paraCount >= 3;
  const hasThesis = /\b(thesis|argue|claim|contend|position is|this essay|this paper)\b/.test(draftLower) || (paragraphs[0] || '').split(/\s+/).length >= 20;

  const wordFactor = wordCount >= 300 ? 1 : wordCount >= 150 ? 0.85 : wordCount >= 80 ? 0.65 : wordCount >= 30 ? 0.4 : 0.25;
  const sentenceFactor = sentenceCount >= 5 ? 1 : sentenceCount >= 3 ? 0.8 : sentenceCount >= 2 ? 0.55 : 0.35;
  const varietyFactor = variety >= 0.5 ? 1 : variety >= 0.35 ? 0.85 : variety >= 0.25 ? 0.65 : 0.45;
  const structureBonus = Math.min(0.1, (transitionHits >= 3 ? 0.05 : 0) + (evidenceHits >= 1 ? 0.05 : 0));

  const names = splitCriteria(rubricText);
  const n = names.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;

  const criteria = names.map((name, i) => {
    const maxPoints = base + (i < remainder ? 1 : 0);
    const keywords = extractKeywords(name);
    const matched = keywords.filter((k) => draftLower.includes(k));
    const coverage = keywords.length > 0 ? matched.length / keywords.length : 0.5;
    const raw = Math.min(1, 0.55 * coverage + 0.2 * wordFactor + 0.1 * sentenceFactor + 0.15 * varietyFactor + structureBonus);
    const pointsEarned = Math.max(0, Math.min(maxPoints, Math.round(raw * maxPoints)));
    const missing = keywords.filter((k) => !draftLower.includes(k)).slice(0, 3);
    const feedback =
      coverage >= 0.6
        ? `Good coverage of "${name}" (${matched.length}/${keywords.length || 1} key terms found).`
        : coverage >= 0.3
          ? `Partial coverage of "${name}" (${matched.length}/${keywords.length || 1} key terms found).`
          : `Weak coverage of "${name}" (${matched.length}/${keywords.length || 1} key terms found). Draft rarely uses this criterion's language.`;
    const suggestion =
      missing.length > 0
        ? `Name ${missing.map((m) => `"${m}"`).join(', ')} explicitly and add one sentence of evidence for "${name}".`
        : `Add one concrete example or citation that proves "${name}" rather than restating it.`;
    return { criterion: name, pointsEarned, maxPoints, feedback, suggestion };
  });

  const overallScore = criteria.reduce((sum, c) => sum + c.pointsEarned, 0);
  const sorted = [...criteria].sort((a, b) => a.pointsEarned / a.maxPoints - b.pointsEarned / b.maxPoints);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const revisions: string[] = [];
  if (wordCount < 150) revisions.push(`Expand the draft (currently ~${wordCount} words): add one paragraph of analysis with a concrete example.`);
  if (sentenceCount < 4) revisions.push(`Break the argument into at least 4–5 sentences (currently ${sentenceCount}): one claim per sentence, average length near 15–20 words (currently ~${Math.round(avgSentenceLen)}).`);
  if (avgSentenceLen > 0 && (avgSentenceLen < 10 || avgSentenceLen > 28)) revisions.push(`Vary sentence length (average ~${Math.round(avgSentenceLen)} words): mix short claims with longer evidence sentences.`);
  if (transitionHits < 3) revisions.push(`Add transition sentences (found ~${transitionHits} signal words): use "however", "for example", "therefore" to connect paragraphs.`);
  if (evidenceHits < 1) revisions.push(`Add concrete evidence: cite a source, data point, quotation, or worked example to support the main claim.`);
  if (!hasThesis) revisions.push(`State the thesis in the first paragraph ("This essay argues…") so the examiner sees the position immediately.`);
  if (!hasConclusion) revisions.push(`Add a closing paragraph that restates the thesis and names one limitation or next step.`);
  if (weakest) revisions.push(`Strengthen "${weakest.criterion}" — the lowest subscore (${weakest.pointsEarned}/${weakest.maxPoints}): ${weakest.suggestion}`);
  const actionableRevisions = revisions.slice(0, 4);
  if (actionableRevisions.length === 0) actionableRevisions.push('Polish word choice and proofread citations before submitting.');

  const overallFeedback =
    `Heuristic baseline ${overallScore}/100 across ${n} ${n === 1 ? 'criterion' : 'criteria'} ` +
    `from ~${wordCount} words in ${sentenceCount} ${sentenceCount === 1 ? 'sentence' : 'sentences'}. ` +
    (strongest ? `Strongest: "${strongest.criterion}". ` : '') +
    (weakest ? `Needs work: "${weakest.criterion}".` : '');

  return { overallScore, overallFeedback, criteria, actionableRevisions };
}

export const RubricCheckerWorkspace: React.FC = () => {
  const [essayText, setEssayText] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<RubricPreCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const essayWordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const rubricWordCount = rubricText.trim() ? rubricText.trim().split(/\s+/).length : 0;

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayText.trim() || !rubricText.trim()) {
      setError('Paste both your draft and the rubric criteria, then press Pre-Check again.');
      return;
    }

    setError(null);
    setNotice(null);
    setIsChecking(true);
    let baseline: RubricPreCheckResult;
    try {
      baseline = computeLocalPreCheck(essayText, rubricText);
    } catch (err) {
      setError(`Could not score this draft locally: ${err instanceof Error ? err.message : String(err)}`);
      setIsChecking(false);
      return;
    }
    // Always show the local baseline first so the button never appears dead.
    setResult(baseline);

    if (!hasAiKey()) {
      setNotice('Offline heuristic baseline — add a Gemini API key in Settings for AI-enhanced feedback.');
      setIsChecking(false);
      return;
    }

    try {
      const res = await socraticRubricPreCheck({
        draftText: essayText,
        rubricText: rubricText,
      });
      if (typeof res?.overallScore === 'number' && Array.isArray(res?.criteria) && res.criteria.length > 0) {
        setResult(res);
        setNotice('AI-enhanced score.');
      } else {
        setError('AI returned an empty score, showing offline heuristic baseline instead.');
      }
    } catch (err) {
      console.error('Rubric check error:', err);
      setError(
        `AI enhancement unavailable (${err instanceof Error ? err.message : String(err)}). Showing offline heuristic baseline.`,
      );
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
          <span className="text-[11px] text-[#8C897F]">{essayWordCount} words</span>
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
            <span className="text-[11px] text-[#8C897F]">{rubricWordCount} words</span>
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

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-xs text-red-800 dark:text-red-200 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

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

          {result.overallFeedback && (
            <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed">{result.overallFeedback}</p>
          )}

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
