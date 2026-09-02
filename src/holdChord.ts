import { formatDegree, pickCMajorChord, chordKey, type ChordSize, type VoicedChord } from './progression';
import type { NamingSystem } from './naming';
import type { Strings } from './i18n';

export type HoldSizeMode = 'triad' | 'seventh' | 'mix';
export type HoldInversionMode = 'root' | 'inv1' | 'inv2' | 'mix';

export const HOLD_SIZE_MODES: HoldSizeMode[] = ['triad', 'seventh', 'mix'];
export const HOLD_INVERSION_MODES: HoldInversionMode[] = ['root', 'inv1', 'inv2', 'mix'];

export type HoldChord = VoicedChord;

export type ChordQualityId =
  | 'major'
  | 'minor'
  | 'dim'
  | 'aug'
  | 'maj7'
  | 'm7'
  | 'dom7'
  | 'halfdim'
  | 'other';

export function pickHoldChord(options: {
  sizeMode: HoldSizeMode;
  inversionMode: HoldInversionMode;
  octave: number;
  exceptKey?: string;
}): HoldChord {
  const size: ChordSize =
    options.sizeMode === 'mix'
      ? Math.random() < 0.5
        ? 3
        : 4
      : options.sizeMode === 'seventh'
        ? 4
        : 3;
  const maxInv = size - 1;
  let inversion = 0;
  if (options.inversionMode === 'inv1') {
    inversion = Math.min(1, maxInv);
  } else if (options.inversionMode === 'inv2') {
    inversion = Math.min(2, maxInv);
  } else if (options.inversionMode === 'mix') {
    inversion = Math.floor(Math.random() * (maxInv + 1));
  }
  const high = Math.min(options.octave + (inversion > 0 ? 1 : 0), 7);
  const octaves = high === options.octave ? [options.octave] : [options.octave, high];
  return pickCMajorChord({
    size,
    inversion,
    octaves,
    exceptKey: options.exceptKey,
  });
}

export function holdChordKey(chord: HoldChord): string {
  return chordKey(chord);
}

export function chordQualityId(intervals: number[]): ChordQualityId {
  const third = intervals[1] ?? 4;
  const fifth = intervals[2] ?? 7;
  const seventh = intervals[3];
  if (seventh == null) {
    if (third === 4 && fifth === 8) {
      return 'aug';
    }
    if (third === 3 && fifth === 6) {
      return 'dim';
    }
    if (third === 3) {
      return 'minor';
    }
    return 'major';
  }
  if (third === 3 && fifth === 6 && seventh === 10) {
    return 'halfdim';
  }
  if (third === 3 && seventh === 10) {
    return 'm7';
  }
  if (third === 4 && seventh === 10) {
    return 'dom7';
  }
  if (third === 4 && seventh === 11) {
    return 'maj7';
  }
  if (third === 3 && seventh === 11) {
    return 'm7';
  }
  return 'other';
}

export function inversionLabel(inversion: number, t: Strings): string {
  if (inversion === 1) {
    return t.harmony.inv1;
  }
  if (inversion === 2) {
    return t.harmony.inv2;
  }
  if (inversion === 3) {
    return t.holdChord.inv3;
  }
  return t.harmony.root;
}

export function qualityLabel(id: ChordQualityId, t: Strings): string {
  if (id === 'major' || id === 'minor' || id === 'dim' || id === 'aug') {
    return t.harmony[id];
  }
  return t.holdChord[id];
}

export function describeHoldChord(chord: HoldChord, naming: NamingSystem, t: Strings): string {
  const root = formatDegree(chord.rootPc, naming);
  const quality = qualityLabel(chordQualityId(chord.intervals), t);
  const inv = inversionLabel(chord.inversion, t);
  return `${root} ${quality} · ${inv}`;
}
