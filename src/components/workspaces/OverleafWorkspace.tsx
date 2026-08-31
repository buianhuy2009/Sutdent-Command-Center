import React, { useState } from 'react';
import {
  FileCode,
  ExternalLink,
  Copy,
  Check,
  Download,
  BookOpen,
  Sparkles,
  Zap,
} from 'lucide-react';

const LATEX_TEMPLATES = [
  {
    id: 'homework',
    title: 'Homework & Problem Set',
    desc: 'Clean math & science problem solution format with theorem blocks and equation alignment.',
    code: `\\documentclass[12pt]{article}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{Math 201: Homework Assignment \\#3}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Problem 1}
Prove that $\\sqrt{2}$ is irrational.

\\begin{proof}
Suppose for contradiction that $\\sqrt{2} = \\frac{a}{b}$ where $\\gcd(a,b) = 1$.
Then $2b^2 = a^2$, which implies $a$ is even. Let $a = 2k$.
Then $2b^2 = 4k^2 \\implies b^2 = 2k^2$, so $b$ is also even.
This contradicts $\\gcd(a,b) = 1$. Thus, $\\sqrt{2}$ is irrational.
\\end{proof}

\\end{document}`,
  },
  {
    id: 'ieee',
    title: 'IEEE Research Paper',
    desc: 'Two-column standard IEEE format for computer science, engineering, and physics manuscripts.',
    code: `\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}

\\begin{document}
\\title{Deep Learning Architectures for Academic Synthesis}
\\author{\\IEEEauthorblockN{Your Name}
\\IEEEauthorblockA{\\textit{Department of Computer Science} \\\\
\\textit{University Name}\\\\
Email: student@university.edu}}

\\maketitle

\\begin{abstract}
This paper presents an empirical analysis of multi-modal attention networks in structured knowledge retrieval.
\\end{abstract}

\\section{Introduction}
Recent developments in transformer architectures have revolutionized autonomous task orchestration.

\\bibliographystyle{IEEEtran}
\\end{document}`,
  },
  {
    id: 'lab-report',
    title: 'Science Lab Report',
    desc: 'Structured physics/chemistry lab report with Abstract, Methodology, Data Table, and Error Analysis.',
    code: `\\documentclass[11pt]{article}
\\usepackage{amsmath, graphicx, booktabs}
\\title{Physics Lab: Measurement of Gravitational Acceleration}
\\author{Lab Partner 1, Lab Partner 2}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Objective}
To determine $g$ using a simple pendulum and photogate timing system.

\\section{Data and Results}
The period $T = 2\\pi \\sqrt{\\frac{L}{g}}$ yields experimental $g = 9.81 \\pm 0.05\\text{ m/s}^2$.

\\end{document}`,
  },
];

export const OverleafWorkspace: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState('homework');
  const [latexCode, setLatexCode] = useState(LATEX_TEMPLATES[0].code);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = LATEX_TEMPLATES.find((t) => t.id === id);
    if (tmpl) setLatexCode(tmpl.code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([latexCode], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplateId}_document.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Overleaf &amp; LaTeX Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Typesetting
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Rapid LaTeX templates, math document compiler bridge, and cloud Overleaf launcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Code!' : 'Copy LaTeX'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download .tex file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </button>

          <a
            href="https://www.overleaf.com/project"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Open Overleaf</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Template Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LATEX_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelectTemplate(tmpl.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
              selectedTemplateId === tmpl.id
                ? 'bg-white dark:bg-[#1A1917] border-[#D97757] shadow-xs'
                : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:border-[#D97757]/60'
            }`}
          >
            <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
              {tmpl.title}
            </h3>
            <p className="text-[11px] text-[#8C897F] line-clamp-2 leading-relaxed">
              {tmpl.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Code Editor */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
            LaTeX Source Code (.tex)
          </span>
          <span className="text-[11px] font-mono text-[#8C897F]">UTF-8 • Standard LaTeX2e</span>
        </div>

        <textarea
          rows={16}
          value={latexCode}
          onChange={(e) => setLatexCode(e.target.value)}
          className="w-full p-4 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] leading-relaxed resize-none"
        />
      </div>
    </div>
  );
};
