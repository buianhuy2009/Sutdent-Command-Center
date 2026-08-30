import React, { useState } from 'react';
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
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleDriveTab } from '../GoogleDriveTab';
import { createFormattedAssignmentDoc } from '../../services/googleWorkspace';
import { MarkdownNote, SchoolFile } from '../../types';

type DocHubTab = 'notes' | 'drive' | 'generator';

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

### 3. Review Checklist
- [x] Read Chapter 4 textbook excerpts
- [ ] Complete problem set derivations
- [ ] Submit assignment PDF to Canvas
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

  // --- Markdown Notes State ---
  const [notes, setNotes] = useState<MarkdownNote[]>(loadSavedNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const saved = loadSavedNotes();
    return saved.length > 0 ? saved[0].id : '';
  });
  const [copiedNote, setCopiedNote] = useState(false);

  // --- Assignment Doc Generator State ---
  const [genTitle, setGenTitle] = useState('');
  const [genSubject, setGenSubject] = useState('');
  const [genTeacher, setGenTeacher] = useState('');
  const [genFormat, setGenFormat] = useState<'MLA' | 'APA' | 'Academic Standard'>('Academic Standard');
  const [genChecklist, setGenChecklist] = useState('Introduction with thesis statement\nLiterature synthesis & evidence\nDiscussion & analysis\nConclusion & citations');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  const handleUpdateActiveNoteContent = (content: string) => {
    if (!activeNote) return;
    const updated = notes.map((n) =>
      n.id === activeNote.id ? { ...n, content, updatedAt: new Date().toLocaleDateString() } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const handleCreateNewNote = () => {
    const newNote: MarkdownNote = {
      id: `note-${Date.now()}`,
      title: `Untitled Note ${notes.length + 1}`,
      subject: 'Coursework',
      content: `# Untitled Note\n\nStart typing lecture notes or equations here...`,
      updatedAt: new Date().toLocaleDateString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim() || !googleToken) return;

    setIsGeneratingDoc(true);
    setGeneratedDocUrl(null);
    try {
      const checklistItems = genChecklist
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createFormattedAssignmentDoc(googleToken, {
        title: genTitle.trim(),
        subject: genSubject.trim() || 'Coursework',
        teacherName: genTeacher.trim(),
        formatStyle: genFormat,
        checklist: checklistItems,
      });

      setGeneratedDocUrl(res.webViewLink);
    } catch (err) {
      console.error('Failed to generate assignment Doc:', err);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Document &amp; Resource Hub
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Markdown &amp; LaTeX note-taking, Google Drive files, and 1-click assignment template generator
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'notes', label: 'Markdown & LaTeX Notes', icon: FileText },
            { id: 'drive', label: 'Google Drive Files', icon: FolderOpen },
            { id: 'generator', label: '1-Click Doc Generator', icon: Sparkles },
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

      {/* 1. Quick Markdown & LaTeX Note-Taker with Live Split Preview */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(85vh-160px)] min-h-[580px]">
          {/* Notes Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
                  My Notes ({notes.length})
                </span>
                <button
                  onClick={handleCreateNewNote}
                  className="p-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="New Note"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {notes.map((note) => {
                  const isSelected = note.id === activeNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#D97757]/10 border-[#D97757] text-[#141413] dark:text-[#FAF9F5]'
                          : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate">{note.title}</h4>
                        <span className="text-[10px] text-[#8C897F]">{note.updatedAt}</span>
                      </div>

                      {notes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="p-1 text-[#8C897F] hover:text-rose-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F]">
              <span>Saved locally in browser storage.</span>
            </div>
          </div>

          {/* Editor & Live Split Preview (9 cols) */}
          <div className="lg:col-span-9 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col shadow-xs overflow-hidden">
            {activeNote && (
              <>
                {/* Note Title & Action Bar */}
                <div className="p-3.5 border-b border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F5] dark:bg-[#1F1E1B]">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const updated = notes.map((n) => (n.id === activeNote.id ? { ...n, title } : n));
                      setNotes(updated);
                      saveNotes(updated);
                    }}
                    className="text-sm font-bold bg-transparent border-0 focus:outline-none focus:ring-0 text-[#141413] dark:text-[#FAF9F5] flex-1"
                    placeholder="Note Title..."
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-2.5 py-1 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedNote ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNote ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownloadMarkdown}
                      className="px-2.5 py-1 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .md</span>
                    </button>
                  </div>
                </div>

                {/* 2-Pane Split: Left Markdown Editor, Right Live Rendered Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#DFDACB] dark:divide-[#2C2B27]">
                  {/* Left: Raw Editor */}
                  <div className="flex flex-col h-full">
                    <div className="px-4 py-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[10px] font-bold uppercase tracking-wider text-[#8C897F] bg-[#FAF9F5]/50 dark:bg-[#1F1E1B]/50">
                      Markdown &amp; LaTeX Editor
                    </div>
                    <textarea
                      value={activeNote.content}
                      onChange={(e) => handleUpdateActiveNoteContent(e.target.value)}
                      className="w-full flex-1 p-4 font-mono text-xs text-[#141413] dark:text-[#FAF9F5] bg-transparent border-0 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                      placeholder="Type markdown or LaTeX equations..."
                    />
                  </div>

                  {/* Right: Live Rendered Output */}
                  <div className="flex flex-col h-full bg-[#FAF9F5]/30 dark:bg-[#141413]/30">
                    <div className="px-4 py-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[10px] font-bold uppercase tracking-wider text-[#8C897F] bg-[#FAF9F5]/50 dark:bg-[#1F1E1B]/50">
                      Live Preview
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto prose dark:prose-invert prose-xs max-w-none text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                      <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Google Drive Files */}
      {activeTab === 'drive' && (
        <GoogleDriveTab
          recentFiles={recentFiles}
          isLoadingFiles={isLoadingFiles}
          onRefreshFiles={onRefreshFiles}
          isGoogleConnected={isGoogleConnected}
          googleToken={googleToken}
        />
      )}

      {/* 3. 1-Click Assignment Google Doc Generator */}
      {activeTab === 'generator' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs">
          <div className="pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
            <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97757]" />
              <span>1-Click Assignment Doc Generator</span>
            </h3>
            <p className="text-xs text-[#8C897F] mt-1">
              Auto-generate properly formatted school documents (MLA, APA, Academic Standard) with assignment criteria and rubric checklists pre-loaded into your Google Drive.
            </p>
          </div>

          <form onSubmit={handleGenerateGoogleDoc} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. Silk Road Trade DBQ Essay"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Course / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  placeholder="e.g. AP World History"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={genTeacher}
                  onChange={(e) => setGenTeacher(e.target.value)}
                  placeholder="e.g. Dr. Martinez"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Formatting Standard
                </label>
                <select
                  value={genFormat}
                  onChange={(e) => setGenFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                >
                  <option value="Academic Standard">Academic Standard</option>
                  <option value="MLA">MLA Format</option>
                  <option value="APA">APA Format</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                Rubric Checklist Items (One per line)
              </label>
              <textarea
                rows={4}
                value={genChecklist}
                onChange={(e) => setGenChecklist(e.target.value)}
                placeholder="List required milestones..."
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {!isGoogleConnected ? (
                <span className="text-xs text-amber-600">Connect your Google Account to create Docs in Drive.</span>
              ) : <div />}

              <button
                type="submit"
                disabled={isGeneratingDoc || !genTitle.trim() || !isGoogleConnected}
                className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                <span>{isGeneratingDoc ? 'Creating Doc in Google Drive...' : 'Generate Google Doc'}</span>
              </button>
            </div>

            {generatedDocUrl && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 mt-4">
                <span>Assignment document created successfully in your Google Drive!</span>
                <a
                  href={generatedDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>Open in Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
