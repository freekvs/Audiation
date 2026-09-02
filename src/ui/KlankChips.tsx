import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KLANK_CHIPS, useKlank, type KlankChip } from '../audio/klank';
import { fmt, useT } from '../i18n';
import { COLORS } from '../theme';
import { ChoiceHelp } from './ChoiceHelp';

const CHIP_HELP: Record<KlankChip, 'klankSec' | 'klankCombo' | 'klankBand' | 'klankOrchestra' | 'klankRandom'> = {
  sec: 'klankSec',
  combo: 'klankCombo',
  band: 'klankBand',
  orchestra: 'klankOrchestra',
  random: 'klankRandom',
};

export function KlankChips() {
  const t = useT();
  const { chip, setChip } = useKlank();

  return (
    <View style={styles.block}>
      <ChoiceHelp
        label={t.klank.title}
        body={t.help.klank}
        a11y={fmt(t.help.moreA11y, { term: t.klank.title })}
      />
      <Text style={styles.hint}>{t.klank.hint}</Text>
      <View style={styles.row}>
        {KLANK_CHIPS.map((id) => {
          const selected = id === chip;
          const label = t.klank[id];
          return (
            <View key={id} style={styles.option}>
              <ChoiceHelp
                body={t.help[CHIP_HELP[id]]}
                a11y={fmt(t.help.moreA11y, { term: label })}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fmt(t.klank.a11y, { label })}
                accessibilityState={{ selected }}
                onPress={() => setChip(id)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
              </Pressable>
            </View>
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
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-end',
  },
  option: {
    gap: 4,
    alignItems: 'flex-start',
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
