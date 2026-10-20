import { exactCents, hzToNoteLabel } from './audio/pitch';
import { type ExerciseNote } from './exerciseNotes';
import {
  centsFromHz,
  describeFindNoteMiss,
  filledOctaves,
  hzFromCents,
  quantizeSliderCents,
  sliderSpanFor,
  type SliderSpan,
} from './findNote';
import type { IntervalCopy } from './i18n';
import { PIANO_OCTAVES } from './notes';

const CLASS: Record<string, string> = {
  c: 'C',
  cs: 'C♯',
  d: 'D',
  ds: 'D♯',
  e: 'E',
  f: 'F',
  fs: 'F♯',
  g: 'G',
  gs: 'G♯',
  a: 'A',
  as: 'A♯',
  b: 'B',
};

export type SameToneLock = {
  hz: number;
};

export type SameToneRound = {
  heard: ExerciseNote;
  targets: ExerciseNote[];
  span: SliderSpan;
  startCents: number;
};

export type SameTonePair = {
  hz: number;
  target: ExerciseNote;
  quality: 'hit' | 'close' | 'miss';
  cents: number;
  chosenLabel: string;
  interval: string;
};

export type SameToneScore = {
  pairs: SameTonePair[];
  hit: number;
  total: number;
  quality: 'hit' | 'close' | 'miss';
};

export function pitchClassLetter(id: string): string {
  const stem = id.replace(/\d+$/, '');
  return CLASS[stem] ?? stem.toUpperCase();
}

export function pitchClassKey(id: string): string {
  return id.replace(/\d+$/, '');
}

export function chromaticNotesInOctave(octave: number): ExerciseNote[] {
  const pack = PIANO_OCTAVES.find((item) => item.octave === octave);
  if (!pack) {
    return [];
  }
  const whites = pack.whiteKeys.filter((_, index) => index < 7);
  const keys = [...whites, ...pack.blackKeys].sort((a, b) => a.hz - b.hz);
  return keys.map((key) => ({
    id: key.id,
    name: `${pitchClassLetter(key.id)}${octave}`,
    solfege: key.solfege ?? '',
    nashville: key.nashville ?? '',
    hz: key.hz,
  }));
}

export function samePitchInOctave(heard: ExerciseNote, octave: number): ExerciseNote | undefined {
  const key = pitchClassKey(heard.id);
  return chromaticNotesInOctave(octave).find((note) => pitchClassKey(note.id) === key);
}

export function pickChromaticNote(octaves: number[], exceptId?: string): ExerciseNote {
  const pool: ExerciseNote[] = [];
  for (const octave of octaves.length > 0 ? octaves : [4]) {
    pool.push(...chromaticNotesInOctave(octave));
  }
  const unique = pool.filter((note, index) => pool.findIndex((item) => item.id === note.id) === index);
  const filtered = exceptId
    ? unique.filter((note) => pitchClassKey(note.id) !== pitchClassKey(exceptId))
    : unique;
  const list = filtered.length > 0 ? filtered : unique;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function targetsForHeard(heard: ExerciseNote, searchOctaves: number[]): ExerciseNote[] {
  const heardOctave = Number(/\d+$/.exec(heard.id)?.[0] ?? 4);
  const octaves = [...searchOctaves].sort((a, b) => a - b);
  const wanted = octaves.filter((octave) => octave !== heardOctave);
  const use = wanted.length > 0 ? wanted : octaves.length > 0 ? octaves : [heardOctave];
  const targets: ExerciseNote[] = [];
  for (const octave of use) {
    const note = samePitchInOctave(heard, octave);
    if (note && note.id !== heard.id) {
      targets.push(note);
    } else if (note && wanted.length === 0) {
      targets.push(note);
    }
  }
  if (targets.length === 0) {
    const fallback = samePitchInOctave(heard, heardOctave) ?? heard;
    return [fallback];
  }
  return targets;
}

export function pickSameToneRound(
  hearOctaves: number[],
  searchOctaves: number[],
  exceptId?: string,
): SameToneRound {
  const heard = pickChromaticNote(hearOctaves, exceptId);
  const targets = targetsForHeard(heard, searchOctaves);
  const span = sliderSpanFor(searchOctaves.length > 0 ? searchOctaves : [5]);
  const firstCents = centsFromHz(span.lowHz, targets[0]!.hz);
  return {
    heard,
    targets,
    span,
    startCents: pickStartCentsAway(firstCents, span.spanCents),
  };
}

function pickStartCentsAway(targetCents: number, spanCents: number): number {
  const minOff = 300;
  const maxOff = 900;
  const below = targetCents - (minOff + Math.random() * (maxOff - minOff));
  const above = targetCents + (minOff + Math.random() * (maxOff - minOff));
  const options = [below, above].filter((cents) => cents >= 0 && cents <= spanCents);
  if (options.length > 0) {
    return quantizeSliderCents(options[Math.floor(Math.random() * options.length)]!, spanCents);
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const cents = Math.random() * spanCents;
    if (Math.abs(cents - targetCents) >= 200) {
      return quantizeSliderCents(cents, spanCents);
    }
  }
  return quantizeSliderCents(Math.max(0, Math.min(spanCents, targetCents + minOff)), spanCents);
}

function permutations(count: number): number[][] {
  if (count <= 1) {
    return [[0]];
  }
  const out: number[][] = [];
  const used = Array.from({ length: count }, () => false);
  const walk = (cur: number[]) => {
    if (cur.length === count) {
      out.push(cur.slice());
      return;
    }
    for (let i = 0; i < count; i += 1) {
      if (used[i]) {
        continue;
      }
      used[i] = true;
      cur.push(i);
      walk(cur);
      cur.pop();
      used[i] = false;
    }
  };
  walk([]);
  return out;
}

export function scoreSameTone(
  locks: SameToneLock[],
  targets: ExerciseNote[],
  copy: IntervalCopy,
): SameToneScore {
  const n = targets.length;
  if (n === 0 || locks.length !== n) {
    return { pairs: [], hit: 0, total: n, quality: 'miss' };
  }
  let bestOrder = Array.from({ length: n }, (_, i) => i);
  let bestCost = Number.POSITIVE_INFINITY;
  for (const order of permutations(n)) {
    let cost = 0;
    for (let i = 0; i < n; i += 1) {
      cost += Math.abs(exactCents(locks[i]!.hz, targets[order[i]!]!.hz));
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = order;
    }
  }
  const pairs: SameTonePair[] = locks.map((lock, i) => {
    const target = targets[bestOrder[i]!]!;
    const detail = describeFindNoteMiss(lock.hz, target.hz, copy);
    return {
      hz: lock.hz,
      target,
      quality: detail.quality,
      cents: detail.cents,
      chosenLabel: detail.chosenLabel || hzToNoteLabel(lock.hz),
      interval: detail.interval,
    };
  });
  pairs.sort((a, b) => a.target.hz - b.target.hz);
  const hit = pairs.filter((pair) => pair.quality === 'hit').length;
  const close = pairs.filter((pair) => pair.quality === 'close').length;
  const quality = hit === n ? 'hit' : hit + close === n ? 'close' : 'miss';
  return { pairs, hit, total: n, quality };
}

export function emptyLocks(count: number): Array<number | null> {
  return Array.from({ length: Math.max(1, count) }, () => null);
}

export function allLocked(locks: Array<number | null>): boolean {
  return locks.length > 0 && locks.every((item) => item != null);
}

export { filledOctaves, hzFromCents, quantizeSliderCents };
