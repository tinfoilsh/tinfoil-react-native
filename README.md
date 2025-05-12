# tinfoil-react-native

> Official Tinfoil secure OpenAI client wrapper for React Native

---

## Installation

If you're using this library in your app:
```sh
npm install tinfoil-react-native
```

If you're developing the library itself:
```sh
npm install
```

### iOS

If you're using this library in your app:
```sh
cd ios && pod install  # in YOUR app's ios folder
```

If you're developing the library itself and want to build the example app:
```sh
npm run start --workspace=tinfoil-react-native-example
```
Then in a separate terminal:
```sh
cd example/ios && pod install  # in the example app's ios folder
open ReactNativeExample.xcodeproj
```
And then build using Xcode tool.

Note: Make sure you have CocoaPods installed (`sudo gem install cocoapods`).

---

## Usage

### 1. Initialize the SDK

```ts
import Tinfoil from 'tinfoil-react-native';

await Tinfoil.initialize({
  apiKey: 'YOUR_API_KEY',
  githubRepo: 'tinfoilsh/model-repo',
  enclaveURL: 'enclave.example.com',
});
```

### 2. Chat Completion

```ts
const reply = await Tinfoil.chatCompletion('model', [
  { role: 'user', content: 'Hello!' },
]);
console.log('Assistant:', reply);
```

### 3. Secure Verification with Progress Callbacks

```ts
import type { VerificationStatus, VerificationResult } from 'tinfoil-react-native';

const verificationResult: VerificationResult = await Tinfoil.verify(
  (codeStatus: VerificationStatus) => {
    // Called when code verification completes
    console.log('Code verification:', codeStatus);
  },
  (runtimeStatus: VerificationStatus) => {
    // Called when runtime verification completes
    console.log('Runtime verification:', runtimeStatus);
  },
  (securityStatus: VerificationStatus) => {
    // Called when security check completes
    console.log('Security check:', securityStatus);
  }
);

if (verificationResult.isMatch) {
  console.log('Verification successful!', verificationResult);
} else {
  console.log('Verification failed:', verificationResult);
}
```

---

## API

### `Tinfoil.initialize(config)`

- `config: { apiKey?: string, githubRepo: string, enclaveURL: string }`
- Returns: `Promise<void>`

### `Tinfoil.chatCompletion(model, messages)`

- `model: string`
- `messages: { role: 'system' | 'user' | 'assistant', content: string }[]`
- Returns: `Promise<string>`

### `Tinfoil.verify(onCode, onRuntime, onSecurity)`

- Each callback receives a `VerificationStatus`:
  - `{ status: 'success', digest: string }`
  - or `{ status: 'failure', error: string }`
- Returns: `Promise<VerificationResult>`
  - `{ isMatch: boolean, codeDigest: string, runtimeDigest: string, publicKeyFP: string }`

---

## Example

See [`example/App.tsx`](example/src/App.tsx) for a full working demo.

---

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
