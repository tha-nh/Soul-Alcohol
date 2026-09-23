import React from 'react';
import { StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppText } from '../components/AppText';
import { AppButton } from '../components/AppButton';

interface PlaceholderScreenProps {
  title: string;
  description: string;
  nextLabel?: string;
  onNext?: () => void;
}

/**
 * Stand-in body for screens whose real UI is built in a later phase
 * (Section 55). Keeps every route navigable end to end in the meantime.
 */
export function PlaceholderScreen({ title, description, nextLabel, onNext }: PlaceholderScreenProps) {
  return (
    <ScreenContainer>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" color="#8A8F9C" style={styles.description}>
        {description}
      </AppText>
      {onNext && nextLabel && (
        <AppButton label={nextLabel} onPress={onNext} style={styles.button} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: 12 },
  button: { marginTop: 32 },
});
