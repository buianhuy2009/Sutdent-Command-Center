import React, { useState } from 'react';
import { Sparkles, Copy, Check, BookOpen, Layers } from 'lucide-react';
import { MathMarkdown } from '../MathMarkdown';
import { feynmanExplainThreeTiers, getClientGeminiApiKey, getClientGroqApiKey } from '../../services/gemini';
import { ThreeTierFeynmanResult } from '../../types';
import { t, useLang } from '../../services/i18n';

const FEYNMAN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'when', 'where',
  'explain', 'concept', 'about', 'into', 'please', 'mean', 'means', 'does',
  'how', 'why', 'are', 'was', 'were', 'has', 'have', 'had', 'its', 'our',
  'your', 'their', 'they', 'them', 'then', 'than', 'also', 'very', 'will',
  'would', 'could', 'should',
]);

function extractKeyTerms(concept: string): string[] {
  const words = concept
    .replace(/[^\p{L}\p{N}\s\-']/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim().replace(/^['-]+|['-]+$/g, ''))
    .filter((w) => w.length > 2 && !FEYNMAN_STOPWORDS.has(w.toLowerCase()));
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of words) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(w);
    }
  }
  // Prefer capitalized / longer (likely topical) terms first.
  unique.sort((a, b) => {
    const cap = Number(/^[A-Z]/.test(b)) - Number(/^[A-Z]/.test(a));
    return cap || b.length - a.length;
  });
  return unique.slice(0, 6);
}

function buildLocalFeynmanFallback(concept: string): ThreeTierFeynmanResult {
  const clean = concept.trim().replace(/\s+/g, ' ');
  const title = clean.length > 60 ? `${clean.slice(0, 60).trimEnd()}…` : clean;
  const terms = extractKeyTerms(clean);
  const keyLine = terms.length > 0 ? terms.join(', ') : clean;
  const firstTerm = terms[0] ?? title;

  return {
    concept: title,
    corePrinciple: `"${title}" in one sentence: it describes how ${firstTerm} behaves and what causes it to change.`,
    tier1_eli5:
      `Let's talk about "${title}" with super simple words.\n\n` +
      `Imagine you have a toy you love. "${title}" is like learning the toy's one favorite trick — the main thing it does. ` +
      `When you see ${firstTerm}, ask: "What is it doing right now?" Then ask: "What made it do that?" ` +
      `That's the whole game: spot the thing, spot what pushes it, and watch what happens next.\n\n` +
      `Say it back in your own tiny words: "I think ${title} means…" If you can tell it to a 5-year-old and they nod, you really get it!`,
    tier2_highschool:
      `High-school scaffold for "${title}".\n\n` +
      `1) Definition: ${title} is the pattern of how ${firstTerm} works — its parts, its inputs, and its outputs.\n` +
      `2) How it works: (a) start with the setup, (b) follow the cause → effect chain step by step, (c) check what stays the same and what changes.\n` +
      `3) Key terms to nail down: ${keyLine}. Define each in one line without jargon, then reconnect them: which one drives the others?\n` +
      `4) Worked check: pick one everyday example of "${title}", write the "before → action → after" chain, and name where someone could get confused. ` +
      `If you can predict the "after" from the "before", you've got the high-school level down.`,
    tier3_undergrad:
      `Undergraduate scaffold for "${title}".\n\n` +
      `1) Formalize: state the governing principle behind ${firstTerm} (law, theorem, model, or mechanism) and its boundary conditions — when does it hold, when does it break?\n` +
      `2) Derive: decompose "${title}" into variables and relations: identify state variables, parameters, and the governing equation or stepwise mechanism linking them. ` +
      `Key vocabulary: ${keyLine}.\n` +
      `3) Analyze: test edge cases and limiting behavior (what happens at extremes?), compare with one adjacent theory, and name the standard counterargument or misconception.\n` +
      `4) Feynman close: compress the above into a 3-sentence rigorous summary you could defend in a tutorial — claim, justification, qualification.`,
    analogy: `Think of "${title}" like learning a recipe: the ingredients are ${keyLine} — once you know what each one does, the steps stop feeling like magic.`,
  };
}

export const FeynmanWorkspace: React.FC = () => {
  useLang();
  const [concept, setConcept] = useState('Quantum Tunneling and Wavefunction Decay');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [tierResult, setTierResult] = useState<ThreeTierFeynmanResult | null>({
    concept: 'Quantum Tunneling',
    corePrinciple: 'Subatomic particles can penetrate potential energy barriers higher than their kinetic energy due to wave-particle duality.',
    tier1_eli5: 'Imagine throwing a bouncy ball at a solid brick wall. Normally it bounces right back. But in quantum land, the ball is like a magical ghost smoke cloud that can sometimes peek through to the other side without breaking the wall!',
    tier2_highschool: 'Subatomic particles like electrons behave both as particles and as probability wavefunctions. When a particle encounters an energy barrier higher than its kinetic energy, its wavefunction decays exponentially within the barrier but has a non-zero amplitude on the other side, allowing a chance of transmission.',
    tier3_undergrad: 'Solving the time-independent Schrödinger equation for a finite potential barrier V_0 reveals that inside the barrier (where E < V_0), the spatial wavefunction solution is exponential decay psi(x) = C e^(-kappa x), where kappa = sqrt(2m(V_0 - E))/hbar. The transmission coefficient T is non-zero, proving finite barrier penetration.',
    analogy: 'Like whispering softly in one room and the sound vibrations faintly penetrating a thick closed door even without opening it.',
  });
  const [activeTier, setActiveTier] = useState<'eli5' | 'hs' | 'uni'>('hs');
  const [copied, setCopied] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleSimplify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = concept.trim();
    if (!trimmed) return;

    setIsSimplifying(true);
    setExplainError(null);
    // Local template fallback: always render 3 tiers instantly with zero network / zero key.
    setTierResult(buildLocalFeynmanFallback(trimmed));
    try {
      // AI-enhance only when a key is configured; otherwise the offline scaffold is the answer.
      let hasKey = false;
      try {
        hasKey = Boolean(getClientGeminiApiKey() || getClientGroqApiKey());
      } catch {
        hasKey = false;
      }
      if (!hasKey) return;
      const res = await feynmanExplainThreeTiers(trimmed);
      if (res?.tier1_eli5 && res?.tier2_highschool && res?.tier3_undergrad) {
        setTierResult(res);
      } else {
        setExplainError('AI returned an incomplete explanation — showing the built-in study scaffold instead.');
      }
    } catch (err) {
      console.error('Feynman simplification error:', err);
      setExplainError(
        err instanceof Error
          ? `AI enhancement failed (${err.message}) — showing the built-in study scaffold instead.`
          : 'AI enhancement failed — showing the built-in study scaffold instead.',
      );
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeText =
    activeTier === 'eli5'
      ? tierResult?.tier1_eli5 ?? ''
      : activeTier === 'hs'
      ? tierResult?.tier2_highschool ?? ''
      : tierResult?.tier3_undergrad ?? '';
  const readMins = Math.max(
    1,
    Math.ceil(activeText.trim().split(/\s+/).filter(Boolean).length / 200),
  );

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                {t('feyn_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                {t('feyn_badge')}
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              {t('feyn_sub')}
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSimplify} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex gap-2">
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={t('feyn_ph')}
          className="flex-1 px-4 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
        />
        <button
          type="submit"
          disabled={isSimplifying}
          className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSimplifying ? t('feyn_translating') : t('feyn_explain')}</span>
        </button>
      </form>

      {/* Error (never silent) */}
      {explainError && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl px-5 py-3.5 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          {explainError}
        </div>
      )}

      {/* Result Cards */}
      {tierResult && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs space-y-6 animate-in fade-in">
          {/* Level Switcher */}
          <div className="flex items-center gap-2 pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            {[
              { id: 'eli5', label: t('feyn_simple') },
              { id: 'hs', label: t('feyn_hs') },
              { id: 'uni', label: t('feyn_uni') },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTier === tier.id
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                {tier.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] font-medium text-[#8C897F] dark:text-[#B5B2A8]">
                ~{readMins} {t('feyn_read')}
              </span>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs leading-relaxed text-[#141413] dark:text-[#FAF9F5]">
              <MathMarkdown>
                {activeTier === 'eli5'
                  ? tierResult.tier1_eli5
                  : activeTier === 'hs'
                  ? tierResult.tier2_highschool
                  : tierResult.tier3_undergrad}
              </MathMarkdown>
            </div>

            {/* Everyday Analogy */}
            {tierResult.analogy && (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                <strong className="text-[#141413] dark:text-[#FAF9F5]">{t('feyn_analogy')}</strong>{' '}
                <MathMarkdown>{tierResult.analogy}</MathMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
