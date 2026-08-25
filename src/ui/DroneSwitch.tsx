import { Switch, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function DroneSwitch({ value, onValueChange }: Props) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>Dronegeluid</Text>
        <Text style={styles.optionHint}>
          Optioneel. Zachte strings: tonica, kwint (Sol) en de tonica een octaaf
          lager. Zo kun je de afstand plaatsen.
        </Text>
      </View>
      <Switch
        accessibilityLabel="Dronegeluid in- of uitschakelen"
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
