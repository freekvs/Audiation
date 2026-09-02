import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../theme';

type Props = {
  label?: string;
  body: string;
  a11y: string;
};

export function ChoiceHelp({ label, body, a11y }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={a11y}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
        >
          <View style={[styles.mark, open && styles.markOpen]}>
            <Text style={[styles.markText, open && styles.markTextOpen]}>?</Text>
          </View>
        </Pressable>
      </View>
      {open ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  hit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOpen: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  markText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.muted,
  },
  markTextOpen: {
    color: COLORS.ink,
  },
  pressed: {
    opacity: 0.88,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
});
