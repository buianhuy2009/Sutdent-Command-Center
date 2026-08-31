import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  UploadCloud,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import katex from 'katex';

interface LatexFile {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_HOMEWORK_TEX = `\\documentclass[12pt]{article}
\\usepackage{amsmath, amssymb, graphicx}

\\title{Physics 201: Quantum Mechanics Problem Set 4}
\\author{Alex Johnson (Student ID: 884920)}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
This document contains solutions to Problem Set 4 covering the one-dimensional infinite potential well, harmonic oscillator wavefunctions, and operator expectation values.
\\end{abstract}

\\section{Problem 1: Particle in a 1D Box}
Consider an electron of mass $m$ confined to an infinite potential well of width $L$ defined by:
\\begin{equation}
V(x) = \\begin{cases} 0 & 0 \\le x \\le L \\\\ \\infty & \\text{otherwise} \\end{cases}
\\end{equation}

\\subsection{Wavefunction Derivation}
The time-independent Schr\\\"odinger equation inside the well reduces to:
$$-\\frac{\\hbar^2}{2m} \\frac{d^2 \\psi}{dx^2} = E \\psi$$

Solving with boundary conditions $\\psi(0) = 0$ and $\\psi(L) = 0$ yields the normalized eigenstates:
$$\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n\\pi x}{L}\\right)$$

And corresponding discrete energy levels:
$$E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2m L^2}, \\quad n = 1, 2, 3, \\dots$$

\\section{Problem 2: Expectation Value of Momentum}
We compute the expectation value $\\langle p \\rangle$ for the ground state $n=1$:
$$\\langle p \\rangle = \\int_0^L \\psi_1^*(x) \\left(-i\\hbar \\frac{d}{dx}\\right) \\psi_1(x) \\, dx = 0$$

\\subsection{Conclusion}
The average momentum is zero because the particle moves equally in both the positive and negative $x$-directions, forming a standing wave.

\\end{document}`;

const TEMPLATES: Record<string, string> = {
  'homework': DEFAULT_HOMEWORK_TEX,
  'paper': `\\documentclass[10pt, journal]{IEEEtran}
\\title{Deep Residual Neural Architectures for Multimodal Academic Workspaces}
\\author{StudentOS Research Laboratory}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
We present a unified desktop operating system architecture that eliminates context switching across disparate academic tools.
\\end{abstract}

\\section{Introduction}
Modern students utilize over 12 distinct web applications daily. This paper details the performance benchmarks of unified cognitive workspaces.

\\section{Mathematical Formulation}
Let $T$ denote the total task completion latency:
$$T = \\sum_{i=1}^N (t_{\\text{focus}, i} + \\delta_{\\text{switch}, i})$$
By minimizing $\\delta_{\\text{switch}} \\to 0$, cognitive flow is preserved.

\\end{document}`,
  'lab': `\\documentclass[11pt]{article}
\\title{Chemistry 102 Lab Report: Acid-Base Titration Kinetics}
\\author{Lab Partner: Sarah Chen \\\\ Date: \\today}

\\begin{document}
\\maketitle

\\section{Objective}
To determine the exact molarity of an unknown sodium hydroxide ($NaOH$) solution using potassium hydrogen phthalate ($KHP$) as a primary standard.

\\section{Calculations}
The neutralization reaction is:
$$KHC_8H_4O_4 + NaOH \\to KNaC_8H_4O_4 + H_2O$$

At the stoichiometric equivalence point:
$$M_{NaOH} = \\frac{m_{KHP}}{MW_{KHP} \\cdot V_{NaOH}}$$

\\end{document}`
};

export const OverleafWorkspace: React.FC = () => {
  const [files, setFiles] = useState<LatexFile[]>(() => {
    try {
      const saved = localStorage.getItem('scc_latex_files_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'f1', name: 'main.tex', content: DEFAULT_HOMEWORK_TEX },
      { id: 'f2', name: 'references.bib', content: '@article{einstein1905,\n  author = {Einstein, Albert},\n  title = {Zur Elektrodynamik bewegter Körper},\n  journal = {Annalen der Physik},\n  year = {1905}\n}' },
    ];
  });

  const [activeFileId, setActiveFileId] = useState<string>('f1');
  const [copied, setCopied] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleUpdateContent = (newContent: string) => {
    const updated = files.map((f) => (f.id === activeFile.id ? { ...f, content: newContent } : f));
    setFiles(updated);
    try {
      localStorage.setItem('scc_latex_files_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleLoadTemplate = (key: string) => {
    if (TEMPLATES[key]) {
      handleUpdateContent(TEMPLATES[key]);
    }
  };

  const handleAddFile = () => {
    const fileName = prompt('Enter new file name (e.g. lab_report.tex):', 'document.tex');
    if (!fileName) return;
    const newFile: LatexFile = {
      id: `f-${Date.now()}`,
      name: fileName.endsWith('.tex') || fileName.endsWith('.bib') ? fileName : `${fileName}.tex`,
      content: '% New LaTeX Document\n\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}',
    };
    const updated = [...files, newFile];
    setFiles(updated);
    setActiveFileId(newFile.id);
    try {
      localStorage.setItem('scc_latex_files_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    setActiveFileId(updated[0].id);
    try {
      localStorage.setItem('scc_latex_files_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleDownloadTex = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Live in-browser LaTeX Compiler & KaTeX Renderer
  useEffect(() => {
    if (!activeFile.name.endsWith('.tex')) {
      setPreviewHtml(`<pre class="p-6 font-mono text-xs">${activeFile.content}</pre>`);
      return;
    }

    try {
      let code = activeFile.content;

      // Extract Title, Author, Date
      const titleMatch = code.match(/\\title\{([^}]+)\}/);
      const authorMatch = code.match(/\\author\{([^}]+)\}/);
      const dateMatch = code.match(/\\date\{([^}]+)\}/);

      const title = titleMatch ? titleMatch[1].replace(/\\\\/g, '<br/>') : '';
      const author = authorMatch ? authorMatch[1].replace(/\\\\/g, '<br/>') : '';
      const date = dateMatch ? (dateMatch[1] === '\\today' ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : dateMatch[1]) : '';

      // Strip preamble and end document
      const docStart = code.indexOf('\\begin{document}');
      if (docStart !== -1) {
        code = code.slice(docStart + 16);
      }
      const docEnd = code.indexOf('\\end{document}');
      if (docEnd !== -1) {
        code = code.slice(0, docEnd);
      }

      // Render Display Math ($$...$$ and \begin{equation}...\end{equation})
      code = code.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return `<div class="my-4 text-center overflow-x-auto">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="my-4 text-center font-mono text-xs text-rose-600">${math}</div>`;
        }
      });

      code = code.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, (_, math) => {
        try {
          return `<div class="my-4 text-center overflow-x-auto">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="my-4 text-center font-mono text-xs text-rose-600">${math}</div>`;
        }
      });

      // Render Inline Math ($...$)
      code = code.replace(/\$([^\$\n]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="font-mono text-xs text-rose-600">${math}</span>`;
        }
      });

      // Render Headings
      code = code.replace(/\\maketitle/g, `
        <div class="text-center pb-6 mb-6 border-b border-[#DFDACB]/60">
          <h1 class="text-xl font-extrabold text-[#141413] leading-snug">${title}</h1>
          <div class="text-xs text-[#5C5A54] mt-2 font-medium">${author}</div>
          <div class="text-[11px] text-[#8C897F] mt-1">${date}</div>
        </div>
      `);

      code = code.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, abs) => `
        <div class="px-6 py-4 my-4 bg-stone-50 border-l-4 border-[#D97757] rounded-r-xl text-xs text-[#5C5A54] italic leading-relaxed">
          <strong class="text-[#141413] block not-italic uppercase tracking-wider text-[10px] mb-1">Abstract</strong>
          ${abs.trim()}
        </div>
      `);

      code = code.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-base font-bold text-[#141413] mt-6 mb-2 pb-1 border-b border-stone-200">$1</h2>');
      code = code.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-sm font-bold text-[#141413] mt-4 mb-1.5">$1</h3>');
      code = code.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-xs font-bold text-[#141413] mt-3 mb-1">$1</h4>');

      // Paragraphs & Line Breaks
      const paragraphs = code.split(/\n\s*\n/).map((p) => {
        if (p.startsWith('<h') || p.startsWith('<div') || p.trim().length === 0) return p;
        return `<p class="text-xs text-[#2D2A26] leading-relaxed mb-3">${p.trim()}</p>`;
      }).join('\n');

      setPreviewHtml(paragraphs);
    } catch (err) {
      setPreviewHtml(`<div class="p-6 text-xs text-rose-600">Error compiling preview: ${String(err)}</div>`);
    }
  }, [activeFile.content, activeFile.name]);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Top Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-serif font-extrabold text-lg">
            TX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Overleaf LaTeX Document Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live In-Browser Compiler &amp; Preview
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live KaTeX math compilation, multi-file workspace &amp; 1-click PDF export
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Template Selector */}
          <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1 rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
            <button
              onClick={() => handleLoadTemplate('homework')}
              className="px-2.5 py-1 text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] transition-colors rounded-xl cursor-pointer"
            >
              Homework
            </button>
            <button
              onClick={() => handleLoadTemplate('paper')}
              className="px-2.5 py-1 text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] transition-colors rounded-xl cursor-pointer"
            >
              IEEE Paper
            </button>
            <button
              onClick={() => handleLoadTemplate('lab')}
              className="px-2.5 py-1 text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] transition-colors rounded-xl cursor-pointer"
            >
              Lab Report
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownloadTex}
            className="px-3.5 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Save .tex</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. File Tabs & Split Editor / Preview */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs space-y-4">
        
        {/* File Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {files.map((file) => {
              const isActive = file.id === activeFile.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#FAF9F5] dark:bg-[#252422] text-[#D97757] border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xs'
                      : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{file.name}</span>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      className="hover:text-rose-500 transition-colors p-0.5 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddFile}
              className="p-1.5 text-[#8C897F] hover:text-[#D97757] hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
              title="Add New File"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#8C897F] font-mono">
            <span>{activeFile.content.split('\n').length} lines</span>
            <span>•</span>
            <span>{activeFile.content.length} chars</span>
          </div>
        </div>

        {/* 2-Pane Split: Editor & Live Document Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          
          {/* Left: Code Editor */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D97757]" />
                <span>LaTeX Source ({activeFile.name})</span>
              </span>
            </div>

            <textarea
              value={activeFile.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              className="flex-1 w-full p-4 font-mono text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
              rows={24}
              spellCheck={false}
            />
          </div>

          {/* Right: Live Compiled Document Preview */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8C897F]">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compiled Document &amp; PDF View</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Live KaTeX Engine
              </span>
            </div>

            {/* Document Paper Container */}
            <div
              ref={previewRef}
              className="flex-1 w-full p-8 bg-white border border-[#DFDACB] rounded-2xl shadow-sm overflow-y-auto max-h-[600px] text-black select-text"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>

        </div>

      </div>

    </div>
  );
};
