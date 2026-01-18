/**
 * Hook for monitoring network status
 * Provides reactive network connectivity state
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

/**
 * Hook to monitor network connectivity
 * Returns current network status and allows checking connectivity
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
  });

  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
    });
  }, []);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateNetworkStatus);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    return () => {
      unsubscribe();
    };
  }, [updateNetworkStatus]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    updateNetworkStatus(state);
    return state.isInternetReachable ?? false;
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    checkConnectivity,
  };
}




