import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { encodeDroneWav } from './encodeDroneWav';
import { createReadyPlayer, playUri, safePause } from './nativePlay';
import { DEFAULT_PIANO_OCTAVE, PIANO_OCTAVES } from '../notes';

const STORAGE_KEY = 'audiation.drone.v1';
const FILE_NAME = 'audiation-drone-pref-v1.txt';

const uriCache = new Map<number, string>();
const pending = new Map<number, Promise<string>>();

let dronePlayer: ReturnType<typeof createReadyPlayer> | null = null;
let lastUri: string | null = null;
let droneSeq = 0;

const DRONE_VOLUME = 0.12;

export function droneChord(octave: number): {
  tonicHz: number;
  fifthHz: number;
  lowHz: number;
} {
  const pack =
    PIANO_OCTAVES.find((item) => item.octave === octave) ?? DEFAULT_PIANO_OCTAVE;
  const tonic = pack.whiteKeys[0]!;
  const fifth = pack.whiteKeys[4]!;
  return {
    tonicHz: tonic.hz,
    fifthHz: fifth.hz,
    lowHz: tonic.hz / 2,
  };
}

async function getDroneUri(octave: number): Promise<string> {
  const cached = uriCache.get(octave);
  if (cached) {
    return cached;
  }
  const inflight = pending.get(octave);
  if (inflight) {
    return inflight;
  }

  const task = createDroneUri(octave);
  pending.set(octave, task);
  try {
    const uri = await task;
    uriCache.set(octave, uri);
    return uri;
  } finally {
    pending.delete(octave);
  }
}

async function createDroneUri(octave: number): Promise<string> {
  const bytes = encodeDroneWav(droneChord(octave));

  if (Platform.OS === 'web') {
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, `audiation-drone-v1-${octave}.wav`);
  if (!file.exists) {
    file.create();
    file.write(bytes);
  }
  return file.uri;
}

function getDronePlayer() {
  if (!dronePlayer) {
    dronePlayer = createReadyPlayer(true, DRONE_VOLUME);
  }
  return dronePlayer;
}

export async function startDrone(octave: number): Promise<void> {
  const seq = (droneSeq += 1);
  const uri = await getDroneUri(octave);
  if (seq !== droneSeq) {
    return;
  }

  const player = getDronePlayer();
  player.volume = DRONE_VOLUME;
  lastUri = await playUri(player, uri, lastUri, () => seq === droneSeq, { loop: true });
}

export function pauseDrone() {
  droneSeq += 1;
  safePause(dronePlayer);
}

export function stopDrone() {
  droneSeq += 1;
  safePause(dronePlayer);
  lastUri = null;
}

export async function loadDronePref(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) {
    return false;
  }
  return (await file.text()).trim() === '1';
}

export async function saveDronePref(enabled: boolean): Promise<void> {
  const raw = enabled ? '1' : '0';
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, raw);
    } catch {
      // privé-modus
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) {
    file.create();
  }
  file.write(raw);
}

export function useDrone(octave: number, paused: boolean) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void loadDronePref().then(setEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopDrone();
      return;
    }
    if (paused) {
      pauseDrone();
      return;
    }
    void startDrone(octave).catch(() => undefined);
  }, [enabled, octave, paused]);

  useEffect(() => {
    return () => {
      stopDrone();
    };
  }, []);

  const setDroneEnabled = (value: boolean) => {
    setEnabled(value);
    void saveDronePref(value);
  };

  return { droneEnabled: enabled, setDroneEnabled };
}
