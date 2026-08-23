import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { playHz, stopTone } from '../audio/toneUri';
import {
  DEFAULT_EXERCISE_OCTAVE,
  EXERCISE_OCTAVES,
  type ExerciseOctave,
} from '../exerciseNotes';
import {
  CORE_MELODY_MAX,
  DEFAULT_MELODY_COUNT,
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
import { namedTone, relativeLabel, useNaming } from '../naming';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';

type Phase = 'idle' | 'playing' | 'placing' | 'check';

type Props = {
  onBack: () => void;
};

const PLAY_MS = 720;
const GAP_MS = 260;

export function MelodyScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(DEFAULT_EXERCISE_OCTAVE);
  const [count, setCount] = useState(DEFAULT_MELODY_COUNT);
  const [phrase, setPhrase] = useState<MelodyPhrase>(() =>
    pickPhrase(DEFAULT_EXERCISE_OCTAVE.notes, DEFAULT_MELODY_COUNT),
  );
  const [guess, setGuess] = useState<(number | null)[]>(() =>
    emptyGuess(DEFAULT_MELODY_COUNT),
  );
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<MelodyProgress>(emptyMelodyProgress);
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
  const advice = melodyAdvice(progress, count);
  const statsLine = formatMelodyStats(progress);

  const title =
    phase === 'playing'
      ? 'Luister'
      : phase === 'placing'
        ? 'Zet de lijn'
        : phase === 'check'
          ? 'Controle'
          : 'Melodie';

  const body =
    phase === 'idle'
      ? `Je hoort ${count} tonen uit C-majeur in octaaf ${octave.label}. Daarna stilte. Zet per toon een punt: links is eerder, onder is lager. Geen notenbalk — alleen de lijn.`
      : phase === 'playing'
        ? 'Luister. Onthoud de lijn, niet de namen.'
        : phase === 'placing'
          ? count === 2
            ? 'Tik welke toon hoger was. Boven is hoger. Elk punt een eigen hoogte.'
            : 'Tik per kolom de hoogte. Boven is hoger, links is eerder. Elk punt een eigen hoogte.'
          : score?.all
            ? `Die lijn klopt. ${names}.`
            : `${score?.correct ?? 0} van ${phrase.notes.length} hoogtes goed. De groene lijn is hoe het was. ${names}.`;

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
          <Text style={styles.optionTitle}>Noten</Text>
          <Text style={styles.optionHint}>
            2 tot {CORE_MELODY_MAX} is de oefening. 5 tot 8 is lastig voor het geheugen.
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
                    recommended ? `${item} noten, aanbevolen` : `${item} noten`
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
          <Text style={styles.optionTitle}>Octaaf</Text>
          <View style={styles.chipRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = item.octave === octave.octave;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Kies octaaf ${item.label}`}
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
          accessibilityLabel="Speel de melodie opnieuw"
          onPress={replayPhrase}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>Hoor opnieuw</Text>
        </Pressable>
      ) : null}

      {phase === 'placing' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Controleer de lijn"
          onPress={check}
          disabled={!filled}
          style={({ pressed }) => [
            styles.button,
            !filled && styles.buttonDisabled,
            pressed && filled && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>Controleer</Text>
        </Pressable>
      ) : phase === 'playing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={phase === 'idle' ? 'Start oefening' : 'Volgende melodie'}
          onPress={startRound}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>
            {phase === 'idle' ? 'Start' : 'Volgende melodie'}
          </Text>
        </Pressable>
      )}
    </AppScreen>
  );
}

function ContourGrid({
  count,
  guess,
  truth,
  playIndex,
  locked,
  allHit,
  onPlace,
}: {
  count: number;
  guess: (number | null)[];
  truth: number[] | null;
  playIndex: number | null;
  locked: boolean;
  allHit: boolean;
  onPlace: (col: number, row: number) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ranks = Array.from({ length: count }, (_, index) => index);
  const cell = count <= 3 ? 56 : count <= 5 ? 48 : 40;
  const guessPoints = pointsFor(guess, count, size);
  const truthPoints = truth ? pointsFor(truth, count, size) : null;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View style={styles.gridWrap}>
      <View style={styles.axisCol} accessibilityElementsHidden>
        <Text style={styles.axisText}>hoog</Text>
        <Text style={styles.axisText}>laag</Text>
      </View>
      <View
        onLayout={onLayout}
        style={[styles.grid, { height: cell * count }]}
      >
        {guessPoints ? (
          <ContourLine
            points={guessPoints}
            color={allHit ? COLORS.hit : COLORS.accent}
          />
        ) : null}
        {truthPoints && !allHit ? (
          <ContourLine points={truthPoints} color={COLORS.hit} />
        ) : null}
        <View style={styles.gridCols}>
          {ranks.map((col) => (
            <View key={col} style={styles.gridCol}>
              {ranks.map((rowFromTop) => {
                const row = count - 1 - rowFromTop;
                const selected = guess[col] === row;
                const truthHere = truth?.[col] === row;
                const playing = playIndex === col;
                return (
                  <Pressable
                    key={row}
                    accessibilityRole="button"
                    accessibilityLabel={`Toon ${col + 1}, hoogte ${row + 1} van ${count}`}
                    accessibilityState={{ selected, disabled: locked }}
                    disabled={locked}
                    onPress={() => onPlace(col, row)}
                    style={({ pressed }) => [
                      styles.cell,
                      playing && styles.cellPlaying,
                      selected && styles.cellSelected,
                      truthHere && !allHit && styles.cellTruth,
                      selected && allHit && styles.cellHit,
                      pressed && !locked && styles.pressed,
                    ]}
                  >
                    {selected ? <View style={styles.dot} /> : null}
                    {truthHere && !selected && !allHit ? (
                      <View style={[styles.dot, styles.dotTruth]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function pointsFor(
  values: (number | null)[],
  count: number,
  size: { width: number; height: number },
): { x: number; y: number }[] | null {
  if (size.width <= 0 || size.height <= 0) {
    return null;
  }
  if (values.some((value) => value == null)) {
    return null;
  }
  return values.map((rank, col) => ({
    x: ((col + 0.5) * size.width) / count,
    y: size.height - (((rank ?? 0) + 0.5) * size.height) / count,
  }));
}

function ContourLine({
  points,
  color,
}: {
  points: { x: number; y: number }[];
  color: string;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1]!;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={index}
            style={[
              styles.line,
              {
                left: (start.x + end.x) / 2 - length / 2,
                top: (start.y + end.y) / 2 - 1.5,
                width: length,
                backgroundColor: color,
                transform: [{ rotate: `${deg}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
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
  gridWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  axisCol: {
    width: 36,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  axisText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hint,
  },
  grid: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    overflow: 'hidden',
  },
  gridCols: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
    flexDirection: 'column',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  cellPlaying: {
    backgroundColor: 'rgba(224, 122, 95, 0.22)',
  },
  cellSelected: {
    backgroundColor: 'rgba(224, 122, 95, 0.18)',
  },
  cellTruth: {
    borderColor: COLORS.hit,
  },
  cellHit: {
    backgroundColor: 'rgba(129, 178, 154, 0.28)',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
  },
  dotTruth: {
    backgroundColor: COLORS.hit,
  },
  line: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
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
