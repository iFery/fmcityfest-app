import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import PostScreen from '../screens/PostScreen';
import NotificationTestScreen from '../screens/NotificationTestScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer
      linking={{
        prefixes: ['myapp://'],
        config: {
          screens: {
            Home: 'home',
            Post: 'post/:postId',
            NotificationTest: 'test',
          },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'FM City Fest' }} />
        <Stack.Screen name="Post" component={PostScreen} options={{ title: 'Post Details' }} />
        <Stack.Screen
          name="NotificationTest"
          component={NotificationTestScreen}
          options={{ title: 'Notification Test' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
