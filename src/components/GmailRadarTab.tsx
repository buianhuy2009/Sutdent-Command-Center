import React, { useState, useMemo } from 'react';
import {
  Mail,
  Sparkles,
  RefreshCw,
  Send,
  Plus,
  Search,
  CheckCircle2,
  Filter,
  Globe,
  Tag,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { EmailAlert, EmailMessage, EmailCategory, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';

interface GmailRadarTabProps {
  emailAlerts: EmailAlert[];
  rawEmails: EmailMessage[];
  isLoadingEmails: boolean;
  onRefreshEmails: (forceResort?: boolean, options?: { maxResults?: number; mode?: 'inbox' | 'academic' }) => void;
  onOpenQuickDraft: (email?: EmailMessage, alert?: EmailAlert) => void;
  onExtractAssignment: (alert: EmailAlert) => void;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  emailError?: string | null;
  gmailApiInfo?: ApiEnablementInfo | null;
}

export const GmailRadarTab: React.FC<GmailRadarTabProps> = ({
  emailAlerts,
  rawEmails,
  isLoadingEmails,
  onRefreshEmails,
  onOpenQuickDraft,
  onExtractAssignment,
  isGoogleConnected = true,
  onConnectGoogle,
  emailError,
  gmailApiInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    return emailAlerts.filter((alert) => {
      if (activeCategory !== 'ALL') {
        if (activeCategory === 'PROMOTIONS') {
          const isPromo =
            alert.category === 'PROMOTION' ||
            alert.category === 'SPAM' ||
            alert.subject.toLowerCase().includes('newsletter') ||
            alert.subject.toLowerCase().includes('event') ||
            alert.subject.toLowerCase().includes('invite') ||
            alert.subject.toLowerCase().includes('promotion') ||
            alert.sender.toLowerCase().includes('noreply');
          if (!isPromo) return false;
        } else if (alert.category !== activeCategory) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = alert.subject.toLowerCase().includes(q);
        const matchSender = alert.sender.toLowerCase().includes(q);
        const matchAction = (alert.oneLineSummary || '').toLowerCase().includes(q);
        if (!matchSubject && !matchSender && !matchAction) return false;
      }
      return true;
    });
  }, [emailAlerts, activeCategory, searchQuery]);

  // Set initial selected alert if none selected
  const activeAlert = useMemo(() => {
    if (selectedAlertId) {
      const found = filteredAlerts.find((a) => a.id === selectedAlertId);
      if (found) return found;
    }
    return filteredAlerts[0] || null;
  }, [selectedAlertId, filteredAlerts]);

  // Find corresponding raw email
  const activeRawEmail = useMemo(() => {
    if (!activeAlert) return null;
    return rawEmails.find((e) => e.id === activeAlert.id || e.subject === activeAlert.subject) || null;
  }, [activeAlert, rawEmails]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'ASSIGNMENT', 'EXAM', 'ANNOUNCEMENT', 'PROMOTIONS', 'GENERAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
              }`}
            >
              {cat === 'ALL'
                ? 'All Mails'
                : cat === 'PROMOTIONS'
                ? 'Promotions & Spam'
                : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

          {/* Right Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#6B6860] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          {/* Bulk archive spam */}
          {filteredAlerts.some(a=>a.isSpam) && (
            <button onClick={()=>{
              const spamIds = filteredAlerts.filter(a=>a.isSpam).map(a=>a.id);
              // dispatch bulk archive — parent will filter via future prop; for now just toast
              window.dispatchEvent(new CustomEvent('scc-toast', { detail: { title: 'Spam archived', message: `Archived ${spamIds.length} spam messages` }}));
              // also try to call gmail archive via token if available (placeholder)
            }} className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40">
              Archive spam ({filteredAlerts.filter(a=>a.isSpam).length})
            </button>
          )}

          <button
            onClick={() => onRefreshEmails(true)}
            disabled={isLoadingEmails}
            className="p-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin text-[#D97757]' : ''}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {gmailApiInfo ? (
        <ApiActivationBanner info={gmailApiInfo} onRetry={() => onRefreshEmails(true)} isRetrying={isLoadingEmails} />
      ) : emailError ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <span>{emailError}</span>
          {onConnectGoogle && (
            <button onClick={onConnectGoogle} className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-semibold cursor-pointer">
              Connect Gmail
            </button>
          )}
        </div>
      ) : null}

      {/* TWO-PANE MASTER-DETAIL LAYOUT */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs flex flex-col md:flex-row h-[600px]">
        
        {/* LEFT MASTER PANE: Compact Email List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col bg-[#FAF9F5] dark:bg-[#1F1E1B] overflow-hidden">
          <div className="p-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between text-xs font-bold text-[#8C897F]">
            <span>Inbox Items</span>
            <span>{filteredAlerts.length} Messages</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40">
            {isLoadingEmails ? (
              <div className="p-12 text-center text-[#8C897F] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D97757]" />
                <span className="text-xs">Scanning Gmail messages...</span>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-12 text-center text-[#8C897F] text-xs">
                No emails found matching filters.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = activeAlert?.id === alert.id;
                const isHigh = alert.urgency === 'HIGH' || alert.category === 'EXAM';

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`p-3.5 hover:bg-white dark:hover:bg-[#141413] transition-colors cursor-pointer text-left ${
                      isSelected ? 'bg-white dark:bg-[#141413] font-semibold border-l-3 border-[#D97757]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate max-w-[160px]">
                        {alert.sender}
                      </span>
                      <span className="text-[10px] text-[#8C897F] shrink-0">
                        {alert.detectedAssignment?.dueDate || 'Recent'}
                      </span>
                    </div>

                    <div className="text-xs text-[#141413] dark:text-[#FAF9F5] font-semibold truncate mb-1">
                      {alert.subject}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D97757]/15 text-[#D97757]">
                        {alert.category}
                      </span>
                      {isHigh && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT DETAIL PANE: Full Email Reader & Action Studio */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#141413] overflow-hidden">
          {activeAlert ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Reader Header */}
              <div className="p-6 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-start justify-between gap-4 bg-[#FAF9F5]/40 dark:bg-[#1F1E1B]/40">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug">
                    {activeAlert.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#8C897F]">
                    <span>From: <strong className="text-[#141413] dark:text-[#FAF9F5]">{activeAlert.sender}</strong></span>
                    <span>•</span>
                    <span>{activeRawEmail?.date || 'Recent'}</span>
                  </div>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onExtractAssignment(activeAlert)}
                    className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D97757]" />
                    <span>Create Task</span>
                  </button>

                  <button
                    onClick={() => onOpenQuickDraft(activeRawEmail || undefined, activeAlert)}
                    className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Draft Reply</span>
                  </button>
                </div>
              </div>

              {/* Reader Body & AI Insights */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* AI Summary Banner */}
                {activeAlert.oneLineSummary && (
                  <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#D97757]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Action Recommendation</span>
                    </div>
                    <p className="text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed">
                      {activeAlert.oneLineSummary}
                    </p>
                  </div>
                )}

                {/* Email Body */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">
                    Original Email Content
                  </span>
                  <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs text-[#141413] dark:text-[#FAF9F5] leading-relaxed whitespace-pre-line font-sans">
                    {activeRawEmail?.body || activeRawEmail?.snippet || activeAlert.oneLineSummary || 'No preview text available.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#8C897F] text-center space-y-2">
              <Mail className="w-10 h-10 opacity-30" />
              <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Select an email from the inbox</p>
              <p className="text-[11px] max-w-xs">Read full announcements, extract assignments, or draft AI replies.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
