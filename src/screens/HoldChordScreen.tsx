import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { beginSoundingRound } from '../audio/klank';
import { playChordHz, stopTone } from '../audio/toneUri';
import {
  exerciseOctave,
  EXERCISE_OCTAVES,
  type ExerciseOctave,
} from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import {
  HOLD_INVERSION_MODES,
  HOLD_SIZE_MODES,
  describeHoldChord,
  holdChordKey,
  pickHoldChord,
  type HoldChord,
  type HoldInversionMode,
  type HoldSizeMode,
} from '../holdChord';
import { fmt, useT } from '../i18n';
import { useNaming } from '../naming';
import { CHORD_PLAY_MS } from '../progression';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';

type Phase = 'idle' | 'playing' | 'holding' | 'check';

type Props = {
  onBack: () => void;
};

const CHECK_ENABLE_MS = 1200;

export function HoldChordScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(() => exerciseOctave(prefs.holdChord.octave));
  const [sizeMode, setSizeMode] = useState<HoldSizeMode>(prefs.holdChord.sizeMode);
  const [inversionMode, setInversionMode] = useState<HoldInversionMode>(prefs.holdChord.inversionMode);
  const [chord, setChord] = useState<HoldChord>(() =>
    pickHoldChord({
      sizeMode: prefs.holdChord.sizeMode,
      inversionMode: prefs.holdChord.inversionMode,
      octave: prefs.holdChord.octave,
    }),
  );
  const [canCheck, setCanCheck] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const settingsOpen = phase === 'idle' || phase === 'check';

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopTone();
    };
  }, []);

  useEffect(() => {
    update('holdChord', {
      octave: octave.octave,
      sizeMode,
      inversionMode,
    });
  }, [octave, sizeMode, inversionMode, update]);

  const play = (next: HoldChord) => {
    void playChordHz(next.hz).catch(() => undefined);
  };

  const beginHold = (next: HoldChord) => {
    setCanCheck(false);
    setPhase('playing');
    play(next);
    timers.current.push(
      setTimeout(() => {
        stopTone();
        setPhase('holding');
      }, CHORD_PLAY_MS),
    );
    timers.current.push(
      setTimeout(() => {
        setCanCheck(true);
      }, CHORD_PLAY_MS + CHECK_ENABLE_MS),
    );
  };

  const startRound = () => {
    beginSoundingRound();
    clearTimers();
    stopTone();
    const next = pickHoldChord({
      sizeMode,
      inversionMode,
      octave: octave.octave,
      exceptKey: holdChordKey(chord),
    });
    setChord(next);
    beginHold(next);
  };

  const repeatRound = () => {
    clearTimers();
    stopTone();
    beginHold(chord);
  };

  const check = () => {
    if (!canCheck) {
      return;
    }
    clearTimers();
    stopTone();
    setPhase('check');
    play(chord);
  };

  const chooseOctave = (next: ExerciseOctave) => {
    if (next.octave === octave.octave) {
      return;
    }
    clearTimers();
    stopTone();
    setOctave(next);
    setChord(
      pickHoldChord({
        sizeMode,
        inversionMode,
        octave: next.octave,
      }),
    );
    setPhase('idle');
  };

  const chooseSize = (next: HoldSizeMode) => {
    if (next === sizeMode) {
      return;
    }
    clearTimers();
    stopTone();
    setSizeMode(next);
    setChord(
      pickHoldChord({
        sizeMode: next,
        inversionMode,
        octave: octave.octave,
      }),
    );
    setPhase('idle');
  };

  const chooseInversion = (next: HoldInversionMode) => {
    if (next === inversionMode) {
      return;
    }
    clearTimers();
    stopTone();
    setInversionMode(next);
    setChord(
      pickHoldChord({
        sizeMode,
        inversionMode: next,
        octave: octave.octave,
      }),
    );
    setPhase('idle');
  };

  const sizeLabel = (id: HoldSizeMode) =>
    id === 'triad'
      ? t.holdChord.sizeTriad
      : id === 'seventh'
        ? t.holdChord.sizeSeventh
        : t.holdChord.sizeMix;

  const inversionChipLabel = (id: HoldInversionMode) =>
    id === 'root'
      ? t.holdChord.invRoot
      : id === 'inv1'
        ? t.holdChord.invFirst
        : id === 'inv2'
          ? t.holdChord.invSecond
          : t.holdChord.invMix;

  const title =
    phase === 'playing'
      ? t.common.listen
      : phase === 'holding'
        ? t.holdChord.titleHold
        : phase === 'check'
          ? t.common.control
          : t.practice.holdChord.title;

  const body =
    phase === 'idle'
      ? fmt(t.holdChord.idle, { octave: octave.label })
      : phase === 'playing'
        ? t.holdChord.playing
        : phase === 'holding'
          ? t.holdChord.holding
          : fmt(t.holdChord.checkAsk, {
              chord: describeHoldChord(chord, naming, t),
            });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.holdChord.tagline}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <ChoiceHelp
            label={t.help.triadTitle}
            body={t.help.triad}
            a11y={fmt(t.help.moreA11y, { term: t.help.triadTitle })}
          />
          <Text style={styles.optionHint}>{t.holdChord.sizeHint}</Text>
          <View style={styles.chipRow}>
            {HOLD_SIZE_MODES.map((id) => {
              const selected = id === sizeMode;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={sizeLabel(id)}
                  accessibilityState={{ selected }}
                  onPress={() => chooseSize(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {sizeLabel(id)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <ChoiceHelp
            label={t.help.voicingTitle}
            body={t.help.voicing}
            a11y={fmt(t.help.moreA11y, { term: t.help.voicingTitle })}
          />
          <Text style={styles.optionHint}>{t.holdChord.inversionHint}</Text>
          <View style={styles.chipRow}>
            {HOLD_INVERSION_MODES.map((id) => {
              const selected = id === inversionMode;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={inversionChipLabel(id)}
                  accessibilityState={{ selected }}
                  onPress={() => chooseInversion(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {inversionChipLabel(id)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.common.octave}</Text>
          <View style={styles.chipRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = item.octave === octave.octave;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.piano.octaveA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => chooseOctave(item)}
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
      ) : null}

      <View style={styles.stage}>
        <View
          style={[
            styles.orb,
            phase === 'playing' && styles.orbPlaying,
            phase === 'holding' && styles.orbHolding,
            phase === 'check' && styles.orbCheck,
          ]}
        />
        {phase === 'check' ? (
          <Text style={styles.reveal}>{describeHoldChord(chord, naming, t)}</Text>
        ) : (
          <Text style={styles.revealHidden}> </Text>
        )}
      </View>

      {phase === 'holding' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.holdChord.checkA11y}
          onPress={check}
          disabled={!canCheck}
          style={({ pressed }) => [
            styles.button,
            !canCheck && styles.buttonDisabled,
            pressed && canCheck && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>{t.common.check}</Text>
        </Pressable>
      ) : phase === 'playing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'check' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.holdChord.againA11y}
            onPress={repeatRound}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.common.again}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.holdChord.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{t.common.next}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.startA11y}
          onPress={startRound}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{t.common.start}</Text>
        </Pressable>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  titleCompact: {
    fontSize: 32,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.muted,
  },
  optionBlock: {
    gap: 10,
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
  chipRow: {
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
  stage: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  orb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardLine,
  },
  orbPlaying: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  orbHolding: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.muted,
  },
  orbCheck: {
    backgroundColor: COLORS.hit,
    borderColor: COLORS.hit,
  },
  reveal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  revealHidden: {
    fontSize: 18,
  },
  actions: {
    gap: 10,
  },
  buttonPlaceholder: {
    minHeight: 48,
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
  buttonDisabled: {
    opacity: 0.45,
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
