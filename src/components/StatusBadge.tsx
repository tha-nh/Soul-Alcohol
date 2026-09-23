import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertLevel } from '../models';
import { useTheme } from '../app/ThemeProvider';
import { AppText } from './AppText';

const CONFIG: Record<AlertLevel, { label: string; glyph: string }> = {
  [AlertLevel.NORMAL]: { label: 'Ổn định', glyph: '●' },
  [AlertLevel.NOTICE]: { label: 'Có dấu hiệu thay đổi', glyph: '▲' },
  [AlertLevel.WARNING]: { label: 'Nên nghỉ', glyph: '■' },
  [AlertLevel.STOP_RECOMMENDED]: { label: 'Nên dừng uống', glyph: '✕' },
};

const COLOR_KEY: Record<AlertLevel, 'normal' | 'notice' | 'warning' | 'stopRecommended'> = {
  [AlertLevel.NORMAL]: 'normal',
  [AlertLevel.NOTICE]: 'notice',
  [AlertLevel.WARNING]: 'warning',
  [AlertLevel.STOP_RECOMMENDED]: 'stopRecommended',
};

interface StatusBadgeProps {
  level: AlertLevel;
}

// Status is conveyed by glyph + label together with color, never color alone (Section 54).
export function StatusBadge({ level }: StatusBadgeProps) {
  const theme = useTheme();
  const { label, glyph } = CONFIG[level];
  const color = theme.colors[COLOR_KEY[level]];

  return (
    <View style={styles.row}>
      <AppText variant="subtitle" color={color} style={styles.glyph}>
        {glyph}
      </AppText>
      <AppText variant="subtitle" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glyph: {
    fontSize: 16,
  },
});
