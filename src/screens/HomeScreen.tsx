import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FM City Fest</Text>
      <Text style={styles.subtitle}>Home Screen</Text>
      <Text style={styles.description}>Navigate to specific posts via push notifications</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
