import Tinfoil from './NativeTinfoil';

// Re-export all the useful TypeScript types and helpers.
export * from './NativeTinfoil';

// Make the types available as `Tinfoil.VerificationStatus`, etc.
export namespace Tinfoil {
  /* Re-export *types* only – no runtime code is produced */
  export type VerificationStatus = import('./NativeTinfoil').VerificationStatus;
  export type VerificationResult = import('./NativeTinfoil').VerificationResult;
  export type InitConfig = import('./NativeTinfoil').InitConfig;
  export type ChatMessage = import('./NativeTinfoil').ChatMessage;
}

// Keep the default export unchanged.
export default Tinfoil;
