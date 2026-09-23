import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { AlertRepository, SessionRepository } from '../../repositories';
import { AlertEvent, AlertLevel, MonitoringSession } from '../../models';
import { formatDuration } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

function countByLevel(alerts: AlertEvent[], level: AlertLevel): number {
  return alerts.filter(a => a.level === level).length;
}

export function SessionSummaryScreen({ navigation, route }: Props) {
  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  useEffect(() => {
    SessionRepository.getById(route.params.sessionId).then(setSession);
    AlertRepository.listBySession(route.params.sessionId).then(setAlerts);
  }, [route.params.sessionId]);

  const durationSeconds =
    session?.endTime && session.startTime
      ? Math.max(0, Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000))
      : 0;

  return (
    <ScreenContainer scroll>
      <AppText variant="title" style={styles.title}>
        CUỘC VUI ĐÃ KẾT THÚC
      </AppText>

      <Card style={styles.card}>
        <SummaryRow label="Thời lượng" value={formatDuration(durationSeconds)} />
        <SummaryRow label="Mức đầu phiên" value={`${session?.initialScore ?? '--'}`} />
        <SummaryRow label="Mức thấp nhất" value={`${session?.lowestScore ?? '--'}`} />
        <SummaryRow label="Mức cuối phiên" value={`${session?.finalScore ?? '--'}`} />
      </Card>

      <Card style={styles.card}>
        <SummaryRow label="Cảnh báo nhẹ" value={`${countByLevel(alerts, AlertLevel.NOTICE)}`} />
        <SummaryRow label="Cảnh báo nghỉ uống" value={`${countByLevel(alerts, AlertLevel.WARNING)}`} />
        <SummaryRow
          label="Cảnh báo dừng uống"
          value={`${countByLevel(alerts, AlertLevel.STOP_RECOMMENDED)}`}
        />
      </Card>

      <AppButton
        label="Xem chi tiết"
        onPress={() => navigation.navigate('SessionDetail', { sessionId: route.params.sessionId })}
        style={styles.action}
      />
      <AppButton
        label="Về trang chủ"
        variant="secondary"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        style={styles.secondary}
      />
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <AppText variant="body" style={styles.row}>
      {label}
      {'  '}
      <AppText variant="subtitle" color={theme.colors.textPrimary}>
        {value}
      </AppText>
    </AppText>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center' },
  card: { marginTop: 16 },
  row: { marginTop: 8 },
  action: { marginTop: 32 },
  secondary: { marginTop: 12 },
});
