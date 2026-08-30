import React, { useState } from 'react';
import {
  Columns2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Calculator,
  PenTool,
  FileText,
  Timer,
  Layers,
  Brain,
  BookOpen,
  Palette,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { IframeErrorBoundary } from './IframeErrorBoundary';
import { SplitScreenToolId, SplitScreenConfig } from '../types';

const LOCAL_SPLIT_KEY = 'scc_splitscreen_config_v1';

const AVAILABLE_TOOLS: { id: SplitScreenToolId; label: string; icon: any }[] = [
  { id: 'desmos-graphing', label: 'Desmos Graphing', icon: Calculator },
  { id: 'desmos-scientific', label: 'Desmos Scientific', icon: Calculator },
  { id: 'geogebra', label: 'GeoGebra Math', icon: Calculator },
  { id: 'excalidraw', label: 'Excalidraw Whiteboard', icon: PenTool },
  { id: 'notes-markdown', label: 'Markdown & LaTeX Notes', icon: FileText },
  { id: 'pomodoro', label: 'Pomodoro Focus Station', icon: Timer },
  { id: 'flashcards', label: 'Flashcards & SRS', icon: Brain },
  { id: 'notebooklm', label: 'Google NotebookLM', icon: BookOpen },
  { id: 'canva', label: 'Canva Design Studio', icon: Palette },
];

function loadSavedSplitConfig(): SplitScreenConfig {
  try {
    const saved = localStorage.getItem(LOCAL_SPLIT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading split config:', e);
  }
  return {
    leftTool: 'excalidraw',
    rightTool: 'desmos-graphing',
    ratio: '50/50',
    activeFullscreenPane: null,
  };
}

function saveSplitConfig(config: SplitScreenConfig) {
  try {
    localStorage.setItem(LOCAL_SPLIT_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving split config:', e);
  }
}

export const SplitScreenStudio: React.FC = () => {
  const [config, setConfig] = useState<SplitScreenConfig>(loadSavedSplitConfig);

  const updateConfig = (newConfig: Partial<SplitScreenConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveSplitConfig(updated);
  };

  // Keyboard Shortcut: Cmd + \ or Ctrl + \ to toggle fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setConfig((prev) => {
          let nextPane: 'left' | 'right' | null = null;
          if (prev.activeFullscreenPane === null) nextPane = 'left';
          else if (prev.activeFullscreenPane === 'left') nextPane = 'right';
          else nextPane = null;
          const updated = { ...prev, activeFullscreenPane: nextPane };
          saveSplitConfig(updated);
          return updated;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderToolComponent = (toolId: SplitScreenToolId) => {
    switch (toolId) {
      case 'desmos-graphing':
        return (
          <IframeErrorBoundary
            title="Desmos Graphing Calculator"
            src="https://www.desmos.com/calculator"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'desmos-scientific':
        return (
          <IframeErrorBoundary
            title="Desmos Scientific Calculator"
            src="https://www.desmos.com/scientific"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'geogebra':
        return (
          <IframeErrorBoundary
            title="GeoGebra Classic & 3D"
            src="https://www.geogebra.org/calculator"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'excalidraw':
        return (
          <IframeErrorBoundary
            title="Excalidraw Whiteboard"
            src="https://excalidraw.com"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'notebooklm':
        return (
          <IframeErrorBoundary
            title="Google NotebookLM"
            src="https://notebooklm.google.com"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'canva':
        return (
          <IframeErrorBoundary
            title="Canva Design Studio"
            src="https://www.canva.com"
            className="w-full h-full min-h-[500px]"
          />
        );
      case 'notes-markdown':
      case 'pomodoro':
      case 'flashcards':
      default:
        return (
          <div className="w-full h-full min-h-[500px] p-6 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col items-center justify-center text-center">
            <FileText className="w-10 h-10 text-[#D97757] mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
              Tool Active in Dual-Pane
            </h4>
            <p className="text-xs text-[#8C897F] mt-1 max-w-xs">
              Select any embedded tool from the dropdown above or launch an external frame.
            </p>
          </div>
        );
    }
  };

  // Determine grid template based on ratio
  let gridStyle = 'grid-cols-1 md:grid-cols-2';
  if (config.ratio === '60/40') gridStyle = 'grid-cols-1 md:grid-cols-12 md:[&>*:first-child]:col-span-7 md:[&>*:last-child]:col-span-5';
  else if (config.ratio === '70/30') gridStyle = 'grid-cols-1 md:grid-cols-12 md:[&>*:first-child]:col-span-8 md:[&>*:last-child]:col-span-4';
  else if (config.ratio === '40/60') gridStyle = 'grid-cols-1 md:grid-cols-12 md:[&>*:first-child]:col-span-5 md:[&>*:last-child]:col-span-7';
  else if (config.ratio === '30/70') gridStyle = 'grid-cols-1 md:grid-cols-12 md:[&>*:first-child]:col-span-4 md:[&>*:last-child]:col-span-8';

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Studio Control Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Columns2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Split-Screen Dual-Pane Studio
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Dock two academic tools side-by-side with resizable ratios and fullscreen focus
            </p>
          </div>
        </div>

        {/* Ratio & Layout Switchers */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs font-bold text-[#8C897F] uppercase tracking-wider">Ratio:</span>
          {(['50/50', '60/40', '70/30'] as const).map((r) => (
            <button
              key={r}
              onClick={() => updateConfig({ ratio: r })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                config.ratio === r
                  ? 'bg-[#D97757] text-white border-[#D97757]'
                  : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Pane Container */}
      <div className={`grid gap-4 h-[calc(85vh-160px)] min-h-[580px] ${gridStyle}`}>
        {/* Left Pane */}
        {(!config.activeFullscreenPane || config.activeFullscreenPane === 'left') && (
          <div className="flex flex-col h-full bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs">
            <div className="p-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">Left Pane:</span>
                <select
                  value={config.leftTool}
                  onChange={(e) => updateConfig({ leftTool: e.target.value as SplitScreenToolId })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-[#141413] dark:text-[#FAF9F5] cursor-pointer focus:ring-2 focus:ring-[#D97757]"
                >
                  {AVAILABLE_TOOLS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  updateConfig({
                    activeFullscreenPane: config.activeFullscreenPane === 'left' ? null : 'left',
                  })
                }
                className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] rounded-lg cursor-pointer"
                title={config.activeFullscreenPane === 'left' ? 'Restore Split' : 'Maximize Pane'}
              >
                {config.activeFullscreenPane === 'left' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex-1 w-full h-full min-h-0 relative">
              {renderToolComponent(config.leftTool)}
            </div>
          </div>
        )}

        {/* Right Pane */}
        {(!config.activeFullscreenPane || config.activeFullscreenPane === 'right') && (
          <div className="flex flex-col h-full bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs">
            <div className="p-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">Right Pane:</span>
                <select
                  value={config.rightTool}
                  onChange={(e) => updateConfig({ rightTool: e.target.value as SplitScreenToolId })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-[#141413] dark:text-[#FAF9F5] cursor-pointer focus:ring-2 focus:ring-[#D97757]"
                >
                  {AVAILABLE_TOOLS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  updateConfig({
                    activeFullscreenPane: config.activeFullscreenPane === 'right' ? null : 'right',
                  })
                }
                className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] rounded-lg cursor-pointer"
                title={config.activeFullscreenPane === 'right' ? 'Restore Split' : 'Maximize Pane'}
              >
                {config.activeFullscreenPane === 'right' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex-1 w-full h-full min-h-0 relative">
              {renderToolComponent(config.rightTool)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
