#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

#if RCT_NEW_ARCH_ENABLED
#import <Tinfoil/Tinfoil.h>
#endif

@interface Tinfoil : RCTEventEmitter <RCTBridgeModule>
@end

#if RCT_NEW_ARCH_ENABLED
@interface Tinfoil : NSObject <NativeTinfoilSpec>
@end
#endif