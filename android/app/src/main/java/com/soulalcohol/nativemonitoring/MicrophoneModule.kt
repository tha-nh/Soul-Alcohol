package com.soulalcohol.nativemonitoring

import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.concurrent.thread

/**
 * Section 14/16/18: captures short PCM frames only while a session is
 * MONITORING, hands each frame to JS as a normalized Float32-ish array for
 * VAD/speaker-verification/feature-extraction (Section 49 engines), and
 * never writes raw audio to disk or SQLite. The native side's only job is
 * "capture + deliver a short buffer + discard" — everything else about
 * whose voice it is and what it means happens in JS/ONNX (Phase 12/13).
 *
 * NOT BUILD-VERIFIED (no Android SDK in this dev environment).
 */
class MicrophoneModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "MicrophoneModule"

  private val sampleRate = 16_000
  private val frameDurationMs = 100
  private val frameSize = sampleRate * frameDurationMs / 1000

  private var audioRecord: AudioRecord? = null
  private var captureThread: Thread? = null
  @Volatile private var isCapturing = false

  @ReactMethod
  fun startCapture(promise: Promise) {
    if (isCapturing) {
      promise.resolve(true)
      return
    }

    val minBufferSize = AudioRecord.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
    )
    if (minBufferSize <= 0) {
      promise.reject("MIC_UNAVAILABLE", "Could not determine AudioRecord buffer size")
      return
    }

    try {
      reactContext.startForegroundService(Intent(reactContext, MonitoringForegroundService::class.java))

      val record = AudioRecord(
        MediaRecorder.AudioSource.MIC,
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        maxOf(minBufferSize, frameSize * 2),
      )
      if (record.state != AudioRecord.STATE_INITIALIZED) {
        promise.reject("MIC_INIT_FAILED", "AudioRecord failed to initialize")
        return
      }

      audioRecord = record
      isCapturing = true
      record.startRecording()

      captureThread = thread(start = true) { captureLoop(record) }
      promise.resolve(true)
    } catch (e: SecurityException) {
      promise.reject("PERMISSION_DENIED", "Microphone permission not granted", e)
    } catch (e: Exception) {
      promise.reject("MIC_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopCapture(promise: Promise) {
    isCapturing = false
    audioRecord?.let {
      try {
        it.stop()
      } catch (_: IllegalStateException) {
        // already stopped
      }
      it.release()
    }
    audioRecord = null
    captureThread = null
    reactContext.stopService(Intent(reactContext, MonitoringForegroundService::class.java))
    promise.resolve(true)
  }

  @ReactMethod
  fun addListener(eventName: String) { /* required by RN event emitter contract */ }

  @ReactMethod
  fun removeListeners(count: Int) { /* required by RN event emitter contract */ }

  private fun captureLoop(record: AudioRecord) {
    val pcmBuffer = ShortArray(frameSize)
    while (isCapturing) {
      val read = record.read(pcmBuffer, 0, frameSize)
      if (read <= 0) continue

      // Section 18: normalize to [-1, 1] and hand off; the raw PCM array
      // goes out of scope right after this and is never persisted.
      val floatArray: WritableArray = Arguments.createArray()
      for (i in 0 until read) {
        floatArray.pushDouble((pcmBuffer[i] / 32768.0))
      }
      emitEvent("onAudioBuffer", floatArray)
    }
  }

  private fun emitEvent(name: String, data: WritableArray) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, data)
  }
}
