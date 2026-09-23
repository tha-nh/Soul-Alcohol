import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { MotionBaselineRepository, SessionRepository, VoiceBaselineRepository } from '../../repositories';
import { AlertLevel, MonitoringSession } from '../../models';
import { SessionManager } from '../../domain/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function ReadinessRow({ label, ready }: { label: string; ready: boolean }) {
  const theme = useTheme();
  return (
    <AppText variant="body" style={styles.readinessRow}>
      {label}{'  '}
      <AppText variant="body" color={ready ? theme.colors.normal : theme.colors.textMuted}>
        {ready ? 'Sẵn sàng' : 'Chưa thiết lập'}
      </AppText>
    </AppText>
  );
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const [voiceReady, setVoiceReady] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [recentSessions, setRecentSessions] = useState<MonitoringSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      VoiceBaselineRepository.getLatest().then(b => setVoiceReady(!!b));
      MotionBaselineRepository.getLatest().then(b => setMotionReady(!!b));
      SessionRepository.listAll().then(sessions => setRecentSessions(sessions.slice(0, 3)));
    }, []),
  );

  // Section 44: detect a session left MONITORING/PAUSED by an app kill/restart.
  useFocusEffect(
    useCallback(() => {
      SessionManager.getActiveSession().then(activeSession => {
        if (!activeSession) {
          return;
        }
        Alert.alert('Phát hiện phiên theo dõi chưa kết thúc.', undefined, [
          {
            text: 'Kết thúc phiên',
            style: 'destructive',
            onPress: () => {
              const fallbackScore = activeSession.lowestScore ?? activeSession.initialScore ?? 0;
              SessionManager.complete(activeSession, {
                initialScore: activeSession.initialScore ?? fallbackScore,
                lowestScore: fallbackScore,
                finalScore: fallbackScore,
                maxAlertLevel: activeSession.maxAlertLevel ?? AlertLevel.NORMAL,
              });
            },
          },
          {
            text: 'Tiếp tục',
            onPress: () => navigation.navigate('MonitoringSession', { sessionId: activeSession.id }),
          },
        ]);
      });
    }, [navigation]),
  );

  return (
    <ScreenContainer scroll>
      <AppText variant="title">Xin chào</AppText>

      <Card style={styles.statusCard}>
        <AppText variant="subtitle">Trạng thái</AppText>
        <ReadinessRow label="Giọng nói" ready={voiceReady} />
        <ReadinessRow label="Chuyển động" ready={motionReady} />
      </Card>

      <AppButton
        label="BẮT ĐẦU CUỘC VUI"
        onPress={() => navigation.navigate('StartSession')}
        style={styles.primary}
      />

      <AppText variant="subtitle" style={styles.historyTitle}>
        Lịch sử gần đây
      </AppText>
      {recentSessions.length === 0 ? (
        <AppText variant="body" color={theme.colors.textMuted}>
          Chưa có cuộc vui nào được theo dõi.
        </AppText>
      ) : (
        recentSessions.map(session => (
          <Card key={session.id} style={styles.historyCard}>
            <AppText variant="body">{new Date(session.startTime).toLocaleString('vi-VN')}</AppText>
            <AppText variant="caption" color={theme.colors.textMuted} style={styles.historyMeta}>
              Mức thấp nhất: {session.lowestScore ?? '--'}
            </AppText>
          </Card>
        ))
      )}

      <AppButton
        label="Xem tất cả lịch sử"
        variant="secondary"
        onPress={() => navigation.navigate('History')}
        style={styles.secondary}
      />
      <AppButton
        label="Trạng thái cá nhân"
        variant="secondary"
        onPress={() => navigation.navigate('BaselineStatus')}
        style={styles.secondary}
      />
      <AppButton
        label="Cài đặt"
        variant="secondary"
        onPress={() => navigation.navigate('Settings')}
        style={styles.secondary}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusCard: { marginTop: 16 },
  readinessRow: { marginTop: 8 },
  primary: { marginTop: 24 },
  historyTitle: { marginTop: 32 },
  historyCard: { marginTop: 12 },
  historyMeta: { marginTop: 4 },
  secondary: { marginTop: 12 },
});
