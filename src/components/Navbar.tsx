import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  ExternalLink,
  Key,
  Search,
  RefreshCw,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  activeTabLabel?: string;
  onOpenCommandPalette: () => void;
  onToggleAiChat: () => void;
  notifications?: any[];
  isAiChatOpen?: boolean;
  zenFocusMode?: boolean;
  onToggleZenFocus?: () => void;
  onOpenGeminiSettings?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTabLabel = 'Canvas LMS',
  onOpenCommandPalette,
  onToggleAiChat,
  notifications = [],
  isAiChatOpen = false,
  zenFocusMode = false,
  onToggleZenFocus,
  onOpenGeminiSettings,
  onRefreshAll,
  isRefreshing = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasDismissedBadge, setHasDismissedBadge] = useState(false);
  const [notificationTier, setNotificationTier] = useState<'urgent' | 'updates' | 'activity'>('urgent');

  const unreadCount = hasDismissedBadge ? 0 : notifications.length;

  return (
    <header className="h-12 bg-[#FAF9F5]/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      
      {/* LEFT: macOS Window Breadcrumb with Green Sync Status Dot */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="System Live & Synced" />
          <div className="flex items-center text-xs font-semibold text-[#8C897F]">
            <span>StudentOS</span>
            <span className="mx-1.5 text-[#DFDACB] dark:text-[#2C2B27]">/</span>
            <span className="font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
              {activeTabLabel}
            </span>
          </div>
        </div>
      </div>

      {/* CENTER: Floating Spotlight Search Pill (Cmd+K) */}
      <div className="hidden sm:flex items-center justify-center flex-1 max-w-sm px-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 rounded-xl py-1 px-3 text-xs flex items-center justify-between text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#8C897F] group-hover:text-[#D97757] transition-colors" />
            <span>Search or command...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-[#FAF9F5] dark:bg-[#252422] px-1.5 py-0.5 rounded border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* RIGHT: High-Density Control Cluster */}
      <div className="flex items-center space-x-2 shrink-0">
        
        {/* Sync Button */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Sync Workspace Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D97757]' : ''}`} />
          </button>
        )}

        {/* Zen Focus Mode Button */}
        {onToggleZenFocus && (
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
            <span>🧘</span>
            <span className="hidden md:inline text-[11px]">{zenFocusMode ? 'Focusing' : 'Focus'}</span>
          </button>
        )}

        {/* AI Study Coach Pill */}
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
          <Sparkles className="w-3 h-3 text-[#D97757] shrink-0" />
          <span className="hidden md:inline text-[11px]">AI Coach</span>
        </button>

        {/* Settings Button */}
        {onOpenGeminiSettings && (
          <button
            onClick={onOpenGeminiSettings}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Settings &amp; Keys"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasDismissedBadge(true);
            }}
            className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27] relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#FAF9F5] dark:ring-[#141413]" />
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1917] rounded-2xl shadow-xl border border-[#DFDACB] dark:border-[#2C2B27] py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">Notifications</span>
                <span className="text-[10px] text-[#8C897F]">{notifications.length} alerts</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[#8C897F]">No new notifications</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="p-3 hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors">
                      <div className="font-semibold text-[#141413] dark:text-[#FAF9F5]">{n.title}</div>
                      <div className="text-[11px] text-[#8C897F]">{n.description || n.message}</div>
                    </div>
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
