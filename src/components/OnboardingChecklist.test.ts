import { describe, it, expect } from 'vitest';
import { getOnboardingProgress, isDismissedToday } from '../components/OnboardingChecklist';

describe('getOnboardingProgress', () => {
  it('counts 0 when nothing done', () => {
    expect(getOnboardingProgress({ canvas: false, google: false, task: false, pomodoro: false })).toBe(0);
  });
  it('counts partial progress', () => {
    expect(getOnboardingProgress({ canvas: true, google: true, task: false, pomodoro: false })).toBe(2);
  });
  it('counts 4 when complete (card hides)', () => {
    expect(getOnboardingProgress({ canvas: true, google: true, task: true, pomodoro: true })).toBe(4);
  });
});

describe('isDismissedToday', () => {
  it('returns true when dismissed date equals today', () => {
    expect(isDismissedToday('2026-09-06', '2026-09-06')).toBe(true);
  });
  it('returns false for another day or null', () => {
    expect(isDismissedToday('2026-09-06', '2026-09-05')).toBe(false);
    expect(isDismissedToday('2026-09-06', null)).toBe(false);
  });
});
