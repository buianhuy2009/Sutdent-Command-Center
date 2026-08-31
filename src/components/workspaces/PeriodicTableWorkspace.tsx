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

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: string;
  group: number;
  period: number;
  electronConfig: string;
  electronegativity?: number;
  summary: string;
}

export const ELEMENTS_DATA: ChemicalElement[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: '1.008', category: 'diatomic-nonmetal', group: 1, period: 1, electronConfig: '1s1', electronegativity: 2.20, summary: 'Colorless, odorless, highly flammable gas; most abundant chemical substance in the universe.' },
  { number: 2, symbol: 'He', name: 'Helium', mass: '4.0026', category: 'noble-gas', group: 18, period: 1, electronConfig: '1s2', summary: 'Colorless, odorless, tasteless, non-toxic, inert noble gas; second lightest and second most abundant element.' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: '6.94', category: 'alkali-metal', group: 1, period: 2, electronConfig: '[He] 2s1', electronegativity: 0.98, summary: 'Soft, silvery-white alkali metal; least dense of all solid elements.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: '9.0122', category: 'alkaline-earth', group: 2, period: 2, electronConfig: '[He] 2s2', electronegativity: 1.57, summary: 'Relatively rare metal in the universe; forms minerals such as beryl and emerald.' },
  { number: 5, symbol: 'B', name: 'Boron', mass: '10.81', category: 'metalloid', group: 13, period: 2, electronConfig: '[He] 2s2 2p1', electronegativity: 2.04, summary: 'Low-abundance metalloid used in fiberglass and semiconductors.' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: '12.011', category: 'polyatomic-nonmetal', group: 14, period: 2, electronConfig: '[He] 2s2 2p2', electronegativity: 2.55, summary: 'Basis of all organic chemistry and life; forms allotropes including graphite and diamond.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: '14.007', category: 'diatomic-nonmetal', group: 15, period: 2, electronConfig: '[He] 2s2 2p3', electronegativity: 3.04, summary: 'Makes up about 78% of Earth\'s atmosphere; vital constituent of amino acids and proteins.' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: '15.999', category: 'diatomic-nonmetal', group: 16, period: 2, electronConfig: '[He] 2s2 2p4', electronegativity: 3.44, summary: 'Highly reactive nonmetal and oxidizing agent; essential for cellular respiration in aerobic organisms.' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: '18.998', category: 'halogen', group: 17, period: 2, electronConfig: '[He] 2s2 2p5', electronegativity: 3.98, summary: 'Extremely reactive and electronegative halogen gas; forms compounds with almost all elements.' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: '20.180', category: 'noble-gas', group: 18, period: 2, electronConfig: '[He] 2s2 2p6', summary: 'Colorless, odorless noble gas that gives a reddish-orange glow in vacuum discharge tubes.' },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: '22.990', category: 'alkali-metal', group: 1, period: 3, electronConfig: '[Ne] 3s1', electronegativity: 0.93, summary: 'Soft, silvery-white, highly reactive alkali metal; essential for cellular osmotic balance.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: '24.305', category: 'alkaline-earth', group: 2, period: 3, electronConfig: '[Ne] 3s2', electronegativity: 1.31, summary: 'Shiny gray solid; central element in the chlorophyll molecule enabling photosynthesis.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', mass: '26.982', category: 'post-transition-metal', group: 13, period: 3, electronConfig: '[Ne] 3s2 3p1', electronegativity: 1.61, summary: 'Low density, high corrosion resistance metal widely used in aerospace and packaging.' },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: '28.085', category: 'metalloid', group: 14, period: 3, electronConfig: '[Ne] 3s2 3p2', electronegativity: 1.90, summary: 'Hard, brittle crystalline metalloid; cornerstone of the modern semiconductor computer industry.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: '30.974', category: 'polyatomic-nonmetal', group: 15, period: 3, electronConfig: '[Ne] 3s2 3p3', electronegativity: 2.19, summary: 'Essential for DNA, RNA, ATP, and cell membranes; exists in white and red allotropes.' },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: '32.06', category: 'polyatomic-nonmetal', group: 16, period: 3, electronConfig: '[Ne] 3s2 3p4', electronegativity: 2.58, summary: 'Bright yellow crystalline solid at room temperature; essential component of cysteine and methionine.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: '35.45', category: 'halogen', group: 17, period: 3, electronConfig: '[Ne] 3s2 3p5', electronegativity: 3.16, summary: 'Yellow-green halogen gas; strong disinfectant and component of table salt (NaCl).' },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: '39.948', category: 'noble-gas', group: 18, period: 3, electronConfig: '[Ne] 3s2 3p6', summary: 'Third-most abundant gas in the Earth\'s atmosphere; used as an inert shielding gas in welding.' },
  { number: 19, symbol: 'K', name: 'Potassium', mass: '39.098', category: 'alkali-metal', group: 1, period: 4, electronConfig: '[Ar] 4s1', electronegativity: 0.82, summary: 'Soft silvery alkali metal; vital electrolyte required for neural transmission and muscle contraction.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: '40.078', category: 'alkaline-earth', group: 2, period: 4, electronConfig: '[Ar] 4s2', electronegativity: 1.00, summary: 'Essential structural component of bone, teeth, and cellular signaling pathways.' },
  { number: 21, symbol: 'Sc', name: 'Scandium', mass: '44.956', category: 'transition-metal', group: 3, period: 4, electronConfig: '[Ar] 3d1 4s2', electronegativity: 1.36, summary: 'Light transition metal alloyed with aluminum for high-performance sporting goods and aerospace.' },
  { number: 22, symbol: 'Ti', name: 'Titanium', mass: '47.867', category: 'transition-metal', group: 4, period: 4, electronConfig: '[Ar] 3d2 4s2', electronegativity: 1.54, summary: 'High strength-to-weight ratio and corrosion resistance; used in aircraft and medical implants.' },
  { number: 23, symbol: 'V', name: 'Vanadium', mass: '50.942', category: 'transition-metal', group: 5, period: 4, electronConfig: '[Ar] 3d3 4s2', electronegativity: 1.63, summary: 'Hard, silvery-grey metal used to produce high-strength steel alloys for tools and axles.' },
  { number: 24, symbol: 'Cr', name: 'Chromium', mass: '51.996', category: 'transition-metal', group: 6, period: 4, electronConfig: '[Ar] 3d5 4s1', electronegativity: 1.66, summary: 'Steely-grey, lustrous metal with high polish; principal additive in stainless steel.' },
  { number: 25, symbol: 'Mn', name: 'Manganese', mass: '54.938', category: 'transition-metal', group: 7, period: 4, electronConfig: '[Ar] 3d5 4s2', electronegativity: 1.55, summary: 'Essential industrial metal used in iron and steel production, batteries, and enzyme cofactors.' },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: '55.845', category: 'transition-metal', group: 8, period: 4, electronConfig: '[Ar] 3d6 4s2', electronegativity: 1.83, summary: 'Most common element on Earth by mass; forms the active oxygen-transport center of hemoglobin.' },
  { number: 27, symbol: 'Co', name: 'Cobalt', mass: '58.933', category: 'transition-metal', group: 9, period: 4, electronConfig: '[Ar] 3d7 4s2', electronegativity: 1.88, summary: 'Ferromagnetic transition metal used in rechargeable lithium-ion batteries and magnetic alloys.' },
  { number: 28, symbol: 'Ni', name: 'Nickel', mass: '58.693', category: 'transition-metal', group: 10, period: 4, electronConfig: '[Ar] 3d8 4s2', electronegativity: 1.91, summary: 'Corrosion-resistant metal used in plating, stainless steel, and coinage.' },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: '63.546', category: 'transition-metal', group: 11, period: 4, electronConfig: '[Ar] 3d10 4s1', electronegativity: 1.90, summary: 'High electrical and thermal conductivity; foundational for global electrical wiring and electronics.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: '65.38', category: 'transition-metal', group: 12, period: 4, electronConfig: '[Ar] 3d10 4s2', electronegativity: 1.65, summary: 'Used in galvanization to prevent rusting of steel, and as an essential biological trace element.' },
  { number: 35, symbol: 'Br', name: 'Bromine', mass: '79.904', category: 'halogen', group: 17, period: 4, electronConfig: '[Ar] 3d10 4s2 4p5', electronegativity: 2.96, summary: 'Fuming red-brown liquid at room temperature; one of only two liquid elements at STP.' },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: '107.87', category: 'transition-metal', group: 11, period: 5, electronConfig: '[Kr] 4d10 5s1', electronegativity: 1.93, summary: 'Highest electrical and thermal conductivity and highest reflectivity of any known metal.' },
  { number: 53, symbol: 'I', name: 'Iodine', mass: '126.90', category: 'halogen', group: 17, period: 5, electronConfig: '[Kr] 4d10 5s2 5p5', electronegativity: 2.66, summary: 'Lustrous purple-black solid that sublimes into violet gas; essential for thyroid hormone synthesis.' },
  { number: 79, symbol: 'Au', name: 'Gold', mass: '196.97', category: 'transition-metal', group: 11, period: 6, electronConfig: '[Xe] 4f14 5d10 6s1', electronegativity: 2.54, summary: 'Highly unreactive precious noble metal; resistant to corrosion and prized for jewelry and electronics.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: '200.59', category: 'transition-metal', group: 12, period: 6, electronConfig: '[Xe] 4f14 5d10 6s2', electronegativity: 2.00, summary: 'Heavy silvery d-block element; the only metallic element that is liquid at standard conditions.' },
  { number: 92, symbol: 'U', name: 'Uranium', mass: '238.03', category: 'actinide', group: 3, period: 7, electronConfig: '[Rn] 5f3 6d1 7s2', electronegativity: 1.38, summary: 'Radioactive actinide metal used as primary fuel in commercial nuclear power plants.' },
];

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

  const filteredElements = useMemo(() => {
    return ELEMENTS_DATA.filter((el) => {
      const matchesSearch =
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.number.toString().includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || el.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
        <div className="lg:col-span-8 overflow-y-auto pr-1 space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {filteredElements.map((el) => {
              const cat = CATEGORY_COLORS[el.category] || {
                bg: 'bg-stone-50 border-stone-200',
                text: 'text-stone-700',
                label: 'Element',
              };
              const isSelected = activeElement?.number === el.number;

              return (
                <button
                  key={el.number}
                  onClick={() => setActiveElement(el)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    cat.bg
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#D97757] scale-[1.03] shadow-md'
                      : 'hover:scale-[1.02] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8C897F]">
                    <span>{el.number}</span>
                    <span>{el.mass}</span>
                  </div>
                  <div>
                    <div className={`text-xl font-extrabold ${cat.text}`}>
                      {el.symbol}
                    </div>
                    <div className="text-[10px] font-bold text-[#141413] dark:text-[#FAF9F5] truncate">
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

    </div>
  );
};
