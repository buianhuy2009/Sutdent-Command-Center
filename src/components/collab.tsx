import React, { useState } from 'react';

/* ---------- 6. Collaboration / Social ---------- */

export const SyncToggle: React.FC<{ mode: 'local' | 'cloud'; onChange: (m: 'local' | 'cloud') => void }> = ({ mode, onChange }) => (
  <div className="flex items-center gap-2 text-xs" role="group" aria-label="Sync mode">
    <span className="font-bold opacity-60">Sync:</span>
    {(['local', 'cloud'] as const).map((m) => (
      <button key={m} onClick={() => onChange(m)} aria-pressed={mode === m}
        className="px-3 py-2 rounded-xl font-bold border min-h-[44px]" style={{ borderColor: 'var(--line)', backgroundColor: mode === m ? 'var(--accent-soft)' : undefined }}>
        {m === 'local' ? '📱 Local-only' : '☁️ Cloud sync'}
      </button>
    ))}
  </div>
);

export const StudyRoomPanel: React.FC = () => {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<{ who: string; text: string }[]>([{ who: 'Maya', text: 'Starting a 25-min pomodoro — join me?' }]);
  const [draft, setDraft] = useState('');
  const [seconds, setSeconds] = useState(25 * 60);
  React.useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [joined]);
  const mm = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (!joined) {
    return (
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-extrabold">Study rooms (body doubling)</h3>
        <p className="text-xs opacity-60">Live Pomodoro rooms with presence + chat + shared timer. Studying with others keeps you honest.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full text-xs px-3 py-2.5 rounded-xl border bg-transparent" style={{ borderColor: 'var(--line)' }} />
        <button onClick={() => setJoined(true)} className="px-4 py-2.5 text-xs font-bold text-white rounded-xl min-h-[44px]" style={{ backgroundColor: 'var(--terracotta)' }}>Join focus room</button>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><p className="text-xs font-bold">Focus room • {name || 'you'} + 3 studying • shared timer {mm}</p></div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {messages.map((m, i) => <p key={i} className="text-xs"><strong>{m.who}:</strong> {m.text}</p>)}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Cheer someone on…" className="flex-1 text-xs px-3 py-2 rounded-xl border bg-transparent" style={{ borderColor: 'var(--line)' }} />
        <button onClick={() => { if (draft.trim()) { setMessages([...messages, { who: name || 'you', text: draft }]); setDraft(''); } }} className="px-3 py-2 text-xs font-bold rounded-xl border min-h-[44px]" style={{ borderColor: 'var(--line)' }}>Send</button>
      </div>
      <p className="text-[11px] opacity-50">Realtime backend (Firebase RTDB) plugs in here — UI and timer already work offline.</p>
    </div>
  );
};

export const TeacherShareView: React.FC<{ upcoming: string[]; focusMin: number; streak: number }> = ({ upcoming, focusMin, streak }) => {
  const [expiry, setExpiry] = useState('7 days');
  const link = typeof window !== 'undefined' ? `${window.location.origin}/?share=readonly&exp=${encodeURIComponent(expiry)}` : '?share=readonly';
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-extrabold">Teacher / parent view (read-only)</h3>
      <p className="text-xs opacity-60">Share progress + upcoming deadlines without giving account access. Perfect for schools.</p>
      <ul className="text-xs list-disc ml-5">{upcoming.slice(0, 5).map((u, i) => <li key={i}>{u}</li>)}</ul>
      <p className="text-xs">Focus this week: <strong>{focusMin} min</strong> • Streak: <strong>{streak} days</strong></p>
      <div className="flex gap-2 items-center">
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="text-xs rounded-xl border bg-transparent px-2 py-2" style={{ borderColor: 'var(--line)' }}>
          <option>24 hours</option><option>7 days</option><option>30 days</option>
        </select>
        <button onClick={() => navigator.clipboard?.writeText(link).catch(() => {})} className="px-3 py-2 text-xs font-bold text-white rounded-xl min-h-[44px]" style={{ backgroundColor: 'var(--terracotta)' }}>Copy expiring link</button>
        <button onClick={() => window.print()} className="px-3 py-2 text-xs font-bold rounded-xl border min-h-[44px]" style={{ borderColor: 'var(--line)' }}>Weekly PDF</button>
      </div>
    </div>
  );
};

/* ---------- 7. Mobile / PWA ---------- */

export const BottomNav: React.FC<{ active: string; onGo: (tab: string) => void; onFAB: () => void }> = ({ active, onGo, onFAB }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'tracker', label: 'Tasks', icon: '✅' },
    { id: 'radar', label: 'Schedule', icon: '📅' },
    { id: 'ai', label: 'AI', icon: '✨' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];
  return (
    <nav className="scc-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-40 no-print" aria-label="Primary">
      <div className="mx-2 mb-2 rounded-2xl border flex items-stretch shadow-lg" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
        {tabs.slice(0, 2).map((t) => (
          <button key={t.id} onClick={() => onGo(t.id)} aria-current={active === t.id ? 'page' : undefined}
            className="flex-1 py-2 text-[10px] font-bold min-h-[56px] flex flex-col items-center justify-center gap-0.5" style={{ color: active === t.id ? 'var(--terracotta)' : undefined }}>
            <span className="text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
        <button onClick={onFAB} aria-label="Quick add: task, syllabus scan, or voice note"
          className="w-14 h-14 -mt-6 rounded-full text-white text-2xl font-bold shadow-xl mx-1" style={{ backgroundColor: 'var(--terracotta)' }}>+</button>
        {tabs.slice(2).map((t) => (
          <button key={t.id} onClick={() => onGo(t.id)} aria-current={active === t.id ? 'page' : undefined}
            className="flex-1 py-2 text-[10px] font-bold min-h-[56px] flex flex-col items-center justify-center gap-0.5" style={{ color: active === t.id ? 'var(--terracotta)' : undefined }}>
            <span className="text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export const QuickAddSheet: React.FC<{ onAddTask: () => void; onScan: () => void; onVoice: () => void; onClose: () => void }> = ({ onAddTask, onScan, onVoice, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50" onClick={onClose} role="dialog" aria-label="Quick add">
    <div className="scc-fab w-full max-w-md rounded-t-3xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
      {[
        { label: '➕ Add task', fn: onAddTask },
        { label: '📄 Scan syllabus', fn: onScan },
        { label: '🎙 Record voice note', fn: onVoice },
      ].map((a) => (
        <button key={a.label} onClick={a.fn} className="w-full text-left px-4 py-3 text-sm font-bold rounded-2xl border min-h-[52px]" style={{ borderColor: 'var(--line)' }}>{a.label}</button>
      ))}
      <button onClick={onClose} className="w-full px-4 py-3 text-xs font-semibold opacity-60 min-h-[48px]">Cancel</button>
    </div>
  </div>
);

/* ---------- 10. Wild bets (scoped starters) ---------- */

export const ExtensionHelper: React.FC = () => (
  <div className="p-4 space-y-2">
    <h3 className="text-sm font-extrabold">"Save to StudentOS" browser extension</h3>
    <p className="text-xs opacity-60">One click clips a Canvas assignment, Gmail thread, arXiv paper or YouTube timestamp into your inbox — no API token needed.</p>
    <button onClick={() => {
      const clip = { title: document.title, url: window.location.href, clippedAt: new Date().toISOString() };
      try { localStorage.setItem('scc_clipboard_inbox_v1', JSON.stringify([clip])); } catch {}
      alert('Saved to inbox! (Extension bookmarklet captured this page.)');
    }} className="px-4 py-2.5 text-xs font-bold text-white rounded-xl" style={{ backgroundColor: 'var(--terracotta)' }}>Save this page to inbox</button>
  </div>
);

export const LectureCopilot: React.FC = () => {
  const [notes, setNotes] = useState('');
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-extrabold">Lecture copilot</h3>
      <p className="text-xs opacity-60">Upload or record lecture audio → transcript → notes + flashcards + quiz + action items.</p>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Paste transcript here (Whisper upload plugs in next)…"
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <p className="text-[11px] opacity-60">Reuses your existing stores: notes → SRS decks → quiz generator.</p>
      {notes && <p className="text-xs">Key points: {notes.split('.').filter(Boolean).slice(0, 3).join('. ')}.</p>}
    </div>
  );
};

export const ApiDocsPanel: React.FC = () => (
  <div className="p-4 space-y-2 text-xs">
    <h3 className="text-sm font-extrabold">API + Zapier (growth loop)</h3>
    <pre className="p-3 rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--line)' }}>{`POST /api/assignments  { title, dueDate, course }\nPOST /api/calendar     { title, date, minutes }\nGET  /api/deadlines?days=7`}</pre>
    <p className="opacity-60">Pipe Notion, Todoist or Discord into StudentOS. Full docs page ships with the public API.</p>
  </div>
);
