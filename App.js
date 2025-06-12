// App.js
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, StatusBar, Platform, Image, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RemoteConfigProvider } from './context/RemoteConfigProvider';
import { loadFromCache } from './utils/cache';
import { loadFestivalData } from './utils/dataLoader';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { enableNotifications, areNotificationsEnabled } from './utils/notificationHelper';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './screens/HomeScreen';
import ArtistsScreen from './screens/ArtistsScreen';
import ArtistDetailScreen from './screens/ArtistDetailScreen';
import ProgramScreen from './screens/ProgramScreen';
import FAQScreen from './screens/FAQScreen';
import MyProgramScreen from './screens/MyProgramScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';
import PartnersScreen from './screens/PartnersScreen';
import NewsScreen from './screens/NewsScreen';
import NewsDetailScreen from './screens/NewsDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#002239' }
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
    </Stack.Navigator>
  );
}

function ArtistsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ArtistsList" component={ArtistsScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}

function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramMain" component={ProgramScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}

function MyProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProgramMain" component={MyProgramScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Interpreti') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Program') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'MyProgram') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#EA5178',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#002239',
            borderTopColor: '#0A3652',
            height: Platform.OS === 'android' ? 60 : 60,
            paddingBottom: Platform.OS === 'android' ? 0 : 0,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Home', { screen: 'HomeMain' }); // změna tady
            },
          })}
        />
        <Tab.Screen
          name="Interpreti"
          component={ArtistsStack}
          options={{ title: 'Interpreti', unmountOnBlur: true }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Interpreti', { screen: 'ArtistsList' });
            },
          })}
        />
        <Tab.Screen
          name="Program"
          component={ProgramStack}
          options={{ title: 'Program', unmountOnBlur: true }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Program', { screen: 'ProgramMain' });
            },
          })}
        />
        <Tab.Screen
          name="MyProgram"
          component={MyProgramStack}
          options={{ title: 'Můj program', unmountOnBlur: true }}
          listeners={({ navigation, route }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('MyProgram', { screen: 'MyProgramMain' });
            },
          })}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

async function requestNotificationPermissionOnce() {
  const alreadyAsked = await AsyncStorage.getItem('notification_permission_asked');
  console.log('Kontrola notifikačního permission, alreadyAsked:', alreadyAsked);
  if (!alreadyAsked) {
    try {
      console.log('Žádám o notifikační permission přes notifee...');
      const settings = await notifee.requestPermission();
      console.log('Notifee permission status:', settings.authorizationStatus);
      await AsyncStorage.setItem('notification_permission_asked', 'true');
      if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        console.log('Notifikace povoleny!');
      } else {
        console.log('Notifikace nejsou povoleny.');
      }
    } catch (e) {
      console.log('Chyba při žádosti o notifikační permission:', e);
    }
  } else {
    console.log('Permission už bylo žádáno dříve.');
  }
}

async function setupNotificationChannel() {
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'Festival Notifications',
      description: 'Notifikace pro festivalové události',
      importance: 4, // HIGH
      sound: 'default',
      vibration: true,
    });
    console.log('✅ Notifikační kanál byl úspěšně vytvořen');
  } catch (error) {
    console.error('❌ Chyba při vytváření notifikačního kanálu:', error);
  }
}

// Inicializace notifikačního kanálu při startu aplikace
setupNotificationChannel();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [festivalData, setFestivalData] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Získání instance messaging
        const messagingInstance = messaging();

        // Požádáme o povolení notifikací
        await requestNotificationPermissionOnce();

        // Nastavíme listener pro foreground zprávy
        const unsubscribe = messagingInstance.onMessage(async remoteMessage => {
          console.log('Přijata zpráva v popředí:', remoteMessage);

          // Zobrazíme notifikaci pomocí notifee
          await notifee.displayNotification({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            android: {
              channelId: 'default',
              pressAction: { id: 'default' },
            },
          });
        });

        // Přihlášení k topicu
        await messagingInstance.subscribeToTopic('all');
        console.log('Přihlášen k odběru topicu "all"');

        console.log('🚀 Kontroluji cache a případně stahuji festivalová data...');
        const data = await loadFestivalData();

        if (!data || !data.artists || !data.program) {
          throw new Error('Nepodařilo se načíst festivalová data');
        }

        // Uložení dat do globálního stavu
        setFestivalData({
          program: data.program.events,
          artists: data.artists,
          stages: data.program.stages,
          config: data.program.config,
        });

        // Kontrola a případné povolení notifikací
        const notificationsEnabled = await areNotificationsEnabled();
        if (!notificationsEnabled) {
          console.log('ℹ️ Notifikace nejsou povoleny');
        }

        setIsLoading(false);

        // Cleanup listeneru při unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('❌ Chyba při inicializaci aplikace:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);
  

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            setError(null);
            initializeApp();
          }}
        >
          <Text style={styles.retryButtonText}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RemoteConfigProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#002239" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </RemoteConfigProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#002239',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '80%',
    height: '80%',
  },
  loader: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#21AAB0',
    padding: 15,
    marginTop: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
