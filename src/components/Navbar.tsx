import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Bell,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleAiChat: () => void;
  notifications?: any[];
  isAiChatOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onToggleAiChat,
  notifications = [],
  isAiChatOpen = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasDismissedBadge, setHasDismissedBadge] = useState(false);
  const [notificationTier, setNotificationTier] = useState<'urgent' | 'updates' | 'activity'>('urgent');

  const unreadCount = hasDismissedBadge ? 0 : notifications.length;

  return (
    <header className="h-16 bg-[#FAF9F5]/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#DFDACB] dark:border-[#2C2B27] px-4 sm:px-6 flex items-center justify-between shadow-xs z-20 shrink-0 transition-colors">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-8 h-8 bg-[#D97757] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#D97757]/30 md:hidden shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <h1 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight truncate">
          Command Center
        </h1>
      </div>

      {/* Right Controls: STRICTLY Quick Search, AI Coach, and Notification Bell */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            readOnly
            onClick={onOpenCommandPalette}
            placeholder="Quick search (⌘+K)..."
            className="bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl py-1.5 pl-3.5 pr-10 text-xs sm:text-sm w-36 sm:w-56 lg:w-64 focus:ring-2 focus:ring-[#D97757] outline-none text-[#141413] dark:text-[#FAF9F5] cursor-pointer placeholder:text-[#8C897F] shadow-2xs"
          />
          <span className="absolute right-2.5 top-1.5 text-[#8C897F] text-[10px] font-mono bg-[#EFECE2] dark:bg-[#252422] px-1 py-0.5 rounded border border-[#DFDACB] dark:border-[#2C2B27]">
            ⌘K
          </span>
        </div>

        {/* AI Study Coach Button */}
        <button
          id="btn-nav-ai-coach"
          onClick={onToggleAiChat}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
            isAiChatOpen
              ? 'bg-[#D97757] border-[#D97757] text-white shadow-xs'
              : 'bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] border-[#D97757]/30'
          }`}
          title="Open Full-Screen AI Study Coach"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
          <span className="hidden sm:inline">AI Coach</span>
        </button>

        {/* Aggregated Notification Center with Click-To-Clear Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasDismissedBadge(true);
            }}
            className="p-2 text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-xl transition-colors relative cursor-pointer border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D97757] rounded-full ring-2 ring-white dark:ring-[#141413] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FAF9F5]/95 dark:bg-[#1A1917]/95 backdrop-blur-md border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#DFDACB] dark:border-[#2C2B27] flex justify-between items-center">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider">
                  Notification Center
                </span>
                <span className="text-[10px] bg-[#EFECE2] dark:bg-[#252422] text-[#8C897F] px-2 py-0.5 rounded-full font-bold">
                  {notifications.length} Total
                </span>
              </div>

              {/* Actionable Tiers Filter Pills */}
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-[#DFDACB] dark:border-[#2C2B27]">
                {[
                  { id: 'urgent', label: '🔴 Urgent', count: notifications.filter((n) => n.tier === 'urgent').length },
                  { id: 'updates', label: '🔵 Updates', count: notifications.filter((n) => n.tier === 'updates').length },
                  { id: 'activity', label: '🟢 Activity', count: notifications.filter((n) => n.tier === 'activity').length },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setNotificationTier(tier.id as any)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                      notificationTier === tier.id
                        ? 'bg-[#FAF9F5] dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27]'
                        : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                    }`}
                  >
                    {tier.label} ({tier.count})
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#DFDACB]/60 dark:divide-[#2C2B27]">
                {notifications.filter((n) => n.tier === notificationTier).length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8C897F]">
                    No active {notificationTier} notifications.
                  </div>
                ) : (
                  notifications
                    .filter((n) => n.tier === notificationTier)
                    .map((item) => (
                      <div key={item.id} className="p-3 hover:bg-[#EFECE2]/50 dark:hover:bg-[#252422]/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] mt-0.5 leading-snug">
                              {item.message}
                            </p>
                            <span className="text-[9px] text-[#8C897F] mt-1 block">
                              {item.timestamp}
                            </span>
                          </div>
                          {item.actionUrl && (
                            <a
                              href={item.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors border border-[#D97757]/30"
                            >
                              <span>{item.actionLabel || 'View'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
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
