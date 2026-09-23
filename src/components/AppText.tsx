import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../app/ThemeProvider';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'button';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  children: React.ReactNode;
}

export function AppText({ variant = 'body', color, style, children, ...rest }: AppTextProps) {
  const theme = useTheme();
  const variantStyle = theme.typography[variant] as TextStyle;

  return (
    <Text
      style={[variantStyle, { color: color ?? theme.colors.textPrimary }, style]}
      {...rest}>
      {children}
    </Text>
  );
}
