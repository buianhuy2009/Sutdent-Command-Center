import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CanvasAssignment } from '../types';
import { fetchAllClassroomAssignments, getDemoClassroomAssignments } from '../services/googleClassroom';

interface GoogleClassroomPanelProps {
  googleToken?: string;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onSyncToSheet: (assignment: CanvasAssignment) => Promise<void>;
}

export const GoogleClassroomPanel: React.FC<GoogleClassroomPanelProps> = ({
  googleToken,
  isGoogleConnected,
  onConnectGoogle,
  onSyncToSheet,
}) => {
  const [assignments, setAssignments] = useState<CanvasAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('scc_cached_classroom_assignments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [isDemoActive, setIsDemoActive] = useState(false);

  const loadAssignments = async (forceDemo = false) => {
    if (forceDemo) {
      const demoData = getDemoClassroomAssignments();
      setAssignments(demoData);
      setIsDemoActive(true);
      setError(null);
      return;
    }

    if (!googleToken) {
      if (isGoogleConnected) {
        // Connected via Firebase but token might need refresh, fallback to demo if needed
        const demoData = getDemoClassroomAssignments();
        setAssignments(demoData);
        setIsDemoActive(true);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllClassroomAssignments(googleToken);
      if (data.length === 0) {
        // No active courses or empty coursework
        setAssignments(getDemoClassroomAssignments());
        setIsDemoActive(true);
      } else {
        setAssignments(data);
        setIsDemoActive(false);
        try {
          localStorage.setItem('scc_cached_classroom_assignments', JSON.stringify(data));
        } catch {}
      }
    } catch (err: any) {
      console.warn('Classroom API call failed, falling back to demo coursework:', err);
      setError(err?.message || 'Could not connect to Google Classroom API. Google Classroom API may need to be enabled in Google Cloud Console.');
      setAssignments(getDemoClassroomAssignments());
      setIsDemoActive(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (assignments.length === 0) {
      loadAssignments();
    }
  }, [googleToken]);

  const handleSyncItem = async (assignment: CanvasAssignment) => {
    await onSyncToSheet(assignment);
    setSyncedIds((prev) => new Set(prev).add(assignment.id));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                Google Classroom
              </h2>
              {isGoogleConnected && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded-full">
                  {isDemoActive ? 'Demo Coursework' : 'Google Connected'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Sync teacher assignments, due dates, and rubrics from Google Classroom
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!isGoogleConnected && onConnectGoogle && (
            <button
              onClick={onConnectGoogle}
              className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Connect Google</span>
            </button>
          )}

          <button
            onClick={() => loadAssignments(false)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Refresh Classroom Coursework"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D97757]' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Classroom'}</span>
          </button>

          <a
            href="https://classroom.google.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl text-xs font-semibold border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-1 transition-colors"
          >
            <span>Open Classroom</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Info / Enablement Banner if needed */}
      {error && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Google Classroom API Note</p>
              <p className="text-[11px] mt-0.5">
                Showing sample coursework for demonstration. To sync live school classes, ensure &quot;Google Classroom API&quot; is enabled on your Google Cloud project console.
              </p>
            </div>
          </div>
          <a
            href="https://console.cloud.google.com/apis/library/classroom.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 text-xs flex items-center gap-1"
          >
            <span>Enable in Cloud</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Coursework Cards Grid */}
      <section className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <h3 className="font-bold text-[#141413] dark:text-[#FAF9F5] text-xs uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Classroom Coursework ({assignments.length})</span>
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          {assignments.length === 0 ? (
            <div className="py-12 text-center text-[#8C897F] text-xs">
              <p>No coursework found in active Classroom courses.</p>
              <button
                onClick={() => loadAssignments(true)}
                className="mt-2 text-[#D97757] hover:underline font-semibold cursor-pointer"
              >
                Load sample demo coursework
              </button>
            </div>
          ) : (
            assignments.map((work) => {
              const isSynced = syncedIds.has(work.id) || work.isSynced;
              return (
                <div
                  key={work.id}
                  className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                        className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-emerald-600 hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg transition-colors"
                        title="Open in Google Classroom"
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
