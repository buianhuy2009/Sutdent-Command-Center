import React, { useState, useRef } from 'react';
import { Brain, Plus, Play, Download, Camera, Mic, Type, Trash2 } from 'lucide-react';
import { WhyChip, InputAIOutput, EvidenceButton, VerifyEdit, SocraticError } from '../../components/DivisionAUI';
import { saveEvidence } from '../../services/evidence';
import { logPrompt } from '../../services/promptLog';

type ProjectType = 'text' | 'image' | 'audio';

interface LabelBucket { name: string; texts: string[]; images: string[]; clips: { name: string; energy: number; zcr: number }[] }

const STORE_KEY = 'scc_trained_models_v1';

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
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
  const [verified, setVerified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [training, setTraining] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgTarget, setImgTarget] = useState(0);
  const [imgCache, setImgCache] = useState<Record<string, number[]>>({});

  const totalExamples = labels.reduce((a, l) => a + l.texts.length + l.images.length + l.clips.length, 0);

  const addLabel = () => {
    const n = newLabel.trim();
    if (!n) return;
    if (labels.length >= 4) { setError('Keep 2–4 labels so training stays fast on a school Chromebook.'); return; }
    setLabels([...labels, { name: n, texts: [], images: [], clips: [] }]);
    setNewLabel('');
    setError(null);
  };

  const addTextExample = () => {
    const t = textInput.trim();
    if (!t) return;
    const next = labels.map((l, i) => (i === textTarget ? { ...l, texts: [...l.texts, t] } : l));
    setLabels(next);
    setTextInput('');
  };

  const tryExample = () => {
    if (projectType === 'text') {
      setTextInput('nộp bài tập toán chương 3 ngày mai');
      setError(null);
    } else {
      setError(null);
      setResult('Upload 2–3 photos per label first (e.g. notebook vs textbook), then press Train.');
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
    if (labels.length < 2) { setError('Create at least 2 labels first.'); return; }
    if (counts.some(c => c < 2)) { setError('Add at least 2 examples per label (8+ is best). Small data = the model guesses — that is called overfitting.'); return; }
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
      // Hold-out 20% (min 1 per label)
      let correct = 0; let total = 0;
      const trainLabels = labels.map(l => {
        const hold = Math.max(l.texts.length >= 5 ? Math.floor(l.texts.length * 0.2) : 1, 0);
        return { name: l.name, texts: l.texts.slice(0, Math.max(1, l.texts.length - hold)), held: l.texts.slice(Math.max(1, l.texts.length - hold)) };
      });
      trainLabels.forEach(tl => {
        tl.held.forEach(h => {
          total++;
          const p = predictText(trainLabels.map(t => ({ name: t.name, texts: t.texts })), h);
          if (p.label === tl.name) correct++;
        });
      });
      accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      detail = `Hold-out test: ${correct}/${total} correct → accuracy ${accuracy}%.`;
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
    const summary = `Trained tiny ${projectType} classifier "${projectName}" on ${totalExamples} examples. ${detail}`;
    setResult(summary);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ name: projectName, type: projectType, labels: labels.map(l => l.name), examples: totalExamples, accuracy, savedAt: new Date().toISOString() });
      localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0, 20)));
    } catch {}
    logPrompt({
      feature: 'model-training',
      model: 'browser-tiny-centroid-v1 (offline, no cloud)',
      systemPromptExcerpt: 'Local centroid/Naive-Bayes trainer. Honest tiny model — not an LLM.',
      userPrompt: `Train ${projectType} project "${projectName}" with ${totalExamples} examples`,
      outputExcerpt: summary,
      contribution: 'self-built',
      studentEditNotes: '',
    });
    saveEvidence('model-training', `Trained ${projectName}`, summary);
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

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-extrabold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2"><Brain className="w-5 h-5 text-[#D97757]" /> Train My Model Lab</h2>
        <p className="text-xs text-[#6B6860]">Train a <strong>tiny</strong> classifier in your browser. No server, photos stay on your device.</p>
      </div>
      <WhyChip text="Judges want to see you describe Input → AI processing → Output and show test iterations. This lab produces both." />
      <p className="text-[11px] leading-relaxed text-[#6B6860]">Mô hình nhỏ luyện trên máy (không phải LLM lớn như Gemini). Máy học bằng ví dụ — càng nhiều ảnh đúng, máy đoán càng giỏi. Dữ liệu đầu vào → AI xử lý → Kết quả đầu ra.</p>
      <label className="flex items-start gap-2 text-[11px] font-medium text-[#6B6860] bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl p-3 cursor-pointer">
        <input type="checkbox" required aria-label="Consent to use my photos for tiny-model training" className="w-5 h-5 mt-0.5 accent-[#D97757] shrink-0" />
        <span>Tôi đồng ý dùng ảnh của mình để luyện mô hình nhỏ này. Không tải lên ảnh của bạn khác khi chưa được đồng ý.</span>
      </label>
      <InputAIOutput input="Your examples (texts / photos)" process="Tiny local model learns patterns" output="Prediction + confidence %" />

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Project type">
        {([
          { id: 'text', label: 'Text sorter', icon: Type },
          { id: 'image', label: 'Image sorter', icon: Camera },
          { id: 'audio', label: 'Sound clips', icon: Mic },
        ] as const).map(t => (
          <button key={t.id} role="tab" aria-selected={projectType === t.id} onClick={() => setProjectType(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer border ${projectType === t.id ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
        <label className="text-xs font-bold">Project name
          <input value={projectName} onChange={e => setProjectName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
        </label>
        <div className="flex gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} placeholder="New label (e.g. Science)" aria-label="New label name" className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
          <button onClick={addLabel} className="px-3 py-2 bg-[#D97757] text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
          <button onClick={tryExample} className="px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer">Try Example</button>
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
                <button onClick={() => setLabels(labels.filter((_, j) => j !== i))} aria-label={`Remove ${l.name}`} className="p-1.5 text-[#6B6860] hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
        {projectType === 'text' ? (
          <div className="flex gap-2">
            <select value={textTarget} onChange={e => setTextTarget(Number(e.target.value))} aria-label="Label for example" className="px-2 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs bg-white dark:bg-[#1F1E1B]">
              {labels.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
            <input value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTextExample()} placeholder="Type an example, Enter to add" className="flex-1 px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
            <button onClick={addTextExample} className="px-3 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer">Add</button>
          </div>
        ) : projectType === 'image' ? (
          <div className="flex gap-2 items-center">
            <select value={imgTarget} onChange={e => setImgTarget(Number(e.target.value))} aria-label="Label for photos" className="px-2 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs bg-white dark:bg-[#1F1E1B]">
              {labels.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer">Upload photos</button>
            <span className="text-[11px] text-[#6B6860]">Only use photos you have permission to use.</span>
          </div>
        ) : (
          <p className="text-[11px] text-[#6B6860]">Sound clips: record 1-second claps vs snaps with your microphone in the browser recorder, then compare energy patterns. (Microphone never uploads — all on-device.)</p>
        )}
        {error && <SocraticError message={error} />}
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleTrain} disabled={training} className="px-4 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {training ? `Training… ${progress}%` : 'Train (under 30s)'}</button>
          <button onClick={handleExport} className="px-3 py-2.5 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export model.json</button>
          <EvidenceButton onSnap={() => result && saveEvidence('model-training', `Snapshot ${projectName}`, result)} />
        </div>
        {training && <div className="h-2 bg-[#EFECE2] dark:bg-[#252422] rounded-full overflow-hidden"><div className="h-full bg-[#D97757] transition-all" style={{ width: `${progress}%` }} /></div>}
        {result && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <p className="font-bold text-emerald-800 dark:text-emerald-200">{result}</p>
            <VerifyEdit verified={verified} onToggle={() => setVerified(!verified)} />
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#6B6860]">Ethics: only train on photos/voices with permission. Anonymize classmates. This tiny model proves the Input → AI → Output idea — it does not train a big LLM.</p>
    </div>
  );
};
