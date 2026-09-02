import {
  RecordingPresets,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { canListenForPitch, listenForPitch } from '../audio/listenPitch';
import {
  exactCents,
  hzToNoteLabel,
  matchSungPitch,
  type ListenControls,
  type PitchVerdict,
} from '../audio/pitch';
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
  describeInterval,
  maxIntervalSpan,
  pickInterval,
  secondOctaves,
  type IntervalPair,
  type OctaveWay,
} from '../intervals';
import { fmt, useT, type Strings } from '../i18n';
import { namedTone, relativeLabel, useNaming, type NamingSystem } from '../naming';
import { PIANO_OCTAVES } from '../notes';
import { PianoKeyboard } from '../PianoKeyboard';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { DroneSwitch } from '../ui/DroneSwitch';

type Phase = 'idle' | 'playing' | 'holding' | 'singing' | 'check';

type Props = {
  onBack: () => void;
};

const PLAY_MS = 850;
const GAP_MS = 320;
const CHECK_ENABLE_MS = 1200;
const SING_MS = 2000;

type AnswerKind = 'sing' | 'piano' | null;

function matchChosenHz(chosenHz: number, targetHz: number): PitchVerdict {
  const cents = exactCents(chosenHz, targetHz);
  const semitones = Math.round(cents / 100);
  if (semitones === 0) {
    return { quality: 'hit', cents, sungHz: chosenHz };
  }
  if (Math.abs(semitones) === 1) {
    return { quality: 'close', cents, sungHz: chosenHz };
  }
  return { quality: 'miss', cents, sungHz: chosenHz };
}

function verdictText(
  pair: IntervalPair,
  verdict: PitchVerdict | null,
  naming: NamingSystem,
  answer: AnswerKind,
  t: Strings,
): string {
  const interval = describeInterval(pair, naming, t.intervals);
  const second = namedTone(pair.to, naming);
  if (answer === 'piano') {
    if (verdict?.quality === 'hit') {
      return fmt(t.interval.pianoHit, { interval });
    }
    if (verdict?.quality === 'close') {
      return fmt(t.interval.pianoClose, { second, interval });
    }
    return fmt(t.interval.pianoMiss, { second, interval });
  }
  if (!verdict || verdict.quality === 'unavailable') {
    return fmt(t.interval.unavailable, { interval });
  }
  if (verdict.quality === 'silent') {
    return fmt(t.interval.silent, { second, interval });
  }
  if (verdict.quality === 'hit') {
    return fmt(t.interval.hit, { interval });
  }
  if (verdict.quality === 'close') {
    return fmt(t.interval.close, { interval });
  }
  return fmt(t.interval.miss, { interval });
}

export function IntervalScreen({ onBack }: Props) {
  const { compact, height } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [playStep, setPlayStep] = useState<0 | 1 | 2>(0);
  const [octave, setOctave] = useState<ExerciseOctave>(() => exerciseOctave(prefs.interval.octave));
  const [span, setSpan] = useState(prefs.interval.span);
  const [way, setWay] = useState<OctaveWay>(prefs.interval.way);
  const [showAnchor, setShowAnchor] = useState(prefs.interval.showAnchor);
  const [answerOctave, setAnswerOctave] = useState(prefs.interval.octave);
  const [pair, setPair] = useState<IntervalPair>(() =>
    pickInterval({
      homeOctave: prefs.interval.octave,
      span: prefs.interval.span,
      way: prefs.interval.way,
    }),
  );
  const [canCheck, setCanCheck] = useState(false);
  const [singEnabled, setSingEnabled] = useState(prefs.interval.singEnabled);
  const [pianoEnabled, setPianoEnabled] = useState(prefs.interval.pianoEnabled);
  const [answer, setAnswer] = useState<AnswerKind>(null);
  const [verdict, setVerdict] = useState<PitchVerdict | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const { droneEnabled, setDroneEnabled } = useDrone(octave.octave, phase === 'singing');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const listenControls = useRef<ListenControls>({ cancelled: false });
  const replayRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  const clearTimers = () => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      listenControls.current.cancelled = true;
      clearTimers();
      try {
        replayRef.current?.remove();
      } catch {
        // already released
      }
    };
  }, []);

  useEffect(() => {
    update('interval', {
      octave: octave.octave,
      span,
      way,
      showAnchor,
      singEnabled,
      pianoEnabled,
    });
  }, [octave, span, way, showAnchor, singEnabled, pianoEnabled, update]);

  const playNote = (hz: number) => {
    void playHz(hz).catch(() => undefined);
  };

  const schedulePair = (next: IntervalPair, thenHold: boolean) => {
    setPlayStep(1);
    playNote(next.from.hz);

    timers.current.push(
      setTimeout(() => {
        stopTone();
        setPlayStep(0);
      }, PLAY_MS),
    );

    timers.current.push(
      setTimeout(() => {
        setPlayStep(2);
        playNote(next.to.hz);
      }, PLAY_MS + GAP_MS),
    );

    const doneAt = PLAY_MS + GAP_MS + PLAY_MS;
    timers.current.push(
      setTimeout(() => {
        stopTone();
        setPlayStep(0);
        if (thenHold) {
          setPhase('holding');
        }
      }, doneAt),
    );

    if (thenHold) {
      timers.current.push(
        setTimeout(() => {
          setCanCheck(true);
        }, doneAt + CHECK_ENABLE_MS),
      );
    }
  };

  const playRecording = () => {
    if (!recordingUri) {
      return;
    }
    stopTone();
    try {
      replayRef.current?.remove();
    } catch {
      // already released
    }
    const replay = createAudioPlayer({ uri: recordingUri });
    replayRef.current = replay;
    replay.volume = 1;
    replay.play();
  };

  const startRound = () => {
    beginSoundingRound();
    listenControls.current.cancelled = true;
    clearTimers();
    const next = pickInterval({
      homeOctave: octave.octave,
      span,
      way,
      except: pair,
    });
    setPair(next);
    setAnswerOctave(secondOctaves(octave.octave, span, way)[0] ?? octave.octave);
    beginInterval(next);
  };

  const repeatRound = () => {
    listenControls.current.cancelled = true;
    clearTimers();
    beginInterval(pair);
  };

  const beginInterval = (next: IntervalPair) => {
    setCanCheck(false);
    setVerdict(null);
    setAnswer(null);
    setRecordingUri(null);
    setMicLevel(0);
    setPhase('playing');
    schedulePair(next, true);
  };

  const replayPair = () => {
    clearTimers();
    schedulePair(pair, false);
  };

  const finishCheck = (
    nextVerdict: PitchVerdict | null,
    playTarget: boolean,
    nextAnswer: AnswerKind,
  ) => {
    setAnswer(nextAnswer);
    setVerdict(nextVerdict);
    setPhase('check');
    if (playTarget) {
      schedulePair(pair, false);
    }
  };

  const check = () => {
    if (!canCheck) {
      return;
    }
    clearTimers();
    finishCheck(null, true, null);
  };

  const pickSecondOnPiano = (note: { hz: number }) => {
    if (phase !== 'holding' || !canCheck) {
      return;
    }
    clearTimers();
    finishCheck(matchChosenHz(note.hz, pair.to.hz), false, 'piano');
  };

  const enableSinging = async (value: boolean) => {
    if (!value) {
      setSingEnabled(false);
      return;
    }

    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setSingEnabled(false);
      return;
    }
    setSingEnabled(true);
  };

  const sing = async () => {
    if (!canCheck) {
      return;
    }
    clearTimers();
    setMicLevel(0);
    setPhase('singing');
    listenControls.current = { cancelled: false };

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: true,
      interruptionMode: 'doNotMix',
    });

    let nextVerdict: PitchVerdict;
    let capturedUri: string | null = null;
    try {
      if (!canListenForPitch()) {
        nextVerdict = { quality: 'unavailable', cents: null, sungHz: null };
      } else {
        const result = await listenForPitch(
          SING_MS,
          listenControls.current,
          setMicLevel,
          recorder,
          pair.to.hz,
        );
        capturedUri = result.recordingUri;
        setRecordingUri(result.recordingUri);
        nextVerdict = matchSungPitch(result.hz, pair.to.hz);
      }
    } catch {
      nextVerdict = { quality: 'unavailable', cents: null, sungHz: null };
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
    });

    if (listenControls.current.cancelled) {
      return;
    }
    finishCheck(nextVerdict, capturedUri == null, 'sing');
  };

  const applyHomeOctave = (next: ExerciseOctave) => {
    if (next.octave === octave.octave) {
      return;
    }
    const nextSpan = Math.min(span, maxIntervalSpan(next.octave, way));
    setOctave(next);
    setSpan(nextSpan);
    setPair(pickInterval({ homeOctave: next.octave, span: nextSpan, way }));
    setAnswerOctave(secondOctaves(next.octave, nextSpan, way)[0] ?? next.octave);
    setVerdict(null);
    setAnswer(null);
    setRecordingUri(null);
  };

  const applySpan = (nextSpan: number) => {
    const clamped = Math.min(nextSpan, maxIntervalSpan(octave.octave, way));
    setSpan(clamped);
    setPair(pickInterval({ homeOctave: octave.octave, span: clamped, way }));
    setAnswerOctave(secondOctaves(octave.octave, clamped, way)[0] ?? octave.octave);
    setVerdict(null);
    setAnswer(null);
    setRecordingUri(null);
  };

  const applyWay = (nextWay: OctaveWay) => {
    const nextSpan = Math.min(span, maxIntervalSpan(octave.octave, nextWay));
    setWay(nextWay);
    setSpan(nextSpan);
    setPair(pickInterval({ homeOctave: octave.octave, span: nextSpan, way: nextWay }));
    setAnswerOctave(secondOctaves(octave.octave, nextSpan, nextWay)[0] ?? octave.octave);
    setVerdict(null);
    setAnswer(null);
    setRecordingUri(null);
  };

  const title =
    phase === 'playing'
      ? playStep === 2
        ? t.interval.titleSecond
        : t.interval.titleFirst
      : phase === 'holding'
        ? t.interval.titleHold
        : phase === 'singing'
          ? t.interval.titleSing
          : phase === 'check'
            ? t.common.control
            : t.practice.interval.title;

  const body =
    phase === 'idle'
      ? fmt(t.interval.idle, { octave: octave.label })
      : phase === 'playing'
        ? playStep === 2
          ? span >= 2
            ? fmt(t.interval.playingOtherOctave, {
                way: way === 'up' ? t.interval.wayUp : t.interval.wayDown,
              })
            : t.interval.playingSame
          : showAnchor
            ? t.interval.playingAnchorNamed
            : t.interval.playingAnchor
        : phase === 'holding'
          ? droneEnabled
            ? t.interval.holdingDrone
            : pianoEnabled
              ? t.interval.holdingPiano
              : t.interval.holdingSilent
          : phase === 'singing'
            ? t.interval.singing
            : verdict
              ? verdictText(pair, verdict, naming, answer, t)
              : fmt(t.interval.checkAsk, {
                  interval: describeInterval(pair, naming, t.intervals),
                });

  const answerOctaves = secondOctaves(octave.octave, span, way);
  const pianoOctave = PIANO_OCTAVES.find((item) => item.octave === answerOctave);
  const maxSpan = maxIntervalSpan(octave.octave, way);
  const canGoUp = maxIntervalSpan(octave.octave, 'up') >= 2;
  const canGoDown = maxIntervalSpan(octave.octave, 'down') >= 2;
  const keyboardHeight = Math.max(150, Math.min(200, height * 0.26));
  const showAnswerPiano =
    pianoEnabled &&
    pianoOctave != null &&
    (phase === 'holding' || phase === 'check');

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.interval.firstTone}</Text>
          <View style={styles.octaveRow}>
            {EXERCISE_OCTAVES.map((item) => {
              const selected = item.octave === octave.octave;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.interval.firstToneA11y, { label: item.label })}
                  accessibilityState={{ selected }}
                  onPress={() => applyHomeOctave(item)}
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

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.interval.octaves}</Text>
          <Text style={styles.optionHint}>{t.interval.octavesHint}</Text>
          <View style={styles.octaveRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => {
              const allowed = item <= maxSpan;
              const selected = item === span;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={fmt(t.interval.octavesA11y, { n: item })}
                  accessibilityState={{ selected, disabled: !allowed }}
                  disabled={!allowed}
                  onPress={() => applySpan(item)}
                  style={({ pressed }) => [
                    styles.octaveChip,
                    selected && styles.octaveChipSelected,
                    !allowed && styles.buttonDisabled,
                    pressed && allowed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.octaveChipText,
                      selected && styles.octaveChipTextSelected,
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

      {span >= 2 && (phase === 'idle' || phase === 'check') ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.interval.secondTone}</Text>
          <Text style={styles.optionHint}>{t.interval.secondHint}</Text>
          <View style={styles.octaveRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.interval.octaveUpA11y}
              accessibilityState={{ selected: way === 'up', disabled: !canGoUp }}
              disabled={!canGoUp}
              onPress={() => applyWay('up')}
              style={({ pressed }) => [
                styles.octaveChip,
                way === 'up' && styles.octaveChipSelected,
                !canGoUp && styles.buttonDisabled,
                pressed && canGoUp && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.octaveChipText,
                  way === 'up' && styles.octaveChipTextSelected,
                ]}
              >
                {t.interval.octaveUp}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.interval.octaveDownA11y}
              accessibilityState={{ selected: way === 'down', disabled: !canGoDown }}
              disabled={!canGoDown}
              onPress={() => applyWay('down')}
              style={({ pressed }) => [
                styles.octaveChip,
                way === 'down' && styles.octaveChipSelected,
                !canGoDown && styles.buttonDisabled,
                pressed && canGoDown && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.octaveChipText,
                  way === 'down' && styles.octaveChipTextSelected,
                ]}
              >
                {t.interval.octaveDown}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'idle' || phase === 'check' ? (
        <DroneSwitch value={droneEnabled} onValueChange={setDroneEnabled} />
      ) : null}

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.interval.showAnchor}</Text>
            <Text style={styles.optionHint}>{t.interval.showAnchorHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.interval.showAnchorA11y}
            value={showAnchor}
            onValueChange={setShowAnchor}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={showAnchor ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.interval.singTitle}</Text>
            <Text style={styles.optionHint}>{t.interval.singHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.interval.singA11y}
            value={singEnabled}
            onValueChange={(value) => {
              void enableSinging(value);
            }}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={singEnabled ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.interval.pianoTitle}</Text>
            <Text style={styles.optionHint}>{t.interval.pianoHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.interval.pianoA11y}
            value={pianoEnabled}
            onValueChange={setPianoEnabled}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={pianoEnabled ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      <View style={styles.stage}>
        <View style={styles.pair}>
          <View
            style={[
              styles.orb,
              playStep === 1 && styles.orbPlaying,
              phase === 'holding' && styles.orbHolding,
              phase === 'singing' && styles.orbAnchor,
              phase === 'check' && styles.orbCheck,
            ]}
          />
          <View
            style={[
              styles.orb,
              playStep === 2 && styles.orbPlaying,
              phase === 'holding' && styles.orbHolding,
              phase === 'singing' && styles.orbSinging,
              phase === 'check' &&
                (verdict?.quality === 'hit'
                  ? styles.orbHit
                  : verdict?.quality === 'close'
                    ? styles.orbClose
                    : styles.orbCheck),
            ]}
          />
        </View>
        {phase === 'singing' ? (
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.min(100, micLevel * 400)}%` }]} />
          </View>
        ) : null}
        {phase === 'check' ? (
          <Text style={styles.reveal}>{describeInterval(pair, naming, t.intervals)}</Text>
        ) : showAnchor && (phase === 'playing' || phase === 'holding' || phase === 'singing') ? (
          <Text style={styles.anchorLabel}>
            {fmt(t.interval.anchor, { tone: namedTone(pair.from, naming) })}
          </Text>
        ) : (
          <Text style={styles.revealHidden}> </Text>
        )}
      </View>

      {showAnswerPiano && pianoOctave ? (
        <View
          pointerEvents={phase === 'holding' && canCheck ? 'auto' : 'none'}
          style={[
            styles.pianoBlock,
            phase === 'holding' && !canCheck && styles.pianoWait,
          ]}
        >
          {answerOctaves.length > 1 ? (
            <View style={styles.octaveRow}>
              {answerOctaves.map((item) => {
                const selected = item === answerOctave;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={fmt(t.interval.answerOctaveA11y, { n: item })}
                    accessibilityState={{ selected }}
                    onPress={() => setAnswerOctave(item)}
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
                      C{item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <PianoKeyboard
            compact={compact}
            height={keyboardHeight}
            whiteKeys={pianoOctave.whiteKeys}
            blackKeys={pianoOctave.blackKeys}
            showScaleButton={false}
            onSelect={pickSecondOnPiano}
          />
        </View>
      ) : null}

      {phase === 'check' && (recordingUri || verdict?.sungHz) ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>
            {fmt(t.interval.secondReveal, {
              tone: namedTone(pair.to, naming),
              hz: Math.round(pair.to.hz),
            })}
          </Text>
          <Text style={styles.compareLine}>
            {answer === 'piano' ? t.interval.yourKey : t.interval.measuredSing}:{' '}
            {verdict?.sungHz
              ? `${hzToNoteLabel(verdict.sungHz)} · ${Math.round(verdict.sungHz)} Hz`
              : t.common.noPitch}
          </Text>
          {verdict?.cents != null ? (
            <Text style={styles.compareHint}>
              {fmt(t.common.centsBeside, {
                cents: Math.round(Math.abs(verdict.cents)),
                label: relativeLabel(pair.to, naming),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {phase === 'check' ? (
        <Pressable
          accessibilityRole="button"
            accessibilityLabel={t.interval.hearIntervalA11y}
          onPress={replayPair}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.interval.hearInterval}</Text>
        </Pressable>
      ) : null}

      {phase === 'check' && recordingUri ? (
        <Pressable
          accessibilityRole="button"
            accessibilityLabel={t.interval.hearSingingA11y}
          onPress={playRecording}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.interval.hearSinging}</Text>
        </Pressable>
      ) : null}

      {phase === 'holding' ? (
        <View style={styles.actions}>
          {singEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.interval.singButtonA11y}
              onPress={() => {
                void sing();
              }}
              disabled={!canCheck}
              style={({ pressed }) => [
                styles.button,
                !canCheck && styles.buttonDisabled,
                pressed && canCheck && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>{t.interval.singButton}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.interval.checkA11y}
            onPress={check}
            disabled={!canCheck}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              !canCheck && styles.buttonDisabled,
              pressed && canCheck && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              {singEnabled || pianoEnabled ? t.interval.checkOnly : t.common.check}
            </Text>
          </Pressable>
        </View>
      ) : phase === 'playing' || phase === 'singing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'check' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.interval.againA11y}
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
            accessibilityLabel={t.interval.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t.interval.next}</Text>
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
  octaveChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  octaveChipTextSelected: {
    color: COLORS.ink,
  },
  stage: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pair: {
    flexDirection: 'row',
    gap: 18,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  orbAnchor: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.muted,
  },
  orbSinging: {
    backgroundColor: COLORS.hit,
    borderColor: COLORS.hit,
  },
  orbCheck: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  orbHit: {
    backgroundColor: COLORS.hit,
    borderColor: COLORS.hit,
  },
  orbClose: {
    backgroundColor: COLORS.close,
    borderColor: COLORS.close,
  },
  meterTrack: {
    width: '70%',
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardLine,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: COLORS.hit,
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
  anchorLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  pianoBlock: {
    gap: 8,
  },
  pianoWait: {
    opacity: 0.45,
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
