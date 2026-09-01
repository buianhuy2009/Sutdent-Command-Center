import { describe, it, expect } from 'vitest';
import { repairJsonString, calculateGradePrediction } from './gemini';
import { crossReferenceCanvasWithSheet } from './canvas';

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
