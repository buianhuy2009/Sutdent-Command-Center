import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Video,
  CheckCircle2,
  Layers,
  Mail,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { CalendarEvent, CanvasAssignment, ApiEnablementInfo, Assignment } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';
import { toMobileDeepLink } from '../services/canvas';
import { suggestStudySlots, StudySlotResult, StudySlotSuggestion } from '../services/gemini';

interface DailyRadarTabProps {
  events: CalendarEvent[];
  isLoadingEvents: boolean;
  onRefreshEvents: () => void;
  onOpenScheduleModal: (event?: Partial<CalendarEvent>) => void;
  onNavigateToTab?: (tab: string) => void;
  urgentCanvasItems?: CanvasAssignment[];
  allCanvasAssignments?: CanvasAssignment[];
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  calendarError?: string | null;
  calendarApiInfo?: ApiEnablementInfo | null;
  pendingAssignments?: Assignment[];
  onAddStudyBlock?: (eventData: { title: string; description: string; startDateTime: string; endDateTime: string }) => Promise<void>;
}

export const DailyRadarTab: React.FC<DailyRadarTabProps> = ({
  events,
  isLoadingEvents,
  onRefreshEvents,
  onOpenScheduleModal,
  onNavigateToTab,
  urgentCanvasItems = [],
  allCanvasAssignments = [],
  isGoogleConnected = true,
  onConnectGoogle,
  calendarError,
  calendarApiInfo,
  pendingAssignments = [],
  onAddStudyBlock,
}) => {
  const now = new Date();
  
  // Format current date as YYYY-MM-DD in local time
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${localYear}-${localMonth}-${localDay}`;

  // AI Chronotype Study Slot states
  const [showChronotypePanel, setShowChronotypePanel] = useState(false);
  const [chronotype, setChronotype] = useState<'morning' | 'balanced' | 'evening'>('morning');
  const [isSuggestingSlots, setIsSuggestingSlots] = useState(false);
  const [studySlotResult, setStudySlotResult] = useState<StudySlotResult | null>(null);
  const [schedulingSlotIndex, setSchedulingSlotIndex] = useState<number | null>(null);

  const handleGenerateSlots = async () => {
    setIsSuggestingSlots(true);
    try {
      const result = await suggestStudySlots(events, pendingAssignments, chronotype, todayStr);
      setStudySlotResult(result);
    } catch (err) {
      console.error('Failed to suggest study slots:', err);
    } finally {
      setIsSuggestingSlots(false);
    }
  };

  const handleApplySlot = async (slot: StudySlotSuggestion, idx: number) => {
    if (!onAddStudyBlock) return;
    setSchedulingSlotIndex(idx);
    try {
      const startDateTime = `${todayStr}T${slot.startTime}:00`;
      const endDateTime = `${todayStr}T${slot.endTime}:00`;
      await onAddStudyBlock({
        title: `Focus: ${slot.taskName} (${slot.taskSubject})`,
        description: `Scheduled via AI Chronotype Blocker.\nReason: ${slot.reason}`,
        startDateTime,
        endDateTime,
      });
      setStudySlotResult((prev) =>
        prev
          ? {
              ...prev,
              suggestedSlots: prev.suggestedSlots.filter((_, i) => i !== idx),
            }
          : null
      );
    } catch (err) {
      console.error('Error applying study slot:', err);
    } finally {
      setSchedulingSlotIndex(null);
    }
  };

  const canvasTimelineItems = allCanvasAssignments
    .filter((a) => a.dueAt === todayStr && !a.isCompleted)
    .map((a) => ({
      id: a.id,
      summary: `Canvas: ${a.name} (${a.pointsPossible !== undefined ? `${a.pointsPossible} pts` : 'Ungraded'})`,
      description: a.description,
      location: a.courseName,
      start: { dateTime: a.dueAt ? `${a.dueAt}T23:59:00` : undefined },
      end: { dateTime: a.dueAt ? `${a.dueAt}T23:59:59` : undefined },
      htmlLink: a.htmlUrl,
      isCanvas: true,
      isStudyBlock: false,
      hangoutLink: undefined,
    }));

  const combinedTimeline = [
    ...events.map(e => ({ ...e, isCanvas: false })),
    ...canvasTimelineItems
  ].sort((a, b) => {
    const timeA = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
    const timeB = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
    return timeA - timeB;
  });

  const nextUpcomingEvent = combinedTimeline.find((e) => {
    if (!e.start?.dateTime) return false;
    return new Date(e.start.dateTime) > now;
  });

  const minutesUntilNext = nextUpcomingEvent?.start?.dateTime
    ? Math.round((new Date(nextUpcomingEvent.start.dateTime).getTime() - now.getTime()) / (1000 * 60))
    : null;

  const formatEventTime = (isoString?: string) => {
    if (!isoString) return 'All Day';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Clean Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {events.length} {events.length === 1 ? 'event' : 'events'} scheduled today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowChronotypePanel(!showChronotypePanel)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showChronotypePanel
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800'
            }`}
            title="AI automatically finds calendar gaps and schedules study blocks based on your energy rhythm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Chronotype Blocker</span>
          </button>

          <button
            onClick={() => onOpenScheduleModal()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Focus Block</span>
          </button>

          <button
            id="btn-refresh-schedule-radar"
            onClick={onRefreshEvents}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Sync Schedule with Google Calendar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showChronotypePanel && (
        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-2xl space-y-4 animate-in slide-in-from-top-3 duration-250">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider">
                Select your peak cognitive hours
              </h4>
              <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">
                AI schedules study blocks when your brain has the most energy.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChronotype('morning')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  chronotype === 'morning'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Morning (7am-12pm)
              </button>
              <button
                type="button"
                onClick={() => setChronotype('balanced')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  chronotype === 'balanced'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setChronotype('evening')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  chronotype === 'evening'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Night Owl (4pm-10pm)
              </button>
            </div>      </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pendingAssignments.length} pending tasks eligible for study scheduling
            </span>
            <button
              onClick={handleGenerateSlots}
              disabled={isSuggestingSlots}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSuggestingSlots ? 'animate-spin' : ''}`} />
              <span>{isSuggestingSlots ? 'Calculating Gaps...' : 'Generate Study Blocks'}</span>
            </button>
          </div>

          {/* Render Suggestions */}
          {studySlotResult && (
            <div className="space-y-3 pt-2">
              {studySlotResult.chronotypeAdvice && (
                <div className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>{studySlotResult.chronotypeAdvice}</span>
                </div>
              )}

              {studySlotResult.suggestedSlots.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  All suggested slots have been added to your calendar!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studySlotResult.suggestedSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {slot.taskSubject}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                          {slot.taskName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {slot.reason}
                        </p>
                      </div>

                      <button
                        onClick={() => handleApplySlot(slot, idx)}
                        disabled={schedulingSlotIndex === idx}
                        className="w-full py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{schedulingSlotIndex === idx ? 'Scheduling...' : 'Add to Calendar'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Schedule Container */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            Today's Timeline
          </h3>
        </div>

        {/* API Disabled or Error Banner */}
        {calendarApiInfo ? (
          <div className="mt-4">
            <ApiActivationBanner
              info={calendarApiInfo}
              onRetry={onRefreshEvents}
              isRetrying={isLoadingEvents}
            />
          </div>
        ) : calendarError ? (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{calendarError}</span>
            </div>
            {onConnectGoogle && (
              <button
                onClick={onConnectGoogle}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer text-xs"
              >
                Reconnect Calendar
              </button>
            )}
          </div>
        ) : null}

        {/* Schedule Timeline */}
        <div className="mt-5 space-y-3.5">
          {!isGoogleConnected ? (
            <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-10 h-10 mx-auto text-indigo-500 mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Calendar Disconnected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Connect your Google account to automatically sync your live daily class schedule, deadlines, and study blocks.
              </p>
              {onConnectGoogle && (
                <button
                  onClick={onConnectGoogle}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Connect Google Calendar</span>
                </button>
              )}
            </div>
          ) : isLoadingEvents ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Syncing today's calendar events...
              </p>
            </div>
          ) : combinedTimeline.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Schedule Commitments Today
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Your schedule is clear! You can use this free time to work on assignments or schedule a 45-minute focus session.
              </p>
              <button
                onClick={() => onOpenScheduleModal()}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-2xs"
              >
                Schedule 45m Focus Block
              </button>
            </div>
          ) : (
            combinedTimeline.map((event: any, idx) => {
              const isPast = event.end?.dateTime && new Date(event.end.dateTime) < now;
              const isCurrent =
                event.start?.dateTime &&
                event.end?.dateTime &&
                new Date(event.start.dateTime) <= now &&
                new Date(event.end.dateTime) >= now;

              return (
                <div
                  key={event.id || idx}
                  id={`event-timeline-${event.id}`}
                  className="flex items-start gap-3.5 group timeline-reveal-item"
                >
                  {/* Time on left */}
                  <div className="w-16 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 pt-2.5 shrink-0 text-right">
                    {formatEventTime(event.start?.dateTime)}
                  </div>

                  {/* Card on right */}
                  <div
                    className={`flex-1 p-4 rounded-xl border-l-4 transition-all ${
                      event.isCanvas
                        ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/10 text-slate-900 dark:text-white'
                        : event.isStudyBlock
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                        : isCurrent
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-slate-900 dark:text-white shadow-xs'
                        : isPast
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20 text-slate-400 opacity-60'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            {event.isCanvas && (
                              <svg className="w-3.5 h-3.5 text-orange-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" className="text-orange-100 dark:text-orange-950" />
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" className="text-orange-600 dark:text-orange-400" />
                              </svg>
                            )}
                            <h4
                              className={`text-sm font-semibold truncate ${
                                isPast ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {event.summary}
                            </h4>
                          </div>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded">
                              LIVE NOW
                            </span>
                          )}
                          {event.isStudyBlock && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-600 text-white rounded">
                              45M FOCUS
                            </span>
                          )}
                          {event.isCanvas && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-orange-600 text-white rounded uppercase tracking-wider">
                              LMS Deadline
                            </span>
                          )}
                        </div>

                        {event.location && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {event.description.replace(/<[^>]*>?/gm, '')}
                          </p>
                        )}
                      </div>

                      {/* Video / Cal Links */}
                      <div className="flex items-center gap-1 shrink-0">
                        {event.hangoutLink && (
                          <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                            title="Join Google Meet"
                          >
                            <Video className="w-4 h-4" />
                          </a>
                        )}
                        {event.htmlLink && (
                          <a
                            href={toMobileDeepLink(event.htmlLink)}
                            target="_blank"
                            rel="noreferrer"
                            className={`p-1.5 rounded-lg transition-colors ${
                              event.isCanvas
                                ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                            title={event.isCanvas ? "Open Assignment in Canvas" : "Open in Google Calendar"}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & Direct links */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => onOpenScheduleModal()}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Another Focus Session</span>
          </button>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1"
          >
            <span>Open Google Calendar</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* Quick Links */}
      {onNavigateToTab && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => onNavigateToTab('canvas')}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500 transition-all cursor-pointer shadow-xs group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Canvas Assignments
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deadlines and coursework
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div
            onClick={() => onNavigateToTab('gmail')}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer shadow-xs group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Gmail Scanner
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Teacher alerts and updates
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
    </div>
  );
};
