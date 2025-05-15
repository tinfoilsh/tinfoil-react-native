# tinfoil-react-native

> Official Tinfoil secure OpenAI client wrapper for React Native

---

## Installation

To use this library in your app, first install the package:
```sh
npm install tinfoil-react-native
```

### iOS
You will then need to add these flags in your app's ```ios/Podfile``` file:
```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
ENV['USE_FRAMEWORKS'] = 'dynamic'
```

If you're using this library in your app:
```sh
cd ios && pod install  # in YOUR app's ios folder
```

And then build using your favorite Expo, npm or Xcode tool.

---
## Development
If you're developing the library itself:
```sh
npm install
```
Then simply run
```sh
cd ..  # go back to example directory
npx react-native run-ios
```

Note: Make sure you have CocoaPods installed (`sudo gem install cocoapods`).

### Compilation with Xcode
Compiling with Xcode can be useful to access the debugger and other functionalities.

First launch the react native server
```sh
npm run start --workspace=tinfoil-react-native-example
```

Then in a separate terminal:
```sh
cd example/ios && pod install  # in the example app's ios folder
```
Then to build and run the app use, open the workspace in Xcode
```sh
open ReactNativeExample.xcworkspace
```
And use the Xcode interface to build and run your app.

---

## Usage

To get an API Key, sign up on [Tinfoil](tinfoil.sh) and get an API key from your account dashboard.

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
