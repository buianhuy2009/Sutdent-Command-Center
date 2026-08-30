import React, { useState } from 'react';
import {
  Calculator,
  Compass,
  Atom,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  X,
  Search,
  BookOpen,
  Send,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Bot,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { IframeErrorBoundary } from '../IframeErrorBoundary';
import {
  injectDesmosGraph,
  socraticStemSpar,
  scribbleToLatex,
} from '../../services/gemini';
import { DesmosEquation, StemChatTurn } from '../../types';

type StemToolTab =
  | 'desmos-graphing'
  | 'desmos-scientific'
  | 'socratic-tutor'
  | 'scribble-latex'
  | 'geogebra'
  | 'phet';

interface PhetSimulation {
  id: string;
  title: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Math';
  description: string;
  url: string;
}

const PHET_CATALOG: PhetSimulation[] = [
  {
    id: 'phet-projectile',
    title: 'Projectile Motion',
    category: 'Physics',
    description: 'Blast a car out of a cannon and challenge yourself to hit a target! Explore angles, velocity, and air resistance.',
    url: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html',
  },
  {
    id: 'phet-circuit',
    title: 'Circuit Construction Kit (DC)',
    category: 'Physics',
    description: 'Build circuits with batteries, resistors, light bulbs, fuses, and switches. Take measurements with ammeters and voltmeters.',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
  },
  {
    id: 'phet-forces',
    title: 'Forces and Motion: Basics',
    category: 'Physics',
    description: 'Explore the forces at work when pulling against a cart, and pushing a refrigerator, crate, or person.',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
  },
  {
    id: 'phet-balancing',
    title: 'Balancing Chemical Equations',
    category: 'Chemistry',
    description: 'Balance chemical reactions by adjusting coefficients. Inspect reactants vs products visually with balance scales.',
    url: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html',
  },
  {
    id: 'phet-acid-base',
    title: 'Acid-Base Solutions',
    category: 'Chemistry',
    description: 'Investigate how strong and weak acids and bases differ using indicators, pH paper, and conductivity light bulbs.',
    url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html',
  },
  {
    id: 'phet-molecule-shapes',
    title: 'Molecule Shapes (VSEPR)',
    category: 'Chemistry',
    description: 'Explore 3D molecular geometry by adding single, double, or triple bonds and lone pairs to a central atom.',
    url: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html',
  },
  {
    id: 'phet-natural-selection',
    title: 'Natural Selection',
    category: 'Biology',
    description: 'Explore natural selection by controlling the environment and mutating bunnies to witness survival traits.',
    url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html',
  },
  {
    id: 'phet-gene-expression',
    title: 'Gene Expression Essentials',
    category: 'Biology',
    description: 'Examine how transcription and translation work to generate proteins from DNA genes.',
    url: 'https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_en.html',
  },
];

export const StemLabWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StemToolTab>('desmos-graphing');

  // --- Desmos Prompt-to-Graph State ---
  const [graphPrompt, setGraphPrompt] = useState('');
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [generatedEquations, setGeneratedEquations] = useState<DesmosEquation[]>([]);
  const [copiedEqId, setCopiedEqId] = useState<string | null>(null);

  // --- Socratic STEM Sparring State ---
  const [stemProblem, setStemProblem] = useState('');
  const [stemChatHistory, setStemChatHistory] = useState<StemChatTurn[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [isStemThinking, setIsStemThinking] = useState(false);
  const [problemImage, setProblemImage] = useState<string | null>(null);

  // --- Scribble-to-LaTeX State ---
  const [scribbleImage, setScribbleImage] = useState<string | null>(null);
  const [isConvertingScribble, setIsConvertingScribble] = useState(false);
  const [extractedLatex, setExtractedLatex] = useState<{ latex: string; explanation: string } | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);

  // --- PhET State ---
  const [phetCategory, setPhetCategory] = useState<string>('All');
  const [phetSearch, setPhetSearch] = useState<string>('');
  const [activePhetSim, setActivePhetSim] = useState<PhetSimulation | null>(null);

  // Handle Prompt-to-Graph
  const handleGenerateGraph = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graphPrompt.trim()) return;

    setIsGeneratingGraph(true);
    try {
      const eqs = await injectDesmosGraph(graphPrompt.trim());
      setGeneratedEquations(eqs);
    } catch (err) {
      console.error('Prompt to graph failed:', err);
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  const handleCopyEquation = (eq: DesmosEquation) => {
    navigator.clipboard.writeText(eq.latex);
    setCopiedEqId(eq.id);
    setTimeout(() => setCopiedEqId(null), 1800);
  };

  // Handle Socratic STEM Chat
  const handleSendSocraticMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || isStemThinking) return;

    const userMessage = studentInput.trim();
    const updatedHistory: StemChatTurn[] = [
      ...stemChatHistory,
      { role: 'user', text: userMessage },
    ];
    setStemChatHistory(updatedHistory);
    setStudentInput('');
    setIsStemThinking(true);

    try {
      const reply = await socraticStemSpar({
        problemText: stemProblem || userMessage,
        imageBase64: problemImage || undefined,
        history: updatedHistory,
        studentMessage: userMessage,
      });

      setStemChatHistory([
        ...updatedHistory,
        { role: 'model', text: reply },
      ]);
    } catch (err) {
      console.error('Socratic spar error:', err);
    } finally {
      setIsStemThinking(false);
    }
  };

  // Handle Scribble Image Upload
  const handleScribbleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setScribbleImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleConvertScribble = async () => {
    if (!scribbleImage) return;
    setIsConvertingScribble(true);
    setExtractedLatex(null);
    try {
      const res = await scribbleToLatex(scribbleImage);
      setExtractedLatex(res);
    } catch (err) {
      console.error('Scribble conversion failed:', err);
    } finally {
      setIsConvertingScribble(false);
    }
  };

  const filteredSims = PHET_CATALOG.filter((sim) => {
    const matchesCategory = phetCategory === 'All' || sim.category === phetCategory;
    const matchesSearch =
      sim.title.toLowerCase().includes(phetSearch.toLowerCase()) ||
      sim.description.toLowerCase().includes(phetSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top STEM Header & Tool Switcher */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              STEM &amp; Calculation Lab
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Desmos prompt-to-graph, Socratic STEM sparring tutor, Scribble-to-LaTeX &amp; PhET sims
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'desmos-graphing', label: 'Desmos Grapher', icon: Calculator },
            { id: 'socratic-tutor', label: 'Socratic Sparring Tutor', icon: Bot },
            { id: 'scribble-latex', label: 'Scribble-to-LaTeX', icon: FileText },
            { id: 'desmos-scientific', label: 'Scientific Calc', icon: Calculator },
            { id: 'geogebra', label: 'GeoGebra Math', icon: Compass },
            { id: 'phet', label: 'PhET Science Sims', icon: Atom },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StemToolTab)}
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

      {/* 1. Desmos Graphing Calculator with Prompt-to-Graph Injector */}
      {activeTab === 'desmos-graphing' && (
        <div className="space-y-4">
          {/* Prompt-to-Graph Input Bar */}
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97757]" />
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                AI Prompt-to-Graph Injector (Gemini 2.5 Flash)
              </span>
              <span className="text-[10px] text-[#8C897F] ml-auto">
                Translates natural language descriptions into Desmos equations
              </span>
            </div>

            <form onSubmit={handleGenerateGraph} className="flex items-center gap-2">
              <input
                type="text"
                value={graphPrompt}
                onChange={(e) => setGraphPrompt(e.target.value)}
                placeholder="e.g. Dampened sine wave with decay 0.2, or Parabola with vertex at (2,3)..."
                className="flex-1 px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
              <button
                type="submit"
                disabled={isGeneratingGraph || !graphPrompt.trim()}
                className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingGraph ? 'animate-spin' : ''}`} />
                <span>{isGeneratingGraph ? 'Computing...' : 'Generate Equations'}</span>
              </button>
            </form>

            {/* Generated Equations Chips */}
            {generatedEquations.length > 0 && (
              <div className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block">
                  Generated Desmos Equations:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {generatedEquations.map((eq) => (
                    <div
                      key={eq.id}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-mono flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eq.color || '#2d70b3' }} />
                      <span className="text-[#141413] dark:text-[#FAF9F5] font-bold">{eq.latex}</span>
                      <button
                        onClick={() => handleCopyEquation(eq)}
                        className="p-1 hover:text-[#D97757] transition-colors cursor-pointer"
                        title="Copy LaTeX"
                      >
                        {copiedEqId === eq.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <IframeErrorBoundary
            title="Desmos Graphing Calculator"
            src="https://www.desmos.com/calculator"
            className="h-[calc(85vh-230px)] min-h-[520px]"
          />
        </div>
      )}

      {/* 2. Socratic STEM & Homework Sparring Partner */}
      {activeTab === 'socratic-tutor' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col h-[calc(85vh-160px)] min-h-[580px]">
          <div className="pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[#D97757]" />
              <div>
                <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Socratic STEM &amp; Homework Sparring Partner
                </h3>
                <p className="text-[11px] text-[#8C897F]">
                  Refuses to give raw answers. Identifies algebra pitfalls and guides you step-by-step through inquiry.
                </p>
              </div>
            </div>
            {stemChatHistory.length > 0 && (
              <button
                onClick={() => {
                  setStemChatHistory([]);
                  setStemProblem('');
                }}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                Reset Sparring
              </button>
            )}
          </div>

          {/* Initial Problem Setup */}
          {stemChatHistory.length === 0 && (
            <div className="py-6 max-w-xl mx-auto space-y-4">
              <div className="text-center space-y-1">
                <Brain className="w-10 h-10 text-[#D97757] mx-auto opacity-80" />
                <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  What tricky problem are you working on?
                </h4>
                <p className="text-xs text-[#8C897F]">
                  Paste the question text or problem statement below to begin.
                </p>
              </div>

              <textarea
                rows={4}
                value={stemProblem}
                onChange={(e) => setStemProblem(e.target.value)}
                placeholder="e.g. A 2kg block slides down a 30-degree incline with friction coefficient 0.15. Find acceleration..."
                className="w-full p-3 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
              />

              <button
                onClick={() => {
                  if (!stemProblem.trim()) return;
                  setStemChatHistory([
                    { role: 'user', text: `Here is the problem: "${stemProblem}"` },
                  ]);
                  // trigger initial sparring response
                  setIsStemThinking(true);
                  socraticStemSpar({
                    problemText: stemProblem,
                    history: [],
                    studentMessage: stemProblem,
                  }).then((reply) => {
                    setStemChatHistory([
                      { role: 'user', text: `Here is the problem: "${stemProblem}"` },
                      { role: 'model', text: reply },
                    ]);
                    setIsStemThinking(false);
                  });
                }}
                disabled={!stemProblem.trim()}
                className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Begin Socratic Sparring
              </button>
            </div>
          )}

          {/* Active Chat Turns */}
          {stemChatHistory.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1">
              {stemChatHistory.map((turn, i) => (
                <div
                  key={i}
                  className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                      turn.role === 'user'
                        ? 'bg-[#D97757] text-white rounded-br-none'
                        : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#141413] dark:text-[#FAF9F5] rounded-bl-none'
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}
              {isStemThinking && (
                <div className="flex justify-start">
                  <div className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl rounded-bl-none text-xs text-[#8C897F] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97757] animate-spin" />
                    <span>Tutor is formulating a guiding question...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Input */}
          {stemChatHistory.length > 0 && (
            <form onSubmit={handleSendSocraticMessage} className="pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2">
              <input
                type="text"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="Type your hypothesis or work out the next step..."
                className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
              <button
                type="submit"
                disabled={!studentInput.trim() || isStemThinking}
                className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3. Scribble-to-LaTeX Converter */}
      {activeTab === 'scribble-latex' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D97757]" />
              <span>Scribble-to-LaTeX Vision Converter</span>
            </h3>
            <p className="text-xs text-[#8C897F] mt-1">
              Upload a snapshot of your handwritten scratchpad formulas, integrals, or derivations. Gemini extracts and converts them into clean LaTeX.
            </p>
          </div>

          <div className="border-2 border-dashed border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] rounded-2xl p-6 text-center transition-colors">
            <input
              type="file"
              id="scribble-file-input"
              accept="image/png,image/jpeg"
              onChange={handleScribbleUpload}
              className="hidden"
            />
            <label htmlFor="scribble-file-input" className="cursor-pointer block">
              <UploadCloud className="w-8 h-8 text-[#D97757] mx-auto mb-2 opacity-80" />
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block">
                {scribbleImage ? 'Handwritten Image Loaded' : 'Upload photo of handwritten scratch work'}
              </span>
              <span className="text-[10px] text-[#8C897F]">Supports PNG, JPG</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConvertScribble}
              disabled={!scribbleImage || isConvertingScribble}
              className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isConvertingScribble ? 'animate-spin' : ''}`} />
              <span>{isConvertingScribble ? 'Converting...' : 'Extract LaTeX'}</span>
            </button>
          </div>

          {extractedLatex && (
            <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8C897F] uppercase tracking-wider">
                  Extracted LaTeX Formula
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedLatex.latex);
                    setCopiedLatex(true);
                    setTimeout(() => setCopiedLatex(false), 2000);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedLatex ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLatex ? 'Copied' : 'Copy LaTeX'}</span>
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-[#252422] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] font-mono text-xs text-[#141413] dark:text-[#FAF9F5] break-all">
                {extractedLatex.latex}
              </div>

              <p className="text-xs text-[#8C897F]">
                {extractedLatex.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Desmos Scientific Calculator */}
      {activeTab === 'desmos-scientific' && (
        <IframeErrorBoundary
          title="Desmos Scientific Calculator"
          src="https://www.desmos.com/scientific"
          className="h-[calc(85vh-160px)] min-h-[550px]"
        />
      )}

      {/* 5. GeoGebra Math Suite */}
      {activeTab === 'geogebra' && (
        <IframeErrorBoundary
          title="GeoGebra Classic & 3D Math Suite"
          src="https://www.geogebra.org/calculator"
          className="h-[calc(85vh-160px)] min-h-[550px]"
        />
      )}

      {/* 6. PhET Science Simulations Browser */}
      {activeTab === 'phet' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Physics', 'Chemistry', 'Biology'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPhetCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    phetCategory === cat
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phetSearch}
                onChange={(e) => setPhetSearch(e.target.value)}
                placeholder="Search simulations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSims.map((sim) => (
              <div
                key={sim.id}
                className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 flex flex-col justify-between hover:border-[#D97757]/60 transition-colors shadow-xs group"
              >
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300">
                    {sim.category}
                  </span>
                  <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-2 group-hover:text-[#D97757] transition-colors">
                    {sim.title}
                  </h4>
                  <p className="text-[11px] text-[#8C897F] mt-1 line-clamp-3 leading-relaxed">
                    {sim.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                  <button
                    onClick={() => setActivePhetSim(sim)}
                    className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span>Run In-App</span>
                  </button>

                  <a
                    href={sim.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] rounded-lg transition-colors"
                    title="Open in Full Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {activePhetSim && (
            <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden">
                <div className="p-3.5 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B]">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs sm:text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      PhET Simulation: {activePhetSim.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePhetSim(null)}
                      className="p-1 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full h-full relative">
                  <iframe
                    src={activePhetSim.url}
                    title={activePhetSim.title}
                    allow="fullscreen; autoplay; accelerometer; gyroscope"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
