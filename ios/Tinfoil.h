#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>
#if RCT_NEW_ARCH_ENABLED
#import <Tinfoil/Tinfoil.h>
@interface Tinfoil : RCTEventEmitter <NativeTinfoilSpec>
@end
#else // Old architecture
@interface Tinfoil : RCTEventEmitter <RCTBridgeModule>
@end
#endif
