#import "Tinfoil.h"
#import <Tinfoil/Tinfoil-Swift.h> // auto-generated Swift-to-ObjC header
#import <React/RCTBridge.h>
#if RCT_NEW_ARCH_ENABLED
  #import <Tinfoil/Tinfoil.h>
#endif

@implementation Tinfoil {
  TinfoilBridge *_bridge;          // <— keep one Swift object
}

RCT_EXPORT_MODULE(Tinfoil)

- (instancetype)init
{
  if ((self = [super init])) {
    _bridge = [TinfoilBridge new];
    _bridge.emitter = self;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup { return NO; }

// Forward the bridge once RN sets it so the Swift emitter can emit events
- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
}

// Forward the JS-invocation helper as soon as RN provides it  <-- NEW
- (void)setCallableJSModules:(RCTCallableJSModules *)callableJSModules
{
  [super setCallableJSModules:callableJSModules];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"TinfoilStreamOpen",
            @"TinfoilStreamChunk",
            @"TinfoilStreamDone",
            @"TinfoilStreamError",
            @"TinfoilProgress" ];
}

#if RCT_NEW_ARCH_ENABLED
- (void)initialize:(JS::NativeTinfoil::InitConfig &)config
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_bridge initialize:config.apiKey()
           githubRepo:config.githubRepo()
           enclaveURL:config.enclaveURL()
           completion:^(NSError *err) {
             if (err) {
               reject(@"init_error", err.localizedDescription, err);
             } else {
               resolve(nil);    // JS promise ⇢ fulfilled
             }
           }];
}
#else
RCT_EXPORT_METHOD(
  initialize:(NSDictionary *)config
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject)
{
  [_bridge initialize:config[@"apiKey"]
           githubRepo:config[@"githubRepo"]
           enclaveURL:config[@"enclaveURL"]
           completion:^(NSError *err) {
             if (err) {
               reject(@"init_error", err.localizedDescription, err);
             } else {
               resolve(nil);
             }
           }];
}
#endif

// ────────────────────────────────────────────────────────────────
// CHAT COMPLETION
// ────────────────────────────────────────────────────────────────

#if RCT_NEW_ARCH_ENABLED   // ← new-arch implementation (matches the spec)
- (void)chatCompletion:(NSString *)model
              messages:(NSArray *)messages
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_bridge chatCompletion:model
                  messages:messages
                completion:^(NSString * _Nullable text,
                             NSError  * _Nullable error) {
      if (error) {
        reject([NSString stringWithFormat:@"%ld",(long)error.code],
               error.localizedDescription, error);
      } else {
        resolve(text ?: @"");
      }
  }];
}
#else                     // ← old-arch implementation + export macro
RCT_EXPORT_METHOD(
  chatCompletion:(NSString *)model
                 messages:(NSArray *)messages
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
  [_bridge chatCompletion:model
                  messages:messages
                completion:^(NSString * _Nullable text,
                             NSError  * _Nullable error) {
      if (error) {
        reject([NSString stringWithFormat:@"%ld",(long)error.code],
               error.localizedDescription, error);
      } else {
        resolve(text ?: @"");
      }
  }];
}
#endif   // chatCompletion

#if RCT_NEW_ARCH_ENABLED
- (void)chatCompletionStream:(NSString *)model
                     messages:(NSArray *)messages
                      onOpen:(RCTResponseSenderBlock)onOpen
                      onChunk:(RCTResponseSenderBlock)onChunk
                      onDone:(RCTResponseSenderBlock)onDone
                      onError:(RCTResponseSenderBlock)onError
{
  // JS receives progress via events, so these callback blocks are ignored.
  [_bridge chatCompletionStream:model messages:messages];
}
#else
RCT_EXPORT_METHOD(chatCompletionStream:(NSString *)model
                       messages:(NSArray *)messages
                       onOpen:(RCTResponseSenderBlock)onOpen
                       onChunk:(RCTResponseSenderBlock)onChunk
                       onDone:(RCTResponseSenderBlock)onDone
                       onError:(RCTResponseSenderBlock)onError)
{
  // Same delegation for the classic bridge.
  [_bridge chatCompletionStream:model messages:messages];
}
#endif

// ────────────────────────────────────────────────────────────────
// VERIFY
// ────────────────────────────────────────────────────────────────

#if RCT_NEW_ARCH_ENABLED
- (void)verify:(RCTResponseSenderBlock)onCode
onRuntimeVerificationComplete:(RCTResponseSenderBlock)onRuntime
onSecurityCheckComplete:(RCTResponseSenderBlock)onSecurity
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
  [_bridge verifyOnCodeVerificationComplete:onCode
                  onRuntimeVerificationComplete:onRuntime
                  onSecurityCheckComplete:onSecurity
                                   completion:^(NSDictionary * _Nullable res,
                                                NSError      * _Nullable err) {
      if (err) {
        reject([NSString stringWithFormat:@"%ld",(long)err.code],
               err.localizedDescription, err);
      } else {
        resolve(res ?: @{});
      }
  }];
}
#else
static NSDictionary *wrap(NSString *phase, id payload)
{
  id candidate = payload;

  // If the bridge gave us [ { … } ] take the first object.
  if ([candidate isKindOfClass:[NSArray class]] &&
      [(NSArray *)candidate count] > 0) {
    candidate = [(NSArray *)candidate firstObject];
  }

  NSMutableDictionary *d = [NSMutableDictionary dictionary];

  if ([candidate isKindOfClass:[NSDictionary class]]) {
    [d addEntriesFromDictionary:(NSDictionary *)candidate];
  } else if (candidate) {
    d[@"status"] = candidate;   // fallback for strings, numbers, etc.
  }

  d[@"phase"] = phase;
  return d;
}

RCT_EXPORT_METHOD(verifyOldBridge:(RCTPromiseResolveBlock)resolve
                       rejecter:(RCTPromiseRejectBlock)reject)
{
  [_bridge verifyOnCodeVerificationComplete:^(id p){
        [self sendEventWithName:@"TinfoilProgress" body:wrap(@"code",     p)];
      }
      onRuntimeVerificationComplete:^(id p){
        [self sendEventWithName:@"TinfoilProgress" body:wrap(@"runtime",  p)];
      }
      onSecurityCheckComplete:^(id p){
        [self sendEventWithName:@"TinfoilProgress" body:wrap(@"security", p)];
      }
      completion:^(NSDictionary *res, NSError *err) {
        if (err) reject(@"verify_error", err.localizedDescription, err);
        else     resolve(res ?: @{}); } ];
}
#endif

#if RCT_NEW_ARCH_ENABLED
#pragma mark - TurboModule boiler-plate

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTinfoilSpecJSI>(params);
}
#endif
@end
