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
import { playHz, stopTone } from '../audio/toneUri';
import {
  DEFAULT_EXERCISE_OCTAVE,
  EXERCISE_OCTAVES,
  type ExerciseNote,
  type ExerciseOctave,
} from '../exerciseNotes';
import { namedTone, relativeLabel, useNaming, type NamingSystem } from '../naming';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';

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
): string {
  const label = namedTone(note, naming);
  const degree = relativeLabel(note, naming);
  if (!verdict || verdict.quality === 'unavailable') {
    return `Inzingen lukt nu niet. De toon was ${label}. Controleer of de microfoon is toegestaan, of sla zingen over.`;
  }
  if (verdict.quality === 'silent') {
    return `Geen zangtoon herkend. De toon was ${label}. Probeer iets luider, of sla zingen over.`;
  }
  if (verdict.quality === 'hit') {
    return `Je zong in de buurt van ${degree}. De toon was ${label}.`;
  }
  if (verdict.quality === 'close') {
    return `Bijna: je zat dicht bij ${degree}. De toon was ${label}.`;
  }
  return `Te ver van ${label}. Dat kan het oor of de stem zijn.`;
}

export function HoldToneScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const { naming } = useNaming();
  const [phase, setPhase] = useState<Phase>('idle');
  const [octave, setOctave] = useState<ExerciseOctave>(DEFAULT_EXERCISE_OCTAVE);
  const [note, setNote] = useState<ExerciseNote>(
    () => pickNote(DEFAULT_EXERCISE_OCTAVE.notes),
  );
  const [canCheck, setCanCheck] = useState(false);
  const [singEnabled, setSingEnabled] = useState(false);
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
    listenControls.current.cancelled = true;
    clearTimers();
    const next = pickNote(octave.notes, note.id);
    setNote(next);
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
      ? 'Luister'
      : phase === 'holding'
        ? 'Houd de toon vast'
        : phase === 'singing'
          ? 'Zing de toon'
          : phase === 'check'
            ? 'Controle'
            : 'Toon vasthouden';

  const body =
    phase === 'idle'
      ? singEnabled
        ? `Je hoort een toon uit C-majeur in octaaf ${octave.label}. Daarna stilte: houd hem innerlijk vast. Daarna zing je hem. Octaaf lager of hoger telt mee.`
        : `Je hoort een toon uit C-majeur in octaaf ${octave.label}. Daarna wordt het stil. Houd die toon innerlijk vast. Tik Controleer als je hem nog hoort.`
      : phase === 'playing'
        ? 'Luister. Onthoud de toon, niet de naam.'
        : phase === 'holding'
          ? singEnabled
            ? 'Het is stil. Houd dezelfde toon in je hoofd. Daarna kun je zingen.'
            : 'Het is stil. Houd dezelfde toon in je hoofd.'
          : phase === 'singing'
            ? 'Zing of neurie dezelfde toon, ongeveer twee seconden. Daarna hoor je jezelf kort terug; dat is de meting, geen extra oefening.'
            : verdict
              ? verdictText(note, verdict, naming)
              : `Dit was ${namedTone(note, naming)}. Was het dezelfde toon als in je hoofd?`;

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {phase === 'idle' || phase === 'check' ? (
        <View style={styles.octaveBlock}>
          <Text style={styles.optionTitle}>Octaaf</Text>
          <View style={styles.octaveRow}>
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
            <Text style={styles.optionTitle}>Inzingen</Text>
            <Text style={styles.optionHint}>
              Optioneel. Na de stilte zing je de toon; de app luistert of je in de buurt zit.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Inzingen in- of uitschakelen"
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
            Oefentoets: {namedTone(note, naming)} · {Math.round(note.hz)} Hz
          </Text>
          <Text style={styles.compareLine}>
            Gemeten zang:{' '}
            {verdict?.sungHz
              ? `${hzToNoteLabel(verdict.sungHz)} · ${Math.round(verdict.sungHz)} Hz`
              : 'geen toon herkend'}
          </Text>
          {verdict?.cents != null ? (
            <Text style={styles.compareHint}>
              {Math.round(Math.abs(verdict.cents))} cent naast {relativeLabel(note, naming)}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speel de oefentoets"
            onPress={() => play(note)}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>Hoor oefentoets</Text>
          </Pressable>
          {recordingUri ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Speel je opgenomen zang"
              onPress={playRecording}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>Hoor je zang</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {phase === 'holding' ? (
        <View style={styles.actions}>
          {singEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zing de toon"
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
              <Text style={styles.buttonText}>Zing de toon</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Controleer de toon"
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
              {singEnabled ? 'Sla zingen over' : 'Controleer'}
            </Text>
          </Pressable>
        </View>
      ) : phase === 'playing' || phase === 'singing' ? (
        <View style={styles.buttonPlaceholder} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={phase === 'idle' ? 'Start oefening' : 'Volgende toon'}
          onPress={startRound}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>
            {phase === 'idle' ? 'Start' : 'Volgende toon'}
          </Text>
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
