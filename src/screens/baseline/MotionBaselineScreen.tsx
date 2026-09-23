import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { useTheme } from '../../app/ThemeProvider';
import { useMotionBaseline } from '../../domain/baseline/useMotionBaseline';

type Props = NativeStackScreenProps<RootStackParamList, 'MotionBaseline'>;

export function MotionBaselineScreen({ navigation }: Props) {
  const theme = useTheme();
  const { phase, progress, start } = useMotionBaseline();

  const buttonLabel = phase === 'recording' ? 'Đang đi bộ...' : 'Bắt đầu đi bộ';

  return (
    <ScreenContainer>
      <AppText variant="title">Thiết lập chuyển động</AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.hint}>
        Cầm điện thoại bình thường hoặc để trong túi, sau đó đi bộ khoảng 20-30 giây.
      </AppText>

      {phase === 'recording' && (
        <AppText variant="display" style={styles.progress}>
          {Math.round(progress * 100)}%
        </AppText>
      )}

      {phase === 'completed' ? (
        <AppButton label="Hoàn tất" onPress={() => navigation.replace('Home')} style={styles.action} />
      ) : (
        <AppButton
          label={buttonLabel}
          onPress={start}
          disabled={phase === 'recording'}
          style={styles.action}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 8 },
  progress: { marginTop: 40, textAlign: 'center' },
  action: { marginTop: 32 },
});
