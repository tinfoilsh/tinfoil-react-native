import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Tinfoil from 'tinfoil-react-native';
import type {
  VerificationResult,
  VerificationStatus,
} from 'tinfoil-react-native';

const API_KEY = 'YOUR_API_KEY';
const REPO = 'tinfoilsh/confidential-llama3-3-70b';
const ENCLAVE = 'llama3-3-70b.model.tinfoil.sh';

export default function App() {
  // Overlay on/off
  const [show, setShow] = useState(false);
  // Running flag (spinner)
  const [busy, setBusy] = useState(false);

  // Chat prompt / reply
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState<string | null>(null);

  // Three progress callbacks
  const [codeStatus, setCode] = useState<VerificationStatus | null>(null);
  const [runtimeStatus, setRuntime] = useState<VerificationStatus | null>(null);
  const [securityStatus, setSecurity] = useState<VerificationStatus | null>(
    null
  );

  // Final result
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Remember we've called initialize once
  const initialized = useRef(false);

  /* ───────────────────────── Chat helper ───────────────────────── */
  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    try {
      if (!initialized.current) {
        await Tinfoil.initialize({
          apiKey: API_KEY,
          githubRepo: REPO,
          enclaveURL: ENCLAVE,
        });
        initialized.current = true;
      }

      setReply('…'); // placeholder while waiting
      const text = await Tinfoil.chatCompletion('llama3-3-70b', [
        { role: 'user', content: prompt },
      ]);
      setReply(text);
    } catch (err) {
      console.error(err);
      setReply(String(err));
    }
  };

  const runVerification = async () => {
    setShow(true);
    setResult(null);
    setCode(null);
    setRuntime(null);
    setSecurity(null);
    setBusy(true);

    try {
      if (!initialized.current) {
        await Tinfoil.initialize({
          apiKey: API_KEY,
          githubRepo: REPO,
          enclaveURL: ENCLAVE,
        });
        initialized.current = true;
      }

      const final = await Tinfoil.verify(
        setCode, // onCodeVerificationComplete
        setRuntime, // onRuntimeVerificationComplete
        setSecurity // onSecurityCheckComplete
      );

      setResult(final);
    } catch (err) {
      console.error('Verification error', err);
    } finally {
      setBusy(false);
    }
  };

  const closeOverlay = () => {
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {/* ── Chat area ─────────────────────────────────────────────── */}
      <Text style={styles.heading}>Chat with the model</Text>
      <TextInput
        style={styles.input}
        placeholder="Type a prompt…"
        value={prompt}
        onChangeText={setPrompt}
      />
      <Button title="Send prompt" onPress={sendPrompt} />
      {reply !== null && <Text style={styles.reply}>Assistant: {reply}</Text>}

      {/* ── Verification button ─────────────────────────────────── */}
      <View style={styles.verifyButton}>
        <Button title="Run verification" onPress={runVerification} />
      </View>

      {show && (
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <Text style={styles.title}>Verification</Text>

            <Section title="Code verification" status={codeStatus} />
            <Section title="Runtime verification" status={runtimeStatus} />
            <Section title="Security check" status={securityStatus} />

            {busy && <ActivityIndicator style={styles.spinner} />}

            {result && (
              <View style={styles.overall}>
                <Text style={styles.sectionTitle}>Overall</Text>
                <Text>{result.isMatch ? '✅ Match' : '❌ Mismatch'}</Text>
                <Text>Code digest: {result.codeDigest}</Text>
                <Text>Runtime digest: {result.runtimeDigest}</Text>
                <Text>Public key: {result.publicKeyFP}</Text>
              </View>
            )}

            <Button title="Close" onPress={closeOverlay} />
          </View>
        </View>
      )}
    </View>
  );
}

/* ───────────────────────────────── Section helper ────────────────────────── */
function Section({
  title,
  status,
}: {
  title: string;
  status: VerificationStatus | null;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      {status ? (
        status.status === 'success' ? (
          <>
            <Text>✅ Success</Text>
            <Text>status: {JSON.stringify(status)}</Text>
            {'digest' in status && <Text>Digest: {status.digest}</Text>}
          </>
        ) : (
          <>
            <Text>❌ Failure</Text>
            <Text>status: {JSON.stringify(status)}</Text>
            {'error' in status && <Text>Error: {status.error}</Text>}
          </>
        )
      ) : (
        <Text>⏳ Pending…</Text>
      )}
    </>
  );
}

/* ────────────────────────────────── styles ───────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    width: '100%',
    marginBottom: 8,
  },
  reply: {
    marginVertical: 8,
  },
  verifyButton: {
    marginTop: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: '85%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
  },
  spinner: {
    marginVertical: 12,
  },
  overall: {
    marginTop: 12,
  },
});
