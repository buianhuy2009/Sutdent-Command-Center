import React, { useState } from 'react';
import { Atom, ExternalLink, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { IframeErrorBoundary } from '../IframeErrorBoundary';

interface PhetSim {
  id: string;
  title: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Math';
  description: string;
  url: string;
}

const PHET_SIMS: PhetSim[] = [
  {
    id: 'phet-projectile',
    title: 'Projectile Motion',
    category: 'Physics',
    description: 'Blast objects out of a cannon and investigate angles, velocity, and air resistance.',
    url: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html',
  },
  {
    id: 'phet-circuit',
    title: 'Circuit Construction Kit (DC)',
    category: 'Physics',
    description: 'Build circuits with batteries, resistors, light bulbs, fuses, and ammeters.',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
  },
  {
    id: 'phet-forces',
    title: 'Forces and Motion: Basics',
    category: 'Physics',
    description: 'Explore friction, applied force, acceleration, and Newton laws.',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
  },
  {
    id: 'phet-balancing',
    title: 'Balancing Chemical Equations',
    category: 'Chemistry',
    description: 'Balance chemical reactions by adjusting coefficients visually.',
    url: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html',
  },
  {
    id: 'phet-acid-base',
    title: 'Acid-Base Solutions',
    category: 'Chemistry',
    description: 'Investigate strong vs weak acids, bases, pH paper, and electrical conductivity.',
    url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html',
  },
  {
    id: 'phet-molecule-shapes',
    title: 'Molecule Shapes (VSEPR)',
    category: 'Chemistry',
    description: 'Explore 3D molecular geometry, single/double bonds, and electron lone pairs.',
    url: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html',
  },
  {
    id: 'phet-natural-selection',
    title: 'Natural Selection',
    category: 'Biology',
    description: 'Control environmental factors and mutate bunnies to witness survival traits.',
    url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html',
  },
  {
    id: 'phet-gene-expression',
    title: 'Gene Expression Essentials',
    category: 'Biology',
    description: 'Examine transcription and translation to generate proteins from DNA.',
    url: 'https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_en.html',
  },
];

export const PhETWorkspace: React.FC = () => {
  const [activeSim, setActiveSim] = useState<PhetSim | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filtered = PHET_SIMS.filter((s) => {
    if (category !== 'All' && s.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className={`flex flex-col h-full w-full select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF9F5] dark:bg-[#141413] p-4' : ''}`}>
      
      {/* Active Sim Viewer */}
      {activeSim ? (
        <div className="flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB] dark:border-[#2C2B27] text-xs">
            <button
              onClick={() => setActiveSim(null)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Simulations</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">{activeSim.title}</span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <a
                href={activeSim.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] font-bold flex items-center gap-1"
              >
                <span>Open Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[550px] rounded-2xl overflow-hidden border border-[#DFDACB] dark:border-[#2C2B27] bg-white shadow-xs">
            <IframeErrorBoundary
              title={activeSim.title}
              src={activeSim.url}
              className="w-full h-full border-0 min-h-[550px]"
            />
          </div>
        </div>
      ) : (
        /* Catalog View */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Atom className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                    PhET Interactive Simulations
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    CU Boulder
                  </span>
                </div>
                <p className="text-xs text-[#8C897F] mt-0.5">
                  Interactive physics, chemistry, biology, and STEM simulation labs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['All', 'Physics', 'Chemistry', 'Biology'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] border border-[#DFDACB] dark:border-[#2C2B27]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((sim) => (
              <div
                key={sim.id}
                onClick={() => setActiveSim(sim)}
                className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs hover:border-[#D97757] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#D97757]">
                    {sim.category}
                  </span>
                  <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors">
                    {sim.title}
                  </h3>
                  <p className="text-xs text-[#8C897F] leading-relaxed line-clamp-2">
                    {sim.description}
                  </p>
                </div>

                <button className="w-full py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] group-hover:border-[#D97757] group-hover:bg-[#D97757] group-hover:text-white rounded-xl text-xs font-bold text-[#141413] dark:text-[#FAF9F5] transition-all flex items-center justify-center gap-1.5">
                  <span>Launch Simulation</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
