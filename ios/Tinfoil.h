#if RCT_NEW_ARCH_ENABLED
#import <Tinfoil/Tinfoil.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface Tinfoil : RCTEventEmitter <NativeTinfoilSpec>
@end
#else // Old architecture
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface Tinfoil : RCTEventEmitter <RCTBridgeModule>
@end
#endif
