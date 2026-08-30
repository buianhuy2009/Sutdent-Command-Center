import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Atom,
  Palette,
  Brain,
  FolderOpen,
  Columns2,
  Sparkles,
  Command,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';
import { WorkspaceId } from '../types';

interface SidebarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (workspace: WorkspaceId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  user: any | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  urgentDeadlinesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onOpenAiCoach,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
  user,
  onGoogleSignIn,
  onSignOut,
  urgentDeadlinesCount = 0,
}) => {
  const WORKSPACES = [
    { id: 'dashboard' as WorkspaceId, label: 'Home Dashboard', icon: LayoutDashboard, badge: undefined },
    { id: 'academic' as WorkspaceId, label: 'Academic Radar & LMS', icon: Layers, badge: urgentDeadlinesCount > 0 ? urgentDeadlinesCount : undefined },
    { id: 'stem' as WorkspaceId, label: 'STEM & Calculation Lab', icon: Atom, badge: undefined },
    { id: 'creation' as WorkspaceId, label: 'Creation & Studio', icon: Palette, badge: undefined },
    { id: 'retention' as WorkspaceId, label: 'Retention & Focus Vault', icon: Brain, badge: undefined },
    { id: 'documents' as WorkspaceId, label: 'Document & Resource Hub', icon: FolderOpen, badge: undefined },
    { id: 'splitscreen' as WorkspaceId, label: 'Split-Screen Dock', icon: Columns2, badge: undefined },
  ];

  return (
    <aside
      className={`h-screen bg-white dark:bg-[#141413] border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col justify-between transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 px-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#D97757] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                S
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight block truncate">
                  Student OS
                </span>
                <span className="text-[10px] text-[#8C897F] block -mt-0.5">Command Center</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-xl bg-[#D97757] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-lg hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer hidden sm:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Global Quick Action: Cmd+K Command Palette */}
        <div className="p-3">
          <button
            onClick={onOpenCommandPalette}
            className={`w-full p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-2 text-xs text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Command Palette (Cmd + K)"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-[#D97757]" />
              {!isCollapsed && <span className="font-semibold">Search or Run...</span>}
            </div>
            {!isCollapsed && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#252422] rounded border border-[#DFDACB] dark:border-[#2C2B27]">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* 5 Core Workspaces Navigation */}
        <nav className="px-2 space-y-1 mt-1">
          {WORKSPACES.map((ws, idx) => {
            const isActive = activeWorkspace === ws.id;
            const Icon = ws.icon;
            return (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={ws.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{ws.label}</span>
                    {ws.badge !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#D97757] text-white'}`}>
                        {ws.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer: AI Coach, Theme & Account */}
      <div className="p-3 border-t border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
        {/* AI Study Coach Trigger */}
        <button
          onClick={onOpenAiCoach}
          className={`w-full p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-[#D97757]/30 text-[#D97757] flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="AI Academic Coach"
        >
          <Bot className="w-4 h-4 shrink-0 text-[#D97757]" />
          {!isCollapsed && <span>AI Study Coach</span>}
        </button>

        {/* User Account Bar */}
        <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] rounded-xl transition-colors cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] rounded-xl transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {user ? (
            <button
              onClick={onSignOut}
              className="p-2 text-[#8C897F] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-xl transition-colors cursor-pointer"
              title="Connect Google Account"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
