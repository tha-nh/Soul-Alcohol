#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Exposes the Swift MotionModule to the RN bridge (old-arch style, works
// under the New Architecture's interop layer). Requires the Swift file to
// be visible via the target's Objective-C bridging header.
@interface RCT_EXTERN_MODULE(MotionModule, RCTEventEmitter)

RCT_EXTERN_METHOD(captureBaseline:(nonnull NSNumber *)durationMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startSessionMonitoring:(nonnull NSNumber *)windowDurationMs)

RCT_EXTERN_METHOD(stopSessionMonitoring)

@end
