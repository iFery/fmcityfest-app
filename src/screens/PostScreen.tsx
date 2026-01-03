import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type PostScreenRouteProp = RouteProp<RootStackParamList, 'Post'>;

export default function PostScreen() {
  const route = useRoute<PostScreenRouteProp>();
  const { postId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Details</Text>
      <Text style={styles.postId}>Post ID: {postId}</Text>
      <Text style={styles.description}>This screen was opened from a push notification</Text>
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
    marginBottom: 16,
  },
  postId: {
    fontSize: 20,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
