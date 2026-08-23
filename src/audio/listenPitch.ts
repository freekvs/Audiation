import { detectPitchHz, frameRms, median, searchBandForTarget, type ListenControls, type PitchListenResult } from './pitch';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  return new Ctor();
}

export function canListenForPitch(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function listenForPitch(
  durationMs: number,
  controls: ListenControls,
  onRms?: (rms: number) => void,
  _recorder?: unknown,
  targetHz?: number,
): Promise<PitchListenResult> {
  if (!canListenForPitch()) {
    throw new Error('UNAVAILABLE');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const context = getAudioContext();
  if (!context) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('UNAVAILABLE');
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  const frame = new Float32Array(analyser.fftSize);
  const voiced: number[] = [];
  const startedAt = Date.now();

  try {
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (controls.cancelled || Date.now() - startedAt >= durationMs) {
          resolve();
          return;
        }

        analyser.getFloatTimeDomainData(frame);
        onRms?.(frameRms(frame));
        const hz = detectPitchHz(
          frame,
          context.sampleRate,
          targetHz != null ? searchBandForTarget(targetHz) : undefined,
        );
        if (hz != null) {
          voiced.push(hz);
        }
        setTimeout(tick, 80);
      };
      tick();
    });
  } finally {
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    void context.close();
  }

  return { hz: median(voiced), recordingUri: null };
}
