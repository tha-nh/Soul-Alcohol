import { useCallback, useRef, useState } from 'react';
import { MockMotionCaptureService } from '../../services/motion/MockMotionCaptureService';
import { MotionBaselineRepository } from '../../repositories';
import { BaselineConfig } from './config';

export type MotionBaselinePhase = 'idle' | 'recording' | 'completed';

export function useMotionBaseline() {
  const service = useRef(new MockMotionCaptureService()).current;
  const [phase, setPhase] = useState<MotionBaselinePhase>('idle');
  const [progress, setProgress] = useState(0);

  const start = useCallback(async () => {
    setPhase('recording');
    setProgress(0);
    const result = await service.captureWalk(BaselineConfig.motionWalkDurationMs, setProgress);
    await MotionBaselineRepository.save(result);
    setPhase('completed');
  }, [service]);

  return { phase, progress, start };
}
