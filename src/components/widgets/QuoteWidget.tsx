import React, { useState } from 'react';
import {
  Quote,
  Shuffle,
  Sparkles,
  Bookmark,
  Share2,
} from 'lucide-react';
import { getTodayQuote, QUOTE_BANK, DailyQuote } from '../../data/quotes';

export const QuoteWidget: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<DailyQuote>(getTodayQuote);
  const [isCopied, setIsCopied] = useState(false);

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * QUOTE_BANK.length);
    setCurrentQuote(QUOTE_BANK[randomIndex]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${currentQuote.quote}" — ${currentQuote.author} (${currentQuote.field})`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-white via-white to-orange-50/30 dark:from-[#1A1917] dark:via-[#1A1917] dark:to-[#221B17] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Quote of the Day
            </h3>
          </div>
          <button
            onClick={handleShuffle}
            className="p-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#D97757] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
            title="Random quote from bank of 80+ quotes"
          >
            <Shuffle className="w-3 h-3" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="py-4 space-y-3">
          <blockquote className="text-sm sm:text-base font-serif italic text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
            &ldquo;{currentQuote.quote}&rdquo;
          </blockquote>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block">
                {currentQuote.author}
              </span>
              <span className="text-[10px] text-[#8C897F] font-mono">
                {currentQuote.field}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-[11px] text-[#8C897F] hover:text-[#D97757] font-semibold transition-colors cursor-pointer"
            >
              {isCopied ? 'Copied to Clipboard' : 'Copy Quote'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>Curated collection of 80+ learning &amp; philosophy maxims</span>
        <span className="text-[10px] font-bold text-[#D97757]">Daily Reflection</span>
      </div>
    </div>
  );
};
