import { NativeEventEmitter, NativeModules } from 'react-native';

const { MicrophoneModule } = NativeModules;

/**
 * Thin wrapper over the native Kotlin/Swift MicrophoneModule (Phase 11).
 * Delivers short normalized PCM frames; VAD, speaker verification, and
 * feature extraction (Section 49 engines) run on them in JS/ONNX
 * (Phase 12/13). Not wired in as the active source yet — see
 * NativeMotionBridge for why.
 */
export class NativeMicrophoneBridge {
  private subscription: { remove: () => void } | null = null;

  isAvailable(): boolean {
    return !!MicrophoneModule;
  }

  async start(onBuffer: (samples: number[]) => void): Promise<void> {
    if (!MicrophoneModule) {
      throw new Error('MicrophoneModule native module is not linked. Build the app after adding the native files.');
    }
    const emitter = new NativeEventEmitter(MicrophoneModule);
    this.subscription = emitter.addListener(
      'onAudioBuffer',
      ((samples: number[]) => onBuffer(samples)) as (...args: readonly object[]) => unknown,
    );
    await MicrophoneModule.startCapture();
  }

  async stop(): Promise<void> {
    this.subscription?.remove();
    this.subscription = null;
    if (MicrophoneModule) {
      await MicrophoneModule.stopCapture();
    }
  }
}
