import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, migrateLocalStorageToDexie } from './db';

describe('migrateLocalStorageToDexie', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.preferences.clear();
    await db.notes.clear();
    await db.srsCards.clear();
    await db.assignments.clear();
    await db.quota.clear();
  });

  it('migrates preference keys from localStorage into Dexie preferences table', async () => {
    // Seed mock items into localStorage
    localStorage.setItem('scc_user_preferred_name', JSON.stringify('Alex'));
    localStorage.setItem('scc_user_daily_intention', JSON.stringify('Ace finals'));
    localStorage.setItem('scc_theme', 'dark'); // non-JSON plain string
    localStorage.setItem('scc_pinned_apps_v2', JSON.stringify(['canvas', 'notes']));

    const start = performance.now();
    await migrateLocalStorageToDexie();
    const duration = performance.now() - start;

    console.log(`[Optimized/Test] Preference migration duration: ${duration.toFixed(3)}ms`);

    const name = await db.preferences.get('scc_user_preferred_name');
    expect(name?.value).toBe('Alex');

    const intention = await db.preferences.get('scc_user_daily_intention');
    expect(intention?.value).toBe('Ace finals');

    const theme = await db.preferences.get('scc_theme');
    expect(theme?.value).toBe('dark');

    const pinned = await db.preferences.get('scc_pinned_apps_v2');
    expect(pinned?.value).toEqual(['canvas', 'notes']);
  });

  it('benchmark: measures bulk migration performance with all 15 keys populated', async () => {
    const prefKeys = [
      'scc_user_preferred_name',
      'scc_user_daily_intention',
      'scc_user_selected_vibe',
      'scc_user_sprint_goal',
      'scc_canvas_settings_v1',
      'scc_gemini_daily_quota_v1',
      'scc_pinned_apps_v2',
      'scc_recent_tabs_v1',
      'scc_app_usage_v1',
      'scc_sidebar_expanded',
      'scc_theme',
      'scc_color_theme_v1',
      'scc_ui_density_v1',
      'scc_shortcut_settings',
      'scc_dashboard_personalize_open',
    ];

    for (let i = 0; i < prefKeys.length; i++) {
      localStorage.setItem(prefKeys[i], JSON.stringify({ index: i, value: `pref-value-${i}` }));
    }

    const start = performance.now();
    await migrateLocalStorageToDexie();
    const duration = performance.now() - start;

    console.log(`[Optimized Benchmark] Migrating 15 preference keys took ${duration.toFixed(3)}ms`);

    const count = await db.preferences.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });
});
