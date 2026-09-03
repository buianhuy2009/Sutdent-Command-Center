import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DashboardWidgetId, FontScale, DyslexiaMode } from '../types';
import { db } from '../services/db';

export type Density = 'compact' | 'comfortable' | 'spacious';

interface UIPrefs {
  density: Density;
  fontScale: FontScale;
  dyslexia: DyslexiaMode;
  highContrast: boolean;
  reduceMotion: boolean;
  setDensity: (d: Density) => void;
  setFontScale: (s: FontScale) => void;
  setDyslexia: (m: DyslexiaMode) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
  applyToDom: () => void;
}

function readLS(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeLS(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }

export const useUIPrefsStore = create<UIPrefs>()(
  persist(
    (set, get) => ({
      density: (readLS('scc_ui_density_v1', 'comfortable') as Density),
      fontScale: (readLS('scc_font_scale_v1', 'M') as FontScale),
      dyslexia: (readLS('scc_dyslexia_mode_v1', 'off') as DyslexiaMode),
      highContrast: readLS('scc_high_contrast_v1', 'false') === 'true',
      reduceMotion: readLS('scc_reduce_motion_v1', 'false') === 'true',
      setDensity: (density) => { writeLS('scc_ui_density_v1', density); set({ density }); get().applyToDom(); },
      setFontScale: (fontScale) => { writeLS('scc_font_scale_v1', fontScale); set({ fontScale }); get().applyToDom(); },
      setDyslexia: (dyslexia) => { writeLS('scc_dyslexia_mode_v1', dyslexia); set({ dyslexia }); get().applyToDom(); },
      toggleHighContrast: () => { const v = !get().highContrast; writeLS('scc_high_contrast_v1', String(v)); set({ highContrast: v }); get().applyToDom(); },
      toggleReduceMotion: () => { const v = !get().reduceMotion; writeLS('scc_reduce_motion_v1', String(v)); set({ reduceMotion: v }); get().applyToDom(); },
      applyToDom: () => {
        try {
          const { density, fontScale, dyslexia, highContrast, reduceMotion } = get();
          const html = document.documentElement;
          html.dataset.density = density;
          html.dataset.fontScale = fontScale;
          html.dataset.dyslexia = dyslexia;
          html.classList.toggle('high-contrast', highContrast);
          html.classList.toggle('reduce-motion', reduceMotion);
        } catch {}
      },
    }),
    { name: 'scc_ui_prefs', storage: createJSONStorage(() => localStorage) },
  ),
);

/* Dashboard layout persisted in Dexie (not localStorage sprawl) */

export interface DashboardLayoutState {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
  sizes: Record<string, 'sm' | 'md' | 'lg'>;
  setOrder: (o: DashboardWidgetId[]) => void;
  toggleHide: (id: DashboardWidgetId) => void;
  setSize: (id: string, s: 'sm' | 'md' | 'lg') => void;
  load: () => Promise<void>;
}

const DEFAULT_ORDER: DashboardWidgetId[] = ['today-glance', 'upcoming-deadlines', 'important-emails', 'pinned-tools', 'quote-of-day', 'course-updates', 'scratchpad'];

export const useDashboardLayoutStore = create<DashboardLayoutState>()((set, get) => ({
  order: DEFAULT_ORDER,
  hidden: [],
  sizes: {},
  setOrder: (order) => {
    set({ order });
    db.dashboard.put({ id: 'main', order, hidden: get().hidden, sizes: get().sizes }).catch(() => {});
  },
  toggleHide: (id) => {
    const hidden = get().hidden.includes(id) ? get().hidden.filter((x) => x !== id) : [...get().hidden, id];
    set({ hidden });
    db.dashboard.put({ id: 'main', order: get().order, hidden, sizes: get().sizes }).catch(() => {});
  },
  setSize: (id, s) => {
    const sizes = { ...get().sizes, [id]: s };
    set({ sizes });
    db.dashboard.put({ id: 'main', order: get().order, hidden: get().hidden, sizes }).catch(() => {});
  },
  load: async () => {
    try {
      const saved = await db.dashboard.get('main');
      if (saved) {
        const order = (Array.isArray(saved.order) && saved.order.length ? saved.order : DEFAULT_ORDER) as DashboardWidgetId[];
        const hidden = (Array.isArray(saved.hidden) ? saved.hidden : []) as DashboardWidgetId[];
        const sizes = (saved.sizes ?? {}) as Record<string, 'sm' | 'md' | 'lg'>;
        set({ order, hidden, sizes });
      }
    } catch {}
  },
}));

export function initUIPrefs() {
  try { useUIPrefsStore.getState().applyToDom(); } catch {}
  try { useDashboardLayoutStore.getState().load(); } catch {}
}
