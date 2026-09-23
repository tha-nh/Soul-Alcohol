import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../app/ThemeProvider';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { VoiceBaselineScreen } from '../screens/baseline/VoiceBaselineScreen';
import { MotionBaselineScreen } from '../screens/baseline/MotionBaselineScreen';
import { BaselineStatusScreen } from '../screens/baseline/BaselineStatusScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { StartSessionScreen } from '../screens/monitoring/StartSessionScreen';
import { MonitoringSessionScreen } from '../screens/monitoring/MonitoringSessionScreen';
import { SessionSummaryScreen } from '../screens/monitoring/SessionSummaryScreen';
import { AlertScreen } from '../screens/alerts/AlertScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SessionDetailScreen } from '../screens/history/SessionDetailScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialRouteName: keyof RootStackParamList;
}

export function RootNavigator({ initialRouteName }: RootNavigatorProps) {
  const theme = useTheme();
  const navigationTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="VoiceBaseline" component={VoiceBaselineScreen} />
        <Stack.Screen name="MotionBaseline" component={MotionBaselineScreen} />
        <Stack.Screen name="BaselineStatus" component={BaselineStatusScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StartSession" component={StartSessionScreen} />
        <Stack.Screen name="MonitoringSession" component={MonitoringSessionScreen} />
        <Stack.Screen
          name="Alert"
          component={AlertScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
