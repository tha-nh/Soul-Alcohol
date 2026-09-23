import Foundation
import CoreMotion

/// Section 21/22/23 — mirrors android/.../MotionModule.kt's feature math so
/// both platforms report the same fields to the JS layer.
///
/// NOT BUILD-VERIFIED: written without Xcode/macOS access. Needs to be
/// added to the Xcode target and compiled on a Mac before use — see the
/// bridging-header note in MotionModule.m.
@objc(MotionModule)
class MotionModule: RCTEventEmitter {

  private let motionManager = CMMotionManager()
  private let queue = OperationQueue()

  private var accelBuffer: [(x: Double, y: Double, z: Double)] = []
  private var gyroBuffer: [(x: Double, y: Double, z: Double)] = []

  private var windowMs: Double = 20_000
  private var windowStartedAt: Date = Date()
  private var isSessionMode = false

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String] {
    return ["onMotionWindow", "onMotionError"]
  }

  @objc(captureBaseline:resolver:rejecter:)
  func captureBaseline(durationMs: NSNumber,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard motionManager.isAccelerometerAvailable, motionManager.isGyroAvailable else {
      reject("SENSOR_UNAVAILABLE", "Accelerometer or gyroscope not available", nil)
      return
    }

    isSessionMode = false
    clearBuffers()
    startUpdates()

    let seconds = durationMs.doubleValue / 1000
    DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak self] in
      guard let self = self else { return }
      self.stopUpdates()
      resolve(self.featuresDictionary(self.computeFeatures()))
      self.clearBuffers()
    }
  }

  @objc(startSessionMonitoring:)
  func startSessionMonitoring(windowDurationMs: NSNumber) {
    guard motionManager.isAccelerometerAvailable, motionManager.isGyroAvailable else {
      sendEvent(withName: "onMotionError", body: ["code": "SENSOR_UNAVAILABLE"])
      return
    }
    isSessionMode = true
    windowMs = windowDurationMs.doubleValue
    windowStartedAt = Date()
    clearBuffers()
    startUpdates()
  }

  @objc func stopSessionMonitoring() {
    isSessionMode = false
    stopUpdates()
    clearBuffers()
  }

  private func startUpdates() {
    motionManager.accelerometerUpdateInterval = 1.0 / 50.0
    motionManager.gyroUpdateInterval = 1.0 / 50.0

    motionManager.startAccelerometerUpdates(to: queue) { [weak self] data, _ in
      guard let self = self, let data = data else { return }
      self.accelBuffer.append((data.acceleration.x, data.acceleration.y, data.acceleration.z))
      self.checkWindow()
    }
    motionManager.startGyroUpdates(to: queue) { [weak self] data, _ in
      guard let self = self, let data = data else { return }
      self.gyroBuffer.append((data.rotationRate.x, data.rotationRate.y, data.rotationRate.z))
    }
  }

  private func stopUpdates() {
    motionManager.stopAccelerometerUpdates()
    motionManager.stopGyroUpdates()
  }

  private func clearBuffers() {
    accelBuffer.removeAll()
    gyroBuffer.removeAll()
  }

  private func checkWindow() {
    guard isSessionMode else { return }
    if Date().timeIntervalSince(windowStartedAt) * 1000 >= windowMs {
      let features = computeFeatures()
      sendEvent(withName: "onMotionWindow", body: featuresDictionary(features))
      clearBuffers()
      windowStartedAt = Date()
    }
  }

  private struct MotionFeatures {
    let walkingStability: Double
    let stepRegularity: Double
    let stepIntervalVariability: Double
    let lateralSway: Double
    let motionVariance: Double
    let rotationVariance: Double
    let suddenMovement: Double
    let qualityScore: Int
  }

  private func computeFeatures() -> MotionFeatures {
    guard accelBuffer.count >= 10 else {
      return MotionFeatures(walkingStability: 0, stepRegularity: 0, stepIntervalVariability: 0,
                             lateralSway: 0, motionVariance: 0, rotationVariance: 0,
                             suddenMovement: 0, qualityScore: 20)
    }

    let gravity = 9.81
    let magnitudes = accelBuffer.map { sqrt($0.x * $0.x + $0.y * $0.y + $0.z * $0.z) * gravity }
    let linear = magnitudes.map { abs($0 - gravity) }

    let meanMag = linear.reduce(0, +) / Double(linear.count)
    let varianceMag = linear.map { ($0 - meanMag) * ($0 - meanMag) }.reduce(0, +) / Double(linear.count)
    let motionVariance = min(max(varianceMag, 0), 1)
    let walkingStability = min(max(1 - motionVariance, 0), 1)

    var stepIntervals: [Int] = []
    var lastPeakIndex = -1
    if linear.count > 2 {
      for i in 1..<(linear.count - 1) {
        let isPeak = linear[i] > meanMag && linear[i] >= linear[i - 1] && linear[i] >= linear[i + 1]
        if isPeak {
          if lastPeakIndex >= 0 { stepIntervals.append(i - lastPeakIndex) }
          lastPeakIndex = i
        }
      }
    }

    let stepRegularity: Double
    let stepIntervalVariability: Double
    if stepIntervals.count >= 2 {
      let meanInterval = Double(stepIntervals.reduce(0, +)) / Double(stepIntervals.count)
      let varInterval = stepIntervals.map { (Double($0) - meanInterval) * (Double($0) - meanInterval) }
        .reduce(0, +) / Double(stepIntervals.count)
      let stdDev = sqrt(varInterval)
      stepIntervalVariability = min(max(stdDev / (meanInterval + 1e-6), 0), 1)
      stepRegularity = min(max(1 - stepIntervalVariability, 0), 1)
    } else {
      stepRegularity = 0.5
      stepIntervalVariability = 0.5
    }

    let lateral = accelBuffer.map { sqrt($0.x * $0.x + $0.y * $0.y) * gravity }
    let lateralMean = lateral.reduce(0, +) / Double(lateral.count)
    let lateralSway = min(max(lateral.map { ($0 - lateralMean) * ($0 - lateralMean) }.reduce(0, +) / Double(lateral.count), 0), 1)

    let rotationMagnitudes = gyroBuffer.map { sqrt($0.x * $0.x + $0.y * $0.y + $0.z * $0.z) }
    let rotationVariance: Double
    if !rotationMagnitudes.isEmpty {
      let rotMean = rotationMagnitudes.reduce(0, +) / Double(rotationMagnitudes.count)
      rotationVariance = min(max(rotationMagnitudes.map { ($0 - rotMean) * ($0 - rotMean) }.reduce(0, +) / Double(rotationMagnitudes.count), 0), 1)
    } else {
      rotationVariance = 0
    }

    var suddenMovement = 0.0
    for i in 1..<linear.count {
      suddenMovement = max(suddenMovement, abs(linear[i] - linear[i - 1]))
    }

    let qualityScore: Int
    switch accelBuffer.count {
    case 500...: qualityScore = 95
    case 200..<500: qualityScore = 85
    case 50..<200: qualityScore = 70
    default: qualityScore = 50
    }

    return MotionFeatures(
      walkingStability: walkingStability, stepRegularity: stepRegularity,
      stepIntervalVariability: stepIntervalVariability, lateralSway: lateralSway,
      motionVariance: motionVariance, rotationVariance: rotationVariance,
      suddenMovement: min(max(suddenMovement, 0), 1), qualityScore: qualityScore,
    )
  }

  private func featuresDictionary(_ f: MotionFeatures) -> [String: Any] {
    return [
      "walkingStability": f.walkingStability,
      "stepRegularity": f.stepRegularity,
      "stepIntervalVariability": f.stepIntervalVariability,
      "lateralSway": f.lateralSway,
      "motionVariance": f.motionVariance,
      "rotationVariance": f.rotationVariance,
      "suddenMovement": f.suddenMovement,
      "qualityScore": f.qualityScore,
    ]
  }
}
