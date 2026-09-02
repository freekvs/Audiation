import { Switch, StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { COLORS } from '../theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function DroneSwitch({ value, onValueChange }: Props) {
  const t = useT();
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{t.drone.title}</Text>
        <Text style={styles.optionHint}>{t.drone.hint}</Text>
      </View>
      <Switch
        accessibilityLabel={t.drone.a11y}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
        thumbColor={value ? COLORS.text : COLORS.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    padding: 16,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
});
