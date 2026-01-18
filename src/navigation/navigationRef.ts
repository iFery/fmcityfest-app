/**
 * Navigation reference
 * Separated to avoid circular dependencies
 */

import React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './linking';

// Export navigation ref for use outside React components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();






