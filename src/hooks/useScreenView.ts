import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '../services/analytics';

export const useScreenView = (screenName: string) => {
  useFocusEffect(
    useCallback(() => {
      logScreenView(screenName);
    }, [screenName])
  );
};

