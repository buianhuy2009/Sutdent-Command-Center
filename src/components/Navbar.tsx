import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bell,
  Search,
  RefreshCw,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  tier: 'urgent' | 'updates' | 'activity';
  title: string;
  description: string;
  link: string;
  source: string;
}

interface NavbarProps {
  activeTabLabel?: string;
  onOpenCommandPalette: () => void;
  onToggleAiChat: () => void;
  notifications?: NotificationItem[];
  isAiChatOpen?: boolean;
  onNotificationClick?: (n: NotificationItem) => void;
  onOpenGoogleSync?: () => void;
  isGoogleConnected?: boolean;
  isSyncingGoogle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTabLabel = 'Canvas LMS',
  onOpenCommandPalette,
  onToggleAiChat,
  notifications = [],
  isAiChatOpen = false,
  onNotificationClick,
  onOpenGoogleSync,
  isGoogleConnected = false,
  isSyncingGoogle = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasDismissedBadge, setHasDismissedBadge] = useState(false);
  const [platformKey, setPlatformKey] = useState('⌘K');
  useEffect(() => {
    const uaData = (navigator as any).userAgentData;
    const platform = uaData?.platform || (navigator as any).platform || navigator.userAgent;
    const isMac = /Mac|iPhone|iPad|iPod/.test(platform || '');
    setPlatformKey(isMac ? '⌘K' : 'Ctrl+K');
  }, []);
  useEffect(() => {
    if (!showNotifications) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNotifications(false); };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-root]')) setShowNotifications(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClickOutside); };
  }, [showNotifications]);

  const unreadCount = hasDismissedBadge ? 0 : notifications.length;

  return (
    <header role="banner" className="h-12 bg-white dark:bg-[#141413] border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* LEFT: Clean breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-[#6B6860]">
          <button onClick={() => window.dispatchEvent(new CustomEvent('scc-navigate', { detail: 'dashboard' }))} className="hover:text-[#D97757] hover:underline transition-colors cursor-pointer" aria-label="Go to Dashboard">StudentOS</button>
          <span className="mx-1.5 text-[#DFDACB] dark:text-[#2C2B27]">/</span>
          <span className="font-bold text-[#141413] dark:text-[#FAF9F5] truncate" aria-current="page">
            {activeTabLabel}
          </span>
        </nav>
      </div>

      {/* CENTER: Search - clean */}
      <div className="flex items-center justify-center flex-1 max-w-md px-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/30 rounded-xl py-1.5 px-3 text-xs flex items-center justify-between text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6B6860] group-hover:text-[#D97757] transition-colors" strokeWidth={1.75} />
            <span className="hidden sm:inline">Search or jump...</span>
            <span className="sm:hidden">Search</span>
          </div>
          <kbd className="hidden sm:inline text-[10px] font-mono bg-white dark:bg-[#252422] px-1.5 py-0.5 rounded border border-[#DFDACB] dark:border-[#2C2B27] text-[#6B6860]">
            {platformKey}
          </kbd>
        </button>
      </div>

      {/* RIGHT: Only essentials - Google Sync + AI Coach + Notifications */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenGoogleSync && (
          <button
            id="btn-nav-google-sync"
            onClick={onOpenGoogleSync}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isGoogleConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] text-[#6B6860] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'
            }`}
            title="Google Workspace Sync Hub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin text-[#D97757]' : isGoogleConnected ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="hidden md:inline text-[11px]">{isSyncingGoogle ? 'Syncing...' : isGoogleConnected ? 'Google Sync' : 'Connect Google'}</span>
          </button>
        )}

        <button
          id="btn-nav-ai-coach"
          onClick={onToggleAiChat}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
            isAiChatOpen
              ? 'bg-[#D97757] border-[#D97757] text-white shadow-xs'
              : 'bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border-[#D97757]/20'
          }`}
          title="AI Study Coach"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <span className="hidden sm:inline text-[11px]">AI Coach</span>
        </button>

        <div className="relative" data-notif-root>
          <button
            aria-label={`Notifications ${unreadCount ? `(${unreadCount} new)` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasDismissedBadge(true);
            }}
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); setShowNotifications(!showNotifications); setHasDismissedBadge(true);} if(e.key==='Escape') setShowNotifications(false); }}
            className="p-1.5 text-[#6B6860] hover:text-[#D97757] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] rounded-xl transition-colors cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" aria-hidden="true" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#141413]" aria-hidden="true" />
            )}
            {unreadCount > 0 && <span className="sr-only" aria-live="polite">{unreadCount} new</span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1917] rounded-2xl shadow-xl border border-[#DFDACB] dark:border-[#2C2B27] py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">Notifications</span>
                <span className="text-[10px] text-[#6B6860]">{notifications.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[#6B6860]">No new notifications</div>
                ) : (
                  notifications.map((n, i) => (
                    <button key={n.id || i} onClick={()=>{ setShowNotifications(false); onNotificationClick?.(n); if(n.link && n.link !== '#'){ window.open(n.link,'_blank'); } }} className="w-full text-left p-3 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer">
                      <div className="font-semibold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1.5">{n.title} {n.tier==='urgent' && <span className="px-1 py-0.5 rounded text-[9px] bg-rose-100 text-rose-700">Urgent</span>}</div>
                      <div className="text-[11px] text-[#6B6860]">{n.description}</div>
                      <span className="text-[10px] text-[#D97757] font-bold">Go → {n.source || 'Tracker'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
