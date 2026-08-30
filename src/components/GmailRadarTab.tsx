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
  MoreVertical,
} from 'lucide-react';
import { EmailAlert, EmailMessage, EmailCategory, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';

interface GmailRadarTabProps {
  emailAlerts: EmailAlert[];
  rawEmails: EmailMessage[];
  isLoadingEmails: boolean;
  onRefreshEmails: () => void;
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hideSpam, setHideSpam] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'vi' | 'en'>('all');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { isSpam?: boolean; category?: EmailCategory; categoryLabel?: string }>>({});

  // Merge server alerts with user manual classification adjustments
  const effectiveAlerts = useMemo(() => {
    return emailAlerts.map((alert) => {
      if (overrides[alert.id]) {
        return { ...alert, ...overrides[alert.id] };
      }
      return alert;
    });
  }, [emailAlerts, overrides]);

  const handleToggleSpam = (id: string, currentlySpam: boolean) => {
    const isNowSpam = !currentlySpam;
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        isSpam: isNowSpam,
        category: isNowSpam ? 'SPAM' : 'GENERAL',
        categoryLabel: isNowSpam ? 'Thư rác / Spam' : 'Thông báo học vụ',
      },
    }));
  };

  const handleChangeCategory = (id: string, newCat: EmailCategory) => {
    const isSpam = newCat === 'SPAM' || newCat === 'PROMOTION';
    const labelMap: Record<string, string> = {
      ASSIGNMENT: 'Bài tập / Assignment',
      EXAM: 'Lịch thi / Exam',
      ANNOUNCEMENT: 'Thông báo / Announcement',
      SCHEDULE: 'Lịch học / Schedule',
      GENERAL: 'Thông báo chung',
      SPAM: 'Thư rác / Spam',
      PROMOTION: 'Khuyến mãi / Promotion',
    };
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        isSpam,
        category: newCat,
        categoryLabel: labelMap[newCat] || 'General',
      },
    }));
  };

  // Stats calculation
  const spamCount = useMemo(() => {
    return effectiveAlerts.filter((a) => a.isSpam || a.category === 'SPAM' || a.category === 'PROMOTION').length;
  }, [effectiveAlerts]);

  const urgentCount = useMemo(() => {
    return effectiveAlerts.filter((a) => !a.isSpam && (a.urgency === 'HIGH' || a.category === 'EXAM')).length;
  }, [effectiveAlerts]);

  const vietnameseCount = useMemo(() => {
    return effectiveAlerts.filter((a) => a.language === 'vi').length;
  }, [effectiveAlerts]);

  // Filtered emails
  const filteredAlerts = useMemo(() => {
    return effectiveAlerts.filter((alert) => {
      // 1. Spam filter toggle
      const isSpamItem = alert.isSpam || alert.category === 'SPAM' || alert.category === 'PROMOTION';
      if (hideSpam && isSpamItem && activeCategory !== 'spam') {
        return false;
      }

      // 2. Category tab
      if (activeCategory === 'all') {
        // Show everything under all emails
      } else if (activeCategory === 'academic') {
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
  }, [effectiveAlerts, hideSpam, activeCategory, selectedLanguage, searchQuery]);

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Gmail Scanner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Teacher emails, announcements, and action items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            id="btn-open-quick-draft-top"
            onClick={() => onOpenQuickDraft()}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-rose-500" />
            <span>Draft Email</span>
          </button>

          <button
            id="btn-scan-inbox-now"
            onClick={onRefreshEmails}
            disabled={isLoadingEmails}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmails ? 'animate-spin' : ''}`} />
            <span>{isLoadingEmails ? 'Scanning...' : 'Scan Inbox'}</span>
          </button>
        </div>
      </div>

      {/* API Disabled or Error Banner */}
      {gmailApiInfo ? (
        <ApiActivationBanner
          info={gmailApiInfo}
          onRetry={onRefreshEmails}
          isRetrying={isLoadingEmails}
        />
      ) : emailError ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{emailError}</span>
          </div>
          {onConnectGoogle && (
            <button
              onClick={onConnectGoogle}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer text-xs"
            >
              Reconnect Gmail
            </button>
          )}
        </div>
      ) : null}

      {/* Streamlined Filter & Control Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 sm:p-4 shadow-xs space-y-3">
        {/* Main Category Tabs & Tools Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Emails', count: effectiveAlerts.length },
              { id: 'academic', label: 'Academic & School', count: effectiveAlerts.filter((a) => !a.isSpam).length },
              { id: 'spam', label: 'Spam & Promo', count: spamCount, isSpamTab: true },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    if (tab.id === 'spam') setHideSpam(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? tab.isSpamTab
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-black/5 dark:bg-white/10'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter & Search Collapsible Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                showFilters || searchQuery.trim() || selectedLanguage !== 'all'
                  ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/40'
                  : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26]'
              }`}
              title="Search and category filters"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showFilters ? 'Hide Tools' : 'Search & Filters'}</span>
              {(searchQuery.trim() || selectedLanguage !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-[#D97757]" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Search & Extended Category Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27] space-y-3 animate-in fade-in duration-150">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sender, subject, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] placeholder:text-[#8C897F]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sub-Filters: Specific School Categories & Language & Spam */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'exams', label: 'Exams & Quizzes' },
                  { id: 'announcements', label: 'Announcements' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveCategory(activeCategory === sub.id ? 'all' : sub.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer border ${
                      activeCategory === sub.id
                        ? 'bg-[#D97757] text-white border-[#D97757]'
                        : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Language Selector & Spam Toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#8C897F]" />
                  <div className="flex bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-lg p-0.5 border border-[#DFDACB] dark:border-[#2C2B27]">
                    {(['all', 'vi', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-[#D97757] text-white'
                            : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                        }`}
                      >
                        {lang === 'all' ? 'All' : lang === 'vi' ? 'Tiếng Việt' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hideSpam}
                    onChange={(e) => setHideSpam(e.target.checked)}
                    className="rounded text-[#D97757] focus:ring-[#D97757] h-3.5 w-3.5 border-[#DFDACB] dark:border-[#2C2B27]"
                  />
                  <span>Hide Spam</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email List Feed */}
      <div className="space-y-3">
        {!isGoogleConnected ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <Mail className="w-10 h-10 mx-auto text-rose-500 mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Gmail Scanner Disconnected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Connect your Google account with Gmail permissions to scan your real academic emails, extract course deadlines, and filter spam.
            </p>
            {onConnectGoogle && (
              <button
                onClick={onConnectGoogle}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Connect Google Account</span>
              </button>
            )}
          </div>
        ) : isLoadingEmails ? (
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
                <div className="mt-3 pt-2.5 border-t border-[#DFDACB]/60 dark:border-[#2C2B27] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setExpandedEmailId(isExpanded ? null : alert.id)}
                    className="text-[11px] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Message' : 'View Message'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isSpam && (
                      <button
                        id={`btn-reply-${alert.id}`}
                        onClick={() => onOpenQuickDraft(alert.rawEmail, alert)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/30 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Quick Reply</span>
                      </button>
                    )}

                    {/* Compact More Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === alert.id ? null : alert.id)}
                        className="p-1.5 rounded-xl text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27] transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === alert.id && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              handleToggleSpam(alert.id, Boolean(alert.isSpam));
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-[#EFECE2] dark:hover:bg-[#252422] flex items-center gap-2 text-[#141413] dark:text-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            <span>{alert.isSpam ? '✓ Mark Not Spam' : '⚑ Mark as Spam'}</span>
                          </button>
                          {!alert.isSpam && (
                            <div className="px-3 py-1 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]">
                              <span className="text-[10px] font-bold text-[#8C897F] block mb-1">Move Category</span>
                              <select
                                value={alert.category}
                                onChange={(e) => {
                                  handleChangeCategory(alert.id, e.target.value as EmailCategory);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-[11px] font-semibold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg px-2 py-1 text-[#141413] dark:text-[#FAF9F5] cursor-pointer"
                              >
                                <option value="ASSIGNMENT">Assignment</option>
                                <option value="EXAM">Exam / Quiz</option>
                                <option value="ANNOUNCEMENT">Announcement</option>
                                <option value="SCHEDULE">Schedule</option>
                                <option value="GENERAL">General</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Raw Email Body with Fluid CSS Grid Accordion */}
                <div className={`accordion-wrapper ${isExpanded && alert.rawEmail ? 'is-expanded' : ''}`}>
                  <div className="accordion-inner">
                    {alert.rawEmail && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1.5">
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
