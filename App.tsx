/**
 * WidgetCraft - Main Application Entry
 * Premium widget designer with Material You theming
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@theme/index';
import { SplashScreen } from '@screens/index';
import { RootNavigator } from '@navigation/RootNavigator';
import { loadHapticsSetting } from '@utils/HapticService';

// ============================================
// Main App Content Component
// ============================================

const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Load haptic preference from storage on mount
  useEffect(() => {
    loadHapticsSetting();
  }, []);

  if (!isReady) {
    return <SplashScreen onFinish={() => setIsReady(true)} />;
  }
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
