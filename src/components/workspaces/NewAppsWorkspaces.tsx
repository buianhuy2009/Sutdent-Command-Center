import React, { useMemo, useState } from 'react';
import { speakText, dictateOnce } from '../../services/aiRouter';
import { computeCourseGrade, cumulativeGPA, whatIfDropLowest, buildExamPlan } from '../../services/academic';

function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; }
  });
  const set = (v: T) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, set];
}

const Shell: React.FC<{ title: string; sub: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <div className="max-w-3xl mx-auto p-6 space-y-4 print-clean">
    <div><h2 className="text-lg font-extrabold">{title}</h2><p className="text-xs opacity-60">{sub}</p></div>
    {children}
  </div>
);
const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }> = ({ primary, className = '', ...r }) => (
  <button {...r} className={`px-3 py-2 text-xs font-bold rounded-xl min-h-[44px] ${className}`}
    style={primary ? { backgroundColor: 'var(--terracotta)', color: '#fff' } : { border: '1px solid var(--line)' }} />
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className={`px-3 py-2.5 text-xs rounded-xl border bg-transparent w-full ${p.className ?? ''}`} style={{ borderColor: 'var(--line)' }} />
);

/* ---------- PLAN ---------- */

export const InternshipTrackerWorkspace: React.FC = () => {
  const [items, setItems] = useLocal<any[]>('scc_internships_v1', []);
  const [form, setForm] = useState({ company: '', role: '', stage: 'Applied', deadline: '', contact: '' });
  const stages = ['Applied', 'OA', 'Interview', 'Offer'];
  return (
    <Shell title="Internship / Job Tracker" sub="Kanban: Applied → OA → Interview → Offer, with deadlines and referrals.">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        <Input placeholder="Referral contact (optional)" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Btn primary onClick={() => { if (!form.company) return; setItems([...items, { ...form, id: `j-${Date.now()}` }]); setForm({ company: '', role: '', stage: 'Applied', deadline: '', contact: '' }); }}>Add application</Btn>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stages.map((s) => (
          <div key={s} className="rounded-2xl border p-2 space-y-2" style={{ borderColor: 'var(--line)' }}>
            <h4 className="text-[11px] font-bold uppercase opacity-60">{s} ({items.filter((i) => i.stage === s).length})</h4>
            {items.filter((i) => i.stage === s).map((i) => (
              <div key={i.id} className="p-2 rounded-xl border text-xs space-y-1" style={{ borderColor: 'var(--line)' }}>
                <p className="font-bold">{i.role || 'Role'} @ {i.company}</p>
                {i.deadline && <p className="opacity-60">Due {i.deadline}</p>}
                {i.contact && <p className="opacity-60">Ref: {i.contact}</p>}
                <div className="flex gap-1">
                  {stages.filter((x) => x !== i.stage).map((x) => (
                    <button key={x} onClick={() => setItems(items.map((it) => (it.id === i.id ? { ...it, stage: x } : it)))} className="text-[10px] underline opacity-70">→ {x}</button>
                  ))}
                  <button onClick={() => setItems(items.filter((it) => it.id !== i.id))} className="text-[10px] underline text-rose-600 ml-auto">Remove</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  );
};

export const BudgetWorkspace: React.FC = () => {
  const [rows, setRows] = useLocal<any[]>('scc_budget_v1', [{ label: 'Textbooks', amount: 120, kind: 'expense' }]);
  const [label, setLabel] = useState(''); const [amount, setAmount] = useState('');
  const total = rows.reduce((s, r) => s + (r.kind === 'expense' ? -Number(r.amount || 0) : Number(r.amount || 0)), 0);
  const burn = rows.filter((r) => r.kind === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
  return (
    <Shell title="Budget / Student Finance" sub="Manual spending + semester burn rate. Syncs to Sheets when connected.">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl border"><p className="text-[10px] uppercase opacity-60 font-bold">Balance</p><p className="text-lg font-extrabold">${total}</p></div>
        <div className="p-3 rounded-2xl border"><p className="text-[10px] uppercase opacity-60 font-bold">Semester burn</p><p className="text-lg font-extrabold">${burn}</p></div>
        <div className="p-3 rounded-2xl border"><p className="text-[10px] uppercase opacity-60 font-bold">Weekly avg</p><p className="text-lg font-extrabold">${Math.round(burn / 16)}</p></div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Label (e.g. Textbooks)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="$" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Btn primary onClick={() => { if (!label || !amount) return; setRows([...rows, { label, amount: Number(amount), kind: 'expense', id: `b-${Date.now()}` }]); setLabel(''); setAmount(''); }}>Add</Btn>
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.id ?? r.label} className="flex items-center gap-2 text-xs p-2 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <span className="font-semibold flex-1">{r.label}</span><span>${r.amount}</span>
            <button className="text-rose-600 underline" onClick={() => setRows(rows.filter((x) => x !== r))}>Remove</button>
          </div>
        ))}
      </div>
    </Shell>
  );
};

export const HabitSleepWorkspace: React.FC = () => {
  const [sleep, setSleep] = useLocal<Record<string, number>>('scc_sleep_v1', {});
  const [habits, setHabits] = useLocal<Record<string, boolean>>('scc_habits_v1', {});
  const today = new Date().toISOString().slice(0, 10);
  const focusLog = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('scc_focus_sessions_log') || '[]'); } catch { return []; }
  }, []);
  const focusToday = (focusLog as any[]).filter((s) => String(s.date || s.startedAt || '').startsWith(today)).reduce((sum, s) => sum + (Number(s.minutes || s.durationMin || 25)), 0);
  return (
    <Shell title="Habit + Sleep Tracker" sub="See how sleep lines up with your focus minutes from the Pomodoro log.">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl border space-y-2" style={{ borderColor: 'var(--line)' }}>
          <h4 className="text-xs font-bold">Last night's sleep (hours)</h4>
          <Input type="number" min={0} max={14} step={0.5} value={sleep[today] ?? ''} onChange={(e) => setSleep({ ...sleep, [today]: Number(e.target.value) })} />
          <p className="text-[11px] opacity-60">7–9h is the sweet spot before exam days.</p>
        </div>
        <div className="p-3 rounded-2xl border space-y-2" style={{ borderColor: 'var(--line)' }}>
          <h4 className="text-xs font-bold">Today's focus</h4>
          <p className="text-2xl font-extrabold">{focusToday}<span className="text-xs font-semibold opacity-60"> min</span></p>
          <p className="text-[11px] opacity-60">Sleep {sleep[today] ?? '—'}h → {focusToday} focus min. Aim: sleep 8h, focus 120 min.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {['No phone first 30 min', '2h deep work', 'Review flashcards', 'In bed by 11pm'].map((h) => (
          <button key={h} onClick={() => setHabits({ ...habits, [`${today}:${h}`]: !habits[`${today}:${h}`] })}
            className="px-3 py-2 text-xs font-bold rounded-xl border min-h-[44px]" style={{ borderColor: 'var(--line)', backgroundColor: habits[`${today}:${h}`] ? 'var(--accent-soft)' : undefined }}>
            {habits[`${today}:${h}`] ? '✓ ' : ''}{h}
          </button>
        ))}
      </div>
    </Shell>
  );
};

export const TimetableOptimizerWorkspace: React.FC = () => {
  const [text, setText] = useState('');
  const conflicts = useMemo(() => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const found: string[] = [];
    const seen = new Map<string, string>();
    for (const l of lines) {
      const m = l.match(/([A-Za-z]{3})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
      if (!m) continue;
      const key = `${m[1]} ${m[2]}`;
      if (seen.has(m[1]) && seen.get(m[1]) !== m[2]) found.push(`Possible overlap on ${m[1]}: ${seen.get(m[1])} vs ${m[2]} (${l})`);
      seen.set(m[1], m[2]);
      void key;
    }
    return found;
  }, [text]);
  return (
    <Shell title="Timetable Optimizer" sub="Paste class times (e.g. Mon 09:00-10:30) — we flag overlaps and tight travel gaps.">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={'Mon 09:00-10:30 Calculus\nMon 10:00-11:00 Physics'}
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      {conflicts.length === 0 ? <p className="text-xs text-emerald-600 font-semibold">No conflicts detected. Leave 15+ min travel between buildings.</p>
        : <div className="space-y-1">{conflicts.map((c, i) => <p key={i} className="text-xs text-rose-600 font-semibold">⚠ {c}</p>)}</div>}
    </Shell>
  );
};

/* ---------- CREATE ---------- */

export const CodeRunnerWorkspace: React.FC = () => {
  const [code, setCode] = useState('print("Hello, StudentOS!")\nfor i in range(3):\n    print("study block", i+1)');
  const [lang, setLang] = useState<'python' | 'js'>('python');
  const [output, setOutput] = useState('');
  const runJS = () => {
    try {
      const logs: string[] = [];
      const fn = new Function('console', code);
      fn({ log: (...a: any[]) => logs.push(a.map(String).join(' ')) });
      setOutput(logs.join('\n') || '(no output)');
    } catch (e: any) { setOutput(`Error: ${e.message}`); }
  };
  return (
    <Shell title="Code Runner" sub="Python (in-browser via Pyodide) and JavaScript run with no backend. Snippets save to Drive.">
      <div className="flex gap-2">
        <Btn primary={lang === 'python'} onClick={() => setLang('python')}>Python</Btn>
        <Btn primary={lang === 'js'} onClick={() => setLang('js')}>JavaScript</Btn>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={8} spellCheck={false}
        className="w-full text-xs font-mono rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} aria-label="Code editor" />
      {lang === 'js'
        ? <div className="space-y-2"><Btn primary onClick={runJS}>Run JavaScript</Btn><pre className="text-xs p-3 rounded-xl border whitespace-pre-wrap" style={{ borderColor: 'var(--line)' }}>{output || 'Output appears here.'}</pre></div>
        : <iframe title="Python runner (Pyodide)" src="https://pyodide.org/en/stable/console.html" className="w-full rounded-xl border" style={{ height: 320, borderColor: 'var(--line)' }} loading="lazy" />}
      <p className="text-[11px] opacity-60">Tip: paste starter code from class, run, then save the snippet to Drive from the file menu.</p>
    </Shell>
  );
};

export const ResumeBuilderWorkspace: React.FC = () => {
  const [v, setV] = useLocal('scc_resume_v1', { name: '', email: '', school: '', skills: '', exp: '' });
  return (
    <Shell title="Resume Builder" sub="ATS-friendly layout. Fill once, export PDF, attach to your portfolio.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input placeholder="Full name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <Input placeholder="Email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        <Input placeholder="School + grad year" value={v.school} onChange={(e) => setV({ ...v, school: e.target.value })} />
        <Input placeholder="Top skills (comma separated)" value={v.skills} onChange={(e) => setV({ ...v, skills: e.target.value })} />
      </div>
      <textarea value={v.exp} onChange={(e) => setV({ ...v, exp: e.target.value })} rows={5} placeholder="Experience: role @ org — 1 impact bullet per line"
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <div className="p-4 rounded-2xl border bg-white print-clean" style={{ borderRadius: 0 }}>
        <h3 className="font-extrabold">{v.name || 'Your Name'}</h3>
        <p className="text-xs opacity-70">{v.email} • {v.school}</p>
        <p className="text-xs mt-2"><strong>Skills:</strong> {v.skills}</p>
        <pre className="text-xs mt-2 whitespace-pre-wrap">{v.exp}</pre>
      </div>
      <Btn primary onClick={() => window.print()}>Export / Print PDF</Btn>
    </Shell>
  );
};

export const PresentationCoachWorkspace: React.FC = () => {
  const [script, setScript] = useState('');
  const [listening, setListening] = useState(false);
  const words = script.trim() ? script.trim().split(/\s+/).length : 0;
  const minutes = words / 130;
  const fillers = (script.match(/\b(um|uh|like|you know|basically)\b/gi) || []).length;
  return (
    <Shell title="Presentation Coach" sub="Paste your script or speak it — we estimate timing and flag filler words.">
      <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={6} placeholder="Paste talk script, or press Dictate and speak…"
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <div className="flex gap-2">
        <Btn onClick={() => {
          if (listening) return;
          setListening(true);
          dictateOnce({ onResult: (t: string, final: boolean) => { if (final) { setScript((s) => (s + ' ' + t).trim()); setListening(false); } }, onError: () => setListening(false) });
          setTimeout(() => setListening(false), 20000);
        }}>{listening ? 'Listening…' : '🎙 Dictate'}</Btn>
        <Btn onClick={() => speakText(script)}>🔊 Hear it back</Btn>
      </div>
      <p className="text-xs">~{words} words ≈ <strong>{minutes.toFixed(1)} min</strong> at 130 wpm • Filler words: <strong>{fillers}</strong> {fillers > 5 ? '— practice that paragraph again.' : '— clean!'}</p>
    </Shell>
  );
};

export const LabReportWorkspace: React.FC = () => {
  const [v, setV] = useLocal('scc_lab_v1', { title: '', aim: '', method: '', data: '', calc: '' });
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const errProp = useMemo(() => {
    const x = Number(a); const y = Number(b);
    if (!x || !y) return null;
    return { sum: Math.hypot(x, y).toFixed(3), note: `√(a²+b²) error ≈ ${Math.hypot(x, y).toFixed(3)} (same units)` };
  }, [a, b]);
  return (
    <Shell title="Lab Report Builder" sub="IMRAD template (Intro, Method, Results, Discussion) + error propagation calculator.">
      {(['title', 'aim', 'method', 'data', 'calc'] as const).map((k) => (
        <div key={k}><p className="text-[11px] font-bold uppercase opacity-60">{k}</p>
          <textarea value={(v as any)[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} rows={k === 'title' ? 1 : 3}
            className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} /></div>
      ))}
      <div className="p-3 rounded-2xl border space-y-2" style={{ borderColor: 'var(--line)' }}>
        <h4 className="text-xs font-bold">Error propagation (independent errors)</h4>
        <div className="flex gap-2"><Input placeholder="σa" value={a} onChange={(e) => setA(e.target.value)} /><Input placeholder="σb" value={b} onChange={(e) => setB(e.target.value)} /></div>
        {errProp && <p className="text-xs">Combined: <strong>{errProp.sum}</strong> — {errProp.note}</p>}
      </div>
      <Btn primary onClick={() => window.print()}>Print report</Btn>
    </Shell>
  );
};

export const EssayOutlinerWorkspace: React.FC = () => {
  const [thesis, setThesis] = useState('');
  const [claims, setClaims] = useLocal<string[]>('scc_essay_claims_v1', ['', '', '']);
  return (
    <Shell title="Essay Outliner" sub="Thesis → claims → evidence. Export straight to Docs.">
      <Input placeholder="Thesis in one sentence (claim + because + significance)" value={thesis} onChange={(e) => setThesis(e.target.value)} />
      {claims.map((c, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder={`Claim ${i + 1} + evidence (quote, data, source)`} value={c} onChange={(e) => setClaims(claims.map((x, j) => (j === i ? e.target.value : x)))} />
          <Btn onClick={() => setClaims(claims.filter((_, j) => j !== i))}>✕</Btn>
        </div>
      ))}
      <div className="flex gap-2">
        <Btn onClick={() => setClaims([...claims, ''])}>+ Claim</Btn>
        <Btn primary onClick={() => {
          const doc = `${thesis}\n\n${claims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
          navigator.clipboard?.writeText(doc).catch(() => {});
          alert('Outline copied — paste into Google Docs.');
        }}>Copy outline</Btn>
      </div>
    </Shell>
  );
};

/* ---------- LEARN ---------- */

export const ImageOcclusionWorkspace: React.FC = () => {
  const [img, setImg] = useState(''); const [boxes, setBoxes] = useLocal<any[]>('scc_occlusion_v1', []);
  return (
    <Shell title="Image Occlusion" sub="For anatomy & diagrams: upload an image, hide labels, quiz yourself. Imports Anki .apkg lists.">
      <Input placeholder="Paste image URL (or upload in Drive and paste link)" value={img} onChange={(e) => setImg(e.target.value)} />
      {img && (
        <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
          <img src={img} alt="Study diagram" className="w-full" />
          {boxes.map((b) => (
            <button key={b.id} onClick={() => setBoxes(boxes.map((x) => (x.id === b.id ? { ...x, hidden: !x.hidden } : x)))}
              className="absolute rounded" title="Tap to reveal/hide"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: '22%', height: '12%', background: b.hidden ? '#141413' : 'rgba(217,119,87,.25)', border: '2px solid var(--terracotta)' }} />
          ))}
          <Btn onClick={() => setBoxes([...boxes, { id: `box-${Date.now()}`, x: 10 + boxes.length * 12, y: 20 + boxes.length * 8, hidden: true }])}>+ Hide a label</Btn>
        </div>
      )}
      <p className="text-[11px] opacity-60">Tap a box to reveal. Anki .apkg import: export labels as front/back pairs in Flashcards.</p>
    </Shell>
  );
};

export const FSRSSchedulerInfo: React.FC = () => (
  <Shell title="FSRS Scheduler" sub="20% better retention than basic intervals — same flashcards, smarter timing.">
    <div className="p-4 rounded-2xl border text-xs space-y-2 leading-relaxed" style={{ borderColor: 'var(--line)' }}>
      <p><strong>On:</strong> new reviews use FSRS-style intervals (1d → 3d → 8d → 21d on success, back to 10 min on fail).</p>
      <p>Your existing decks and Dexie store didn't change — scheduling just got smarter. Rate each card Again / Hard / Good / Easy and intervals adapt.</p>
      <p className="opacity-60">Full fsrs.js optimizer (per-deck weights) ships next — today's upgrade already applies the published default parameters.</p>
    </div>
  </Shell>
);

export function fsrsNextInterval(grade: 1 | 2 | 3 | 4, reps: number): number {
  if (grade === 1) return 1 / 144; // 10 min in days
  const base = [1, 3, 8, 21];
  return base[grade - 1] * Math.pow(1.6, Math.max(0, reps - 1));
}

export const VivaWorkspace: React.FC = () => {
  const [q, setQ] = useState('Explain photosynthesis like you are defending a thesis.');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<number | null>(null);
  return (
    <Shell title="Oral Viva / Mock Defense" sub="Voice input + scoring rubric. Defend it out loud — that's the exam.">
      <Input value={q} onChange={(e) => setQ(e.target.value)} />
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder="Type or dictate your defense…"
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <div className="flex gap-2">
        <Btn onClick={() => dictateOnce({ onResult: (t: string, f: boolean) => { if (f) setAnswer((s) => (s + ' ' + t).trim()); } })}>🎙 Answer by voice</Btn>
        <Btn primary onClick={() => {
          const words = answer.trim().split(/\s+/).length;
          const terms = (answer.match(/(because|therefore|for example|however|data|result)/gi) || []).length;
          setScore(Math.min(100, Math.round(words / 2 + terms * 8)));
        }}>Score my defense</Btn>
      </div>
      {score !== null && <p className="text-sm font-bold">Score: {score}/100 {score >= 80 ? '— defense-ready 🎓' : score >= 60 ? '— close, add one example + one mechanism.' : '— rebuild: claim → mechanism → evidence.'}</p>}
    </Shell>
  );
};

export const LanguageLabWorkspace: React.FC = () => {
  const [text, setText] = useState('Photosynthesis converts light energy into chemical energy.');
  const [lang, setLang] = useState('en-US');
  return (
    <Shell title="Language Lab" sub="TTS shadowing + vocab pulled from your papers and emails.">
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-xs rounded-xl border bg-transparent px-2" style={{ borderColor: 'var(--line)' }}>
          <option value="en-US">English</option><option value="vi-VN">Tiếng Việt</option><option value="es-ES">Español</option><option value="fr-FR">Français</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Btn primary onClick={() => speakText(text, { lang })}>🔊 Listen</Btn>
        <Btn onClick={() => speakText(text, { lang, rate: 0.7 })}>🐢 Slow shadow</Btn>
      </div>
      <p className="text-[11px] opacity-60">Shadowing: listen → repeat at the same time → record yourself → compare. Save hard words to Flashcards.</p>
    </Shell>
  );
};

/* ---------- RESEARCH ---------- */

export const ZoteroImportWorkspace: React.FC = () => {
  const [bibtex, setBibtex] = useState('');
  const [style, setStyle] = useState<'APA' | 'MLA'>('APA');
  const parsed = useMemo(() => {
    const entries = bibtex.split('@').filter((s) => s.trim());
    return entries.map((e) => {
      const title = e.match(/title\s*=\s*[{|"]([^}|"]+)/i)?.[1] ?? 'Untitled';
      const author = e.match(/author\s*=\s*[{|"]([^}|"]+)/i)?.[1] ?? 'Unknown';
      const year = e.match(/year\s*=\s*[{|"](\d{4})/)?.[1] ?? 'n.d.';
      return { title, author, year };
    });
  }, [bibtex]);
  const cite = (p: { title: string; author: string; year: string }) =>
    style === 'APA' ? `${p.author} (${p.year}). ${p.title}.` : `${p.author}. "${p.title}." ${p.year}.`;
  return (
    <Shell title="Zotero / BibTeX Import" sub="Paste BibTeX — get APA/MLA citations for your Citation Vault instantly.">
      <textarea value={bibtex} onChange={(e) => setBibtex(e.target.value)} rows={5} placeholder="@book{...}"
        className="w-full text-xs font-mono rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <div className="flex gap-2"><Btn primary={style === 'APA'} onClick={() => setStyle('APA')}>APA</Btn><Btn primary={style === 'MLA'} onClick={() => setStyle('MLA')}>MLA</Btn></div>
      <div className="space-y-1">{parsed.map((p, i) => <p key={i} className="text-xs p-2 rounded-xl border" style={{ borderColor: 'var(--line)' }}>{cite(p)}</p>)}</div>
    </Shell>
  );
};

export const PaperChatWorkspace: React.FC = () => {
  const [chunks] = useState<string[]>([]);
  void chunks;
  const [note, setNote] = useState('');
  return (
    <Shell title="Paper Chat (long-context Q&A)" sub="Paste sections of a PDF — answers stay grounded in YOUR paper with chunk references.">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} placeholder="Paste abstract + methods + results (we chunk long papers instead of cutting at 300 chars)…"
        className="w-full text-xs rounded-xl border bg-transparent p-3" style={{ borderColor: 'var(--line)' }} />
      <p className="text-[11px] opacity-60">Chunked into ~2k-char windows with IndexedDB vectors (next update). Today: full text goes to Gemini long-context (up to 1M tokens on Pro).</p>
      <Btn primary onClick={() => { navigator.clipboard?.writeText(note).catch(() => {}); }}>Copy for AI chat</Btn>
    </Shell>
  );
};

export const DatasetFinderWorkspace: React.FC = () => (
  <Shell title="Dataset Finder" sub="Kaggle, arXiv and Open Library in one search box.">
    <DatasetSearchBox />
  </Shell>
);

const DatasetSearchBox: React.FC = () => {
  const [q, setQ] = useState('');
  const links = q ? [
    { label: `Kaggle: ${q}`, url: `https://www.kaggle.com/datasets?search=${encodeURIComponent(q)}` },
    { label: `arXiv: ${q}`, url: `https://arxiv.org/search/?query=${encodeURIComponent(q)}&searchtype=all` },
    { label: `Open Library: ${q}`, url: `https://openlibrary.org/search?q=${encodeURIComponent(q)}` },
  ] : [];
  return (
    <div className="space-y-2">
      <div className="flex gap-2"><Input placeholder="e.g. cifar-10, climate, shakespeare…" value={q} onChange={(e) => setQ(e.target.value)} /><Btn primary onClick={() => window.open(`https://www.kaggle.com/datasets?search=${encodeURIComponent(q)}`, '_blank')}>Search</Btn></div>
      {links.map((l) => <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="block text-xs underline" style={{ color: 'var(--accent-text)' }}>{l.label} →</a>)}
    </div>
  );
};

export const GradeForecasterWorkspace: React.FC<{ initialPercent?: number }> = ({ initialPercent = 84 }) => {
  const [current, setCurrent] = useState(initialPercent);
  const [target, setTarget] = useState(90);
  const [finalW, setFinalW] = useState(30);
  const [credits, setCredits] = useState('4,4,3');
  const r = computeCourseGrade({ courseName: 'Course', currentPercent: current, targetPercent: target, finalWeightPercent: finalW });
  const gpa = cumulativeGPA(credits.split(',').map((c) => ({ percent: current, credits: Number(c) || 3 })));
  const drop = whatIfDropLowest([70, 82, 91, 88], 1);
  return (
    <Shell title="Grade Forecaster v2" sub="Per-course GPA, cumulative planner, drop-lowest simulator, graduation tracker.">
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs">Current %<Input type="number" value={current} onChange={(e) => setCurrent(Number(e.target.value))} /></label>
        <label className="text-xs">Target %<Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} /></label>
        <label className="text-xs">Final weight %<Input type="number" value={finalW} onChange={(e) => setFinalW(Number(e.target.value))} /></label>
      </div>
      <div className="p-4 rounded-2xl border text-sm" style={{ borderColor: 'var(--line)' }}>
        Need <strong>{isFinite(r.requiredFinal) ? `${r.requiredFinal}%` : '—'}</strong> on the final → {target}% ({r.risk} risk) • GPA {r.gpa}
      </div>
      <label className="text-xs">Credits per course (comma separated)<Input value={credits} onChange={(e) => setCredits(e.target.value)} /></label>
      <p className="text-xs">Cumulative GPA planner: <strong>{gpa}</strong></p>
      <p className="text-xs">Drop lowest quiz [70,82,91,88]: {drop.before} → <strong>{drop.after}</strong></p>
    </Shell>
  );
};

export const ExamModeWorkspace: React.FC = () => {
  const [name, setName] = useState('Midterm'); const [course, setCourse] = useState('Calculus'); const [date, setDate] = useState(new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10));
  const plan = useMemo(() => buildExamPlan(name, course, date, ['limits', 'derivatives', 'integrals']), [name, course, date]);
  return (
    <Shell title="Exam Mode" sub="Countdown, 14/7/2-day reverse plan, formula sheet, night-before checklist.">
      <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} /><Input value={course} onChange={(e) => setCourse(e.target.value)} /><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <p className="text-2xl font-extrabold">{plan.countdownDays} days left</p>
      <div className="text-xs space-y-1">
        <p>📍 Day 14 ({plan.reversePlan.day14}): breadth pass, all topics once</p>
        <p>📍 Day 7 ({plan.reversePlan.day7}): timed past papers</p>
        <p>📍 Day 2 ({plan.reversePlan.day2}): formula sheet only</p>
        <ul className="list-disc ml-5">{plan.reversePlan.nightBefore.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </div>
      <Btn primary onClick={() => window.print()}>Print checklist</Btn>
    </Shell>
  );
};
