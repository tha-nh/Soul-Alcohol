import React, { useCallback } from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { wipeAllData, wipeHistory } from '../../database';
import { MotionBaselineRepository, VoiceBaselineRepository } from '../../repositories';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function confirm(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: onConfirm },
  ]);
}

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();

  const handleClearHistory = useCallback(() => {
    confirm('Xóa lịch sử', 'Toàn bộ lịch sử cuộc vui sẽ bị xóa. Baseline vẫn được giữ lại.', () => {
      wipeHistory();
    });
  }, []);

  const handleClearBaseline = useCallback(() => {
    confirm('Xóa baseline', 'Bạn sẽ cần thiết lập lại giọng nói và chuyển động.', async () => {
      await VoiceBaselineRepository.clear();
      await MotionBaselineRepository.clear();
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    });
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    confirm('Xóa toàn bộ dữ liệu', 'Toàn bộ dữ liệu trên thiết bị sẽ bị xóa vĩnh viễn.', async () => {
      await wipeAllData();
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    });
  }, [navigation]);

  return (
    <ScreenContainer scroll>
      <AppText variant="title">Cài đặt</AppText>

      <Card style={styles.card}>
        <AppText variant="subtitle">Quyền ứng dụng</AppText>
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.hint}>
          Quản lý quyền Microphone, Chuyển động và Thông báo trong cài đặt hệ thống.
        </AppText>
        <AppButton
          label="Mở cài đặt hệ thống"
          variant="secondary"
          onPress={() => Linking.openSettings()}
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <AppText variant="subtitle">Dữ liệu</AppText>
        <AppButton label="Xóa lịch sử" variant="secondary" onPress={handleClearHistory} style={styles.button} />
        <AppButton
          label="Xóa baseline"
          variant="secondary"
          onPress={handleClearBaseline}
          style={styles.button}
        />
        <AppButton label="Xóa toàn bộ dữ liệu" variant="danger" onPress={handleClearAll} style={styles.button} />
      </Card>

      <AppText variant="caption" color={theme.colors.textMuted} style={styles.privacy}>
        Dữ liệu được xử lý và lưu trữ trực tiếp trên thiết bị của bạn, không tải lên máy chủ nào.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  hint: { marginTop: 8 },
  button: { marginTop: 16 },
  privacy: { marginTop: 24 },
});
