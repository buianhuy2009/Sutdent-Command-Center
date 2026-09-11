// Strict two-mode palette — Anthropic Claude official tokens:
// Light = Canvas #F5F4ED / Ink #141413 / Primary #C96442 / Hairline #F0EEE6 / Muted #5E5D59
// Dark  = Ink #141413 / Canvas text #F5F4ED / Primary #C96442 / Surface-dark #30302E
export type ThemeId = 'linen' | 'midnight';

const THEME_KEY = 'scc_color_theme_v1';
const LEGACY_THEME_KEY = 'scc_theme';

// Single writer of the canonical theme key — the ONLY localStorage.setItem(THEME_KEY, …) call site.
function writeThemeKey(id: ThemeId) {
  try { localStorage.setItem(THEME_KEY, id); } catch {}
}

let legacyMigrated = false;

// One-time migration: read the legacy key once per page load, map
// dark→midnight / light→linen (else migrateThemeId), write via the single
// writer ONLY if the canonical key is missing, then drop the legacy key.
function migrateLegacyThemeKeyOnce() {
  if (legacyMigrated) return;
  legacyMigrated = true;
  try {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy == null) return;
    let mapped: ThemeId;
    if (legacy === 'dark') mapped = 'midnight';
    else if (legacy === 'light') mapped = 'linen';
    else mapped = migrateThemeId(legacy);
    try {
      if (localStorage.getItem(THEME_KEY) == null) {
        writeThemeKey(mapped);
      }
    } catch {}
    try { localStorage.removeItem(LEGACY_THEME_KEY); } catch {}
  } catch {}
}

export const THEME_META: Record<ThemeId, { label: string; accent: string; bg: string }> = {
  linen: { label: 'Claude Canvas (Light)', accent: '#C96442', bg: '#F5F4ED' },
  midnight: { label: 'Dark Charcoal (Dark)', accent: '#C96442', bg: '#141413' },
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
  migrateLegacyThemeKeyOnce();
  try {
    const s = localStorage.getItem(THEME_KEY);
    const migrated = migrateThemeId(s);
    if (s !== migrated) {
      writeThemeKey(migrated);
    }
    return migrated;
  } catch {
    return 'linen';
  }
}

export function setTheme(id: ThemeId) {
  const next = migrateThemeId(id as string);
  writeThemeKey(next);
  document.documentElement.setAttribute('data-theme', next);
  const isDarkTheme = next === 'midnight';
  if (isDarkTheme) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function initTheme() {
  migrateLegacyThemeKeyOnce();
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
  if (t === 'midnight') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
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
