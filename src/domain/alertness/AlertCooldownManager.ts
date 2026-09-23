import { AlertLevel } from '../../models';
import { AlertnessConfig } from './config';
import { alertSeverityRank } from './computeAlertLevel';

/**
 * Section 31: don't repeat the same alert level within the cooldown window
 * unless severity increased or the score dropped sharply.
 */
export class AlertCooldownManager {
  private lastAlertAt: number | null = null;
  private lastLevel: AlertLevel = AlertLevel.NORMAL;

  shouldAlert(level: AlertLevel, previousScore: number, currentScore: number): boolean {
    if (level === AlertLevel.NORMAL) {
      this.lastLevel = level;
      return false;
    }

    const now = Date.now();
    const levelIncreased = alertSeverityRank(level) > alertSeverityRank(this.lastLevel);
    const suddenDrop = previousScore - currentScore >= AlertnessConfig.suddenDropThreshold;
    const cooldownElapsed =
      this.lastAlertAt === null || now - this.lastAlertAt >= AlertnessConfig.alertCooldownMs;

    if (levelIncreased || suddenDrop || cooldownElapsed) {
      this.lastAlertAt = now;
      this.lastLevel = level;
      return true;
    }
    return false;
  }
}
