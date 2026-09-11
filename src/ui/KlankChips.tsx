import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KLANK_CHIPS, useKlank, type KlankChip, type KlankId } from '../audio/klank';
import { playChordHz, stopTone } from '../audio/toneUri';
import { fmt, useT } from '../i18n';
import { DEFAULT_PIANO_OCTAVE } from '../notes';
import { COLORS } from '../theme';
import { ChoiceHelp } from './ChoiceHelp';

const CHIP_HELP: Record<KlankChip, 'klankSec' | 'klankCombo' | 'klankBand' | 'klankOrchestra' | 'klankRandom'> = {
  sec: 'klankSec',
  combo: 'klankCombo',
  band: 'klankBand',
  orchestra: 'klankOrchestra',
  random: 'klankRandom',
};

const EXAMPLE_HZ = [
  DEFAULT_PIANO_OCTAVE.whiteKeys[0]!.hz,
  DEFAULT_PIANO_OCTAVE.whiteKeys[2]!.hz,
  DEFAULT_PIANO_OCTAVE.whiteKeys[4]!.hz,
];

const RANDOM_ORDER: KlankId[] = ['combo', 'band', 'orchestra'];
const RANDOM_GAP_MS = 1250;

export function KlankChips() {
  const t = useT();
  const { chip, setChip } = useKlank();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seq = useRef(0);

  const stopPreview = () => {
    seq.current += 1;
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
    stopTone();
  };

  useEffect(() => {
    return () => {
      seq.current += 1;
      for (const timer of timers.current) {
        clearTimeout(timer);
      }
      timers.current = [];
      stopTone();
    };
  }, []);

  const preview = (id: KlankChip) => {
    stopPreview();
    const token = seq.current;
    if (id !== 'random') {
      void playChordHz(EXAMPLE_HZ, id).catch(() => undefined);
      return;
    }
    RANDOM_ORDER.forEach((klank, index) => {
      const timer = setTimeout(() => {
        if (token !== seq.current) {
          return;
        }
        void playChordHz(EXAMPLE_HZ, klank).catch(() => undefined);
      }, index * RANDOM_GAP_MS);
      timers.current.push(timer);
    });
  };

  const choose = (id: KlankChip) => {
    setChip(id);
    preview(id);
  };

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
                accessibilityLabel={fmt(t.klank.previewA11y, { label })}
                accessibilityState={{ selected }}
                onPress={() => choose(id)}
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
