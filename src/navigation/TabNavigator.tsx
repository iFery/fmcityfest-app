import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ProgramScreen from '../screens/ProgramScreen';
import ProgramHorizontalScreen from '../screens/ProgramHorizontalScreen';
import ArtistsScreen from '../screens/ArtistsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SharedProgramScreen from '../screens/SharedProgramScreen';
import InfoScreen from '../screens/InfoScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PartnersScreen from '../screens/PartnersScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import FAQScreen from '../screens/FAQScreen';
import MapScreen from '../screens/MapScreen';
import DebugScreen from '../screens/DebugScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { typography } from '../theme/ThemeProvider';
import type { RootStackParamList } from './linking';

export type TabParamList = {
  Home: undefined;
  Program: undefined;
  Artists: undefined;
  Favorites: undefined;
  Info: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#002239' },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="HomeMain">
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="ProgramMain">
      <Stack.Screen name="ProgramMain" component={ProgramScreen} />
      <Stack.Screen name="ProgramHorizontal" component={ProgramHorizontalScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ArtistsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="ArtistsMain">
      <Stack.Screen name="ArtistsMain" component={ArtistsScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="FavoritesMain">
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen name="SharedProgram" component={SharedProgramScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function InfoStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="InfoMain">
      <Stack.Screen name="InfoMain" component={InfoScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Partners" component={PartnersScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Debug" component={DebugScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Helper function to get main screen name for each tab
function getMainScreenName(tabName: string): string | null {
  switch (tabName) {
    case 'Home':
      return 'HomeMain';
    case 'Program':
      return 'ProgramMain';
    case 'Artists':
      return 'ArtistsMain';
    case 'Favorites':
      return 'FavoritesMain';
    case 'Info':
      return 'InfoMain';
    default:
      return null;
  }
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#002239' }}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Program') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Artists') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Info') {
              iconName = focused ? 'menu' : 'menu-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },

          tabBarActiveTintColor: '#EA5178',
          tabBarInactiveTintColor: 'gray',

          tabBarLabelStyle: {
            fontFamily: typography.fontFamily.medium,
            fontSize: 12,
          },

          tabBarStyle: {
            backgroundColor: '#002239',
            borderTopColor: '#0A3652',
            borderTopWidth: 1.5,
            ...(Platform.OS === 'ios' && {
              paddingTop: 8,
            }),
            ...(Platform.OS === 'android' && {
              height: 60 + Math.max(insets?.bottom || 0, 0),
              paddingBottom: Math.max(insets?.bottom || 0, 8),
              paddingTop: 8,
            }),
          },

          headerShown: false,
        })}
      >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ title: 'Úvod', headerShown: false }}
        getId={() => 'HomeTab'}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Find the route for the tab we're clicking on
            const targetRoute = state.routes.find((r: any) => r.name === route.name);
            const currentRoute = state.routes[state.index || 0];
            
            // If the target tab has a stack with more than one screen, reset it
            if (targetRoute && targetRoute.state) {
              const stackKey = targetRoute.state.key;
              const stackIndex = targetRoute.state.index || 0;
              
              // Reset stack if it has more than one screen
              if (stackKey && stackIndex > 0) {
                // Get the main screen name for this tab
                const mainScreenName = getMainScreenName(route.name);
                
                if (mainScreenName) {
                  // Always prevent default to avoid showing the current screen first
                  e.preventDefault();
                  
                  // If we're switching from another tab, navigate first
                  if (currentRoute.name !== route.name) {
                    navigation.navigate(route.name as any);
                  }
                  
                  // Reset the stack immediately using CommonActions.reset
                  // This should happen in the same frame as navigation to prevent flicker
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: mainScreenName }],
                    }),
                    target: stackKey,
                  });
                }
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Program" 
        component={ProgramStack}
        options={{ title: 'Program' }}
        getId={() => 'ProgramTab'}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Find the route for the tab we're clicking on
            const targetRoute = state.routes.find((r: any) => r.name === route.name);
            const currentRoute = state.routes[state.index || 0];
            
            // If the target tab has a stack with more than one screen, reset it
            if (targetRoute && targetRoute.state) {
              const stackKey = targetRoute.state.key;
              const stackIndex = targetRoute.state.index || 0;
              
              // Reset stack if it has more than one screen
              if (stackKey && stackIndex > 0) {
                // Get the main screen name for this tab
                const mainScreenName = getMainScreenName(route.name);
                
                if (mainScreenName) {
                  // Always prevent default to avoid showing the current screen first
                  e.preventDefault();
                  
                  // If we're switching from another tab, navigate first
                  if (currentRoute.name !== route.name) {
                    navigation.navigate(route.name as any);
                  }
                  
                  // Reset the stack immediately using CommonActions.reset
                  // This should happen in the same frame as navigation to prevent flicker
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: mainScreenName }],
                    }),
                    target: stackKey,
                  });
                }
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Artists" 
        component={ArtistsStack}
        options={{ title: 'Interpreti' }}
        getId={() => 'ArtistsTab'}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Find the route for the tab we're clicking on
            const targetRoute = state.routes.find((r: any) => r.name === route.name);
            const currentRoute = state.routes[state.index || 0];
            
            // If the target tab has a stack with more than one screen, reset it
            if (targetRoute && targetRoute.state) {
              const stackKey = targetRoute.state.key;
              const stackIndex = targetRoute.state.index || 0;
              
              // Reset stack if it has more than one screen
              if (stackKey && stackIndex > 0) {
                // Get the main screen name for this tab
                const mainScreenName = getMainScreenName(route.name);
                
                if (mainScreenName) {
                  // Always prevent default to avoid showing the current screen first
                  e.preventDefault();
                  
                  // If we're switching from another tab, navigate first
                  if (currentRoute.name !== route.name) {
                    navigation.navigate(route.name as any);
                  }
                  
                  // Reset the stack immediately using CommonActions.reset
                  // This should happen in the same frame as navigation to prevent flicker
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: mainScreenName }],
                    }),
                    target: stackKey,
                  });
                }
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesStack}
        options={{ title: 'Můj program' }}
        getId={() => 'FavoritesTab'}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Find the route for the tab we're clicking on
            const targetRoute = state.routes.find((r: any) => r.name === route.name);
            const currentRoute = state.routes[state.index || 0];
            
            // If the target tab has a stack with more than one screen, reset it
            if (targetRoute && targetRoute.state) {
              const stackKey = targetRoute.state.key;
              const stackIndex = targetRoute.state.index || 0;
              
              // Reset stack if it has more than one screen
              if (stackKey && stackIndex > 0) {
                // Get the main screen name for this tab
                const mainScreenName = getMainScreenName(route.name);
                
                if (mainScreenName) {
                  // Always prevent default to avoid showing the current screen first
                  e.preventDefault();
                  
                  // If we're switching from another tab, navigate first
                  if (currentRoute.name !== route.name) {
                    navigation.navigate(route.name as any);
                  }
                  
                  // Reset the stack immediately using CommonActions.reset
                  // This should happen in the same frame as navigation to prevent flicker
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: mainScreenName }],
                    }),
                    target: stackKey,
                  });
                }
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Info" 
        component={InfoStack}
        options={{ title: 'Více' }}
        getId={() => 'InfoTab'}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Find the route for the tab we're clicking on
            const targetRoute = state.routes.find((r: any) => r.name === route.name);
            const currentRoute = state.routes[state.index || 0];
            
            // If the target tab has a stack with more than one screen, reset it
            if (targetRoute && targetRoute.state) {
              const stackKey = targetRoute.state.key;
              const stackIndex = targetRoute.state.index || 0;
              
              // Reset stack if it has more than one screen
              if (stackKey && stackIndex > 0) {
                // Get the main screen name for this tab
                const mainScreenName = getMainScreenName(route.name);
                
                if (mainScreenName) {
                  // Always prevent default to avoid showing the current screen first
                  e.preventDefault();
                  
                  // If we're switching from another tab, navigate first
                  if (currentRoute.name !== route.name) {
                    navigation.navigate(route.name as any);
                  }
                  
                  // Reset the stack immediately using CommonActions.reset
                  // This should happen in the same frame as navigation to prevent flicker
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{ name: mainScreenName }],
                    }),
                    target: stackKey,
                  });
                }
              }
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}
