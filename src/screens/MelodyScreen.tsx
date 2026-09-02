import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDrone } from '../audio/drone';
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
  pickPhrase,
  placeRank,
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

export function MelodyScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(() => exerciseOctave(prefs.melody.octave));
  const [count, setCount] = useState(prefs.melody.count);
  const [phrase, setPhrase] = useState<MelodyPhrase>(() =>
    pickPhrase(exerciseOctave(prefs.melody.octave).notes, prefs.melody.count),
  );
  const [guess, setGuess] = useState<(number | null)[]>(() => emptyGuess(prefs.melody.count));
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<MelodyProgress>(emptyMelodyProgress);
  const { droneEnabled, setDroneEnabled } = useDrone(octave.octave, false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    void loadMelodyProgress().then(setProgress);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      stopTone();
    };
  }, []);

  useEffect(() => {
    update('melody', { octave: octave.octave, count });
  }, [octave, count, update]);

  const playNote = (hz: number) => {
    void playHz(hz).catch(() => undefined);
  };

  const schedulePhrase = (next: MelodyPhrase, thenPlace: boolean) => {
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
            }
          } else {
            setPlayIndex(null);
          }
        }, start + PLAY_MS),
      );
    });
  };

  const startRound = () => {
    clearTimers();
    stopTone();
    const next = pickPhrase(octave.notes, count, phraseKey(phrase));
    setPhrase(next);
    beginMelody(next);
  };

  const repeatRound = () => {
    clearTimers();
    stopTone();
    beginMelody(phrase);
  };

  const beginMelody = (next: MelodyPhrase) => {
    setGuess(emptyGuess(next.notes.length));
    setPlayIndex(null);
    setPhase('playing');
    schedulePhrase(next, true);
  };

  const replayPhrase = () => {
    if (phase === 'playing') {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    const keepPhase = phase;
    setPhase('playing');
    schedulePhrase(phrase, keepPhase === 'placing' || keepPhase === 'idle');
    if (keepPhase === 'check') {
      timers.current.push(
        setTimeout(
          () => {
            setPhase('check');
          },
          phrase.notes.length * (PLAY_MS + GAP_MS) - GAP_MS,
        ),
      );
    }
  };

  const check = () => {
    if (!guessComplete(guess)) {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    const result = scoreContour(guess, phrase.ranks);
    const next = recordMelodyRound(progress, phrase.notes.length, result.all);
    setProgress(next);
    void saveMelodyProgress(next);
    setPhase('check');
  };

  const chooseOctave = (next: ExerciseOctave) => {
    if (next.octave === octave.octave) {
      return;
    }
    clearTimers();
    stopTone();
    setOctave(next);
    setPhrase(pickPhrase(next.notes, count));
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
    setPhrase(pickPhrase(octave.notes, next));
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

  const score = phase === 'check' && guessComplete(guess) ? scoreContour(guess, phrase.ranks) : null;
  const names = phrase.notes.map((note) => relativeLabel(note, naming)).join(' → ');
  const filled = guessComplete(guess);
  const advice = melodyAdvice(progress, count, t.melody);
  const statsLine = formatMelodyStats(progress, t.melody);

  const title =
    phase === 'playing'
      ? t.common.listen
      : phase === 'placing'
        ? t.melody.titlePlace
        : phase === 'check'
          ? t.common.control
          : t.practice.melody.title;

  const body =
    phase === 'idle'
      ? fmt(t.melody.idle, { count, octave: octave.label })
      : phase === 'playing'
        ? t.melody.playing
        : phase === 'placing'
          ? droneEnabled
            ? t.melody.placingDrone
            : count === 2
              ? t.melody.placingTwo
              : t.melody.placing
          : score?.all
            ? fmt(t.melody.hit, { names })
            : fmt(t.melody.miss, {
                correct: score?.correct ?? 0,
                total: phrase.notes.length,
                names,
              });

  const showOptions = phase === 'idle' || phase === 'check';

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.melody.tagline}</Text>
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
          <Text style={styles.optionHint}>
            {fmt(t.melody.notesHint, { core: CORE_MELODY_MAX })}
          </Text>
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
        truth={phase === 'check' ? phrase.ranks : null}
        playIndex={playIndex}
        locked={phase !== 'placing'}
        allHit={score?.all ?? false}
        onPlace={tapCell}
      />

      <View style={styles.timeRow}>
        {phrase.notes.map((note, index) => (
          <Text key={note.id} style={styles.timeLabel}>
            {phase === 'check' ? relativeLabel(note, naming) : String(index + 1)}
          </Text>
        ))}
      </View>

      {phase === 'check' ? (
        <Text style={styles.reveal}>
          {phrase.notes.map((note) => namedTone(note, naming)).join(' · ')}
        </Text>
      ) : null}

      {phase === 'placing' || phase === 'check' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.melody.hearAgainA11y}
          onPress={replayPhrase}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.melody.hearAgain}</Text>
        </Pressable>
      ) : null}

      {phase === 'placing' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.melody.checkA11y}
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
            accessibilityLabel={t.melody.againA11y}
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
            accessibilityLabel={t.melody.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{t.melody.next}</Text>
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
