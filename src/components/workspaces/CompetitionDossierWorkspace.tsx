import React, { useState } from 'react';
import { Trophy, Users, FileText, History, Video, FlaskConical, ListChecks, Download, Printer } from 'lucide-react';
import { WhyChip, InputAIOutput, EvidenceButton } from '../../components/DivisionAUI';
import { getPromptLogs, exportPromptLogMarkdown, clearPromptLogs, updatePromptLogNotes } from '../../services/promptLog';
import { getEvidence } from '../../services/evidence';
import { saveEvidence } from '../../services/evidence';

type TabId = 'team' | 'dossier' | 'promptlog' | 'videos' | 'testing' | 'checklist';

const STORE_KEY = 'scc_dossier_v1';

const SECTION_TITLES = [
  '1. Vấn đề cần giải quyết (Problem)',
  '2. Đối tượng sử dụng (Users)',
  '3. Dữ liệu, câu lệnh, công cụ AI đã dùng (Data & Tools)',
  '4. Sơ đồ Input → AI → Output (Diagram)',
  '5. Hình ảnh quá trình thử nghiệm (Testing photos)',
  '6. Kết quả trình diễn sản phẩm (Demo results)',
  '7. Hạn chế và hướng cải tiến (Limits & next steps)',
  '8. Lịch sử câu lệnh & minh chứng (Prompt history + Drive link)',
];

const DEFAULT_SECTIONS = [
  'Our school wastes paper… (Example: Homework Helper sorts assignments by subject.)',
  'Students in grades 6–9 and teachers who assign homework…',
  'Self-collected homework photos (with permission), Gemini few-shot prompts, open-source Mermaid diagrams…',
  'Input: homework photo → AI: text sorter (few-shot) → Output: subject-tagged task list.',
  'See Evidence gallery snapshots below with captions and dates.',
  'Main functions: snap → sort → remind. Tested on 30 homework notes, 27 correct.',
  'Limit: handwriting in low light fails. Next: add more night photos, confirm dialog.',
  'Prompt Log exported below. Drive folder (open access): paste link here.',
];

function loadStore(): any {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    students: [{ name: '', dob: '', className: '', school: '', phone: '', email: '' }],
    teacher: { name: '', unit: '', phone: '', email: '' },
    pledge: false,
    sections: [...DEFAULT_SECTIONS.map(() => '')],
    driveLink: '',
    driveOpen: false,
    tests: [{ date: '', input: '', expected: '', actual: '', fix: '' }],
    licenses: [{ item: 'Homework photos (self-collected)', origin: 'Our team', permission: 'Consent forms signed' }],
    prohibited: [false, false, false, false, false, false, false],
    anonymize: true,
    honesty: { self: 60, ai: 30, oss: 10 },
    videoMembers: ['Member 1', 'Member 2', 'Member 3'],
  };
}

export const CompetitionDossierWorkspace: React.FC = () => {
  const [tab, setTab] = useState<TabId>('team');
  const [store, setStore] = useState<any>(() => loadStore());
  const [tele, setTele] = useState<string | null>(null);
  const [videoKind, setVideoKind] = useState<'5min' | '3min' | '10min'>('5min');
  const [pingLog, setPingLog] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('scc_stability_pings_v1') || '[]'); } catch { return []; }
  });

  const save = (next: any) => {
    setStore(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
  };
  const set = (patch: any) => save({ ...store, ...patch });

  const pageEstimate = Math.max(1, Math.ceil(store.sections.join('\n').length / 2800));

  const prefillExample = () => {
    save({ ...store, sections: [...DEFAULT_SECTIONS] });
  };

  const driveValid = /drive\.google\.com/.test(store.driveLink || '');

  const genScript = (): string => {
    const members: string[] = store.videoMembers.filter((m: string) => m.trim());
    const m1 = members[0] || 'Member 1';
    const m2 = members[1] || 'Member 2';
    const m3 = members[2] || 'Member 3';
    if (videoKind === '5min') {
      return `PRESENTATION (5 min)\n[0:00] ${m1}: Problem — what homework pain we solve and who it helps.\n[1:30] ${m2}: Idea — how our AI tool works (Input → AI → Output).\n[3:00] ${m3}: Demo plan + AI tools used + your role.\n[4:00] ${m1}: Practical value + test result (1 number).\n[4:40] All: What we learned + thank you.`;
    }
    if (videoKind === '3min') {
      return `DEMO (3 min)\n[0:00] ${m1}: Open product, show main screen.\n[1:00] ${m2}: Run main function #1 live.\n[2:00] ${m3}: Show main function #2 + result.\n[2:40] ${m1}: Results + where evidence lives.`;
    }
    return `REGIONAL 10-MIN (all members appear)\n[0:00] ${m1}: Problem + users + why we chose it.\n[2:30] ${m2}: My tasks — features I built + AI process I can explain.\n[5:00] ${m3}: My tasks — tests I ran, errors I fixed (before → after).\n[7:30] ${m1}: Prompt Log — show 3 prompts and what we changed.\n[9:00] All: Live demo + improvement plan. Thank you.`;
  };

  const pingNow = async () => {
    const line = `${new Date().toISOString()} — ${navigator.onLine ? 'online' : 'OFFLINE'} — app reachable (local check)`;
    const next = [line, ...pingLog].slice(0, 50);
    setPingLog(next);
    try { localStorage.setItem('scc_stability_pings_v1', JSON.stringify(next)); } catch {}
  };

  const exportDossierHTML = () => {
    const logs = getPromptLogs();
    const ev = getEvidence();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Division A Dossier — ${new Date().toISOString().slice(0, 10)}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 16px;line-height:1.6}h1,h2{color:#1a1a1a}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;font-size:13px}.cover{background:#FAF9F5;border:1px solid #DFDACB;border-radius:12px;padding:20px}</style></head><body><div class="cover"><h1>Bảng A — Project Dossier (Mẫu 1, 8 sections)</h1><p>Team: ${(store.students || []).map((s: any) => s.name).filter(Boolean).join(', ') || '(fill Team tab)'} · Teacher: ${store.teacher?.name || ''}</p><p>Page estimate: ${pageEstimate}/8 ${pageEstimate > 8 ? '— OVER LIMIT, trim before submit' : ''}</p></div>${SECTION_TITLES.map((t, i) => `<h2>${t}</h2><p>${String(store.sections[i] || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')}<h2>Evidence (${ev.length})</h2><ul>${ev.map(e => `<li>${e.timestamp} — ${e.title}: ${e.detail}</li>`).join('')}</ul><h2>Prompt Log (${logs.length})</h2><pre>${exportPromptLogMarkdown().replace(/</g, '&lt;').slice(0, 8000)}</pre><p>Signatures: ______________ (students) · ______________ (teacher)</p></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
    saveEvidence('dossier', 'Dossier exported to PDF-ready HTML', `Sections estimate ${pageEstimate}/8 pages.`);
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'team', label: 'Team • Đội', icon: Users },
    { id: 'dossier', label: 'Dossier 8 • Hồ sơ', icon: FileText },
    { id: 'promptlog', label: 'Prompt Log', icon: History },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'testing', label: 'Testing • Thử nghiệm', icon: FlaskConical },
    { id: 'checklist', label: 'Timeline • Checklist', icon: ListChecks },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-extrabold flex items-center gap-2 text-[#141413] dark:text-[#FAF9F5]"><Trophy className="w-5 h-5 text-[#D97757]" /> Competition Dossier — Bảng A</h2>
        <p className="text-xs text-[#6B6860]">National Youth AI Creativity Contest 2026 · ages 12–15 · max 3 students + 1 teacher. Everything here maps to the 8-section Mẫu 1 dossier.</p>
      </div>
      <WhyChip text="Provincial dossiers close 30-9-2026. Regionals: South 10-10, North/Central 17-10. Final Hanoi 20–22 Nov. Score = 40% dossier + 60% regional." />

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Dossier tabs">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] cursor-pointer border ${tab === t.id ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'team' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <h3 className="text-sm font-bold">Team (1–3 students + 1 teacher guide)</h3>
          {store.students.map((s: any, i: number) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB]/60">
              {(['name', 'dob', 'className', 'school', 'phone', 'email'] as const).map(f => (
                <label key={f} className="text-[11px] font-bold">{f === 'className' ? 'class' : f}
                  <input value={s[f] || ''} onChange={e => {
                    const next = [...store.students];
                    next[i] = { ...next[i], [f]: e.target.value };
                    set({ students: next });
                  }} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-medium bg-white dark:bg-[#1A1917]" />
                </label>
              ))}
              {store.students.length > 1 && (
                <button onClick={() => set({ students: store.students.filter((_: any, j: number) => j !== i) })} className="text-[11px] font-bold text-rose-600 underline underline-offset-4 cursor-pointer col-span-full text-left min-h-[32px]">Remove member</button>
              )}
            </div>
          ))}
          {store.students.length < 3 && (
            <button onClick={() => set({ students: [...store.students, { name: '', dob: '', className: '', school: '', phone: '', email: '' }] })} className="px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer">+ Add student (max 3)</button>
          )}
          <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB]/60 space-y-2">
            <h4 className="text-xs font-bold">Teacher guide (max 1)</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['name', 'unit', 'phone', 'email'] as const).map(f => (
                <label key={f} className="text-[11px] font-bold">{f}
                  <input value={store.teacher[f] || ''} onChange={e => set({ teacher: { ...store.teacher, [f]: e.target.value } })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-medium bg-white dark:bg-[#1A1917]" />
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={!!store.pledge} onChange={e => set({ pledge: e.target.checked })} className="mt-0.5 w-4 h-4 accent-[#D97757]" />
            <span>Single-team pledge: each contestant joins only <strong>one team, one division</strong> this season. We will bring valid IDs to every round.</span>
          </label>
        </div>
      )}

      {tab === 'dossier' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-bold">Page estimate: <span className={pageEstimate > 8 ? 'text-rose-600' : 'text-emerald-600'}>{pageEstimate}/8 pages</span> {pageEstimate > 8 && '— trim before submit!'}</p>
            <div className="flex gap-2">
              <button onClick={prefillExample} className="px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer">Fill school example</button>
              <button onClick={exportDossierHTML} className="px-3 py-2 bg-[#D97757] text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Export PDF-ready</button>
            </div>
          </div>
          {SECTION_TITLES.map((t, i) => (
            <div key={i} className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-2">
              <div className="flex items-center justify-between"><h4 className="text-xs font-bold">{t}</h4><span className="text-[10px] font-mono text-[#6B6860]">{(store.sections[i] || '').length} chars</span></div>
              <textarea value={store.sections[i] || ''} onChange={e => {
                const next = [...store.sections];
                next[i] = e.target.value;
                set({ sections: next });
              }} rows={i === 3 ? 3 : 4} className="w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-xs leading-relaxed" />
              {i === 3 && <InputAIOutput input="Homework photo (input data)" process="AI sorter (few-shot)" output="Tagged task list (result)" />}
              {i === 4 && (
                <div className="text-[11px] text-[#6B6860] space-y-1">
                  <p>Evidence snapshots ({getEvidence().length}):</p>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {getEvidence().slice(0, 10).map(e => <li key={e.id} className="p-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#1F1E1B] border">[{e.timestamp.slice(0, 10)}] {e.title} — {e.detail.slice(0, 80)}</li>)}
                    {getEvidence().length === 0 && <li className="italic">No snapshots yet — use Evidence Snapshot buttons across the app.</li>}
                  </ul>
                  <EvidenceButton onSnap={() => saveEvidence('dossier', 'Manual testing photo note', store.sections[4]?.slice(0, 200) || 'testing photo')} />
                </div>
              )}
              {i === 7 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold">Google Drive folder link (must be “Anyone with the link” before submit)
                    <input value={store.driveLink || ''} onChange={e => set({ driveLink: e.target.value })} placeholder="https://drive.google.com/drive/folders/…" className="mt-1 w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-[#1F1E1B]" />
                  </label>
                  <p className={`text-[11px] font-bold ${driveValid ? 'text-emerald-600' : 'text-amber-700'}`}>{driveValid ? 'Looks like a Drive link ✓ — still open it in incognito to confirm “Anyone with the link”.' : 'Paste a drive.google.com link.'}</p>
                  <label className="flex items-center gap-2 text-[11px] cursor-pointer"><input type="checkbox" checked={!!store.driveOpen} onChange={e => set({ driveOpen: e.target.checked })} className="w-4 h-4 accent-[#D97757]" /> I confirmed sharing is “Anyone with the link”.</label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'promptlog' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold">Prompt Log ({getPromptLogs().length})</h3>
            <div className="flex gap-2">
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(getPromptLogs(), null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'prompt-log.json';
                a.click();
                URL.revokeObjectURL(a.href);
              }} className="px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> JSON</button>
              <button onClick={() => {
                const blob = new Blob([exportPromptLogMarkdown()], { type: 'text/markdown' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'prompt-log.md';
                a.click();
                URL.revokeObjectURL(a.href);
              }} className="px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Markdown</button>
              <button onClick={() => { if (confirm('Clear all Prompt Log entries?')) { clearPromptLogs(); setTab('promptlog'); } }} className="px-3 py-2 rounded-xl border border-rose-300 text-rose-600 text-xs font-bold min-h-[44px] cursor-pointer">Clear</button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border text-xs space-y-2">
            <h4 className="font-bold">Honesty declaration — self-built vs AI-assisted vs open-source (%)</h4>
            {(['self', 'ai', 'oss'] as const).map(k => (
              <label key={k} className="flex items-center gap-2 text-[11px] font-bold">{k === 'self' ? 'Self-built' : k === 'ai' ? 'AI-assisted' : 'Open-source'}
                <input type="range" min={0} max={100} value={store.honesty[k]} onChange={e => set({ honesty: { ...store.honesty, [k]: Number(e.target.value) } })} className="flex-1 accent-[#D97757]" />
                <span className="font-mono w-10 text-right">{store.honesty[k]}%</span>
              </label>
            ))}
            <p className="text-[11px] text-[#6B6860]">List every tool, model, dataset, library, API. AI use is allowed if declared and you can explain, verify, edit and take responsibility.</p>
          </div>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {getPromptLogs().slice(0, 50).map(e => (
              <li key={e.id} className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border text-[11px] space-y-1">
                <p className="font-bold">[{e.feature}] {e.timestamp} · {e.model}</p>
                <p><strong>You:</strong> {e.userPrompt}</p>
                <p><strong>AI:</strong> {e.outputExcerpt}</p>
                <input placeholder="I changed X because Y…" defaultValue={e.studentEditNotes || ''} onBlur={ev => updatePromptLogNotes(e.id, ev.target.value)} aria-label="Student edit notes" className="w-full px-2 py-1.5 rounded-lg border text-[11px] bg-white dark:bg-[#1A1917]" />
              </li>
            ))}
            {getPromptLogs().length === 0 && <li className="text-xs text-[#6B6860] italic">No AI calls logged yet — run the Few-Shot Lab or Model Lab and they appear here automatically.</li>}
          </ul>
        </div>
      )}

      {tab === 'videos' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <div className="flex gap-2" role="tablist" aria-label="Script kind">
            {([['5min', '5-min talk'], ['3min', '3-min demo'], ['10min', '10-min regional']] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={videoKind === id} onClick={() => setVideoKind(id)} className={`px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer border ${videoKind === id ? 'bg-[#D97757] text-white border-[#D97757]' : 'border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>{label}</button>
            ))}
          </div>
          <label className="text-[11px] font-bold">Speaking members (comma-separated, 10-min script gives everyone lines)
            <input value={store.videoMembers.join(', ')} onChange={e => set({ videoMembers: e.target.value.split(',').map((s: string) => s.trim()).slice(0, 3) })} className="mt-1 w-full px-3 py-2 rounded-xl border text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B]" />
          </label>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border">{genScript()}</pre>
          <div className="flex gap-2">
            <button onClick={() => setTele(genScript())} className="px-3 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer">Teleprompter mode</button>
            <EvidenceButton onSnap={() => saveEvidence('dossier-video', `${videoKind} script generated`, genScript().slice(0, 300))} />
          </div>
          {tele && (
            <div className="fixed inset-0 z-50 bg-black text-white p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Teleprompter">
              <pre className="whitespace-pre-wrap text-2xl leading-relaxed max-w-3xl mx-auto">{tele}</pre>
              <button onClick={() => setTele(null)} className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#D97757] rounded-2xl font-bold min-h-[48px] cursor-pointer">Exit (Esc)</button>
            </div>
          )}
        </div>
      )}

      {tab === 'testing' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <h3 className="text-sm font-bold">Test iterations (before → after proves improvement)</h3>
          {store.tests.map((t: any, i: number) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border">
              {(['date', 'input', 'expected', 'actual', 'fix'] as const).map(f => (
                <label key={f} className="text-[10px] font-bold">{f}
                  <input value={t[f] || ''} onChange={e => {
                    const next = [...store.tests];
                    next[i] = { ...next[i], [f]: e.target.value };
                    set({ tests: next });
                  }} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border text-[11px] font-medium bg-white dark:bg-[#1A1917]" />
                </label>
              ))}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => set({ tests: [...store.tests, { date: new Date().toISOString().slice(0, 10), input: '', expected: '', actual: '', fix: '' }] })} className="px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer">+ Add test row</button>
            <EvidenceButton onSnap={() => saveEvidence('dossier-testing', 'Testing log snapshot', `${store.tests.length} iterations logged`)} />
          </div>
          <p className="text-[11px] text-[#6B6860]">Narrative helper: “Our first test failed because <em>…</em>. We fixed it by <em>…</em> and the retest showed <em>…</em>.” Write one sentence per row in Dossier §7.</p>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3 text-xs">
          <h3 className="text-sm font-bold">Timeline & submission checklist</h3>
          <ul className="space-y-1.5">
            {[
              'Province dossier at ai.tainangviet.vn — before 30-9-2026 (team list, dossier Mẫu 1, 5-min talk video, 3-min demo video, dispatch letter)',
              'Free-team qualifier (online dossier + Prompt Log + evidence) — 10-7 → 20-9-2026',
              'Regional South (HCMC) — 10-10-2026 · North (Hanoi) + Central (Da Nang) — 17-10-2026 · 6-hour sprint + 10-min video (all members appear)',
              'Final Hanoi — 20 → 22-11-2026 · 12-hour challenge + defense · keep demo stable 48h before judging',
              'Score: 40% dossier + 60% regional. Re-evaluation within 2 working days (scores/technical/process only — final).',
            ].map((s, i) => <li key={i} className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border">• {s}</li>)}
          </ul>
          <div className="p-3 rounded-xl border space-y-2">
            <div className="flex items-center justify-between"><h4 className="font-bold">48-hour stability monitor</h4><button onClick={pingNow} className="px-3 py-2 bg-[#D97757] text-white rounded-xl text-[11px] font-bold min-h-[44px] cursor-pointer">Ping now</button></div>
            <ul className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px]">{pingLog.map((p, i) => <li key={i}>{p}</li>)}{pingLog.length === 0 && <li className="text-[#6B6860]">No pings yet — press Ping now, keep 48h of green before judging.</li>}</ul>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="checkbox" checked={!!store.anonymize} onChange={e => set({ anonymize: e.target.checked })} className="w-4 h-4 accent-[#D97757]" /> Anonymize children data (blur faces, redact names/IDs) — ON by default</label>
          <div className="space-y-1.5">
            <h4 className="font-bold">License table (every dataset/photo/voice/model needs origin + permission)</h4>
            {store.licenses.map((l: any, i: number) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                {(['item', 'origin', 'permission'] as const).map(f => (
                  <input key={f} value={l[f] || ''} onChange={e => {
                    const next = [...store.licenses];
                    next[i] = { ...next[i], [f]: e.target.value };
                    set({ licenses: next });
                  }} aria-label={`License ${f}`} className="px-2 py-1.5 rounded-lg border text-[11px] bg-[#FAF9F5] dark:bg-[#1F1E1B]" />
                ))}
              </div>
            ))}
            <button onClick={() => set({ licenses: [...store.licenses, { item: '', origin: '', permission: '' }] })} className="px-3 py-2 rounded-xl border text-[11px] font-bold min-h-[44px] cursor-pointer">+ Add resource</button>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold">Prohibited-behavior self-check (all must be checked)</h4>
            {['No ghost/hired work — teachers did not build it for us', 'No copied product without credit', 'No faked Prompt Log, commits, test data or demo video', 'No hidden code/dataset/API sources', 'No illegal personal-data use; consents collected', 'No law/ethics/privacy violations', 'Truthful declaration of self-built vs AI-assisted vs open-source'].map((label, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer text-[11px]"><input type="checkbox" checked={!!store.prohibited[i]} onChange={e => {
                const next = [...store.prohibited];
                next[i] = e.target.checked;
                set({ prohibited: next });
              }} className="mt-0.5 w-4 h-4 accent-[#D97757]" /> {label}</label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
