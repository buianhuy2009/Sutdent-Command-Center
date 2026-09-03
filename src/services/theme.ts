export type ThemeId = 'linen' | 'nord' | 'dracula' | 'catppuccin' | 'cyberpunk' | 'midnight' | 'ocean' | 'forest';

const THEME_KEY = 'scc_color_theme_v1';

export const THEME_META: Record<ThemeId, { label: string; accent: string; bg: string }> = {
  linen: { label: 'Warm Cream (Light)', accent: '#D97757', bg: '#FAF9F5' },
  midnight: { label: 'Dark Charcoal (Dark)', accent: '#D97757', bg: '#141413' },
  ocean: { label: 'Ocean Depth', accent: '#38BDF8', bg: '#0B132B' },
  forest: { label: 'Forest Calm', accent: '#10B981', bg: '#061A14' },
  nord: { label: 'Nord Frost', accent: '#88C0D0', bg: '#242933' },
  dracula: { label: 'Dracula Glow', accent: '#FF79C6', bg: '#1E1F29' },
  catppuccin: { label: 'Catppuccin Mocha', accent: '#CBA6F7', bg: '#1E1E2E' },
  cyberpunk: { label: 'Cyberpunk Neon', accent: '#00FFFF', bg: '#09090E' },
};

export function getTheme(): ThemeId {
  try {
    const s = localStorage.getItem(THEME_KEY) as ThemeId | null;
    return s || 'linen';
  } catch {
    return 'linen';
  }
}

export function setTheme(id: ThemeId) {
  try { localStorage.setItem(THEME_KEY, id); } catch {}
  document.documentElement.setAttribute('data-theme', id);
  const isDarkTheme = ['nord', 'dracula', 'catppuccin', 'cyberpunk', 'midnight', 'ocean', 'forest'].includes(id);
  if (isDarkTheme) {
    document.documentElement.classList.add('dark');
    try { localStorage.setItem('scc_theme', 'dark'); } catch {}
  } else {
    document.documentElement.classList.remove('dark');
    try { localStorage.setItem('scc_theme', 'light'); } catch {}
  }
  document.documentElement.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function initTheme() {
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
  const isDarkTheme = ['nord', 'dracula', 'catppuccin', 'cyberpunk', 'midnight', 'ocean', 'forest'].includes(t);
  if (isDarkTheme) {
    document.documentElement.classList.add('dark');
  } else {
    try {
      const s = localStorage.getItem('scc_theme');
      // Light is default when signing up / first open unless user explicitly chose dark
      if (s === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      document.documentElement.classList.remove('dark');
    }
  }
  document.documentElement.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function syncDarkToTheme(isDark: boolean) {
  const cur = getTheme();
  const isDarkTheme = ['nord', 'dracula', 'catppuccin', 'cyberpunk', 'midnight', 'ocean', 'forest'].includes(cur);
  if (isDark && !isDarkTheme) {
    setTheme('midnight');
  } else if (!isDark && isDarkTheme) {
    setTheme('linen');
  } else {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('scc_theme', isDark ? 'dark' : 'light'); } catch {}
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
