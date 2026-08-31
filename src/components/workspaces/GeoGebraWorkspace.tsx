import React, { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, Calculator, Shapes, Box, Sigma, BarChart3 } from 'lucide-react';
import { IframeErrorBoundary } from '../IframeErrorBoundary';

type GeoTab = 'graphing' | 'geometry' | '3d' | 'cas' | 'probability';
const GEO_URLS: Record<GeoTab, string> = {
  graphing: 'https://www.geogebra.org/graphing',
  geometry: 'https://www.geogebra.org/geometry',
  '3d': 'https://www.geogebra.org/3d',
  cas: 'https://www.geogebra.org/cas',
  probability: 'https://www.geogebra.org/probability',
};

export const GeoGebraWorkspace: React.FC = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<GeoTab>('graphing');
  const url = GEO_URLS[activeTab];

  return (
    <div className={`flex flex-col h-full w-full select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF9F5] dark:bg-[#141413] p-4' : ''}`}>
      {/* 5-Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] mb-3 w-fit overflow-x-auto">
        {([
          { id: 'graphing' as GeoTab, label: 'Graphing', icon: Calculator },
          { id: 'geometry' as GeoTab, label: 'Geometry', icon: Shapes },
          { id: '3d' as GeoTab, label: '3D', icon: Box },
          { id: 'cas' as GeoTab, label: 'CAS', icon: Sigma },
          { id: 'probability' as GeoTab, label: 'Probability', icon: BarChart3 },
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === t.id ? 'bg-[#D97757] text-white shadow-xs' : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413]'}`}>
              <Icon className="w-3.5 h-3.5" /><span>{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DFDACB] dark:border-[#2C2B27] shrink-0 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">GeoGebra {activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
            5 Applet Suite
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
            title="Reload Calculator"
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

      {/* Embed */}
      <div key={reloadKey} className="flex-1 w-full min-h-[550px] rounded-2xl overflow-hidden border border-[#DFDACB] dark:border-[#2C2B27] bg-white shadow-xs">
        <IframeErrorBoundary
          title="GeoGebra Math Suite"
          src={url}
          className="w-full h-full border-0 min-h-[550px]"
        />
      </div>
    </div>
  );
};
