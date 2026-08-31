import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Info,
  Layers,
  Sparkles,
  Zap,
  Atom,
  X,
  BookOpen,
} from 'lucide-react';

import { ELEMENTS_DATA, ChemicalElement } from '../../data/elementsData';


const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'diatomic-nonmetal': { bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', label: 'Reactive Nonmetal' },
  'polyatomic-nonmetal': { bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300', label: 'Polyatomic Nonmetal' },
  'noble-gas': { bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', label: 'Noble Gas' },
  'alkali-metal': { bg: 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800', text: 'text-red-700 dark:text-red-300', label: 'Alkali Metal' },
  'alkaline-earth': { bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', label: 'Alkaline Earth Metal' },
  'metalloid': { bg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', label: 'Metalloid' },
  'halogen': { bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', label: 'Halogen' },
  'post-transition-metal': { bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', label: 'Post-Transition Metal' },
  'transition-metal': { bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', label: 'Transition Metal' },
  'actinide': { bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', label: 'Actinide' },
};

export const PeriodicTableWorkspace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeElement, setActiveElement] = useState<ChemicalElement | null>(ELEMENTS_DATA[0]);

  const mainElements = useMemo(() => {
    return ELEMENTS_DATA.filter(
      (el) => el.number <= 118 &&
        !(el.number >= 57 && el.number <= 71) &&
        !(el.number >= 89 && el.number <= 103)
    );
  }, []);

  const lanthanides = useMemo(() => {
    return ELEMENTS_DATA.filter((el) => el.number >= 57 && el.number <= 71);
  }, []);

  const actinides = useMemo(() => {
    return ELEMENTS_DATA.filter((el) => el.number >= 89 && el.number <= 103);
  }, []);

  const checkElementMatch = (el: ChemicalElement) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query ||
      el.name.toLowerCase().includes(query) ||
      el.symbol.toLowerCase().includes(query) ||
      el.number.toString().includes(query);
    const matchesCategory = selectedCategory === 'all' || el.category === selectedCategory;
    return matchesQuery && matchesCategory;
  };

  const isSearchActive = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  const hasMatchingLanthanide = useMemo(() => {
    return lanthanides.some(checkElementMatch);
  }, [lanthanides, searchQuery, selectedCategory]);

  const hasMatchingActinide = useMemo(() => {
    return actinides.some(checkElementMatch);
  }, [actinides, searchQuery, selectedCategory]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#FAF9F5] dark:bg-[#141413] p-4 sm:p-6 space-y-5 animate-in fade-in select-none">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
              Interactive Periodic Table &amp; Science Suite
            </h2>
            <p className="text-xs text-[#8C897F]">
              Atomic masses, electron shells, electronegativities, and chemical classifications
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol, name, or number..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757] w-64"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] focus:outline-none cursor-pointer"
          >
            <option value="all">All Element Families</option>
            <option value="alkali-metal">Alkali Metals</option>
            <option value="alkaline-earth">Alkaline Earth</option>
            <option value="transition-metal">Transition Metals</option>
            <option value="metalloid">Metalloids</option>
            <option value="diatomic-nonmetal">Reactive Nonmetals</option>
            <option value="halogen">Halogens</option>
            <option value="noble-gas">Noble Gases</option>
            <option value="post-transition-metal">Post-Transition</option>
            <option value="actinide">Actinides</option>
          </select>
        </div>
      </div>

      {/* Main Grid & Detail Split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left: Element Cards Grid */}
        <div className="lg:col-span-8 overflow-x-auto overflow-y-auto pr-1">
          <div className="min-w-[950px] grid gap-1.5 pb-4 pr-1" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            {mainElements.map((el) => {
              const cat = CATEGORY_COLORS[el.category] || {
                bg: 'bg-stone-50 border-stone-200',
                text: 'text-stone-700',
                label: 'Element',
              };
              const isSelected = activeElement?.number === el.number;
              const matches = !isSearchActive || checkElementMatch(el);

              return (
                <button
                  key={el.number}
                  onClick={() => setActiveElement(el)}
                  style={{
                    gridColumnStart: el.group,
                    gridRowStart: el.period,
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 sm:h-20 ${
                    cat.bg
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md z-10'
                      : 'hover:scale-[1.02] hover:shadow-xs'
                  } ${!matches ? 'opacity-20 grayscale' : ''}`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#8C897F]">
                    <span>{el.number}</span>
                    <span className="hidden sm:inline">{el.mass}</span>
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-extrabold ${cat.text}`}>
                      {el.symbol}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                      {el.name}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Lanthanides Placeholder in main grid */}
            <button
              onClick={() => {
                const la = ELEMENTS_DATA.find((e) => e.number === 57);
                if (la) setActiveElement(la);
              }}
              style={{
                gridColumnStart: 3,
                gridRowStart: 6,
              }}
              className={`p-1.5 sm:p-2 rounded-xl border border-dashed text-left transition-all cursor-pointer flex flex-col justify-between h-16 sm:h-20 bg-orange-50/30 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 ${
                activeElement && activeElement.number >= 57 && activeElement.number <= 71
                  ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md z-10'
                  : 'hover:scale-[1.02]'
              } ${isSearchActive && !hasMatchingLanthanide ? 'opacity-20 grayscale' : ''}`}
            >
              <div className="text-[9px] font-mono text-[#8C897F]">57-71</div>
              <div>
                <div className="text-sm sm:text-base font-extrabold text-orange-700 dark:text-orange-300">La-Lu</div>
                <div className="text-[8px] sm:text-[9px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">Lanthanides</div>
              </div>
            </button>

            {/* Actinides Placeholder in main grid */}
            <button
              onClick={() => {
                const ac = ELEMENTS_DATA.find((e) => e.number === 89);
                if (ac) setActiveElement(ac);
              }}
              style={{
                gridColumnStart: 3,
                gridRowStart: 7,
              }}
              className={`p-1.5 sm:p-2 rounded-xl border border-dashed text-left transition-all cursor-pointer flex flex-col justify-between h-16 sm:h-20 bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ${
                activeElement && activeElement.number >= 89 && activeElement.number <= 103
                  ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md z-10'
                  : 'hover:scale-[1.02]'
              } ${isSearchActive && !hasMatchingActinide ? 'opacity-20 grayscale' : ''}`}
            >
              <div className="text-[9px] font-mono text-[#8C897F]">89-103</div>
              <div>
                <div className="text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-300">Ac-Lr</div>
                <div className="text-[8px] sm:text-[9px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">Actinides</div>
              </div>
            </button>

            {/* Spacers for row 8 (divider row) */}
            <div style={{ gridColumnStart: 1, gridRowStart: 8, height: '16px' }} />

            {/* Row Labels for Lanthanides/Actinides */}
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: 4,
                gridRowStart: 9,
              }}
              className="flex items-center justify-end pr-2 text-[9px] font-bold uppercase tracking-wider text-[#8C897F] select-none font-mono"
            >
              Lanthanides
            </div>
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: 4,
                gridRowStart: 10,
              }}
              className="flex items-center justify-end pr-2 text-[9px] font-bold uppercase tracking-wider text-[#8C897F] select-none font-mono"
            >
              Actinides
            </div>

            {/* Lanthanides Row (Period 9) */}
            {lanthanides.map((el, idx) => {
              const cat = CATEGORY_COLORS[el.category] || {
                bg: 'bg-stone-50 border-stone-200',
                text: 'text-stone-700',
                label: 'Element',
              };
              const isSelected = activeElement?.number === el.number;
              const matches = !isSearchActive || checkElementMatch(el);

              return (
                <button
                  key={el.number}
                  onClick={() => setActiveElement(el)}
                  style={{
                    gridColumnStart: 4 + idx,
                    gridRowStart: 9,
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 sm:h-20 ${
                    cat.bg
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md z-10'
                      : 'hover:scale-[1.02] hover:shadow-xs'
                  } ${!matches ? 'opacity-20 grayscale' : ''}`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#8C897F]">
                    <span>{el.number}</span>
                    <span className="hidden sm:inline">{el.mass}</span>
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-extrabold ${cat.text}`}>
                      {el.symbol}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                      {el.name}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Actinides Row (Period 10) */}
            {actinides.map((el, idx) => {
              const cat = CATEGORY_COLORS[el.category] || {
                bg: 'bg-stone-50 border-stone-200',
                text: 'text-stone-700',
                label: 'Element',
              };
              const isSelected = activeElement?.number === el.number;
              const matches = !isSearchActive || checkElementMatch(el);

              return (
                <button
                  key={el.number}
                  onClick={() => setActiveElement(el)}
                  style={{
                    gridColumnStart: 4 + idx,
                    gridRowStart: 10,
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 sm:h-20 ${
                    cat.bg
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md z-10'
                      : 'hover:scale-[1.02] hover:shadow-xs'
                  } ${!matches ? 'opacity-20 grayscale' : ''}`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#8C897F]">
                    <span>{el.number}</span>
                    <span className="hidden sm:inline">{el.mass}</span>
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-extrabold ${cat.text}`}>
                      {el.symbol}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
                      {el.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Element Inspector Drawer */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between overflow-y-auto">
          {activeElement ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-[#D97757]">
                      {activeElement.symbol}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                        {activeElement.name}
                      </h3>
                      <span className="text-xs text-[#8C897F] font-mono">
                        Atomic #{activeElement.number}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F]">
                  {CATEGORY_COLORS[activeElement.category]?.label || 'Element'}
                </span>
              </div>

              {/* Atomic Details Table */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#DFDACB]/30 dark:border-[#2C2B27]/30">
                  <span className="text-[#8C897F]">Standard Atomic Mass</span>
                  <span className="font-mono font-bold text-[#141413] dark:text-[#FAF9F5]">
                    {activeElement.mass} u
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#DFDACB]/30 dark:border-[#2C2B27]/30">
                  <span className="text-[#8C897F]">Electron Configuration</span>
                  <span className="font-mono font-bold text-[#D97757]">
                    {activeElement.electronConfig}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#DFDACB]/30 dark:border-[#2C2B27]/30">
                  <span className="text-[#8C897F]">Group &amp; Period</span>
                  <span className="font-mono font-bold text-[#141413] dark:text-[#FAF9F5]">
                    Group {activeElement.group}, Period {activeElement.period}
                  </span>
                </div>

                {activeElement.electronegativity && (
                  <div className="flex items-center justify-between py-1.5 border-b border-[#DFDACB]/30 dark:border-[#2C2B27]/30">
                    <span className="text-[#8C897F]">Pauling Electronegativity</span>
                    <span className="font-mono font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {activeElement.electronegativity}
                    </span>
                  </div>
                )}
              </div>

              {/* Scientific Summary */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C897F] block">
                  Scientific Properties &amp; Uses
                </span>
                <p className="text-xs text-[#5C5A54] dark:text-[#B5B2A8] leading-relaxed bg-[#FAF9F5] dark:bg-[#1F1E1B] p-3.5 rounded-2xl border border-[#DFDACB]/40 dark:border-[#2C2B27]/40">
                  {activeElement.summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center text-[#8C897F] text-xs">
              <Atom className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>Select an element to view detailed properties</span>
            </div>
          )}

          <div className="pt-4 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[10px] text-[#8C897F] flex items-center justify-between">
            <span>Verified IUPAC Chemical Standards</span>
            <span className="font-mono">100% In-Browser</span>
          </div>
        </div>

      </div>

      {/* Category Legend */}
      <div className="pt-2.5 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 shrink-0">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[#8C897F] uppercase tracking-wider justify-center">
          {Object.entries(CATEGORY_COLORS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-full shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${value.bg.split(' ')[0]} border border-current`} />
              <span>{value.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
