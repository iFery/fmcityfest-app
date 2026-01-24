import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import { linking, type RootStackParamList } from './linking';
import { navigationRef } from './navigationRef';
import { navigationQueue } from './navigationQueue';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#002239',
    card: '#002239',
  },
};

export type { RootStackParamList };

export { navigationRef };

/**
 * Type-safe navigation function
 * Note: React Navigation's type system has limitations, but we maintain type safety
 * at the function signature level while using type assertions internally
 */
export function navigate(name: 'HomeMain'): void;
export function navigate(name: 'ProgramMain'): void;
export function navigate(name: 'ProgramHorizontal'): void;
export function navigate(name: 'ArtistsMain'): void;
export function navigate(name: 'FavoritesMain'): void;
export function navigate(name: 'InfoMain'): void;
export function navigate(name: 'ArtistDetail', params: { artistId: string; artistName: string }): void;
export function navigate(name: 'Settings'): void;
export function navigate(name: 'Partners'): void;
export function navigate(name: 'News'): void;
export function navigate(name: 'NewsDetail', params: { newsId: string; newsTitle: string }): void;
export function navigate(name: 'FAQ'): void;
export function navigate(name: 'AboutApp'): void;
export function navigate(name: 'Feedback'): void;
export function navigate(name: 'SharedProgram', params: { code: string }): void;
export function navigate(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): void {
  // Use queue system to ensure navigation is ready
  navigationQueue.enqueue(name, params);
}

export default function AppNavigator() {
  // Mark navigation as ready when container is mounted
  useEffect(() => {
    // Small delay to ensure navigation container is fully initialized
    const timer = setTimeout(() => {
      navigationQueue.setReady();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleReady = () => {
    // Navigation container is ready, drain any queued actions
    navigationQueue.setReady();
  };

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking as LinkingOptions<RootStackParamList>}
      theme={navTheme}
      onReady={handleReady}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}
