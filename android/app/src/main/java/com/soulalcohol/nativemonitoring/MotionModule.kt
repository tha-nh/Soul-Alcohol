package com.soulalcohol.nativemonitoring

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Section 21/22: samples accelerometer + gyroscope into an in-memory
 * rolling buffer, extracts features (Section 23), then discards the raw
 * samples. Nothing here is ever persisted to SQLite (Section 39).
 *
 * NOT BUILD-VERIFIED: this Windows dev environment has no Android SDK, so
 * this file has not been compiled or run. Validate with a real
 * `./gradlew assembleDebug` / device run before shipping.
 */
class MotionModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), SensorEventListener {

  override fun getName() = "MotionModule"

  private val sensorManager: SensorManager by lazy {
    reactContext.getSystemService(android.content.Context.SENSOR_SERVICE) as SensorManager
  }
  private val accelerometer get() = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
  private val gyroscope get() = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

  private val accelBuffer = mutableListOf<FloatArray>()
  private val gyroBuffer = mutableListOf<FloatArray>()

  private var windowMs: Long = 20_000
  private var windowStartedAt: Long = 0
  private var isSessionMode = false
  private var baselinePromise: Promise? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  // --- Motion Baseline (Section 10): one-shot capture, resolves a Promise ---
  @ReactMethod
  fun captureBaseline(durationMs: Double, promise: Promise) {
    if (accelerometer == null || gyroscope == null) {
      promise.reject("SENSOR_UNAVAILABLE", "Accelerometer or gyroscope not available")
      return
    }
    isSessionMode = false
    baselinePromise = promise
    clearBuffers()
    registerListeners()

    // Handler on the main looper doesn't depend on currentActivity/decorView
    // being alive, so this still fires reliably if the app is backgrounded.
    mainHandler.postDelayed({
      unregisterListeners()
      val features = computeFeatures()
      baselinePromise?.resolve(featuresToMap(features))
      baselinePromise = null
      clearBuffers()
    }, durationMs.toLong())
  }

  // --- Continuous monitoring (Section 21/22): windowed feature events ---
  @ReactMethod
  fun startSessionMonitoring(windowDurationMs: Double) {
    if (accelerometer == null || gyroscope == null) {
      emitError("SENSOR_UNAVAILABLE")
      return
    }
    isSessionMode = true
    windowMs = windowDurationMs.toLong()
    windowStartedAt = System.currentTimeMillis()
    clearBuffers()
    registerListeners()
  }

  @ReactMethod
  fun stopSessionMonitoring() {
    isSessionMode = false
    unregisterListeners()
    clearBuffers()
  }

  @ReactMethod
  fun addListener(eventName: String) { /* required by RN event emitter contract */ }

  @ReactMethod
  fun removeListeners(count: Int) { /* required by RN event emitter contract */ }

  private fun registerListeners() {
    sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
    sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME)
  }

  private fun unregisterListeners() {
    sensorManager.unregisterListener(this)
  }

  private fun clearBuffers() {
    accelBuffer.clear()
    gyroBuffer.clear()
  }

  override fun onSensorChanged(event: SensorEvent) {
    when (event.sensor.type) {
      Sensor.TYPE_ACCELEROMETER -> accelBuffer.add(event.values.copyOf())
      Sensor.TYPE_GYROSCOPE -> gyroBuffer.add(event.values.copyOf())
    }

    if (isSessionMode && System.currentTimeMillis() - windowStartedAt >= windowMs) {
      val features = computeFeatures()
      emitEvent("onMotionWindow", featuresToMap(features))
      clearBuffers()
      windowStartedAt = System.currentTimeMillis()
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  private data class MotionFeatures(
    val walkingStability: Double,
    val stepRegularity: Double,
    val stepIntervalVariability: Double,
    val lateralSway: Double,
    val motionVariance: Double,
    val rotationVariance: Double,
    val suddenMovement: Double,
    val qualityScore: Int,
  )

  /** Section 23/24: if too few samples were collected, quality is marked low rather than guessing. */
  private fun computeFeatures(): MotionFeatures {
    if (accelBuffer.size < 10) {
      return MotionFeatures(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, qualityScore = 20)
    }

    val magnitudes = accelBuffer.map { v ->
      sqrt((v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).toDouble())
    }
    val gravity = 9.81
    val linearMagnitudes = magnitudes.map { abs(it - gravity) }

    val meanMag = linearMagnitudes.average()
    val varianceMag = linearMagnitudes.map { (it - meanMag) * (it - meanMag) }.average()
    val motionVariance = varianceMag.coerceIn(0.0, 1.0)
    val walkingStability = (1.0 - motionVariance).coerceIn(0.0, 1.0)

    // Simple peak detection above the mean = one "step".
    val stepIntervals = mutableListOf<Int>()
    var lastPeakIndex = -1
    for (i in 1 until linearMagnitudes.size - 1) {
      val isPeak = linearMagnitudes[i] > meanMag &&
        linearMagnitudes[i] >= linearMagnitudes[i - 1] &&
        linearMagnitudes[i] >= linearMagnitudes[i + 1]
      if (isPeak) {
        if (lastPeakIndex >= 0) stepIntervals.add(i - lastPeakIndex)
        lastPeakIndex = i
      }
    }
    val stepRegularity: Double
    val stepIntervalVariability: Double
    if (stepIntervals.size >= 2) {
      val meanInterval = stepIntervals.average()
      val varianceInterval = stepIntervals.map { (it - meanInterval) * (it - meanInterval) }.average()
      val stdDevInterval = sqrt(varianceInterval)
      stepIntervalVariability = (stdDevInterval / (meanInterval + 1e-6)).coerceIn(0.0, 1.0)
      stepRegularity = (1.0 - stepIntervalVariability).coerceIn(0.0, 1.0)
    } else {
      stepRegularity = 0.5
      stepIntervalVariability = 0.5
    }

    val lateralValues = accelBuffer.map { v -> sqrt((v[0] * v[0] + v[1] * v[1]).toDouble()) }
    val lateralMean = lateralValues.average()
    val lateralSway = lateralValues.map { (it - lateralMean) * (it - lateralMean) }
      .average().coerceIn(0.0, 1.0)

    val rotationMagnitudes = gyroBuffer.map { v ->
      sqrt((v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).toDouble())
    }
    val rotationVariance = if (rotationMagnitudes.isNotEmpty()) {
      val rotMean = rotationMagnitudes.average()
      rotationMagnitudes.map { (it - rotMean) * (it - rotMean) }.average().coerceIn(0.0, 1.0)
    } else 0.0

    val suddenMovement = linearMagnitudes.zipWithNext { a, b -> abs(b - a) }.maxOrNull() ?: 0.0

    val qualityScore = when {
      accelBuffer.size >= 500 -> 95
      accelBuffer.size >= 200 -> 85
      accelBuffer.size >= 50 -> 70
      else -> 50
    }

    return MotionFeatures(
      walkingStability, stepRegularity, stepIntervalVariability,
      lateralSway, motionVariance, rotationVariance, suddenMovement.coerceIn(0.0, 1.0), qualityScore,
    )
  }

  private fun featuresToMap(f: MotionFeatures): WritableMap {
    val map = Arguments.createMap()
    map.putDouble("walkingStability", f.walkingStability)
    map.putDouble("stepRegularity", f.stepRegularity)
    map.putDouble("stepIntervalVariability", f.stepIntervalVariability)
    map.putDouble("lateralSway", f.lateralSway)
    map.putDouble("motionVariance", f.motionVariance)
    map.putDouble("rotationVariance", f.rotationVariance)
    map.putDouble("suddenMovement", f.suddenMovement)
    map.putInt("qualityScore", f.qualityScore)
    return map
  }

  private fun emitEvent(name: String, data: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, data)
  }

  private fun emitError(code: String) {
    val map = Arguments.createMap()
    map.putString("code", code)
    emitEvent("onMotionError", map)
  }
}
