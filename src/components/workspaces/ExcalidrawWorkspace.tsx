import React, { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, PenTool } from 'lucide-react';
import { IframeErrorBoundary } from '../IframeErrorBoundary';

export const ExcalidrawWorkspace: React.FC = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const url = 'https://excalidraw.com';

  return (
    <div className={`flex flex-col h-full w-full select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF9F5] dark:bg-[#141413] p-4' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DFDACB] dark:border-[#2C2B27] shrink-0 text-xs select-none">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">Excalidraw Whiteboard</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold">
            Hand-Drawn Canvas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
            title="Reload Whiteboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] font-bold flex items-center gap-1 transition-colors"
          >
            <span>Open Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Embed Canvas */}
      <div key={reloadKey} className="flex-1 w-full min-h-[550px] rounded-2xl overflow-hidden border border-[#DFDACB] dark:border-[#2C2B27] bg-white shadow-xs">
        <IframeErrorBoundary
          title="Excalidraw Whiteboard"
          src={url}
          className="w-full h-full border-0 min-h-[550px]"
        />
      </div>
    </div>
  );
};
