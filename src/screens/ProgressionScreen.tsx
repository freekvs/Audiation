import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { playChordHz, playHz, stopTone } from '../audio/toneUri';
import { EXERCISE_OCTAVES } from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import { filledOctaves, octaveLabelList, toggleToneOctave } from '../findNote';
import { fmt, useT } from '../i18n';
import { useNaming } from '../naming';
import {
  CHORD_GAP_MS,
  CHORD_PLAY_MS,
  PROGRESSION_LENGTHS,
  answerChips,
  cTonicHz,
  defaultPaletteForLength,
  degreeHint,
  degreePrimary,
  emptyGuess,
  emptyMarks,
  formatRoots,
  guessComplete,
  palettesForLength,
  pcFromNumberInput,
  pickProgression,
  progressionPlayMs,
  PATTERN_OPTIONS,
  scoreProgression,
  spellingFromInput,
  usesChromaticChips,
  type AccidentalMark,
  type ChordSize,
  type ProgressionPalette,
  type ProgressionPattern,
  type ProgressionRound,
} from '../progression';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { NamingChips } from '../ui/NamingChips';

type Phase = 'idle' | 'playing' | 'answering' | 'check';
type PlayMark = number | 'tonic' | null;

type Props = {
  onBack: () => void;
};

export function ProgressionScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [length, setLength] = useState(prefs.progression.length);
  const [palette, setPalette] = useState<ProgressionPalette>(prefs.progression.palette);
  const [size, setSize] = useState<ChordSize>(prefs.progression.size);
  const [inversions, setInversions] = useState(prefs.progression.inversions);
  const [hearTonic, setHearTonic] = useState(prefs.progression.hearTonic);
  const [pattern, setPattern] = useState<ProgressionPattern>(prefs.progression.pattern);
  const [toneOctaves, setToneOctaves] = useState<number[]>(() => [...prefs.progression.toneOctaves]);
  const [round, setRound] = useState<ProgressionRound | null>(null);
  const [guess, setGuess] = useState<(number | null)[]>(() => emptyGuess(prefs.progression.length));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [playIndex, setPlayIndex] = useState<PlayMark>(null);
  const [accidental, setAccidental] = useState<AccidentalMark | null>(null);
  const [spelling, setSpelling] = useState<(string | null)[]>(() => emptyMarks(prefs.progression.length));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const canInvert = filledOctaves(toneOctaves).length >= 2;
  const settingsOpen = phase === 'idle' || phase === 'check';
  const freePattern = pattern === 'free';
  const chromatic = usesChromaticChips(
    round?.palette ?? (freePattern ? palette : 'major'),
    naming,
  );
  const chips = answerChips(round?.palette ?? palette, naming);
  const palettes = palettesForLength(length);
  const filled = guessComplete(guess);
  const score =
    phase === 'check' && round && filled ? scoreProgression(guess, round) : null;

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
    update('progression', {
      length,
      palette,
      size,
      inversions,
      hearTonic,
      pattern,
      toneOctaves,
    });
  }, [length, palette, size, inversions, hearTonic, pattern, toneOctaves, update]);

  const scheduleChords = (next: ProgressionRound, thenAnswer: boolean) => {
    const cue = hearTonic;
    const offset = cue ? CHORD_PLAY_MS + CHORD_GAP_MS : 0;
    if (cue) {
      const tonic = cTonicHz(filledOctaves(toneOctaves)[0] ?? 4);
      timers.current.push(
        setTimeout(() => {
          setPlayIndex('tonic');
          void playHz(tonic).catch(() => undefined);
        }, 0),
      );
      timers.current.push(
        setTimeout(() => {
          stopTone();
          setPlayIndex(null);
        }, CHORD_PLAY_MS),
      );
    }
    next.chords.forEach((chord, index) => {
      const start = offset + index * (CHORD_PLAY_MS + CHORD_GAP_MS);
      timers.current.push(
        setTimeout(() => {
          setPlayIndex(index);
          void playChordHz(chord.hz).catch(() => undefined);
        }, start),
      );
      timers.current.push(
        setTimeout(() => {
          stopTone();
          if (index === next.chords.length - 1) {
            setPlayIndex(null);
            if (thenAnswer) {
              setPhase('answering');
            }
          } else {
            setPlayIndex(null);
          }
        }, start + CHORD_PLAY_MS),
      );
    });
  };

  const beginRound = (next: ProgressionRound, thenAnswer: boolean) => {
    setRound(next);
    setGuess(emptyGuess(next.chords.length));
    setSpelling(emptyMarks(next.chords.length));
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('playing');
    scheduleChords(next, thenAnswer);
  };

  const startRound = () => {
    clearTimers();
    stopTone();
    beginRound(
      pickProgression({
        length,
        palette,
        size,
        inversions: inversions && canInvert,
        toneOctaves,
        naming,
        pattern,
      }),
      true,
    );
  };

  const repeatRound = () => {
    if (!round) {
      return;
    }
    clearTimers();
    stopTone();
    beginRound(round, true);
  };

  const replayRound = () => {
    if (!round || phase === 'playing') {
      return;
    }
    clearTimers();
    stopTone();
    const keep = phase;
    setPlayIndex(null);
    setPhase('playing');
    scheduleChords(round, keep === 'answering' || keep === 'idle');
    if (keep === 'check') {
      timers.current.push(
        setTimeout(
          () => {
            setPhase('check');
          },
          progressionPlayMs(round.chords.length, hearTonic),
        ),
      );
    }
  };

  const check = () => {
    if (!round || !guessComplete(guess)) {
      return;
    }
    clearTimers();
    stopTone();
    setPlayIndex(null);
    setSelectedSlot(null);
    setAccidental(null);
    setPhase('check');
  };

  const chooseLength = (next: number) => {
    if (next === length) {
      return;
    }
    clearTimers();
    stopTone();
    setPattern('free');
    setLength(next);
    setPalette(defaultPaletteForLength(next));
    setGuess(emptyGuess(next));
    setSpelling(emptyMarks(next));
    setRound(null);
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('idle');
  };

  const choosePattern = (next: ProgressionPattern) => {
    if (next === pattern) {
      return;
    }
    clearTimers();
    stopTone();
    setPattern(next);
    if (next !== 'free') {
      setPalette('major');
    }
    setRound(null);
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('idle');
  };

  const choosePalette = (next: ProgressionPalette) => {
    if (next === palette) {
      return;
    }
    clearTimers();
    stopTone();
    setPalette(next);
    setRound(null);
    setGuess(emptyGuess(length));
    setSpelling(emptyMarks(length));
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('idle');
  };

  const chooseSize = (next: ChordSize) => {
    if (next === size) {
      return;
    }
    clearTimers();
    stopTone();
    setSize(next);
    setRound(null);
    setGuess(emptyGuess(length));
    setSpelling(emptyMarks(length));
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('idle');
  };

  const chooseOctave = (octave: number) => {
    const next = toggleToneOctave(toneOctaves, octave);
    clearTimers();
    stopTone();
    setToneOctaves(next);
    if (filledOctaves(next).length < 2) {
      setInversions(false);
    }
    setRound(null);
    setGuess(emptyGuess(length));
    setSpelling(emptyMarks(length));
    setSelectedSlot(null);
    setAccidental(null);
    setPlayIndex(null);
    setPhase('idle');
  };

  const fillSlot = (pc: number, label: string) => {
    setGuess((current) => {
      const next = [...current];
      const idx = selectedSlot ?? next.findIndex((item) => item == null);
      if (idx < 0 || idx >= next.length) {
        return current;
      }
      next[idx] = pc;
      setSpelling((marks) => {
        const copy = [...marks];
        copy[idx] = label;
        return copy;
      });
      return next;
    });
    setSelectedSlot(null);
    setAccidental(null);
  };

  const tapSlot = (index: number) => {
    if (phase !== 'answering') {
      return;
    }
    setAccidental(null);
    setSelectedSlot((current) => {
      if (current === index) {
        setGuess((items) => {
          const next = [...items];
          next[index] = null;
          return next;
        });
        setSpelling((marks) => {
          const next = [...marks];
          next[index] = null;
          return next;
        });
        return null;
      }
      return index;
    });
  };

  const tapChip = (pc: number) => {
    if (phase !== 'answering') {
      return;
    }
    fillSlot(pc, degreePrimary(pc, naming));
  };

  const tapAccidental = (mark: AccidentalMark) => {
    if (phase !== 'answering') {
      return;
    }
    setAccidental((current) => (current === mark ? null : mark));
  };

  const tapNumber = (degree: number) => {
    if (phase !== 'answering') {
      return;
    }
    fillSlot(pcFromNumberInput(degree, accidental), spellingFromInput(degree, accidental));
  };

  const paletteHint =
    palette === 'major'
      ? t.progression.paletteMajorHint
      : palette === 'known'
        ? t.progression.paletteKnownHint
        : t.progression.paletteRandomHint;

  const patternHint =
    pattern === 'cadence'
      ? t.progression.patternHintCadence
      : pattern === 'oneFourFive'
        ? t.progression.patternHint145
        : t.progression.patternHintFree;

  const idleBody =
    pattern === 'cadence'
      ? hearTonic
        ? t.progression.idleCadenceCue
        : t.progression.idleCadence
      : pattern === 'oneFourFive'
        ? hearTonic
          ? t.progression.idle145Cue
          : t.progression.idle145
        : fmt(hearTonic ? t.progression.idleCue : t.progression.idle, { count: length });

  const title =
    phase === 'playing'
      ? t.common.listen
      : phase === 'answering'
        ? t.progression.titleAnswer
        : phase === 'check'
          ? t.common.control
          : t.practice.progression.title;

  const body =
    phase === 'idle'
      ? idleBody
      : phase === 'playing'
        ? hearTonic
          ? t.progression.playingCue
          : t.progression.playing
        : phase === 'answering'
          ? t.progression.answering
          : score?.all
            ? fmt(t.progression.hit, {
                names: round ? formatRoots(round.chords.map((item) => item.rootPc), naming) : '',
              })
            : fmt(t.progression.miss, {
                correct: score?.correct ?? 0,
                total: score?.total ?? length,
                guessed: formatRoots(guess.map((pc) => pc ?? -1).filter((pc) => pc >= 0), naming),
                names: round ? formatRoots(round.chords.map((item) => item.rootPc), naming) : '',
              });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.progression.tagline}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {settingsOpen || phase === 'answering' ? (
        <NamingChips compact={phase === 'answering'} />
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.progression.tonicTitle}</Text>
            <Text style={styles.optionHint}>{t.progression.tonicHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.progression.tonicA11y}
            value={hearTonic}
            onValueChange={setHearTonic}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={hearTonic ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.progression.pattern}</Text>
          <ChoiceHelp
            label={t.help.cadenceTitle}
            body={t.help.cadence}
            a11y={fmt(t.help.moreA11y, { term: t.help.cadenceTitle })}
          />
          <Text style={styles.optionHint}>{patternHint}</Text>
          <View style={styles.chipRow}>
            {PATTERN_OPTIONS.map((id) => {
              const selected = id === pattern;
              const label =
                id === 'free'
                  ? t.progression.patternFree
                  : id === 'cadence'
                    ? t.progression.patternCadence
                    : t.progression.pattern145;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => choosePattern(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.chipWide,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen && freePattern ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.progression.chords}</Text>
          <Text style={styles.optionHint}>{t.progression.chordsHint}</Text>
          <View style={styles.chipRow}>
            {PROGRESSION_LENGTHS.map((n) => {
              const selected = n === length;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.progression.chordsA11y, { n })}
                  accessibilityState={{ selected }}
                  onPress={() => chooseLength(n)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen && freePattern ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.progression.palette}</Text>
          <ChoiceHelp
            label={t.help.modesTitle}
            body={t.help.modes}
            a11y={fmt(t.help.moreA11y, { term: t.help.modesTitle })}
          />
          <ChoiceHelp
            label={t.help.minorTitle}
            body={t.help.minor}
            a11y={fmt(t.help.moreA11y, { term: t.help.minorTitle })}
          />
          <Text style={styles.optionHint}>{paletteHint}</Text>
          <View style={styles.chipRow}>
            {palettes.map((id) => {
              const selected = id === palette;
              const label =
                id === 'major'
                  ? t.progression.paletteMajor
                  : id === 'known'
                    ? t.progression.paletteKnown
                    : t.progression.paletteRandom;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => choosePalette(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.chipWide,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.progression.size}</Text>
          <Text style={styles.optionHint}>{t.progression.sizeHint}</Text>
          <View style={styles.chipRow}>
            {([3, 4] as const).map((n) => {
              const selected = n === size;
              const label = n === 3 ? t.progression.triad : t.progression.seventh;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => chooseSize(n)}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.chipWide,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.progression.inversions}</Text>
            <Text style={styles.optionHint}>
              {canInvert ? t.progression.inversionsOn : t.progression.inversionsOff}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t.progression.inversionsA11y}
            value={inversions && canInvert}
            onValueChange={(value) => setInversions(value && canInvert)}
            disabled={!canInvert}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={inversions && canInvert ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionBlock}>
          <Text style={styles.optionTitle}>{t.common.octave}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.progression.tonesHint, { list: octaveLabelList(toneOctaves) })}
          </Text>
          <View style={styles.chipRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = toneOctaves.includes(item.octave);
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.piano.octaveA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => chooseOctave(item.octave)}
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

      {phase !== 'idle' && round && hearTonic ? (
        <View style={[styles.tonicBanner, playIndex === 'tonic' && styles.slotPlaying]}>
          <Text style={styles.slotIndex}>{t.progression.tonicMark}</Text>
          <Text style={[styles.slotValue, compact && styles.slotValueCompact]}>
            {naming === 'nashville' ? '1' : 'Do'}
          </Text>
          <Text style={styles.slotHint}>C</Text>
        </View>
      ) : null}

      {phase !== 'idle' && round ? (
        <View style={styles.slotRow}>
          {round.chords.map((chord, index) => {
            const chosen = guess[index];
            const playing = playIndex === index;
            const selected = selectedSlot === index;
            const truth = phase === 'check' ? chord.rootPc : null;
            const hit = truth != null && chosen === truth;
            const miss = truth != null && chosen != null && chosen !== truth;
            return (
              <Pressable
                key={`slot-${index}`}
                accessibilityRole="button"
                accessibilityLabel={fmt(t.progression.slotA11y, { n: index + 1 })}
                accessibilityState={{ selected }}
                onPress={() => tapSlot(index)}
                style={[
                  styles.slot,
                  playing && styles.slotPlaying,
                  selected && styles.slotSelected,
                  hit && styles.slotHit,
                  miss && styles.slotMiss,
                ]}
              >
                <Text style={styles.slotIndex}>{index + 1}</Text>
                <Text style={[styles.slotValue, compact && styles.slotValueCompact]}>
                  {chosen == null ? '·' : spelling[index] ?? degreePrimary(chosen, naming)}
                </Text>
                {phase === 'check' && miss ? (
                  <Text style={styles.slotTruth}>{degreePrimary(truth, naming)}</Text>
                ) : (
                  <Text style={styles.slotHint}>
                    {chosen == null ? '' : degreeHint(chosen)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {phase === 'answering' && naming === 'nashville' ? (
        <View style={styles.pad}>
          {chromatic ? (
            <>
              <Text style={styles.optionHint}>{t.progression.numberPadHint}</Text>
              <View style={styles.chipRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.progression.sharpA11y}
                  accessibilityState={{ selected: accidental === 'sharp' }}
                  onPress={() => tapAccidental('sharp')}
                  style={({ pressed }) => [
                    styles.degreeChip,
                    accidental === 'sharp' && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.degreePrimary,
                      accidental === 'sharp' && styles.chipTextSelected,
                    ]}
                  >
                    ♯
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.progression.flatA11y}
                  accessibilityState={{ selected: accidental === 'flat' }}
                  onPress={() => tapAccidental('flat')}
                  style={({ pressed }) => [
                    styles.degreeChip,
                    accidental === 'flat' && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.degreePrimary,
                      accidental === 'flat' && styles.chipTextSelected,
                    ]}
                  >
                    ♭
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={fmt(t.progression.numberA11y, { n })}
                onPress={() => tapNumber(n)}
                style={({ pressed }) => [styles.degreeChip, pressed && styles.pressed]}
              >
                <Text style={styles.degreePrimary}>
                  {accidental === 'sharp' ? `♯${n}` : accidental === 'flat' ? `♭${n}` : String(n)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {phase === 'answering' && naming === 'solfege' ? (
        <View style={styles.chipRow}>
          {chips.map((pc) => (
            <Pressable
              key={pc}
              accessibilityRole="button"
              accessibilityLabel={fmt(t.progression.chipA11y, {
                label: `${degreePrimary(pc, naming)} ${degreeHint(pc)}`,
              })}
              onPress={() => tapChip(pc)}
              style={({ pressed }) => [styles.degreeChip, pressed && styles.pressed]}
            >
              <Text style={styles.degreePrimary}>{degreePrimary(pc, naming)}</Text>
              <Text style={styles.degreeHint}>{degreeHint(pc)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {phase === 'playing' ? <View style={styles.buttonPlaceholder} /> : null}

      {phase === 'answering' || phase === 'check' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.progression.hearAgainA11y}
          onPress={replayRound}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
            {t.progression.hearAgain}
          </Text>
        </Pressable>
      ) : null}

      {phase === 'answering' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.progression.checkA11y}
          disabled={!filled}
          onPress={check}
          style={({ pressed }) => [
            styles.button,
            !filled && styles.buttonDisabled,
            pressed && filled && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>{t.common.check}</Text>
        </Pressable>
      ) : phase === 'check' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.progression.againA11y}
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
            accessibilityLabel={t.progression.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{t.common.next}</Text>
          </Pressable>
        </View>
      ) : phase === 'idle' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.startA11y}
          onPress={startRound}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{t.common.start}</Text>
        </Pressable>
      ) : null}
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
  chipWide: {
    paddingHorizontal: 14,
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
  pad: {
    gap: 10,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tonicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  slot: {
    minWidth: 64,
    flexGrow: 1,
    flexBasis: 56,
    maxWidth: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  slotPlaying: {
    borderColor: COLORS.accent,
  },
  slotSelected: {
    borderColor: COLORS.close,
  },
  slotHit: {
    borderColor: COLORS.hit,
  },
  slotMiss: {
    borderColor: COLORS.accent,
  },
  slotIndex: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.hint,
  },
  slotValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  slotValueCompact: {
    fontSize: 18,
  },
  slotHint: {
    fontSize: 11,
    color: COLORS.hint,
    minHeight: 14,
  },
  slotTruth: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hit,
  },
  degreeChip: {
    minHeight: 52,
    minWidth: 72,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    gap: 2,
  },
  degreePrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  degreeHint: {
    fontSize: 11,
    color: COLORS.hint,
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
