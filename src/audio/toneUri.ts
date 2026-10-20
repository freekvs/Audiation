import { Platform } from 'react-native';

import { encodeChordWav } from './encodeChordWav';
import { encodeDualToneWav } from './encodeDualToneWav';
import { encodeSustainWav } from './encodeSustainWav';
import { encodeToneWav } from './encodeToneWav';
import { getSoundingKlank, type KlankId } from './klank';
import { slideHz, stopSlide } from './slideTone';

type NativePlay = typeof import('./nativePlay');

const uriCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

let nativePlay: NativePlay | null = null;
let tonePlayer: ReturnType<NativePlay['createReadyPlayer']> | null = null;
let lastUri: string | null = null;
let playSeq = 0;

async function loadNativePlay(): Promise<NativePlay> {
  if (!nativePlay) {
    nativePlay = await import('./nativePlay');
  }
  return nativePlay;
}

export async function getToneUri(hz: number, klank: KlankId = getSoundingKlank()): Promise<string> {
  return getCachedUri(`tone-${klank}-${Math.round(hz * 100)}`, () => encodeToneWav(hz, klank));
}

async function getSustainUri(hz: number, klank: KlankId = getSoundingKlank()): Promise<string> {
  return getCachedUri(`hold-${klank}-${Math.round(hz * 100)}`, () => encodeSustainWav(hz, klank));
}

export { getSustainUri };

async function getChordUri(notesHz: number[], klank: KlankId = getSoundingKlank()): Promise<string> {
  const key = `chord-${klank}-${notesHz
    .map((hz) => Math.round(hz * 100))
    .sort((a, b) => a - b)
    .join('-')}`;
  return getCachedUri(key, () => encodeChordWav(notesHz, klank));
}

async function getDualUri(aHz: number, bHz: number, klank: KlankId = getSoundingKlank()): Promise<string> {
  const [low, high] = aHz <= bHz ? [aHz, bHz] : [bHz, aHz];
  const key = `dual-${klank}-${Math.round(low * 100)}-${Math.round(high * 100)}`;
  return getCachedUri(key, () => encodeDualToneWav(low, high, klank));
}

async function getCachedUri(key: string, encode: () => Uint8Array): Promise<string> {
  const cached = uriCache.get(key);
  if (cached) {
    return cached;
  }

  const inflight = pending.get(key);
  if (inflight) {
    return inflight;
  }

  const task = createWavUri(key, encode());
  pending.set(key, task);
  try {
    const uri = await task;
    uriCache.set(key, uri);
    return uri;
  } finally {
    pending.delete(key);
  }
}

async function createWavUri(key: string, bytes: Uint8Array): Promise<string> {
  if (Platform.OS === 'web') {
    return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' }));
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, `audiation-${key}.wav`);
  if (!file.exists) {
    file.create();
    file.write(bytes);
  }
  return file.uri;
}

async function getTonePlayer() {
  const audio = await loadNativePlay();
  if (!tonePlayer) {
    tonePlayer = audio.createReadyPlayer(false, 1);
  }
  return { audio, player: tonePlayer };
}

export function stopTone() {
  playSeq += 1;
  stopSlide();
  if (tonePlayer) {
    tonePlayer.loop = false;
  }
  nativePlay?.safePause(tonePlayer);
}

export async function playHz(hz: number, options?: { loop?: boolean; klank?: KlankId }): Promise<void> {
  const loop = options?.loop === true;
  if (loop) {
    slideHz(hz);
    return;
  }
  stopSlide();
  const seq = (playSeq += 1);
  const klank = options?.klank ?? getSoundingKlank();
  const uri = await getToneUri(hz, klank);
  if (seq !== playSeq) {
    return;
  }

  const { audio, player } = await getTonePlayer();
  lastUri = await audio.playUri(player, uri, lastUri, () => seq === playSeq, { loop: false });
}

export async function playDualHz(aHz: number, bHz: number, klank: KlankId = getSoundingKlank()): Promise<void> {
  stopSlide();
  const seq = (playSeq += 1);
  const uri = await getDualUri(aHz, bHz, klank);
  if (seq !== playSeq) {
    return;
  }

  const { audio, player } = await getTonePlayer();
  lastUri = await audio.playUri(player, uri, lastUri, () => seq === playSeq, { loop: false });
}

export async function playChordHz(notesHz: number[], klank: KlankId = getSoundingKlank()): Promise<void> {
  stopSlide();
  const seq = (playSeq += 1);
  const uri = await getChordUri(notesHz, klank);
  if (seq !== playSeq) {
    return;
  }

  const { audio, player } = await getTonePlayer();
  lastUri = await audio.playUri(player, uri, lastUri, () => seq === playSeq, { loop: false });
}
