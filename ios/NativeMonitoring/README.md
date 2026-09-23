# NativeMonitoring (iOS)

Written without Xcode/macOS access (this dev environment is Windows), so
**none of this has been compiled**. Before using it:

1. Open `SoulAlcohol.xcworkspace` in Xcode on a Mac.
2. Right-click the `SoulAlcohol` target → **Add Files to "SoulAlcohol"...**
   and add `MotionModule.swift`, `MotionModule.m`, `MicrophoneModule.swift`,
   `MicrophoneModule.m` from this folder.
3. When Xcode prompts to create an Objective-C bridging header, accept it
   (or point the target's **Objective-C Bridging Header** build setting at
   one that imports `<React/RCTBridgeModule.h>` and `<React/RCTEventEmitter.h>`).
4. Build on a real device — the iOS Simulator has no microphone input and
   Core Motion accelerometer/gyroscope data is unreliable/absent there.
5. Confirm `NSMicrophoneUsageDescription`, `NSMotionUsageDescription`, and
   `UIBackgroundModes: audio` (added to `Info.plist`) show up correctly and
   the permission prompts appear.

The Kotlin equivalents in `android/app/.../nativemonitoring/` are also
unverified (no Android SDK here) but are wired into the Gradle build
already (`MainApplication.kt`, `AndroidManifest.xml`) so they only need
`Android Studio` + a device/emulator to test.
