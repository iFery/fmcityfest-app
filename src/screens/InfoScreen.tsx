import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/linking';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';

type InfoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InfoMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  onLongPress?: () => void;
}

const HEADER_HEIGHT = 130;

export default function InfoScreen() {
  const navigation = useNavigation<InfoScreenNavigationProp>();
  const { globalStyles } = useTheme();
  const [showHiddenItems, setShowHiddenItems] = useState(false);

  const baseMenuItems: InfoMenuItem[] = [
    {
      id: 'faq',
      title: 'Časté dotazy',
      icon: 'help-circle',
      onPress: () => navigation.navigate('FAQ'),
      color: '#21AAB0',
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
      color: '#21AAB0',
    },
    {
      id: 'settings',
      title: 'Nastavení',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
      color: '#21AAB0',
    },
    {
      id: 'about',
      title: 'O aplikaci',
      icon: 'information-circle',
      onPress: () => navigation.navigate('AboutApp'),
      color: '#21AAB0',
    },
    {
      id: 'feedback',
      title: 'Zpětná vazba',
      icon: 'chatbox-ellipses',
      onPress: () => navigation.navigate('Feedback'),
      onLongPress: () => setShowHiddenItems(true),
      color: '#21AAB0',
    },
  ];

  const hiddenMenuItems: InfoMenuItem[] = [
    {
      id: 'notifications',
      title: 'Notifikace',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications'),
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

  const menuItems = showHiddenItems
    ? [...baseMenuItems, ...hiddenMenuItems]
    : baseMenuItems;

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
                onLongPress={item.onLongPress}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={24} color={item.color || '#21AAB0'} />
                <Text style={[globalStyles.heading, styles.menuItemTitle]}>
                  {item.title}
                </Text>
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