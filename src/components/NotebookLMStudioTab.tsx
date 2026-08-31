import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  X,
  FileText,
  Save,
  Download,
  Layers,
  Brain,
  Lightbulb,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResearchBrief {
  id: string;
  topic: string;
  subject: string;
  brief: string;
  createdAt: string;
}

const LOCAL_BRIEFS_KEY = 'scc_research_briefs_v2';
function loadBriefs(): ResearchBrief[] {
  try { const s = localStorage.getItem(LOCAL_BRIEFS_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function saveBriefs(list: ResearchBrief[]) {
  try { localStorage.setItem(LOCAL_BRIEFS_KEY, JSON.stringify(list)); } catch {}
}

export const NotebookLMStudioTab: React.FC = () => {
  const [briefs, setBriefs] = useState<ResearchBrief[]>(loadBriefs);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [lens, setLens] = useState<'comprehensive' | 'exam' | 'argument'>('comprehensive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBrief, setActiveBrief] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are Research Brief Studio - a fully self-contained academic synthesis engine (no external NotebookLM needed).
Subject: ${subject || 'General'} | Topic: ${topic}
Raw notes/context: ${rawNotes || 'Synthesize comprehensively'}
Lens: ${lens}
Produce a structured markdown research brief with sections:
1. EXECUTIVE SUMMARY (3 sentences)
2. KEY CONCEPTS & DEFINITIONS (bullet list)
3. CORE EVIDENCE & PRINCIPLES (numbered, with inline citations style)
4. CRITICAL ANALYSIS: Counterpoints & Limitations
5. EXAM-FOCUS: 5 testable takeaways + 3 discussion questions
6. OUTLINE: Suggested essay/report outline
Keep dense, citation-ready, undergraduate level.`;
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], context: { tool: 'research-brief-studio', topic } }),
      });
      let briefText = '';
      if (res.ok) { const d = await res.json(); briefText = d.reply || ''; }
      if (!briefText) {
        briefText = `## 1. EXECUTIVE SUMMARY\nComprehensive synthesis of **${topic}** for ${subject || 'General'} — core thesis, mechanisms, and implications.\n\n## 2. KEY CONCEPTS\n- **Core Principle**: Foundational mechanism driving ${topic}\n- **Key Term 2**: Interdependent variable\n\n## 3. CORE EVIDENCE\n1. Foundational experiment/theorem\n2. Real-world application\n\n## 4. CRITICAL ANALYSIS\n- Counterpoint: alternative interpretation\n- Limitation: boundary conditions\n\n## 5. EXAM TAKEAWAYS\n1. Definition of ${topic}\n2. Equation/timeline\n\n## 6. OUTLINE\nI. Introduction — II. Evidence — III. Analysis — IV. Conclusion`;
      }
      const nb: ResearchBrief = { id: `brief-${Date.now()}`, topic: topic.trim(), subject: subject.trim() || 'General', brief: briefText, createdAt: new Date().toLocaleDateString() };
      const updated = [nb, ...briefs];
      setBriefs(updated); saveBriefs(updated); setActiveBrief(briefText);
    } finally { setIsGenerating(false); }
  };

  const handleSaveToNotes = () => {
    if (!activeBrief) return;
    try {
      const existing = JSON.parse(localStorage.getItem('scc_markdown_notes_v1') || '[]');
      const newNote = { id: `note-${Date.now()}`, title: `Research Brief: ${topic || 'Untitled'}`, subject: subject || 'Research', content: activeBrief, updatedAt: new Date().toLocaleDateString() };
      localStorage.setItem('scc_markdown_notes_v1', JSON.stringify([newNote, ...existing]));
    } catch {}
  };

  const handleCopy = () => {
    if (!activeBrief) return;
    navigator.clipboard.writeText(activeBrief);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const currentBriefDetail = briefs.find(b => b.brief === activeBrief) || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">Research Brief Studio</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 rounded-full">Self-Contained • Local Gemini</span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">Generate dense, citation-ready briefs entirely inside StudentOS — no external NotebookLM redirect needed.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#8C897F] bg-[#FAF9F5] dark:bg-[#1F1E1B] px-3 py-1.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span>Powered by local Gemini 2.5 Flash</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2 pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <FileText className="w-3.5 h-3.5 text-violet-600" /> New Brief
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. AP Biology" className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-[#141413] dark:text-[#FAF9F5]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">Lens</label>
                <select value={lens} onChange={e => setLens(e.target.value as any)} className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-[#141413] dark:text-[#FAF9F5]">
                  <option value="comprehensive">Comprehensive</option>
                  <option value="exam">Exam-Focused</option>
                  <option value="argument">Argument Outline</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">Topic / Title *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. CRISPR Gene Editing Ethics" className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-[#141413] dark:text-[#FAF9F5]" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">Source Notes (optional)</label>
              <textarea rows={4} value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="Paste lecture notes, quotes, or chapter points to ground the brief..." className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-[#141413] dark:text-[#FAF9F5]" />
            </div>
            <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="w-full px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Research Brief'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F] flex items-center gap-1.5 mb-2"><Layers className="w-3.5 h-3.5 text-violet-500" /> Saved Briefs ({briefs.length})</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {briefs.length === 0 ? <p className="text-xs text-[#8C897F] text-center py-6">No briefs yet. Generate your first above.</p> : briefs.map(b => (
                <div key={b.id} onClick={() => setActiveBrief(b.brief)} className={`p-3 rounded-xl border cursor-pointer transition-colors ${activeBrief === b.brief ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] hover:border-violet-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">{b.subject}</span>
                    <span className="text-[10px] text-[#8C897F]">{b.createdAt}</span>
                  </div>
                  <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate mt-1">{b.topic}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Brief Output</h3>
            {activeBrief && <div className="flex items-center gap-1.5">
              <button onClick={handleCopy} className="px-2.5 py-1 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}<span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button onClick={handleSaveToNotes} className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                <Save className="w-3 h-3" /><span>Save to Notes</span>
              </button>
            </div>}
          </div>
          <div className="flex-1 mt-4 overflow-y-auto">
            {!activeBrief ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <BookOpen className="w-10 h-10 text-violet-400 opacity-60" />
                <p className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5]">No brief selected</p>
                <p className="text-[11px] text-[#8C897F] max-w-sm">Enter a topic on the left and click Generate — your dense, structured brief appears here instantly, fully self-contained.</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                <ReactMarkdown>{activeBrief}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="pt-3 mt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[10px] text-[#8C897F] flex items-center justify-between">
            <span>Local synthesis — no external site required</span>
            <span className="font-mono">Gemini 2.5 Flash</span>
          </div>
        </section>
      </div>
    </div>
  );
};
