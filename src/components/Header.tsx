/**
 * Header component for screens
 * Used for consistent header styling across the app
 */

import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  // Fallback if background image doesn't exist
  const backgroundImage = require('../../assets/background-top.png');

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.headerBackground}
      resizeMode="cover"
    >
      <View style={styles.headerContent}>
        <View style={styles.titleWrapper}>
          <Text
            style={[
              styles.headerTitle,
              title?.length > 22 && styles.headerTitleSmall,
            ]}
          >
            {title}
          </Text>
          <View style={styles.splitline} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    width: '100%',
    height: 130,
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTitle: {
    color: 'white',
    fontSize: 31,
    fontWeight: '800',
  },
  headerTitleSmall: {
    fontSize: 22,
  },
  splitline: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF40',
    marginTop: 24,
    marginBottom: 24,
  },
});






