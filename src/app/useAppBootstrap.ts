import { useEffect, useState } from 'react';
import { MotionBaselineRepository, VoiceBaselineRepository } from '../repositories';

export type InitialRoute = 'Onboarding' | 'Home';

interface BootstrapState {
  loading: boolean;
  initialRoute: InitialRoute;
}

/**
 * Section 4: onboarding only runs on a user's very first launch. Once both
 * baselines exist, later launches should land directly on Home.
 */
export function useAppBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ loading: true, initialRoute: 'Onboarding' });

  useEffect(() => {
    (async () => {
      const [voice, motion] = await Promise.all([
        VoiceBaselineRepository.getLatest(),
        MotionBaselineRepository.getLatest(),
      ]);
      const baselinesReady = !!voice && !!motion;
      setState({ loading: false, initialRoute: baselinesReady ? 'Home' : 'Onboarding' });
    })();
  }, []);

  return state;
}
