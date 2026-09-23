import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../app/ThemeProvider';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ children, scroll = false, style }: ScreenContainerProps) {
  const theme = useTheme();
  const Wrapper = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Wrapper
        style={scroll ? styles.flex : [styles.flex, styles.content]}
        contentContainerStyle={scroll ? [styles.content, style] : undefined}>
        {scroll ? children : <View style={[styles.flex, style]}>{children}</View>}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
});
