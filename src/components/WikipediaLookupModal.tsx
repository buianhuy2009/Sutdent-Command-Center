import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { fetchWikipediaSummary, WikipediaSummary } from '../services/publicApis';

interface WikipediaLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const WikipediaLookupModal: React.FC<WikipediaLookupModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [summary, setSummary] = useState<WikipediaSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchTerm(initialQuery);
        handleLookup(initialQuery);
      } else {
        setSearchTerm('');
        setSummary(null);
        setError(null);
      }
    }
  }, [isOpen, initialQuery]);

  const handleLookup = async (term: string) => {
    if (!term.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWikipediaSummary(term);
      if (data) {
        setSummary(data);
      } else {
        setError(`No exact Wikipedia entry found for "${term}". Try another spelling or related term.`);
      }
    } catch {
      setError('Failed to contact Wikipedia API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchTerm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#1A1917] w-full max-w-lg rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header & Search */}
        <div className="p-5 border-b border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#141413] dark:text-[#FAF9F5]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Wikipedia Quick Look</h3>
                <p className="text-[10px] text-[#8C897F]">Live verified encyclopedia summaries</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lookup any concept, theorem, historical event..."
                className="w-full pl-8 pr-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchTerm.trim()}
              className="px-3.5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-96 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-[#8C897F] text-xs space-y-2">
              <RefreshCw className="w-6 h-6 text-[#D97757] animate-spin mx-auto opacity-70" />
              <p>Querying Wikipedia encyclopedia...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-900 dark:text-amber-300">
              {error}
            </div>
          ) : summary ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start gap-4">
                {summary.thumbnailUrl && (
                  <img
                    src={summary.thumbnailUrl}
                    alt={summary.title}
                    className="w-20 h-20 object-cover rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shrink-0"
                  />
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug">
                    {summary.displayTitle}
                  </h4>
                  {summary.description && (
                    <p className="text-xs text-[#D97757] font-medium">
                      {summary.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                {summary.extract}
              </div>

              <div className="flex justify-end">
                <a
                  href={summary.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Read Full Article</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#8C897F] text-xs space-y-1">
              <Globe className="w-8 h-8 mx-auto opacity-30" />
              <p>Type any keyword to inspect its verified Wikipedia definition</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
