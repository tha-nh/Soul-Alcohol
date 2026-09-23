import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { MotionBaselineRepository, VoiceBaselineRepository } from '../../repositories';
import { MotionBaseline, VoiceBaseline } from '../../models';

type Props = NativeStackScreenProps<RootStackParamList, 'BaselineStatus'>;

function qualityLabel(score: number): string {
  if (score >= 80) {
    return 'Tốt';
  }
  if (score >= 60) {
    return 'Trung bình';
  }
  return 'Cần thiết lập lại';
}

export function BaselineStatusScreen({ navigation }: Props) {
  const theme = useTheme();
  const [voice, setVoice] = useState<VoiceBaseline | null>(null);
  const [motion, setMotion] = useState<MotionBaseline | null>(null);

  const load = useCallback(() => {
    VoiceBaselineRepository.getLatest().then(setVoice);
    MotionBaselineRepository.getLatest().then(setMotion);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenContainer scroll>
      <AppText variant="title">Trạng thái cá nhân</AppText>

      <Card style={styles.card}>
        <AppText variant="subtitle">Giọng nói</AppText>
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.status}>
          {voice ? `Đã thiết lập · Chất lượng: ${qualityLabel(voice.qualityScore)}` : 'Chưa thiết lập'}
        </AppText>
        <AppButton
          label="Thiết lập lại"
          variant="secondary"
          onPress={async () => {
            await VoiceBaselineRepository.clear();
            navigation.navigate('VoiceBaseline');
          }}
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <AppText variant="subtitle">Chuyển động</AppText>
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.status}>
          {motion ? `Đã thiết lập · Chất lượng: ${qualityLabel(motion.qualityScore)}` : 'Chưa thiết lập'}
        </AppText>
        <AppButton
          label="Thiết lập lại"
          variant="secondary"
          onPress={async () => {
            await MotionBaselineRepository.clear();
            navigation.navigate('MotionBaseline');
          }}
          style={styles.button}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  status: { marginTop: 8 },
  button: { marginTop: 16 },
});
