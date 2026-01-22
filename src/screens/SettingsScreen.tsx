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
import { useTheme } from '../theme/ThemeProvider';

const HEADER_HEIGHT = 130;

export default function SettingsScreen() {
  const { clearAll } = useFavorites();
  const {
    favoriteArtistsNotifications,
    importantFestivalNotifications,
    setFavoriteArtistsNotifications,
    setImportantFestivalNotifications,
  } = useNotificationPreferencesStore();

  const { globalStyles } = useTheme();

  const { refetch: refetchArtists } = useArtists();
  const { refetch: refetchEvents } = useEvents();
  const { refetch: refetchNews } = useNews();
  const { refetch: refetchPartners } = usePartners();

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>('');
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

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
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setNotificationPermissionStatus('granted');
        return;
      }

      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
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

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    if (!enabled) {
      await notificationService.cancelAllArtistNotifications();
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
        >
          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={24} color="#EA5178" />
              <Text style={[styles.sectionTitle, globalStyles.heading]}>
                Notifikace
              </Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusContent}>
                <Text style={styles.statusIcon}>
                  {isNotificationEnabled ? '✅' : '🔕'}
                </Text>
                <View style={styles.statusTextContainer}>
                  <Text style={[globalStyles.text, styles.statusText]}>
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
                  <Text style={[globalStyles.heading, styles.settingsButtonText]}>
                    Otevřít nastavení
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={[globalStyles.heading, styles.settingTitle]}>
                  Upozornění na oblíbené interprety
                </Text>
                <Text style={[globalStyles.text, styles.settingDescription]}>
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

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={[globalStyles.heading, styles.settingTitle]}>
                  Důležitá festivalová upozornění
                </Text>
                <Text style={[globalStyles.text, styles.settingDescription]}>
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

          {/* Můj program */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={24} color="#EA5178" />
              <Text style={[globalStyles.heading, styles.sectionTitle ]}>
                Můj program
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleClearFavorites}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <Text style={[globalStyles.heading, styles.actionTitle]}>
                  Vymazat Můj program
                </Text>
                <Text style={[globalStyles.text, styles.actionDescription]}>
                  Odebere všechny uložené interprety
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Festival & data */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="musical-notes-outline" size={24} color="#EA5178" />
              <Text style={[styles.sectionTitle, globalStyles.heading]}>
                Festival & data
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleRefreshData}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <Text style={[globalStyles.heading, styles.actionTitle]}>
                  Obnovit data
                </Text>
                <Text style={[globalStyles.subtitle, styles.actionDescription]}>
                  Načte nejnovější informace o programu a interpretech
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showClearModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[globalStyles.heading, styles.modalTitle]}>
                Vymazat Můj program?
              </Text>
              <Text style={[globalStyles.text, styles.modalMessage]}>
                Opravdu chceš odebrat všechny uložené interprety? Tuto akci nelze vrátit zpět.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowClearModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[globalStyles.heading, styles.modalButtonCancelText]}>
                    Zrušit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmClearFavorites}
                  activeOpacity={0.7}
                >
                  <Text style={[globalStyles.heading, styles.modalButtonConfirmText]}>
                    Vymazat
                  </Text>
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
  statusText: {},
  settingsButton: {
    backgroundColor: '#EA5178',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settingsButtonText: {},
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
    marginBottom: 4,
  },
  settingDescription: {},
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
    marginBottom: 4,
  },
  actionDescription: {},
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
    marginBottom: 12,
  },
  modalMessage: {
    marginBottom: 24,
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
  modalButtonCancelText: {},
  modalButtonConfirmText: {},
});