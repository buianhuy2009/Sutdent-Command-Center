import React, { useState, useMemo } from 'react';
import {
  Layers,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Mail,
  Search,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { Assignment, CanvasAssignment, CanvasSettings, EmailAlert, EmailMessage } from '../../types';
import { CanvasSyncTab } from '../CanvasSyncTab';
import { GoogleClassroomPanel } from '../GoogleClassroomPanel';
import { MoodlePanel } from '../MoodlePanel';
import { GmailRadarTab } from '../GmailRadarTab';

type AcademicSubTab = 'agenda' | 'canvas' | 'classroom' | 'moodle' | 'gmail';

interface AcademicRadarWorkspaceProps {
  assignments: Assignment[];
  canvasAssignments: CanvasAssignment[];
  canvasSettings: CanvasSettings;
  onSaveCanvasSettings: (settings: CanvasSettings) => void;
  isLoadingCanvas: boolean;
  canvasError: string | null;
  lastSyncedAt?: Date | null;
  onFetchCanvas: () => void;
  onSyncCanvasToSheet: (assignment: CanvasAssignment) => Promise<void>;
  onSyncAllPendingCanvas: () => Promise<void>;
  onToggleStatus: (id: string) => void;
  isGoogleConnected: boolean;
  googleToken?: string;
  onConnectGoogle?: () => void;
  // Gmail Scanner Props
  emailAlerts: EmailAlert[];
  rawEmails: EmailMessage[];
  isLoadingEmails: boolean;
  onRefreshEmails: (forceResort?: boolean, options?: any) => void;
  onOpenQuickDraft: (email?: EmailMessage, alert?: EmailAlert) => void;
  onExtractAssignment: (alert: EmailAlert) => void;
  emailError?: string | null;
}

export const AcademicRadarWorkspace: React.FC<AcademicRadarWorkspaceProps> = ({
  assignments,
  canvasAssignments,
  canvasSettings,
  onSaveCanvasSettings,
  isLoadingCanvas,
  canvasError,
  lastSyncedAt,
  onFetchCanvas,
  onSyncCanvasToSheet,
  onSyncAllPendingCanvas,
  onToggleStatus,
  isGoogleConnected,
  googleToken,
  onConnectGoogle,
  emailAlerts,
  rawEmails,
  isLoadingEmails,
  onRefreshEmails,
  onOpenQuickDraft,
  onExtractAssignment,
  emailError,
}) => {
  const [activeTab, setActiveTab] = useState<AcademicSubTab>('agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  // Calculate Unified Chronological Agenda & Milestone Alerts
  const agendaItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return assignments
      .map((a) => {
        const dueDate = new Date(a.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let urgency: 'OVERDUE' | 'DUE_24H' | 'DUE_SOON' | 'UPCOMING' = 'UPCOMING';
        let milestoneAlert: string | null = null;

        if (diffDays < 0 && a.status !== 'Done') {
          urgency = 'OVERDUE';
        } else if (diffDays === 0 || diffDays === 1) {
          urgency = 'DUE_24H';
        } else if (diffDays <= 3) {
          urgency = 'DUE_SOON';
        }

        // Exam / Milestone alerts
        if (diffDays === 14) milestoneAlert = '14-Day Exam Prep Window Opened';
        else if (diffDays === 7) milestoneAlert = '7-Day High-Priority Study Sprint';
        else if (diffDays === 2) milestoneAlert = '48h Final Review & Formula Check';

        return {
          ...a,
          diffDays,
          urgency,
          milestoneAlert,
        };
      })
      .filter((item) => {
        const matchesSearch =
          item.assignmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = filterSubject === 'All' || item.subject === filterSubject;
        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments, searchQuery, filterSubject]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => set.add(a.subject));
    return ['All', ...Array.from(set)];
  }, [assignments]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Academic Radar &amp; LMS Hub
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Coursework agenda, milestones &amp; 14-day exam alerts, Canvas, Classroom, Moodle, and Gmail
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27]">
          {[
            { id: 'agenda', label: 'Chronological Agenda', icon: Calendar },
            { id: 'canvas', label: 'Canvas LMS', icon: Layers },
            { id: 'classroom', label: 'Google Classroom', icon: GraduationCap },
            { id: 'moodle', label: 'Moodle LMS', icon: BookOpen },
            { id: 'gmail', label: 'Gmail Scanner', icon: Mail },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AcademicSubTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#141413] dark:hover:text-[#FAF9F5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Unified Chronological Agenda & Milestone Alerts */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {uniqueSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setFilterSubject(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    filterSubject === sub
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search upcoming deadlines..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>
          </div>

          {/* Agenda List */}
          <div className="space-y-3">
            {agendaItems.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs">
                <CheckSquare className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  All Deadlines Clear!
                </h4>
                <p className="text-xs text-[#8C897F] mt-1 max-w-sm mx-auto">
                  No upcoming assignments or tests matching your criteria. Sync Canvas, Classroom, or Moodle above to refresh coursework.
                </p>
              </div>
            ) : (
              agendaItems.map((item) => {
                const isDone = item.status === 'Done';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      isDone
                        ? 'bg-[#FAF9F5]/60 dark:bg-[#1F1E1B]/60 border-[#DFDACB]/60 dark:border-[#2C2B27]/60 opacity-60'
                        : item.urgency === 'OVERDUE'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80'
                        : item.urgency === 'DUE_24H'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80'
                        : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleStatus(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#252422] hover:border-[#D97757]'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20">
                            {item.subject}
                          </span>

                          {item.urgency === 'OVERDUE' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Overdue
                            </span>
                          )}

                          {item.urgency === 'DUE_24H' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Due in 24h
                            </span>
                          )}

                          {item.milestoneAlert && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span>{item.milestoneAlert}</span>
                            </span>
                          )}

                          <span className="text-[10px] text-[#8C897F] font-mono flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3 text-[#D97757]" />
                            <span>Due: {item.dueDate}</span>
                          </span>
                        </div>

                        <h4
                          className={`text-xs sm:text-sm font-bold mt-1.5 ${
                            isDone ? 'line-through text-[#8C897F]' : 'text-[#141413] dark:text-[#FAF9F5]'
                          }`}
                        >
                          {item.assignmentName}
                        </h4>

                        {item.notes && (
                          <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] mt-1 line-clamp-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.docUrl && (
                      <a
                        href={item.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] flex items-center gap-1 shrink-0 self-end sm:self-center"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. Canvas LMS View */}
      {activeTab === 'canvas' && (
        <CanvasSyncTab
          settings={canvasSettings}
          onSaveSettings={onSaveCanvasSettings}
          canvasAssignments={canvasAssignments}
          isLoading={isLoadingCanvas}
          errorMessage={canvasError}
          lastSyncedAt={lastSyncedAt}
          onFetchCanvas={onFetchCanvas}
          onSyncToSheet={onSyncCanvasToSheet}
          onSyncAllPending={onSyncAllPendingCanvas}
          isGoogleConnected={isGoogleConnected}
          googleToken={googleToken}
          onConnectGoogle={onConnectGoogle}
        />
      )}

      {/* 3. Google Classroom Panel */}
      {activeTab === 'classroom' && (
        <GoogleClassroomPanel
          googleToken={googleToken}
          isGoogleConnected={isGoogleConnected}
          onConnectGoogle={onConnectGoogle}
          onSyncToSheet={onSyncCanvasToSheet}
        />
      )}

      {/* 4. Moodle LMS Panel */}
      {activeTab === 'moodle' && (
        <MoodlePanel onSyncToSheet={onSyncCanvasToSheet} />
      )}

      {/* 5. Gmail Scanner View */}
      {activeTab === 'gmail' && (
        <GmailRadarTab
          emailAlerts={emailAlerts}
          rawEmails={rawEmails}
          isLoadingEmails={isLoadingEmails}
          onRefreshEmails={onRefreshEmails}
          onOpenQuickDraft={onOpenQuickDraft}
          onExtractAssignment={onExtractAssignment}
          isGoogleConnected={isGoogleConnected}
          onConnectGoogle={onConnectGoogle}
          emailError={emailError}
        />
      )}
    </div>
  );
};
