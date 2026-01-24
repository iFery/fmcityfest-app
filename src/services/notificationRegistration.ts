import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationService } from './notifications';
import { notificationTokensApi, type NotificationTokenPayload } from '../api/endpoints';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { getAppConfig } from '../config/environment';
import { crashlyticsService } from './crashlytics';

type ImportantAlertsEnvironment = 'DEV' | 'PROD';

class NotificationRegistrationService {
  private lastPayloadKey: string | null = null;

  private getEnvironmentValue(): ImportantAlertsEnvironment {
    const { isProduction } = getAppConfig();
    return isProduction ? 'PROD' : 'DEV';
  }

  async syncImportantFestivalRegistration(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      const systemEnabled = status === 'granted';
      const appEnabled = useNotificationPreferencesStore.getState().importantFestivalNotifications;

      const token = await notificationService.getToken();
      if (!token) {
        return;
      }

      const payload: NotificationTokenPayload = {
        fcm_token: token,
        environment: this.getEnvironmentValue(),
        system_enabled: systemEnabled,
        app_enabled: appEnabled,
        active_for_important_alerts: systemEnabled && appEnabled,
        platform: Platform.OS,
        device_name: Constants.deviceName || undefined,
        app_version: Constants.expoConfig?.version || undefined,
        build_number:
          Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || undefined,
      };

      const payloadKey = JSON.stringify(payload);
      if (payloadKey === this.lastPayloadKey) {
        return;
      }

      this.lastPayloadKey = payloadKey;
      await notificationTokensApi.upsert(payload);
    } catch (error) {
      console.error('Error syncing important festival notifications:', error);
      crashlyticsService.recordError(
        error instanceof Error ? error : new Error('Notification registration sync failed')
      );
    }
  }
}

export const notificationRegistrationService = new NotificationRegistrationService();
