import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { SessionManager } from '../../domain/session';

type Props = NativeStackScreenProps<RootStackParamList, 'StartSession'>;

const REQUIRED_PERMISSIONS = ['Microphone', 'Accelerometer', 'Gyroscope', 'Notification'];

export function StartSessionScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <AppText variant="title">Xác nhận bắt đầu</AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.hint}>
        Ứng dụng sẽ sử dụng:
      </AppText>

      <Card style={styles.card}>
        {REQUIRED_PERMISSIONS.map(item => (
          <AppText key={item} variant="body" style={styles.permissionRow}>
            • {item}
          </AppText>
        ))}
      </Card>

      <AppText variant="caption" color={theme.colors.textMuted} style={styles.privacy}>
        Dữ liệu được xử lý trực tiếp trên điện thoại.
      </AppText>

      <AppButton
        label="BẮT ĐẦU THEO DÕI"
        onPress={async () => {
          const session = await SessionManager.start();
          navigation.replace('MonitoringSession', { sessionId: session.id });
        }}
        style={styles.action}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 8 },
  card: { marginTop: 16 },
  permissionRow: { marginTop: 4 },
  privacy: { marginTop: 16 },
  action: { marginTop: 32 },
});
