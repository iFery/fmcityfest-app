/**
 * Error Boundary component to catch React render errors
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import logoImage from '../../assets/logo.png';

// Lazy import crashlyticsService to avoid Firebase initialization during module import
let crashlyticsService: any = null;
let crashlyticsLoadPromise: Promise<any> | null = null;
const loadCrashlyticsService = () => {
  if (crashlyticsService) {
    return Promise.resolve(crashlyticsService);
  }
  if (!crashlyticsLoadPromise) {
    crashlyticsLoadPromise = import('../services/crashlytics')
      .then((mod) => {
        crashlyticsService = mod.crashlyticsService;
        return crashlyticsService;
      })
      .catch((error) => {
        console.warn('⚠️ [ErrorBoundary.tsx] Failed to load crashlyticsService:', error);
        return null;
      });
  }
  return crashlyticsLoadPromise;
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Crashlytics (lazy loaded)
    loadCrashlyticsService()
      .then((service) => {
        if (service) {
          service.recordError(error);
          service.log(`ErrorBoundary: ${errorInfo.componentStack}`);
        }
      })
      .catch((e) => {
        console.warn('⚠️ [ErrorBoundary] Failed to log to Crashlytics:', e);
      });
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Něco se pokazilo</Text>
          <Text style={styles.message}>
            Omlouváme se za nepříjemnosti. Aplikace narazila na neočekávanou chybu.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Zkusit znovu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#002239',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  message: {
    fontSize: 14,
    color: '#B0C4DE',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 11,
    color: '#7A8FA3',
    fontFamily: 'monospace',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#21AAB0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
