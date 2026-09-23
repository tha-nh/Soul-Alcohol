import { AlertLevel } from '../../../models';
import { computeAlertLevel } from '../computeAlertLevel';
import { computeTrendScore } from '../trendAnalysis';
import { AlertCooldownManager } from '../AlertCooldownManager';
import { MockAlertnessEngine } from '../MockAlertnessEngine';

describe('computeAlertLevel', () => {
  it.each([
    [100, AlertLevel.NORMAL],
    [80, AlertLevel.NORMAL],
    [79, AlertLevel.NOTICE],
    [65, AlertLevel.NOTICE],
    [64, AlertLevel.WARNING],
    [45, AlertLevel.WARNING],
    [44, AlertLevel.STOP_RECOMMENDED],
    [0, AlertLevel.STOP_RECOMMENDED],
  ])('maps score %i to %s', (score, expected) => {
    expect(computeAlertLevel(score)).toBe(expected);
  });
});

describe('computeTrendScore', () => {
  it('stays high for a mild decline', () => {
    expect(computeTrendScore([90, 88, 87])).toBeGreaterThan(80);
  });

  it('drops for a fast, sustained decline', () => {
    expect(computeTrendScore([90, 77, 63, 48])).toBeLessThan(50);
  });
});

describe('MockAlertnessEngine', () => {
  it('applies the Section 27 MVP weights (40/40/20)', () => {
    const engine = new MockAlertnessEngine();
    const score = engine.computeAlertnessScore({
      voiceScore: 100,
      motionScore: 50,
      trendScore: 0,
      confidenceScore: 100,
    });
    expect(score).toBe(Math.round(100 * 0.4 + 50 * 0.4 + 0 * 0.2));
  });
});

describe('AlertCooldownManager', () => {
  it('suppresses a repeated same-level alert inside the cooldown window', () => {
    const manager = new AlertCooldownManager();
    expect(manager.shouldAlert(AlertLevel.NOTICE, 90, 70)).toBe(true);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 70, 69)).toBe(false);
  });

  it('always alerts when severity increases', () => {
    const manager = new AlertCooldownManager();
    expect(manager.shouldAlert(AlertLevel.NOTICE, 90, 70)).toBe(true);
    expect(manager.shouldAlert(AlertLevel.WARNING, 70, 60)).toBe(true);
  });

  it('alerts on a sudden large drop even inside the cooldown window', () => {
    const manager = new AlertCooldownManager();
    expect(manager.shouldAlert(AlertLevel.NOTICE, 90, 70)).toBe(true);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 70, 40)).toBe(true);
  });
});
