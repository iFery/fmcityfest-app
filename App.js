// App.js
import React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RemoteConfigProvider } from './context/RemoteConfigProvider';

// SafeArea
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import ArtistsScreen from './screens/ArtistsScreen';
import ArtistDetailScreen from './screens/ArtistDetailScreen';
import ProgramScreen from './screens/ProgramScreen';
import FAQScreen from './screens/FAQScreen';
import MyProgramScreen from './screens/MyProgramScreen';
import MapScreen from './screens/MapScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// …––––––––––––––––––––––––––––––––––––––  
// Stacky pro jednotlivé obrazovky  
// …––––––––––––––––––––––––––––––––––––––  

function ArtistDetailScreenStack() {
  return (
    <Stack.Screen
      name="ArtistDetail"
      component={ArtistDetailScreen}
      options={{ headerShown: false, animation: 'slide_from_right' }}
    />
  );
}

function ArtistsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Artists" component={ArtistsScreen} />
      {ArtistDetailScreenStack()}
    </Stack.Navigator>
  );
}

function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramMain" component={ProgramScreen} />
      {ArtistDetailScreenStack()}
    </Stack.Navigator>
  );
}

function MyProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProgramMain" component={MyProgramScreen} />
      {ArtistDetailScreenStack()}
    </Stack.Navigator>
  );
}

// …––––––––––––––––––––––––––––––––––––––  
// Bottom-tabs navigator s přidaným safe-area paddingem  
// …––––––––––––––––––––––––––––––––––––––  

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#002239',
          height: 60 + insets.bottom,     // základní výška + spodní bezpečné odsazení
          paddingBottom: insets.bottom,   // odsazení ikon od spodní lišty
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused
                ? 'information-circle'
                : 'information-circle-outline';
              break;
            case 'ArtistsStack':
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              break;
            case 'ProgramStack':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'MyProgramStack':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            default:
              iconName = 'alert-circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#21AAB0',
        tabBarInactiveTintColor: '#ffffff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Info' }} />
      <Tab.Screen
        name="ArtistsStack"
        component={ArtistsStack}
        options={{ title: 'Interpreti' }}
      />
      <Tab.Screen
        name="ProgramStack"
        component={ProgramStack}
        options={{ title: 'Program' }}
      />
      <Tab.Screen
        name="MyProgramStack"
        component={MyProgramStack}
        options={{ title: 'Můj program', unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
}

// …––––––––––––––––––––––––––––––––––––––  
// Root stack  
// …––––––––––––––––––––––––––––––––––––––  

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}

// …––––––––––––––––––––––––––––––––––––––  
// App entrypoint  
// …––––––––––––––––––––––––––––––––––––––  

export default function App() {
  // Globálně nastav výchozí font
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: 'Raleway-Regular' };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RemoteConfigProvider>
        {/* SafeAreaProvider musí být nad NavigationContainer */}
        <SafeAreaProvider style={{ flex: 1 }}>
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        </SafeAreaProvider>
      </RemoteConfigProvider>
    </GestureHandlerRootView>
  );
}
