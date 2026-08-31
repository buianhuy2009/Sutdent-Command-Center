import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';
import { generateCitations, AcademicCitationResult } from '../../services/gemini';

export const GoogleScholarWorkspace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('Attention Is All You Need Vaswani transformer');
  const [isSearching, setIsSearching] = useState(false);
  const [citationResult, setCitationResult] = useState<AcademicCitationResult | null>({
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I.',
    year: '2017',
    apa: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30, 5998–6008.',
    mla: 'Vaswani, Ashish, et al. "Attention is all you need." Advances in Neural Information Processing Systems 30 (2017): 5998-6008.',
    chicago: 'Vaswani, Ashish, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin. "Attention is all you need." Advances in Neural Information Processing Systems 30 (2017): 5998-6008.',
    bibtex: `@inproceedings{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  booktitle={Advances in Neural Information Processing Systems},
  pages={5998--6008},
  year={2017}
}`,
    inText: '(Vaswani et al., 2017)',
  });
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleSearchCitations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await generateCitations(searchQuery.trim());
      setCitationResult(res);
    } catch (err) {
      console.error('Error generating citations:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Google Scholar &amp; Citations
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Academic Research
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Search research papers, books, and generate accurate APA, MLA, Chicago &amp; BibTeX citations
            </p>
          </div>
        </div>

        <a
          href={`https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>Open in Google Scholar</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
        <form onSubmit={handleSearchCitations} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C897F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paper title, authors, DOI, or research topic (e.g. CRISPR gene editing Doudna)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSearching ? 'Generating...' : 'Format Citation'}</span>
          </button>
        </form>
      </div>

      {/* Citation Cards */}
      {citationResult && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#D97757] block mb-1">
                Paper / Publication
              </span>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                {citationResult.title}
              </h3>
              <p className="text-xs text-[#8C897F] mt-1">
                {citationResult.authors} ({citationResult.year})
              </p>
            </div>

            {/* Formatted Citations */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              
              {/* APA 7th */}
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                    APA 7th Edition
                  </span>
                  <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                    {citationResult.apa}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(citationResult.apa, 'apa')}
                  className="p-2 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Copy APA Citation"
                >
                  {copiedFormat === 'apa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* MLA 9th */}
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                    MLA 9th Edition
                  </span>
                  <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                    {citationResult.mla}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(citationResult.mla, 'mla')}
                  className="p-2 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Copy MLA Citation"
                >
                  {copiedFormat === 'mla' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Chicago 17th */}
              <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                    Chicago 17th Edition
                  </span>
                  <p className="text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                    {citationResult.chicago}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(citationResult.chicago, 'chicago')}
                  className="p-2 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Copy Chicago Citation"
                >
                  {copiedFormat === 'chicago' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* In-text Citation & BibTeX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8C897F] block mb-1">
                      In-Text Citation
                    </span>
                    <span className="font-mono text-xs font-bold text-[#D97757]">
                      {citationResult.inText}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(citationResult.inText, 'intext')}
                    className="p-2 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-xs font-bold cursor-pointer"
                  >
                    {copiedFormat === 'intext' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#8C897F] block mb-1">
                      BibTeX Entry
                    </span>
                    <span className="font-mono text-[10px] text-[#8C897F] block truncate">
                      @article{'{'}...{'}'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(citationResult.bibtex, 'bibtex')}
                    className="p-2 rounded-xl bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-xs font-bold cursor-pointer"
                  >
                    {copiedFormat === 'bibtex' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
