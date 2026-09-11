import { Platform } from 'react-native';

import { encodeChordWav } from './encodeChordWav';
import { encodeDualToneWav } from './encodeDualToneWav';
import { encodeSustainWav } from './encodeSustainWav';
import { encodeToneWav } from './encodeToneWav';
import { getSoundingKlank, type KlankId } from './klank';
import { createReadyPlayer, playUri, safePause } from './nativePlay';

const uriCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

let tonePlayer: ReturnType<typeof createReadyPlayer> | null = null;
let lastUri: string | null = null;
let playSeq = 0;

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

function getTonePlayer() {
  if (!tonePlayer) {
    tonePlayer = createReadyPlayer(false, 1);
  }
  return tonePlayer;
}

export function stopTone() {
  playSeq += 1;
  if (tonePlayer) {
    tonePlayer.loop = false;
  }
  safePause(tonePlayer);
}

export async function playHz(hz: number, options?: { loop?: boolean; klank?: KlankId }): Promise<void> {
  const seq = (playSeq += 1);
  const loop = options?.loop === true;
  const klank = options?.klank ?? getSoundingKlank();
  const uri = loop ? await getSustainUri(hz, klank) : await getToneUri(hz, klank);
  if (seq !== playSeq) {
    return;
  }

  const player = getTonePlayer();
  lastUri = await playUri(player, uri, lastUri, () => seq === playSeq, { loop });
}

export async function playDualHz(aHz: number, bHz: number, klank: KlankId = getSoundingKlank()): Promise<void> {
  const seq = (playSeq += 1);
  const uri = await getDualUri(aHz, bHz, klank);
  if (seq !== playSeq) {
    return;
  }

  const player = getTonePlayer();
  lastUri = await playUri(player, uri, lastUri, () => seq === playSeq, { loop: false });
}

export async function playChordHz(notesHz: number[], klank: KlankId = getSoundingKlank()): Promise<void> {
  const seq = (playSeq += 1);
  const uri = await getChordUri(notesHz, klank);
  if (seq !== playSeq) {
    return;
  }

  const player = getTonePlayer();
  lastUri = await playUri(player, uri, lastUri, () => seq === playSeq, { loop: false });
}
