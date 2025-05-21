declare global {
  var RN$Bridgeless: boolean | undefined;
}

import TinfoilOrig from './NativeTinfoil';
import { NativeEventEmitter } from 'react-native';

/* ────────────────────────────────────────────
   Runtime shim for the **old architecture** only
   ──────────────────────────────────────────── */
const Tinfoil: typeof TinfoilOrig = TinfoilOrig as any;

const isClassic = !(global as any).RN$Bridgeless;

if (isClassic) {
  const emitter = new NativeEventEmitter(Tinfoil as any);

  Tinfoil.verify = (codeCb, runtimeCb, securityCb) =>
    new Promise<Tinfoil.VerificationResult>((resolve, reject) => {
      const sub = emitter.addListener('TinfoilProgress', (payload) => {
        switch ((payload as any).phase) {
          case 'code':
            codeCb?.(payload);
            break;
          case 'runtime':
            runtimeCb?.(payload);
            break;
          case 'security':
            securityCb?.(payload);
            break;
        }
      });

      (Tinfoil as any)
        .verifyOldBridge()
        .then((r: Tinfoil.VerificationResult) => {
          sub.remove();
          resolve(r);
        })
        .catch((e: any) => {
          sub.remove();
          reject(e);
        });
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
