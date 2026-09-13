import React, { useState, useRef } from 'react';
import { Brain, Plus, Play, Download, Camera, Mic, Type, Trash2, FlaskConical, Sparkles } from 'lucide-react';
import { WhyChip, InputAIOutput, EvidenceButton, VerifyEdit, SocraticError } from '../../components/DivisionAUI';
import { saveEvidence } from '../../services/evidence';
import { logPrompt } from '../../services/promptLog';
import { t, useLang } from '../../services/i18n';
import { callGemini, getClientGeminiApiKey, getClientGroqApiKey } from '../../services/gemini';
import { ClassifierLabTab } from './ClassifierLabTab';

type ProjectType = 'text' | 'image' | 'audio';

interface LabelBucket { name: string; texts: string[]; images: string[]; clips: { name: string; energy: number; zcr: number }[] }

const STORE_KEY = 'scc_trained_models_v1';

export function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
}

/** Seeded Try Example data (VI+EN mix — tokenizer handles diacritics). */
export const SORTER_SEEDS: { name: string; texts: string[] }[] = [
  { name: 'Math', texts: ['giải phương trình bậc hai', 'tính diện tích hình tam giác', 'làm bài tập hình học chương 3'] },
  { name: 'English', texts: ['write essay about environment 200 words', 'learn vocabulary unit 4', 'practice listening lesson 2'] },
];

/** Holdout size per label: last 20% (min 1, max 5); <3 examples → 0 (disabled). Pure. */
export function getHoldoutSize(count: number): number {
  if (count < 3) return 0;
  return Math.min(5, Math.max(1, Math.floor(count * 0.2)));
}

export interface HoldoutRow { input: string; expected: string; predicted: string; correct: boolean; confidence: number }
export interface HoldoutReport {
  active: boolean;
  total: number;
  correct: number;
  accuracy: number;
  perExample: HoldoutRow[];
  perLabel: Record<string, { precision: number; recall: number; support: number }>;
  confusion: Record<string, Record<string, number>>;
  histogram: { low: number; mid: number; high: number };
  holdoutCounts: Record<string, number>;
  trainCounts: Record<string, number>;
}

/**
 * P4 evaluate (NEW pure fn): hold out last 20% per label, run P3 predict,
 * build accuracy + per-label P/R + full confusion + confidence histogram.
 * Pure + synchronous + offline. NO network. NO Gemini.
 */
export function evaluateHoldout(labels: { name: string; texts: string[] }[]): HoldoutReport {
  const names = labels.map(l => l.name);
  const confusion: Record<string, Record<string, number>> = {};
  names.forEach(a => { confusion[a] = {}; names.forEach(b => { confusion[a][b] = 0; }); });
  const holdoutCounts: Record<string, number> = {};
  const trainCounts: Record<string, number> = {};
  const trainLabels = labels.map(l => {
    const h = getHoldoutSize(l.texts.length);
    holdoutCounts[l.name] = h;
    trainCounts[l.name] = l.texts.length - h;
    return { name: l.name, texts: l.texts.slice(0, Math.max(0, l.texts.length - h)) };
  });
  const heldRows: { input: string; expected: string }[] = [];
  labels.forEach(l => {
    const h = getHoldoutSize(l.texts.length);
    if (h > 0) l.texts.slice(l.texts.length - h).forEach(txt => heldRows.push({ input: txt, expected: l.name }));
  });
  if (heldRows.length === 0) {
    const perLabel: HoldoutReport['perLabel'] = {};
    names.forEach(n => { perLabel[n] = { precision: 0, recall: 0, support: labels.find(l => l.name === n)?.texts.length || 0 }; });
    return { active: false, total: 0, correct: 0, accuracy: 0, perExample: [], perLabel, confusion, histogram: { low: 0, mid: 0, high: 0 }, holdoutCounts, trainCounts };
  }
  const perExample: HoldoutRow[] = heldRows.map(r => {
    const p = predictText(trainLabels, r.input);
    const correct = p.label === r.expected;
    if (confusion[r.expected] && typeof confusion[r.expected][p.label] === 'number') confusion[r.expected][p.label]++;
    return { input: r.input, expected: r.expected, predicted: p.label, correct, confidence: p.confidence };
  });
  const correct = perExample.filter(e => e.correct).length;
  const accuracy = Math.round((correct / perExample.length) * 1000) / 10;
  const perLabel: HoldoutReport['perLabel'] = {};
  names.forEach(n => {
    const tp = confusion[n]?.[n] || 0;
    let fp = 0; let fn = 0;
    names.forEach(o => { if (o !== n) { fp += confusion[o]?.[n] || 0; fn += confusion[n]?.[o] || 0; } });
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    perLabel[n] = { precision: Math.round(precision * 1000) / 10, recall: Math.round(recall * 1000) / 10, support: labels.find(l => l.name === n)?.texts.length || 0 };
  });
  const histogram = { low: 0, mid: 0, high: 0 };
  perExample.forEach(e => { if (e.confidence < 50) histogram.low++; else if (e.confidence < 80) histogram.mid++; else histogram.high++; });
  return { active: true, total: perExample.length, correct, accuracy, perExample, perLabel, confusion, histogram, holdoutCounts, trainCounts };
}

export interface WordWeight { word: string; weight: number }
/**
 * P5 explain (NEW pure fn): top-3 contributing words = highest logP delta
 * of the winning label vs the runner-up. Pure + offline.
 */
export function explainPrediction(
  labels: { name: string; texts: string[] }[],
  input: string,
  topK = 3,
): WordWeight[] {
  const tokens = tokenize(input);
  if (tokens.length === 0) return [];
  const vocab = new Set<string>();
  const docCounts = labels.map(l => {
    const counts = new Map<string, number>();
    l.texts.forEach(tt => tokenize(tt).forEach(w => { counts.set(w, (counts.get(w) || 0) + 1); vocab.add(w); }));
    return counts;
  });
  const totals = docCounts.map(c => [...c.values()].reduce((a, b) => a + b, 0) + vocab.size);
  const logPerLabelPerToken = labels.map((_, li) =>
    tokens.map(tok => Math.log(((docCounts[li].get(tok) || 0) + 1) / (totals[li] || 1))),
  );
  const labelScores = labels.map((l, li) => {
    let s = Math.log((l.texts.length + 1) / (labels.reduce((a, x) => a + x.texts.length, 0) + labels.length));
    logPerLabelPerToken[li].forEach(v => { s += v; });
    return s;
  });
  const order = labelScores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
  if (order.length < 2) {
    return tokens.slice(0, topK).map(w => ({ word: w, weight: 0 }));
  }
  const best = order[0].i;
  const runner = order[1].i;
  const deltas = tokens.map((w, ti) => ({
    word: w,
    weight: Math.round((logPerLabelPerToken[best][ti] - logPerLabelPerToken[runner][ti]) * 10) / 10,
  }));
  const seen = new Map<string, number>();
  deltas.forEach(d => { if (!seen.has(d.word) || seen.get(d.word)! < d.weight) seen.set(d.word, d.weight); });
  return [...seen.entries()].map(([word, weight]) => ({ word, weight })).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

/** Naive-Bayes-lite text prediction. Pure — testable. */
export function predictText(labels: { name: string; texts: string[] }[], input: string): { label: string; confidence: number } {
  const tokens = tokenize(input);
  if (tokens.length === 0 || labels.every(l => l.texts.length === 0)) return { label: labels[0]?.name || '—', confidence: 0 };
  const vocab = new Set<string>();
  const docCounts = labels.map(l => {
    const counts = new Map<string, number>();
    l.texts.forEach(t => tokenize(t).forEach(w => { counts.set(w, (counts.get(w) || 0) + 1); vocab.add(w); }));
    return counts;
  });
  const scores = labels.map((l, i) => {
    const counts = docCounts[i];
    const total = [...counts.values()].reduce((a, b) => a + b, 0) + vocab.size;
    let logP = Math.log((l.texts.length + 1) / (labels.reduce((a, x) => a + x.texts.length, 0) + labels.length));
    tokens.forEach(t => { logP += Math.log(((counts.get(t) || 0) + 1) / total); });
    return logP;
  });
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const best = scores.indexOf(max);
  return { label: labels[best].name, confidence: Math.round((exps[best] / sum) * 100) };
}

function imageFeatures(dataUrl: string): Promise<number[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 8; c.height = 8;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 8, 8);
        const d = ctx.getImageData(0, 0, 8, 8).data;
        const v: number[] = [];
        for (let i = 0; i < d.length; i += 4) v.push(Math.round((d[i] + d[i + 1] + d[i + 2]) / 3 / 16));
        resolve(v);
      } catch { resolve([]); }
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

function centroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const c = new Array(dim).fill(0);
  vectors.forEach(v => v.forEach((x, i) => { c[i] += x; }));
  return c.map(x => x / vectors.length);
}

function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export const ModelTrainingWorkspace: React.FC = () => {
  useLang();
  const [featureTab, setFeatureTab] = useState<'sorter' | 'lab'>('sorter');
  const [projectType, setProjectType] = useState<ProjectType>('text');
  const [projectName, setProjectName] = useState('My homework sorter');
  const [labels, setLabels] = useState<LabelBucket[]>([
    { name: 'Math', texts: ['solve quadratic equation x squared', 'geometry triangle area homework'], images: [], clips: [] },
    { name: 'English', texts: ['write essay about environment', 'vocabulary unit 4 homework'], images: [], clips: [] },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTarget, setTextTarget] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [training, setTraining] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgTarget, setImgTarget] = useState(0);
  const [imgCache, setImgCache] = useState<Record<string, number[]>>({});
  // Feature 1 — prediction + metrics state (local Naive Bayes, zero network)
  const [testLine, setTestLine] = useState('');
  const [testNotice, setTestNotice] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ label: string; confidence: number; words: WordWeight[] } | null>(null);
  const [metrics, setMetrics] = useState<HoldoutReport | null>(null);
  const [aiExplain, setAiExplain] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const totalExamples = labels.reduce((a, l) => a + l.texts.length + l.images.length + l.clips.length, 0);

  const addLabel = () => {
    const n = newLabel.trim();
    if (!n) return;
    if (n.length > 24) { setError(t('mdl_label_long')); return; }
    if (labels.length >= 4) { setError(t('mdl_err_labels')); return; }
    if (labels.some(l => l.name.toLowerCase() === n.toLowerCase())) { setError(t('mdl_dup_warn')); return; }
    setLabels([...labels, { name: n, texts: [], images: [], clips: [] }]);
    setNewLabel('');
    setError(null);
  };

  const addTextExample = () => {
    const raw = textInput.trim();
    if (!raw) return;
    if (raw.length < 3) { setError(t('mdl_example_ph')); return; }
    let v = raw;
    if (v.length > 200) {
      v = v.slice(0, 200);
      setWarn(t('mdl_truncated'));
    } else {
      setWarn(null);
    }
    const target = labels[textTarget];
    if (target && target.texts.some(x => x.trim().toLowerCase() === v.toLowerCase())) {
      setWarn(t('mdl_dup_warn'));
      return;
    }
    const next = labels.map((l, i) => (i === textTarget ? { ...l, texts: [...l.texts, v] } : l));
    setLabels(next);
    setTextInput('');
    setError(null);
  };

  const tryExample = () => {
    if (projectType === 'text') {
      setLabels(SORTER_SEEDS.map(s => ({ name: s.name, texts: [...s.texts], images: [], clips: [] })));
      setTestLine('');
      setPrediction(null);
      setError(null);
      setWarn(null);
    } else {
      setError(null);
      setResult(t('mdl_need_photos'));
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = [...labels];
    for (const f of Array.from(files).slice(0, 12)) {
      const dataUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(f);
      });
      next[imgTarget].images.push(dataUrl);
      const feat = await imageFeatures(dataUrl);
      setImgCache(prev => ({ ...prev, [dataUrl]: feat }));
    }
    setLabels(next);
  };

  const handleTrain = async () => {
    setError(null);
    setResult(null);
    const counts = labels.map(l => (projectType === 'text' ? l.texts.length : l.images.length));
    if (labels.length < 2) { setError(t('mdl_err_min_labels')); return; }
    if (counts.some(c => c < 2)) { setError(t('mdl_err_min_examples')); return; }
    setTraining(true);
    setProgress(10);
    // Simulated stepped progress so students see training happen (<30s, honest local compute)
    for (const p of [35, 60, 85]) {
      await new Promise(r => setTimeout(r, 220));
      setProgress(p);
    }
    let accuracy = 0;
    let detail = '';
    if (projectType === 'text') {
      // P1–P4 pure + offline: last 20% per label (min 1, max 5); <3 → disabled.
      const report = evaluateHoldout(labels.map(l => ({ name: l.name, texts: l.texts })));
      setMetrics(report);
      accuracy = report.accuracy;
      if (report.active) {
        detail = `Hold-out test: ${report.correct}/${report.total} correct → accuracy ${report.accuracy}%.`;
      } else {
        detail = t('mdl_holdout_locked') + ' (need 3+ examples per label).';
      }
    } else {
      // Image centroid hold-out
      const feats: Record<string, number[]> = { ...imgCache };
      for (const l of labels) for (const im of l.images) {
        if (!feats[im]) feats[im] = await imageFeatures(im);
      }
      const centroids = labels.map(l => centroid(l.images.map(im => feats[im] || []).filter(v => v.length > 0)));
      let correct = 0; let total = 0;
      labels.forEach((l, li) => {
        const held = l.images.slice(-Math.max(1, Math.floor(l.images.length * 0.2)));
        held.forEach(h => {
          total++;
          const f = feats[h] || [];
          let best = 0; let bestD = Infinity;
          centroids.forEach((c, ci) => { const d = dist(f, c); if (d < bestD) { bestD = d; best = ci; } });
          if (labels[best]?.name === l.name) correct++;
        });
      });
      accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      detail = `Hold-out test: ${correct}/${total} correct → accuracy ${accuracy}%. If you only showed daylight photos, the model fails at night — add varied examples.`;
    }
    setProgress(100);
    setTraining(false);
    const exampleCounts = labels.map(l => `${l.name}:${projectType === 'text' ? l.texts.length : l.images.length}`).join(', ');
    const summary = `${t('mdl_trained_msg')} "${projectName}" on ${totalExamples} examples. ${detail}`;
    setResult(summary);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ name: projectName, type: projectType, labels: labels.map(l => l.name), examples: totalExamples, accuracy, savedAt: new Date().toISOString(), exampleCounts, vocabSize: undefined });
      localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0, 20)));
    } catch {}
    logPrompt({
      feature: 'homework-sorter',
      model: 'naive-bayes-local-v1',
      systemPromptExcerpt: 'Local Naive Bayes word-counting trainer (offline, no cloud, Laplace +1).',
      userPrompt: `Train ${projectType} "${projectName}" [${exampleCounts}]`,
      outputExcerpt: summary.slice(0, 300),
      contribution: 'self-built',
      studentEditNotes: `exampleCounts {${exampleCounts}} accuracy ${accuracy}%`,
    });
    saveEvidence('homework-sorter', `Trained ${projectName} — accuracy ${accuracy}%`, `${summary} Counts: ${exampleCounts}`);
  };

  const handlePredict = () => {
    setTestNotice(null);
    setAiExplain(null);
    const raw = testLine.trim();
    if (!raw) { setTestNotice(t('mdl_predict_empty')); setPrediction(null); return; }
    let v = raw;
    if (v.length > 200) { v = v.slice(0, 200); setTestNotice(t('mdl_truncated')); }
    if (projectType !== 'text') { setTestNotice(t('mdl_need_photos')); return; }
    const trainLabels = labels.map(l => {
      const h = getHoldoutSize(l.texts.length);
      return { name: l.name, texts: h > 0 ? l.texts.slice(0, l.texts.length - h) : l.texts };
    });
    const p = predictText(trainLabels, v);
    const words = explainPrediction(trainLabels, v, 3);
    setPrediction({ label: p.label, confidence: p.confidence, words });
    logPrompt({
      feature: 'homework-sorter',
      model: 'naive-bayes-local-v1',
      systemPromptExcerpt: 'Local Naive Bayes predict (offline, softmax over log-probs).',
      userPrompt: v.slice(0, 300),
      outputExcerpt: `${p.label} ${p.confidence}% heights [${words.map(w => `${w.word} ${w.weight}`).join(', ')}]`.slice(0, 300),
      contribution: 'self-built',
      studentEditNotes: `predict on unseen line; train counts {${labels.map(l => `${l.name}:${l.texts.length}`).join(', ')}}`,
    });
  };

  const handleExplainAI = async () => {
    if (!prediction) return;
    setAiBusy(true);
    setAiExplain(null);
    let hasKey = false;
    try { hasKey = Boolean(getClientGeminiApiKey() || getClientGroqApiKey()); } catch { hasKey = false; }
    if (!hasKey || !navigator.onLine) {
      setAiExplain(t('mdl_ai_offline'));
      setAiBusy(false);
      return;
    }
    try {
      const prompt = `Explain for a 13-year-old why a tiny word-counting Naive Bayes classifier sorted "${testLine.trim().slice(0, 200)}" as "${prediction.label}" (${prediction.confidence}%). Top words: ${prediction.words.map(w => `${w.word} (${w.weight})`).join(', ')}. 2 short sentences, no new label, encouragement to add examples.`;
      const out = await callGemini({ contents: prompt });
      setAiExplain(out.slice(0, 600) || t('mdl_ai_offline'));
      logPrompt({
        feature: 'homework-sorter',
        model: 'gemini-explainer (optional)',
        systemPromptExcerpt: 'AI explanation only — never overrides the local label.',
        userPrompt: prompt.slice(0, 300),
        outputExcerpt: String(out).slice(0, 300),
        contribution: 'ai-assisted',
        studentEditNotes: `local label kept: ${prediction.label}`,
      });
    } catch (e: any) {
      setAiExplain(t('mdl_ai_offline'));
    } finally {
      setAiBusy(false);
    }
  };

  const handleExport = () => {
    const payload = { name: projectName, type: projectType, exportedAt: new Date().toISOString(), labels: labels.map(l => ({ name: l.name, textCount: l.texts.length, imageCount: l.images.length })) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-model.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const labelNames = labels.map(l => l.name);
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-extrabold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2"><Brain className="w-5 h-5 text-[#D97757]" /> {t('train_model')}</h2>
        <p className="text-xs text-[#6B6860]">{t('mdl_sub')}</p>
      </div>
      <WhyChip text={t('mdl_why')} />
      <InputAIOutput input={t('mdl_input')} process={t('mdl_process')} output={t('mdl_output')} />

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Sorter vs Classifier Lab">
        {([
          { id: 'sorter', label: t('mdl_tab_sorter'), icon: Type },
          { id: 'lab', label: t('mdl_tab_lab'), icon: FlaskConical },
        ] as const).map(tab => (
          <button key={tab.id} role="tab" aria-selected={featureTab === tab.id} onClick={() => setFeatureTab(tab.id)} onKeyDown={e => { if (e.key === 'Escape') (e.target as HTMLElement).blur(); }} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#D97757] ${featureTab === tab.id ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {featureTab === 'lab' ? (
        <>
          <ClassifierLabTab />
          <p className="text-[11px] text-[#6B6860]">{t('mdl_ethics')}</p>
        </>
      ) : (
      <>
      <WhyChip text={t('mdl_sorter_why2')} />
      <p className="text-[11px] leading-relaxed text-[#6B6860]">Mô hình nhỏ luyện trên máy (không phải LLM lớn như Gemini). Máy học bằng ví dụ — càng nhiều ảnh đúng, máy đoán càng giỏi. Dữ liệu đầu vào → AI xử lý → Kết quả đầu ra.</p>
      <label className="flex items-start gap-2 text-[11px] font-medium text-[#6B6860] bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl p-3 cursor-pointer">
        <input type="checkbox" required aria-label={t('mdl_consent_label')} className="w-5 h-5 mt-0.5 accent-[#D97757] shrink-0" />
        <span>Tôi đồng ý dùng ảnh của mình để luyện mô hình nhỏ này. Không tải lên ảnh của bạn khác khi chưa được đồng ý.</span>
      </label>

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label={t('mdl_project_type')}>
        {([
          { id: 'text', label: t('mdl_text_sorter'), icon: Type },
          { id: 'image', label: t('mdl_image_sorter'), icon: Camera },
          { id: 'audio', label: t('mdl_sound_clips'), icon: Mic },
        ] as const).map(t => (
          <button key={t.id} role="tab" aria-selected={projectType === t.id} onClick={() => setProjectType(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer border ${projectType === t.id ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <label className="text-xs font-bold">{t('mdl_project_name')}
          <input value={projectName} onChange={e => setProjectName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
        </label>
        <div className="flex gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLabel(); if (e.key === 'Escape') setNewLabel(''); }} placeholder={t('mdl_new_label_ph')} aria-label={t('mdl_new_label_label')} maxLength={24} className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
          <button onClick={addLabel} className="px-3 py-2 bg-[#D97757] text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('add')}</button>
          <button onClick={tryExample} className="px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer">{t('mdl_try_example')}</button>
        </div>
        {/* Dataset balance bar */}
        <div className="space-y-1.5">
          {labels.map((l, i) => {
            const n = projectType === 'text' ? l.texts.length : l.images.length;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-20 truncate font-bold">{l.name}</span>
                <div className="flex-1 h-2 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden"><div className="h-full bg-[#D97757]" style={{ width: `${Math.min(100, n * 10)}%` }} /></div>
                <span className="font-mono text-[11px] text-[#6B6860]">{n}</span>
                <button onClick={() => setLabels(labels.filter((_, j) => j !== i))} aria-label={`Remove ${l.name}`} className="p-1.5 text-[#6B6860] hover:text-rose-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
        {projectType === 'text' ? (
          <div className="flex gap-2">
            <select value={textTarget} onChange={e => setTextTarget(Number(e.target.value))} aria-label={t('mdl_label_for_example')} className="px-2 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs bg-white dark:bg-[#1F1E1B]">
              {labels.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
            <input value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTextExample(); if (e.key === 'Escape') setTextInput(''); }} placeholder={t('mdl_example_ph')} maxLength={200} className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
            <button onClick={addTextExample} className="px-3 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer">{t('add')}</button>
          </div>
        ) : projectType === 'image' ? (
          <div className="flex gap-2 items-center">
            <select value={imgTarget} onChange={e => setImgTarget(Number(e.target.value))} aria-label={t('mdl_label_for_photos')} className="px-2 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs bg-white dark:bg-[#1F1E1B]">
              {labels.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer">{t('mdl_upload_photos')}</button>
            <span className="text-[11px] text-[#6B6860]">{t('mdl_photos_note')}</span>
          </div>
        ) : (
          <p className="text-[11px] text-[#6B6860]">{t('mdl_sound_note')}</p>
        )}
        {warn && <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200" role="status">{warn}</div>}
        {error && <SocraticError message={error} />}
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleTrain} disabled={training} className="px-4 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {training ? `${t('mdl_training')} ${progress}%` : t('mdl_train')}</button>
          <button onClick={handleExport} className="px-3 py-2.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> {t('mdl_export')}</button>
          <EvidenceButton onSnap={() => result && saveEvidence('homework-sorter', `Before/after: ${projectName} — accuracy ${metrics?.accuracy ?? 0}%`, `${result} Counts: ${labels.map(l => `${l.name}:${l.texts.length}`).join(', ')}`)} />
        </div>
        {training && <div className="h-2 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden"><div className="h-full bg-[#D97757] transition-all" style={{ width: `${progress}%` }} /></div>}
        {result && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <p className="font-bold text-emerald-800 dark:text-emerald-200">{result}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">{t('mdl_before_after')}</p>
            <VerifyEdit verified={verified} onToggle={() => setVerified(!verified)} />
          </div>
        )}
      </div>

      {projectType === 'text' && (
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <InputAIOutput input={testLine.trim() ? testLine.trim().slice(0, 40) : t('mdl_test_label')} process="word counting + Bayes" output={prediction ? `${prediction.label} ${prediction.confidence}%` : t('mdl_output')} />
        <label className="text-xs font-bold">{t('mdl_test_label')}
          <div className="mt-1 flex gap-2">
            <input value={testLine} onChange={e => setTestLine(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handlePredict(); if (e.key === 'Escape') setTestLine(''); }} placeholder={t('mdl_test_ph')} maxLength={220} aria-label={t('mdl_test_label')} className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
            <button onClick={handlePredict} className="px-4 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer">{t('mdl_predict')}</button>
          </div>
        </label>
        {testNotice && <SocraticError message={testNotice} />}
        {prediction && (
          <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold">{prediction.label} <span className="font-mono text-xs text-[#6B6860]">{prediction.confidence}%</span></p>
              <span className="text-[10px] font-bold text-[#6B6860]">local · no network</span>
            </div>
            <div className="h-2 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden" role="progressbar" aria-valuenow={prediction.confidence} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-[#D97757]" style={{ width: `${prediction.confidence}%` }} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#6B6860]">{t('mdl_top_words')}</p>
              <div className="flex gap-1.5 flex-wrap">
                {prediction.words.map(w => (
                  <span key={w.word} className="px-2 py-1 rounded-full bg-[#D97757]/10 border border-[#D97757]/40 text-[11px] font-bold text-[#9A4A2E] dark:text-[#E8A07D]">{w.word} +{w.weight} → {prediction.label}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center pt-1">
              <button onClick={handleExplainAI} disabled={aiBusy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-[11px] font-bold min-h-[44px] cursor-pointer hover:border-[#D97757] hover:text-[#D97757] disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5" /> {aiBusy ? t('mdl_explaining') : t('mdl_explain_ai')}
              </button>
              <EvidenceButton onSnap={() => prediction && saveEvidence('homework-sorter', `Before/after: predict "${testLine.trim().slice(0, 40)}"`, `${prediction.label} ${prediction.confidence}% words [${prediction.words.map(w => w.word).join(', ')}] accuracy ${metrics?.accuracy ?? 0}%`)} />
            </div>
            {aiExplain && (
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 text-[11px] leading-relaxed" role="status">
                <strong>{t('mdl_ai_note')}</strong> {aiExplain}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {projectType === 'text' && (
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <p className="text-xs font-extrabold">📊 {t('mdl_holdout_title')}</p>
        {!metrics || !metrics.active ? (
          <div className="space-y-2">
            <SocraticError message={`${t('mdl_holdout_locked')} — ${labels.map(l => `${l.name} (${l.texts.length})`).join(' · ')}`} />
            {metrics && (
              <p className="text-[11px] text-[#6B6860] font-mono">{labelNames.map(n => `${n}: train ${metrics.trainCounts[n] ?? 0} / ${t('mdl_holdout_counts')} ${metrics.holdoutCounts[n] ?? 0}`).join(' · ')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold">{t('mdl_accuracy')} {metrics.accuracy}%</span>
              <span className="font-mono text-[11px] text-[#6B6860]">{metrics.correct}/{metrics.total} · {labelNames.map(n => `${n}: train ${metrics.trainCounts[n]} / holdout ${metrics.holdoutCounts[n]}`).join(' · ')}</span>
            </div>
            <div>
              <p className="font-bold text-[11px] text-[#6B6860] mb-1">{t('mdl_per_label')}</p>
              <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead><tr className="text-left text-[#6B6860]"><th className="p-1.5 border-b">Label</th><th className="p-1.5 border-b">P</th><th className="p-1.5 border-b">R</th><th className="p-1.5 border-b">n</th></tr></thead>
                <tbody>
                  {labelNames.map(n => (
                    <tr key={n}><td className="p-1.5 font-bold">{n}</td><td className="p-1.5 font-mono">{metrics.perLabel[n]?.precision}%</td><td className="p-1.5 font-mono">{metrics.perLabel[n]?.recall}%</td><td className="p-1.5 font-mono">{metrics.perLabel[n]?.support}</td></tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div>
              <p className="font-bold text-[11px] text-[#6B6860] mb-1">{t('mdl_confusion')}</p>
              <div className="overflow-x-auto">
              <table className="text-[11px] border-collapse">
                <thead><tr><th className="p-1.5"></th>{labelNames.map(n => <th key={n} className="p-1.5 border font-bold">{n.slice(0, 4)}</th>)}</tr></thead>
                <tbody>
                  {labelNames.map(r => (
                    <tr key={r}><th className="p-1.5 border text-left font-bold">{r.slice(0, 4)}</th>{labelNames.map(c => (
                      <td key={c} className={`p-1.5 border text-center font-mono ${r === c ? (metrics.confusion[r]?.[c] > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 font-extrabold' : 'bg-[#FAF9F5] dark:bg-[#1F1E1B]') : (metrics.confusion[r]?.[c] > 0 ? 'bg-rose-100 dark:bg-rose-900/40 font-extrabold' : '')}`}>{metrics.confusion[r]?.[c] ?? 0}</td>
                    ))}</tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div>
              <p className="font-bold text-[11px] text-[#6B6860] mb-1">{t('mdl_histo')}</p>
              <div className="flex gap-2 text-[11px] font-mono">
                <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border">0–49: {metrics.histogram.low}</span>
                <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border">50–79: {metrics.histogram.mid}</span>
                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border">80–100: {metrics.histogram.high}</span>
              </div>
              <p className="text-[11px] text-[#6B6860] mt-1">Low confidence = need more examples.</p>
            </div>
            <details className="text-[11px]">
              <summary className="cursor-pointer font-bold text-[#6B6860]">Per-example ({metrics.perExample.length})</summary>
              <ul className="mt-1.5 space-y-1 max-h-40 overflow-y-auto">
                {metrics.perExample.map((e, i) => (
                  <li key={i} className={`p-2 rounded-xl border ${e.correct ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60' : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60'}`}>
                    “{e.input}” — expected {e.expected}, got {e.predicted} ({e.confidence}%) {e.correct ? '✓' : '✗'}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
      )}
      <p className="text-[11px] text-[#6B6860]">{t('mdl_ethics')}</p>
      </>
      )}
    </div>
  );
};
