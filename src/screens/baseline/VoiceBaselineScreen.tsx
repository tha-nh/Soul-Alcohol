import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../app/ThemeProvider';
import { useVoiceEnrollment } from '../../domain/baseline/useVoiceEnrollment';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceBaseline'>;

export function VoiceBaselineScreen({ navigation }: Props) {
  const theme = useTheme();
  const { currentSentence, sampleIndex, totalSamples, phase, rejectionMessage, recordSample } =
    useVoiceEnrollment();

  const buttonLabel =
    phase === 'recording' ? 'Đang ghi âm...' : phase === 'rejected' ? 'Đọc lại' : 'Ghi âm mẫu';

  return (
    <ScreenContainer>
      <AppText variant="caption" color={theme.colors.textMuted}>
        Mẫu {Math.min(sampleIndex + 1, totalSamples)}/{totalSamples}
      </AppText>
      <AppText variant="title" style={styles.title}>
        Thiết lập giọng nói
      </AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.hint}>
        Hãy đọc to, rõ ràng câu sau trong môi trường yên tĩnh:
      </AppText>

      <Card style={styles.sentenceCard}>
        <AppText variant="subtitle">{currentSentence}</AppText>
      </Card>

      {phase === 'rejected' && rejectionMessage && (
        <AppText variant="body" color={theme.colors.stopRecommended} style={styles.rejection}>
          {rejectionMessage}
        </AppText>
      )}

      {phase === 'completed' ? (
        <AppButton
          label="Tiếp tục"
          onPress={() => navigation.navigate('MotionBaseline')}
          style={styles.action}
        />
      ) : (
        <AppButton
          label={buttonLabel}
          onPress={recordSample}
          disabled={phase === 'recording'}
          style={styles.action}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8 },
  hint: { marginTop: 8 },
  sentenceCard: { marginTop: 24 },
  rejection: { marginTop: 16 },
  action: { marginTop: 32 },
});
