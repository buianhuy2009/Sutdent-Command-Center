import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Maximize2,
  ExternalLink,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface PdfAnnotation {
  id: string;
  pageNumber: number;
  note: string;
  timestamp: string;
}

export const PdfReaderWorkspace: React.FC = () => {
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [newNote, setNewNote] = useState('');
  const [notePage, setNotePage] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (pdfFileUrl) {
      URL.revokeObjectURL(pdfFileUrl);
    }

    const url = URL.createObjectURL(file);
    setPdfFileUrl(url);
    setPdfFileName(file.name);
    setNotePage(1);
  };

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const annotation: PdfAnnotation = {
      id: `ann-${Date.now()}`,
      pageNumber: notePage,
      note: newNote.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAnnotations((prev) => [...prev, annotation]);
    setNewNote('');
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExportNotesMarkdown = () => {
    if (annotations.length === 0) return;

    let content = `# Study Notes for: ${pdfFileName || 'Document'}\n\n`;
    content += `Exported on: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber);
    sorted.forEach((ann) => {
      content += `### Page ${ann.pageNumber} (${ann.timestamp})\n`;
      content += `${ann.note}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFileName.replace('.pdf', '')}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNotes = () => {
    if (annotations.length === 0) return;
    const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber);
    const text = sorted.map((a) => `[Page ${a.pageNumber}] ${a.note}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtractHighlights = () => {
    if (annotations.length === 0) return;
    const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber);
    // Highlight Extractor: auto-append with page citations to Document Hub notes
    const markdown = sorted.map(a=>`> "${a.note}" — *p. ${a.pageNumber}*, ${pdfFileName || 'Document'} (${a.timestamp})`).join('\n\n');
    try {
      const raw = localStorage.getItem('scc_markdown_notes_v1');
      const notes = raw ? JSON.parse(raw) : [];
      const hubNote = { id: `note-${Date.now()}`, title: `Highlights: ${pdfFileName || 'PDF'}`, subject: 'Highlights', content: `# Highlights from ${pdfFileName || 'Document'}\n\n${markdown}\n`, updatedAt: new Date().toLocaleDateString() };
      localStorage.setItem('scc_markdown_notes_v1', JSON.stringify([hubNote, ...notes]));
      // also try Dexie
      import('../../services/db').then(m=>{ m.db.notes.put(hubNote as any).catch(()=>{}); });
    } catch {}
    // feedback
    navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                PDF Document Reader &amp; Annotator
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                In-Browser Reader
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Open local PDFs, take page-referenced study notes, and export markdown summaries
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{pdfFileUrl ? 'Open Another PDF' : 'Open PDF File'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      {!pdfFileUrl ? (
        /* Empty State / Upload Prompt */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-white dark:bg-[#1A1917] rounded-3xl border-2 border-dashed border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] p-16 text-center cursor-pointer transition-colors space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
              Select a PDF lecture, textbook, or syllabus
            </h3>
            <p className="text-xs text-[#8C897F] max-w-md mx-auto mt-1">
              Files are rendered safely inside your browser. No files are uploaded to external servers.
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors"
          >
            Browse from Computer
          </button>
        </div>
      ) : (
        /* PDF Reader + Annotations Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
          
          {/* Left: PDF Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex flex-col space-y-3">
            
            {/* PDF Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-xs">
              <div className="flex items-center gap-2 truncate max-w-xs sm:max-w-md">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                  {pdfFileName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] text-xs font-semibold flex items-center gap-1"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pop Out</span>
                </a>
              </div>
            </div>

            {/* Embedded PDF Canvas */}
            <div className="flex-1 bg-stone-100 dark:bg-stone-900 rounded-2xl overflow-hidden min-h-[600px] border border-[#DFDACB]/40 flex items-center justify-center">
              <iframe
                src={`${pdfFileUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full min-h-[600px] border-none rounded-2xl"
                title="PDF Document"
              />
            </div>
          </div>

          {/* Right: Study Notes & Page Annotations (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#D97757]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                    Document Notes ({annotations.length})
                  </span>
                </div>

                {annotations.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyNotes}
                      className="p-1 rounded text-[#8C897F] hover:text-[#D97757]"
                      title="Copy notes"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleExportNotesMarkdown}
                      className="p-1 rounded text-[#8C897F] hover:text-[#D97757]"
                      title="Export to Markdown (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleExtractHighlights}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-200"
                      title="Extract highlights with page citations to Document Hub"
                    >
                      Extract Highlights →
                    </button>
                  </div>
                )}
              </div>

              {/* Note List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {annotations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C897F] space-y-1">
                    <p className="font-semibold">No notes yet</p>
                    <p className="text-[11px]">Type key points or formulas below to bookmark them.</p>
                  </div>
                ) : (
                  annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Page {ann.pageNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8C897F]">{ann.timestamp}</span>
                          <button
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#8C897F] hover:text-rose-500 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed whitespace-pre-wrap">
                        {ann.note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Note Add Form */}
            <form onSubmit={handleAddAnnotation} className="pt-2 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8C897F]">Page:</span>
                <input
                  type="number"
                  min={1}
                  value={notePage}
                  onChange={(e) => setNotePage(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-lg text-xs font-bold text-center focus:outline-none"
                />
              </div>

              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Take a note, formula, or exam cue for this page..."
                rows={3}
                className="w-full p-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none"
              />

              <button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </form>

          </div>

        </div>
      )}

    </div>
  );
};
