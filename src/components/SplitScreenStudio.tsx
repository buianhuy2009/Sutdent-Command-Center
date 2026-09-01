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
  const [quadMode, setQuadMode] = useState<'split' | 'quad'>(() => {
    try { return (localStorage.getItem('scc_split_quad_mode') as any) || 'split'; } catch { return 'split'; }
  });
  const [quadTools, setQuadTools] = useState<SplitScreenToolId[]>(() => {
    try { const s = localStorage.getItem('scc_quad_tools'); return s ? JSON.parse(s) : ['excalidraw','desmos-graphing','notes-markdown','pomodoro']; } catch { return ['excalidraw','desmos-graphing','notes-markdown','pomodoro']; }
  });
  const [savedLayouts, setSavedLayouts] = useState<Record<string, any>>(() => {
    try { const s = localStorage.getItem('scc_saved_layouts'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [dragPct, setDragPct] = useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = dragPct;
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const delta = ((ev.clientX - startX) / rect.width) * 100;
      const next = Math.max(20, Math.min(80, startPct + delta));
      setDragPct(next);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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

  const persistQuad = (next: SplitScreenToolId[]) => {
    setQuadTools(next);
    try { localStorage.setItem('scc_quad_tools', JSON.stringify(next)); localStorage.setItem('scc_split_quad_mode', quadMode); } catch {}
  };
  const saveNamedLayout = (name: string) => {
    const next = { ...savedLayouts, [name]: { quadMode, left: config.leftTool, right: config.rightTool, quadTools, ratio: config.ratio } };
    setSavedLayouts(next);
    try { localStorage.setItem('scc_saved_layouts', JSON.stringify(next)); } catch {}
  };
  const loadNamedLayout = (name: string) => {
    const l = savedLayouts[name];
    if (!l) return;
    if (l.quadMode) setQuadMode(l.quadMode);
    if (l.left) updateConfig({ leftTool: l.left, rightTool: l.right, ratio: l.ratio });
    if (l.quadTools) setQuadTools(l.quadTools);
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

        {/* Ratio & Layout Switchers + Golden Layout */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
            <button onClick={() => { setQuadMode('split'); try{localStorage.setItem('scc_split_quad_mode','split')}catch{} }} className={`px-3 py-1 rounded-lg text-xs font-bold ${quadMode==='split'?'bg-[#D97757] text-white':'text-[#5C5A54] dark:text-[#B5B2A8]'}`}>Split (2)</button>
            <button onClick={() => { setQuadMode('quad'); try{localStorage.setItem('scc_split_quad_mode','quad')}catch{} }} className={`px-3 py-1 rounded-lg text-xs font-bold ${quadMode==='quad'?'bg-[#D97757] text-white':'text-[#5C5A54] dark:text-[#B5B2A8]'}`}>Quad (4)</button>
          </div>
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
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => saveNamedLayout('Math Lab')} className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">Save Math Lab</button>
            <button onClick={() => saveNamedLayout('Research Mode')} className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">Save Research</button>
            {Object.keys(savedLayouts).length>0 && (
              <select onChange={e=>loadNamedLayout(e.target.value)} defaultValue="" className="px-2 py-1 text-xs bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg">
                <option value="" disabled>Load layout…</option>
                {Object.keys(savedLayouts).map(k=><option key={k} value={k}>{k}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Dual/Quad Pane Container - Golden Layout Tiling */}
      {quadMode === 'quad' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(85vh-160px)] min-h-[580px]">
          {[0,1,2,3].map(idx => (
            <div key={idx} className="flex flex-col h-full bg-white dark:bg-[#1A1917] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden shadow-xs">
              <div className="p-2 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F]">Pane {idx+1}</span>
                <select value={quadTools[idx]} onChange={e=>{
                  const next=[...quadTools] as SplitScreenToolId[];
                  next[idx]=e.target.value as SplitScreenToolId;
                  persistQuad(next);
                }} className="px-2 py-1 text-xs font-bold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-[#141413] dark:text-[#FAF9F5]">
                  {AVAILABLE_TOOLS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-h-0">{renderToolComponent(quadTools[idx])}</div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={containerRef} className="flex h-[calc(85vh-160px)] min-h-[580px] gap-0 rounded-2xl overflow-hidden border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B]">
        {/* Left Pane */}
        {(!config.activeFullscreenPane || config.activeFullscreenPane === 'left') && (
          <div style={{ flexBasis: config.activeFullscreenPane ? '100%' : `${dragPct}%` }} className="flex flex-col h-full bg-white dark:bg-[#1A1917] overflow-hidden shrink-0">
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
        {/* Draggable divider — visible only when both panes shown */}
        {!config.activeFullscreenPane && (
          <div
            onMouseDown={handleDividerMouseDown}
            className="w-1.5 bg-[#DFDACB] dark:bg-[#2C2B27] hover:bg-[#D97757] dark:hover:bg-[#D97757] cursor-col-resize flex items-center justify-center shrink-0 select-none"
            title="Drag to resize — 20% to 80%"
          >
            <div className="w-0.5 h-8 bg-white/60 rounded-full" />
          </div>
        )}

        {/* Right Pane */}
        {(!config.activeFullscreenPane || config.activeFullscreenPane === 'right') && (
          <div style={{ flexBasis: config.activeFullscreenPane ? '100%' : `${100 - dragPct}%` }} className="flex flex-col h-full bg-white dark:bg-[#1A1917] overflow-hidden shrink-0">
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
      )}
    </div>
  );
};
