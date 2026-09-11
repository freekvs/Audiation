import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmt, useT } from '../i18n';
import {
  DEFAULT_PIANO_OCTAVE,
  PIANO_OCTAVES,
  type PianoOctave,
} from '../notes';
import { PianoKeyboard } from '../PianoKeyboard';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { AudioReadyLamp } from '../ui/StartButton';

type Props = {
  onBack: () => void;
};

export function PianoScreen({ onBack }: Props) {
  const { compact, height } = useCompactLayout();
  const t = useT();
  const [octave, setOctave] = useState<PianoOctave>(DEFAULT_PIANO_OCTAVE);
  const keyboardHeight = Math.max(180, Math.min(240, height * 0.34));
  const first = octave.whiteKeys[0];
  const last = octave.whiteKeys[octave.whiteKeys.length - 1];

  return (
    <AppScreen onBack={onBack}>
      <View style={styles.titleRow}>
        <AudioReadyLamp announce />
        <Text style={[styles.title, compact && styles.titleCompact]}>{t.piano.title}</Text>
      </View>
      <ChoiceHelp
        label={t.help.cMajorTitle}
        body={t.help.cMajor}
        a11y={fmt(t.help.moreA11y, { term: t.help.cMajorTitle })}
      />
      <Text style={styles.subtitle}>
        {fmt(t.piano.body, { octave: octave.label })}
      </Text>

      <View style={styles.octaveBlock}>
        <Text style={styles.optionTitle}>{t.common.octave}</Text>
        <View style={styles.octaveRow}>
          {PIANO_OCTAVES.map((item) => {
            const selected = item.octave === octave.octave;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={fmt(t.piano.octaveA11y, { label: item.label })}
                accessibilityState={{ selected }}
                onPress={() => setOctave(item)}
                style={({ pressed }) => [
                  styles.octaveChip,
                  selected && styles.octaveChipSelected,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.octaveChipText,
                    selected && styles.octaveChipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PianoKeyboard
        key={octave.octave}
        compact={compact}
        height={keyboardHeight}
        whiteKeys={octave.whiteKeys}
        blackKeys={octave.blackKeys}
      />
      <Text style={styles.hint}>
        {fmt(t.piano.hint, { first: first.name, last: last.name })}
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  titleCompact: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.muted,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  octaveBlock: {
    gap: 10,
  },
  octaveRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  octaveChip: {
    minHeight: 44,
    minWidth: 52,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  octaveChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  octaveChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  octaveChipTextSelected: {
    color: COLORS.ink,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
});
