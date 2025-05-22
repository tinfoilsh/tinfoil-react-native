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

const emitter = new NativeEventEmitter(Tinfoil as any);

if (isClassic) {
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

  /* ────────────────────────────────────────────
    Chat-completion streaming (event bridge)
    ──────────────────────────────────────────── */

  const nativeStreamClassic = (
    Tinfoil as any
  ).chatCompletionStreamOldBridge?.bind(Tinfoil);

  Tinfoil.chatCompletionStream = (
    model: string,
    messages: Tinfoil.ChatMessage[],
    onOpen?: () => void,
    onChunk?: (delta: string) => void,
    onDone?: () => void,
    onError?: (err: string) => void
  ) => {
    /* Wire native events → user-supplied callbacks */
    const subs = [
      emitter.addListener('TinfoilStreamOpen', () => onOpen?.()),
      emitter.addListener('TinfoilStreamChunk', (e) => onChunk?.(e.delta)),
      emitter.addListener('TinfoilStreamDone', () => {
        onDone?.();
        cleanup();
      }),
      emitter.addListener('TinfoilStreamError', (e) => {
        onError?.(e.error);
        cleanup();
      }),
    ];
    const cleanup = () => subs.forEach((s) => s.remove());

    /* Kick off the native stream — no reusable callbacks cross the bridge */
    nativeStreamClassic?.(model, messages);
  };
}

const nativeChatCompletionStream = (Tinfoil as any).chatCompletionStream?.bind(
  Tinfoil
);

Tinfoil.chatCompletionStream = (
  model: string,
  messages: Tinfoil.ChatMessage[],
  onOpen?: () => void,
  onChunk?: (delta: string) => void,
  onDone?: () => void,
  onError?: (err: string) => void
) => {
  /* Wire native events → user-supplied callbacks */
  const sub = emitter.addListener('TinfoilStreamChunk', (e) =>
    onChunk?.(e.delta)
  );
  const cleanup = () => sub.remove();

  const wrappedDone = () => {
    cleanup();
    onDone?.();
  };
  const wrappedError = (err: string) => {
    cleanup();
    onError?.(err);
  };

  /* Kick off the native stream — no reusable callbacks cross the bridge */
  nativeChatCompletionStream?.(
    model,
    messages,
    onOpen,
    undefined,
    wrappedDone,
    wrappedError
  );
};

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
