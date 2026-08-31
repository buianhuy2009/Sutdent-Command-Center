import React from 'react';
import {
  Sparkles,
  Calculator,
  PenTool,
  BookOpen,
  FolderOpen,
  SlidersHorizontal,
  FileText,
  HelpCircle,
  Timer,
  LayoutGrid,
  CheckSquare,
  GraduationCap,
} from 'lucide-react';

interface QuickToolsWidgetProps {
  onNavigate: (tabId: string) => void;
  onOpenAppStore: () => void;
}

export const QuickToolsWidget: React.FC<QuickToolsWidgetProps> = ({
  onNavigate,
  onOpenAppStore,
}) => {
  const tools = [
    { id: 'desmos-graphing', label: 'Desmos 2D', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { id: 'pdf-reader', label: 'PDF Annotator', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { id: 'quiz-generator', label: 'Practice Quiz', icon: HelpCircle, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { id: 'pomodoro', label: 'Focus Soundscapes', icon: Timer, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
    { id: 'excalidraw', label: 'Excalidraw', icon: PenTool, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { id: 'notes-markdown', label: 'Markdown Notes', icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { id: 'drive', label: 'Google Drive', icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { id: 'splitscreen', label: 'Split Screen', icon: SlidersHorizontal, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#D97757]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#FAF9F5]">
              Quick Tool Shortcuts
            </h3>
          </div>
          <button
            onClick={onOpenAppStore}
            className="text-xs font-bold text-[#D97757] hover:underline cursor-pointer"
          >
            App Store Catalog
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.id}
                onClick={() => onNavigate(tool.id)}
                className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:scale-[1.02] group"
              >
                <div className={`w-9 h-9 rounded-xl ${tool.bg} ${tool.color} flex items-center justify-center shadow-2xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors truncate max-w-full">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
        <span>Instant 1-click workspace switcher</span>
        <button
          onClick={onOpenAppStore}
          className="text-[#D97757] hover:underline font-bold text-xs cursor-pointer"
        >
          Add More Tools
        </button>
      </div>
    </div>
  );
};
