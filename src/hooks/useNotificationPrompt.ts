/**
 * Hook for managing notification prompt display logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';
import { notificationRegistrationService } from '../services/notificationRegistration';
import { useNotificationPromptStore } from '../stores/notificationPromptStore';

const TIME_TO_SHOW_MS = 5000; // 5 seconds

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
  const { setPromptShown, shouldShowPrompt, resetDaily } = useNotificationPromptStore();
  const timeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDetectedRef = useRef(false);
  const hasShownRef = useRef(false);

  // Check permission status při mountu
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
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
      }
    }, 1000); // Kontroluj každou sekundu

    return () => clearInterval(interval);
  }, [permissionStatus]);

  // Reset daily check
  useEffect(() => {
    resetDaily();
  }, [resetDaily]);

  // Show prompt logic (time-based)
  useEffect(() => {
    if (!options.enabled || options.triggerOnScroll) {
      return;
    }

    if (hasShownRef.current) {
      return;
    }

    // Don't show if already granted
    if (permissionStatus === 'granted') {
      return;
    }

    // Check if should show prompt
    if (!shouldShowPrompt()) {
      return;
    }

    // Show after timeout
    timeRef.current = setTimeout(() => {
      if (!hasShownRef.current) {
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
  }, [options.enabled, options.triggerOnScroll, permissionStatus, shouldShowPrompt, setPromptShown]);

  const handleAccept = useCallback(async () => {
    setShowPrompt(false);
    
    // Request system permission
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        // Get token
        await notificationService.getToken();
        await notificationRegistrationService.syncImportantFestivalRegistration();
        // Aktualizuj permission status, aby se modal nezobrazoval znovu
        setPermissionStatus('granted');
      } else {
        // Aktualizuj i když nebylo povoleno, aby se nezkoušelo znovu
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setPromptShown(true); // Mark as shown today
  }, [setPromptShown]);

  // Scroll handler
  const onScroll = useCallback(
    (event: any) => {
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
        return;
      }

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
          setShowPrompt(true);
          setPromptShown(true);
          hasShownRef.current = true;
        }
      })();
    },
    [options.enabled, options.triggerOnScroll, permissionStatus, shouldShowPrompt, setPromptShown]
  );

  return {
    showPrompt,
    handleAccept,
    handleDismiss,
    onScroll,
  };
}
