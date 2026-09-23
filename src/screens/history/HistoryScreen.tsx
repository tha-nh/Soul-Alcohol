import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../app/ThemeProvider';
import { SessionRepository } from '../../repositories';
import { AlertLevel, MonitoringSession } from '../../models';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      SessionRepository.listAll().then(setSessions);
    }, []),
  );

  return (
    <ScreenContainer scroll>
      <AppText variant="title">Lịch sử</AppText>

      {sessions.length === 0 ? (
        <AppText variant="body" color={theme.colors.textMuted} style={styles.empty}>
          Chưa có cuộc vui nào được theo dõi.
        </AppText>
      ) : (
        sessions.map(session => (
          <Pressable
            key={session.id}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}>
            <Card style={styles.card}>
              <AppText variant="body">
                {new Date(session.startTime).toLocaleDateString('vi-VN')}
              </AppText>
              <AppText variant="caption" color={theme.colors.textMuted} style={styles.timeRange}>
                {new Date(session.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {session.endTime
                  ? ` - ${new Date(session.endTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}
              </AppText>
              <AppText variant="body" style={styles.lowest}>
                Mức thấp nhất: {session.lowestScore ?? '--'}
              </AppText>
              <StatusBadge level={session.maxAlertLevel ?? AlertLevel.NORMAL} />
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: 16 },
  card: { marginTop: 16 },
  timeRange: { marginTop: 4 },
  lowest: { marginTop: 8 },
});
