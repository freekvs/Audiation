import { type Strings } from './i18n';

export type Meter = 3 | 4;
export type VoiceCount = 1 | 2 | 3;

export type RhythmHit = {
  slot: number;
  voice: number;
};

export type RhythmPattern = {
  id: string;
  label: string;
  meter: Meter;
  hits: RhythmHit[];
};

export const RHYTHM_VOICES = [523.25, 659.25, 783.99];
export const CLICK_HZ = 1046.5;
export const DEFAULT_BPM = 72;

export function slotsPerBar(meter: Meter): number {
  return meter * 4;
}

export function sixteenthMs(bpm: number): number {
  return 60000 / bpm / 4;
}

export function expandHits(hits: RhythmHit[], meter: Meter, bars: number): RhythmHit[] {
  const bar = slotsPerBar(meter);
  const out: RhythmHit[] = [];
  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    for (const hit of hits) {
      out.push({ slot: hit.slot + barIndex * bar, voice: hit.voice });
    }
  }
  return out;
}

function hit(slot: number, voice = 0): RhythmHit {
  return { slot, voice };
}

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  { id: '4q', meter: 4, label: 'Vier kwarten', hits: [hit(0), hit(4), hit(8), hit(12)] },
  { id: '8e', meter: 4, label: 'Acht achten', hits: [0, 2, 4, 6, 8, 10, 12, 14].map((slot) => hit(slot)) },
  {
    id: '4q-ee',
    meter: 4,
    label: 'Kwart, twee achten, kwart, kwart',
    hits: [hit(0), hit(4), hit(6), hit(8), hit(12)],
  },
  {
    id: 'sync',
    meter: 4,
    label: 'Kwart, acht, kwart, acht, kwart',
    hits: [hit(0), hit(4), hit(6), hit(10), hit(12)],
  },
  {
    id: '16-q',
    meter: 4,
    label: 'Vier zestienden, twee kwarten',
    hits: [hit(0), hit(1), hit(2), hit(3), hit(4), hit(8), hit(12)],
  },
  {
    id: 'dot',
    meter: 4,
    label: 'Gepunteerde kwart, acht, twee kwarten',
    hits: [hit(0), hit(6), hit(8), hit(12)],
  },
  { id: '3q', meter: 3, label: 'Drie kwarten', hits: [hit(0), hit(4), hit(8)] },
  { id: '6e', meter: 3, label: 'Zes achten', hits: [0, 2, 4, 6, 8, 10].map((slot) => hit(slot)) },
  {
    id: 'waltz',
    meter: 3,
    label: 'Kwart, twee achten, kwart',
    hits: [hit(0), hit(4), hit(6), hit(8)],
  },
  {
    id: '3-16',
    meter: 3,
    label: 'Vier zestienden, twee kwarten',
    hits: [hit(0), hit(1), hit(2), hit(3), hit(4), hit(8)],
  },
];

export function patternsFor(meter: Meter): RhythmPattern[] {
  return RHYTHM_PATTERNS.filter((item) => item.meter === meter);
}

export function rhythmPatternLabel(id: string, t: Strings): string {
  const labels = t.rhythm.patterns as Record<string, string>;
  return labels[id] ?? id;
}

export function countInHits(meter: Meter): RhythmHit[] {
  const hits: RhythmHit[] = [];
  for (let beat = 0; beat < meter; beat += 1) {
    hits.push({ slot: beat * 4, voice: -1 });
  }
  return hits;
}

export type RhythmTap = {
  timeMs: number;
  voice: number;
};

export function quantizeTaps(
  taps: RhythmTap[],
  meter: Meter,
  bars: number,
  bpm: number,
): RhythmHit[] {
  const step = sixteenthMs(bpm);
  const maxSlot = slotsPerBar(meter) * bars;
  const mapped = taps
    .map((tap) => ({
      slot: Math.max(0, Math.min(maxSlot - 1, Math.round(tap.timeMs / step))),
      voice: tap.voice,
    }))
    .sort((a, b) => a.slot - b.slot || a.voice - b.voice);
  const unique: RhythmHit[] = [];
  for (const hitItem of mapped) {
    const last = unique[unique.length - 1];
    if (last && last.slot === hitItem.slot && last.voice === hitItem.voice) {
      continue;
    }
    unique.push(hitItem);
  }
  return unique;
}

export type RhythmScore = {
  hit: number;
  total: number;
  extra: number;
  quality: 'hit' | 'close' | 'miss';
};

export function scoreRhythm(
  expected: RhythmHit[],
  taps: RhythmTap[],
  bpm: number,
  voices: VoiceCount,
): RhythmScore {
  const step = sixteenthMs(bpm);
  const windowMs = step * 0.45;
  const used = new Set<number>();
  let hitCount = 0;
  for (const event of expected) {
    const at = event.slot * step;
    let best = -1;
    let bestDist = windowMs;
    taps.forEach((tap, index) => {
      if (used.has(index)) {
        return;
      }
      if (voices > 1 && tap.voice !== event.voice) {
        return;
      }
      const dist = Math.abs(tap.timeMs - at);
      if (dist <= bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    if (best >= 0) {
      used.add(best);
      hitCount += 1;
    }
  }
  const extra = taps.length - used.size;
  const ratio = expected.length === 0 ? 0 : hitCount / expected.length;
  const quality = ratio === 1 && extra === 0 ? 'hit' : ratio >= 0.7 ? 'close' : 'miss';
  return { hit: hitCount, total: expected.length, extra, quality };
}

export function voiceHz(voice: number, soundCount: VoiceCount): number {
  if (voice < 0) {
    return CLICK_HZ;
  }
  const index = Math.max(0, Math.min(soundCount - 1, voice));
  return RHYTHM_VOICES[index]!;
}

export function nextPattern(meter: Meter, currentId: string): RhythmPattern {
  const list = patternsFor(meter);
  const index = list.findIndex((item) => item.id === currentId);
  return list[(index + 1) % list.length]!;
}
