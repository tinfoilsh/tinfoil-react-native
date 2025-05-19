#import <React/RCTBridgeModule.h>

#if RCT_NEW_ARCH_ENABLED
#import <Tinfoil/Tinfoil.h>
#endif

@interface Tinfoil : NSObject <RCTBridgeModule>
@end

#if RCT_NEW_ARCH_ENABLED
@interface Tinfoil : NSObject <NativeTinfoilSpec>
@end
#endif