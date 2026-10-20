export type TempoUnit = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'triplet';

export const TEMPO_UNITS: TempoUnit[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'triplet'];

export const TEMPO_BPM_MIN = 40;
export const TEMPO_BPM_MAX = 180;
export const TEMPO_BPM_DEFAULT = 60;
export const TEMPO_MIN_MS = 10000;
export const TEMPO_BEATS_PER_BAR = 4;

export function clampTempoBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) {
    return TEMPO_BPM_DEFAULT;
  }
  return Math.max(TEMPO_BPM_MIN, Math.min(TEMPO_BPM_MAX, Math.round(bpm)));
}

export function parseTempoUnit(value: unknown): TempoUnit {
  return TEMPO_UNITS.includes(value as TempoUnit) ? (value as TempoUnit) : 'quarter';
}

export function beatMs(bpm: number): number {
  return 60000 / clampTempoBpm(bpm);
}

export function tapsPerBeat(unit: TempoUnit): number {
  switch (unit) {
    case 'whole':
      return 0.25;
    case 'half':
      return 0.5;
    case 'quarter':
      return 1;
    case 'eighth':
      return 2;
    case 'sixteenth':
      return 4;
    case 'triplet':
      return 3;
  }
}

export function tapIntervalMs(bpm: number, unit: TempoUnit): number {
  return beatMs(bpm) / tapsPerBeat(unit);
}

export function tempoBars(bpm: number): number {
  const barMs = beatMs(bpm) * TEMPO_BEATS_PER_BAR;
  return Math.max(1, Math.ceil(TEMPO_MIN_MS / barMs));
}

export function tempoDurationMs(bpm: number): number {
  return tempoBars(bpm) * beatMs(bpm) * TEMPO_BEATS_PER_BAR;
}

export function expectedTapTimes(bpm: number, unit: TempoUnit): number[] {
  const duration = tempoDurationMs(bpm);
  const interval = tapIntervalMs(bpm, unit);
  const count = Math.max(1, Math.round(duration / interval));
  const times: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const time = i * interval;
    if (time >= duration - 1) {
      break;
    }
    times.push(time);
  }
  return times;
}

const TEMPO_DIFFICULTY: TempoUnit[] = ['whole', 'half', 'quarter', 'eighth', 'triplet', 'sixteenth'];

export function nextHarderUnit(unit: TempoUnit): TempoUnit {
  const index = TEMPO_DIFFICULTY.indexOf(unit);
  return TEMPO_DIFFICULTY[Math.min(TEMPO_DIFFICULTY.length - 1, Math.max(0, index) + 1)] ?? 'sixteenth';
}

export type TempoScore = {
  hit: number;
  total: number;
  extra: number;
  quality: 'hit' | 'close' | 'miss';
  measuredBpm: number | null;
};

export function measuredBpmFromTaps(taps: number[], unit: TempoUnit): number | null {
  if (taps.length < 2) {
    return null;
  }
  const gaps: number[] = [];
  for (let i = 1; i < taps.length; i += 1) {
    const gap = taps[i]! - taps[i - 1]!;
    if (gap > 40) {
      gaps.push(gap);
    }
  }
  if (gaps.length === 0) {
    return null;
  }
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)]!;
  return clampTempoBpm((60000 / median) * tapsPerBeat(unit));
}

export function scoreTempoTaps(taps: number[], bpm: number, unit: TempoUnit): TempoScore {
  const expected = expectedTapTimes(bpm, unit);
  const interval = tapIntervalMs(bpm, unit);
  const windowMs = Math.max(70, Math.min(180, interval * 0.28));
  const used = new Set<number>();
  let hit = 0;

  for (const target of expected) {
    let best = -1;
    let bestDist = windowMs;
    for (let i = 0; i < taps.length; i += 1) {
      if (used.has(i)) {
        continue;
      }
      const dist = Math.abs(taps[i]! - target);
      if (dist <= bestDist) {
        best = i;
        bestDist = dist;
      }
    }
    if (best >= 0) {
      used.add(best);
      hit += 1;
    }
  }

  const extra = Math.max(0, taps.length - hit);
  const ratio = expected.length === 0 ? 0 : hit / expected.length;
  const quality: TempoScore['quality'] =
    ratio >= 0.85 && extra <= 1 ? 'hit' : ratio >= 0.55 ? 'close' : 'miss';

  return {
    hit,
    total: expected.length,
    extra,
    quality,
    measuredBpm: measuredBpmFromTaps(taps, unit),
  };
}
