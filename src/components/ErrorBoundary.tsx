/**
 * Error Boundary component to catch React render errors
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Lazy import crashlyticsService to avoid Firebase initialization during module import
let crashlyticsService: any = null;
const getCrashlyticsService = () => {
  if (!crashlyticsService) {
    try {
      crashlyticsService = require('../services/crashlytics').crashlyticsService;
    } catch (error) {
      console.warn('⚠️ [ErrorBoundary.tsx] Failed to load crashlyticsService:', error);
    }
  }
  return crashlyticsService;
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
    try {
      const service = getCrashlyticsService();
      if (service) {
        service.recordError(error);
        service.log(`ErrorBoundary: ${errorInfo.componentStack}`);
      }
    } catch (e) {
      console.warn('⚠️ [ErrorBoundary] Failed to log to Crashlytics:', e);
    }
    
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
