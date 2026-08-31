import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PinOff,
  User as UserIcon,
  Sparkles,
  Key,
  Sun,
  Moon,
  Keyboard,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { APP_CATALOG } from './AppStoreModal';

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

  const coreTabs: TabItem[] = [
    {
      id: 'canvas',
      label: 'Canvas LMS',
      desc: 'Assignments & grades',
      badge: badges.canvas && badges.canvas > 0 ? badges.canvas : undefined,
      key: '1',
    },
    {
      id: 'radar',
      label: 'Daily Schedule',
      desc: 'Visual schedule & blocks',
      badge: badges.schedule && badges.schedule > 0 ? badges.schedule : undefined,
      key: '2',
    },
    {
      id: 'tracker',
      label: 'Assignment Tracker',
      desc: 'Master checklist & sync',
      badge: badges.tracker && badges.tracker > 0 ? badges.tracker : undefined,
      key: '3',
    },
    {
      id: 'gmail',
      label: 'Gmail AI Scanner',
      desc: 'Academic inbox & drafter',
      badge: badges.gmail && badges.gmail > 0 ? badges.gmail : undefined,
      key: '4',
    },
    {
      id: 'drive',
      label: 'Google Drive',
      desc: 'School docs & slides',
      key: '5',
    },
  ];

  // Pinned non-core apps
  const pinnedApps = useMemo(() => {
    return pinnedAppIds
      .filter((id) => !['canvas', 'radar', 'tracker', 'gmail', 'drive'].includes(id))
      .map((id) => APP_CATALOG.find((app) => app.id === id))
      .filter(Boolean) as typeof APP_CATALOG;
  }, [pinnedAppIds]);

  return (
    <aside
      className={`h-screen shrink-0 bg-[#EFECE2] dark:bg-[#1A1917] border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col transition-all duration-300 z-30 select-none ${
        isExpanded ? 'w-64 p-4' : 'w-20 p-3'
      }`}
    >
      {/* 1. Header Section (Shrink 0) */}
      <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-[#D97757] rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-[#D97757]/30 shrink-0">
            S
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight truncate leading-tight">
                StudentOS
              </h1>
              <p className="text-[10px] text-[#8C897F] font-mono truncate">Academic AI Hub</p>
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-xl hover:bg-[#DFDACB]/60 dark:hover:bg-[#252422] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation Area (Takes full flex-1 height) */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
        {isExpanded && (
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C897F]">
            Academic Core
          </div>
        )}

        {/* Core Tabs */}
        {coreTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full rounded-2xl flex items-center transition-all cursor-pointer relative group ${
                isExpanded ? 'px-3 py-2 justify-between gap-3' : 'w-11 h-11 mx-auto justify-center'
              } ${
                isActive
                  ? 'bg-[#D97757] text-white shadow-sm shadow-[#D97757]/20 font-bold'
                  : 'bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]'
              }`}
              title={tab.label}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AppLogo id={tab.id} size="sm" />
                {isExpanded && (
                  <div className="text-left min-w-0">
                    <div className="text-xs truncate leading-tight">{tab.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#8C897F]'}`}>
                      {tab.desc}
                    </div>
                  </div>
                )}
              </div>

              {isExpanded ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-500 text-white">
                      {tab.badge}
                    </span>
                  )}
                  {tab.key && (
                    <span
                      className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-black/20 text-[#8C897F]'
                      }`}
                    >
                      [{tab.key}]
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#EFECE2] dark:ring-[#1A1917]" />
                  )}
                  <span className="absolute left-14 bg-[#141413] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#141413] text-xs font-semibold px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border border-[#DFDACB] dark:border-[#2C2B27]">
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* Pinned Apps Section */}
        {pinnedApps.length > 0 && (
          <div className="pt-3">
            {isExpanded && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C897F]">
                Pinned Apps
              </div>
            )}
            <div className="space-y-1">
              {pinnedApps.map((app) => {
                const isActive = activeTab === app.id;

                return (
                  <div key={app.id} className="relative group/item flex items-center">
                    <button
                      onClick={() => onSelectTab(app.id)}
                      className={`w-full rounded-2xl flex items-center transition-all cursor-pointer ${
                        isExpanded ? 'px-3 py-2 justify-between gap-3' : 'w-11 h-11 mx-auto justify-center'
                      } ${
                        isActive
                          ? 'bg-[#D97757] text-white shadow-sm font-bold'
                          : 'bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-transparent hover:border-[#DFDACB] dark:hover:border-[#2C2B27]'
                      }`}
                      title={app.name}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AppLogo id={app.id} size="sm" />
                        {isExpanded && (
                          <div className="text-left min-w-0">
                            <div className="text-xs truncate leading-tight">{app.name}</div>
                            <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[#8C897F]'}`}>
                              {app.category}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <button
                        onClick={() => onUnpinApp(app.id)}
                        className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1 text-[#8C897F] hover:text-rose-500 rounded transition-opacity cursor-pointer"
                        title="Unpin App"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add More Apps Button */}
        <div className="pt-2">
          <button
            onClick={onOpenAppStore}
            className={`w-full rounded-2xl flex items-center transition-all cursor-pointer border border-dashed border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] ${
              isExpanded ? 'px-3 py-2 gap-2.5 text-xs font-semibold' : 'w-11 h-11 mx-auto justify-center'
            }`}
            title="Open App Store"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {isExpanded && <span>Add Tools &amp; Apps</span>}
          </button>
        </div>
      </div>

      {/* 3. Bottom Section: Expand Toggle & User Profile (Shrink 0) */}
      <div className="pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27] shrink-0" ref={userMenuRef}>
        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="w-11 h-11 mx-auto mb-2 rounded-2xl bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] dark:bg-[#252422]/60 dark:hover:bg-[#252422] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] flex items-center justify-center transition-colors cursor-pointer border border-[#DFDACB] dark:border-[#2C2B27]"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* User Avatar Card (Opens macOS 2-Pane Settings Dialog) */}
        <div
          onClick={onOpenSettings}
          className={`flex items-center rounded-2xl p-2 cursor-pointer hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors border border-transparent hover:border-[#DFDACB] dark:border-[#2C2B27] ${
            isExpanded ? 'gap-3 justify-start' : 'justify-center'
          }`}
          title="Account & Settings (Click to open)"
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
              <UserIcon className="w-4 h-4" />
            </div>
          )}

          {isExpanded && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] truncate leading-tight">
                {user ? user.displayName || user.email?.split('@')[0] : 'Guest Student'}
              </div>
              <div className="text-[10px] text-[#8C897F] truncate">
                {user ? user.email : 'Click for Settings'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
