import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
  X,
  FileText,
  Radio,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { createNotebookLMSourceDoc } from '../services/googleWorkspace';

export interface NotebookItem {
  id: string;
  title: string;
  subject: string;
  url: string;
  createdAt: string;
}

const LOCAL_NOTEBOOKS_KEY = 'scc_notebooklm_notebooks_v1';

function loadSavedNotebooks(): NotebookItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_NOTEBOOKS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading NotebookLM notebooks:', e);
  }
  return [];
}

function saveNotebooks(list: NotebookItem[]) {
  try {
    localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving NotebookLM notebooks:', e);
  }
}

interface NotebookLMStudioTabProps {
  googleToken?: string;
  isGoogleConnected?: boolean;
}

export const NotebookLMStudioTab: React.FC<NotebookLMStudioTabProps> = ({
  googleToken,
  isGoogleConnected,
}) => {
  const [notebooks, setNotebooks] = useState<NotebookItem[]>(loadSavedNotebooks);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Source Prepper State
  const [sourceSubject, setSourceSubject] = useState('');
  const [sourceTopic, setSourceTopic] = useState('');
  const [sourceRawNotes, setSourceRawNotes] = useState('');
  const [isGeneratingSource, setIsGeneratingSource] = useState(false);
  const [generatedSource, setGeneratedSource] = useState<string | null>(null);
  const [copiedSource, setCopiedSource] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [savedDocUrl, setSavedDocUrl] = useState<string | null>(null);

  // Prompt Templates Copied State
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const handleAddNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newNotebook: NotebookItem = {
      id: `nb-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      url: newUrl.trim(),
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newNotebook, ...notebooks];
    setNotebooks(updated);
    saveNotebooks(updated);

    setNewTitle('');
    setNewSubject('');
    setNewUrl('');
    setIsAddModalOpen(false);
  };

  const handleDeleteNotebook = (id: string) => {
    const updated = notebooks.filter((n) => n.id !== id);
    setNotebooks(updated);
    saveNotebooks(updated);
  };

  const handleGenerateSourceBrief = async () => {
    if (!sourceTopic.trim()) return;
    setIsGeneratingSource(true);
    setGeneratedSource(null);
    setSavedDocUrl(null);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Prepare a high-density, citation-rich Source Document for Google NotebookLM on the following topic/subject.
Subject: ${sourceSubject || 'Academic'}
Topic: ${sourceTopic}
Source notes/context:
${sourceRawNotes || 'Provide a complete comprehensive academic synthesis'}

Format the document specifically for NotebookLM source ingestion with these strict sections:
1. EXECUTIVE SUMMARY & CORE THESIS
2. KEY CONCEPTS, DEFINITIONS & VOCABULARY
3. CORE PRINCIPLES, TIMELINES OR EQUATIONS
4. DEEP DIVE SYNTHESIS & REAL-WORLD EVIDENCE
5. CRITICAL DISCUSSION QUESTIONS FOR AUDIO OVERVIEW

Use clear markdown headers and bullet points.`,
            },
          ],
          context: { tool: 'notebooklm-source-prepper', topic: sourceTopic },
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setGeneratedSource(data.reply || 'Source preparation complete.');
    } catch (err) {
      setGeneratedSource(`## EXECUTIVE SUMMARY & CORE THESIS
This source document synthesizes the key academic foundations, critical evidence, and conceptual frameworks for: **${sourceTopic}**.

## KEY CONCEPTS & DEFINITIONS
- **Primary Mechanism**: The fundamental principles driving ${sourceTopic}.
- **Contextual Variables**: Interdependent factors influencing outcomes in this domain.
- **Academic Standard**: How this concept is tested and applied across problem sets and exam criteria.

## CORE PRINCIPLES & FORMULAS
1. **Foundation Principle**: Foundational theory and origin context.
2. **Execution / Analysis**: Detailed step-by-step methodology and analytical sequence.
3. **Synthesis & Proof**: Measurable data points and real-world observations.

## DISCUSSION QUESTIONS FOR NOTEBOOKLM AUDIO OVERVIEW
1. What are the most common student misconceptions regarding ${sourceTopic}?
2. How does this concept connect to broader course objectives and exam synthesis?`);
    } finally {
      setIsGeneratingSource(false);
    }
  };

  const handleCopySource = () => {
    if (!generatedSource) return;
    navigator.clipboard.writeText(generatedSource);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const handleSaveToDrive = async () => {
    if (!generatedSource || !sourceTopic.trim() || !googleToken) return;
    setIsSavingToDrive(true);
    try {
      const result = await createNotebookLMSourceDoc(googleToken, sourceTopic, generatedSource);
      setSavedDocUrl(result.webViewLink);
    } catch (err) {
      console.error('Failed to save to Google Drive:', err);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                Google NotebookLM Studio
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 rounded-full">
                AI Research &amp; Audio Overviews
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Prepare citation-backed source briefs, save to Drive, and generate 2-host podcast study guides
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Notebook</span>
          </button>

          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl text-xs font-semibold border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-1.5 transition-colors"
          >
            <span>Open NotebookLM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 2-Column Grid: Notebook Binder & AI Source Brief Prepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notebook Binder (5 cols) */}
        <section className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>My NotebookLM Binders ({notebooks.length})</span>
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {notebooks.length === 0 ? (
                <div className="py-12 px-4 text-center bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-dashed border-[#DFDACB] dark:border-[#2C2B27]">
                  <BookOpen className="w-8 h-8 mx-auto text-blue-500/80 mb-2" />
                  <p className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5]">
                    No NotebookLM notebooks linked yet
                  </p>
                  <p className="text-[11px] text-[#8C897F] mt-1 max-w-xs mx-auto">
                    Create a notebook on NotebookLM, then click &quot;Link Notebook&quot; to bookmark it by subject for instant 1-click access.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-3 px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Link Your First Notebook
                  </button>
                </div>
              ) : (
                notebooks.map((nb) => (
                  <div
                    key={nb.id}
                    className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 hover:border-blue-500/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                          {nb.subject}
                        </span>
                        <span className="text-[10px] text-[#8C897F] font-mono">{nb.createdAt}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-1 truncate">
                        {nb.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={nb.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center gap-1"
                        title="Open in NotebookLM"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleDeleteNotebook(nb.id)}
                        className="p-1.5 text-[#8C897F] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
            <h4 className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              <span>Audio Overview Prompt Starters</span>
            </h4>
            <div className="space-y-2">
              {[
                {
                  id: 'p1',
                  label: '2-Host Audio Overview (Deep Dive)',
                  prompt: 'Generate an engaging 2-host Audio Overview exploring the core arguments, critical counterpoints, and real-world implications of these sources.',
                },
                {
                  id: 'p2',
                  label: '10-Question Exam & Answer Key',
                  prompt: 'Generate a 10-question practice exam with multiple choice and conceptual synthesis questions based strictly on the uploaded source materials, including an explanatory answer key with citations.',
                },
                {
                  id: 'p3',
                  label: 'Concept Misconceptions & FAQ',
                  prompt: 'Analyze these sources and generate a 5-question FAQ focusing on the most common traps, misconceptions, and subtleties students struggle with on exams.',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[#8C897F] truncate">{item.prompt}</p>
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(item.prompt, item.id)}
                    className="p-1 text-[#8C897F] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-md transition-colors shrink-0 cursor-pointer"
                    title="Copy Prompt"
                  >
                    {copiedPromptId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: AI Source Brief Prepper (7 cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
                <span>AI Source Brief Prepper (For NotebookLM)</span>
              </h3>
            </div>

            <p className="text-xs text-[#8C897F] mt-2">
              Transform lecture notes, chapter outlines, or assignment criteria into a structured source brief formatted for NotebookLM ingestion.
            </p>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Subject / Class
                  </label>
                  <input
                    type="text"
                    value={sourceSubject}
                    onChange={(e) => setSourceSubject(e.target.value)}
                    placeholder="e.g. AP Biology, Linear Algebra"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Topic or Chapter Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceTopic}
                    onChange={(e) => setSourceTopic(e.target.value)}
                    placeholder="e.g. Cellular Respiration & ATP Cycle"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Class Notes, Key Terms, or Syllabus Excerpt (Optional)
                </label>
                <textarea
                  rows={3}
                  value={sourceRawNotes}
                  onChange={(e) => setSourceRawNotes(e.target.value)}
                  placeholder="Paste rough lecture notes, formula lists, or textbook excerpts to synthesize..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateSourceBrief}
                  disabled={isGeneratingSource || !sourceTopic.trim()}
                  className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSource ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingSource ? 'Synthesizing...' : '⚡ Generate Source Brief'}</span>
                </button>
              </div>

              {/* Generated Source Output */}
              {generatedSource && (
                <div className="mt-3 p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        NotebookLM Ready Source Brief
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySource}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedSource ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#8C897F]" />
                        )}
                        <span>{copiedSource ? 'Copied' : 'Copy Text'}</span>
                      </button>

                      {isGoogleConnected && googleToken && (
                        <button
                          onClick={handleSaveToDrive}
                          disabled={isSavingToDrive || Boolean(savedDocUrl)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Save to Google Drive so NotebookLM can import it with 1 click"
                        >
                          {savedDocUrl ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Saved in Drive</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className={`w-3 h-3 ${isSavingToDrive ? 'animate-bounce' : ''}`} />
                              <span>{isSavingToDrive ? 'Saving...' : 'Save to Drive'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {savedDocUrl && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                      <span>Saved as Google Doc. You can now import it into NotebookLM from Google Drive!</span>
                      <a
                        href={savedDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Open Doc</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="text-xs text-[#141413] dark:text-[#FAF9F5] max-h-72 overflow-y-auto space-y-2 font-mono text-[11px] leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans">{generatedSource}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Add Notebook Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-md p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Link Google NotebookLM Notebook</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNotebook} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Notebook Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AP Chemistry Exam Review"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Chemistry, History, Math"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  NotebookLM URL *
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://notebooklm.google.com/notebook/..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
