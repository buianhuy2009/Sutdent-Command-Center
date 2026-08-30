import React, { useState } from 'react';
import {
  Calculator,
  Compass,
  Atom,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  X,
  Search,
  BookOpen,
} from 'lucide-react';
import { IframeErrorBoundary } from '../IframeErrorBoundary';

type StemToolTab = 'desmos-graphing' | 'desmos-scientific' | 'geogebra' | 'phet';

interface PhetSimulation {
  id: string;
  title: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Math';
  description: string;
  url: string;
}

const PHET_CATALOG: PhetSimulation[] = [
  {
    id: 'phet-projectile',
    title: 'Projectile Motion',
    category: 'Physics',
    description: 'Blast a car out of a cannon and challenge yourself to hit a target! Explore angles, velocity, and air resistance.',
    url: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html',
  },
  {
    id: 'phet-circuit',
    title: 'Circuit Construction Kit (DC)',
    category: 'Physics',
    description: 'Build circuits with batteries, resistors, light bulbs, fuses, and switches. Take measurements with ammeters and voltmeters.',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
  },
  {
    id: 'phet-forces',
    title: 'Forces and Motion: Basics',
    category: 'Physics',
    description: 'Explore the forces at work when pulling against a cart, and pushing a refrigerator, crate, or person.',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
  },
  {
    id: 'phet-balancing',
    title: 'Balancing Chemical Equations',
    category: 'Chemistry',
    description: 'Balance chemical reactions by adjusting coefficients. Inspect reactants vs products visually with balance scales.',
    url: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html',
  },
  {
    id: 'phet-acid-base',
    title: 'Acid-Base Solutions',
    category: 'Chemistry',
    description: 'Investigate how strong and weak acids and bases differ using indicators, pH paper, and conductivity light bulbs.',
    url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html',
  },
  {
    id: 'phet-molecule-shapes',
    title: 'Molecule Shapes (VSEPR)',
    category: 'Chemistry',
    description: 'Explore 3D molecular geometry by adding single, double, or triple bonds and lone pairs to a central atom.',
    url: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html',
  },
  {
    id: 'phet-natural-selection',
    title: 'Natural Selection',
    category: 'Biology',
    description: 'Explore natural selection by controlling the environment and mutating bunnies to witness survival traits.',
    url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html',
  },
  {
    id: 'phet-gene-expression',
    title: 'Gene Expression Essentials',
    category: 'Biology',
    description: 'Examine how transcription and translation work to generate proteins from DNA genes.',
    url: 'https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_en.html',
  },
];

export const StemLabWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StemToolTab>('desmos-graphing');
  const [phetCategory, setPhetCategory] = useState<string>('All');
  const [phetSearch, setPhetSearch] = useState<string>('');
  const [activePhetSim, setActivePhetSim] = useState<PhetSimulation | null>(null);

  const filteredSims = PHET_CATALOG.filter((sim) => {
    const matchesCategory = phetCategory === 'All' || sim.category === phetCategory;
    const matchesSearch =
      sim.title.toLowerCase().includes(phetSearch.toLowerCase()) ||
      sim.description.toLowerCase().includes(phetSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top STEM Header & Tool Switcher */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              STEM &amp; Calculation Lab
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Interactive graphing, 3D math geometry, and PhET science simulations
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'desmos-graphing', label: 'Desmos Graphing', icon: Calculator },
            { id: 'desmos-scientific', label: 'Desmos Scientific', icon: Calculator },
            { id: 'geogebra', label: 'GeoGebra Math', icon: Compass },
            { id: 'phet', label: 'PhET Science Sims', icon: Atom },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StemToolTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Desmos Graphing Calculator */}
      {activeTab === 'desmos-graphing' && (
        <IframeErrorBoundary
          title="Desmos Graphing Calculator"
          src="https://www.desmos.com/calculator"
          className="h-[calc(85vh-160px)] min-h-[550px]"
        />
      )}

      {/* 2. Desmos Scientific Calculator */}
      {activeTab === 'desmos-scientific' && (
        <IframeErrorBoundary
          title="Desmos Scientific Calculator"
          src="https://www.desmos.com/scientific"
          className="h-[calc(85vh-160px)] min-h-[550px]"
        />
      )}

      {/* 3. GeoGebra Math Suite */}
      {activeTab === 'geogebra' && (
        <IframeErrorBoundary
          title="GeoGebra Classic & 3D Math Suite"
          src="https://www.geogebra.org/calculator"
          className="h-[calc(85vh-160px)] min-h-[550px]"
        />
      )}

      {/* 4. PhET Science Simulations Browser */}
      {activeTab === 'phet' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Physics', 'Chemistry', 'Biology'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPhetCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    phetCategory === cat
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phetSearch}
                onChange={(e) => setPhetSearch(e.target.value)}
                placeholder="Search simulations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>
          </div>

          {/* Grid of Simulations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSims.map((sim) => (
              <div
                key={sim.id}
                className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 flex flex-col justify-between hover:border-[#D97757]/60 transition-colors shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300">
                      {sim.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-2 group-hover:text-[#D97757] transition-colors">
                    {sim.title}
                  </h4>
                  <p className="text-[11px] text-[#8C897F] mt-1 line-clamp-3 leading-relaxed">
                    {sim.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
                  <button
                    onClick={() => setActivePhetSim(sim)}
                    className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span>Run In-App</span>
                  </button>

                  <a
                    href={sim.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] rounded-lg transition-colors"
                    title="Open in Full Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* In-App Simulation Runner Viewport */}
          {activePhetSim && (
            <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden">
                <div className="p-3.5 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B]">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs sm:text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                      PhET Simulation: {activePhetSim.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={activePhetSim.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] flex items-center gap-1"
                    >
                      <span>New Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => setActivePhetSim(null)}
                      className="p-1 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full h-full relative">
                  <iframe
                    src={activePhetSim.url}
                    title={activePhetSim.title}
                    allow="fullscreen; autoplay; accelerometer; gyroscope"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
