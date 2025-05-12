import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Tinfoil from 'tinfoil-react-native';
import type {
  VerificationStatus,
  VerificationResult,
} from 'tinfoil-react-native';

export default function App() {
  const [answer, setAnswer] = useState<string>('Waiting…');

  // Incremental verification-stage status
  const [progress, setProgress] = useState<{
    code: string;
    runtime: string;
    security: string;
  }>({ code: 'pending', runtime: 'pending', security: 'pending' });

  // Final verification payload
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        await Tinfoil.initialize({
          apiKey: 'YOUR_API_KEY',
          githubRepo: 'tinfoilsh/confidential-llama3-3-70b',
          enclaveURL: 'llama3-3-70b.model.tinfoil.sh',
        });

        // Kick off verification + chat completion in parallel
        const verifyPromise = Tinfoil.verify(
          (res: VerificationStatus) =>
            setProgress((p) => ({ ...p, code: JSON.stringify(res) })),
          (res: VerificationStatus) =>
            setProgress((p) => ({ ...p, runtime: JSON.stringify(res) })),
          (res: VerificationStatus) =>
            setProgress((p) => ({ ...p, security: JSON.stringify(res) }))
        );

        const chatPromise = Tinfoil.chatCompletion('llama3-3-70b', [
          { role: 'user', content: 'Hello!' },
        ]);

        const [verifyResult, reply] = await Promise.all([
          verifyPromise,
          chatPromise,
        ]);

        setVerification(verifyResult);
        setAnswer(reply);
      } catch (err) {
        console.error(err);
        setAnswer(String(err));
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 12 }}>Chat reply: {answer}</Text>

      <Text style={{ fontWeight: 'bold' }}>Verification progress</Text>
      <Text>Code: {progress.code}</Text>
      <Text>Runtime: {progress.runtime}</Text>
      <Text>Security: {progress.security}</Text>

      {verification && (
        <>
          <Text style={{ fontWeight: 'bold', marginTop: 12 }}>
            Final verification result
          </Text>
          <Text>Match: {verification.isMatch ? '✅' : '❌'}</Text>
          <Text>Code digest: {verification.codeDigest}</Text>
          <Text>Runtime digest: {verification.runtimeDigest}</Text>
          <Text>Key fingerprint: {verification.publicKeyFP}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
