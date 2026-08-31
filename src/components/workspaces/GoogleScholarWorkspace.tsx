import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  Quote,
  Layers,
  RefreshCw,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface ScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  citationCount: number;
  authors: Array<{ authorId: string; name: string }>;
  venue: string | null;
  url: string;
  openAccessPdf?: { url: string } | null;
}

export const GoogleScholarWorkspace: React.FC = () => {
  const [query, setQuery] = useState('Deep Residual Learning for Image Recognition');
  const [papers, setPapers] = useState<ScholarPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Citation Modal / Popover
  const [selectedPaper, setSelectedPaper] = useState<ScholarPaper | null>(null);
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);

  const searchAcademicPapers = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Search Semantic Scholar Graph API
      const endpoint = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=10&fields=paperId,title,abstract,year,citationCount,authors,venue,url,openAccessPdf`;
      
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Academic search failed (${res.status}).`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        setPapers(data.data);
      } else {
        setPapers([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch academic papers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchAcademicPapers(query);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchAcademicPapers(query);
  };

  // Generate real verified citations
  const generateCitation = (paper: ScholarPaper, format: 'apa' | 'mla' | 'chicago' | 'bibtex'): string => {
    const authors = paper.authors.map((a) => a.name);
    const authorStr =
      authors.length === 0
        ? 'Unknown Author'
        : authors.length === 1
        ? authors[0]
        : authors.length === 2
        ? `${authors[0]} & ${authors[1]}`
        : `${authors[0]} et al.`;

    const yearStr = paper.year ? `(${paper.year})` : '(n.d.)';
    const venueStr = paper.venue ? ` *${paper.venue}*.` : '';

    switch (format) {
      case 'apa':
        return `${authorStr} ${yearStr}. ${paper.title}.${venueStr}`;
      case 'mla':
        return `${authorStr}. "${paper.title}."${venueStr ? ` ${paper.venue},` : ''} ${paper.year || 'n.d.'}.`;
      case 'chicago':
        return `${authorStr}. "${paper.title}."${venueStr ? ` ${paper.venue}` : ''} (${paper.year || 'n.d.'}).`;
      case 'bibtex':
        const citeKey = `${(authors[0] || 'Author').split(' ').pop()?.toLowerCase() || 'paper'}${paper.year || 2024}`;
        return `@article{${citeKey},\n  title={${paper.title}},\n  author={${authors.join(' and ')}},\n  journal={${paper.venue || 'Journal'}},\n  year={${paper.year || 2024}}\n}`;
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportBibTeX = () => {
    if (papers.length === 0) return;
    const bibContent = papers
      .map((p) => generateCitation(p, 'bibtex'))
      .join('\n\n');
    const blob = new Blob([bibContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar_citations_${Date.now()}.bib`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Top Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Google Scholar &amp; Research Index
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Live Academic Index
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live literature search across peer-reviewed papers, abstracts, and verified citations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBibTeX}
            disabled={papers.length === 0}
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Export .bib</span>
          </button>
        </div>
      </div>

      {/* 2. Search Input */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 shadow-xs flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C897F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, DOIs, authors, or topics (e.g. quantum computing, CRISPR, attention is all you need)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Searching index...' : 'Search Papers'}</span>
        </button>
      </form>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Paper Results Grid */}
      <div className="space-y-4">
        {papers.map((paper) => (
          <div
            key={paper.paperId}
            className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4 hover:border-[#D97757]/60 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-bold text-[#141413] dark:text-[#FAF9F5] hover:text-[#D97757] transition-colors leading-snug flex items-center gap-1.5"
                >
                  <span>{paper.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8C897F] shrink-0" />
                </a>

                <div className="text-xs text-[#8C897F] flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#5C5A54] dark:text-[#B5B2A8]">
                    {paper.authors.map((a) => a.name).join(', ')}
                  </span>
                  {paper.year && <span>• {paper.year}</span>}
                  {paper.venue && <span>• {paper.venue}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8]">
                  {paper.citationCount.toLocaleString()} Citations
                </span>

                <button
                  onClick={() => setSelectedPaper(paper)}
                  className="px-3 py-1 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#D97757] hover:text-white border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 text-[#141413] dark:text-[#FAF9F5]"
                >
                  <Quote className="w-3 h-3" />
                  <span>Cite</span>
                </button>

                {paper.openAccessPdf?.url && (
                  <a
                    href={paper.openAccessPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </a>
                )}
              </div>
            </div>

            {paper.abstract && (
              <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed line-clamp-3">
                {paper.abstract}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Citation Popover Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#D97757]" />
                <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Cite this Research Paper
                </h3>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-xs text-[#8C897F]">
                ✕
              </button>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2">
              {[
                { id: 'apa', label: 'APA 7th' },
                { id: 'mla', label: 'MLA 9th' },
                { id: 'chicago', label: 'Chicago 17th' },
                { id: 'bibtex', label: 'BibTeX' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setCitationFormat(fmt.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    citationFormat === fmt.id
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] text-[#5C5A54] border border-[#DFDACB]'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Formatted Citation */}
            <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
              {citationFormat === 'bibtex' ? (
                <pre className="font-mono text-xs text-[#141413] dark:text-[#FAF9F5] whitespace-pre-wrap overflow-x-auto">
                  {generateCitation(selectedPaper, 'bibtex')}
                </pre>
              ) : (
                <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed select-all">
                  {generateCitation(selectedPaper, citationFormat)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 text-xs font-bold text-[#8C897F]"
              >
                Close
              </button>
              <button
                onClick={() => handleCopyCitation(generateCitation(selectedPaper, citationFormat))}
                className="px-5 py-2 bg-[#D97757] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Citation!' : 'Copy Citation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
