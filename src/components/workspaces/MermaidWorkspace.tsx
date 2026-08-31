import React, { useState, useEffect, useRef } from 'react';
import { Network, Sparkles, Copy, Check, Download, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';
import { generateMermaidDiagram } from '../../services/gemini';

const DEFAULT_CHART = `graph TD
  A[Start Problem] --> B{Formulate Hypothesis}
  B -->|Valid| C[Run Experiment]
  B -->|Invalid| D[Revise Theory]
  C --> E[Analyze Data]
  E --> F[Conclusion]`;

export const MermaidWorkspace: React.FC = () => {
  const [chartCode, setChartCode] = useState(DEFAULT_CHART);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
    renderDiagram(chartCode);
  }, [chartCode]);

  const renderDiagram = async (code: string) => {
    setRenderError(null);
    if (!renderContainerRef.current) return;
    try {
      const id = `mermaid-svg-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = svg;
      }
    } catch (err: any) {
      setRenderError('Syntax error in diagram code. Please adjust notation.');
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateMermaidDiagram(aiPrompt);
      if (res?.code) {
        setChartCode(res.code);
      }
    } catch (err) {
      console.error('Error generating diagram:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-600/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Mermaid Flowcharts &amp; Mindmaps
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-300 dark:border-pink-800">
                Text-to-Diagram
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live markdown-to-diagram rendering with AI diagram generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* AI Generator Input */}
      <form onSubmit={handleGenerateAI} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex gap-2">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe a diagram to generate (e.g. Photosynthesis light and dark reactions flowchart)..."
          className="flex-1 px-4 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
        />
        <button
          type="submit"
          disabled={isGenerating}
          className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
        </button>
      </form>

      {/* Split Code & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Editor */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
            Mermaid Code
          </span>
          <textarea
            rows={16}
            value={chartCode}
            onChange={(e) => setChartCode(e.target.value)}
            className="flex-1 w-full p-3.5 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none"
          />
        </div>

        {/* Live Diagram Render */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between overflow-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F] block mb-4">
              Live Diagram Preview
            </span>
            {renderError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
                {renderError}
              </div>
            ) : (
              <div ref={renderContainerRef} className="flex justify-center items-center py-6 overflow-auto" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
