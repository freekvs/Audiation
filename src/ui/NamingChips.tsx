import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NAMING_OPTIONS, useNaming } from '../naming';
import { COLORS } from '../theme';

export function NamingChips() {
  const { naming, setNaming } = useNaming();

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Benaming</Text>
      <Text style={styles.hint}>
        Alleen de trede in C-majeur. De nootnaam C D E blijft ernaast.
      </Text>
      <View style={styles.row}>
        {NAMING_OPTIONS.map((item) => {
          const selected = item.id === naming;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Benaming ${item.hint}`}
              accessibilityState={{ selected }}
              onPress={() => setNaming(item.id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.ink,
  },
  pressed: {
    opacity: 0.88,
  },
});
