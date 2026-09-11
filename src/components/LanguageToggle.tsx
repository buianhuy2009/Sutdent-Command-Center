import React from 'react';
import { useLang, LANG_OPTIONS } from '../services/i18n';

export const LanguageToggle: React.FC<{ compact?: boolean; className?: string }> = ({ compact, className }) => {
  const [lang, setLang] = useLang();
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border border-[#E8E6DC] dark:border-[#4F4A3E] bg-white dark:bg-[#262624] ${className ?? ''}`}
      role="group"
      aria-label="Language / Ngôn ngữ"
      title="Language / Ngôn ngữ"
    >
      {LANG_OPTIONS.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setLang(o.id)}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              active
                ? 'bg-[#C96442] text-white shadow-xs'
                : 'text-[#5E5D59] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#F5F4ED]'
            }`}
          >
            {compact ? o.id.toUpperCase() : o.label}
          </button>
        );
      })}
    </div>
  );
};
