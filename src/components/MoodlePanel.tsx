import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  Key,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { CanvasAssignment } from '../types';
import {
  loadMoodleSettings,
  saveMoodleSettings,
  fetchMoodleAssignmentsFromIcs,
  fetchMoodleAssignmentsFromApi,
  MoodleSettings,
} from '../services/moodle';

interface MoodlePanelProps {
  onSyncToSheet: (assignment: CanvasAssignment) => Promise<void>;
}

export const MoodlePanel: React.FC<MoodlePanelProps> = ({ onSyncToSheet }) => {
  const [settings, setSettings] = useState<MoodleSettings>(loadMoodleSettings);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [feedUrlInput, setFeedUrlInput] = useState(settings.calendarFeedUrl || '');
  const [moodleUrlInput, setMoodleUrlInput] = useState(settings.moodleUrl || '');
  const [moodleTokenInput, setMoodleTokenInput] = useState(settings.moodleToken || '');

  const [assignments, setAssignments] = useState<CanvasAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('scc_cached_moodle_assignments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MoodleSettings = {
      moodleUrl: moodleUrlInput.trim(),
      moodleToken: moodleTokenInput.trim(),
      calendarFeedUrl: feedUrlInput.trim(),
      lastSyncedAt: new Date().toISOString(),
    };
    setSettings(updated);
    saveMoodleSettings(updated);
    setShowSettingsDrawer(false);
    loadAssignments(updated);
  };

  const loadAssignments = async (overrideSettings?: MoodleSettings) => {
    const currentSettings = overrideSettings || settings;
    if (!currentSettings.calendarFeedUrl && (!currentSettings.moodleUrl || !currentSettings.moodleToken)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let data: CanvasAssignment[] = [];
      if (currentSettings.calendarFeedUrl) {
        data = await fetchMoodleAssignmentsFromIcs(currentSettings.calendarFeedUrl);
      } else if (currentSettings.moodleUrl && currentSettings.moodleToken) {
        data = await fetchMoodleAssignmentsFromApi(currentSettings.moodleUrl, currentSettings.moodleToken);
      }

      setAssignments(data);
      try {
        localStorage.setItem('scc_cached_moodle_assignments', JSON.stringify(data));
      } catch {}
    } catch (err: any) {
      console.warn('Moodle fetch failed:', err);
      setError(err?.message || 'Could not fetch Moodle assignments. Please check URL or feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured && assignments.length === 0) {
      loadAssignments();
    }
  }, []);

  const handleSyncItem = async (assignment: CanvasAssignment) => {
    await onSyncToSheet(assignment);
    setSyncedIds((prev) => new Set(prev).add(assignment.id));
  };

  const isConfigured = Boolean(settings.calendarFeedUrl || (settings.moodleUrl && settings.moodleToken));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                Moodle LMS
              </h2>
              {isConfigured && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded-full">
                  Configured
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Sync real quizzes, homework, and deadlines from your school&apos;s Moodle portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showSettingsDrawer ? 'Close Settings' : 'Settings'}</span>
          </button>

          <button
            onClick={() => loadAssignments()}
            disabled={isLoading || !isConfigured}
            className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Moodle'}</span>
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <section className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase text-[#141413] dark:text-[#FAF9F5] tracking-wider">
            Moodle Connection Settings
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                Option A: Moodle Calendar Export URL (.ics / webcal://) [Easiest]
              </label>
              <input
                type="text"
                value={feedUrlInput}
                onChange={(e) => setFeedUrlInput(e.target.value)}
                placeholder="https://moodle.school.edu/calendar/export_execute.php?..."
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
              <p className="text-[11px] text-[#8C897F] mt-1">
                Found on your school Moodle -&gt; Calendar -&gt; Export Calendar (select &quot;All events&quot; and &quot;Recent and next 60 days&quot;).
              </p>
            </div>

            <div className="pt-2 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-2">
                Option B: Moodle Web Services API (For Schools with Web Services Enabled)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    School Moodle URL
                  </label>
                  <input
                    type="url"
                    value={moodleUrlInput}
                    onChange={(e) => setMoodleUrlInput(e.target.value)}
                    placeholder="https://moodle.myschool.edu"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Moodle Web Service Token
                  </label>
                  <input
                    type="password"
                    value={moodleTokenInput}
                    onChange={(e) => setMoodleTokenInput(e.target.value)}
                    placeholder="Security token from Moodle profile"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Save &amp; Sync
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 text-xs cursor-pointer"
          >
            Edit Settings
          </button>
        </div>
      )}

      {/* Coursework Cards Grid */}
      <section className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <h3 className="font-bold text-[#141413] dark:text-[#FAF9F5] text-xs uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Moodle Assignments ({assignments.length})</span>
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          {!isConfigured ? (
            <div className="py-12 px-4 text-center bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-dashed border-[#DFDACB] dark:border-[#2C2B27]">
              <BookOpen className="w-10 h-10 mx-auto text-amber-600 mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">Connect School Moodle Portal</h4>
              <p className="text-xs text-[#8C897F] mt-1 max-w-sm mx-auto">
                Paste your personal Moodle calendar export feed URL (.ics) or enter your Web Services API credentials to sync your school courses.
              </p>
              <button
                onClick={() => setShowSettingsDrawer(true)}
                className="mt-3.5 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Configure Moodle Settings
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center text-[#8C897F] text-xs">
              <p>No assignments found in your connected Moodle feed.</p>
              <p className="text-[11px] text-[#8C897F]/80 mt-1">
                When new tasks are published on your Moodle portal, click &quot;Sync Moodle&quot; to refresh.
              </p>
            </div>
          ) : (
            assignments.map((work) => {
              const isSynced = syncedIds.has(work.id) || work.isSynced;
              return (
                <div
                  key={work.id}
                  className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {work.courseName}
                      </span>
                      {work.dueAt && (
                        <span className="text-[10px] text-[#8C897F] flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-[#D97757]" />
                          <span>Due {work.dueAt}</span>
                        </span>
                      )}
                      {work.pointsPossible !== undefined && (
                        <span className="text-[10px] text-[#8C897F] font-mono">
                          {work.pointsPossible} pts
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-1.5">
                      {work.name}
                    </h4>

                    {work.description && (
                      <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] mt-1 line-clamp-2">
                        {work.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <button
                      onClick={() => handleSyncItem(work)}
                      disabled={isSynced}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isSynced
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] hover:border-[#D97757] border-[#DFDACB] dark:border-[#2C2B27]'
                      }`}
                    >
                      {isSynced ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Tracker</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#D97757]" />
                          <span>Add to Tracker</span>
                        </>
                      )}
                    </button>

                    {work.htmlUrl && (
                      <a
                        href={work.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-amber-600 hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg transition-colors"
                        title="Open in Moodle"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
