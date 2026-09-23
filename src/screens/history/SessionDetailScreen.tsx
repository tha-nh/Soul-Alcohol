import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ScoreChart } from '../../components/ScoreChart';
import { useTheme } from '../../app/ThemeProvider';
import { AlertRepository, AnalysisResultRepository, SessionRepository } from '../../repositories';
import { AlertEvent, AlertnessResult, MonitoringSession } from '../../models';
import { formatDuration } from '../../utils/format';
import { alertShortLabel } from '../../domain/alertness';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

interface TimelineEntry {
  time: string;
  label: string;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function SessionDetailScreen({ route }: Props) {
  const theme = useTheme();
  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [results, setResults] = useState<AlertnessResult[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  useEffect(() => {
    SessionRepository.getById(route.params.sessionId).then(setSession);
    AnalysisResultRepository.listBySession(route.params.sessionId).then(setResults);
    AlertRepository.listBySession(route.params.sessionId).then(setAlerts);
  }, [route.params.sessionId]);

  const durationSeconds =
    session?.endTime && session?.startTime
      ? Math.max(0, Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000))
      : 0;

  const timeline: TimelineEntry[] = [
    ...(session ? [{ time: timeLabel(session.startTime), label: 'Bắt đầu' }] : []),
    ...alerts.map(a => ({ time: timeLabel(a.timestamp), label: alertShortLabel(a.level) })),
    ...(session?.endTime ? [{ time: timeLabel(session.endTime), label: 'Kết thúc' }] : []),
  ];

  return (
    <ScreenContainer scroll>
      <AppText variant="title">Chi tiết session</AppText>

      <Card style={styles.card}>
        <DetailRow label="Thời gian bắt đầu" value={session ? timeLabel(session.startTime) : '--'} />
        <DetailRow
          label="Thời gian kết thúc"
          value={session?.endTime ? timeLabel(session.endTime) : '--'}
        />
        <DetailRow label="Tổng thời lượng" value={formatDuration(durationSeconds)} />
        <DetailRow label="Initial score" value={`${session?.initialScore ?? '--'}`} />
        <DetailRow label="Lowest score" value={`${session?.lowestScore ?? '--'}`} />
        <DetailRow label="Final score" value={`${session?.finalScore ?? '--'}`} />
        <DetailRow
          label="Highest alert level"
          value={session?.maxAlertLevel ? alertShortLabel(session.maxAlertLevel) : '--'}
        />
      </Card>

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Alertness Score theo thời gian
      </AppText>
      <Card style={styles.card}>
        {results.length === 0 ? (
          <AppText variant="body" color={theme.colors.textMuted}>
            Chưa có dữ liệu phân tích.
          </AppText>
        ) : (
          <ScoreChart scores={results.map(r => r.alertnessScore)} />
        )}
      </Card>

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Dòng thời gian
      </AppText>
      <Card style={styles.card}>
        {timeline.map((entry, index) => (
          <View key={index} style={styles.timelineRow}>
            <AppText variant="body" color={theme.colors.textMuted}>
              {entry.time}
            </AppText>
            <AppText variant="body">{entry.label}</AppText>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <AppText variant="body" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  sectionTitle: { marginTop: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
