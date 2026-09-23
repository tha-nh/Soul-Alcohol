import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertLevel, MonitoringSession } from '../../models';
import { AlertRepository, AnalysisResultRepository, SessionRepository } from '../../repositories';
import { AlertnessConfig } from '../alertness/config';
import { alertMessage, alertSeverityRank, computeAlertLevel } from '../alertness/computeAlertLevel';
import { AlertCooldownManager } from '../alertness/AlertCooldownManager';
import { MockAlertnessEngine } from '../alertness/MockAlertnessEngine';
import { computeTrendScore } from '../alertness/trendAnalysis';
import { DEV_SIMULATION_MODE, SIMULATED_SCORE_SEQUENCE, SIMULATION_TICK_MS } from '../../config/devSimulation';

export const STATUS_LABELS: Record<AlertLevel, string> = {
  [AlertLevel.NORMAL]: 'Ổn định',
  [AlertLevel.NOTICE]: 'Có dấu hiệu thay đổi',
  [AlertLevel.WARNING]: 'Nên nghỉ',
  [AlertLevel.STOP_RECOMMENDED]: 'Nên dừng uống',
};

interface PendingAlert {
  level: AlertLevel;
}

interface SessionFinalResult {
  initialScore: number;
  lowestScore: number;
  finalScore: number;
  maxAlertLevel: AlertLevel;
}

/**
 * Ties the Session Manager (Phase 6) to the Mock Alertness Engine
 * (Phase 7): ticks a simulated score, persists analysis_result rows,
 * raises alerts through the cooldown manager, and tracks the running
 * min/max needed to close out the session (Section 26-31).
 */
export function useMonitoringSession(sessionId: string) {
  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [alertnessScore, setAlertnessScore] = useState(100);
  const [confidenceScore] = useState(90);
  const [pendingAlert, setPendingAlert] = useState<PendingAlert | null>(null);

  const scoreHistoryRef = useRef<number[]>([]);
  const initialScoreRef = useRef<number | null>(null);
  const lowestScoreRef = useRef<number>(100);
  const maxAlertLevelRef = useRef<AlertLevel>(AlertLevel.NORMAL);
  const cooldownRef = useRef(new AlertCooldownManager());
  const engineRef = useRef(new MockAlertnessEngine());
  const simIndexRef = useRef(0);

  useEffect(() => {
    SessionRepository.getById(sessionId).then(setSession);
  }, [sessionId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const startMs = new Date(session.startTime).getTime();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || !DEV_SIMULATION_MODE) {
      return;
    }

    const tick = async () => {
      const index = Math.min(simIndexRef.current, SIMULATED_SCORE_SEQUENCE.length - 1);
      const voiceScore = SIMULATED_SCORE_SEQUENCE[index];
      const motionScore = voiceScore;
      simIndexRef.current += 1;

      const previousScore = scoreHistoryRef.current[scoreHistoryRef.current.length - 1] ?? voiceScore;
      scoreHistoryRef.current = [...scoreHistoryRef.current, voiceScore].slice(-10);
      const trendScore = computeTrendScore(scoreHistoryRef.current);

      const score = engineRef.current.computeAlertnessScore({
        voiceScore,
        motionScore,
        trendScore,
        confidenceScore,
      });
      const level = computeAlertLevel(score);

      if (initialScoreRef.current === null) {
        initialScoreRef.current = score;
      }
      lowestScoreRef.current = Math.min(lowestScoreRef.current, score);
      if (alertSeverityRank(level) > alertSeverityRank(maxAlertLevelRef.current)) {
        maxAlertLevelRef.current = level;
      }

      setAlertnessScore(score);

      await AnalysisResultRepository.insert({
        sessionId,
        timestamp: new Date().toISOString(),
        voiceScore,
        motionScore,
        trendScore,
        alertnessScore: score,
        confidenceScore,
        voiceAvailable: true,
        motionAvailable: true,
      });

      const canAlert =
        level !== AlertLevel.STOP_RECOMMENDED || confidenceScore >= AlertnessConfig.stopRecommendedMinConfidence;

      if (canAlert && cooldownRef.current.shouldAlert(level, previousScore, score)) {
        await AlertRepository.insert({
          sessionId,
          timestamp: new Date().toISOString(),
          level,
          message: alertMessage(level),
        });
        setPendingAlert({ level });
      }
    };

    tick();
    const interval = setInterval(tick, SIMULATION_TICK_MS);
    return () => clearInterval(interval);
  }, [session, sessionId, confidenceScore]);

  const clearPendingAlert = useCallback(() => setPendingAlert(null), []);

  const finalizeResult = useCallback(
    (): SessionFinalResult => ({
      initialScore: initialScoreRef.current ?? 100,
      lowestScore: lowestScoreRef.current,
      finalScore: alertnessScore,
      maxAlertLevel: maxAlertLevelRef.current,
    }),
    [alertnessScore],
  );

  const alertLevel = computeAlertLevel(alertnessScore);

  return {
    session,
    elapsedSeconds,
    alertnessScore,
    alertLevel,
    confidenceScore,
    statusLabel: STATUS_LABELS[alertLevel],
    pendingAlert,
    clearPendingAlert,
    finalizeResult,
  };
}
