import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Download,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { searchArxiv, ArxivPaper } from '../../services/publicApis';

const CATEGORIES = [
  { id: 'all', label: 'All Subjects' },
  { id: 'cs.AI', label: 'Computer Science (AI/ML)' },
  { id: 'math', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'q-bio', label: 'Quantitative Biology' },
  { id: 'econ', label: 'Economics & Finance' },
  { id: 'stat', label: 'Statistics' },
];

export const ArxivWorkspace: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<ArxivPaper | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    handleSearch();
  }, [category]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const results = await searchArxiv(query, category);
      setPapers(results);
      if (results.length > 0) {
        setSelectedPaper(results[0]);
      }
    } catch (err) {
      console.error('arXiv search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCitation = (paper: ArxivPaper) => {
    const citation = `${paper.authors.join(', ')} (${paper.published.slice(-4) || '2026'}). "${paper.title}". arXiv preprint ${paper.id}.`;
    navigator.clipboard.writeText(citation);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#FAF9F5] dark:bg-[#141413] p-4 sm:p-6 space-y-5 animate-in fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
              arXiv Research Paper Explorer
            </h2>
            <p className="text-xs text-[#8C897F]">
              Live preprint index querying Cornell University arXiv API • 100% Genuine Papers
            </p>
          </div>
        </div>

        {/* Search Bar & Category */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, author, abstract..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757] w-64"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Main Grid: Papers List + Detail Abstract */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left: Paper Cards List */}
        <div className="lg:col-span-6 overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <div className="py-20 text-center text-[#8C897F] text-xs space-y-2">
              <RefreshCw className="w-7 h-7 text-[#D97757] animate-spin mx-auto opacity-70" />
              <p>Fetching latest peer-reviewed research papers from arXiv...</p>
            </div>
          ) : papers.length === 0 ? (
            <div className="py-20 text-center text-[#8C897F] text-xs space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-30" />
              <p>No papers found. Try adjusting your query or subject filter.</p>
            </div>
          ) : (
            papers.map((paper) => {
              const isSelected = selectedPaper?.id === paper.id;
              return (
                <div
                  key={paper.id}
                  onClick={() => setSelectedPaper(paper)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-[#1A1917] border-[#D97757] shadow-xs'
                      : 'bg-white/60 dark:bg-[#1A1917]/60 border-[#DFDACB] dark:border-[#2C2B27] hover:bg-white dark:hover:bg-[#1A1917]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-[#8C897F]">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] font-mono font-bold text-[#D97757]">
                      {paper.primaryCategory}
                    </span>
                    <span>{paper.published}</span>
                  </div>

                  <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug line-clamp-2">
                    {paper.title}
                  </h3>

                  <div className="text-[11px] text-[#8C897F] truncate">
                    {paper.authors.join(', ')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Paper Abstract & PDF Viewer Trigger */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between overflow-y-auto">
          {selectedPaper ? (
            <div className="space-y-5">
              <div className="space-y-2 pb-4 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#D97757]">
                    {selectedPaper.primaryCategory}
                  </span>
                  <span className="text-[11px] text-[#8C897F]">
                    Published: {selectedPaper.published}
                  </span>
                </div>

                <h2 className="text-sm font-extrabold text-[#141413] dark:text-[#FAF9F5] leading-snug">
                  {selectedPaper.title}
                </h2>

                <p className="text-xs text-[#8C897F]">
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5]">Authors: </span>
                  {selectedPaper.authors.join(', ')}
                </p>
              </div>

              {/* Abstract */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block">
                  Paper Abstract
                </span>
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed max-h-72 overflow-y-auto">
                  {selectedPaper.summary}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => handleCopyCitation(selectedPaper)}
                  className="px-3 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedId === selectedPaper.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === selectedPaper.id ? 'Citation Copied' : 'Copy APA Citation'}</span>
                </button>

                <a
                  href={selectedPaper.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Open Official PDF</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center text-[#8C897F] text-xs py-16 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto opacity-30" />
              <p>Select a paper from the left to read abstract &amp; access full text PDF</p>
            </div>
          )}

          <div className="pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[10px] text-[#8C897F] flex items-center justify-between">
            <span>Direct Public API via Cornell University</span>
            <span className="font-mono">Open Access Repository</span>
          </div>
        </div>

      </div>

    </div>
  );
};
