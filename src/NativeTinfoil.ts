import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface InitConfig {
  apiKey?: string; // optional
  githubRepo: string; // “tinfoilsh/model-repo”
  enclaveURL: string; // “enclave.example.com”
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Spec extends TurboModule {
  /** Must be called once before any other method */
  initialize(config: InitConfig): void;

  /** Simple example that returns only the assistant’s text */
  chatCompletion(model: string, messages: ChatMessage[]): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Tinfoil');
