import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PinOff,
  User as UserIcon,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { APP_CATALOG } from './AppStoreModal';

const NavSection: React.FC<{ title?: string; isExpanded: boolean; children: React.ReactNode }> = ({ title, isExpanded, children }) => (
  <div className="space-y-1">
    {isExpanded && title && <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6860]">{title}</div>}
    <div className="space-y-1">{children}</div>
  </div>
);

export interface TabItem {
  id: string;
  label: string;
  icon?: any;
  desc: string;
  badge?: number | string;
  key?: string;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenAppStore: () => void;
  onOpenShortcuts: () => void;
  onToggleDarkMode: () => void;
  darkMode: boolean;
  pinnedAppIds: string[];
  onUnpinApp: (appId: string) => void;
  badges?: {
    canvas?: number;
    schedule?: number;
    tracker?: number;
    gmail?: number;
    flashcards?: number;
    [key: string]: number | undefined;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isExpanded,
  onToggleExpand,
  user,
  onSignIn,
  onSignOut,
  onOpenSettings,
  onOpenAppStore,
  onOpenShortcuts,
  onToggleDarkMode,
  darkMode,
  pinnedAppIds = [],
  onUnpinApp,
  badges = {},
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const APP_META: Record<string, { label: string; desc: string; key?: string; badgeKey?: string }> = {
    canvas: { label: 'Canvas LMS', desc: 'Assignments & grades', key: '1', badgeKey: 'canvas' },
    radar: { label: 'Daily Schedule', desc: 'Visual schedule & blocks', key: '2', badgeKey: 'schedule' },
    tracker: { label: 'Assignment Tracker', desc: 'Master checklist & sync', key: '3', badgeKey: 'tracker' },
    gmail: { label: 'Gmail AI Scanner', desc: 'Academic inbox & drafter', key: '4', badgeKey: 'gmail' },
    drive: { label: 'Google Drive', desc: 'School docs & slides', key: '5' },
  };

  const pinnedApps = useMemo(() => {
    return pinnedAppIds
      .map((id) => APP_CATALOG.find((app) => app.id === id))
      .filter(Boolean) as typeof APP_CATALOG;
  }, [pinnedAppIds]);

  const recentApps = useMemo(() => {
    try {
      const storeRecent = (() => { try { const w = localStorage.getItem('scc_workspace_store'); if (w) { const j = JSON.parse(w); const state = j.state || j; if (state.recentTabs) return state.recentTabs; } } catch {} return null; })();
      const raw = storeRecent || (() => { try { return JSON.parse(localStorage.getItem('scc_recent_tabs_v1') || '[]'); } catch { return []; } })();
      const ids = Array.isArray(raw) ? raw : [];
      const list: string[] = ids.map((x:any)=> typeof x==='string'? x : x.id).filter(Boolean).slice(0,3) as string[];
      if (list.length < 3) {
        const usageRaw = localStorage.getItem('scc_app_usage_v1');
        if (usageRaw) {
          const usage = JSON.parse(usageRaw);
          const sorted = Object.entries(usage).sort((a:any,b:any)=> b[1]-a[1]).map(([k])=>k).filter(k=> !list.includes(k) && !pinnedAppIds.includes(k));
          list.push(...sorted.slice(0, 3-list.length));
        }
      }
      return list.slice(0,3).map((id:string) => APP_CATALOG.find(a=>a.id===id)).filter(Boolean) as typeof APP_CATALOG;
    } catch { return []; }
  }, [activeTab, pinnedAppIds]);

  return (
    <aside
      aria-label="Primary navigation"
      role="navigation"
      className={`h-screen shrink-0 bg-[#EFECE2] dark:bg-[#1A1917] border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col transition-all duration-300 z-30 select-none ${
        isExpanded ? 'w-64 p-4' : 'w-16 p-2'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27] mb-2 shrink-0">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex items-center gap-3 min-w-0 p-0.5 rounded-2xl transition-all cursor-pointer text-left ${
            activeTab === 'dashboard'
              ? 'ring-2 ring-[#D97757]/60 bg-white/40 dark:bg-[#252422]/40'
              : 'hover:opacity-90'
          }`}
          title="Go to Dashboard Home"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-[#D97757] rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-[#D97757]/30 shrink-0" aria-hidden="true">
            S
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight truncate leading-tight">
                StudentOS
              </h1>
              <p className="text-[10px] text-[#6B6860] font-mono truncate">Academic AI Hub</p>
            </div>
          )}
        </button>

        {isExpanded && (
          <button
            onClick={onToggleExpand}
            className="p-2.5 rounded-xl hover:bg-[#DFDACB]/60 dark:hover:bg-[#252422] text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Collapse to icon rail"
            aria-label="Collapse sidebar to icon rail"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-0.5">
        <NavSection title="Pinned" isExpanded={isExpanded}>
          <div className="space-y-1">
            {pinnedApps.length === 0 ? (
              <div className="text-[11px] text-[#6B6860] px-2 py-2 italic">No pinned apps — add from App Store</div>
            ) : pinnedApps.map((app) => {
              const meta = APP_META[app.id] || { label: app.name, desc: app.category };
              const badgeKey = (APP_META[app.id]?.badgeKey) || app.id;
              const badgeCount = badges[badgeKey] || badges[app.id] || (badges as any)[app.id.replace('-', '_')] || 0;
              const hasBadge = badgeCount > 0;
              const isActive = activeTab === app.id;
              const badgeColor = app.id==='canvas' ? 'bg-violet-600' : app.id==='gmail' ? 'bg-amber-500' : app.id==='tracker' ? 'bg-emerald-600' : 'bg-rose-500';
              const key = meta.key;
              return (
                <div key={app.id} className="relative group/item flex items-center">
                  <button
                    onClick={() => onSelectTab(app.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full rounded-xl flex items-center transition-all cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757] ${
                      isExpanded ? 'px-3 py-2.5 justify-between gap-3 min-h-[44px]' : 'w-11 h-11 mx-auto justify-center'
                    } ${
                      isActive
                        ? 'bg-[#D97757] text-white shadow-sm shadow-[#D97757]/20 font-bold'
                        : 'bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]'
                    }`}
                    title={app.name}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AppLogo id={app.id} size="sm" />
                      {isExpanded && (
                        <div className="text-left min-w-0">
                          <div className="text-xs truncate leading-tight">{meta.label || app.name}</div>
                          <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#6B6860]'}`}>
                            {meta.desc || app.category}
                          </div>
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasBadge && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${isActive ? 'bg-white text-rose-600' : `${badgeColor} text-white`}`}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                        {key && (
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-black/20 text-[#6B6860]'}`} title={`Press ? for shortcuts, ⌘${key}`}>
                            ⌘{key}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {hasBadge && (
                          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#EFECE2] dark:ring-[#1A1917] ${badgeColor}`} />
                        )}
                        <span className="absolute left-16 bg-[#141413] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#141413] text-xs font-semibold px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity delay-100 whitespace-nowrap z-50 shadow-md border border-[#DFDACB] dark:border-[#2C2B27]" role="tooltip">
                          {meta.label || app.name} {key ? `— ⌘${key}` : ''}
                        </span>
                      </>
                    )}
                  </button>
                  {isExpanded && (
                    <button
                      onClick={() => onUnpinApp(app.id)}
                      className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1 text-[#6B6860] hover:text-rose-500 rounded transition-opacity cursor-pointer"
                      title="Unpin"
                    >
                      <PinOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </NavSection>

        {recentApps.length > 0 && (
          <NavSection title="Recent" isExpanded={isExpanded}>
            <div className="space-y-1">
              {recentApps.map((app) => {
                const isActive = activeTab === app.id;
                return (
                  <button
                    key={`recent-${app.id}`}
                    onClick={() => onSelectTab(app.id)}
                    className={`w-full rounded-xl flex items-center transition-all cursor-pointer relative ${isExpanded ? 'px-3 py-2.5 justify-between gap-3 min-h-[44px]' : 'w-11 h-11 mx-auto justify-center'} ${isActive ? 'bg-[#D97757] text-white shadow-sm font-bold' : 'bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]'}`}
                    title={app.name}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AppLogo id={app.id} size="sm" />
                      {isExpanded && (
                        <div className="text-left min-w-0">
                          <div className="text-xs truncate leading-tight">{app.name}</div>
                          <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#6B6860]'}`}>{app.category}</div>
                        </div>
                      )}
                    </div>
                    {!isExpanded && (
                      <span className="absolute left-16 bg-[#141413] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#141413] text-xs font-semibold px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity delay-100 whitespace-nowrap z-50 shadow-md border border-[#DFDACB] dark:border-[#2C2B27]" role="tooltip">{app.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </NavSection>
        )}

        <div className="pt-2 relative group/add">
          <button
            onClick={onOpenAppStore}
            className={`w-full rounded-xl flex items-center transition-all cursor-pointer border border-dashed border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] ${
              isExpanded ? 'px-3 py-2.5 gap-2.5 text-xs font-semibold min-h-[44px]' : 'w-11 h-11 mx-auto justify-center'
            }`}
            title="Open App Store"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            {isExpanded && <span>Add Tools &amp; Apps</span>}
          </button>
          {!isExpanded && (
            <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#141413] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#141413] text-xs font-semibold px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover/add:opacity-100 transition-opacity delay-100 whitespace-nowrap z-50 shadow-md border border-[#DFDACB] dark:border-[#2C2B27]">
              App Store
            </span>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-[#DFDACB] dark:border-[#2C2B27] shrink-0" ref={userMenuRef}>
        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="w-11 h-11 mx-auto mb-1.5 rounded-xl bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#6B6860] hover:text-[#141413] dark:hover:text-[#FAF9F5] flex items-center justify-center transition-colors cursor-pointer border border-[#DFDACB] dark:border-[#2C2B27]"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
        <div
          onClick={onOpenSettings}
          className={`flex items-center rounded-xl p-1 cursor-pointer hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors border border-transparent hover:border-[#DFDACB] dark:border-[#2C2B27] ${
            isExpanded ? 'gap-3 justify-start p-2 min-h-[44px]' : 'w-11 h-11 mx-auto justify-center p-0'
          }`}
          title="Account & Settings"
        >
          {user ? (
            <div className="w-9 h-9 rounded-2xl bg-[#D97757]/20 border-2 border-[#D97757] flex items-center justify-center text-xs font-bold text-[#D97757] overflow-hidden shrink-0 shadow-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (user.displayName || user.email || 'S').slice(0, 2).toUpperCase()
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-2xl bg-[#D97757] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              <UserIcon className="w-4 h-4" strokeWidth={1.75} />
            </div>
          )}
          {isExpanded && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate leading-tight">
                {user ? user.displayName || user.email?.split('@')[0] : 'Guest Student'}
              </div>
              <div className="text-[10px] text-[#6B6860] truncate">
                {user ? user.email : 'Click for Settings'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
