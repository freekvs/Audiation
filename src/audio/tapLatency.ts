import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const TAP_LATENCY_MAX = 350;
export const TAP_LATENCY_BPM = 60;
export const TAP_LATENCY_BEATS = 8;
const DISCARD_BEATS = 2;
const MIN_SAMPLES = 4;
const STORAGE_KEY = 'audiation.tapLatency.v1';
const FILE_NAME = 'audiation-tap-latency-v1.txt';

const listeners = new Set<(ms: number) => void>();

let cached = 0;
let loaded = false;

export function clampTapLatency(ms: number): number {
  if (!Number.isFinite(ms)) {
    return 0;
  }
  return Math.max(0, Math.min(TAP_LATENCY_MAX, Math.round(ms)));
}

export function getTapLatency(): number {
  if (!loaded && Platform.OS === 'web') {
    cached = readWeb();
    loaded = true;
  }
  return cached;
}

export function subscribeTapLatency(onChange: (ms: number) => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useTapLatency(): number {
  const [ms, setMs] = useState(getTapLatency);
  useEffect(() => {
    void loadTapLatency().then(setMs);
    return subscribeTapLatency(setMs);
  }, []);
  return ms;
}

function emit(ms: number) {
  for (const listener of listeners) {
    listener(ms);
  }
}

function readWeb(): number {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw == null) {
      return 0;
    }
    return clampTapLatency(Number(raw));
  } catch {
    return 0;
  }
}

export async function loadTapLatency(): Promise<number> {
  if (loaded && Platform.OS === 'web') {
    return cached;
  }
  if (Platform.OS === 'web') {
    cached = readWeb();
    loaded = true;
    return cached;
  }
  try {
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, FILE_NAME);
    if (file.exists) {
      cached = clampTapLatency(Number((await file.text()).trim()));
    } else {
      cached = 0;
    }
  } catch {
    cached = 0;
  }
  loaded = true;
  return cached;
}

export async function setTapLatency(ms: number): Promise<void> {
  cached = clampTapLatency(ms);
  loaded = true;
  emit(cached);
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, String(cached));
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
  file.write(String(cached));
}

export type ClickTimeline = {
  compensate: number;
  audioAt: (logicalMs: number) => number;
  visualAt: (logicalMs: number) => number;
};

export function clickTimeline(latencyMs: number = getTapLatency()): ClickTimeline {
  const compensate = clampTapLatency(latencyMs);
  return {
    compensate,
    audioAt: (logicalMs: number) => logicalMs,
    visualAt: (logicalMs: number) => compensate + logicalMs,
  };
}

export function latencyExpectedTimes(): number[] {
  const step = 60000 / TAP_LATENCY_BPM;
  return Array.from({ length: TAP_LATENCY_BEATS }, (_, i) => i * step);
}

export function measureTapLatency(taps: number[], expected: number[]): number | null {
  if (expected.length < DISCARD_BEATS + MIN_SAMPLES) {
    return null;
  }
  const interval = expected.length >= 2 ? expected[1]! - expected[0]! : 1000;
  const windowMs = Math.max(90, interval * 0.45);
  const offsets: number[] = [];
  const used = new Set<number>();

  for (let i = DISCARD_BEATS; i < expected.length; i += 1) {
    const target = expected[i]!;
    let best = -1;
    let bestDist = windowMs;
    for (let j = 0; j < taps.length; j += 1) {
      if (used.has(j)) {
        continue;
      }
      const dist = Math.abs(taps[j]! - target);
      if (dist <= bestDist) {
        best = j;
        bestDist = dist;
      }
    }
    if (best >= 0) {
      used.add(best);
      offsets.push(taps[best]! - target);
    }
  }

  if (offsets.length < MIN_SAMPLES) {
    return null;
  }
  offsets.sort((a, b) => a - b);
  const median = offsets[Math.floor(offsets.length / 2)]!;
  if (median <= 8) {
    return 0;
  }
  return clampTapLatency(median);
}
