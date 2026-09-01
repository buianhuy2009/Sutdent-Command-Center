import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bell,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronUp,
  Timer,
  Music,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import { ambientAudio, TrackId, AMBIENT_TRACKS } from '../services/ambientAudio';

export interface NotificationItem {
  id: string;
  tier: 'urgent' | 'updates' | 'activity';
  title: string;
  description: string;
  link: string;
  source: string;
}

function SyncIndicator({ isRefreshing, lastSyncedAt }: { isRefreshing?: boolean; lastSyncedAt?: Date | null }) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pending, setPending] = useState<number>(0);
  const [showSynced, setShowSynced] = useState(false);
  const [syncedText, setSyncedText] = useState('');
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const bc = (() => { try { return new BroadcastChannel('scc-sync'); } catch { return null; } })();
    const updatePending = async () => {
      try {
        const raw = localStorage.getItem('scc_user_assignments_v2');
        const arr = raw ? JSON.parse(raw) : [];
        const localOnly = arr.filter((a: any) => a.source === 'Manual' || !a.sheetRowIndex).length;
        let queueLen = 0;
        try { const { db } = await import('../services/db'); queueLen = await db.assignmentsQueue.count(); } catch {}
        setPending(localOnly + queueLen);
      } catch {}
    };
    updatePending();
    const onStorage = (e: StorageEvent) => { if (e.key === 'scc_user_assignments_v2') updatePending(); };
    window.addEventListener('storage', onStorage);
    bc?.addEventListener('message', updatePending as any);
    const iv = setInterval(updatePending, 5000);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.removeEventListener('storage', onStorage); bc?.close(); clearInterval(iv); };
  }, []);
  // GitHub-style transient Synced 2m ago
  useEffect(() => {
    if (isRefreshing || !isOnline || !lastSyncedAt) { setShowSynced(false); return; }
    const diff = Date.now() - lastSyncedAt.getTime();
    if (diff < 120000) {
      const mins = Math.max(1, Math.round(diff/60000));
      setSyncedText(mins === 1 ? 'Synced 1m ago' : `Synced ${mins}m ago`);
      setShowSynced(true);
      const t = setTimeout(()=> setShowSynced(false), 3000);
      return ()=> clearTimeout(t);
    }
  }, [lastSyncedAt, isRefreshing, isOnline]);

  if (isRefreshing) {
    return <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600" title="Syncing to Google"><Loader2 className="w-3 h-3 animate-spin" /><span className="hidden sm:inline">Syncing…</span></span>;
  }
  if (!isOnline) {
    return <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600" title={`Working offline. ${pending} tasks saved locally.`}><AlertTriangle className="w-3 h-3" /><span className="hidden sm:inline">Offline • {pending} local</span><span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/30" /></span>;
  }
  if (showSynced) {
    return <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 animate-in fade-in"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{syncedText}</span>;
  }
  return null;
}

interface NavbarProps {
  activeTabLabel?: string;
  onOpenCommandPalette: () => void;
  onToggleAiChat: () => void;
  notifications?: NotificationItem[];
  isAiChatOpen?: boolean;
  zenFocusMode?: boolean;
  onToggleZenFocus?: () => void;
  focusTimerSeconds?: number;
  isFocusTimerRunning?: boolean;
  onToggleFocusTimer?: () => void;
  onResetFocusTimer?: () => void;
  onOpenGeminiSettings?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  onToggleCollapseBar?: () => void;
  onNotificationClick?: (n: NotificationItem) => void;
  lastSyncedAt?: Date | null;
  clockText?: string;
  dateText?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTabLabel = 'Canvas LMS',
  onOpenCommandPalette,
  onToggleAiChat,
  notifications = [],
  isAiChatOpen = false,
  zenFocusMode = false,
  onToggleZenFocus,
  focusTimerSeconds,
  isFocusTimerRunning = false,
  onToggleFocusTimer,
  onResetFocusTimer,
  onOpenGeminiSettings,
  onRefreshAll,
  isRefreshing = false,
  onToggleCollapseBar,
  onNotificationClick,
  lastSyncedAt,
  clockText,
  dateText,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasDismissedBadge, setHasDismissedBadge] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackId>(ambientAudio.getTrack());
  const [showMore, setShowMore] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [platformKey, setPlatformKey] = useState('⌘K');
  useEffect(() => {
    // platform detection via userAgentData preferred
    const uaData = (navigator as any).userAgentData;
    const platform = uaData?.platform || (navigator as any).platform || navigator.userAgent;
    const isMac = /Mac|iPhone|iPad|iPod/.test(platform || '');
    setPlatformKey(isMac ? '⌘K' : 'Ctrl+K');
    const onResize = () => setIsNarrow(window.innerWidth < 1100);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    if (!showNotifications) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNotifications(false); };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-root]')) setShowNotifications(false);
      if (!target.closest('[data-more-root]')) setShowMore(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClickOutside); };
  }, [showNotifications]);

  useEffect(() => {
    const unsubscribe = ambientAudio.subscribe((track) => {
      setCurrentTrack(track);
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = hasDismissedBadge ? 0 : notifications.length;
  const currentTrackInfo =
    AMBIENT_TRACKS.find((t) => t.id === currentTrack) || AMBIENT_TRACKS[0];

  return (
    <header role="banner" className="h-12 bg-[#FAF9F5]/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      
      {/* LEFT: Breadcrumb with Rich Sync Indicator + clock moved from DashboardHome */}
      <div className="flex items-center gap-2.5 min-w-0">
        <SyncIndicator isRefreshing={isRefreshing} lastSyncedAt={lastSyncedAt} />
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs font-semibold text-[#6B6860]">
            <span>StudentOS</span>
            <span className="mx-1.5 text-[#DFDACB] dark:text-[#2C2B27]">/</span>
            <span className="font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
              {activeTabLabel}
            </span>
          </div>
          {clockText && dateText && (
            <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-[#DFDACB] dark:border-[#2C2B27] text-[11px] font-mono text-[#6B6860]">
              <span>{dateText}</span>
              <span className="font-bold">{clockText}</span>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Floating Spotlight Search Pill (Cmd+K) & Music Button */}
      <div className="flex sm:hidden items-center justify-center px-2">
        <button onClick={onOpenCommandPalette} aria-label="Open command palette" className="p-2 rounded-xl bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] text-[#6B6860]"><Search className="w-4 h-4" strokeWidth={1.75} /></button>
      </div>
      <div className="hidden sm:flex items-center justify-center flex-1 max-w-md px-4 gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 rounded-xl py-1 px-3 text-xs flex items-center justify-between text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6B6860] group-hover:text-[#D97757] transition-colors" strokeWidth={1.75} />
            <span>Search or command...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-[#FAF9F5] dark:bg-[#252422] px-1.5 py-0.5 rounded border border-[#DFDACB] dark:border-[#2C2B27] text-[#6B6860]">
            {platformKey}
          </kbd>
        </button>

        {/* Single Music Button next to Search bar — hidden in narrow overflow */}
        {!isNarrow && (
          <button
            onClick={() => ambientAudio.cycleTrack()}
            aria-live="polite"
            aria-label={`Focus music ${currentTrackInfo.shortLabel}, click to cycle`}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              currentTrack !== 'none'
                ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/40 shadow-2xs'
                : 'bg-white dark:bg-[#1A1917] text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] border-[#DFDACB] dark:border-[#2C2B27]'
            }`}
            title="Click to cycle focus music track"
          >
            <Music className={`w-3.5 h-3.5 ${currentTrack !== 'none' ? 'text-[#D97757] animate-pulse' : ''}`} strokeWidth={1.75} />
            <span className="text-[11px] font-bold">
              {currentTrackInfo.shortLabel}
            </span>
          </button>
        )}
      </div>

      {/* RIGHT: High-Density Control Cluster — collapses to More ••• on <1100px */}
      <div className="flex items-center space-x-1.5 shrink-0">
        
        {/* Sync / Reload Button — always visible */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Sync Workspace Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D97757]' : ''}`} strokeWidth={1.75} />
          </button>
        )}

        {/* Zen Focus Mode Timer next to Reload in Menu */}
        {(zenFocusMode || isFocusTimerRunning) && focusTimerSeconds !== undefined && (
          <div className="flex items-center gap-1.5 bg-[#EFECE2] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-[#141413] dark:text-[#FAF9F5] animate-in fade-in duration-200">
            <Timer className="w-3.5 h-3.5 text-[#D97757] shrink-0" strokeWidth={1.75} />
            <span>
              {Math.floor(focusTimerSeconds / 60)}:
              {(focusTimerSeconds % 60).toString().padStart(2, '0')}
            </span>
            {onToggleFocusTimer && (
              <button
                onClick={onToggleFocusTimer}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D97757] text-white hover:bg-[#C86646] transition-colors cursor-pointer"
              >
                {isFocusTimerRunning ? 'Pause' : 'Start'}
              </button>
            )}
            {onResetFocusTimer && (
              <button
                onClick={onResetFocusTimer}
                className="text-[10px] text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] cursor-pointer ml-0.5 hidden sm:inline"
                title="Reset Timer"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Zen Focus Mode Toggle Button — hidden in narrow, moved to overflow */}
        {onToggleZenFocus && !isNarrow && (
          <button
            id="btn-nav-zen-focus"
            onClick={onToggleZenFocus}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              zenFocusMode
                ? 'bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] border-[#141413] dark:border-[#FAF9F5]'
                : 'bg-white dark:bg-[#1A1917] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] border-[#DFDACB] dark:border-[#2C2B27]'
            }`}
            title="Toggle Zen Focus Mode"
          >
            <Timer className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="hidden md:inline text-[11px]">{zenFocusMode ? 'Zen Active' : 'Focus'}</span>
          </button>
        )}

        {/* AI Study Coach Pill — always visible */}
        <button
          id="btn-nav-ai-coach"
          onClick={onToggleAiChat}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
            isAiChatOpen
              ? 'bg-[#D97757] border-[#D97757] text-white shadow-xs'
              : 'bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border-[#D97757]/30'
          }`}
          title="Open AI Study Coach"
        >
          <Sparkles className="w-3 h-3 text-[#D97757] shrink-0" strokeWidth={1.75} />
          <span className="hidden md:inline text-[11px]">AI Coach</span>
        </button>

        {/* Settings Button — hidden in narrow */}
        {onOpenGeminiSettings && !isNarrow && (
          <button
            onClick={onOpenGeminiSettings}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Settings & Keys"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}

        {/* More ••• overflow menu <1100px */}
        {isNarrow && (
          <div className="relative" data-more-root>
            <button onClick={()=>setShowMore(v=>!v)} className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]" title="More">
              <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            {showMore && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1917] rounded-2xl shadow-xl border border-[#DFDACB] dark:border-[#2C2B27] py-2 z-50 text-xs">
                <button onClick={()=>{ ambientAudio.cycleTrack(); setShowMore(false); }} className="w-full text-left px-3 py-2 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] flex items-center gap-2"><Music className="w-3.5 h-3.5" /> Music: {currentTrackInfo.shortLabel}</button>
                {onToggleZenFocus && <button onClick={()=>{ onToggleZenFocus(); setShowMore(false); }} className="w-full text-left px-3 py-2 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] flex items-center gap-2"><Timer className="w-3.5 h-3.5" /> {zenFocusMode ? 'Exit Zen' : 'Enter Zen Focus'}</button>}
                {onOpenGeminiSettings && <button onClick={()=>{ onOpenGeminiSettings(); setShowMore(false); }} className="w-full text-left px-3 py-2 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] flex items-center gap-2"><SlidersHorizontal className="w-3.5 h-3.5" /> Settings</button>}
              </div>
            )}
          </div>
        )}

        {/* Notification Bell — keyboard accessible, typed */}
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
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27] relative focus-visible:ring-2"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" aria-hidden="true" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#FAF9F5] dark:ring-[#141413]" aria-hidden="true" />
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1917] rounded-2xl shadow-xl border border-[#DFDACB] dark:border-[#2C2B27] py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">Notifications</span>
                <span className="text-[10px] text-[#6B6860]">{notifications.length} alerts</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[#6B6860]">No new notifications</div>
                ) : (
                  notifications.map((n, i) => (
                    <button key={n.id || i} onClick={()=>{ setShowNotifications(false); onNotificationClick?.(n); if(n.link && n.link !== '#'){ window.open(n.link,'_blank'); } }} className="w-full text-left p-3 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer">
                      <div className="font-semibold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1.5">{n.title} {n.tier==='urgent' && <span className="px-1 py-0.5 rounded text-[9px] bg-rose-100 text-rose-700">Urgent</span>}</div>
                      <div className="text-[11px] text-[#6B6860]">{n.description}</div>
                      <span className="text-[10px] text-[#D97757] font-bold">Jump → {n.source || 'Tracker'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapse Top Bar Toggle */}
        {onToggleCollapseBar && (
          <button
            onClick={onToggleCollapseBar}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Collapse top bar to maximize app space"
          >
            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </header>
  );
};
