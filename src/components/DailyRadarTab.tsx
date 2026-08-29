import React from 'react';
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
import { CalendarEvent, CanvasAssignment } from '../types';

interface DailyRadarTabProps {
  events: CalendarEvent[];
  isLoadingEvents: boolean;
  onRefreshEvents: () => void;
  onOpenScheduleModal: (event?: Partial<CalendarEvent>) => void;
  onNavigateToTab?: (tab: string) => void;
  urgentCanvasItems?: CanvasAssignment[];
}

export const DailyRadarTab: React.FC<DailyRadarTabProps> = ({
  events,
  isLoadingEvents,
  onRefreshEvents,
  onOpenScheduleModal,
  onNavigateToTab,
  urgentCanvasItems = [],
}) => {
  const now = new Date();
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
    const timeB = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
    return timeA - timeB;
  });

  const nextUpcomingEvent = sortedEvents.find((e) => {
    if (!e.start.dateTime) return false;
    return new Date(e.start.dateTime) > now;
  });

  const minutesUntilNext = nextUpcomingEvent?.start.dateTime
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
      {/* Top Hero Academic Brief */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Today's Daily Schedule & Classes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {events.length} schedule commitments planned today. Stay on pace and conquer your study goals.
          </p>
        </div>

        {nextUpcomingEvent && minutesUntilNext !== null && (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3.5 border border-slate-700/80 shrink-0 max-w-xs w-full shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="font-semibold text-indigo-300">Next Class / Event</span>
              <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px]">
                In {minutesUntilNext} min{minutesUntilNext === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-1 truncate">
              {nextUpcomingEvent.summary}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{formatEventTime(nextUpcomingEvent.start.dateTime)}</span>
              {nextUpcomingEvent.location && (
                <>
                  <span>•</span>
                  <span className="truncate">{nextUpcomingEvent.location}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Schedule Container */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 bg-indigo-600 rounded-full" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Chronological Class Schedule
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenScheduleModal()}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Focus Block</span>
            </button>

            <button
              id="btn-refresh-schedule-radar"
              onClick={onRefreshEvents}
              disabled={isLoadingEvents}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh Google Calendar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="mt-5 space-y-3.5">
          {isLoadingEvents ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Syncing today's calendar events...
              </p>
            </div>
          ) : sortedEvents.length === 0 ? (
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
            sortedEvents.map((event, idx) => {
              const isPast = event.end.dateTime && new Date(event.end.dateTime) < now;
              const isCurrent =
                event.start.dateTime &&
                event.end.dateTime &&
                new Date(event.start.dateTime) <= now &&
                new Date(event.end.dateTime) >= now;

              return (
                <div
                  key={event.id || idx}
                  id={`event-timeline-${event.id}`}
                  className="flex items-start gap-3.5 group"
                >
                  {/* Time on left */}
                  <div className="w-16 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 pt-2.5 shrink-0 text-right">
                    {formatEventTime(event.start.dateTime)}
                  </div>

                  {/* Card on right */}
                  <div
                    className={`flex-1 p-4 rounded-xl border-l-4 transition-all ${
                      event.isStudyBlock
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
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isPast ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {event.summary}
                          </h4>
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
                        </div>

                        {event.location && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {event.description}
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
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                            title="Open in Google Calendar"
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

      {/* Quick Launch Cards for Canvas LMS and Gmail Scanner */}
      {onNavigateToTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => onNavigateToTab('canvas')}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Canvas LMS Hub</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Review Canvas Assignments & Rubrics
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check upcoming deadlines, cross-reference with your Google Sheet tracker, and start formatted MLA/APA Docs.
            </p>
          </div>

          <div
            onClick={() => onNavigateToTab('gmail')}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                <span>Gmail Academic Scanner</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Check Teacher Emails & AI Alerts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Filtered inbox with spam detection, Vietnamese email support, 1-line urgency summaries, and quick draft replies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
