import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playClick, stopClicks, warmupClicks } from '../audio/click';
import { fmt, useT } from '../i18n';
import { useExercisePrefs } from '../exercisePrefs';
import {
  CLICK_HZ,
  DEFAULT_BPM,
  RHYTHM_VOICES,
  countInHits,
  expandHits,
  nextPattern,
  patternsFor,
  quantizeTaps,
  rhythmPatternLabel,
  scoreRhythm,
  sixteenthMs,
  slotsPerBar,
  voiceHz,
  type Meter,
  type RhythmHit,
  type RhythmPattern,
  type RhythmScore,
  type RhythmTap,
  type VoiceCount,
} from '../rhythm';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { RoundActions } from '../ui/RoundActions';
import { StartButton } from '../ui/StartButton';

type Mode = 'preset' | 'compose';
type Phase = 'idle' | 'listening' | 'repeating' | 'composing' | 'check';

type Props = {
  onBack: () => void;
};

export function RhythmScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [mode, setMode] = useState<Mode>(prefs.rhythm.mode);
  const [meter, setMeter] = useState<Meter>(prefs.rhythm.meter);
  const [bars, setBars] = useState(prefs.rhythm.bars);
  const [sounds, setSounds] = useState<VoiceCount>(prefs.rhythm.sounds);
  const [pattern, setPattern] = useState<RhythmPattern>(() => {
    const list = patternsFor(prefs.rhythm.meter);
    return list.find((item) => item.id === prefs.rhythm.patternId) ?? list[0]!;
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [playSlot, setPlaySlot] = useState<number | null>(null);
  const [taps, setTaps] = useState<RhythmTap[]>([]);
  const [score, setScore] = useState<RhythmScore | null>(null);
  const [compareStep, setCompareStep] = useState<0 | 1 | 2 | 3>(0);
  const [customHits, setCustomHits] = useState<RhythmHit[] | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const windowStart = useRef(0);
  const capturing = useRef(false);
  const tapsRef = useRef<RhythmTap[]>([]);
  const modelRef = useRef<RhythmHit[]>([]);

  const modelHits = modelRef.current.length
    ? modelRef.current
    : expandHits(mode === 'compose' && customHits ? customHits : pattern.hits, meter, bars);
  const totalSlots = slotsPerBar(meter) * bars;
  const settingsOpen = phase === 'idle' || phase === 'check';
  const step = sixteenthMs(DEFAULT_BPM);

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    void warmupClicks([CLICK_HZ, ...RHYTHM_VOICES]);
    return () => {
      capturing.current = false;
      clearTimers();
      stopClicks();
    };
  }, []);

  useEffect(() => {
    update('rhythm', {
      mode,
      meter,
      bars,
      sounds,
      patternId: pattern.id,
    });
  }, [mode, meter, bars, sounds, pattern, update]);

  const chooseMeter = (next: Meter) => {
    setMeter(next);
    const list = patternsFor(next);
    setPattern(list.find((item) => item.id === pattern.id) ?? list[0]!);
  };

  const stopAll = () => {
    capturing.current = false;
    clearTimers();
    stopClicks();
    setPlaySlot(null);
  };

  const scheduleHits = (
    hits: RhythmHit[],
    delayMs: number,
    bus: 'a' | 'b',
    markPlayhead: boolean,
  ) => {
    for (const event of hits) {
      const at = delayMs + event.slot * step;
      timers.current.push(
        setTimeout(() => {
          if (markPlayhead) {
            setPlaySlot(event.slot);
          }
          void playClick(voiceHz(event.voice, sounds), bus).catch(() => undefined);
        }, at),
      );
    }
  };

  const playStream = (hits: RhythmHit[], thenRepeat: boolean) => {
    stopAll();
    modelRef.current = expandHits(hits, meter, bars);
    setPhase('listening');
    setCompareStep(0);
    const countIn = countInHits(meter);
    scheduleHits(countIn, 0, 'b', false);
    const lead = meter * 4 * step;
    scheduleHits(modelRef.current, lead, 'a', true);
    const doneAt = lead + totalSlots * step + 80;
    timers.current.push(
      setTimeout(() => {
        setPlaySlot(null);
        if (thenRepeat) {
          beginRepeat();
        } else {
          setPhase('idle');
        }
      }, doneAt),
    );
  };

  const beginRepeat = () => {
    stopAll();
    tapsRef.current = [];
    setTaps([]);
    setScore(null);
    setPhase('repeating');
    const countIn = countInHits(meter);
    scheduleHits(countIn, 0, 'b', false);
    const lead = meter * 4 * step;
    windowStart.current = Date.now() + lead;
    capturing.current = true;
    for (let slot = 0; slot < totalSlots; slot += 1) {
      timers.current.push(
        setTimeout(() => {
          setPlaySlot(slot);
        }, lead + slot * step),
      );
    }
    timers.current.push(
      setTimeout(() => {
        capturing.current = false;
        setPlaySlot(null);
        const recorded = tapsRef.current;
        setScore(scoreRhythm(modelRef.current, recorded, DEFAULT_BPM, sounds));
        setPhase('check');
        playCompare(recorded);
      }, lead + totalSlots * step + 60),
    );
  };

  const beginCompose = () => {
    stopAll();
    setCustomHits(null);
    tapsRef.current = [];
    setTaps([]);
    setScore(null);
    setPhase('composing');
    const countIn = countInHits(meter);
    scheduleHits(countIn, 0, 'b', false);
    const lead = meter * 4 * step;
    windowStart.current = Date.now() + lead;
    capturing.current = true;
    for (let slot = 0; slot < totalSlots; slot += 1) {
      timers.current.push(
        setTimeout(() => {
          setPlaySlot(slot);
        }, lead + slot * step),
      );
    }
    timers.current.push(
      setTimeout(() => {
        capturing.current = false;
        setPlaySlot(null);
        const hits = quantizeTaps(tapsRef.current, meter, bars, DEFAULT_BPM);
        const saved = hits.length > 0 ? hits : [{ slot: 0, voice: 0 }];
        setCustomHits(saved);
        tapsRef.current = [];
        setTaps([]);
        playStream(saved, true);
      }, lead + totalSlots * step + 60),
    );
  };

  const startRound = () => {
    if (mode === 'compose') {
      beginCompose();
      return;
    }
    playStream(pattern.hits, true);
  };

  const nextRound = () => {
    if (mode === 'preset') {
      const next = nextPattern(meter, pattern.id);
      setPattern(next);
      setCustomHits(null);
      setTaps([]);
      tapsRef.current = [];
      setScore(null);
      playStream(next.hits, true);
      return;
    }
    setCustomHits(null);
    setTaps([]);
    tapsRef.current = [];
    setScore(null);
    beginCompose();
  };

  const repeatRound = () => {
    setTaps([]);
    tapsRef.current = [];
    setScore(null);
    const hits = mode === 'compose' && customHits ? customHits : pattern.hits;
    playStream(hits, true);
  };

  const onPad = (voice: number) => {
    void playClick(voiceHz(voice, sounds), 'a').catch(() => undefined);
    if (!capturing.current) {
      return;
    }
    const timeMs = Date.now() - windowStart.current;
    if (timeMs < -step) {
      return;
    }
    const tap = { timeMs: Math.max(0, timeMs), voice };
    tapsRef.current = [...tapsRef.current, tap];
    setTaps(tapsRef.current);
  };

  const playCompare = (recorded: RhythmTap[] = tapsRef.current) => {
    stopAll();
    const expected = modelRef.current;
    const userHits = quantizeTaps(recorded, meter, bars, DEFAULT_BPM);
    setCompareStep(1);
    scheduleHits(expected, 0, 'a', true);
    const gap = totalSlots * step + 400;
    timers.current.push(
      setTimeout(() => {
        setCompareStep(2);
        scheduleHits(userHits, 0, 'b', true);
      }, gap),
    );
    timers.current.push(
      setTimeout(() => {
        setCompareStep(3);
        scheduleHits(expected, 0, 'a', true);
        scheduleHits(userHits, 0, 'b', false);
      }, gap * 2),
    );
    timers.current.push(
      setTimeout(() => {
        setCompareStep(0);
        setPlaySlot(null);
        stopClicks();
      }, gap * 2 + totalSlots * step + 80),
    );
  };

  const title =
    phase === 'listening'
      ? t.common.listen
      : phase === 'repeating'
        ? t.rhythm.titleRepeat
        : phase === 'composing'
          ? t.rhythm.titleCompose
          : phase === 'check'
            ? t.common.control
            : t.practice.rhythm.title;

  const body =
    phase === 'idle'
      ? mode === 'preset'
        ? fmt(t.rhythm.idlePreset, {
            meter,
            bars,
            plural: bars > 1 ? t.rhythm.barsPlural : '',
          })
        : t.rhythm.idleCompose
      : phase === 'listening'
        ? t.rhythm.listening
        : phase === 'repeating'
          ? t.rhythm.repeating
          : phase === 'composing'
            ? t.rhythm.composing
            : score?.quality === 'hit'
              ? t.rhythm.hit
              : score
                ? fmt(t.rhythm.miss, {
                    hit: score.hit,
                    total: score.total,
                    extra: score.extra
                      ? fmt(t.rhythm.missExtra, { n: score.extra })
                      : '',
                  })
                : t.rhythm.compareIntro;

  const visibleHits = phase === 'check' ? modelHits : expandHits(pattern.hits, meter, 1);
  const gridSlots = phase === 'composing' || (mode === 'compose' && customHits) ? totalSlots : slotsPerBar(meter);

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.rhythm.tagline}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'check' ? (
        <RoundActions
          againA11y={t.rhythm.againA11y}
          nextA11y={t.rhythm.nextA11y}
          nextLabel={t.common.next}
          onAgain={repeatRound}
          onNext={nextRound}
          preferAgain={score != null && score.quality !== 'hit'}
        />
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.rhythm.source}</Text>
          <View style={styles.octaveRow}>
            <Chip label={t.rhythm.preset} selected={mode === 'preset'} onPress={() => setMode('preset')} />
            <Chip label={t.rhythm.compose} selected={mode === 'compose'} onPress={() => setMode('compose')} />
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.rhythm.meter}</Text>
          <View style={styles.octaveRow}>
            <Chip label="4/4" selected={meter === 4} onPress={() => chooseMeter(4)} />
            <Chip label="3/4" selected={meter === 3} onPress={() => chooseMeter(3)} />
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.rhythm.bars}</Text>
          <View style={styles.octaveRow}>
            {([1, 2, 4] as const).map((count) => (
              <Chip
                key={count}
                label={`${count}`}
                selected={bars === count}
                onPress={() => setBars(count)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.rhythm.sounds}</Text>
          <Text style={styles.optionHint}>{t.rhythm.soundsHint}</Text>
          <View style={styles.octaveRow}>
            {([1, 2, 3] as const).map((count) => (
              <Chip
                key={count}
                label={`${count}`}
                selected={sounds === count}
                onPress={() => setSounds(count)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {settingsOpen && mode === 'preset' ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.rhythm.pattern}</Text>
          <View style={styles.octaveRow}>
            {patternsFor(meter).map((item) => (
              <Chip
                key={item.id}
                label={rhythmPatternLabel(item.id, t)}
                selected={pattern.id === item.id}
                onPress={() => setPattern(item)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.grid}>
        {Array.from({ length: gridSlots }, (_, slot) => {
          const on = (phase === 'check' ? modelHits : visibleHits).some(
            (hit) => hit.slot % gridSlots === slot || hit.slot === slot,
          );
          const active = playSlot === slot || (playSlot != null && playSlot % gridSlots === slot);
          return (
            <View
              key={slot}
              style={[
                styles.cell,
                slot % 4 === 0 && styles.cellBeat,
                on && styles.cellHit,
                active && styles.cellNow,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.pads}>
        {Array.from({ length: sounds }, (_, voice) => (
          <Pressable
            key={voice}
            accessibilityRole="button"
            accessibilityLabel={fmt(t.rhythm.padA11y, { n: voice + 1 })}
            onPress={() => onPad(voice)}
            style={({ pressed }) => [
              styles.pad,
              sounds === 1 && styles.padWide,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.padText}>
              {sounds === 1 ? t.rhythm.pad : [t.rhythm.low, t.rhythm.mid, t.rhythm.high][voice]}
            </Text>
          </Pressable>
        ))}
      </View>

      {phase === 'check' && score ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>
            {fmt(t.rhythm.score, {
              hit: score.hit,
              total: score.total,
              extra: score.extra
                ? fmt(score.extra === 1 ? t.rhythm.extraOne : t.rhythm.extraMany, {
                    n: score.extra,
                  })
                : '',
            })}
          </Text>
          <Text style={styles.comparePlay}>
            {compareStep === 1
              ? t.rhythm.compareModel
              : compareStep === 2
                ? t.rhythm.compareYours
                : compareStep === 3
                  ? t.rhythm.compareTogether
                  : t.rhythm.compareHint}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.rhythm.hearCompareA11y}
            onPress={() => playCompare()}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.rhythm.hearCompare}</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'listening' || phase === 'repeating' || phase === 'composing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'check' ? null : (
        <StartButton
          accessibilityLabel={t.common.startA11y}
          label={mode === 'compose' ? t.rhythm.composeStart : t.common.start}
          onPress={startRound}
          pressedStyle={styles.buttonPressed}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      )}
    </AppScreen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.octaveChip,
        selected && styles.octaveChipSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.octaveChipText, selected && styles.octaveChipTextSelected]}>{label}</Text>
    </Pressable>
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
  octaveChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  octaveChipTextSelected: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  cellBeat: {
    borderColor: COLORS.muted,
  },
  cellHit: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  cellNow: {
    backgroundColor: COLORS.hit,
    borderColor: COLORS.hit,
  },
  pads: {
    flexDirection: 'row',
    gap: 10,
  },
  pad: {
    flex: 1,
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padWide: {
    minHeight: 120,
  },
  padText: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '700',
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
  comparePlay: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
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
