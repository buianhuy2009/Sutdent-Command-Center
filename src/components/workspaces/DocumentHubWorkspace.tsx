import React, { useState, useMemo } from 'react';
import {
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code,
  ListOrdered,
  Heading,
  CheckSquare,
  Sparkles,
  Layers,
  Scale,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  BookOpen,
  Brain,
  MessageSquare,
  Send,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleDriveTab } from '../GoogleDriveTab';
import { createFormattedAssignmentDoc } from '../../services/googleWorkspace';
import {
  socraticRubricPreCheck,
  feynmanSimplify,
  feynmanExplainThreeTiers,
  analyzeEssayDraft,
  EssayAnalysisResult,
  socraticTutorStep,
  SocraticTurn,
} from '../../services/gemini';
import { MarkdownNote, SchoolFile, RubricPreCheckResult, ThreeTierFeynmanResult } from '../../types';
import { loadBibliography, saveBibliography, toBibTeX, toAPA, toMLA, BibEntry } from '../../services/bibliography';

type DocHubTab = 'notes' | 'essay-proof' | 'socratic' | 'rubric' | 'feynman' | 'drive' | 'generator' | 'bibliography';

const LOCAL_NOTES_KEY = 'scc_markdown_notes_v1';

function loadSavedNotes(): MarkdownNote[] {
  try {
    const saved = localStorage.getItem(LOCAL_NOTES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading markdown notes:', e);
  }
  return [
    {
      id: 'note-welcome',
      title: 'Academic Notes & Formulas Guide',
      subject: 'General',
      content: `# Academic Markdown & LaTeX Guide

Use this note-taker for quick lecture captures, synthesis, and equations.

### 1. Key Definitions
- **Linear Algebra**: Study of vector spaces and linear mappings.
- **Thermodynamics**: Principles governing heat and work energy conversion.

### 2. Equations & Formulas
\`\`\`math
E = mc^2
F = G * (m1 * m2) / r^2
\`\`\`

### 3. Study Checkpoints
- [x] Review lecture slides
- [ ] Complete problem set derivations
- [ ] Self-test on Flashcard Studio
`,
      updatedAt: new Date().toLocaleDateString(),
    },
  ];
}

function saveNotes(notes: MarkdownNote[]) {
  try {
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving markdown notes:', e);
  }
}

interface DocumentHubWorkspaceProps {
  recentFiles: SchoolFile[];
  isLoadingFiles: boolean;
  onRefreshFiles: () => void;
  isGoogleConnected: boolean;
  googleToken?: string;
}

export const DocumentHubWorkspace: React.FC<DocumentHubWorkspaceProps> = ({
  recentFiles,
  isLoadingFiles,
  onRefreshFiles,
  isGoogleConnected,
  googleToken,
}) => {
  const [activeTab, setActiveTab] = useState<DocHubTab>('notes');
  const [notes, setNotes] = useState<MarkdownNote[]>(loadSavedNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const saved = loadSavedNotes();
    return saved.length > 0 ? saved[0].id : '';
  });

  const [copiedNote, setCopiedNote] = useState(false);

  // --- Rubric Pre-Checker State ---
  const [essayDraft, setEssayDraft] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [isEvaluatingRubric, setIsEvaluatingRubric] = useState(false);
  const [rubricResult, setRubricResult] = useState<RubricPreCheckResult | null>(null);

  // --- Feynman Simplifier State ---
  const [denseConcept, setDenseConcept] = useState('');
  const [isSimplifyingFeynman, setIsSimplifyingFeynman] = useState(false);
  const [feynmanResult, setFeynmanResult] = useState<{
    coreIdea: string;
    simplified: string;
    analogy: string;
  } | null>(null);
  const [threeTierResult, setThreeTierResult] = useState<ThreeTierFeynmanResult | null>(null);
  const [selectedFeynmanTier, setSelectedFeynmanTier] = useState<'eli5' | 'highschool' | 'undergrad'>('highschool');

  // --- 1-Click Doc Generator State ---
  const [docTitle, setDocTitle] = useState('');
  const [docSubject, setDocSubject] = useState('');
  const [docRubric, setDocRubric] = useState('');
  const [docStyle, setDocStyle] = useState<'MLA' | 'APA' | 'Academic Standard'>('Academic Standard');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);
  const [docMessage, setDocMessage] = useState<string | null>(null);

  // --- Essay Proofreader State ---
  const [essayToProof, setEssayToProof] = useState('');
  const [essayPromptContext, setEssayPromptContext] = useState('');
  const [isAnalyzingEssay, setIsAnalyzingEssay] = useState(false);
  const [essayAnalysisResult, setEssayAnalysisResult] = useState<EssayAnalysisResult | null>(null);

  // --- Socratic Tutor State ---
  const [socraticTopic, setSocraticTopic] = useState('');
  const [socraticInput, setSocraticInput] = useState('');
  const [socraticHistory, setSocraticHistory] = useState<SocraticTurn[]>([]);
  const [isSocraticThinking, setIsSocraticThinking] = useState(false);

  // --- Bibliography State ---
  const [bibEntries, setBibEntries] = useState<BibEntry[]>(loadBibliography);
  const [bibCopied, setBibCopied] = useState<string|null>(null);

  const [notesSubjectFilter, setNotesSubjectFilter] = useState<string>('ALL');
  const groupedNotes = useMemo(() => {
    const groups: Record<string, typeof notes> = {};
    notes.forEach(n => {
      const subj = n.subject || 'General';
      if (notesSubjectFilter !== 'ALL' && subj !== notesSubjectFilter) return;
      if (!groups[subj]) groups[subj] = [];
      groups[subj].push(n);
    });
    return groups;
  }, [notes, notesSubjectFilter]);
  const uniqueSubjects = useMemo(() => ['ALL', ...Array.from(new Set(notes.map(n => n.subject || 'General')))], [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const noteWordCount = useMemo(() => {
    if (!activeNote?.content) return 0;
    return activeNote.content.trim().split(/\s+/).filter(Boolean).length;
  }, [activeNote]);

  const noteCharCount = useMemo(() => {
    return activeNote?.content?.length || 0;
  }, [activeNote]);

  const noteReadingTime = useMemo(() => {
    return Math.max(1, Math.ceil(noteWordCount / 200));
  }, [noteWordCount]);

  const handleUpdateActiveNote = (updates: Partial<MarkdownNote>) => {
    const updated = notes.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          ...updates,
          updatedAt: new Date().toLocaleDateString(),
        };
      }
      return n;
    });
    setNotes(updated);
    saveNotes(updated);
  };

  const handleCreateNote = () => {
    const newNote: MarkdownNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Lecture Note',
      subject: 'General',
      content: '# Untitled Note\n\nBegin typing notes...',
      updatedAt: new Date().toLocaleDateString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) return;
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (activeNoteId === id) {
      setActiveNoteId(updated[0].id);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDownloadNote = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInsertCornellTemplate = () => {
    if (!activeNote) return;
    const cornellMarkdown = `# ${activeNote.title || 'Cornell Lecture Notes'}

## Cornell Notes Framework
**Date:** ${new Date().toLocaleDateString()} | **Course:** ${activeNote.subject || 'General'}

---

### Cues & Key Concepts (Left Column)
- **Key Term 1:** [Definition or core question]
- **Key Formula:** [Equation / Law / Theorem]
- **Exam Notice:** [Crucial concept likely on tests]

---

### Detailed Lecture Notes (Main Column)
1. **Primary Concept Explanation**:
   - Detailed derivation and mechanisms
   - Sub-points and proof steps
2. **Worked Examples**:
   - Step 1: Given variables
   - Step 2: Applied theorem
   - Step 3: Final evaluated output

---

### Summary & Synthesis (Bottom Box)
> [!NOTE]
> *Briefly summarize the entire lecture in 2-3 sentences. Focus on big-picture takeaways and practical applications.*
`;
    handleUpdateActiveNote({ content: cornellMarkdown });
  };

  const handlePrintNote = () => {
    window.print();
  };

  // Run Rubric Evaluation
  const handlePreCheckRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayDraft.trim() || !rubricText.trim() || isEvaluatingRubric) return;

    setIsEvaluatingRubric(true);
    setRubricResult(null);
    try {
      const res = await socraticRubricPreCheck({
        draftText: essayDraft.trim(),
        rubricText: rubricText.trim(),
      });
      setRubricResult(res);
    } catch (err) {
      console.error('Rubric evaluation failed:', err);
    } finally {
      setIsEvaluatingRubric(false);
    }
  };

  // Run Feynman Simplifier
  const handleFeynmanSimplify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denseConcept.trim() || isSimplifyingFeynman) return;

    setIsSimplifyingFeynman(true);
    setFeynmanResult(null);
    setThreeTierResult(null);
    try {
      const [res, threeTier] = await Promise.all([
        feynmanSimplify(denseConcept.trim()),
        feynmanExplainThreeTiers(denseConcept.trim()),
      ]);
      setFeynmanResult(res);
      setThreeTierResult(threeTier);
    } catch (err) {
      console.error('Feynman simplification failed:', err);
    } finally {
      setIsSimplifyingFeynman(false);
    }
  };

  // Run Google Doc Generator
  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGoogleConnected || !googleToken) {
      setDocMessage('Please connect your Google Account first.');
      return;
    }
    if (!docTitle.trim()) return;

    setIsGeneratingDoc(true);
    setDocMessage(null);
    setGeneratedDocUrl(null);

    try {
      const rubricChecklist = docRubric
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const result = await createFormattedAssignmentDoc(googleToken, {
        title: docTitle.trim(),
        subject: docSubject.trim() || 'General Coursework',
        formatStyle: docStyle,
        checklist: rubricChecklist,
      });

      if (result?.webViewLink) {
        setGeneratedDocUrl(result.webViewLink);
        setDocMessage(`Document created successfully! Document ID: ${result.documentId}`);
        onRefreshFiles();
      } else {
        setDocMessage('Failed to create document.');
      }
    } catch (err) {
      console.error('Doc generation error:', err);
      setDocMessage('Error generating Google Doc. Please check permissions.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Run Essay Proofreading & Thesis Analysis
  const handleAnalyzeEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayToProof.trim() || isAnalyzingEssay) return;

    setIsAnalyzingEssay(true);
    setEssayAnalysisResult(null);
    try {
      const res = await analyzeEssayDraft({
        essayDraft: essayToProof.trim(),
        rubricOrPrompt: essayPromptContext.trim() || undefined,
      });
      setEssayAnalysisResult(res);
    } catch (err) {
      console.error('Essay analysis failed:', err);
    } finally {
      setIsAnalyzingEssay(false);
    }
  };

  // Run Socratic Tutor Dialogue
  const handleStartSocraticSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socraticTopic.trim() || isSocraticThinking) return;

    setIsSocraticThinking(true);
    setSocraticHistory([]);
    try {
      const initialQuestion = await socraticTutorStep({
        topic: socraticTopic.trim(),
        history: [],
        userMessage: 'Hello! I want to understand and master this concept thoroughly. Please start our Socratic dialogue by asking a diagnostic question.',
      });
      setSocraticHistory([{ role: 'model', content: initialQuestion }]);
    } catch (err) {
      console.error('Socratic initialization error:', err);
    } finally {
      setIsSocraticThinking(false);
    }
  };

  const handleSendSocraticAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socraticInput.trim() || isSocraticThinking) return;

    const userMsg = socraticInput.trim();
    const updatedHistory: SocraticTurn[] = [...socraticHistory, { role: 'user', content: userMsg }];
    setSocraticHistory(updatedHistory);
    setSocraticInput('');
    setIsSocraticThinking(true);

    try {
      const nextQuestion = await socraticTutorStep({
        topic: socraticTopic.trim(),
        history: updatedHistory,
        userMessage: userMsg,
      });
      setSocraticHistory([...updatedHistory, { role: 'model', content: nextQuestion }]);
    } catch (err) {
      console.error('Socratic reply error:', err);
    } finally {
      setIsSocraticThinking(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Dynamic Document &amp; Research Hub
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live split Markdown notes, Socratic Rubric Pre-checker, Feynman concept simplifier, and Drive
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'notes', label: 'Markdown & LaTeX Notes', icon: FileText },
            { id: 'bibliography', label: 'Bibliography & BibTeX', icon: BookOpen },
            { id: 'essay-proof', label: 'Essay & Thesis Proofreader', icon: FileCheck },
            { id: 'socratic', label: 'Socratic Dialogue Tutor', icon: MessageSquare },
            { id: 'rubric', label: 'Socratic Rubric Checker', icon: Scale },
            { id: 'feynman', label: 'Feynman Simplifier', icon: Lightbulb },
            { id: 'drive', label: 'Google Drive Files', icon: FolderOpen },
            { id: 'generator', label: '1-Click Doc Generator', icon: Plus },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocHubTab)}
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

      {/* 1. Markdown & LaTeX Note-Taker with Live Split Preview */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Notes Sidebar */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider">
                Saved Notes ({notes.length})
              </span>
              <button
                onClick={handleCreateNote}
                className="p-1 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-colors cursor-pointer"
                title="New Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
              <span className="text-[10px] text-[#8C897F] font-bold shrink-0">Folder:</span>
              {uniqueSubjects.map(subj => (
                <button key={subj} onClick={() => setNotesSubjectFilter(subj)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${notesSubjectFilter === subj ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#5C5A54] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27]'}`}>{subj}</button>
              ))}
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {Object.entries(groupedNotes).length === 0 ? (
                <p className="text-xs text-[#8C897F] text-center py-6">No notes in this folder</p>
              ) : (
                Object.entries(groupedNotes).map(([subj, subjNotes]) => (
                  <div key={subj} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-1">
                      <FolderOpen className="w-3 h-3 text-amber-600" />
                      <span className="text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] uppercase tracking-wider">{subj}</span>
                      <span className="text-[10px] text-[#8C897F]">({subjNotes.length})</span>
                    </div>
                    {subjNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                          activeNoteId === note.id
                            ? 'bg-[#D97757]/10 border-[#D97757]/40 text-[#D97757] font-bold'
                            : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="truncate font-semibold">{note.title || 'Untitled Note'}</p>
                          <span className="text-[10px] text-[#8C897F] font-mono">{note.updatedAt}</span>
                        </div>
                        {notes.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="p-1 text-[#8C897F] hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Split Editor & Preview */}
          <div className="lg:col-span-9 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col space-y-4">
            {activeNote && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                      placeholder="Note Title..."
                      className="flex-1 text-base font-bold bg-transparent border-b border-transparent hover:border-[#DFDACB] focus:border-[#D97757] focus:outline-none text-[#141413] dark:text-[#FAF9F5] px-1 py-0.5 min-w-0"
                    />
                    <input
                      type="text"
                      value={activeNote.subject || ''}
                      onChange={(e) => handleUpdateActiveNote({ subject: e.target.value })}
                      placeholder="Subject / Folder"
                      className="w-32 px-2 py-1 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#8C897F] px-2.5 py-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                      <span>{noteWordCount} words</span>
                      <span>•</span>
                      <span>{noteCharCount} chars</span>
                      <span>•</span>
                      <span>~{noteReadingTime} min read</span>
                    </div>

                    <button
                      onClick={handleInsertCornellTemplate}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Insert structured Cornell Note format"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cornell Template</span>
                    </button>

                    <button
                      onClick={handlePrintNote}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Print or Export to PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-500" />
                      <span>Print / PDF</span>
                    </button>

                    <button
                      onClick={handleCopyMarkdown}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNote ? 'Copied' : 'Copy MD'}</span>
                    </button>

                    <button
                      onClick={handleDownloadNote}
                      className="px-3 py-1.5 text-xs font-bold bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .md</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[550px]">
                  {/* Editor */}
                  <div className="flex flex-col h-full">
                    <span className="text-[10px] font-bold text-[#8C897F] uppercase tracking-wider mb-1">
                      Raw Markdown / LaTeX Editor
                    </span>
                    <textarea
                      value={activeNote.content}
                      onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                      placeholder="Type markdown content here..."
                      className="flex-1 w-full p-4 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
                    />
                  </div>

                  {/* Live Render Preview */}
                  <div className="flex flex-col h-full">
                    <span className="text-[10px] font-bold text-[#8C897F] uppercase tracking-wider mb-1">
                      Live Formatted Preview
                    </span>
                    <div className="flex-1 p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl overflow-y-auto prose dark:prose-invert prose-xs max-w-none text-[#141413] dark:text-[#FAF9F5]">
                      <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Essay & Thesis Proofreader */}
      {activeTab === 'essay-proof' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input column */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D97757]" />
                <span>AI Essay Proofreader &amp; Thesis Strength Analyzer</span>
              </h3>
              <p className="text-xs text-[#8C897F] mt-1">
                Deconstruct thesis arguability, structural paragraph transitions, and evidence-to-claim alignment.
              </p>
            </div>

            <form onSubmit={handleAnalyzeEssay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                  Assignment Prompt / Rubric (Optional Context)
                </label>
                <input
                  type="text"
                  value={essayPromptContext}
                  onChange={(e) => setEssayPromptContext(e.target.value)}
                  placeholder="e.g. Prompt: Evaluate the economic impact of the industrial revolution on urban labor."
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                  Essay Draft Text *
                </label>
                <textarea
                  rows={14}
                  required
                  value={essayToProof}
                  onChange={(e) => setEssayToProof(e.target.value)}
                  placeholder="Paste your essay draft, introductory paragraph, or full argument here..."
                  className="w-full p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl text-xs font-mono text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757] leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-[#8C897F]">
                  {essayToProof.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="submit"
                  disabled={isAnalyzingEssay || !essayToProof.trim()}
                  className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingEssay ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingEssay ? 'Analyzing Draft...' : 'Analyze Thesis & Structure'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Analysis Feedback Column */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between overflow-y-auto max-h-[700px]">
            {essayAnalysisResult ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Thesis Card */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F]">
                      Thesis Statement Evaluation
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      essayAnalysisResult.thesisEvaluation.strengthRating === 'Strong'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : essayAnalysisResult.thesisEvaluation.strengthRating === 'Moderate'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}>
                      {essayAnalysisResult.thesisEvaluation.strengthRating} Thesis
                    </span>
                  </div>

                  <blockquote className="text-xs font-serif italic text-[#141413] dark:text-[#FAF9F5] border-l-2 border-[#D97757] pl-3 py-1">
                    "{essayAnalysisResult.thesisEvaluation.thesisText}"
                  </blockquote>

                  <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8]">
                    {essayAnalysisResult.thesisEvaluation.critique}
                  </p>

                  <div className="pt-2 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40 text-xs">
                    <span className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider block">
                      Suggested Refinement
                    </span>
                    <p className="font-semibold text-[#141413] dark:text-[#FAF9F5] mt-0.5">
                      {essayAnalysisResult.thesisEvaluation.suggestedRefinement}
                    </p>
                  </div>
                </div>

                {/* Structural Flow */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block">
                    Structural Flow &amp; Transitions
                  </span>
                  <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] bg-[#FAF9F5] dark:bg-[#1F1E1B] p-3.5 rounded-xl border border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
                    {essayAnalysisResult.structuralFlow.overallCoherence}
                  </p>
                  {essayAnalysisResult.structuralFlow.transitionWeaknesses.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>

                {/* Evidence Alignment & Action Items */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block">
                    Actionable Next Steps
                  </span>
                  <div className="space-y-1.5">
                    {essayAnalysisResult.actionableNextSteps.map((step, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2 text-xs text-[#141413] dark:text-[#FAF9F5]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-[#8C897F] py-16 space-y-2">
                <FileCheck className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs">Paste your essay draft to generate thesis &amp; structural feedback</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Socratic Dialogue Tutor */}
      {activeTab === 'socratic' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col h-[650px]">
          <div className="pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D97757]" />
                <span>Socratic Concept Dialogue Engine</span>
              </h3>
              <p className="text-xs text-[#8C897F] mt-0.5">
                The AI will not give you answers directly — it asks probing diagnostic questions to build first-principles mastery.
              </p>
            </div>
            {socraticHistory.length > 0 && (
              <button
                onClick={() => {
                  setSocraticHistory([]);
                  setSocraticTopic('');
                }}
                className="text-xs text-[#8C897F] hover:text-[#D97757] underline cursor-pointer"
              >
                Reset Topic
              </button>
            )}
          </div>

          {/* Socratic Chat Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 min-h-0">
            {socraticHistory.length === 0 ? (
              <div className="my-auto text-center py-12 space-y-4">
                <Brain className="w-10 h-10 mx-auto text-[#D97757] opacity-80" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                    What concept would you like to master today?
                  </h4>
                  <p className="text-xs text-[#8C897F] max-w-md mx-auto">
                    e.g. Fourier Transform, Bayes Theorem, Mitosis vs Meiosis, Supply &amp; Demand Elasticity
                  </p>
                </div>
                <form onSubmit={handleStartSocraticSession} className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    required
                    value={socraticTopic}
                    onChange={(e) => setSocraticTopic(e.target.value)}
                    placeholder="Enter topic or theory..."
                    className="flex-1 px-4 py-2.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757]"
                  />
                  <button
                    type="submit"
                    disabled={isSocraticThinking || !socraticTopic.trim()}
                    className="px-4 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isSocraticThinking ? 'Starting...' : 'Begin Dialogue'}
                  </button>
                </form>
              </div>
            ) : (
              socraticHistory.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      turn.role === 'user'
                        ? 'bg-[#D97757] text-white rounded-tr-xs'
                        : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#141413] dark:text-[#FAF9F5] rounded-tl-xs'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-60 mb-1">
                      {turn.role === 'user' ? 'You' : 'Socratic Tutor'}
                    </div>
                    <div>{turn.content}</div>
                  </div>
                </div>
              ))
            )}

            {isSocraticThinking && socraticHistory.length > 0 && (
              <div className="flex justify-start">
                <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-xs text-[#8C897F] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#D97757]" />
                  <span>Formulating Socratic question...</span>
                </div>
              </div>
            )}
          </div>

          {/* Socratic Reply Bar */}
          {socraticHistory.length > 0 && (
            <form onSubmit={handleSendSocraticAnswer} className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex gap-2 shrink-0">
              <input
                type="text"
                value={socraticInput}
                onChange={(e) => setSocraticInput(e.target.value)}
                placeholder="Explain your reasoning or ask for clarification..."
                className="flex-1 px-4 py-2.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757]"
              />
              <button
                type="submit"
                disabled={isSocraticThinking || !socraticInput.trim()}
                className="px-4 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* 4. Socratic Rubric Pre-Checker */}
      {activeTab === 'rubric' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D97757]" />
                <span>Socratic Rubric Pre-Checker (Gemini 2.5 Flash)</span>
              </h3>
              <p className="text-xs text-[#8C897F] mt-1">
                Paste your essay or project draft alongside the grading rubric. Gemini grades each criterion, flags weak arguments, and delivers concrete structural revisions before you turn it in.
              </p>
            </div>

            <form onSubmit={handlePreCheckRubric} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1.5">
                    Assignment Grading Rubric *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    placeholder="Paste rubric criteria (e.g. 20% Thesis statement, 30% Textual evidence, 25% Critical analysis, 25% Mechanics & citations)..."
                    className="w-full p-3.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1.5">
                    Student Essay / Project Draft *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={essayDraft}
                    onChange={(e) => setEssayDraft(e.target.value)}
                    placeholder="Paste your draft essay paragraphs or argument outline here..."
                    className="w-full p-3.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isEvaluatingRubric || !essayDraft.trim() || !rubricText.trim()}
                  className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEvaluatingRubric ? 'animate-spin' : ''}`} />
                  <span>{isEvaluatingRubric ? 'Evaluating Draft against Rubric...' : 'Run Rubric Pre-Check'}</span>
                </button>
              </div>
            </form>
          </div>

          {rubricResult && (
            <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#8C897F] uppercase tracking-wider">
                    Evaluation Result
                  </span>
                  <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] mt-0.5">
                    {rubricResult.overallFeedback}
                  </h4>
                </div>

                <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-center">
                  <span className="text-xl">{rubricResult.overallScore}</span>
                  <span className="text-xs"> / 100</span>
                </div>
              </div>

              {/* Criteria Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Criterion Assessment:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rubricResult.criteria.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#141413] dark:text-[#FAF9F5]">{c.criterion}</span>
                        <span className="text-[#D97757]">
                          {c.pointsEarned} / {c.maxPoints} pts
                        </span>
                      </div>
                      <p className="text-[#5C5A54] dark:text-[#B5B2A8]">{c.feedback}</p>
                      <p className="text-amber-700 dark:text-amber-300 pt-1 font-medium">
                        <strong>Suggestion:</strong> {c.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Revisions */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/80 space-y-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Key Structural Revisions:</span>
                </span>
                <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {rubricResult.actionableRevisions.map((rev, i) => (
                    <li key={i}>{rev}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Feynman Technique Concept Simplifier */}
      {activeTab === 'feynman' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#D97757]" />
                <span>The Feynman Technique Concept Simplifier</span>
              </h3>
              <p className="text-xs text-[#8C897F] mt-1">
                Paste any dense academic paragraph or confusing theorem. Gemini boils it down to an ELI12 explanation with a relatable real-world analogy.
              </p>
            </div>

            <form onSubmit={handleFeynmanSimplify} className="space-y-3">
              <textarea
                rows={5}
                required
                value={denseConcept}
                onChange={(e) => setDenseConcept(e.target.value)}
                placeholder="Paste complex textbook definition (e.g. 'Heisenberg Uncertainty Principle states that the position and momentum of a particle cannot both be measured with arbitrarily high precision...')"
                className="w-full p-3.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSimplifyingFeynman || !denseConcept.trim()}
                  className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSimplifyingFeynman ? 'animate-spin' : ''}`} />
                  <span>{isSimplifyingFeynman ? 'Simplifying...' : 'Apply Feynman Simplification'}</span>
                </button>
              </div>
            </form>
          </div>

          {feynmanResult && (
            <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-4 animate-in fade-in">
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                  Core Idea in One Sentence
                </span>
                <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                  &ldquo;{feynmanResult.coreIdea}&rdquo;
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block mb-1">
                  Plain English Explanation (ELI12)
                </span>
                <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                  {feynmanResult.simplified}
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97757] flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Real-World Everyday Analogy</span>
                </span>
                <p className="text-xs text-[#141413] dark:text-[#FAF9F5] italic leading-relaxed">
                  {feynmanResult.analogy}
                </p>
              </div>

              {/* 3-Tier Rigor Breakdown */}
              {threeTierResult && (
                <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      3-Tier Rigor Progression
                    </span>
                    <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] p-1 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
                      {[
                        { id: 'eli5', label: 'ELI5' },
                        { id: 'highschool', label: 'High School' },
                        { id: 'undergrad', label: 'Undergraduate' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedFeynmanTier(tier.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            selectedFeynmanTier === tier.id
                              ? 'bg-[#D97757] text-white shadow-xs'
                              : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-xs leading-relaxed text-[#141413] dark:text-[#FAF9F5]">
                    {selectedFeynmanTier === 'eli5' && (
                      <div>
                        <span className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider block mb-1">
                          Tier 1: Explain Like I&apos;m 5
                        </span>
                        <p>{threeTierResult.tier1_eli5}</p>
                      </div>
                    )}

                    {selectedFeynmanTier === 'highschool' && (
                      <div>
                        <span className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider block mb-1">
                          Tier 2: High School Physical Intuition
                        </span>
                        <p>{threeTierResult.tier2_highschool}</p>
                      </div>
                    )}

                    {selectedFeynmanTier === 'undergrad' && (
                      <div>
                        <span className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider block mb-1">
                          Tier 3: Undergraduate Mathematical Formalism
                        </span>
                        <p className="font-mono text-[11px]">{threeTierResult.tier3_undergrad}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Google Drive Files */}
      {activeTab === 'drive' && (
        <GoogleDriveTab
          recentFiles={recentFiles}
          isLoadingFiles={isLoadingFiles}
          onRefreshFiles={onRefreshFiles}
          isGoogleConnected={isGoogleConnected}
          googleToken={googleToken}
        />
      )}

      {/* Bibliography Hub */}
      {activeTab === 'bibliography' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600" /> Bibliography & Citations ({bibEntries.length})</h3>
              <div className="flex items-center gap-2">
                <button onClick={()=>{ const bib=toBibTeX(bibEntries); navigator.clipboard.writeText(bib); setBibCopied('bib'); setTimeout(()=>setBibCopied(null),2000); }} className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center gap-1"><Copy className="w-3.5 h-3.5" /><span>{bibCopied==='bib'?'Copied BibTeX':'Copy BibTeX'}</span></button>
                <button onClick={()=>{
                  const blob=new Blob([toBibTeX(bibEntries)], {type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bibliography.bib'; a.click(); URL.revokeObjectURL(url);
                }} className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /><span>Export .bib</span></button>
                <button onClick={()=>{ if(confirm('Clear bibliography?')){ setBibEntries([]); saveBibliography([]); } }} className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto">
              {bibEntries.length===0 ? <p className="text-xs text-[#8C897F] text-center py-12">No citations yet. Save arXiv papers or Open Library books — they auto-appear here.</p> : bibEntries.map((e,i)=>(
                <div key={e.id} className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug">{e.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">{e.type}</span>
                  </div>
                  <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8]">{e.authors} • {e.year} • {e.journal||e.publisher}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>{ navigator.clipboard.writeText(toAPA(e)); setBibCopied(e.id+'-apa'); setTimeout(()=>setBibCopied(null),1500); }} className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">{bibCopied===e.id+'-apa'?<Check className="w-3 h-3 text-emerald-600 inline mr-1"/>:null}APA</button>
                    <button onClick={()=>{ navigator.clipboard.writeText(toMLA(e)); setBibCopied(e.id+'-mla'); setTimeout(()=>setBibCopied(null),1500); }} className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">{bibCopied===e.id+'-mla'?<Check className="w-3 h-3 text-emerald-600 inline mr-1"/>:null}MLA</button>
                    <button onClick={()=>{ navigator.clipboard.writeText((() => {
                      const key = e.authors.split(' ')[0]?.toLowerCase() + e.year + e.title.split(' ')[0]?.toLowerCase();
                      return e.type==='article' ? `@article{${key},\n  title={${e.title}},\n  author={${e.authors}},\n  year={${e.year}}\n}` : `@book{${key},\n  title={${e.title}},\n  author={${e.authors}},\n  year={${e.year}}\n}`;
                    })()); setBibCopied(e.id+'-bib'); setTimeout(()=>setBibCopied(null),1500); }} className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">{bibCopied===e.id+'-bib'?<Check className="w-3 h-3 text-emerald-600 inline mr-1"/>:null}BibTeX</button>
                    <a href={e.url} target="_blank" rel="noreferrer" className="px-2 py-1 text-[11px] font-bold text-violet-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Source</a>
                  </div>
                  <p className="text-[11px] font-mono bg-white dark:bg-[#1A1917] p-2 rounded-lg border border-[#DFDACB]/40 text-[#5C5A54] dark:text-[#B5B2A8]">{toAPA(e)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. 1-Click Assignment Doc Generator */}
      {activeTab === 'generator' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#D97757]" />
              <span>1-Click Assignment Google Doc Generator</span>
            </h3>
            <p className="text-xs text-[#8C897F] mt-1">
              Creates a fresh Google Doc formatted with MLA / APA title block, header, and pre-loaded rubric checklist.
            </p>
          </div>

          <form onSubmit={handleGenerateDoc} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Macbeth Tragic Hero Argumentative Essay"
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={docSubject}
                  onChange={(e) => setDocSubject(e.target.value)}
                  placeholder="e.g. AP English Literature"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Formatting Standard
                </label>
                <select
                  value={docStyle}
                  onChange={(e) => setDocStyle(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                >
                  <option value="Academic Standard">Academic Standard</option>
                  <option value="MLA">MLA 9th Edition</option>
                  <option value="APA">APA 7th Edition</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                Rubric Checklist Items (1 per line)
              </label>
              <textarea
                rows={4}
                value={docRubric}
                onChange={(e) => setDocRubric(e.target.value)}
                placeholder="Include 3 peer-reviewed citations&#10;Argue both sides of the thesis&#10;Word count between 1200 - 1500 words"
                className="w-full p-3 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none"
              />
            </div>

            {docMessage && (
              <p className="text-xs text-[#D97757] font-medium">{docMessage}</p>
            )}

            {generatedDocUrl && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  Document Created in Google Drive!
                </span>
                <a
                  href={generatedDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>Open Doc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isGeneratingDoc || !docTitle.trim()}
                className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                <span>{isGeneratingDoc ? 'Creating Doc...' : 'Generate Google Doc'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
