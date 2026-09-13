import React, { useEffect, useMemo, useState } from 'react';
import { Play, Plus, Trash2, Sparkles } from 'lucide-react';
import { WhyChip, InputAIOutput, EvidenceButton, SocraticError } from '../../components/DivisionAUI';
import { saveEvidence } from '../../services/evidence';
import { logPrompt } from '../../services/promptLog';
import { t, useLang } from '../../services/i18n';
import {
  CLASSIFIER_LABELS,
  CLASSIFIER_SEED_ROWS,
  LabeledSchoolRow,
  buildClassifierComparisonSentence,
  buildFewShotClassifierPrompt,
  buildZeroShotClassifierPrompt,
  localBaselinePredict,
  localFewShotPredict,
  scoreClassifierPredictions,
  splitClassifierDataset,
  type ClassifierScoreboard,
} from '../../services/aiTrainingPipeline';
import { callGemini, getClientGeminiApiKey, getClientGroqApiKey } from '../../services/gemini';

interface RowResult {
  id: string;
  text: string;
  expected: string;
  predA: string;
  predB: string;
  correctA: boolean;
  correctB: boolean;
  latencyA: number;
  latencyB: number;
}

interface LastRun {
  rows: RowResult[];
  scoreA: ClassifierScoreboard;
  scoreB: ClassifierScoreboard;
  sentence: string;
  at: string;
}

const NOTES_KEY = 'scc_classifier_notes_v1';
const LAST_RUN_KEY = 'scc_classifier_last_run_v1';

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return typeof o === 'object' && o !== null ? o : {};
  } catch { return {}; }
}

function loadLastRun(): LastRun | null {
  try {
    const raw = localStorage.getItem(LAST_RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const ClassifierLabTab: React.FC = () => {
  useLang();
  const [dataset, setDataset] = useState<LabeledSchoolRow[]>([]);
  const [newText, setNewText] = useState('');
  const [newLabel, setNewLabel] = useState<string>('ASSIGNMENT');
  const [formError, setFormError] = useState<string | null>(null);
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [run, setRun] = useState<LastRun | null>(() => loadLastRun());
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [judgeOn, setJudgeOn] = useState(false);
  const [judgeRowId, setJudgeRowId] = useState<string>('');
  const [judgeOut, setJudgeOut] = useState<string | null>(null);
  const [judgeBusy, setJudgeBusy] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch {}
  }, [notes]);

  const { exampleRows, testRows, excludedIds } = useMemo(
    () => splitClassifierDataset(dataset),
    [dataset],
  );
  const locked = dataset.length < 6;
  const hasKey = useMemo(() => {
    try { return Boolean(getClientGeminiApiKey() || getClientGroqApiKey()); } catch { return false; }
  }, []);
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const promptA = testRows.length > 0 ? buildZeroShotClassifierPrompt(testRows[0].text) : buildZeroShotClassifierPrompt('Nộp bài báo cáo thực hành Vật Lý chương 2 thứ 6');
  const promptB = testRows.length > 0 ? buildFewShotClassifierPrompt(testRows[0].text, exampleRows) : buildFewShotClassifierPrompt('Lịch thi kết thúc học phần HK1', CLASSIFIER_SEED_ROWS.slice(0, 3));

  const tryExample = () => {
    setDataset(CLASSIFIER_SEED_ROWS.map(r => ({ ...r })));
    setEditedIds(new Set());
    setFormError(null);
  };

  const addRow = () => {
    const v = newText.trim();
    if (v.length < 5 || v.length > 300) {
      setFormError(v.length < 5 ? 'Type 5–300 characters — e.g. Nộp bài báo cáo Vật Lý thứ 6' : 'Trimmed to 300 characters.');
      if (v.length > 300) {
        const cut = v.slice(0, 300);
        setDataset([...dataset, { id: `cl-${Date.now()}`, text: cut, expectedLabel: (CLASSIFIER_LABELS.includes(newLabel as any) ? newLabel : 'ASSIGNMENT') as any }]);
        setNewText('');
        setFormError(null);
      }
      return;
    }
    if (!CLASSIFIER_LABELS.includes(newLabel as any)) { setFormError('Pick a label from the fixed set.'); return; }
    setDataset([...dataset, { id: `cl-${Date.now()}`, text: v, expectedLabel: newLabel as any }]);
    setNewText('');
    setFormError(null);
  };

  const updateRowLabel = (id: string, label: string) => {
    if (!CLASSIFIER_LABELS.includes(label as any)) return;
    setDataset(ds => ds.map(r => (r.id === id ? { ...r, expectedLabel: label as any } : r)));
    setEditedIds(prev => new Set(prev).add(id));
  };

  const updateRowText = (id: string, text: string) => {
    if (text.length > 300) return;
    setDataset(ds => ds.map(r => (r.id === id ? { ...r, text } : r)));
    setEditedIds(prev => new Set(prev).add(id));
  };

  const removeRow = (id: string) => {
    setDataset(ds => ds.filter(r => r.id !== id));
  };

  const handleRun = () => {
    if (locked || running) return;
    setRunning(true);
    setJudgeOut(null);
    // Local-first: pure scoring, zero network. Prompts are built + logged for transparency.
    const rows: RowResult[] = testRows.map(r => {
      const t0 = performance.now();
      const a = localBaselinePredict(r.text);
      const latA = round2(performance.now() - t0) || 0.1;
      const t1 = performance.now();
      const b = localFewShotPredict(r.text, exampleRows);
      const latB = round2(performance.now() - t1) || 0.1;
      return {
        id: r.id,
        text: r.text,
        expected: r.expectedLabel,
        predA: a.category,
        predB: b.category,
        correctA: a.category === r.expectedLabel,
        correctB: b.category === r.expectedLabel,
        latencyA: latA,
        latencyB: latB,
      };
    });
    const expected = rows.map(r => r.expected);
    const scoreA = scoreClassifierPredictions(expected, rows.map(r => r.predA), [...CLASSIFIER_LABELS], rows.map(r => r.latencyA));
    const scoreB = scoreClassifierPredictions(expected, rows.map(r => r.predB), [...CLASSIFIER_LABELS], rows.map(r => r.latencyB));
    const stillFailing = rows.filter(r => !r.correctA && !r.correctB).map(r => r.expected);
    const sentence = buildClassifierComparisonSentence(scoreA.accuracy, scoreB.accuracy, rows.length, stillFailing);
    const next: LastRun = { rows, scoreA, scoreB, sentence, at: new Date().toISOString() };
    setRun(next);
    try { localStorage.setItem(LAST_RUN_KEY, JSON.stringify(next)); } catch {}
    logPrompt({
      feature: 'classifier-lab-baseline',
      model: 'zero-shot-template-v1 (local simulation, offline)',
      systemPromptExcerpt: promptA.slice(0, 300),
      userPrompt: `${rows.length} test rows (3 examples excluded: ${excludedIds.join(', ')})`,
      outputExcerpt: `A accuracy ${scoreA.accuracy}% (${scoreA.correct}/${scoreA.total}) P${scoreA.macroPrecision} R${scoreA.macroRecall} F1${scoreA.macroF1}`.slice(0, 300),
      contribution: 'ai-assisted',
      studentEditNotes: `local simulation; examples excluded [${excludedIds.join(', ')}]`,
    });
    logPrompt({
      feature: 'classifier-lab-fewshot',
      model: 'few-shot-template-v1 (local simulation, offline)',
      systemPromptExcerpt: promptB.slice(0, 300),
      userPrompt: `${rows.length} test rows with 3 examples as context`,
      outputExcerpt: `B accuracy ${scoreB.accuracy}% (${scoreB.correct}/${scoreB.total}) P${scoreB.macroPrecision} R${scoreB.macroRecall} F1${scoreB.macroF1}. ${sentence}`.slice(0, 300),
      contribution: 'ai-assisted',
      studentEditNotes: `local simulation; ${sentence}`,
    });
    setRunning(false);
  };

  const handleJudge = async () => {
    const target = run?.rows.find(r => r.id === judgeRowId) || run?.rows.find(r => !r.correctA && !r.correctB) || run?.rows.find(r => !r.correctB);
    if (!target) return;
    setJudgeBusy(true);
    setJudgeOut(null);
    let key = false;
    try { key = Boolean(getClientGeminiApiKey() || getClientGroqApiKey()); } catch { key = false; }
    if (!key || !navigator.onLine) {
      setJudgeOut(t('clab_queued'));
      setJudgeBusy(false);
      return;
    }
    try {
      const prompt = `For a 13-year-old: explain in 2 short sentences why "${target.text}" (expected ${target.expected}) was hard — baseline guessed ${target.predA}, few-shot guessed ${target.predB}. Do not rescore, only explain the confusion.`;
      const out = await callGemini({ contents: prompt });
      setJudgeOut(String(out).slice(0, 600));
      logPrompt({
        feature: 'classifier-lab-explainer',
        model: 'gemini-explainer (one error row only)',
        systemPromptExcerpt: 'Explain ONE chosen error row only — never rescored.',
        userPrompt: prompt.slice(0, 300),
        outputExcerpt: String(out).slice(0, 300),
        contribution: 'ai-assisted',
        studentEditNotes: `row ${target.id} explained, scores untouched`,
      });
    } catch {
      setJudgeOut(t('clab_queued'));
    } finally {
      setJudgeBusy(false);
    }
  };

  const bFixesA = run?.rows.filter(r => !r.correctA && r.correctB) || [];
  const bothMiss = run?.rows.filter(r => !r.correctA && !r.correctB) || [];
  const delta = run ? Math.round((run.scoreB.accuracy - run.scoreA.accuracy) * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-[#141413] dark:text-[#FAF9F5]">{t('clab_title')}</h3>
        <p className="text-xs text-[#6B6860]">{t('clab_sub')}</p>
      </div>
      <WhyChip text={t('clab_why')} />
      <InputAIOutput
        input={`${dataset.length || 'N'} labeled school messages`}
        process="same rows, 2 prompt methods"
        output={run ? `B ${delta >= 0 ? 'wins' : 'loses'} by ${delta >= 0 ? '+' : ''}${delta}%` : 'B vs A — run to measure'}
      />

      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={tryExample} className="px-3 py-2 rounded-xl bg-[#D97757] text-white text-xs font-bold min-h-[44px] cursor-pointer">{t('clab_try')}</button>
          <span className="text-[11px] text-[#6B6860] font-mono">{dataset.length} rows · {exampleRows.length} teach B · {testRows.length} scored</span>
        </div>
        {dataset.length === 0 ? (
          <p className="text-[11px] text-[#6B6860]">Add rows below or press “{t('clab_try')}” — 12 school-realistic rows appear with zero typing.</p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {dataset.map((r, idx) => (
              <li key={r.id} className={`p-2 rounded-xl border text-[11px] space-y-1.5 ${idx < 3 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB]/60'}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded-md font-mono font-bold ${idx < 3 ? 'bg-amber-200/70 text-amber-900' : 'bg-[#EFECE2] dark:bg-[#252422] text-[#6B6860]'}`}>{idx < 3 ? `EX-${idx + 1} · teaches B` : `T-${idx - 2}`}</span>
                  {editedIds.has(r.id) && <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 font-bold">edited</span>}
                  <button onClick={() => removeRow(r.id)} aria-label={`Remove row`} className="ml-auto p-1.5 text-[#6B6860] hover:text-rose-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <input value={r.text} onChange={e => updateRowText(r.id, e.target.value)} onKeyDown={e => { if (e.key === 'Escape') (e.target as HTMLElement).blur(); }} maxLength={300} aria-label={t('clab_text_col')} className="w-full px-2 py-1.5 rounded-lg border border-[#DFDACB] dark:border-[#2C2B27] bg-white dark:bg-[#1A1917] text-[11px]" />
                <select value={r.expectedLabel} onChange={e => updateRowLabel(r.id, e.target.value)} aria-label={t('clab_expected')} className="px-2 py-1.5 rounded-lg border border-[#DFDACB] dark:border-[#2C2B27] text-[11px] bg-white dark:bg-[#1A1917] font-bold">
                  {CLASSIFIER_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRow(); if (e.key === 'Escape') setNewText(''); }} placeholder={t('clab_add_ph')} maxLength={300} aria-label={t('clab_text_col')} className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-xs" />
          <select value={newLabel} onChange={e => setNewLabel(e.target.value)} aria-label={t('clab_expected')} className="px-2 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs bg-white dark:bg-[#1F1E1B] font-bold">
            {CLASSIFIER_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={addRow} className="px-3 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('add')}</button>
        </div>
        {formError && <SocraticError message={formError} />}
        {locked ? (
          <SocraticError message={t('clab_locked')} />
        ) : (
          <p className="text-[11px] text-[#6B6860]">{excludedIds.length} {t('clab_excluded')}.</p>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleRun} disabled={locked || running} className="px-4 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> {running ? t('clab_running') : t('clab_run')}
          </button>
          {run && (
            <EvidenceButton onSnap={() => saveEvidence('classifier-lab', `Baseline vs few-shot: ${run.scoreA.accuracy}%→${run.scoreB.accuracy}% on ${run.scoreA.total} rows`, `${run.sentence} Fails remaining: ${bothMiss.map(r => r.text.slice(0, 40)).join(' | ').slice(0, 300)} Notes: ${Object.values(notes).filter(Boolean).join(' | ').slice(0, 150)}`)} />
          )}
        </div>
        {(!hasKey || !online) && (
          <SocraticError message={t('clab_queued')} />
        )}
        <details className="text-[11px]">
          <summary className="cursor-pointer font-bold text-[#6B6860] min-h-[44px] flex items-center">{t('clab_prompts')}</summary>
          <div className="mt-2 space-y-2">
            <div>
              <p className="font-bold">{t('clab_method_a')}</p>
              <pre className="mt-1 p-2.5 rounded-xl bg-[#1A1917] text-[#E8E6DF] font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">{promptA}</pre>
            </div>
            <div>
              <p className="font-bold">{t('clab_method_b')}</p>
              <pre className="mt-1 p-2.5 rounded-xl bg-[#1A1917] text-[#E8E6DF] font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">{promptB}</pre>
            </div>
          </div>
        </details>
      </div>

      {run && (
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <div className={`p-2.5 rounded-xl text-xs font-bold ${delta > 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-200' : delta < 0 ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-200' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border text-[#6B6860]'}`}>
          {run.sentence}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {([
            { id: 'A', label: t('clab_method_a'), s: run.scoreA },
            { id: 'B', label: t('clab_method_b'), s: run.scoreB },
          ] as const).map(col => (
            <div key={col.id} className={`p-3 rounded-xl border ${col.id === 'B' ? 'border-[#D97757]/50 bg-[#D97757]/5' : 'border-[#DFDACB] dark:border-[#2C2B27]'}`}>
              <p className="font-extrabold text-[11px]">{col.label}</p>
              <p className="text-lg font-extrabold font-mono">{col.s.accuracy}%</p>
              <p className="font-mono text-[10px] text-[#6B6860]">{col.s.correct}/{col.s.total} · P{col.s.macroPrecision} R{col.s.macroRecall} F1{col.s.macroF1}</p>
              <p className="font-mono text-[10px] text-[#6B6860]">avg {col.s.avgLatencyMs}ms</p>
            </div>
          ))}
        </div>
        <div>
          <p className="font-bold text-[11px] text-[#6B6860] mb-1">{t('clab_per_row')}</p>
          <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead><tr className="text-left text-[#6B6860]"><th className="p-1.5 border-b">{t('clab_text_col')}</th><th className="p-1.5 border-b">{t('clab_expected')}</th><th className="p-1.5 border-b">A</th><th className="p-1.5 border-b">B</th></tr></thead>
            <tbody>
              {run.rows.map(r => (
                <tr key={r.id} className="border-b border-[#DFDACB]/40">
                  <td className="p-1.5 max-w-[220px] truncate" title={r.text}>{r.text}{editedIds.has(r.id) ? ' · edited' : ''}</td>
                  <td className="p-1.5 font-bold">{r.expected}</td>
                  <td className={`p-1.5 font-mono ${r.correctA ? 'text-emerald-700' : 'text-rose-600'}`}>{r.correctA ? '✓' : '✗'} {r.predA.slice(0, 4)}</td>
                  <td className={`p-1.5 font-mono ${r.correctB ? 'text-emerald-700' : 'text-rose-600'}`}>{r.correctB ? '✓' : '✗'} {r.predB.slice(0, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div>
          <p className="font-bold text-[11px] text-[#6B6860] mb-1">{t('clab_fails')}</p>
          <div className="space-y-1.5">
            {[...bFixesA.map(r => ({ ...r, kind: 'fixed' as const })), ...bothMiss.map(r => ({ ...r, kind: 'miss' as const }))].map(r => (
              <div key={`${r.kind}-${r.id}`} className={`p-2 rounded-xl border text-[11px] space-y-1 ${r.kind === 'fixed' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60' : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60'}`}>
                <p>{r.kind === 'fixed' ? `B fixed A ✓ — “${r.text}” → ${r.predB} (A said ${r.predA})` : `Both miss ✗ — “${r.text}” expected ${r.expected}, got A:${r.predA} B:${r.predB}`}</p>
                <input value={notes[r.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value.slice(0, 120) }))} onKeyDown={e => { if (e.key === 'Escape') (e.target as HTMLElement).blur(); }} placeholder={t('clab_note_ph')} aria-label={t('clab_note_ph')} maxLength={120} className="w-full px-2 py-1.5 rounded-lg border border-[#DFDACB] dark:border-[#2C2B27] bg-white dark:bg-[#1A1917] text-[11px]" />
              </div>
            ))}
            {bFixesA.length === 0 && bothMiss.length === 0 && <p className="text-[11px] text-[#6B6860]">No failures — try editing one expected label to a wrong value and re-run to see scores move.</p>}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
          <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer">
            <input type="checkbox" checked={judgeOn} onChange={e => setJudgeOn(e.target.checked)} className="w-5 h-5 accent-[#D97757]" />
            {judgeOn ? t('clab_judge_on') : t('clab_judge_off')}
          </label>
          {judgeOn && (
            <div className="flex gap-2 flex-wrap items-center">
              <select value={judgeRowId} onChange={e => setJudgeRowId(e.target.value)} aria-label="Error row" className="px-2 py-2 rounded-xl border text-[11px] bg-white dark:bg-[#1A1917] font-bold">
                <option value="">Pick an error row…</option>
                {[...bothMiss, ...run.rows.filter(r => !r.correctB)].map(r => <option key={r.id} value={r.id}>{r.text.slice(0, 40)}…</option>)}
              </select>
              <button onClick={handleJudge} disabled={judgeBusy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold min-h-[44px] cursor-pointer hover:border-[#D97757] hover:text-[#D97757] disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5" /> {t('clab_explain_one')}
              </button>
            </div>
          )}
          {judgeOut && <p className="text-[11px] leading-relaxed p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200" role="status"><strong>AI judge (1 row, scores untouched):</strong> {judgeOut}</p>}
        </div>
      </div>
      )}
    </div>
  );
};
