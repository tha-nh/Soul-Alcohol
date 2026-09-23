import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../app/ThemeProvider';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ style, children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
