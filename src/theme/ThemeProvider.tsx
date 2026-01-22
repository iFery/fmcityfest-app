import React, { createContext, useContext, ReactNode } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const typography = {
  fontFamily: {
    regular: 'Raleway-Regular',
    medium: 'Raleway-Medium',
    semiBold: 'Raleway-SemiBold',
    bold: 'Raleway-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

interface GlobalStyles {
  heading: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  text: TextStyle;
  caption: TextStyle;
  button: TextStyle;
}

const globalStyles: GlobalStyles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: '#FFF',
  },
  heading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: '#FFF',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: '#FFF',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#FFF',
  },
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#FFF',
  },
  button: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#FFFFFF',
  },
});

interface ThemeContextType {
  globalStyles: GlobalStyles;
}

const ThemeContext = createContext<ThemeContextType>({
  globalStyles,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ globalStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};
