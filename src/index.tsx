declare global {
  var RN$Bridgeless: boolean | undefined;
}

import TinfoilOrig from './NativeTinfoil';

/* ────────────────────────────────────────────
   Runtime shim for the **old architecture** only
   ──────────────────────────────────────────── */
const Tinfoil: typeof TinfoilOrig = TinfoilOrig as any;

const isClassic = !(global as any).RN$Bridgeless;

if (isClassic) {
  /**
   * In the old architecture `verify` is exported as
   *   verify(progressCb) → Promise
   * whereas the new-arch spec expects the 3-callback form.
   * If we detect the 1-argument version we wrap it so the JS
   * signature stays identical in both architectures.
   */
  type OneArgVerify = (
    progress: (s: Tinfoil.VerificationStatus | { error: string }) => void,
    done: (r: Tinfoil.VerificationResult | { error: string }) => void
  ) => void;

  const nativeVerify: OneArgVerify = (Tinfoil as any).verifyOldBridge.bind(
    Tinfoil
  );

  Tinfoil.verify = (codeCb, runtimeCb, securityCb) =>
    new Promise<Tinfoil.VerificationResult>((resolve, reject) => {
      nativeVerify(
        (payload) => {
          // progress handler
          switch ((payload as any).phase) {
            case 'code':
              codeCb?.(payload as any);
              break;
            case 'runtime':
              runtimeCb?.(payload as any);
              break;
            case 'security':
              securityCb?.(payload as any);
              break;
          }
        },
        (result) => {
          // done handler
          if ('error' in result) reject(new Error(result.error));
          else resolve(result as any);
        }
      );
    });
}

/* ────────────────────────────────────────────
   Public re-exports (types only)
   ──────────────────────────────────────────── */
export * from './NativeTinfoil';

export namespace Tinfoil {
  export type VerificationStatus = import('./NativeTinfoil').VerificationStatus;
  export type VerificationResult = import('./NativeTinfoil').VerificationResult;
  export type InitConfig = import('./NativeTinfoil').InitConfig;
  export type ChatMessage = import('./NativeTinfoil').ChatMessage;
}

/* keep default export unchanged */
export default Tinfoil;
