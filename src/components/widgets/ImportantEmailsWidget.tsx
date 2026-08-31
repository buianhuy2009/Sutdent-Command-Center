import React from 'react';
import {
  Mail,
  ArrowRight,
  Sparkles,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { EmailAlert } from '../../types';
import { MOCK_EMAIL_ALERTS } from '../../data/mockData';

interface ImportantEmailsWidgetProps {
  onNavigate: (tabId: string) => void;
  onOpenQuickDraft?: (emailAlert?: EmailAlert) => void;
}

export const ImportantEmailsWidget: React.FC<ImportantEmailsWidgetProps> = ({
  onNavigate,
  onOpenQuickDraft,
}) => {
  // Only non-spam, high and medium urgency academic emails
  const importantEmails = MOCK_EMAIL_ALERTS.filter((e) => !e.isSpam).slice(0, 4);

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Important Academic Emails ({importantEmails.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('gmail')}
            className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Gmail Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {importantEmails.map((email) => {
            const isHigh = email.urgency === 'HIGH';

            return (
              <div
                key={email.id}
                onClick={() => {
                  if (onOpenQuickDraft) {
                    onOpenQuickDraft(email);
                  } else {
                    onNavigate('gmail');
                  }
                }}
                className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                    {email.sender}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {isHigh ? 'AI High Urgency' : 'AI Academic Notice'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#D97757] truncate group-hover:underline">
                  {email.subject}
                </h4>

                <p className="text-[11px] text-[#8C897F] line-clamp-1 leading-snug">
                  {email.oneLineSummary}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#8C897F] pt-1 border-t border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
                  <span>Click to draft AI reply</span>
                  <span className="font-semibold text-[#D97757] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <Send className="w-2.5 h-2.5" />
                    <span>Quick Reply</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>AI categorizes professor announcements &amp; homework alerts</span>
        <button
          onClick={() => onNavigate('gmail')}
          className="text-[#D97757] hover:underline font-bold text-xs cursor-pointer"
        >
          View All Emails
        </button>
      </div>
    </div>
  );
};
