/**
 * Hook for managing notification prompt display logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';
import { notificationRegistrationService } from '../services/notificationRegistration';
import { useNotificationPromptStore } from '../stores/notificationPromptStore';

const TIME_TO_SHOW_MS = 5000; // 5 seconds

const logPromptDebug = (...args: unknown[]) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[NotificationPrompt]', ...args);
  }
};

interface UseNotificationPromptOptions {
  enabled: boolean; // Whether prompt should be enabled on this screen
  triggerOnScroll?: boolean; // Show on scroll instead of time
}

interface UseNotificationPromptResult {
  showPrompt: boolean;
  handleAccept: () => Promise<void>;
  handleDismiss: () => void;
  onScroll: (event: any) => void;
}

/**
 * Hook to manage notification prompt display
 */
export function useNotificationPrompt(
  options: UseNotificationPromptOptions = { enabled: false, triggerOnScroll: false }
): UseNotificationPromptResult {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const { setPromptShown, shouldShowPrompt } = useNotificationPromptStore();
  const timeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDetectedRef = useRef(false);
  const hasShownRef = useRef(false);
  const storeBlockedRef = useRef(false);
  const [promptStoreHydrated, setPromptStoreHydrated] = useState(() => {
    return useNotificationPromptStore.persist?.hasHydrated?.() ?? false;
  });

  useEffect(() => {
    const handleHydration = () => {
      logPromptDebug('Store hydration finished', {
        notificationPromptShown: useNotificationPromptStore.getState().notificationPromptShown,
      });
      setPromptStoreHydrated(true);
    };

    const unsub = useNotificationPromptStore.persist?.onFinishHydration?.(handleHydration);

    if (useNotificationPromptStore.persist?.hasHydrated?.()) {
      handleHydration();
    }

    return () => {
      unsub?.();
    };
  }, []);

  // Check permission status při mountu
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      logPromptDebug('Initial permission status fetched', { status });
    };
    checkPermission();
  }, []);

  // Periodicky kontroluj permission status, aby se aktualizoval i když bylo povoleno jinde
  // Toto zajistí, že se modal nezobrazí znovu, pokud už bylo permission povoleno
  useEffect(() => {
    if (permissionStatus === 'granted') {
      return; // Už je povoleno, není potřeba kontrolovat
    }

    const interval = setInterval(async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        logPromptDebug('Permission became granted via polling interval');
      }
    }, 1000); // Kontroluj každou sekundu

    return () => clearInterval(interval);
  }, [permissionStatus]);

  // Show prompt logic (time-based)
  useEffect(() => {
    if (!promptStoreHydrated) {
      logPromptDebug('Time-based prompt skipped: store not hydrated yet');
      return;
    }

    if (!options.enabled || options.triggerOnScroll) {
      logPromptDebug('Time-based prompt disabled for this screen', {
        enabled: options.enabled,
        triggerOnScroll: options.triggerOnScroll,
      });
      return;
    }

    if (hasShownRef.current) {
      logPromptDebug('Prompt already shown during this session (time-based)');
      return;
    }

    // Don't show if already granted
    if (permissionStatus === 'granted') {
      logPromptDebug('Time-based prompt skipped: permission already granted');
      return;
    }

    // Check if should show prompt
    const canShowPrompt = shouldShowPrompt();
    logPromptDebug('Time-based prompt evaluation', {
      canShowPrompt,
      permissionStatus,
    });

    if (!canShowPrompt) {
      return;
    }

    storeBlockedRef.current = false;

    // Show after timeout
    timeRef.current = setTimeout(() => {
      if (!hasShownRef.current) {
        logPromptDebug('Opening prompt via timer');
        setShowPrompt(true);
        setPromptShown(true);
        hasShownRef.current = true;
      }
    }, TIME_TO_SHOW_MS);

    return () => {
      if (timeRef.current) {
        clearTimeout(timeRef.current);
      }
    };
  }, [options.enabled, options.triggerOnScroll, permissionStatus, shouldShowPrompt, setPromptShown, promptStoreHydrated]);

  const handleAccept = useCallback(async () => {
    logPromptDebug('handleAccept invoked');
    setShowPrompt(false);
    
    // Request system permission
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        logPromptDebug('User granted notification permission from prompt');
        // Get token
        await notificationService.getToken();
        await notificationRegistrationService.syncImportantFestivalRegistration();
        // Aktualizuj permission status, aby se modal nezobrazoval znovu
        setPermissionStatus('granted');
      } else {
        logPromptDebug('User denied notification permission from prompt');
        // Aktualizuj i když nebylo povoleno, aby se nezkoušelo znovu
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    logPromptDebug('handleDismiss invoked - user chose Maybe later');
    setShowPrompt(false);
    setPromptShown(true); // Remember that the prompt already appeared
  }, [setPromptShown]);

  // Scroll handler
  const onScroll = useCallback(
    (event: any) => {
      if (!promptStoreHydrated) {
        return;
      }

      if (!options.enabled || !options.triggerOnScroll) {
        return;
      }

      if (scrollDetectedRef.current || hasShownRef.current) {
        return;
      }

      // Extrahuj scrollY před async operací, aby se předešlo problému s event poolingem
      const scrollY = event?.nativeEvent?.contentOffset?.y || 0;
      
      // Pokud scroll není dostatečný, ukonči hned
      if (scrollY <= 50) {
        return;
      }

      // Don't show if already granted (rychlá kontrola před async operací)
      if (permissionStatus === 'granted') {
        return;
      }

      // Check if should show prompt (synchronní kontrola)
      if (!shouldShowPrompt()) {
        if (!storeBlockedRef.current) {
          logPromptDebug('Scroll prompt blocked by store flag');
          storeBlockedRef.current = true;
        }
        return;
      }

      storeBlockedRef.current = false;

      // Asynchronně zkontroluj aktuální permission status
      // Toto zajistí, že se modal nezobrazí, pokud už bylo permission povoleno
      (async () => {
        const { status: currentStatus } = await Notifications.getPermissionsAsync();
        if (currentStatus === 'granted') {
          setPermissionStatus('granted');
          return;
        }

        // Pokud permission není povoleno a scroll je dostatečný, zobraz modal
        if (scrollY > 50 && !scrollDetectedRef.current && !hasShownRef.current) {
          scrollDetectedRef.current = true;
          logPromptDebug('Opening prompt via scroll trigger', { scrollY });
          setShowPrompt(true);
          setPromptShown(true);
          hasShownRef.current = true;
        }
      })();
    },
    [options.enabled, options.triggerOnScroll, permissionStatus, shouldShowPrompt, setPromptShown, promptStoreHydrated]
  );

  return {
    showPrompt,
    handleAccept,
    handleDismiss,
    onScroll,
  };
}
