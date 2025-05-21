import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface InitConfig {
  apiKey?: string;
  githubRepo: string; // "tinfoilsh/model-repo"
  enclaveURL: string; // "https://…"
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/* Verification ­– progress + final result */
export interface VerificationStatusSuccess {
  status: 'success';
  digest: string;
}
export interface VerificationStatusFailure {
  status: 'failure';
  error: string;
}
export type VerificationStatus =
  | VerificationStatusSuccess
  | VerificationStatusFailure;

export interface VerificationResult {
  isMatch: boolean;
  codeDigest: string;
  runtimeDigest: string;
  publicKeyFP: string;
}

export interface Spec extends TurboModule {
  initialize(config: InitConfig): Promise<void>;

  chatCompletion(model: string, messages: ChatMessage[]): Promise<string>;

  chatCompletionStream(
    model: string,
    messages: ChatMessage[],
    onOpen: () => void,
    onChunk: (delta: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): void;

  verify(
    onCode: (s: VerificationStatus) => void,
    onRuntime: (s: VerificationStatus) => void,
    onSecurity: (s: VerificationStatus) => void
  ): Promise<VerificationResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Tinfoil');
