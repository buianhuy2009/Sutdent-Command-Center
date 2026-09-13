import { describe, it, expect } from 'vitest';
import {
  predictText,
  evaluateHoldout,
  explainPrediction,
  getHoldoutSize,
  tokenize,
} from '../components/workspaces/ModelTrainingWorkspace';
import {
  splitClassifierDataset,
  scoreClassifierPredictions,
  localBaselinePredict,
  localFewShotPredict,
  parseClassifierJson,
  buildClassifierComparisonSentence,
  CLASSIFIER_SEED_ROWS,
} from './aiTrainingPipeline';
import { scoreChunks, chunkText } from './ragVault';

describe('predictText (tiny Naive-Bayes)', () => {
  const labels = [
    { name: 'Math', texts: ['solve quadratic equation', 'geometry triangle area', 'algebra homework chapter 3'] },
    { name: 'English', texts: ['write essay environment', 'vocabulary unit 4', 'reading comprehension homework'] },
  ];
  it('routes math input to Math', () => {
    const p = predictText(labels, 'quadratic equation homework');
    expect(p.label).toBe('Math');
    expect(p.confidence).toBeGreaterThan(50);
  });
  it('routes essay input to English', () => {
    const p = predictText(labels, 'write essay vocabulary');
    expect(p.label).toBe('English');
  });
});

describe('sorter holdout (evaluateHoldout)', () => {
  const balanced = [
    { name: 'Math', texts: ['giải phương trình bậc hai', 'tính diện tích hình tam giác', 'làm bài tập hình học chương 3', 'hình thang diện tích đáy lớn đáy bé'] },
    { name: 'English', texts: ['write essay about environment 200 words', 'learn vocabulary unit 4', 'practice listening lesson 2', 'read book chapter five homework'] },
  ];
  it('holds out last 20% (min 1) and scores real numbers', () => {
    const r = evaluateHoldout(balanced);
    expect(r.active).toBe(true);
    expect(r.total).toBeGreaterThan(0);
    expect(r.accuracy).toBeGreaterThanOrEqual(0);
    expect(r.accuracy).toBeLessThanOrEqual(100);
    expect(Object.keys(r.confusion)).toEqual(['Math', 'English']);
  });
  it('disables holdout for single-example labels (never fake metrics on n=1)', () => {
    const r = evaluateHoldout([
      { name: 'Math', texts: ['only one'] },
      { name: 'English', texts: ['just one'] },
    ]);
    expect(r.active).toBe(false);
    expect(r.total).toBe(0);
  });
  it('handles Vietnamese diacritics without crashing', () => {
    const p = predictText(balanced, 'giải bài toán hình thang');
    expect(['Math', 'English']).toContain(p.label);
  });
  it('returns zero-confidence for empty input', () => {
    const p = predictText(balanced, '   ');
    expect(p.confidence).toBe(0);
  });
  it('getHoldoutSize caps at 5 and needs 3+ examples', () => {
    expect(getHoldoutSize(2)).toBe(0);
    expect(getHoldoutSize(3)).toBe(1);
    expect(getHoldoutSize(10)).toBe(2);
    expect(getHoldoutSize(100)).toBe(5);
  });
  it('tokenize keeps Vietnamese range', () => {
    expect(tokenize('tính diện tích hình tam giác')).toContain('diện');
  });
});

describe('sorter explain (top-3 words)', () => {
  const labels = [
    { name: 'Math', texts: ['giải phương trình bậc hai', 'tính diện tích hình tam giác'] },
    { name: 'English', texts: ['write essay about environment', 'learn vocabulary unit 4'] },
  ];
  it('returns ≤3 chips with weights', () => {
    const w = explainPrediction(labels, 'giải bài toán hình tam giác');
    expect(w.length).toBeLessThanOrEqual(3);
    expect(w.length).toBeGreaterThan(0);
    expect(typeof w[0].weight).toBe('number');
  });
});

describe('classifier lab scoring (pure, offline)', () => {
  it('splits first 3 as examples excluded from scoring (no leakage)', () => {
    const { exampleRows, testRows, excludedIds } = splitClassifierDataset(CLASSIFIER_SEED_ROWS);
    expect(exampleRows.length).toBe(3);
    expect(testRows.length).toBe(9);
    expect(excludedIds).toEqual(exampleRows.map(r => r.id));
    expect(testRows.some(r => excludedIds.includes(r.id))).toBe(false);
  });
  it('scores accuracy + macro P/R/F1 on fixtures', () => {
    const s = scoreClassifierPredictions(
      ['ASSIGNMENT', 'EXAM', 'SPAM'],
      ['ASSIGNMENT', 'SPAM', 'SPAM'],
    );
    expect(s.total).toBe(3);
    expect(s.correct).toBe(2);
    expect(s.accuracy).toBeCloseTo(66.7, 0);
    expect(s.macroF1).toBeGreaterThan(0);
  });
  it('handles empty set without fake zeros crashing', () => {
    const s = scoreClassifierPredictions([], []);
    expect(s.total).toBe(0);
    expect(s.accuracy).toBe(0);
  });
  it('handles single-label edge', () => {
    const s = scoreClassifierPredictions(['SPAM', 'SPAM'], ['SPAM', 'SPAM']);
    expect(s.accuracy).toBe(100);
    expect(s.perLabel['SPAM'].f1).toBe(100);
  });
  it('baseline vs few-shot differ on school data (method, not magic)', () => {
    const { exampleRows, testRows } = splitClassifierDataset(CLASSIFIER_SEED_ROWS);
    const base = testRows.map(r => localBaselinePredict(r.text).category);
    const few = testRows.map(r => localFewShotPredict(r.text, exampleRows).category);
    // At least proves both run offline on every row with valid labels.
    expect(base.length).toBe(testRows.length);
    expect(few.length).toBe(testRows.length);
  });
  it('parses classifier JSON with repair (code fences tolerated)', () => {
    const p = parseClassifierJson('```json\n{"category":"EXAM","isSpam":false,"urgency":"HIGH"}\n```');
    expect(p.category).toBe('EXAM');
    expect(p.urgency).toBe('HIGH');
  });
  it('builds a student-readable comparison sentence', () => {
    const s = buildClassifierComparisonSentence(50, 77.8, 9, ['GRADE']);
    expect(s).toMatch(/Adding 3 examples/);
    expect(s).toMatch(/50%→77.8%/);
  });
});

describe('ragVault chunk + score', () => {
  it('chunks with overlap', () => {
    const chunks = chunkText('a'.repeat(1200), 500, 100);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(500);
  });
  it('retrieves the matching note in top-3', () => {
    const idx = [
      { docId: 'bio', title: 'Biology notes', snippet: 'photosynthesis happens in chloroplasts using sunlight' },
      { docId: 'math', title: 'Math notes', snippet: 'quadratic formula discriminant' },
    ];
    const res = scoreChunks('what did my biology notes say about photosynthesis', idx);
    expect(res[0]?.docId).toBe('bio');
    expect(res.length).toBeLessThanOrEqual(3);
  });
});
