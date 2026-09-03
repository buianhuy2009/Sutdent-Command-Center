import { describe, it, expect } from 'vitest';
import { requiredFinalScore, computeCourseGrade, cumulativeGPA, whatIfDropLowest, autoScheduleFocusBlocks, buildExamPlan } from '../services/academic';

describe('grade forecaster v2', () => {
  it('84% → 90% with 30% final needs 104% (impossible → High risk)', () => {
    expect(requiredFinalScore(84, 90, 30)).toBeCloseTo(104, 0);
  });
  it('computes course grade + risk', () => {
    const r = computeCourseGrade({ courseName: 'Calc', currentPercent: 84, targetPercent: 90, finalWeightPercent: 30 });
    expect(r.risk).toBe('High');
    expect(r.gpa).toBeGreaterThan(2.5);
  });
  it('cumulative GPA planner', () => {
    expect(cumulativeGPA([{ percent: 95, credits: 4 }, { percent: 85, credits: 4 }])).toBeCloseTo(3.5, 1);
  });
  it('drop-lowest-quiz simulator improves average', () => {
    const { before, after } = whatIfDropLowest([70, 82, 91, 88], 1);
    expect(after).toBeGreaterThan(before);
  });
});

describe('auto-scheduler', () => {
  it('proposes focus blocks in free gaps', () => {
    const proposals = autoScheduleFocusBlocks(
      [{ id: 'a1', assignmentName: 'Essay', dueDate: '2026-09-10', estimatedMinutes: 60, priority: 'High' }],
      [{ start: { dateTime: '2026-09-03T09:00' }, end: { dateTime: '2026-09-03T10:00' } }],
      { dayISO: '2026-09-03' },
    );
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals[0].assignmentId).toBe('a1');
  });
  it('returns empty when nothing pending', () => {
    expect(autoScheduleFocusBlocks([], [], { dayISO: '2026-09-03' })).toEqual([]);
  });
});

describe('exam mode', () => {
  it('builds countdown + reverse plan', () => {
    const plan = buildExamPlan('Midterm', 'Calc', '2026-09-17', ['limits']);
    expect(plan.countdownDays).toBeGreaterThanOrEqual(0);
    expect(plan.reversePlan.nightBefore.length).toBeGreaterThan(0);
  });
});
