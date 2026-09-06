import React, { useState } from 'react';
import { FlaskConical, Play, Download } from 'lucide-react';
import {
  ACADEMIC_EMAIL_DATASET,
  VIETNAMESE_NLP_TASK_DATASET,
} from '../../data/aiTrainingDatasets';
import {
  buildFewShotNlpTaskPrompt,
  buildFewShotEmailClassifierPrompt,
  evaluateEmailSampleOffline,
  runOfflineAiBenchmark,
} from '../../services/aiTrainingPipeline';
import { WhyChip, InputAIOutput, EvidenceButton, VerifyEdit } from '../../components/DivisionAUI';
import { saveEvidence } from '../../services/evidence';
import { logPrompt } from '../../services/promptLog';

export const FewShotLabWorkspace: React.FC = () => {
  const [tab, setTab] = useState<'nlp' | 'email' | 'benchmark'>('nlp');
  const [nlpInput, setNlpInput] = useState('Làm bài tập Toán chương 3 nộp ngày mai');
  const [emailSubject, setEmailSubject] = useState('Thông báo nộp bài tập Giải tích chương 3');
  const [emailBody, setEmailBody] = useState('Các em nộp bài tập Giải tích chương 3 trước 23h59 ngày 15/09/2026 trên Canvas.');
  const [preview, setPreview] = useState('');
  const [evalLine, setEvalLine] = useState('');
  const [verified, setVerified] = useState(false);

  const showNlpPrompt = () => {
    const p = buildFewShotNlpTaskPrompt(nlpInput);
    setPreview(p);
    logPrompt({
      feature: 'few-shot-lab',
      model: 'few-shot-template-v1 (offline preview)',
      systemPromptExcerpt: 'Vietnamese task parser few-shot template (3 examples)',
      userPrompt: nlpInput,
      outputExcerpt: p.slice(0, 300),
      contribution: 'self-built',
    });
  };

  const showEmailPrompt = () => {
    const p = buildFewShotEmailClassifierPrompt(emailSubject, emailBody);
    setPreview(p);
    logPrompt({
      feature: 'few-shot-lab',
      model: 'few-shot-template-v1 (offline preview)',
      systemPromptExcerpt: 'Academic email classifier few-shot template (3 examples)',
      userPrompt: `${emailSubject} | ${emailBody.slice(0, 200)}`,
      outputExcerpt: p.slice(0, 300),
      contribution: 'self-built',
    });
  };

  const runEmailEval = () => {
    const sample = ACADEMIC_EMAIL_DATASET[0];
    const r = evaluateEmailSampleOffline(sample);
    const line = `Offline check on "${sample.subject}": predicted ${r.predictedCategory} (spam=${r.predictedIsSpam}) — ${r.isCorrect ? 'CORRECT' : 'WRONG'} in ${r.latencyMs}ms.`;
    setEvalLine(line);
    logPrompt({
      feature: 'few-shot-lab',
      model: 'rule-baseline-v1 (offline)',
      systemPromptExcerpt: 'Keyword + domain heuristic baseline',
      userPrompt: sample.subject,
      outputExcerpt: line,
      contribution: 'self-built',
    });
  };

  const runBenchmark = () => {
    const report = runOfflineAiBenchmark();
    const line = `Benchmark ${report.datasetVersion}: overall ${report.overallScore}% — email F1 ${report.tasks.emailClassification.f1Score}%, NLP accuracy ${report.tasks.vietnameseNlpExtraction.accuracy}%. Model: ${report.modelName}`;
    setEvalLine(line);
    logPrompt({
      feature: 'few-shot-lab',
      model: report.modelName,
      systemPromptExcerpt: 'Full offline benchmark over academic datasets',
      userPrompt: 'runOfflineAiBenchmark()',
      outputExcerpt: line,
      contribution: 'ai-assisted',
    });
    saveEvidence('few-shot-lab', 'Benchmark report', line);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-extrabold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2"><FlaskConical className="w-5 h-5 text-[#D97757]" /> Few-Shot Calibration Lab</h2>
        <p className="text-xs text-[#6B6860]">Calibrate prompts with 2–5 examples. Every run is logged to the Prompt Log with your edit notes.</p>
      </div>
      <WhyChip text="Judges require your Prompt Log: system prompt + full history + what you changed and why. This lab writes it automatically." />
      <InputAIOutput input="2–5 Input → Output examples" process="Calibrated few-shot prompt" output="Better parse + accuracy %" />

      <div className="flex gap-2" role="tablist" aria-label="Lab tabs">
        {([['nlp', 'Task parser'], ['email', 'Email classifier'], ['benchmark', 'Benchmark']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer border ${tab === id ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'nlp' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <label className="text-xs font-bold">Try input (Vietnamese)
            <input value={nlpInput} onChange={e => setNlpInput(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
          </label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={showNlpPrompt} className="px-4 py-2.5 bg-[#D97757] text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Preview calibrated prompt</button>
            <button onClick={() => setNlpInput('Nộp bài essay tiếng Anh Unit 4 trước thứ Sáu')} className="px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer">Try Example</button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer font-bold text-[#6B6860]">View training examples ({VIETNAMESE_NLP_TASK_DATASET.length})</summary>
            <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {VIETNAMESE_NLP_TASK_DATASET.slice(0, 8).map(s => (
                <li key={s.id} className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB]/50 text-[11px]">“{s.rawInput}” → {s.groundTruth.subject} · {s.groundTruth.assignmentName} [{s.groundTruth.priority}]</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {tab === 'email' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <label className="text-xs font-bold">Subject
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
          </label>
          <label className="text-xs font-bold">Body snippet
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-sm" />
          </label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={showEmailPrompt} className="px-4 py-2.5 bg-[#D97757] text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Preview classifier prompt</button>
            <button onClick={runEmailEval} className="px-3 py-2.5 rounded-xl border text-xs font-bold min-h-[44px] cursor-pointer">Run offline check</button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer font-bold text-[#6B6860]">View dataset ({ACADEMIC_EMAIL_DATASET.length})</summary>
            <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {ACADEMIC_EMAIL_DATASET.slice(0, 8).map(s => (
                <li key={s.id} className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB]/50 text-[11px]">“{s.subject}” → {s.groundTruth.category} · spam={String(s.groundTruth.isSpam)}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {tab === 'benchmark' && (
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-4 space-y-3">
          <p className="text-xs text-[#6B6860]">Runs the full offline evaluation suite: accuracy, precision, recall, F1, latency, confusion matrix (TP/TN/FP/FN).</p>
          <button onClick={runBenchmark} className="px-4 py-2.5 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold min-h-[44px] cursor-pointer inline-flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Run evaluation suite</button>
        </div>
      )}

      {preview && (
        <div className="bg-[#1A1917] text-[#E8E6DF] rounded-2xl p-4 text-[11px] font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">{preview}</div>
      )}
      {evalLine && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
          <p className="font-bold text-emerald-800 dark:text-emerald-200">{evalLine}</p>
          <div className="flex gap-2 flex-wrap items-center">
            <VerifyEdit verified={verified} onToggle={() => setVerified(!verified)} />
            <EvidenceButton onSnap={() => saveEvidence('few-shot-lab', 'Calibration run', evalLine)} />
            <button onClick={() => {
              const blob = new Blob([evalLine], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'few-shot-result.txt';
              a.click();
              URL.revokeObjectURL(a.href);
            }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold min-h-[44px] cursor-pointer"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
        </div>
      )}
    </div>
  );
};
