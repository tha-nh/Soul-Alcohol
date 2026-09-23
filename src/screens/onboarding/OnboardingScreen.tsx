import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { PlaceholderScreen } from '../PlaceholderScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <PlaceholderScreen
      title="Theo dõi mức tỉnh táo"
      description="Ứng dụng giúp theo dõi sự thay đổi trạng thái của bạn trong cuộc vui."
      nextLabel="Bắt đầu thiết lập"
      onNext={() => navigation.navigate('VoiceBaseline')}
    />
  );
}
