import { AlertLevel } from '../../../models';
import { alertMessage, alertSeverityRank, alertShortLabel } from '../computeAlertLevel';
import { computeTrendScore, movingAverage } from '../trendAnalysis';
import { AlertCooldownManager } from '../AlertCooldownManager';
import { AlertnessConfig } from '../config';

describe('alertSeverityRank', () => {
  it('orders levels from least to most severe', () => {
    expect(alertSeverityRank(AlertLevel.NORMAL)).toBeLessThan(alertSeverityRank(AlertLevel.NOTICE));
    expect(alertSeverityRank(AlertLevel.NOTICE)).toBeLessThan(alertSeverityRank(AlertLevel.WARNING));
    expect(alertSeverityRank(AlertLevel.WARNING)).toBeLessThan(alertSeverityRank(AlertLevel.STOP_RECOMMENDED));
  });
});

describe('alert copy', () => {
  it('has no message for NORMAL, which never raises an alert', () => {
    expect(alertMessage(AlertLevel.NORMAL)).toBe('');
  });

  it.each([AlertLevel.NOTICE, AlertLevel.WARNING, AlertLevel.STOP_RECOMMENDED])(
    'has a message and a short label for %s',
    level => {
      expect(alertMessage(level).length).toBeGreaterThan(0);
      expect(alertShortLabel(level).length).toBeGreaterThan(0);
    },
  );

  it('never tells the user they are drunk or states an alcohol level (Section 58)', () => {
    for (const level of Object.values(AlertLevel)) {
      expect(alertMessage(level).toLowerCase()).not.toMatch(/bạn đang say|nồng độ cồn/);
    }
  });
});

describe('trend analysis', () => {
  it('movingAverage only looks at the last `window` scores', () => {
    expect(movingAverage([100, 10, 20, 30], 3)).toBe(20);
  });

  it('is fully positive with fewer than 2 data points', () => {
    expect(computeTrendScore([])).toBe(100);
    expect(computeTrendScore([50])).toBe(100);
  });

  it('does not penalize a rising or flat score', () => {
    expect(computeTrendScore([50, 60, 70])).toBe(100);
    expect(computeTrendScore([80, 80, 80])).toBe(100);
  });

  it('never leaves the 0-100 range even on a collapse', () => {
    const score = computeTrendScore([100, 60, 20, 0, 0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('AlertCooldownManager timing', () => {
  afterEach(() => jest.restoreAllMocks());

  it('allows the same level again once the cooldown has elapsed', () => {
    const now = jest.spyOn(Date, 'now');
    const manager = new AlertCooldownManager();

    now.mockReturnValue(1_000_000);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 90, 75)).toBe(true);

    now.mockReturnValue(1_000_000 + AlertnessConfig.alertCooldownMs - 1);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 75, 74)).toBe(false);

    now.mockReturnValue(1_000_000 + AlertnessConfig.alertCooldownMs);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 74, 73)).toBe(true);
  });

  it('never alerts while NORMAL, and resets so a later NOTICE alerts as an increase', () => {
    const manager = new AlertCooldownManager();
    expect(manager.shouldAlert(AlertLevel.NORMAL, 95, 95)).toBe(false);
    expect(manager.shouldAlert(AlertLevel.NOTICE, 95, 78)).toBe(true);
  });
});
