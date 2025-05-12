import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface InitConfig {
  apiKey?: string; // optional
  githubRepo: string; // "tinfoilsh/model-repo"
  enclaveURL: string; // "enclave.example.com"
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Progress payload delivered to each verification-stage callback.
 */
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

// Final aggregated result produced by `verify`.
export interface VerificationResult {
  isMatch: boolean;
  codeDigest: string;
  runtimeDigest: string;
  publicKeyFP: string;
}

export interface Spec extends TurboModule {
  /** Must be called once before any other method */
  initialize(config: InitConfig): Promise<void>;

  /** Simple example that returns only the assistant's text */
  chatCompletion(model: string, messages: ChatMessage[]): Promise<string>;

  /**
   * Perform secure code & runtime verification.
   *
   * Each phase invokes its respective callback with a
   * `VerificationStatus`.  When all phases finish, the promise
   * resolves with a `VerificationResult`.
   */
  verify(
    onCodeVerificationComplete: (result: VerificationStatus) => void,
    onRuntimeVerificationComplete: (result: VerificationStatus) => void,
    onSecurityCheckComplete: (result: VerificationStatus) => void
  ): Promise<VerificationResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Tinfoil');
