/**
 * Soul Alcohol
 * @format
 */

import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/app/ThemeProvider';
import { useAppBootstrap } from './src/app/useAppBootstrap';
import { RootNavigator } from './src/navigation/RootNavigator';

function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />;
}

function AppContent() {
  const theme = useTheme();
  const { loading, initialRoute } = useAppBootstrap();

  if (loading) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <RootNavigator initialRouteName={initialRoute} />;
}

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});

export default App;
