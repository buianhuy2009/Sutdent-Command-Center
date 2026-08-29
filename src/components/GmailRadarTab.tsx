import React, { useState, useMemo } from 'react';
import {
  Mail,
  Sparkles,
  RefreshCw,
  Send,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Filter,
  Globe,
  Tag,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { EmailAlert, EmailMessage, EmailCategory } from '../types';

interface GmailRadarTabProps {
  emailAlerts: EmailAlert[];
  rawEmails: EmailMessage[];
  isLoadingEmails: boolean;
  onRefreshEmails: () => void;
  onOpenQuickDraft: (email?: EmailMessage, alert?: EmailAlert) => void;
  onExtractAssignment: (alert: EmailAlert) => void;
}

export const GmailRadarTab: React.FC<GmailRadarTabProps> = ({
  emailAlerts,
  rawEmails,
  isLoadingEmails,
  onRefreshEmails,
  onOpenQuickDraft,
  onExtractAssignment,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('academic');
  const [hideSpam, setHideSpam] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'vi' | 'en'>('all');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Stats calculation
  const spamCount = useMemo(() => {
    return emailAlerts.filter((a) => a.isSpam || a.category === 'SPAM' || a.category === 'PROMOTION').length;
  }, [emailAlerts]);

  const urgentCount = useMemo(() => {
    return emailAlerts.filter((a) => !a.isSpam && (a.urgency === 'HIGH' || a.category === 'EXAM')).length;
  }, [emailAlerts]);

  const vietnameseCount = useMemo(() => {
    return emailAlerts.filter((a) => a.language === 'vi').length;
  }, [emailAlerts]);

  // Filtered emails
  const filteredAlerts = useMemo(() => {
    return emailAlerts.filter((alert) => {
      // 1. Spam filter toggle
      const isSpamItem = alert.isSpam || alert.category === 'SPAM' || alert.category === 'PROMOTION';
      if (hideSpam && isSpamItem && activeCategory !== 'spam') {
        return false;
      }

      // 2. Category tab
      if (activeCategory === 'academic') {
        if (isSpamItem) return false;
      } else if (activeCategory === 'assignments') {
        if (alert.category !== 'ASSIGNMENT') return false;
      } else if (activeCategory === 'exams') {
        if (alert.category !== 'EXAM') return false;
      } else if (activeCategory === 'announcements') {
        if (alert.category !== 'ANNOUNCEMENT' && alert.category !== 'SCHEDULE') return false;
      } else if (activeCategory === 'spam') {
        if (!isSpamItem) return false;
      }

      // 3. Language filter
      if (selectedLanguage !== 'all' && alert.language && alert.language !== selectedLanguage) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSender = alert.sender.toLowerCase().includes(q);
        const matchSubject = alert.subject.toLowerCase().includes(q);
        const matchSummary = alert.oneLineSummary.toLowerCase().includes(q);
        const matchRaw = alert.rawEmail?.snippet.toLowerCase().includes(q) || false;
        if (!matchSender && !matchSubject && !matchSummary && !matchRaw) {
          return false;
        }
      }

      return true;
    });
  }, [emailAlerts, hideSpam, activeCategory, selectedLanguage, searchQuery]);

  const getUrgencyBadge = (urgency: string, isSpam?: boolean) => {
    if (isSpam) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5 text-amber-500" />
          <span>SPAM / PROMO</span>
        </span>
      );
    }

    switch (urgency) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
            HIGH URGENCY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
            ACTION NEEDED
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase">
            UPCOMING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Smart Gmail Academic Scanner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white tracking-tight">
            Academic Inbox Signals & AI Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Automatically isolates school assignments, exams, and instructor updates while filtering out spam, marketing newsletters, and shopping promotions (supports English & Tiếng Việt).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="btn-scan-inbox-now"
            onClick={onRefreshEmails}
            disabled={isLoadingEmails}
            className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmails ? 'animate-spin' : ''}`} />
            <span>{isLoadingEmails ? 'Scanning Inbox...' : 'Scan Inbox with AI'}</span>
          </button>

          <button
            id="btn-open-quick-draft-top"
            onClick={() => onOpenQuickDraft()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Compose a polite draft to your teacher"
          >
            <Send className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Draft to Teacher</span>
          </button>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'academic', label: 'Academic & School', count: emailAlerts.filter((a) => !a.isSpam).length },
              { id: 'assignments', label: 'Assignments', count: emailAlerts.filter((a) => a.category === 'ASSIGNMENT').length },
              { id: 'exams', label: 'Exams & Quizzes', count: emailAlerts.filter((a) => a.category === 'EXAM').length },
              { id: 'announcements', label: 'Announcements', count: emailAlerts.filter((a) => a.category === 'ANNOUNCEMENT').length },
              { id: 'spam', label: 'Spam / Promotions', count: spamCount, isSpamTab: true },
              { id: 'all', label: 'All Emails', count: emailAlerts.length },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    if (tab.id === 'spam') setHideSpam(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? tab.isSpamTab
                        ? 'bg-amber-600 text-white font-semibold shadow-xs'
                        : 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.isSpamTab && tab.count > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spam Toggle Checkbox */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none ml-auto">
            <input
              type="checkbox"
              checked={hideSpam}
              onChange={(e) => setHideSpam(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-700"
            />
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hide Spam & Promotions</span>
            </span>
          </label>
        </div>

        {/* Search & Language Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, subject, assignment, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Language:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  selectedLanguage === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedLanguage('vi')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  selectedLanguage === 'vi'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tiếng Việt (Vietnamese emails)"
              >
                Tiếng Việt ({vietnameseCount})
              </button>
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  selectedLanguage === 'en'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email List Feed */}
      <div className="space-y-3">
        {isLoadingEmails ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Scanning & Categorizing Inbox with Gemini AI...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Extracting deadlines, detecting spam promotions, and processing bilingual messages.
            </p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Emails Match the Selected Filter
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No messages found matching "${searchQuery}". Try clearing the search term.`
                : activeCategory === 'spam'
                ? 'No spam or promotional emails detected. Your inbox is clean!'
                : 'No urgent school assignments or announcements in this category.'}
            </p>
            {(searchQuery || activeCategory !== 'academic' || selectedLanguage !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('academic');
                  setSelectedLanguage('all');
                }}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedEmailId === alert.id;
            const isHigh = alert.urgency === 'HIGH';
            const isMed = alert.urgency === 'MEDIUM';
            const isSpam = alert.isSpam || alert.category === 'SPAM' || alert.category === 'PROMOTION';

            return (
              <div
                key={alert.id}
                id={`email-alert-card-${alert.id}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                  isSpam
                    ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                    : isHigh
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                    : isMed
                    ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Row: Badges, Sender, Language, Timestamp */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {getUrgencyBadge(alert.urgency, isSpam)}

                    {alert.categoryLabel && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {alert.categoryLabel}
                      </span>
                    )}

                    {alert.language === 'vi' && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        TIẾNG VIỆT
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {alert.sender}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {alert.rawEmail?.date || 'Recent'}
                  </span>
                </div>

                {/* Email Subject */}
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2">
                  {alert.subject}
                </h4>

                {/* 1-Line AI Summary Banner */}
                <div
                  className={`mt-2.5 p-2.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium ${
                    isSpam
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                      : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200'
                  }`}
                >
                  {isSpam ? (
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="leading-relaxed">
                      {alert.oneLineSummary}
                    </p>
                    {isSpam && alert.spamReason && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                        Reason: {alert.spamReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detected Assignment Box if applicable */}
                {alert.detectedAssignment?.isAssignment && !isSpam && (
                  <div className="mt-3 p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="truncate">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        ⚡ Detected School Task:
                      </span>{' '}
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                        {alert.detectedAssignment.name} ({alert.detectedAssignment.subject})
                      </span>
                      {alert.detectedAssignment.dueDate && (
                        <span className="text-emerald-700 dark:text-emerald-400 ml-1.5 font-mono text-[11px]">
                          • Due: {alert.detectedAssignment.dueDate}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onExtractAssignment(alert)}
                      className="shrink-0 px-2.5 py-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Tracker</span>
                    </button>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedEmailId(isExpanded ? null : alert.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Full Content' : 'View Full Message'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {!isSpam && (
                    <button
                      id={`btn-reply-${alert.id}`}
                      onClick={() => onOpenQuickDraft(alert.rawEmail, alert)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Quick Draft Reply</span>
                    </button>
                  )}
                </div>

                {/* Expanded Raw Email Body */}
                {isExpanded && alert.rawEmail && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5">
                      <p>
                        <strong className="text-slate-700 dark:text-slate-300">From:</strong>{' '}
                        {alert.rawEmail.sender} {alert.rawEmail.senderEmail && `<${alert.rawEmail.senderEmail}>`}
                      </p>
                      <p>
                        <strong className="text-slate-700 dark:text-slate-300">Subject:</strong>{' '}
                        {alert.rawEmail.subject}
                      </p>
                      <p>
                        <strong className="text-slate-700 dark:text-slate-300">Date:</strong>{' '}
                        {alert.rawEmail.date}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                      {alert.rawEmail.snippet}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
