import { hzToMidi } from './audio/pitch';
import { EXERCISE_OCTAVES, type ExerciseNote } from './exerciseNotes';
import { intervalNameFromSemitones, type IntervalCopy } from './i18n';
import { relativeLabel, type NamingSystem } from './naming';

export type OctaveWay = 'up' | 'down';

export type IntervalPair = {
  from: ExerciseNote;
  to: ExerciseNote;
  semitones: number;
};

export function maxIntervalSpan(homeOctave: number, way: OctaveWay): number {
  const extra = way === 'up' ? 8 - homeOctave : homeOctave - 1;
  return Math.max(1, 1 + extra);
}

export function secondOctaves(
  homeOctave: number,
  span: number,
  way: OctaveWay,
): number[] {
  if (span <= 1) {
    return [homeOctave];
  }
  const octaves: number[] = [];
  for (let step = 1; step < span; step += 1) {
    const octave = way === 'up' ? homeOctave + step : homeOctave - step;
    if (octave >= 1 && octave <= 8) {
      octaves.push(octave);
    }
  }
  return octaves;
}

function uniqueNotes(octaves: number[]): ExerciseNote[] {
  const notes: ExerciseNote[] = [];
  const seen = new Set<string>();
  for (const octave of octaves) {
    const pack = EXERCISE_OCTAVES.find((item) => item.octave === octave);
    if (!pack) {
      continue;
    }
    for (const note of pack.notes) {
      if (seen.has(note.id)) {
        continue;
      }
      seen.add(note.id);
      notes.push(note);
    }
  }
  return notes;
}

export function intervalNameFromHz(fromHz: number, toHz: number, copy: IntervalCopy): string {
  const semitones = Math.round(Math.abs(hzToMidi(toHz) - hzToMidi(fromHz)));
  return intervalNameFromSemitones(semitones, copy);
}

export function makePair(from: ExerciseNote, to: ExerciseNote): IntervalPair {
  return {
    from,
    to,
    semitones: Math.round(Math.abs(hzToMidi(to.hz) - hzToMidi(from.hz))),
  };
}

type PickOptions = {
  homeOctave: number;
  span: number;
  way: OctaveWay;
  except?: IntervalPair | null;
};

export function pickInterval({
  homeOctave,
  span,
  way,
  except,
}: PickOptions): IntervalPair {
  const firstNotes = uniqueNotes([homeOctave]);
  const secondNotes = uniqueNotes(secondOctaves(homeOctave, span, way));
  const pairs: IntervalPair[] = [];

  for (const from of firstNotes) {
    for (const to of secondNotes) {
      if (from.id === to.id) {
        continue;
      }
      if (span >= 2 && way === 'up' && to.hz <= from.hz) {
        continue;
      }
      if (span >= 2 && way === 'down' && to.hz >= from.hz) {
        continue;
      }
      pairs.push(makePair(from, to));
    }
  }

  const pool = except
    ? pairs.filter((item) => item.from.id !== except.from.id || item.to.id !== except.to.id)
    : pairs;
  const source = pool.length > 0 ? pool : pairs;
  if (source.length === 0) {
    const fallback = uniqueNotes([homeOctave]);
    return makePair(fallback[0], fallback[Math.min(1, fallback.length - 1)]);
  }
  return source[Math.floor(Math.random() * source.length)];
}

export function describeInterval(
  pair: IntervalPair,
  naming: NamingSystem,
  copy: IntervalCopy,
): string {
  return `${relativeLabel(pair.from, naming)} → ${relativeLabel(pair.to, naming)} · ${intervalNameFromSemitones(pair.semitones, copy)}`;
}
