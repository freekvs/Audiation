import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDrone } from '../audio/drone';
import { beginSoundingRound } from '../audio/klank';
import { playHz, stopTone } from '../audio/toneUri';
import {
  exerciseOctave,
  EXERCISE_OCTAVES,
  type ExerciseOctave,
} from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import {
  CORE_MELODY_MAX,
  MELODY_COUNTS,
  emptyGuess,
  guessComplete,
  phraseKey,
  pickReversePhrase,
  placeRank,
  ranksEqual,
  reversedPhrase,
  scoreContour,
  type MelodyPhrase,
} from '../melody';
import {
  emptyMelodyProgress,
  formatMelodyStats,
  loadMelodyProgress,
  melodyAdvice,
  recordMelodyRound,
  saveMelodyProgress,
  type MelodyProgress,
} from '../melodyProgress';
import { fmt, useT } from '../i18n';
import { namedTone, relativeLabel, useNaming } from '../naming';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ContourGrid } from '../ui/ContourGrid';
import { DroneSwitch } from '../ui/DroneSwitch';

type Phase = 'idle' | 'playing' | 'placing' | 'check';

type Props = {
  onBack: () => void;
};

const PLAY_MS = 720;
const GAP_MS = 260;

export function ReverseScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(() => exerciseOctave(prefs.reverse.octave));
  const [count, setCount] = useState(prefs.reverse.count);
  const [phrase, setPhrase] = useState<MelodyPhrase>(() =>
    pickReversePhrase(exerciseOctave(prefs.reverse.octave).notes, prefs.reverse.count),
  );
  const [guess, setGuess] = useState<(number | null)[]>(() => emptyGuess(prefs.reverse.count));
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<MelodyProgress>(emptyMelodyProgress);
  const { droneEnabled, setDroneEnabled } = useDrone(octave.octave, false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const target = reversedPhrase(phrase);

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    void loadMelodyProgress('reverse').then(setProgress);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      stopTone();
    };
  }, []);

  useEffect(() => {
    update('reverse', { octave: octave.octave, count });
  }, [octave, count, update]);

  const playNote = (hz: number) => {
    void playHz(hz).catch(() => undefined);
  };

  const schedulePhrase = (next: MelodyPhrase, thenPlace: boolean, thenCheck: boolean) => {
    next.notes.forEach((note, index) => {
      const start = index * (PLAY_MS + GAP_MS);
      timers.current.push(
        setTimeout(() => {
          setPlayIndex(index);
          playNote(note.hz);
        }, start),
      );
      timers.current.push(
        setTimeout(() => {
          stopTone();
          if (index === next.notes.length - 1) {
            setPlayIndex(null);
            if (thenPlace) {
              setPhase('placing');
            } else if (thenCheck) {
              setPhase('check');
            }
          } else {
            setPlayIndex(null);
          }
        }, start + PLAY_MS),
      );
    });
  };

  const startRound = () => {
    beginSoundingRound();
    clearTimers();
    stopTone();
    const next = pickReversePhrase(octave.notes, count, phraseKey(phrase));
    setPhrase(next);
    beginReverse(next);
  };

  const repeatRound = () => {
    clearTimers();
    stopTone();
    beginReverse(phrase);
  };

  const beginReverse = (next: MelodyPhrase) => {
    setGuess(emptyGuess(next.notes.length));
    setPlayIndex(null);
    setPhase('playing');
    schedulePhrase(next, true, false);
  };

  const replayHeard = () => {
    if (phase === 'playing') {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    const keepPhase = phase;
    setPhase('playing');
    schedulePhrase(phrase, keepPhase === 'placing', keepPhase === 'check');
  };

  const replayReverse = () => {
    if (phase === 'playing') {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    setPhase('playing');
    schedulePhrase(target, false, true);
  };

  const check = () => {
    if (!guessComplete(guess)) {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    const result = scoreContour(guess, target.ranks);
    const next = recordMelodyRound(progress, phrase.notes.length, result.all);
    setProgress(next);
    void saveMelodyProgress(next, 'reverse');
    setPhase('check');
  };

  const chooseOctave = (next: ExerciseOctave) => {
    if (next.octave === octave.octave) {
      return;
    }
    clearTimers();
    stopTone();
    setOctave(next);
    setPhrase(pickReversePhrase(next.notes, count));
    setGuess(emptyGuess(count));
    setPlayIndex(null);
    setPhase('idle');
  };

  const chooseCount = (next: number) => {
    if (next === count) {
      return;
    }
    clearTimers();
    stopTone();
    setCount(next);
    setPhrase(pickReversePhrase(octave.notes, next));
    setGuess(emptyGuess(next));
    setPlayIndex(null);
    setPhase('idle');
  };

  const tapCell = (col: number, row: number) => {
    if (phase !== 'placing') {
      return;
    }
    setGuess((current) => placeRank(current, col, row));
  };

  const score =
    phase === 'check' && guessComplete(guess) ? scoreContour(guess, target.ranks) : null;
  const placedForward =
    phase === 'check' && guessComplete(guess) && ranksEqual(guess, phrase.ranks) && !score?.all;
  const heardNames = phrase.notes.map((note) => relativeLabel(note, naming)).join(' → ');
  const reverseNames = target.notes.map((note) => relativeLabel(note, naming)).join(' → ');
  const filled = guessComplete(guess);
  const advice = melodyAdvice(progress, count, t.melody);
  const statsLine = formatMelodyStats(progress, t.melody);

  const title =
    phase === 'playing'
      ? t.common.listen
      : phase === 'placing'
        ? t.reverse.titlePlace
        : phase === 'check'
          ? t.common.control
          : t.practice.reverse.title;

  const body =
    phase === 'idle'
      ? fmt(t.reverse.idle, { count, octave: octave.label })
      : phase === 'playing'
        ? t.reverse.playing
        : phase === 'placing'
          ? count === 2
            ? t.reverse.placingTwo
            : t.reverse.placing
          : score?.all
            ? fmt(t.reverse.hit, { heard: heardNames, reverse: reverseNames })
            : placedForward
              ? fmt(t.reverse.forward, { heard: heardNames, reverse: reverseNames })
              : fmt(t.reverse.miss, {
                  correct: score?.correct ?? 0,
                  total: phrase.notes.length,
                  heard: heardNames,
                  reverse: reverseNames,
                });

  const showOptions = phase === 'idle' || phase === 'check';

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      <View style={styles.stats}>
        <Text style={styles.statsLine}>{statsLine}</Text>
        {advice.text ? (
          showOptions ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={advice.text}
              onPress={() => chooseCount(advice.count)}
            >
              <Text style={styles.advice}>{advice.text}</Text>
            </Pressable>
          ) : (
            <Text style={styles.advice}>{advice.text}</Text>
          )
        ) : null}
      </View>

      {showOptions ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.melody.notes}</Text>
          <Text style={styles.optionHint}>{t.reverse.notesHint}</Text>
          <View style={styles.chipRow}>
            {MELODY_COUNTS.map((item) => {
              const selected = item === count;
              const recommended = advice.kind != null && item === advice.count && !selected;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={
                    recommended
                      ? fmt(t.melody.notesA11yAdvice, { n: item })
                      : fmt(t.melody.notesA11y, { n: item })
                  }
                  accessibilityState={{ selected }}
                  onPress={() => chooseCount(item)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    recommended && styles.chipAdvice,
                    item > CORE_MELODY_MAX && !selected && !recommended && styles.chipHard,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                      recommended && styles.chipAdviceText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {showOptions ? (
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
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {showOptions ? (
        <DroneSwitch value={droneEnabled} onValueChange={setDroneEnabled} />
      ) : null}

      <ContourGrid
        count={phrase.notes.length}
        guess={guess}
        truth={phase === 'check' ? target.ranks : null}
        playIndex={playIndex}
        locked={phase !== 'placing'}
        allHit={score?.all ?? false}
        onPlace={tapCell}
      />

      <View style={styles.timeRow}>
        {(phase === 'check' ? target.notes : phrase.notes).map((note, index) => (
          <Text key={`${note.id}-${index}`} style={styles.timeLabel}>
            {phase === 'check' ? relativeLabel(note, naming) : String(index + 1)}
          </Text>
        ))}
      </View>

      {phase === 'check' ? (
        <Text style={styles.reveal}>
          {phrase.notes.map((note) => namedTone(note, naming)).join(' · ')}
          {'  →  '}
          {target.notes.map((note) => namedTone(note, naming)).join(' · ')}
        </Text>
      ) : null}

      {phase === 'placing' || phase === 'check' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.reverse.hearAgainA11y}
          onPress={replayHeard}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.melody.hearAgain}</Text>
        </Pressable>
      ) : null}

      {phase === 'check' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.reverse.hearReverseA11y}
          onPress={replayReverse}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.reverse.hearReverse}</Text>
        </Pressable>
      ) : null}

      {phase === 'placing' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.reverse.checkA11y}
          onPress={check}
          disabled={!filled}
          style={({ pressed }) => [
            styles.button,
            !filled && styles.buttonDisabled,
            pressed && filled && styles.pressed,
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
            accessibilityLabel={t.reverse.againA11y}
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
            accessibilityLabel={t.reverse.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{t.reverse.next}</Text>
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
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.muted,
  },
  stats: {
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    padding: 16,
  },
  statsLine: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  advice: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.hit,
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
    minWidth: 44,
    paddingHorizontal: 10,
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
  chipHard: {
    opacity: 0.7,
  },
  chipAdvice: {
    borderColor: COLORS.hit,
  },
  chipAdviceText: {
    color: COLORS.hit,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.ink,
  },
  timeRow: {
    marginLeft: 44,
    flexDirection: 'row',
  },
  timeLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hint,
  },
  reveal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonPlaceholder: {
    minHeight: 48,
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
