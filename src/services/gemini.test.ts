import { describe, it, expect, beforeEach } from 'vitest';
import {
  repairJsonString,
  calculateGradePrediction,
  getClientGeminiApiKey,
  setClientGeminiApiKey,
  getClientGroqApiKey,
  setClientGroqApiKey,
} from './gemini';
import { crossReferenceCanvasWithSheet } from './canvas';

describe('Secure API Key Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('encrypts Gemini API key when saving to localStorage', () => {
    const rawKey = 'AIzaSy_test_secret_key_12345';
    setClientGeminiApiKey(rawKey);

    const storedInLs = localStorage.getItem('scc_gemini_api_key');
    expect(storedInLs).toBeDefined();
    expect(storedInLs).not.toBe(rawKey);
    expect(storedInLs).toContain('scc_enc_v1:');

    const retrieved = getClientGeminiApiKey();
    expect(retrieved).toBe(rawKey);
  });

  it('sessionStorage takes precedence and keeps key in session only when opted', () => {
    const sessionKey = 'AIzaSy_session_only_key_99999';
    setClientGeminiApiKey(sessionKey, { sessionOnly: true });

    expect(sessionStorage.getItem('scc_gemini_api_key_session')).toBe(sessionKey);
    expect(localStorage.getItem('scc_gemini_api_key')).toBeNull();

    expect(getClientGeminiApiKey()).toBe(sessionKey);
  });

  it('automatically migrates legacy plaintext keys in localStorage to encrypted format', () => {
    const legacyKey = 'AIzaSy_legacy_plaintext_key_777';
    localStorage.setItem('scc_gemini_api_key', legacyKey);

    const retrieved = getClientGeminiApiKey();
    expect(retrieved).toBe(legacyKey);

    const updatedInLs = localStorage.getItem('scc_gemini_api_key');
    expect(updatedInLs).not.toBe(legacyKey);
    expect(updatedInLs).toContain('scc_enc_v1:');
  });

  it('encrypts Groq API key in localStorage', () => {
    const groqKey = 'gsk_test_groq_secret_key_555';
    setClientGroqApiKey(groqKey);

    const storedInLs = localStorage.getItem('scc_groq_api_key');
    expect(storedInLs).not.toBe(groqKey);
    expect(storedInLs).toContain('scc_enc_v1:');

    expect(getClientGroqApiKey()).toBe(groqKey);
  });
});

describe('repairJsonString', () => {
  it('parses clean JSON', () => {
    expect(repairJsonString('{"a":1}')).toEqual({ a: 1 });
  });
  it('strips markdown fences', () => {
    expect(repairJsonString('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('slices braces', () => {
    expect(repairJsonString('extra {"a":1} trailing')).toEqual({ a: 1 });
  });
});

describe('crossReferenceCanvasWithSheet', () => {
  it('marks synced when name matches sheet', () => {
    const canvas = [{ id: '1', name: 'Essay', courseName: 'English', dueAt: '2026-09-10', isSynced: false } as any];
    const sheet = [{ id: 's1', assignmentName: 'Essay', subject: 'English', dueDate: '2026-09-10', priority: 'Med', status: 'Not Started' } as any];
    const res = crossReferenceCanvasWithSheet(canvas, sheet);
    expect(res[0].isSynced).toBe(true);
  });
});

describe('calculateGradePrediction', () => {
  it('calculates required final', () => {
    const r = calculateGradePrediction({ currentGrade: 84, desiredGrade: 90, finalExamWeight: 30 });
    expect(r.requiredFinalScore).toBeCloseTo(104, 0); // Actually 84->90 with 30% needs 104% >100 High Risk
    expect(r.isPossible).toBe(false);
  });
  it('achievable', () => {
    const r = calculateGradePrediction({ currentGrade: 80, desiredGrade: 85, finalExamWeight: 30 });
    expect(r.status).toBeDefined();
  });
});

import { runOfflineAiBenchmark, buildFewShotNlpTaskPrompt, buildFewShotEmailClassifierPrompt } from './aiTrainingPipeline';

describe('AI Training & Evaluation Benchmark Pipeline', () => {
  it('builds few-shot prompts correctly', () => {
    const prompt = buildFewShotNlpTaskPrompt('Làm bài tập Lý ngày mai');
    expect(prompt).toContain('FEW-SHOT EXAMPLES');
    expect(prompt).toContain('Làm bài tập Lý ngày mai');
  });

  it('builds email classifier prompt correctly', () => {
    const prompt = buildFewShotEmailClassifierPrompt('Học phí', 'Thông báo nộp học phí');
    expect(prompt).toContain('VÍ DỤ HUẤN LUYỆN');
    expect(prompt).toContain('Học phí');
  });

  it('runs offline benchmark and achieves expected score', () => {
    const report = runOfflineAiBenchmark();
    expect(report.overallScore).toBeGreaterThanOrEqual(90);
    expect(report.tasks.emailClassification.accuracy).toBeGreaterThanOrEqual(90);
    expect(report.tasks.vietnameseNlpExtraction.accuracy).toBeGreaterThanOrEqual(90);
  });
});

