import { Pressable, StyleSheet, Text, View } from 'react-native';

import { unlockAudio } from '../audio/webUnlock';
import { useT } from '../i18n';
import { COLORS } from '../theme';

type Props = {
  againA11y: string;
  nextA11y: string;
  nextLabel: string;
  onAgain: () => void;
  onNext: () => void;
  preferAgain?: boolean;
};

export function RoundActions({
  againA11y,
  nextA11y,
  nextLabel,
  onAgain,
  onNext,
  preferAgain = false,
}: Props) {
  const t = useT();
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={againA11y}
        onPress={() => {
          void unlockAudio();
          onAgain();
        }}
        style={({ pressed }) => [
          styles.button,
          !preferAgain && styles.buttonSecondary,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, !preferAgain && styles.buttonSecondaryText]}>
          {t.common.again}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextA11y}
        onPress={() => {
          void unlockAudio();
          onNext();
        }}
        style={({ pressed }) => [
          styles.button,
          preferAgain && styles.buttonSecondary,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, preferAgain && styles.buttonSecondaryText]}>
          {nextLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  pressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondaryText: {
    color: COLORS.text,
  },
});
