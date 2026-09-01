export type ThemeId = 'linen' | 'nord' | 'dracula' | 'catppuccin' | 'cyberpunk' | 'midnight' | 'ocean' | 'forest';

const THEME_KEY = 'scc_color_theme_v1';

export const THEME_META: Record<ThemeId, { label: string; accent: string; bg: string }> = {
  linen: { label: 'Parchment Linen', accent: '#D97757', bg: '#FAF9F5' },
  nord: { label: 'Nord Frost', accent: '#88C0D0', bg: '#2E3440' },
  dracula: { label: 'Dracula', accent: '#FF79C6', bg: '#282A36' },
  catppuccin: { label: 'Catppuccin Mocha', accent: '#CBA6F7', bg: '#1E1E2E' },
  cyberpunk: { label: 'Cyberpunk Neon', accent: '#00FFFF', bg: '#0A0A12' },
  midnight: { label: 'Midnight', accent: '#6366F1', bg: '#0A0A0C' },
  ocean: { label: 'Ocean Depth', accent: '#0EA5E9', bg: '#0B132B' },
  forest: { label: 'Forest', accent: '#10B981', bg: '#061A14' },
};

export function getTheme(): ThemeId {
  try { const s = localStorage.getItem(THEME_KEY) as ThemeId | null; return s || 'linen'; } catch { return 'linen'; }
}
export function setTheme(id: ThemeId) {
  try { localStorage.setItem(THEME_KEY, id); } catch {}
  document.documentElement.setAttribute('data-theme', id);
  // keep dark class for existing dark mode logic; nord/dracula etc are dark by nature so ensure dark class
  if (['nord','dracula','catppuccin','cyberpunk','midnight','ocean','forest'].includes(id)) {
    document.documentElement.classList.add('dark');
  }
}
export function initTheme() {
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
}
