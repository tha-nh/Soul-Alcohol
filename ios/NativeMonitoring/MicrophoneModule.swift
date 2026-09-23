import Foundation
import AVFoundation

/// Section 14/16/18 — captures short PCM frames via AVAudioEngine and hands
/// each one to JS as a normalized array; nothing is written to disk. Mirrors
/// android/.../MicrophoneModule.kt's contract (same event name/shape) so the
/// JS side doesn't need to branch by platform.
///
/// NOT BUILD-VERIFIED: written without Xcode/macOS access. Needs to be
/// added to the Xcode target and compiled on a Mac before use.
@objc(MicrophoneModule)
class MicrophoneModule: RCTEventEmitter {

  private let audioEngine = AVAudioEngine()
  private var isCapturing = false

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String] {
    return ["onAudioBuffer", "onMicrophoneError"]
  }

  @objc(startCapture:rejecter:)
  func startCapture(resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    if isCapturing {
      resolve(true)
      return
    }

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.mixWithOthers, .allowBluetooth])
      try session.setActive(true)
    } catch {
      reject("AUDIO_SESSION_ERROR", error.localizedDescription, error)
      return
    }

    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)

    inputNode.installTap(onBus: 0, bufferSize: 1_600, format: format) { [weak self] buffer, _ in
      self?.handleBuffer(buffer)
    }

    do {
      audioEngine.prepare()
      try audioEngine.start()
      isCapturing = true
      resolve(true)
    } catch {
      reject("MIC_ENGINE_START_FAILED", error.localizedDescription, error)
    }
  }

  @objc(stopCapture:rejecter:)
  func stopCapture(resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    isCapturing = false
    audioEngine.inputNode.removeTap(onBus: 0)
    audioEngine.stop()
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    resolve(true)
  }

  // Section 18: the buffer is normalized and forwarded; it is never
  // retained or written anywhere.
  private func handleBuffer(_ buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData else { return }
    let frameLength = Int(buffer.frameLength)
    var samples = [Double](repeating: 0, count: frameLength)
    let channel = channelData[0]
    for i in 0..<frameLength {
      samples[i] = Double(channel[i])
    }
    sendEvent(withName: "onAudioBuffer", body: samples)
  }
}
