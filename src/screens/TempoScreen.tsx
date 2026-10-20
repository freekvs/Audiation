import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { playClick, stopClicks, warmupClicks } from '../audio/click';
import {
  TAP_LATENCY_BEATS,
  TAP_LATENCY_BPM,
  clickTimeline,
  latencyExpectedTimes,
  measureTapLatency,
  setTapLatency,
  useTapLatency,
} from '../audio/tapLatency';
import { useExercisePrefs } from '../exercisePrefs';
import { fmt, useT } from '../i18n';
import { CLICK_HZ, RHYTHM_VOICES } from '../rhythm';
import {
  TEMPO_BPM_MAX,
  TEMPO_BPM_MIN,
  TEMPO_UNITS,
  beatMs,
  clampTempoBpm,
  expectedTapTimes,
  nextHarderUnit,
  scoreTempoTaps,
  tempoBars,
  tempoDurationMs,
  type TempoScore,
  type TempoUnit,
} from '../tempo';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { PitchSlider } from '../ui/PitchSlider';
import { RoundActions } from '../ui/RoundActions';
import { StartButton } from '../ui/StartButton';

type Phase = 'idle' | 'counting' | 'tapping' | 'check' | 'latency';

type Props = {
  onBack: () => void;
};

const TAP_HZ = RHYTHM_VOICES[1]!;
const BPM_SPAN = TEMPO_BPM_MAX - TEMPO_BPM_MIN;

export function TempoScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const tapLatency = useTapLatency();
  const [bpm, setBpm] = useState(() => clampTempoBpm(prefs.tempo.bpm));
  const [unit, setUnit] = useState<TempoUnit>(prefs.tempo.unit);
  const [silent, setSilent] = useState(prefs.tempo.silent);
  const [phase, setPhase] = useState<Phase>('idle');
  const [beatIndex, setBeatIndex] = useState<number | null>(null);
  const [playBeat, setPlayBeat] = useState<number | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [score, setScore] = useState<TempoScore | null>(null);
  const [compareStep, setCompareStep] = useState<0 | 1 | 2 | 3>(0);
  const [latencyNote, setLatencyNote] = useState<'hit' | 'miss' | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const windowStart = useRef(0);
  const capturing = useRef(false);
  const tapsRef = useRef<number[]>([]);
  const roundRef = useRef({ bpm, unit, silent });

  const bars = tempoBars(bpm);
  const durationMs = tempoDurationMs(bpm);
  const settingsOpen = phase === 'idle' || phase === 'check';

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    void warmupClicks([CLICK_HZ, TAP_HZ]).catch(() => undefined);
    return () => {
      capturing.current = false;
      clearTimers();
      stopClicks();
    };
  }, []);

  useEffect(() => {
    update('tempo', { bpm, unit, silent });
  }, [bpm, unit, silent, update]);

  useEffect(() => {
    roundRef.current = { bpm, unit, silent };
  }, [bpm, unit, silent]);

  const stopAll = () => {
    capturing.current = false;
    clearTimers();
    stopClicks();
    setBeatIndex(null);
    setPlayBeat(null);
  };

  const scheduleClick = (at: number, hz: number, bus: 'a' | 'b') => {
    timers.current.push(
      setTimeout(() => {
        void playClick(hz, bus).catch(() => undefined);
      }, Math.max(0, at)),
    );
  };

  const startRound = () => {
    stopAll();
    tapsRef.current = [];
    setTaps([]);
    setScore(null);
    setCompareStep(0);
    setLatencyNote(null);
    setPhase('counting');
    setPlayBeat(0);

    const round = roundRef.current;
    const step = beatMs(round.bpm);
    const totalBeats = tempoBars(round.bpm) * 4;
    const lead = 4 * step;
    const timeline = clickTimeline();

    for (let beat = 0; beat < 4; beat += 1) {
      const logical = beat * step;
      timers.current.push(
        setTimeout(() => {
          setBeatIndex(beat);
          setPlayBeat(beat);
        }, timeline.visualAt(logical)),
      );
      scheduleClick(timeline.audioAt(logical), CLICK_HZ, 'b');
    }

    windowStart.current = Date.now() + timeline.visualAt(lead);

    timers.current.push(
      setTimeout(() => {
        capturing.current = true;
        setPhase('tapping');
      }, timeline.visualAt(lead)),
    );

    for (let beat = 0; beat < totalBeats; beat += 1) {
      const logical = lead + beat * step;
      timers.current.push(
        setTimeout(() => {
          setBeatIndex(beat % 4);
          setPlayBeat(4 + beat);
        }, timeline.visualAt(logical)),
      );
      if (!round.silent) {
        scheduleClick(timeline.audioAt(logical), CLICK_HZ, 'b');
      }
    }

    timers.current.push(
      setTimeout(() => {
        capturing.current = false;
        setBeatIndex(null);
        stopClicks();
        const recorded = tapsRef.current;
        setTaps(recorded);
        setScore(scoreTempoTaps(recorded, round.bpm, round.unit));
        setPhase('check');
      }, timeline.visualAt(lead + totalBeats * step) + 40),
    );
  };

  const startLatencyCheck = () => {
    stopAll();
    tapsRef.current = [];
    setTaps([]);
    setScore(null);
    setCompareStep(0);
    setLatencyNote(null);
    setPhase('latency');

    const step = 60000 / TAP_LATENCY_BPM;
    const timeline = clickTimeline(0);
    windowStart.current = Date.now() + timeline.visualAt(0);
    capturing.current = true;

    setPlayBeat(0);
    for (let beat = 0; beat < TAP_LATENCY_BEATS; beat += 1) {
      const logical = beat * step;
      timers.current.push(
        setTimeout(() => {
          setBeatIndex(beat % 4);
          setPlayBeat(beat);
        }, timeline.visualAt(logical)),
      );
      scheduleClick(timeline.audioAt(logical), CLICK_HZ, 'b');
    }

    timers.current.push(
      setTimeout(() => {
        capturing.current = false;
        setBeatIndex(null);
        const measured = measureTapLatency(tapsRef.current, latencyExpectedTimes());
        if (measured == null) {
          setLatencyNote('miss');
        } else {
          void setTapLatency(measured);
          setLatencyNote('hit');
        }
        setPhase('idle');
      }, timeline.visualAt(TAP_LATENCY_BEATS * step) + 80),
    );
  };

  const playCompare = (
    recorded: number[] = tapsRef.current,
    roundBpm = roundRef.current.bpm,
    roundUnit = roundRef.current.unit,
  ) => {
    stopAll();
    const timeline = clickTimeline();
    const expected = expectedTapTimes(roundBpm, roundUnit);
    const gap = timeline.visualAt(tempoDurationMs(roundBpm)) + 400;
    setCompareStep(1);
    for (const time of expected) {
      scheduleClick(timeline.audioAt(time), CLICK_HZ, 'a');
    }
    timers.current.push(
      setTimeout(() => {
        setCompareStep(2);
        for (const time of recorded) {
          scheduleClick(timeline.audioAt(time), TAP_HZ, 'b');
        }
      }, gap),
    );
    timers.current.push(
      setTimeout(() => {
        setCompareStep(3);
        for (const time of expected) {
          scheduleClick(timeline.audioAt(time), CLICK_HZ, 'a');
        }
        for (const time of recorded) {
          scheduleClick(timeline.audioAt(time), TAP_HZ, 'b');
        }
      }, gap * 2),
    );
    timers.current.push(
      setTimeout(() => {
        setCompareStep(0);
        stopClicks();
      }, gap * 2 + timeline.visualAt(tempoDurationMs(roundBpm)) + 80),
    );
  };

  const onPad = () => {
    if (phase !== 'latency') {
      void playClick(TAP_HZ, 'a').catch(() => undefined);
    }
    if (!capturing.current) {
      return;
    }
    const timeMs = Date.now() - windowStart.current;
    if (timeMs < -beatMs(roundRef.current.bpm)) {
      return;
    }
    tapsRef.current = [...tapsRef.current, Math.max(0, timeMs)];
    setTaps(tapsRef.current);
  };

  const nextRound = () => {
    const nextUnit = score?.quality === 'hit' ? nextHarderUnit(unit) : unit;
    setUnit(nextUnit);
    roundRef.current = { ...roundRef.current, unit: nextUnit };
    startRound();
  };

  const title =
    phase === 'counting'
      ? t.tempo.counting
      : phase === 'tapping'
        ? t.tempo.titleTap
        : phase === 'latency'
          ? t.tempo.latencyTitle
          : t.practice.tempo.title;

  const seconds = Math.round(durationMs / 1000);
  const resultBody =
    score?.quality === 'hit'
      ? fmt(t.tempo.hit, { bpm: score.measuredBpm ?? bpm })
      : score
        ? fmt(t.tempo.miss, {
            hit: score.hit,
            total: score.total,
            extra: score.extra
              ? fmt(score.extra === 1 ? t.tempo.extraOne : t.tempo.extraMany, {
                  n: score.extra,
                })
              : '',
            bpm: score.measuredBpm ?? '—',
          })
        : t.tempo.compareIntro;
  const body =
    phase === 'idle'
      ? latencyNote === 'hit'
        ? fmt(t.tempo.latencyHit, { ms: tapLatency })
        : latencyNote === 'miss'
          ? t.tempo.latencyMiss
          : fmt(t.tempo.idle, {
              bpm,
              unit: t.tempo.units[unit],
              bars,
              seconds,
            })
      : phase === 'counting'
        ? t.tempo.countingHint
        : phase === 'latency'
          ? t.tempo.latencyTapping
          : phase === 'tapping'
            ? silent
              ? t.tempo.tappingSilent
              : t.tempo.tapping
            : null;

  const live = phase === 'counting' || phase === 'tapping' || phase === 'latency';
  const tappingBar = Math.min(
    bars,
    Math.max(1, Math.floor(((playBeat ?? 4) - 4) / 4) + 1),
  );
  const liveStatus =
    phase === 'counting'
      ? fmt(t.tempo.countStatus, { n: (beatIndex ?? 0) + 1 })
      : phase === 'tapping'
        ? tappingBar >= bars
          ? t.tempo.runLast
          : t.tempo.runStatus
        : phase === 'latency'
          ? (playBeat ?? 0) >= TAP_LATENCY_BEATS - 2
            ? t.tempo.latencyLast
            : fmt(t.tempo.latencyStatus, {
                n: (playBeat ?? 0) + 1,
                total: TAP_LATENCY_BEATS,
              })
          : null;

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.tagline}>{t.practice.tempo.tagline}</Text>
      {body ? <Text style={styles.subtitle}>{body}</Text> : null}
      {liveStatus ? <Text style={styles.liveStatus}>{liveStatus}</Text> : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <ChoiceHelp
            label={fmt(t.tempo.bpmTitle, { bpm })}
            body={t.help.tempo}
            a11y={fmt(t.help.moreA11y, { term: t.help.tempoTitle })}
          />
          <PitchSlider
            value={bpm - TEMPO_BPM_MIN}
            spanCents={BPM_SPAN}
            onChange={(cents) => setBpm(clampTempoBpm(TEMPO_BPM_MIN + cents))}
            disabled={!settingsOpen}
            lowLabel={`${TEMPO_BPM_MIN}`}
            highLabel={`${TEMPO_BPM_MAX}`}
            accessibilityLabel={fmt(t.tempo.bpmA11y, { bpm })}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.tempo.unitTitle}</Text>
          <Text style={styles.optionHint}>{t.tempo.unitHint}</Text>
          <View style={styles.octaveRow}>
            {TEMPO_UNITS.map((item) => (
              <Chip
                key={item}
                label={t.tempo.units[item]}
                selected={unit === item}
                onPress={() => setUnit(item)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.tempo.silentTitle}</Text>
            <Text style={styles.optionHint}>{t.tempo.silentHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.tempo.silentA11y}
            value={silent}
            onValueChange={setSilent}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={silent ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {settingsOpen ? (
        <View style={styles.octaveBlock}>
          <ChoiceHelp
            label={t.tempo.latencyTitle}
            body={t.help.tempoLatency}
            a11y={fmt(t.help.moreA11y, { term: t.tempo.latencyTitle })}
          />
          <Text style={styles.optionHint}>
            {tapLatency > 0
              ? fmt(t.tempo.latencyValue, { ms: tapLatency })
              : t.tempo.latencyNone}
          </Text>
          <View style={styles.octaveRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.tempo.latencyStartA11y}
              onPress={startLatencyCheck}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                styles.latencyButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                {t.tempo.latencyStart}
              </Text>
            </Pressable>
            {tapLatency > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.tempo.latencyResetA11y}
                onPress={() => {
                  void setTapLatency(0);
                  setLatencyNote(null);
                }}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSecondary,
                  styles.latencyButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                  {t.tempo.latencyReset}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {live ? (
        <View style={styles.grid}>
          {Array.from({ length: 4 }, (_, beat) => {
            const now = beatIndex === beat;
            const counting = phase === 'counting' && now;
            return (
              <View
                key={beat}
                style={[
                  styles.cell,
                  now && styles.cellNow,
                  counting && styles.cellCount,
                ]}
              >
                <Text
                  style={[
                    styles.cellNum,
                    now && styles.cellNumNow,
                  ]}
                >
                  {beat + 1}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {phase !== 'check' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.tempo.padA11y}
          onPress={onPad}
          style={({ pressed }) => [styles.pad, pressed && styles.buttonPressed]}
        >
          <Text style={styles.padText}>
            {phase === 'tapping' || phase === 'latency'
              ? fmt(t.tempo.padLive, { n: taps.length })
              : t.tempo.pad}
          </Text>
        </Pressable>
      ) : null}

      {phase === 'check' && score ? (
        <View style={styles.compare}>
          <Text style={styles.compareTitle}>{t.common.control}</Text>
          <Text style={styles.compareLine}>{resultBody}</Text>
          <Text style={styles.comparePlay}>
            {score.measuredBpm
              ? fmt(t.tempo.measured, { bpm: score.measuredBpm, target: bpm })
              : t.tempo.measuredNone}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.tempo.hearCompareA11y}
            onPress={() => playCompare()}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.tempo.hearCompare}</Text>
          </Pressable>
          <Text style={compareStep === 0 ? styles.compareHint : styles.comparePlay}>
            {compareStep === 1
              ? t.tempo.compareModel
              : compareStep === 2
                ? t.tempo.compareYours
                : compareStep === 3
                  ? t.tempo.compareTogether
                  : t.tempo.compareHint}
          </Text>
        </View>
      ) : null}

      {phase === 'check' ? (
        <RoundActions
          againA11y={t.tempo.againA11y}
          nextA11y={t.tempo.nextA11y}
          nextLabel={t.common.next}
          onAgain={startRound}
          onNext={nextRound}
          preferAgain={score != null && score.quality !== 'hit'}
        />
      ) : null}

      {phase === 'counting' || phase === 'tapping' || phase === 'latency' ? (
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  cellNow: {
    backgroundColor: COLORS.hit,
    borderColor: COLORS.hit,
  },
  cellCount: {
    backgroundColor: COLORS.close,
    borderColor: COLORS.close,
  },
  cellNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hint,
  },
  cellNumNow: {
    color: COLORS.ink,
  },
  liveStatus: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  pad: {
    minHeight: 120,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
  compareTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
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
  compareHint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.hint,
  },
  latencyButton: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPlaceholder: {
    minHeight: 48,
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
