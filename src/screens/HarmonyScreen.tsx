import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { playHeld, playGiven, stopHeld } from '../audio/heldTones';
import { playDualHz, playHz, stopTone } from '../audio/toneUri';
import { EXERCISE_OCTAVES } from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import { describeFindNoteMiss, filledOctaves, octaveLabelList, sliderSpanFor, tonesInsideSlider, toggleSliderOctave, toggleToneOctave } from '../findNote';
import { directionLabel, fmt, useT } from '../i18n';
import {
  QUALITY_OPTIONS,
  givenSummary,
  harmonyNoteLabel,
  hzFromCents,
  intervalHintFor,
  pickHarmonyRound,
  taskLabelFor,
  type HarmonyFind,
  type HarmonyQuality,
  type HarmonyRound,
} from '../harmony';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { PitchSlider } from '../ui/PitchSlider';

type Phase = 'idle' | 'seeking' | 'check';

type Props = {
  onBack: () => void;
};

const CHECK_PLAY_MS = 1100;
const CHECK_GAP_MS = 280;

export function HarmonyScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [qualities, setQualities] = useState<HarmonyQuality[]>(() => [...prefs.harmony.qualities]);
  const [finds, setFinds] = useState<HarmonyFind[]>(() => [...prefs.harmony.finds]);
  const [givenCount, setGivenCount] = useState<1 | 2>(prefs.harmony.givenCount);
  const [inversions, setInversions] = useState(prefs.harmony.inversions);
  const [toneOctaves, setToneOctaves] = useState<number[]>(() => [...prefs.harmony.toneOctaves]);
  const [sliderOctaves, setSliderOctaves] = useState<number[]>(() => [...prefs.harmony.sliderOctaves]);
  const [round, setRound] = useState<HarmonyRound | null>(null);
  const [sliderCents, setSliderCents] = useState(0);
  const [compareStep, setCompareStep] = useState<0 | 1 | 2 | 3>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastLoopHz = useRef(0);

  const chosenHz = round ? hzFromCents(round.lowHz, sliderCents) : 0;
  const result =
    phase === 'check' && round ? describeFindNoteMiss(chosenHz, round.targetHz, t.intervals) : null;
  const sliderSpan = sliderSpanFor(sliderOctaves);
  const canInvert = filledOctaves(sliderOctaves).length >= 2;
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
      stopHeld();
      stopTone();
    };
  }, []);

  useEffect(() => {
    update('harmony', {
      qualities,
      finds,
      givenCount,
      inversions,
      toneOctaves,
      sliderOctaves,
    });
  }, [qualities, finds, givenCount, inversions, toneOctaves, sliderOctaves, update]);

  const toggleQuality = (id: HarmonyQuality) => {
    setQualities((current) => {
      if (current.includes(id)) {
        return current.length <= 1 ? current : current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const toggleFind = (id: HarmonyFind) => {
    setFinds((current) => {
      if (current.includes(id)) {
        return current.length <= 1 ? current : current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const chooseToneOctave = (octave: number) => {
    const nextTones = toggleToneOctave(toneOctaves, octave);
    let nextSlider = sliderOctaves;
    const span = filledOctaves(sliderOctaves);
    if (octave < span[0]! || octave > span[span.length - 1]!) {
      nextSlider = toggleSliderOctave(sliderOctaves, octave);
    }
    setToneOctaves(tonesInsideSlider(nextTones, nextSlider));
    setSliderOctaves(filledOctaves(nextSlider));
  };

  const chooseSliderOctave = (octave: number) => {
    const nextSlider = toggleSliderOctave(sliderOctaves, octave);
    setSliderOctaves(nextSlider);
    setToneOctaves(tonesInsideSlider(toneOctaves, nextSlider));
    if (filledOctaves(nextSlider).length < 2) {
      setInversions(false);
    }
  };

  const hearSlide = (cents: number) => {
    if (!round) {
      return;
    }
    const hz = hzFromCents(round.lowHz, cents);
    if (Math.abs(hz - lastLoopHz.current) < 0.05) {
      return;
    }
    lastLoopHz.current = hz;
    void playHeld('slide', hz).catch(() => undefined);
  };

  const beginRound = (next: HarmonyRound) => {
    setSliderCents(next.startCents);
    setCompareStep(0);
    setPhase('seeking');
    lastLoopHz.current = 0;
    void playGiven(next.givenHz).catch(() => undefined);
    const startHz = hzFromCents(next.lowHz, next.startCents);
    lastLoopHz.current = startHz;
    void playHeld('slide', startHz).catch(() => undefined);
  };

  const startRound = () => {
    clearTimers();
    stopHeld();
    stopTone();
    const next = pickHarmonyRound({
      qualities,
      finds,
      givenCount,
      inversions: inversions && canInvert,
      toneOctaves,
      sliderOctaves,
    });
    if (!next) {
      return;
    }
    setRound(next);
    beginRound(next);
  };

  const repeatRound = () => {
    if (!round) {
      return;
    }
    clearTimers();
    stopHeld();
    stopTone();
    beginRound(round);
  };

  const onSlide = (cents: number) => {
    if (phase !== 'seeking' || !round) {
      return;
    }
    const next = Math.round(cents / 5) * 5;
    const clamped = Math.max(0, Math.min(round.spanCents, next));
    setSliderCents(clamped);
    hearSlide(clamped);
  };

  const playCompare = () => {
    if (!round) {
      return;
    }
    clearTimers();
    stopHeld();
    stopTone();
    const guess = hzFromCents(round.lowHz, sliderCents);
    setCompareStep(1);
    void playDualHz(round.givenHz[0] ?? guess, guess).catch(() => undefined);

    timers.current.push(
      setTimeout(() => {
        setCompareStep(2);
        void playDualHz(round.givenHz[0] ?? round.targetHz, round.targetHz).catch(() => undefined);
      }, CHECK_PLAY_MS + CHECK_GAP_MS),
    );

    timers.current.push(
      setTimeout(() => {
        setCompareStep(3);
        void playHz(guess).catch(() => undefined);
      }, (CHECK_PLAY_MS + CHECK_GAP_MS) * 2),
    );

    timers.current.push(
      setTimeout(() => {
        setCompareStep(0);
        stopTone();
      }, (CHECK_PLAY_MS + CHECK_GAP_MS) * 2 + CHECK_PLAY_MS),
    );
  };

  const lockIn = () => {
    lastLoopHz.current = 0;
    setPhase('check');
    playCompare();
  };

  const taskLabel = round ? taskLabelFor(round.quality, round.inversion, t) : '';
  const intervalHint = round ? intervalHintFor(round.quality, round.find, t) : '';

  const title =
    phase === 'seeking'
      ? t.harmony.titleSeek
      : phase === 'check'
        ? t.common.control
        : t.practice.harmony.title;

  const body =
    phase === 'idle'
      ? t.harmony.idle
      : phase === 'seeking' && round
        ? fmt(t.harmony.seeking, {
            task: taskLabel,
            hint: intervalHint,
            given: givenSummary(round, t),
          })
        : result?.quality === 'hit'
          ? fmt(t.harmony.hit, { hint: intervalHint, task: taskLabel })
          : result?.quality === 'close'
            ? fmt(t.harmony.close, {
                hint: intervalHint,
                interval: result.interval,
                direction: directionLabel(result.direction, t.intervals),
              })
            : fmt(t.harmony.miss, {
                target: round ? harmonyNoteLabel(round.targetHz) : '',
                chosen: result?.chosenLabel,
              });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.harmony.tagline}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.harmony.quality}</Text>
          <View style={styles.octaveRow}>
            {QUALITY_OPTIONS.map((item) => {
              const selected = qualities.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleQuality(item.id)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}>
                    {t.harmony[item.id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <ChoiceHelp
            label={t.help.thirdTitle}
            body={t.help.third}
            a11y={fmt(t.help.moreA11y, { term: t.help.thirdTitle })}
          />
          <View style={styles.octaveRow}>
            {(
              [
                { id: 'third' as const, label: t.harmony.third },
                { id: 'fifth' as const, label: t.harmony.fifth },
              ] as const
            ).map((item) => {
              const selected = finds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleFind(item.id)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.harmony.given}</Text>
          <View style={styles.octaveRow}>
            {(
              [
                { id: 1 as const, label: t.harmony.givenOne },
                { id: 2 as const, label: t.harmony.givenTwo },
              ] as const
            ).map((item) => {
              const selected = givenCount === item.id;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setGivenCount(item.id)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.optionHint}>{t.harmony.givenHint}</Text>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.harmony.inversions}</Text>
            <Text style={styles.optionHint}>
              {canInvert ? t.harmony.inversionsOn : t.harmony.inversionsOff}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t.harmony.inversionsA11y}
            value={inversions && canInvert}
            onValueChange={(value) => setInversions(value && canInvert)}
            disabled={!canInvert}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={inversions && canInvert ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.common.tones}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.harmony.tonesHint, { list: octaveLabelList(toneOctaves) })}
          </Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = toneOctaves.includes(item.octave);
              return (
                <Pressable
                  key={`tone-${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => chooseToneOctave(item.octave)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.common.slider}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.harmony.sliderHint, { low: sliderSpan.lowLabel, high: sliderSpan.highLabel })}
          </Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = filledOctaves(sliderOctaves).includes(item.octave);
              return (
                <Pressable
                  key={`slider-${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => chooseSliderOctave(item.octave)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.sliderChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.octaveChipText,
                      selected && styles.sliderChipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {phase !== 'idle' && round ? (
        <View style={styles.letterCard}>
          <Text style={styles.letterKicker}>{taskLabel}</Text>
          <Text style={[styles.letter, compact && styles.letterCompact]}>
            {round.find === 'third' ? '3' : '5'}
          </Text>
          <Text style={styles.letterHint}>{intervalHint}</Text>
        </View>
      ) : null}

      {phase === 'seeking' || phase === 'check' ? (
        <View style={styles.sliderCard}>
          <PitchSlider
            value={sliderCents}
            spanCents={round?.spanCents ?? 1200}
            onChange={onSlide}
            disabled={phase !== 'seeking'}
            lowLabel={round?.lowLabel}
            highLabel={round?.highLabel}
            markers={
              phase === 'check' && round
                ? [
                    { cents: round.targetCents, color: COLORS.hit },
                    { cents: sliderCents, color: COLORS.accent },
                  ]
                : undefined
            }
          />
        </View>
      ) : null}

      {phase === 'check' && result && round ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>{givenSummary(round, t)}</Text>
          <Text style={styles.compareLine}>
            {fmt(t.harmony.asked, {
              note: harmonyNoteLabel(round.targetHz),
              hint: intervalHint,
            })}
          </Text>
          <Text style={styles.compareLine}>
            {fmt(t.harmony.yourTone, { label: result.chosenLabel, hz: Math.round(chosenHz) })}
          </Text>
          <Text style={styles.compareHint}>
            {result.direction === 'on'
              ? fmt(t.find.deviationOn, { cents: Math.round(Math.abs(result.cents)) })
              : fmt(t.find.deviationOff, {
                  interval: result.interval,
                  direction: directionLabel(result.direction, t.intervals),
                  cents: Math.round(Math.abs(result.cents)),
                })}
          </Text>
          <Text style={styles.comparePlay}>
            {compareStep === 1
              ? t.harmony.compareYours
              : compareStep === 2
                ? t.harmony.compareReal
                : compareStep === 3
                  ? t.harmony.compareSolo
                  : t.harmony.compareIntro}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.harmony.hearCompareA11y}
            onPress={playCompare}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.harmony.hearCompare}</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'seeking' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.harmony.lockInA11y}
          onPress={lockIn}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{t.harmony.lockIn}</Text>
        </Pressable>
      ) : phase === 'check' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.harmony.againA11y}
            onPress={repeatRound}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.common.again}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.harmony.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t.common.next}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.startA11y}
          onPress={startRound}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
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
    paddingHorizontal: 12,
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
  sliderChipSelected: {
    backgroundColor: COLORS.close,
    borderColor: COLORS.close,
  },
  octaveChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  octaveChipTextSelected: {
    color: COLORS.ink,
  },
  sliderChipTextSelected: {
    color: COLORS.ink,
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
  letterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  letterKicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  letter: {
    fontSize: 88,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 96,
  },
  letterCompact: {
    fontSize: 72,
    lineHeight: 80,
  },
  letterHint: {
    fontSize: 16,
    color: COLORS.muted,
  },
  sliderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    padding: 20,
    gap: 12,
  },
  compare: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    padding: 16,
    gap: 10,
  },
  compareLine: {
    fontSize: 15,
    color: COLORS.text,
  },
  compareHint: {
    fontSize: 13,
    color: COLORS.hint,
  },
  comparePlay: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
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
  buttonPressed: {
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
