import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../app/ThemeProvider';

interface ScoreChartProps {
  scores: readonly number[];
  height?: number;
}

/**
 * Lightweight dependency-free bar sparkline for Section 37's
 * "Alertness Score theo thời gian" chart — swap for a proper charting lib
 * later if richer interaction (zoom, tooltips) is needed.
 */
export function ScoreChart({ scores, height = 140 }: ScoreChartProps) {
  const theme = useTheme();

  if (scores.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { height }]}>
      {scores.map((score, index) => {
        const barColor =
          score >= 80
            ? theme.colors.normal
            : score >= 65
            ? theme.colors.notice
            : score >= 45
            ? theme.colors.warning
            : theme.colors.stopRecommended;
        return (
          <View key={index} style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                { height: `${Math.max(4, score)}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
});
