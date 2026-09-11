import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { beginSoundingRound } from '../audio/klank';
import { playDualHz, playHz, stopTone } from '../audio/toneUri';
import { EXERCISE_OCTAVES } from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import {
  describeFindNoteMiss,
  filledOctaves,
  hzFromCents,
  octaveLabelList,
  pickFindNoteRound,
  quantizeSliderCents,
  noteNameWithOctave,
  remapFindNoteRound,
  sliderSpanFor,
  toggleSliderOctave,
  toggleToneOctave,
  type FindNoteRound,
} from '../findNote';
import { directionLabel, fmt, useT } from '../i18n';
import { relativeLabel, useNaming } from '../naming';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { RoundActions } from '../ui/RoundActions';
import { StartButton } from '../ui/StartButton';
import { PitchSlider } from '../ui/PitchSlider';

type Phase = 'idle' | 'preview' | 'seeking' | 'check';

type Props = {
  onBack: () => void;
};

const CHECK_PLAY_MS = 1100;
const CHECK_GAP_MS = 280;
const PREVIEW_MS = 1200;

export function FindNoteScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [toneOctaves, setToneOctaves] = useState<number[]>(() => [...prefs.findNote.toneOctaves]);
  const [sliderOctaves, setSliderOctaves] = useState<number[]>(() => [...prefs.findNote.sliderOctaves]);
  const [hearCue, setHearCue] = useState(prefs.findNote.hearCue);
  const [round, setRound] = useState<FindNoteRound>(() =>
    pickFindNoteRound(prefs.findNote.toneOctaves, prefs.findNote.sliderOctaves),
  );
  const [sliderCents, setSliderCents] = useState(round.startCents);
  const [compareStep, setCompareStep] = useState<0 | 1 | 2 | 3>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastLoopHz = useRef(0);

  const chosenHz = hzFromCents(round.lowHz, sliderCents);
  const result =
    phase === 'check' ? describeFindNoteMiss(chosenHz, round.target.hz, t.intervals) : null;
  const sliderSpan = sliderSpanFor(sliderOctaves);
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
    update('findNote', { hearCue, toneOctaves, sliderOctaves });
  }, [hearCue, toneOctaves, sliderOctaves, update]);

  const hearLoop = (cents: number) => {
    const hz = hzFromCents(round.lowHz, cents);
    if (Math.abs(hz - lastLoopHz.current) < 0.05) {
      return;
    }
    lastLoopHz.current = hz;
    void playHz(hz, { loop: true }).catch(() => undefined);
  };

  const beginSeeking = (_next: FindNoteRound) => {
    setPhase('seeking');
    lastLoopHz.current = 0;
    stopTone();
  };

  const chooseToneOctave = (octave: number) => {
    const nextTones = toggleToneOctave(toneOctaves, octave);
    let nextSlider = sliderOctaves;
    const span = filledOctaves(sliderOctaves);
    if (octave < span[0]! || octave > span[span.length - 1]!) {
      nextSlider = toggleSliderOctave(sliderOctaves, octave);
    }
    setToneOctaves(nextTones);
    setSliderOctaves(filledOctaves(nextSlider));
  };

  const chooseSliderOctave = (octave: number) => {
    setSliderOctaves(toggleSliderOctave(sliderOctaves, octave));
  };

  const beginRound = (next: FindNoteRound) => {
    setSliderCents(next.startCents);
    setCompareStep(0);
    lastLoopHz.current = 0;

    if (hearCue) {
      setPhase('preview');
      void playHz(next.source.hz).catch(() => undefined);
      timers.current.push(
        setTimeout(() => {
          stopTone();
          beginSeeking(next);
        }, PREVIEW_MS),
      );
      return;
    }

    beginSeeking(next);
  };

  const startRound = () => {
    beginSoundingRound();
    clearTimers();
    stopTone();
    const next = pickFindNoteRound(toneOctaves, sliderOctaves, round.source.id);
    setRound(next);
    beginRound(next);
  };

  const repeatRound = () => {
    clearTimers();
    stopTone();
    const next = remapFindNoteRound(round, toneOctaves, sliderOctaves);
    setRound(next);
    beginRound(next);
  };

  const onSlide = (cents: number) => {
    if (phase !== 'seeking') {
      return;
    }
    const next = quantizeSliderCents(cents, round.spanCents);
    setSliderCents(next);
    hearLoop(next);
  };

  const playCompare = () => {
    clearTimers();
    stopTone();
    const guess = hzFromCents(round.lowHz, sliderCents);
    const base = round.source.hz;
    setCompareStep(1);
    void playHz(guess).catch(() => undefined);

    timers.current.push(
      setTimeout(() => {
        setCompareStep(2);
        void playHz(base).catch(() => undefined);
      }, CHECK_PLAY_MS + CHECK_GAP_MS),
    );

    timers.current.push(
      setTimeout(() => {
        setCompareStep(3);
        void playDualHz(guess, base).catch(() => undefined);
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

  const letter = round.source.name.replace(/[0-9]/g, '');
  const degree = relativeLabel(round.source, naming);
  const otherOctave = round.source.id !== round.target.id;
  const toneList = octaveLabelList(toneOctaves);

  const title =
    phase === 'preview'
      ? t.common.listen
      : phase === 'seeking'
        ? t.find.titleSeek
        : phase === 'check'
          ? t.common.control
          : t.practice.findNote.title;

  const body =
    phase === 'idle'
      ? hearCue
        ? fmt(t.find.idleCue, { low: sliderSpan.lowLabel, high: sliderSpan.highLabel })
        : fmt(t.find.idleSilent, { low: sliderSpan.lowLabel, high: sliderSpan.highLabel })
      : phase === 'preview'
        ? t.find.preview
        : phase === 'seeking'
          ? otherOctave
            ? fmt(t.find.otherOctave, {
                source: noteNameWithOctave(round.source),
                target: noteNameWithOctave(round.target),
              })
            : hearCue
              ? t.find.seekingCue
              : t.find.seekingSilent
          : result?.quality === 'hit'
            ? otherOctave
              ? fmt(t.find.hitOther, { letter })
              : fmt(t.find.hit, { letter })
            : result?.quality === 'close'
              ? fmt(t.find.close, {
                  letter,
                  interval: result.interval,
                  direction: directionLabel(result.direction, t.intervals),
                })
              : fmt(t.find.miss, {
                  letter,
                  chosen: result?.chosenLabel,
                  interval: result?.interval,
                  direction: result
                    ? directionLabel(result.direction, t.intervals)
                    : '',
                });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'check' ? (
        <RoundActions
          againA11y={t.find.againA11y}
          nextA11y={t.find.nextA11y}
          nextLabel={t.find.next}
          onAgain={repeatRound}
          onNext={startRound}
          preferAgain={result != null && result.quality !== 'hit'}
        />
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.find.cueTitle}</Text>
            <Text style={styles.optionHint}>{t.find.cueHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.find.cueA11y}
            value={hearCue}
            onValueChange={setHearCue}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={hearCue ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.common.tones}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.find.tonesHint, { list: toneList })}
          </Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = toneOctaves.includes(item.octave);
              return (
                <Pressable
                  key={`tone-${item.label}`}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.find.tonesA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => chooseToneOctave(item.octave)}
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
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.common.slider}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.find.sliderHint, { low: sliderSpan.lowLabel, high: sliderSpan.highLabel })}
          </Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const filled = filledOctaves(sliderOctaves);
              const selected = filled.includes(item.octave);
              return (
                <Pressable
                  key={`slider-${item.label}`}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.find.sliderA11y, { label: item.label })}
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

      {phase !== 'idle' ? (
        <View style={styles.letterCard}>
          <Text style={styles.letterKicker}>{t.find.letterKicker}</Text>
          <Text style={[styles.letter, compact && styles.letterCompact]}>{letter}</Text>
          <Text style={styles.letterHint}>
            {otherOctave
              ? `${degree} · ${noteNameWithOctave(round.source)} → ${noteNameWithOctave(round.target)}`
              : `${degree} · ${noteNameWithOctave(round.source)}`}
          </Text>
        </View>
      ) : null}

      {phase === 'seeking' || phase === 'check' ? (
        <View style={styles.sliderCard}>
          <PitchSlider
            value={sliderCents}
            spanCents={round.spanCents}
            onChange={onSlide}
            disabled={phase !== 'seeking'}
            lowLabel={round.lowLabel}
            highLabel={round.highLabel}
            markers={
              phase === 'check'
                ? [
                    { cents: round.targetCents, color: COLORS.hit },
                    { cents: sliderCents, color: COLORS.accent },
                  ]
                : undefined
            }
          />
          {phase === 'seeking' ? (
            <Text style={styles.sliderHint}>
              {fmt(t.find.sliderFollow, { low: round.lowLabel, high: round.highLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {phase === 'check' && result ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>
            {otherOctave
              ? fmt(t.find.baseNote, {
                  letter: noteNameWithOctave(round.source),
                  hz: Math.round(round.source.hz),
                })
              : fmt(t.find.realNote, { letter, hz: Math.round(round.source.hz) })}
          </Text>
          {otherOctave ? (
            <Text style={styles.compareLine}>
              {fmt(t.find.searchNote, {
                letter: noteNameWithOctave(round.target),
                hz: Math.round(round.target.hz),
              })}
            </Text>
          ) : null}
          <Text style={styles.compareLine}>
            {fmt(t.find.yourTone, { label: result.chosenLabel, hz: Math.round(chosenHz) })}
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
              ? t.find.compareYour
              : compareStep === 2
                ? otherOctave
                  ? t.find.compareBase
                  : t.find.compareReal
                : compareStep === 3
                  ? t.find.compareTogether
                  : t.find.compareIntro}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.find.hearYourA11y}
            onPress={() => {
              clearTimers();
              setCompareStep(1);
              void playHz(chosenHz).catch(() => undefined);
            }}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.find.hearYour}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={otherOctave ? t.find.hearBaseA11y : t.find.hearRealA11y}
            onPress={() => {
              clearTimers();
              setCompareStep(2);
              void playHz(round.source.hz).catch(() => undefined);
            }}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              {otherOctave ? t.find.hearBase : t.find.hearReal}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.find.hearBothA11y}
            onPress={() => {
              clearTimers();
              setCompareStep(3);
              void playDualHz(chosenHz, round.source.hz).catch(() => undefined);
            }}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.find.hearBoth}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.find.hearCompareA11y}
            onPress={playCompare}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.find.hearCompare}</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'seeking' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.find.lockInA11y}
          onPress={lockIn}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{t.find.lockIn}</Text>
        </Pressable>
      ) : phase === 'preview' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'check' ? null : (
        <StartButton
          accessibilityLabel={t.common.startA11y}
          label={t.common.start}
          onPress={startRound}
          pressedStyle={styles.buttonPressed}
          style={styles.button}
          textStyle={styles.buttonText}
        />
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
  sliderHint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  actions: {
    gap: 10,
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
