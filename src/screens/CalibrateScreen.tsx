import {
  RecordingPresets,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { canListenForPitch, listenForPitch } from '../audio/listenPitch';
import {
  exactCents,
  hzToNoteLabel,
  type ListenControls,
} from '../audio/pitch';
import { playHz, stopTone } from '../audio/toneUri';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';

type Phase = 'idle' | 'recording' | 'result';

type Props = {
  onBack: () => void;
};

const RECORD_MS = 2500;
const TARGET_HZ = 440;

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

export function CalibrateScreen({ onBack }: Props) {
  const { compact } = useCompactLayout();
  const [phase, setPhase] = useState<Phase>('idle');
  const [measuredHz, setMeasuredHz] = useState<number | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const listenControls = useRef<ListenControls>({ cancelled: false });
  const replayRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    return () => {
      listenControls.current.cancelled = true;
      try {
        replayRef.current?.remove();
      } catch {
        // already released
      }
    };
  }, []);

  const playTone = () => {
    safePause(replayRef.current);
    void playHz(TARGET_HZ).catch(() => undefined);
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

  const recordReference = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setError('Microfoon is niet toegestaan.');
      return;
    }

    setError(null);
    setMeasuredHz(null);
    setRecordingUri(null);
    setMicLevel(0);
    setPhase('recording');
    stopTone();
    safePause(replayRef.current);
    listenControls.current = { cancelled: false };

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: true,
      interruptionMode: 'doNotMix',
    });

    try {
      if (!canListenForPitch()) {
        setError('Opnemen lukt in deze omgeving niet.');
        setPhase('idle');
        return;
      }

      const result = await listenForPitch(
        RECORD_MS,
        listenControls.current,
        setMicLevel,
        recorder,
      );
      if (listenControls.current.cancelled) {
        return;
      }
      setRecordingUri(result.recordingUri);
      setMeasuredHz(result.hz);
      setPhase('result');
    } catch {
      setError('Opnemen of meten is mislukt.');
      setPhase('idle');
    } finally {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        allowsRecording: false,
        interruptionMode: 'mixWithOthers',
      });
    }
  };

  const cents =
    measuredHz != null ? exactCents(measuredHz, TARGET_HZ) : null;

  return (
    <AppScreen onBack={onBack}>
      <Text style={[styles.title, compact && styles.titleCompact]}>IJking</Text>
      <Text style={styles.subtitle}>
        De testtoon is A4, La, 440 Hz. Speel die A met een stemapparaat, piano of
        toongenerator in de microfoon. Daarna zie je de Hertz en hoor je beide terug.
      </Text>

      {phase === 'recording' ? (
        <View style={styles.stage}>
          <Text style={styles.status}>Opnemen… houd de toon aan</Text>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.min(100, micLevel * 400)}%` }]} />
          </View>
        </View>
      ) : null}

      {phase === 'result' ? (
        <View style={styles.compare}>
          <Text style={styles.compareLine}>Testtoon: A4 · La · {TARGET_HZ} Hz</Text>
          <Text style={styles.compareLine}>
            Gemeten opname:{' '}
            {measuredHz
              ? `${hzToNoteLabel(measuredHz)} · ${Math.round(measuredHz)} Hz`
              : 'geen toon herkend'}
          </Text>
          {cents != null ? (
            <Text style={styles.compareHint}>
              {cents >= 0 ? '+' : ''}
              {Math.round(cents)} cent t.o.v. 440 Hz
            </Text>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {phase !== 'recording' ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speel testtoon A440"
            onPress={playTone}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Hoor A440 (La)</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Neem je testtoon op"
            onPress={() => {
              void recordReference();
            }}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              Neem je toon op
            </Text>
          </Pressable>
          {recordingUri ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Speel je opname"
              onPress={playRecording}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                Hoor je opname
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.buttonPlaceholder} />
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
  stage: {
    minHeight: 80,
    gap: 12,
  },
  status: {
    fontSize: 16,
    color: COLORS.text,
  },
  meterTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardLine,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: COLORS.hit,
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
    lineHeight: 18,
    color: COLORS.hint,
  },
  error: {
    fontSize: 15,
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
