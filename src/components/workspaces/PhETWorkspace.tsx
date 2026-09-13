import React, { useState } from 'react';
import { Atom, ExternalLink, Maximize2, Minimize2, ArrowLeft, Search, X } from 'lucide-react';
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
  {
    id: 'phet-wave-string',
    title: 'Wave on a String',
    category: 'Physics',
    description: 'Wiggle the string to make waves and explore frequency, amplitude, and damping.',
    url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html',
  },
  {
    id: 'phet-ohms-law',
    title: "Ohm's Law",
    category: 'Physics',
    description: 'See how voltage, current, and resistance relate in a simple circuit.',
    url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
  },
  {
    id: 'phet-balloons',
    title: 'Balloons and Static Electricity',
    category: 'Physics',
    description: 'Rub a balloon on a sweater to learn how static charges attract and repel.',
    url: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_en.html',
  },
  {
    id: 'phet-bending-light',
    title: 'Bending Light',
    category: 'Physics',
    description: 'Shine lasers through materials to discover refraction and total internal reflection.',
    url: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html',
  },
  {
    id: 'phet-masses-springs',
    title: 'Masses and Springs',
    category: 'Physics',
    description: 'Hang masses on springs to explore stretch, oscillation, and stored energy.',
    url: 'https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_en.html',
  },
  {
    id: 'phet-pendulum',
    title: 'Pendulum Lab',
    category: 'Physics',
    description: 'Swing pendulums to find what controls their period: length, mass, or gravity.',
    url: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html',
  },
  {
    id: 'phet-skate-basics',
    title: 'Energy Skate Park: Basics',
    category: 'Physics',
    description: 'Ride a skater on tracks to trade kinetic and potential energy back and forth.',
    url: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_en.html',
  },
  {
    id: 'phet-color-vision',
    title: 'Color Vision',
    category: 'Physics',
    description: 'Mix red, green, and blue light to see how your eyes perceive color.',
    url: 'https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_en.html',
  },
  {
    id: 'phet-ph-scale',
    title: 'pH Scale',
    category: 'Chemistry',
    description: 'Dip the pH meter into drinks and cleaners to compare acids and bases.',
    url: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html',
  },
  {
    id: 'phet-molarity',
    title: 'Molarity',
    category: 'Chemistry',
    description: 'Dissolve solute, change volume, and watch solution concentration update live.',
    url: 'https://phet.colorado.edu/sims/html/molarity/latest/molarity_en.html',
  },
  {
    id: 'phet-build-atom',
    title: 'Build an Atom',
    category: 'Chemistry',
    description: 'Add protons, neutrons, and electrons to build atoms and ions from scratch.',
    url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html',
  },
  {
    id: 'phet-gas-properties',
    title: 'Gas Properties',
    category: 'Chemistry',
    description: 'Pump gas into a box, heat it, and squeeze it to learn the gas laws.',
    url: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_en.html',
  },
  {
    id: 'phet-concentration',
    title: 'Concentration',
    category: 'Chemistry',
    description: 'Mix drinks to discover how concentration, moles, and volume connect.',
    url: 'https://phet.colorado.edu/sims/html/concentration/latest/concentration_en.html',
  },
  {
    id: 'phet-beers-law',
    title: "Beer's Law Lab",
    category: 'Chemistry',
    description: 'Shine light through solutions to connect absorbance with concentration.',
    url: 'https://phet.colorado.edu/sims/html/beers-law-lab/latest/beers-law-lab_en.html',
  },
  {
    id: 'phet-states-matter-basics',
    title: 'States of Matter: Basics',
    category: 'Chemistry',
    description: 'Heat and cool atoms to watch solids melt and gases condense.',
    url: 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_en.html',
  },
  {
    id: 'phet-neuron',
    title: 'Neuron',
    category: 'Biology',
    description: 'Stimulate a neuron and watch the signal travel down the axon.',
    url: 'https://phet.colorado.edu/sims/html/neuron/latest/neuron_en.html',
  },
  {
    id: 'phet-membrane-channels',
    title: 'Membrane Channels',
    category: 'Biology',
    description: 'Add channels to a cell membrane and see ions flow in and out.',
    url: 'https://phet.colorado.edu/sims/html/membrane-channels/latest/membrane-channels_en.html',
  },
  {
    id: 'phet-area-builder',
    title: 'Area Builder',
    category: 'Math',
    description: 'Build shapes on a grid to master area and perimeter by playing.',
    url: 'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_en.html',
  },
  {
    id: 'phet-fraction-matcher',
    title: 'Fraction Matcher',
    category: 'Math',
    description: 'Match fractions to pictures and number lines in a timed memory game.',
    url: 'https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_en.html',
  },
  {
    id: 'phet-graphing-lines',
    title: 'Graphing Lines',
    category: 'Math',
    description: 'Drag points to graph lines and discover slope and slope-intercept form.',
    url: 'https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_en.html',
  },
  {
    id: 'phet-least-squares',
    title: 'Least-Squares Regression',
    category: 'Math',
    description: 'Drop data points and fit your own line to learn correlation and residuals.',
    url: 'https://phet.colorado.edu/sims/html/least-squares-regression/latest/least-squares-regression_en.html',
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
              {['All', 'Physics', 'Chemistry', 'Biology', 'Math'].map((cat) => (
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C897F] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search simulations by title or topic..."
                aria-label="Search simulations"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] focus:border-[#D97757] focus:outline-none text-sm text-[#141413] dark:text-[#FAF9F5] placeholder:text-[#8C897F]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#8C897F] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-xs text-[#8C897F] font-medium shrink-0" aria-live="polite">
              {filtered.length} of {PHET_SIMS.length} simulations
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-10 text-center space-y-3">
              <p className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                No simulations match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-[#8C897F]">
                Try a different keyword or category.
              </p>
              <button
                onClick={() => { setSearch(''); setCategory('All'); }}
                className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear search &amp; filters
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
};
