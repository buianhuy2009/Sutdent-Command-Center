import React, { useState } from 'react';
import {
  PenTool,
  ArrowRight,
  Check,
  FileText,
} from 'lucide-react';

interface ScratchpadWidgetProps {
  onNavigate: (tabId: string) => void;
}

export const ScratchpadWidget: React.FC<ScratchpadWidgetProps> = ({
  onNavigate,
}) => {
  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    try {
      return localStorage.getItem('scc_dashboard_scratchpad') || '';
    } catch {
      return '';
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpadText(val);
    try {
      localStorage.setItem('scc_dashboard_scratchpad', val);
    } catch {}
  };

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Lecture Scratchpad &amp; Quick Capture
            </h3>
          </div>
          <span className="text-[10px] text-[#8C897F] font-mono">
            Auto-Saved Locally
          </span>
        </div>

        <div className="mt-4">
          <textarea
            rows={5}
            value={scratchpadText}
            onChange={handleChange}
            placeholder="Jot down quick homework cues, professor reminders, problem set tips, or formulas..."
            className="w-full p-3.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none leading-relaxed"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>Persistent across tabs and restarts</span>
        <button
          onClick={() => onNavigate('notes-markdown')}
          className="text-[#D97757] hover:underline font-bold text-xs cursor-pointer"
        >
          Open Markdown Notes
        </button>
      </div>
    </div>
  );
};
