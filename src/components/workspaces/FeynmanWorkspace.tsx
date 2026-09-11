import React, { useState } from 'react';
import { Sparkles, Copy, Check, BookOpen, Layers } from 'lucide-react';
import { feynmanExplainThreeTiers } from '../../services/gemini';
import { ThreeTierFeynmanResult } from '../../types';
import { t, useLang } from '../../services/i18n';

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

  const handleSimplify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setIsSimplifying(true);
    try {
      const res = await feynmanExplainThreeTiers(concept.trim());
      setTierResult(res);
    } catch (err) {
      console.error('Feynman simplification error:', err);
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
              {activeTier === 'eli5'
                ? tierResult.tier1_eli5
                : activeTier === 'hs'
                ? tierResult.tier2_highschool
                : tierResult.tier3_undergrad}
            </div>

            {/* Everyday Analogy */}
            {tierResult.analogy && (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                <strong className="text-[#141413] dark:text-[#FAF9F5]">{t('feyn_analogy')}</strong> {tierResult.analogy}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
