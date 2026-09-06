import React from 'react';
import { ArrowRight, Cpu, Lightbulb, Camera, BadgeCheck, PencilLine } from 'lucide-react';

/** Plain-language educational chip for middle-school judges + students. */
export const WhyChip: React.FC<{ text: string }> = ({ text }) => (
  <p className="inline-flex items-start gap-1.5 text-[11px] leading-relaxed bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl px-2.5 py-1.5">
    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-px" />
    <span><strong>Why this matters:</strong> {text}</span>
  </p>
);

/** Three-step visual: Input → AI Processing → Output (Division A §1 requirement). */
export const InputAIOutput: React.FC<{ input: string; process: string; output: string }> = ({ input, process, output }) => (
  <div className="flex items-stretch gap-1.5 text-[10px] font-semibold" aria-label="Input AI output diagram">
    {[input, process, output].map((s, i) => (
      <React.Fragment key={i}>
        <div className={`flex-1 rounded-xl border px-2 py-1.5 text-center leading-snug ${i === 1 ? 'bg-[#D97757]/10 border-[#D97757]/40 text-[#D97757]' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8]'}`}>
          {i === 1 && <Cpu className="w-3 h-3 mx-auto mb-0.5" />}
          {s}
        </div>
        {i < 2 && <ArrowRight className="w-3.5 h-3.5 self-center text-[#6B6860] shrink-0" />}
      </React.Fragment>
    ))}
  </div>
);

export const SocraticError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-900 dark:text-sky-200" role="alert">
    <strong>Hmm, let&apos;s think together:</strong> {message}
  </div>
);

export const EvidenceButton: React.FC<{ onSnap: () => void }> = ({ onSnap }) => (
  <button
    type="button"
    onClick={onSnap}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-white dark:bg-[#1A1917] text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757] hover:text-[#D97757] min-h-[44px] cursor-pointer"
  >
    <Camera className="w-3.5 h-3.5" /> Evidence Snapshot
  </button>
);

export const VerifyEdit: React.FC<{ verified: boolean; onToggle: () => void; onEdit?: () => void }> = ({ verified, onToggle, onEdit }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={verified}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold min-h-[44px] cursor-pointer ${verified ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-emerald-500'}`}
    >
      <BadgeCheck className="w-3.5 h-3.5" /> {verified ? 'Verified ✓' : 'Verify'}
    </button>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] font-bold min-h-[44px] cursor-pointer hover:border-[#D97757] hover:text-[#D97757]"
      >
        <PencilLine className="w-3.5 h-3.5" /> Edit
      </button>
    )}
  </div>
);
