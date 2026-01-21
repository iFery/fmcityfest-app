import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/linking';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

type InfoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InfoMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}

const HEADER_HEIGHT = 130;

export default function InfoScreen() {
  const navigation = useNavigation<InfoScreenNavigationProp>();

  const menuItems: InfoMenuItem[] = [
    {
      id: 'faq',
      title: 'Časté dotazy',
      icon: 'help-circle',
      onPress: () => navigation.navigate('FAQ'),
      color: '#EA5178',
    },
    {
      id: 'map',
      title: 'Mapa',
      icon: 'map',
      onPress: () => navigation.navigate('Map'),
      color: '#21AAB0',
    },
    {
      id: 'partners',
      title: 'Partneři',
      icon: 'people-circle',
      onPress: () => navigation.navigate('Partners'),
      color: '#21AAB0',
    },
    {
      id: 'news',
      title: 'Novinky',
      icon: 'newspaper',
      onPress: () => navigation.navigate('News'),
      color: '#EA5178',
    },
    {
      id: 'notifications',
      title: 'Notifikace',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications'),
      color: '#21AAB0',
    },
    {
      id: 'settings',
      title: 'Nastavení',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
      color: '#666',
    },
    {
      id: 'debug',
      title: 'Debug',
      icon: 'bug',
      onPress: () => navigation.navigate('Debug'),
      color: '#666',
    },
  ];

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="VÍCE" />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={item.icon} 
                  size={24} 
                  color="#21AAB0" 
                />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <View style={styles.spacer} />
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  spacer: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#1a3a5a',
    marginLeft: 0,
  },
});