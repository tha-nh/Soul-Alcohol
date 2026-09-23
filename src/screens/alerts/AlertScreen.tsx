import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { useTheme } from '../../app/ThemeProvider';
import { AlertLevel } from '../../models';
import { AlertRepository } from '../../repositories';

type Props = NativeStackScreenProps<RootStackParamList, 'Alert'>;

const CONTENT: Record<AlertLevel, { title: string; body: string; cta: string } | null> = {
  [AlertLevel.NORMAL]: null,
  [AlertLevel.NOTICE]: {
    title: 'UỐNG CHẬM LẠI',
    body: 'Một số dấu hiệu của bạn đang bắt đầu thay đổi.\n\nHãy uống thêm nước.',
    cta: 'TÔI ĐÃ HIỂU',
  },
  [AlertLevel.WARNING]: {
    title: 'NÊN NGHỈ UỐNG',
    body: 'Mức tỉnh táo của bạn đang giảm đáng kể.\n\nHãy nghỉ sử dụng đồ uống có cồn một lúc.',
    cta: 'TÔI SẼ NGHỈ',
  },
  [AlertLevel.STOP_RECOMMENDED]: {
    title: 'NÊN DỪNG UỐNG',
    body: 'Mức tỉnh táo của bạn đang giảm đáng kể so với trạng thái bình thường.\n\nHãy ngừng sử dụng rượu bia, uống nước và nghỉ ngơi.',
    cta: 'TÔI SẼ DỪNG',
  },
};

export function AlertScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const level = route.params.level as AlertLevel;
  const content = CONTENT[level] ?? CONTENT[AlertLevel.NOTICE]!;

  const handleAcknowledge = useCallback(async () => {
    const alerts = await AlertRepository.listBySession(route.params.sessionId);
    const latestForLevel = [...alerts].reverse().find(a => a.level === level && !a.userResponse);
    if (latestForLevel) {
      await AlertRepository.setUserResponse(latestForLevel.id, content.cta);
    }
    navigation.goBack();
  }, [content.cta, level, navigation, route.params.sessionId]);

  return (
    <ScreenContainer>
      <AppText variant="title" color={theme.colors.stopRecommended} style={styles.title}>
        {content.title}
      </AppText>
      <AppText variant="subtitle" style={styles.body}>
        {content.body}
      </AppText>
      <AppButton label={content.cta} onPress={handleAcknowledge} style={styles.action} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 24, textAlign: 'center' },
  body: { marginTop: 24, textAlign: 'center' },
  action: { marginTop: 48 },
});
