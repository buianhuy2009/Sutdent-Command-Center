import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  X,
  Check,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Assignment, CalendarEvent } from '../types';

interface ScheduleStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
  initialEvent?: Partial<CalendarEvent> | null;
  onSchedule: (eventData: {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }) => Promise<void>;
  isScheduling: boolean;
}

export const ScheduleStudyModal: React.FC<ScheduleStudyModalProps> = ({
  isOpen,
  onClose,
  assignment,
  initialEvent,
  onSchedule,
  isScheduling,
}) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [location, setLocation] = useState('Library / Quiet Study Room');
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    const today = new Date();
    // Default to tomorrow or today's afternoon
    const defaultDate = today.toISOString().split('T')[0];
    setSessionDate(defaultDate);

    if (assignment) {
      setSessionTitle(`🎯 Focus Session: ${assignment.assignmentName} (${assignment.subject})`);
      setSessionNotes(
        `Focus block dedicated to completing ${assignment.assignmentName}.\nPriority: ${assignment.priority}\nDue Date: ${assignment.dueDate}\n${assignment.notes || ''}`
      );
      if (assignment.dueDate) {
        // Schedule day before or on due date
        const dueObj = new Date(assignment.dueDate + 'T00:00:00');
        const dayBefore = new Date(dueObj.getTime() - 86400000);
        if (dayBefore > today) {
          setSessionDate(dayBefore.toISOString().split('T')[0]);
        }
      }
    } else if (initialEvent) {
      setSessionTitle(initialEvent.summary || '🎯 Focus Study Block');
      setSessionNotes(initialEvent.description || '');
      if (initialEvent.start?.dateTime) {
        const d = new Date(initialEvent.start.dateTime);
        setSessionDate(d.toISOString().split('T')[0]);
        setSessionTime(d.toTimeString().slice(0, 5));
      }
    } else {
      setSessionTitle('🎯 45-Minute Focus Study Session');
      setSessionNotes('Deep work session: no phone, pomodoro focus interval.');
    }
  }, [assignment, initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate || !sessionTime) return;

    const [hours, minutes] = sessionTime.split(':').map(Number);
    const startObj = new Date(sessionDate);
    startObj.setHours(hours, minutes, 0, 0);

    const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000);

    await onSchedule({
      title: sessionTitle.trim(),
      description: sessionNotes.trim(),
      startDateTime: startObj.toISOString(),
      endDateTime: endObj.toISOString(),
      location: location.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      id="schedule-study-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule Study Block in Google Calendar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inserts a focused study session into your Google Calendar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Focus Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes (Deep Block)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Desk / Library"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Session Objective / Checklist
            </label>
            <textarea
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What specifically will you complete during this 45-minute block?"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-schedule-calendar"
              type="submit"
              disabled={isScheduling || !sessionTitle.trim()}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors"
            >
              {isScheduling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding to Google Calendar...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Add Study Block to Calendar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
