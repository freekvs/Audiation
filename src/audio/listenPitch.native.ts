import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioRecorder,
} from 'expo-audio';

import {
  detectPitchHz,
  estimatePitchHz,
  exactCents,
  frameRms,
  hzToMidi,
  median,
  searchBandForTarget,
  type ListenControls,
  type PitchListenResult,
} from './pitch';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function canListenForPitch(): boolean {
  return true;
}

function meteringToLevel(metering: number | undefined): number {
  if (metering == null) {
    return 0;
  }
  return Math.min(1, Math.max(0, Math.pow(10, metering / 20)));
}

function parseWavPcm(buffer: ArrayBuffer): { sampleRate: number; samples: Float32Array } | null {
  if (buffer.byteLength < 44) {
    return null;
  }
  const view = new DataView(buffer);
  const tag = (offset: number) =>
    String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    return null;
  }

  let offset = 12;
  let sampleRate = 44100;
  let channels = 1;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = tag(offset);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    if (chunkId === 'fmt ') {
      channels = view.getUint16(chunkStart + 2, true);
      sampleRate = view.getUint32(chunkStart + 4, true);
      bitsPerSample = view.getUint16(chunkStart + 14, true);
    } else if (chunkId === 'data') {
      dataOffset = chunkStart;
      dataSize = chunkSize;
      break;
    }
    offset = chunkStart + chunkSize;
  }

  if (dataOffset < 0 || bitsPerSample !== 16) {
    return null;
  }

  const sampleCount = Math.floor(dataSize / 2 / channels);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = view.getInt16(dataOffset + i * 2 * channels, true) / 32768;
  }
  return { sampleRate, samples };
}

async function analyzeRecordingUri(
  uri: string,
  controls: ListenControls,
  targetHz?: number,
): Promise<number | null> {
  try {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const wav = parseWavPcm(buffer);
    if (wav) {
      return estimatePitchHz(wav.samples, wav.sampleRate, targetHz);
    }
  } catch {
    // Android records m4a; fall through to playback sampling.
  }

  if (controls.cancelled) {
    return null;
  }

  const player = createAudioPlayer({ uri });
  const voiced: number[] = [];

  try {
    const loadDeadline = Date.now() + 2000;
    while (!player.isLoaded && Date.now() < loadDeadline && !controls.cancelled) {
      await delay(40);
    }

    player.volume = 0.12;
    if (player.isAudioSamplingSupported) {
      player.setAudioSamplingEnabled(true);
      player.addListener('audioSampleUpdate', (sample) => {
        const frames = sample.channels[0]?.frames;
        if (!frames || frames.length < 512) {
          return;
        }
        const search = targetHz != null ? searchBandForTarget(targetHz) : undefined;
        const hz441 = detectPitchHz(Float32Array.from(frames), 44100, search);
        const hz480 = detectPitchHz(Float32Array.from(frames), 48000, search);
        const hz = pickHz(hz441, hz480, targetHz);
        if (hz != null) {
          voiced.push(hz);
        }
      });
    }

    player.play();
    const playDeadline = Date.now() + 4500;
    while (Date.now() < playDeadline && !controls.cancelled) {
      if (
        player.duration > 0 &&
        player.currentTime >= Math.max(0, player.duration - 0.05) &&
        !player.playing
      ) {
        break;
      }
      await delay(50);
    }
  } finally {
    try {
      player.pause();
    } catch {
      // already released
    }
    try {
      player.remove();
    } catch {
      // already released
    }
  }

  return median(voiced);
}

function pickHz(
  hz441: number | null,
  hz480: number | null,
  targetHz?: number,
): number | null {
  if (hz441 == null) {
    return hz480;
  }
  if (hz480 == null) {
    return hz441;
  }
  if (targetHz != null) {
    return Math.abs(exactCents(hz480, targetHz)) <= Math.abs(exactCents(hz441, targetHz))
      ? hz480
      : hz441;
  }
  return centsToNearestPitch(hz480) <= centsToNearestPitch(hz441) ? hz480 : hz441;
}

function centsToNearestPitch(hz: number): number {
  const midi = hzToMidi(hz);
  return Math.abs(midi - Math.round(midi)) * 100;
}

export async function listenForPitch(
  durationMs: number,
  controls: ListenControls,
  onRms?: (rms: number) => void,
  recorder?: AudioRecorder,
  targetHz?: number,
): Promise<PitchListenResult> {
  if (!recorder) {
    throw new Error('UNAVAILABLE');
  }

  try {
    await recorder.stop();
  } catch {
    // Not currently recording.
  }

  await recorder.prepareToRecordAsync();
  recorder.record();

  const startedAt = Date.now();
  while (!controls.cancelled && Date.now() - startedAt < durationMs) {
    try {
      onRms?.(meteringToLevel(recorder.getStatus().metering));
    } catch {
      onRms?.(frameRms([0]));
    }
    await delay(80);
  }

  await recorder.stop();
  if (controls.cancelled) {
    return { hz: null, recordingUri: null };
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
    interruptionMode: 'doNotMix',
  });
  await delay(120);

  const uri = recorder.uri;
  if (!uri) {
    throw new Error('UNAVAILABLE');
  }

  const hz = await analyzeRecordingUri(uri, controls, targetHz);
  return { hz, recordingUri: uri };
}
