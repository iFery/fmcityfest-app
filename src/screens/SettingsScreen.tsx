import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Header from '../components/Header';
import { useFavorites } from '../hooks/useFavorites';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { useArtists } from '../hooks/useArtists';
import { useEvents } from '../hooks/useEvents';
import { useNews } from '../hooks/useNews';
import { usePartners } from '../hooks/usePartners';
import { notificationService } from '../services/notifications';

const HEADER_HEIGHT = 130;

export default function SettingsScreen() {
  const { clearAll } = useFavorites();
  const {
    favoriteArtistsNotifications,
    importantFestivalNotifications,
    setFavoriteArtistsNotifications,
    setImportantFestivalNotifications,
  } = useNotificationPreferencesStore();
  
  const { refetch: refetchArtists } = useArtists();
  const { refetch: refetchEvents } = useEvents();
  const { refetch: refetchNews } = useNews();
  const { refetch: refetchPartners } = usePartners();

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>('');
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  // Zkontroluj oprávnění při návratu na obrazovku (např. po návratu z nastavení)
  useFocusEffect(
    React.useCallback(() => {
      checkNotificationPermission();
    }, [])
  );

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus(status);
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setNotificationPermissionStatus('undetermined');
    }
  };

  const isNotificationEnabled = notificationPermissionStatus === 'granted';

  const handleOpenSystemSettings = async () => {
    try {
      // Nejprve zkus požádat o oprávnění (funguje hlavně na Androidu)
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Oprávnění bylo uděleno
        setNotificationPermissionStatus('granted');
        return;
      }
      
      // Pokud oprávnění nebylo uděleno, otevři systémová nastavení
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Pokud selže požadavek, otevři systémová nastavení
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  };

  const handleClearFavorites = () => {
    setShowClearModal(true);
  };

  const confirmClearFavorites = () => {
    clearAll();
    setShowClearModal(false);
    Alert.alert('Hotovo', 'Můj program byl vymazán');
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([
        refetchArtists(),
        refetchEvents(),
        refetchNews(),
        refetchPartners(),
      ]);
      Alert.alert('Hotovo', 'Data byla obnovena');
    } catch (error) {
      Alert.alert('Chyba', 'Nepodařilo se obnovit data');
    }
  };

  const handleToggleFavoriteArtistsNotifications = async (enabled: boolean) => {
    setFavoriteArtistsNotifications(enabled);
    
    // Zkontroluj oprávnění
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    if (enabled) {
      // Notifikace se automaticky naplánují přes useEffect v useFavorites
      // Můžeme zobrazit potvrzení
      console.log('Artist notifications enabled - will be scheduled for favorite artists');
    } else {
      // Zruš všechny notifikace pro interprety
      await notificationService.cancelAllArtistNotifications();
      console.log('Artist notifications disabled - all artist notifications cancelled');
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="NASTAVENÍ" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Notifikace</Text>
            </View>

            {/* Notification Status Row */}
            <View style={styles.statusRow}>
              <View style={styles.statusContent}>
                <Text style={styles.statusIcon}>
                  {isNotificationEnabled ? '✅' : '🔕'}
                </Text>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusText}>
                    {isNotificationEnabled
                      ? 'Notifikace jsou povolené'
                      : 'Notifikace jsou vypnuté'}
                  </Text>
                </View>
              </View>
              {!isNotificationEnabled && (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleOpenSystemSettings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.settingsButtonText}>Otevřít nastavení</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Favorite Artists Notifications Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Upozornění na oblíbené interprety
                </Text>
                <Text style={styles.settingDescription}>
                  Upozornění 10 minut před začátkem koncertu
                </Text>
              </View>
              <Switch
                value={favoriteArtistsNotifications && isNotificationEnabled}
                onValueChange={handleToggleFavoriteArtistsNotifications}
                disabled={!isNotificationEnabled}
                trackColor={{ false: '#1A3B5A', true: '#EA5178' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#1A3B5A"
              />
            </View>

            {/* Important Festival Notifications Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Důležitá festivalová upozornění
                </Text>
                <Text style={styles.settingDescription}>
                  Změny programu, organizační info a novinky
                </Text>
              </View>
              <Switch
                value={importantFestivalNotifications && isNotificationEnabled}
                onValueChange={setImportantFestivalNotifications}
                disabled={!isNotificationEnabled}
                trackColor={{ false: '#1A3B5A', true: '#EA5178' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#1A3B5A"
              />
            </View>
          </View>

          {/* Můj program Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Můj program</Text>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleClearFavorites}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Vymazat Můj program</Text>
                <Text style={styles.actionDescription}>
                  Odebere všechny uložené interprety
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Festival & data Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="musical-notes-outline" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Festival & data</Text>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleRefreshData}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Obnovit data</Text>
                <Text style={styles.actionDescription}>
                  Načte nejnovější informace o programu a interpretech
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Clear Favorites Confirmation Modal */}
        <Modal
          visible={showClearModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Vymazat Můj program?</Text>
              <Text style={styles.modalMessage}>
                Opravdu chceš odebrat všechny uložené interprety? Tuto akci nelze vrátit zpět.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowClearModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonCancelText}>Zrušit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmClearFavorites}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonConfirmText}>Vymazat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#002239',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#EA5178',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statusRow: {
    backgroundColor: '#0A3652',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    backgroundColor: '#EA5178',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    backgroundColor: '#0A3652',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  actionRow: {
    backgroundColor: '#0A3652',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContent: {
    flex: 1,
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0A3652',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#1A3B5A',
  },
  modalButtonConfirm: {
    backgroundColor: '#EA5178',
  },
  modalButtonCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
