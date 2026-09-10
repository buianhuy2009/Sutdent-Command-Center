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

  const durationPresets = [25, 45, 60, 90];

  useEffect(() => {
    const today = new Date();
    // Default to tomorrow or today's afternoon
    const defaultDate = today.toISOString().split('T')[0];
    setSessionDate(defaultDate);

    if (assignment) {
      setSessionTitle(`Focus Session: ${assignment.assignmentName} (${assignment.subject})`);
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
      setSessionTitle(initialEvent.summary || 'Focus Study Block');
      setSessionNotes(initialEvent.description || '');
      if (initialEvent.start?.dateTime) {
        const d = new Date(initialEvent.start.dateTime);
        setSessionDate(d.toISOString().split('T')[0]);
        setSessionTime(d.toTimeString().slice(0, 5));
      }
    } else {
      setSessionTitle('45-Minute Focus Study Session');
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
      <div className="bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97757]/15 text-[#D97757] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                Schedule Study Block in Google Calendar
              </h3>
              <p className="text-xs text-[#6B6860] dark:text-[#B5B2A8]">
                Inserts a focused study session into your Google Calendar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#6B6860] hover:text-[#141413] dark:text-[#B5B2A8] dark:hover:text-[#FAF9F5] p-1.5 rounded-lg hover:bg-[#FAF9F5] dark:hover:bg-[#252422] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] dark:text-[#FAF9F5] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl dark:text-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl dark:text-[#FAF9F5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Focus Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-slate-800 dark:text-[#FAF9F5] font-medium"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes (Deep Block)</option>
              </select>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationMinutes(preset)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                      durationMinutes === preset
                        ? 'bg-[#D97757] text-white border-[#D97757]'
                        : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#6B6860] dark:text-[#B5B2A8] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] hover:text-[#D97757]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Desk / Library"
                className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl dark:text-[#FAF9F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
              Session Objective / Checklist
            </label>
            <textarea
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What specifically will you complete during this 45-minute block?"
              className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] dark:text-[#FAF9F5]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#141413] dark:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] rounded-xl"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-schedule-calendar"
              type="submit"
              disabled={isScheduling || !sessionTitle.trim()}
              className="px-4 py-2 text-xs font-bold bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors"
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
