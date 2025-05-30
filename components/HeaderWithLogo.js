import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';

export default function Header({ title }) {
  return (
    <ImageBackground
      source={require('../assets/background-top.png')}
      style={styles.headerBackground}
      resizeMode="cover"
    >
      <View style={styles.headerContent}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.splitline} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    width: '100%',
  },
  headerContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 20,
  },
  logo: {
    width: 45,
    height: 45,
  },
  titleWrapper: {
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTitle: {
    color: 'white',
    fontSize: 31,
    fontWeight: '800',
    marginTop: 20,
  },
  splitline: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF40',
    marginTop: 24,
    marginBottom: 24,
  },
});
