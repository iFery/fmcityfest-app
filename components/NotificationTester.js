import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import {
  areNotificationsEnabled,
  enableNotifications,
  disableNotifications,
  toggleNotifications,
  debugScheduledNotifications,
  scheduleNotificationForArtist
} from '../utils/notificationHelper';

export default function NotificationTester() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    areNotificationsEnabled().then(setEnabled);
  }, []);

  const handleToggle = async () => {
    const result = await toggleNotifications();
    setEnabled(result);
    Alert.alert('Notifikace', result ? 'Notifikace jsou ZAPNUTÉ' : 'Notifikace jsou VYPNUTÉ');
  };

  const handleDebug = async () => {
    await debugScheduledNotifications();
    Alert.alert('Debug', 'Vypsány naplánované notifikace do konzole');
  };

const handleTestNotification = async () => {
  const fakeArtistId = 999;
  const startTime = new Date(Date.now() + 16 * 60 * 1000); // 20 minut do budoucnosti
  const fakeProgramData = [{
    interpret_id: fakeArtistId,
    start: startTime.toISOString(),
    stage_name: 'TEST STAGE'
  }];
  const fakeArtists = [{ id: fakeArtistId, name: 'Testovací interpret' }];
  await scheduleNotificationForArtist(fakeArtistId, fakeArtists, fakeProgramData);
  Alert.alert('✅', 'Testovací notifikace naplánována za 5 minut (vystoupí za 20 min).');
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Test Notifikací</Text>
      <Text style={styles.status}>
        Stav: {enabled ? '✅ Zapnuto' : '❌ Vypnuto'}
      </Text>

      <View style={styles.buttonGroup}>
        <Button title="🔄 Přepnout notifikace" onPress={handleToggle} />
        <Button title="📋 Debug naplánovaných" onPress={handleDebug} />
        <Button title="🚀 Testovací notifikace" onPress={handleTestNotification} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#002239',
    marginTop: 30,
    borderRadius: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 10,
  },
});
