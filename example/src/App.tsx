import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Tinfoil from '@tinfoil/react-native'; // <— now resolves

export default function App() {
  const [answer, setAnswer] = useState<string>('Waiting…');

  useEffect(() => {
    (async () => {
      try {
        await Tinfoil.initialize({
          apiKey: 'YOUR_API_KEY',
          githubRepo: 'tinfoilsh/confidential-llama3-3-70b',
          enclaveURL: 'llama3-3-70b.model.tinfoil.sh',
        });

        const reply = await Tinfoil.chatCompletion('llama3-3-70b', [
          { role: 'user', content: 'Hello!' },
        ]);

        setAnswer(reply);
      } catch (err) {
        console.error(err);
        setAnswer(String(err));
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>{answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
