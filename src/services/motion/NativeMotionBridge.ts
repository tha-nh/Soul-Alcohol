import { NativeEventEmitter, NativeModules } from 'react-native';
import { MotionCaptureResult } from './MockMotionCaptureService';

const { MotionModule } = NativeModules;

/**
 * Thin wrapper over the native Kotlin/Swift MotionModule (Phase 9/10).
 * Not wired in as the active capture source yet — DEV_SIMULATION_MODE and
 * MockMotionCaptureService remain the default until a native build has
 * been verified on a real Android/iOS device.
 */
export class NativeMotionBridge {
  isAvailable(): boolean {
    return !!MotionModule;
  }

  async captureWalk(durationMs: number): Promise<MotionCaptureResult> {
    if (!MotionModule) {
      throw new Error('MotionModule native module is not linked. Build the app after adding the native files.');
    }
    return MotionModule.captureBaseline(durationMs);
  }

  startSessionMonitoring(windowMs: number, onWindow: (result: MotionCaptureResult) => void): () => void {
    if (!MotionModule) {
      throw new Error('MotionModule native module is not linked.');
    }
    const emitter = new NativeEventEmitter(MotionModule);
    const subscription = emitter.addListener('onMotionWindow', ((result: MotionCaptureResult) =>
      onWindow(result)) as (...args: readonly object[]) => unknown);
    MotionModule.startSessionMonitoring(windowMs);
    return () => {
      subscription.remove();
      MotionModule.stopSessionMonitoring();
    };
  }
}
