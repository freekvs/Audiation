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
  hzToNoteLabel,
  matchSungPitch,
  type ListenControls,
  type PitchVerdict,
} from '../audio/pitch';
import { beginSoundingRound } from '../audio/klank';
import { playHz, stopTone } from '../audio/toneUri';
import { exerciseOctave, EXERCISE_OCTAVES, type ExerciseNote, type ExerciseOctave } from '../exerciseNotes';
import { useExercisePrefs } from '../exercisePrefs';
import { fmt, useT, type Strings } from '../i18n';
import { namedTone, relativeLabel, useNaming, type NamingSystem } from '../naming';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';

type Phase = 'idle' | 'playing' | 'holding' | 'singing' | 'check';

type Props = {
  onBack: () => void;
};

const PLAY_MS = 950;
const CHECK_ENABLE_MS = 1200;
const SING_MS = 2000;

function safePause(player: { pause: () => unknown } | null | undefined) {
  try {
    const result = player?.pause();
    if (result && typeof result === 'object' && 'catch' in result) {
      void (result as Promise<unknown>).catch(() => undefined);
    }
  } catch {
    // Op Android is de native speler soms al vrijgegeven.
  }
}

function pickNote(scale: ExerciseNote[], exceptId?: string): ExerciseNote {
  const pool = exceptId ? scale.filter((item) => item.id !== exceptId) : scale;
  return pool[Math.floor(Math.random() * pool.length)];
}

function verdictText(
  note: ExerciseNote,
  verdict: PitchVerdict | null,
  naming: NamingSystem,
  copy: Strings['hold'],
): string {
  const label = namedTone(note, naming);
  const degree = relativeLabel(note, naming);
  if (!verdict || verdict.quality === 'unavailable') {
    return fmt(copy.unavailable, { label });
  }
  if (verdict.quality === 'silent') {
    return fmt(copy.silent, { label });
  }
  if (verdict.quality === 'hit') {
    return fmt(copy.hit, { degree, label });
  }
  if (verdict.quality === 'close') {
    return fmt(copy.close, { degree, label });
  }
  return fmt(copy.miss, { label });
}

export function HoldToneScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const t = useT();
  const { prefs, update } = useExercisePrefs();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(() => exerciseOctave(prefs.holdTone.octave));
  const [note, setNote] = useState<ExerciseNote>(
    () => pickNote(exerciseOctave(prefs.holdTone.octave).notes),
  );
  const [canCheck, setCanCheck] = useState(false);
  const [singEnabled, setSingEnabled] = useState(prefs.holdTone.singEnabled);
  const [verdict, setVerdict] = useState<PitchVerdict | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
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
    update('holdTone', { octave: octave.octave, singEnabled });
  }, [octave, singEnabled, update]);

  const play = (next: ExerciseNote) => {
    void playHz(next.hz).catch(() => undefined);
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
    const next = pickNote(octave.notes, note.id);
    setNote(next);
    beginHold(next);
  };

  const repeatRound = () => {
    listenControls.current.cancelled = true;
    clearTimers();
    beginHold(note);
  };

  const beginHold = (next: ExerciseNote) => {
    setCanCheck(false);
    setVerdict(null);
    setRecordingUri(null);
    setMicLevel(0);
    setPhase('playing');
    play(next);

    timers.current.push(
      setTimeout(() => {
        stopTone();
        setPhase('holding');
      }, PLAY_MS),
    );

    timers.current.push(
      setTimeout(() => {
        setCanCheck(true);
      }, PLAY_MS + CHECK_ENABLE_MS),
    );
  };

  const finishCheck = (nextVerdict: PitchVerdict | null, playTarget: boolean) => {
    setVerdict(nextVerdict);
    setPhase('check');
    if (playTarget) {
      play(note);
    }
  };

  const check = () => {
    if (!canCheck) {
      return;
    }
    clearTimers();
    finishCheck(null, true);
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
          note.hz,
        );
        capturedUri = result.recordingUri;
        setRecordingUri(result.recordingUri);
        nextVerdict = matchSungPitch(result.hz, note.hz);
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
    finishCheck(nextVerdict, capturedUri == null);
  };

  const chooseOctave = (next: ExerciseOctave) => {
    if (next.octave === octave.octave) {
      return;
    }
    setOctave(next);
    setNote(pickNote(next.notes));
    setVerdict(null);
    setRecordingUri(null);
  };

  const title =
    phase === 'playing'
      ? t.common.listen
      : phase === 'holding'
        ? t.hold.titleHold
        : phase === 'singing'
          ? t.hold.titleSing
          : phase === 'check'
            ? t.common.control
            : t.practice.holdTone.title;

  const body =
    phase === 'idle'
      ? singEnabled
        ? fmt(t.hold.idleSing, { octave: octave.label })
        : fmt(t.hold.idleSilent, { octave: octave.label })
      : phase === 'playing'
        ? t.hold.playing
        : phase === 'holding'
          ? singEnabled
            ? t.hold.holdingSing
            : t.hold.holdingSilent
          : phase === 'singing'
            ? t.hold.singing
            : verdict
              ? verdictText(note, verdict, naming, t.hold)
              : fmt(t.hold.checkAsk, { tone: namedTone(note, naming) });

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'idle' || phase === 'check' ? (
        <ChoiceHelp
          label={t.help.cMajorTitle}
          body={t.help.cMajor}
          a11y={fmt(t.help.moreA11y, { term: t.help.cMajorTitle })}
        />
      ) : null}

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>{t.common.octave}</Text>
          <View style={styles.octaveRow}>
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
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t.hold.singTitle}</Text>
            <Text style={styles.optionHint}>{t.hold.singHint}</Text>
          </View>
          <Switch
            accessibilityLabel={t.hold.singA11y}
            value={singEnabled}
            onValueChange={(value) => {
              void enableSinging(value);
            }}
            trackColor={{ false: COLORS.cardLine, true: COLORS.hit }}
            thumbColor={singEnabled ? COLORS.text : COLORS.muted}
          />
        </View>
      ) : null}

      <View style={styles.stage}>
        <View
          style={[
            styles.orb,
            phase === 'playing' && styles.orbPlaying,
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
        {phase === 'singing' ? (
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.min(100, micLevel * 400)}%` }]} />
          </View>
        ) : null}
        {phase === 'check' ? (
          <Text style={styles.reveal}>
            {relativeLabel(note, naming)} · {note.name}
          </Text>
        ) : (
          <Text style={styles.revealHidden}> </Text>
        )}
      </View>

      {phase === 'check' && (recordingUri || verdict?.sungHz) ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>
            {fmt(t.hold.exerciseTone, {
              tone: namedTone(note, naming),
              hz: Math.round(note.hz),
            })}
          </Text>
          <Text style={styles.compareLine}>
            {fmt(t.hold.measuredSing, {
              value: verdict?.sungHz
                ? `${hzToNoteLabel(verdict.sungHz)} · ${Math.round(verdict.sungHz)} Hz`
                : t.common.noPitch,
            })}
          </Text>
          {verdict?.cents != null ? (
            <Text style={styles.compareHint}>
              {fmt(t.common.centsBeside, {
                cents: Math.round(Math.abs(verdict.cents)),
                label: relativeLabel(note, naming),
              })}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.hold.hearExerciseA11y}
            onPress={() => play(note)}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.hold.hearExercise}</Text>
          </Pressable>
          {recordingUri ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.hold.hearSingingA11y}
              onPress={playRecording}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>{t.hold.hearSinging}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {phase === 'holding' ? (
        <View style={styles.actions}>
          {singEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.hold.singButtonA11y}
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
              <Text style={styles.buttonText}>{t.hold.singButton}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.hold.checkA11y}
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
              {singEnabled ? t.hold.skipSing : t.common.check}
            </Text>
          </Pressable>
        </View>
      ) : phase === 'playing' || phase === 'singing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : phase === 'check' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.hold.againA11y}
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
            accessibilityLabel={t.hold.nextA11y}
            onPress={startRound}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t.hold.next}</Text>
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
  orb: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
  },
  revealHidden: {
    fontSize: 18,
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
