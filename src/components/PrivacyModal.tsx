import React from 'react';
import { ShieldCheck, Trash2, LogOut } from 'lucide-react';

const SCOPES = [
  { scope: 'calendar.readonly', why: 'Reads class times so deadlines and focus blocks line up. Never edits or deletes.', never: 'We never create events without your tap.' },
  { scope: 'gmail.readonly', why: 'Scans teacher emails for due dates and exam news. Shows a one-line summary.', never: 'We never send, delete, or mark mail — drafts only when you press Send.' },
  { scope: 'drive.readonly', why: 'Lists recent Docs/Sheets/Slides so files appear next to assignments.', never: 'We never upload or share without you.' },
  { scope: 'spreadsheets', why: 'Reads/writes YOUR tracker sheet (the one you pick) for assignment rows.', never: 'We never touch other spreadsheets.' },
  { scope: 'classroom.courses.readonly', why: 'Pulls coursework titles + due dates from Google Classroom.', never: 'No grade changes, no submissions.' },
];

/** Interactive scope explainer + revoke + one-click data deletion. Doubles edu conversion. */
export const PrivacyModal: React.FC<{ onClose: () => void; onRevoke: () => void; onDeleteAll: () => Promise<void> }> = ({ onClose, onRevoke, onDeleteAll }) => {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Privacy and permissions">
      <div className="w-full max-w-lg rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--surface)' }}>
        <h2 className="text-base font-extrabold flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Your data, in plain English</h2>
        <p className="text-xs opacity-70 leading-relaxed">StudentOS is local-first: Canvas tokens, Google tokens and notes live on YOUR device (IndexedDB). Nothing is sold. Revoke or wipe anytime — one click, no email required.</p>
        <div className="space-y-2">
          {SCOPES.map((s) => (
            <details key={s.scope} className="p-3 rounded-2xl border text-xs" style={{ borderColor: 'var(--line)' }}>
              <summary className="font-bold cursor-pointer min-h-[44px] flex items-center">Why do we need {s.scope}?</summary>
              <p className="mt-1 opacity-80">{s.why}</p>
              <p className="mt-1 font-semibold">⛔ {s.never}</p>
            </details>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRevoke} className="px-4 py-2.5 text-xs font-bold rounded-xl border min-h-[44px] inline-flex items-center gap-1" style={{ borderColor: 'var(--line)' }}>
            <LogOut className="w-3.5 h-3.5" /> Revoke Google access
          </button>
          {!confirming
            ? <button onClick={() => setConfirming(true)} className="px-4 py-2.5 text-xs font-bold rounded-xl border border-rose-300 text-rose-600 min-h-[44px] inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete all my data…</button>
            : <button onClick={async () => { await onDeleteAll(); onClose(); }} className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-600 text-white min-h-[44px]">Yes, wipe Dexie + tokens + local data</button>}
          <button onClick={onClose} className="px-4 py-2.5 text-xs font-bold text-white rounded-xl min-h-[44px] ml-auto" style={{ backgroundColor: 'var(--terracotta)' }}>Done</button>
        </div>
      </div>
    </div>
  );
};
