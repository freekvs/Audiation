import { StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { COLORS } from '../theme';

export function BetaWatermark() {
  const t = useT();

  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden>
      <Text style={styles.mark}>{t.about.beta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 10,
    right: 4,
    zIndex: 20,
    transform: [{ rotate: '18deg' }],
  },
  mark: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: COLORS.accent,
    opacity: 0.62,
  },
});
