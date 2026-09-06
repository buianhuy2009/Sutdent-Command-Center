// Strict two-mode palette (user requirement):
// Light = Warm Cream bg #FAF9F5 / Charcoal text #141413 / Terracotta accent #D97757
// Dark  = Charcoal bg #141413 / Cream text #FAF9F5 / Terracotta accent #D97757
export type ThemeId = 'linen' | 'midnight';

const THEME_KEY = 'scc_color_theme_v1';

export const THEME_META: Record<ThemeId, { label: string; accent: string; bg: string }> = {
  linen: { label: 'Warm Cream (Light)', accent: '#D97757', bg: '#FAF9F5' },
  midnight: { label: 'Dark Charcoal (Dark)', accent: '#D97757', bg: '#141413' },
};

// Legacy palettes (ocean/forest/nord/dracula/catppuccin/cyberpunk/parchment) were
// removed — migrate any stored value so dark mode is always #141413, never tinted.
const LEGACY_DARK_THEMES = ['midnight', 'ocean', 'forest', 'nord', 'dracula', 'catppuccin', 'cyberpunk'];

function migrateThemeId(raw: string | null): ThemeId {
  if (raw === 'midnight') return 'midnight';
  if (raw === 'linen' || raw === 'parchment') return 'linen';
  if (raw && LEGACY_DARK_THEMES.includes(raw)) return 'midnight';
  if (raw === 'dark') return 'midnight';
  if (raw === 'light') return 'linen';
  return 'linen';
}

export function getTheme(): ThemeId {
  try {
    const s = localStorage.getItem(THEME_KEY);
    const migrated = migrateThemeId(s);
    if (s !== migrated) {
      try { localStorage.setItem(THEME_KEY, migrated); } catch {}
    }
    return migrated;
  } catch {
    return 'linen';
  }
}

export function setTheme(id: ThemeId) {
  const next = migrateThemeId(id as string);
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  document.documentElement.setAttribute('data-theme', next);
  const isDarkTheme = next === 'midnight';
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
  if (t === 'midnight') {
    document.documentElement.classList.add('dark');
  } else {
    try {
      const s = localStorage.getItem('scc_theme');
      // Light is default when signing up / first open unless user explicitly chose dark
      if (s === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'midnight');
        try { localStorage.setItem(THEME_KEY, 'midnight'); } catch {}
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
  if (isDark) {
    setTheme('midnight');
  } else {
    setTheme('linen');
  }
}
