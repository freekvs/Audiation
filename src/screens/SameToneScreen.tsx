import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { beginSoundingRound } from '../audio/klank';
import { playHz, stopTone } from '../audio/toneUri';
import { EXERCISE_OCTAVES } from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import { octaveLabelList, sliderSpanFor, toggleToneOctave } from '../findNote';
import { fmt, useT } from '../i18n';
import {
  allLocked,
  emptyLocks,
  hzFromCents,
  pickSameToneRound,
  pitchClassLetter,
  quantizeSliderCents,
  scoreSameTone,
  type SameToneRound,
} from '../sameTone';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { RoundActions } from '../ui/RoundActions';
import { StartButton } from '../ui/StartButton';
import { PitchSlider } from '../ui/PitchSlider';

type Phase = 'idle' | 'preview' | 'seeking' | 'check';

type Props = {
  onBack: () => void;
};

const CHECK_PLAY_MS = 900;
const CHECK_GAP_MS = 240;
const PREVIEW_MS = 1100;

export function SameToneScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [hearOctaves, setHearOctaves] = useState<number[]>(() => [...prefs.sameTone.hearOctaves]);
  const [searchOctaves, setSearchOctaves] = useState<number[]>(() => [
    ...prefs.sameTone.searchOctaves,
  ]);
  const [round, setRound] = useState<SameToneRound>(() =>
    pickSameToneRound(prefs.sameTone.hearOctaves, prefs.sameTone.searchOctaves),
  );
  const [sliderCents, setSliderCents] = useState(round.startCents);
  const [locks, setLocks] = useState<Array<number | null>>(() => emptyLocks(round.targets.length));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastLoopHz = useRef(0);

  const sliderSpan = sliderSpanFor(searchOctaves);
  const settingsOpen = phase === 'idle' || phase === 'check';
  const filled = locks.filter((item): item is number => item != null).map((hz) => ({ hz }));
  const score =
    phase === 'check' ? scoreSameTone(filled, round.targets, t.intervals) : null;

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
    update('sameTone', { hearOctaves, searchOctaves });
  }, [hearOctaves, searchOctaves, update]);

  const hearLoop = (cents: number) => {
    const hz = hzFromCents(round.span.lowHz, cents);
    if (Math.abs(hz - lastLoopHz.current) < 0.05) {
      return;
    }
    lastLoopHz.current = hz;
    void playHz(hz, { loop: true }).catch(() => undefined);
  };

  const beginSeeking = (next: SameToneRound) => {
    setLocks(emptyLocks(next.targets.length));
    setPhase('seeking');
    lastLoopHz.current = 0;
    stopTone();
  };

  const beginRound = (next: SameToneRound) => {
    setSliderCents(next.startCents);
    lastLoopHz.current = 0;
    setLocks(emptyLocks(next.targets.length));
    setPhase('preview');
    void playHz(next.heard.hz).catch(() => undefined);
    timers.current.push(
      setTimeout(() => {
        stopTone();
        beginSeeking(next);
      }, PREVIEW_MS),
    );
  };

  const startRound = () => {
    beginSoundingRound();
    clearTimers();
    stopTone();
    const next = pickSameToneRound(hearOctaves, searchOctaves, round.heard.id);
    setRound(next);
    beginRound(next);
  };

  const repeatRound = () => {
    clearTimers();
    stopTone();
    beginRound(round);
  };

  const goCheck = (nextLocks: Array<number | null>) => {
    lastLoopHz.current = 0;
    stopTone();
    setLocks(nextLocks);
    setPhase('check');
    playCompare(nextLocks.filter((item): item is number => item != null));
  };

  const playCompare = (hzList: number[]) => {
    clearTimers();
    stopTone();
    const steps = [round.heard.hz, ...hzList, ...round.targets.map((note) => note.hz)];
    void playHz(steps[0]!).catch(() => undefined);
    steps.forEach((_, index) => {
      if (index === 0) {
        return;
      }
      timers.current.push(
        setTimeout(() => {
          void playHz(steps[index]!).catch(() => undefined);
        }, (CHECK_PLAY_MS + CHECK_GAP_MS) * index),
      );
    });
    timers.current.push(
      setTimeout(() => {
        stopTone();
      }, (CHECK_PLAY_MS + CHECK_GAP_MS) * steps.length),
    );
  };

  const onSlide = (cents: number) => {
    if (phase !== 'seeking') {
      return;
    }
    const next = quantizeSliderCents(cents, round.span.spanCents);
    setSliderCents(next);
    hearLoop(next);
  };

  const toggleLock = (index: number) => {
    if (phase !== 'seeking') {
      return;
    }
    const next = locks.slice();
    if (next[index] != null) {
      next[index] = null;
      setLocks(next);
      return;
    }
    next[index] = hzFromCents(round.span.lowHz, sliderCents);
    if (allLocked(next)) {
      goCheck(next);
      return;
    }
    setLocks(next);
  };

  const letter = pitchClassLetter(round.heard.id);
  const hearList = octaveLabelList(hearOctaves);
  const searchList = octaveLabelList(searchOctaves);

  const title =
    phase === 'preview'
      ? t.common.listen
      : phase === 'seeking'
        ? t.sameTone.titleSeek
        : phase === 'check'
          ? t.common.control
          : t.practice.sameTone.title;

  const body =
    phase === 'idle'
      ? fmt(t.sameTone.idle, { hear: hearList, search: searchList })
      : phase === 'preview'
        ? t.sameTone.preview
        : phase === 'seeking'
          ? fmt(t.sameTone.seeking, {
              n: round.targets.length,
              left: locks.filter((item) => item == null).length,
              low: round.span.lowLabel,
              high: round.span.highLabel,
            })
          : score?.quality === 'hit'
            ? fmt(t.sameTone.hit, { letter, n: score.total })
            : score?.quality === 'close'
              ? fmt(t.sameTone.close, { letter, hit: score.hit, total: score.total })
              : fmt(t.sameTone.miss, { letter, hit: score?.hit ?? 0, total: score?.total ?? 0 });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'check' ? (
        <RoundActions
          againA11y={t.sameTone.againA11y}
          nextA11y={t.sameTone.nextA11y}
          nextLabel={t.sameTone.next}
          onAgain={repeatRound}
          onNext={startRound}
          preferAgain={score != null && score.quality !== 'hit'}
        />
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <ChoiceHelp
            label={t.sameTone.hearTitle}
            body={t.help.sameTone}
            a11y={fmt(t.help.moreA11y, { term: t.help.sameToneTitle })}
          />
          <Text style={styles.optionHint}>{fmt(t.sameTone.hearHint, { list: hearList })}</Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = hearOctaves.includes(item.octave);
              return (
                <Pressable
                  key={`hear-${item.label}`}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.sameTone.hearA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => setHearOctaves(toggleToneOctave(hearOctaves, item.octave))}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}
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
          <Text style={styles.optionTitle}>{t.sameTone.searchTitle}</Text>
          <Text style={styles.optionHint}>
            {fmt(t.sameTone.searchHint, { list: searchList, low: sliderSpan.lowLabel, high: sliderSpan.highLabel })}
          </Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = searchOctaves.includes(item.octave);
              return (
                <Pressable
                  key={`search-${item.label}`}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.sameTone.searchA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => setSearchOctaves(toggleToneOctave(searchOctaves, item.octave))}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.sliderChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[styles.octaveChipText, selected && styles.sliderChipTextSelected]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {phase === 'seeking' || phase === 'check' ? (
        <View style={styles.sliderCard}>
          <PitchSlider
            value={sliderCents}
            spanCents={round.span.spanCents}
            onChange={onSlide}
            disabled={phase !== 'seeking'}
            lowLabel={round.span.lowLabel}
            highLabel={round.span.highLabel}
            markers={
              phase === 'check'
                ? [
                    ...round.targets.map((note) => ({
                      cents: (1200 * Math.log2(note.hz / round.span.lowHz)),
                      color: COLORS.hit,
                    })),
                    ...filled.map((lock) => ({
                      cents: (1200 * Math.log2(lock.hz / round.span.lowHz)),
                      color: COLORS.accent,
                    })),
                  ]
                : undefined
            }
          />
          {phase === 'seeking' ? (
            <Text style={styles.sliderHint}>
              {fmt(t.sameTone.sliderFollow, { low: round.span.lowLabel, high: round.span.highLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {phase === 'seeking' || phase === 'check' ? (
        <View style={styles.dotsRow}>
          {locks.map((lock, index) => {
            const on = lock != null;
            return (
              <Pressable
                key={`dot-${index}`}
                accessibilityRole="button"
                accessibilityLabel={fmt(on ? t.sameTone.dotOffA11y : t.sameTone.dotOnA11y, {
                  n: index + 1,
                  total: locks.length,
                })}
                accessibilityState={{ selected: on }}
                disabled={phase !== 'seeking'}
                onPress={() => toggleLock(index)}
                style={({ pressed }) => [
                  styles.dot,
                  on && styles.dotOn,
                  pressed && styles.buttonPressed,
                ]}
              />
            );
          })}
        </View>
      ) : null}

      {phase === 'check' && score ? (
        <View style={styles.compare}>
          {score.pairs.map((pair) => (
            <Text key={pair.target.id} style={styles.compareLine}>
              {fmt(t.sameTone.pairLine, {
                target: pair.target.name,
                chosen: pair.chosenLabel,
                status:
                  pair.quality === 'hit'
                    ? t.intervals.onPitch
                    : `${pair.interval} · ${Math.round(Math.abs(pair.cents))}¢`,
              })}
            </Text>
          ))}
        </View>
      ) : null}

      {phase === 'preview' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'seeking' || phase === 'check' ? null : (
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
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionHint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.hint,
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
  sliderCard: {
    gap: 8,
  },
  sliderHint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.hint,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: COLORS.text,
  },
  dotOn: {
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  compare: {
    gap: 6,
  },
  compareLine: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonPlaceholder: {
    minHeight: 48,
  },
});
