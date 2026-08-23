import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { encodeToneWav } from './encodeToneWav';

const uriCache = new Map<number, string>();
const pending = new Map<number, Promise<string>>();

let tonePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let lastUri: string | null = null;
let playSeq = 0;

export async function getToneUri(hz: number): Promise<string> {
  const key = Math.round(hz * 100);
  const cached = uriCache.get(key);
  if (cached) {
    return cached;
  }

  const inflight = pending.get(key);
  if (inflight) {
    return inflight;
  }

  const task = createToneUri(hz, key);
  pending.set(key, task);
  try {
    const uri = await task;
    uriCache.set(key, uri);
    return uri;
  } finally {
    pending.delete(key);
  }
}

async function createToneUri(hz: number, key: number): Promise<string> {
  const bytes = encodeToneWav(hz);

  if (Platform.OS === 'web') {
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, `audiation-tone-v5-${key}.wav`);
  if (!file.exists) {
    file.create();
    file.write(bytes);
  }
  return file.uri;
}

function getTonePlayer() {
  if (!tonePlayer) {
    tonePlayer = createAudioPlayer(null);
    tonePlayer.loop = false;
    tonePlayer.volume = 1;
  }
  return tonePlayer;
}

function safePause() {
  if (!tonePlayer) {
    return;
  }
  try {
    const result = tonePlayer.pause();
    if (result && typeof result === 'object' && 'catch' in result) {
      void (result as Promise<unknown>).catch(() => undefined);
    }
  } catch {
    // Op Android is de native speler soms al vrijgegeven.
  }
}

export function stopTone() {
  playSeq += 1;
  safePause();
}

export async function playHz(hz: number): Promise<void> {
  const seq = (playSeq += 1);
  const uri = await getToneUri(hz);
  if (seq !== playSeq) {
    return;
  }

  const player = getTonePlayer();
  safePause();

  if (lastUri !== uri) {
    player.replace({ uri });
    lastUri = uri;
    // replace() speelt vanzelf door als pause() op Android nog niet klaar was.
    safePause();
  }

  await player.seekTo(0);
  if (seq !== playSeq) {
    return;
  }
  player.play();
}
