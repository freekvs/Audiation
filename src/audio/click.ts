import { createAudioPlayer } from 'expo-audio';

import { encodeClickWav } from './encodeClickWav';
import { getToneUri } from './toneUri';

type Bus = 'a' | 'b';

type ClickSlot = {
  player: ReturnType<typeof createAudioPlayer> | null;
  lastUri: string | null;
  seq: number;
};

const buses: Record<Bus, ClickSlot> = {
  a: { player: null, lastUri: null, seq: 0 },
  b: { player: null, lastUri: null, seq: 0 },
};

const uriCache = new Map<number, string>();
const pending = new Map<number, Promise<string>>();

async function getClickUri(hz: number): Promise<string> {
  const key = Math.round(hz);
  const cached = uriCache.get(key);
  if (cached) {
    return cached;
  }
  const inflight = pending.get(key);
  if (inflight) {
    return inflight;
  }
  const task = (async () => {
    const bytes = encodeClickWav(hz);
    const { Platform } = await import('react-native');
    if (Platform.OS === 'web') {
      return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' }));
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, `audiation-click-v2-${key}.wav`);
    if (!file.exists) {
      file.create();
      file.write(bytes);
    }
    return file.uri;
  })();
  pending.set(key, task);
  try {
    const uri = await task;
    uriCache.set(key, uri);
    return uri;
  } finally {
    pending.delete(key);
  }
}

function getPlayer(bus: Bus) {
  const slot = buses[bus];
  if (!slot.player) {
    slot.player = createAudioPlayer(null);
    slot.player.loop = false;
    slot.player.volume = 1;
  }
  return slot.player;
}

function safePause(bus: Bus) {
  const player = buses[bus].player;
  if (!player) {
    return;
  }
  try {
    void Promise.resolve(player.pause()).catch(() => undefined);
  } catch {
    // native speler al vrijgegeven
  }
}

export function stopClicks() {
  (['a', 'b'] as const).forEach((bus) => {
    buses[bus].seq += 1;
    safePause(bus);
  });
}

export async function playClick(hz: number, bus: Bus = 'a'): Promise<void> {
  const slot = buses[bus];
  const seq = (slot.seq += 1);
  const uri = await getClickUri(hz);
  if (seq !== slot.seq) {
    return;
  }
  const player = getPlayer(bus);
  safePause(bus);
  if (slot.lastUri !== uri) {
    player.replace({ uri });
    slot.lastUri = uri;
    safePause(bus);
  }
  await player.seekTo(0);
  if (seq !== slot.seq) {
    return;
  }
  player.play();
}

export async function warmupClicks(hzList: number[]): Promise<void> {
  for (const hz of hzList) {
    await getClickUri(hz);
    void getToneUri(hz).catch(() => undefined);
  }
}
