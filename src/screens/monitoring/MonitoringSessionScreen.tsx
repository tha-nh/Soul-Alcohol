import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../app/ThemeProvider';
import { formatDuration } from '../../utils/format';
import { SessionManager, useMonitoringSession } from '../../domain/session';

type Props = NativeStackScreenProps<RootStackParamList, 'MonitoringSession'>;

// Section 32 UI, driven by the Mock Alertness Engine (Phase 7) in
// DEV_SIMULATION_MODE — real sensors/AI replace the score source in
// Phase 9-13 without this screen changing.
export function MonitoringSessionScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const {
    session,
    elapsedSeconds,
    alertnessScore,
    alertLevel,
    confidenceScore,
    statusLabel,
    pendingAlert,
    clearPendingAlert,
    finalizeResult,
  } = useMonitoringSession(route.params.sessionId);

  useEffect(() => {
    if (pendingAlert) {
      navigation.navigate('Alert', { sessionId: route.params.sessionId, level: pendingAlert.level });
      clearPendingAlert();
    }
  }, [pendingAlert, clearPendingAlert, navigation, route.params.sessionId]);

  const handleEnd = useCallback(async () => {
    if (!session) {
      return;
    }
    await SessionManager.complete(session, finalizeResult());
    navigation.replace('SessionSummary', { sessionId: session.id });
  }, [navigation, session, finalizeResult]);

  return (
    <ScreenContainer>
      <AppText variant="subtitle" color={theme.colors.textSecondary} style={styles.header}>
        CUỘC VUI ĐANG DIỄN RA
      </AppText>
      <AppText variant="title" style={styles.timer}>
        {formatDuration(elapsedSeconds)}
      </AppText>

      <View style={styles.scoreBlock}>
        <AppText variant="display">{alertnessScore}</AppText>
        <AppText variant="body" color={theme.colors.textMuted}>
          /100
        </AppText>
      </View>

      <View style={styles.badgeBlock}>
        <StatusBadge level={alertLevel} />
      </View>

      <View style={styles.metricsBlock}>
        <MetricRow label="Giọng nói" value={statusLabel} />
        <MetricRow label="Chuyển động" value={statusLabel} />
        <MetricRow label="Độ tin cậy" value={`${confidenceScore}%`} />
      </View>

      <AppButton
        label="KẾT THÚC CUỘC VUI"
        variant="danger"
        onPress={handleEnd}
        disabled={!session}
        style={styles.action}
      />
    </ScreenContainer>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metricRow}>
      <AppText variant="body" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="subtitle">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { textAlign: 'center', marginTop: 8 },
  timer: { textAlign: 'center', marginTop: 8 },
  scoreBlock: { alignItems: 'center', marginTop: 32 },
  badgeBlock: { alignItems: 'center', marginTop: 16 },
  metricsBlock: { marginTop: 40 },
  metricRow: { marginTop: 16 },
  action: { marginTop: 48 },
});
