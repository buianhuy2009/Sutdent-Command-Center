import React, { useState } from 'react';
import { Calculator, ExternalLink, Sparkles, Copy, Check, BookOpen } from 'lucide-react';
import { callGemini, callGroqDirect } from '../../services/gemini';

export const WolframWorkspace: React.FC = () => {
  const [query, setQuery] = useState('integrate x^2 * sin(x) dx');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<string | null>(
    `### Step-by-Step Solution: $\\int x^2 \\sin(x) \\, dx$

**1. Apply Integration by Parts:**
$$\\int u \\, dv = uv - \\int v \\, du$$

Let:
- $u = x^2 \\implies du = 2x \\, dx$
- $dv = \\sin(x) \\, dx \\implies v = -\\cos(x)$

$$\\int x^2 \\sin(x) \\, dx = -x^2 \\cos(x) - \\int (-\\cos(x))(2x \\, dx)$$
$$= -x^2 \\cos(x) + 2 \\int x \\cos(x) \\, dx$$

**2. Integrate by Parts again for $\\int x \\cos(x) \\, dx$:**
Let:
- $u = x \\implies du = dx$
- $dv = \\cos(x) \\, dx \\implies v = \\sin(x)$

$$\\int x \\cos(x) \\, dx = x \\sin(x) - \\int \\sin(x) \\, dx = x \\sin(x) + \\cos(x)$$

**3. Combine terms & Add Constant of Integration:**
$$\\int x^2 \\sin(x) \\, dx = -x^2 \\cos(x) + 2x \\sin(x) + 2\\cos(x) + C$$`
  );
  const [copied, setCopied] = useState(false);

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSolving(true);
    const prompt = `You are a master mathematician and computation engine like Wolfram Alpha and Symbolab.
Solve this mathematical / science query with step-by-step algebraic derivations and rigorous notation using LaTeX ($...$ and $$...$$):
"${query}"

Provide clear numbered steps, intermediate derivations, and final box answers.`;

    try {
      const res = await callGemini({ contents: prompt });
      setSolution(res);
    } catch {
      try {
        const res = await callGroqDirect(prompt);
        setSolution(res);
      } catch (err) {
        console.error('Error solving math:', err);
      }
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-600/20 font-mono font-bold">
            ∫dx
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Wolfram Alpha &amp; Symbolab Solver
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
                CAS Engine
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Step-by-step calculus, linear algebra, physics derivations &amp; computation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Wolfram Alpha</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://www.symbolab.com/solver/step-by-step/${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Symbolab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSolve} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter problem (e.g. solve 3x^2 + 5x - 2 = 0, eigenvalues of [[1,2],[3,4]], pH of 0.05M HCl)..."
          className="flex-1 px-4 py-2.5 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
        />
        <button
          type="submit"
          disabled={isSolving}
          className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSolving ? 'Solving steps...' : 'Solve Step-by-Step'}</span>
        </button>
      </form>

      {/* Solution Output */}
      {solution && (
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-8 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              Step-by-Step Derivation
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Solution!' : 'Copy Steps'}</span>
            </button>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed font-sans whitespace-pre-line">
            {solution}
          </div>
        </div>
      )}
    </div>
  );
};
