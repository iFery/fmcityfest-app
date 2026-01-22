/**
 * Centralized feedback logic for favorites (toasts + notification permission flow)
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { navigate } from '../navigation/AppNavigator';

type PromptStyle = 'modal' | 'toast-action';

interface UseFavoriteFeedbackOptions {
  promptStyle?: PromptStyle;
}

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface FavoriteFeedbackResult {
  toastVisible: boolean;
  toastMessage: string;
  toastDuration: number;
  toastAction?: ToastAction;
  permissionModalVisible: boolean;
  hideToast: () => void;
  handleFavoriteAdded: (label: string) => Promise<void>;
  handleFavoriteRemoved: (label: string) => Promise<void>;
  handlePermissionAccept: () => Promise<void>;
  handlePermissionDismiss: () => void;
}

export function useFavoriteFeedback(
  options: UseFavoriteFeedbackOptions = { promptStyle: 'modal' }
): FavoriteFeedbackResult {
  const promptStyle = options.promptStyle ?? 'modal';
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastDuration, setToastDuration] = useState(2500);
  const [toastAction, setToastAction] = useState<ToastAction | undefined>(undefined);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const pendingAddRef = useRef<{ label: string } | null>(null);
  const { favoriteArtistsNotifications } = useNotificationPreferencesStore();

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const showToast = useCallback((message: string, duration = 2500, action?: ToastAction) => {
    setToastMessage(message);
    setToastDuration(duration);
    setToastAction(action);
    setToastVisible(true);
  }, []);

  const requestSystemPermission = useCallback(async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      await notificationService.getToken();
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }, []);

  const messageBuilders = useMemo(
    () => ({
      addedGranted: (label: string) =>
        `🎶 ${label} je v Mém programu – připomeneme ti ho před koncertem.`,
      addedDenied: (label: string) =>
        `${label} uložen. Zapni notifikace, ať ho nezmeškáš.`,
      removedGranted: (label: string) =>
        `${label} odebrán – upozornění zrušeno.`,
      removedDenied: (label: string) =>
        `${label} odebrán z programu.`,
    }),
    []
  );

  const handleFavoriteAdded = useCallback(
    async (label: string) => {
      const safeLabel = label?.trim() || 'Interpret';
      const { status } = await Notifications.getPermissionsAsync();
      const notificationsEnabled = status === 'granted' && favoriteArtistsNotifications;

      if (notificationsEnabled) {
        showToast(messageBuilders.addedGranted(safeLabel), 2500);
        return;
      }

      if (status === 'granted' && !favoriteArtistsNotifications) {
        showToast(
          messageBuilders.addedDenied(safeLabel),
          4000,
          {
            label: 'Přejít do nastavení',
            onPress: () => navigate('Settings'),
          }
        );
        return;
      }

      if (promptStyle === 'modal') {
        pendingAddRef.current = { label: safeLabel };
        setPermissionModalVisible(true);
        return;
      }

      showToast(
        messageBuilders.addedDenied(safeLabel),
        4000,
        {
          label: 'Povolit notifikace',
          onPress: async () => {
            const nextStatus = await requestSystemPermission();
            if (nextStatus === 'granted' && favoriteArtistsNotifications) {
              showToast(messageBuilders.addedGranted(safeLabel), 2500);
            } else if (nextStatus === 'granted' && !favoriteArtistsNotifications) {
              showToast(
                messageBuilders.addedDenied(safeLabel),
                4000,
                {
                  label: 'Přejít do nastavení',
                  onPress: () => navigate('Settings'),
                }
              );
            } else {
              showToast(messageBuilders.addedDenied(safeLabel), 2500);
            }
          },
        }
      );
    },
    [favoriteArtistsNotifications, messageBuilders, promptStyle, requestSystemPermission, showToast]
  );

  const handleFavoriteRemoved = useCallback(
    async (label: string) => {
      const safeLabel = label?.trim() || 'Interpret';
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted' && favoriteArtistsNotifications) {
        showToast(messageBuilders.removedGranted(safeLabel), 2500);
      } else {
        showToast(messageBuilders.removedDenied(safeLabel), 2500);
      }
    },
    [favoriteArtistsNotifications, messageBuilders, showToast]
  );

  const handlePermissionAccept = useCallback(async () => {
    setPermissionModalVisible(false);
    const status = await requestSystemPermission();
    if (promptStyle === 'modal' && pendingAddRef.current) {
      const { label } = pendingAddRef.current;
      if (status === 'granted' && favoriteArtistsNotifications) {
        showToast(messageBuilders.addedGranted(label), 2500);
      } else if (status === 'granted' && !favoriteArtistsNotifications) {
        showToast(
          messageBuilders.addedDenied(label),
          4000,
          {
            label: 'Přejít do nastavení',
            onPress: () => navigate('Settings'),
          }
        );
      } else {
        showToast(messageBuilders.addedDenied(label), 2500);
      }
      pendingAddRef.current = null;
    }
  }, [favoriteArtistsNotifications, messageBuilders, promptStyle, requestSystemPermission, showToast]);

  const handlePermissionDismiss = useCallback(() => {
    setPermissionModalVisible(false);
    if (promptStyle === 'modal' && pendingAddRef.current) {
      const { label } = pendingAddRef.current;
      showToast(messageBuilders.addedDenied(label), 2500);
      pendingAddRef.current = null;
    }
  }, [messageBuilders, promptStyle, showToast]);

  return {
    toastVisible,
    toastMessage,
    toastDuration,
    toastAction,
    permissionModalVisible,
    hideToast,
    handleFavoriteAdded,
    handleFavoriteRemoved,
    handlePermissionAccept,
    handlePermissionDismiss,
  };
}
