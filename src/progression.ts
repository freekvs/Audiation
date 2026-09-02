import { filledOctaves } from './findNote';
import type { NamingSystem } from './naming';

export const PROGRESSION_LENGTHS = [2, 3, 4, 5, 6, 7, 8] as const;
export const DEFAULT_PROGRESSION_LENGTH = 2;
export const CHORD_PLAY_MS = 1200;
export const CHORD_GAP_MS = 400;

export function cTonicHz(octave: number): number {
  const midi = 12 * (Math.round(octave) + 1);
  return midiToHz(midi);
}

export function progressionPlayMs(chordCount: number, withTonic: boolean): number {
  const steps = chordCount + (withTonic ? 1 : 0);
  return Math.max(0, steps * (CHORD_PLAY_MS + CHORD_GAP_MS) - CHORD_GAP_MS);
}

export type ChordSize = 3 | 4;
export type ProgressionPalette = 'major' | 'known' | 'random';
export type ProgressionPattern = 'free' | 'cadence' | 'oneFourFive';

export const PALETTE_OPTIONS: ProgressionPalette[] = ['major', 'known', 'random'];
export const PATTERN_OPTIONS: ProgressionPattern[] = ['free', 'cadence', 'oneFourFive'];

export type ChromaticDegree = {
  pc: number;
  numeral: string;
  solfege: string;
  letters: string;
};

export const CHROMATIC_DEGREES: ChromaticDegree[] = [
  { pc: 0, numeral: '1', solfege: 'Do', letters: 'C' },
  { pc: 1, numeral: '♯1/♭2', solfege: 'Ra', letters: 'C♯/D♭' },
  { pc: 2, numeral: '2', solfege: 'Re', letters: 'D' },
  { pc: 3, numeral: '♯2/♭3', solfege: 'Me', letters: 'D♯/E♭' },
  { pc: 4, numeral: '3', solfege: 'Mi', letters: 'E' },
  { pc: 5, numeral: '4', solfege: 'Fa', letters: 'F' },
  { pc: 6, numeral: '♯4/♭5', solfege: 'Se', letters: 'F♯/G♭' },
  { pc: 7, numeral: '5', solfege: 'Sol', letters: 'G' },
  { pc: 8, numeral: '♯5/♭6', solfege: 'Le', letters: 'G♯/A♭' },
  { pc: 9, numeral: '6', solfege: 'La', letters: 'A' },
  { pc: 10, numeral: '♯6/♭7', solfege: 'Te', letters: 'A♯/B♭' },
  { pc: 11, numeral: '7', solfege: 'Si', letters: 'B' },
];

export const DIATONIC_PCS = [0, 2, 4, 5, 7, 9, 11];

const C_IONIAN = [0, 2, 4, 5, 7, 9, 11];

const OTHER_SCALE_PCS: number[][] = [
  C_IONIAN,
  [0, 2, 3, 5, 7, 9, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 4, 6, 7, 9, 11],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 1, 3, 5, 6, 8, 10],
  [0, 2, 3, 5, 7, 8, 11],
  [0, 2, 3, 5, 7, 9, 11],
  [0, 2, 4, 5, 7, 8, 11],
];

type ChordTemplate = {
  rootPc: number;
  intervals: number[];
};

export type ProgressionChord = {
  rootPc: number;
  midi: number[];
  hz: number[];
};

export type ProgressionRound = {
  chords: ProgressionChord[];
  palette: ProgressionPalette;
  size: ChordSize;
};

export function degreeFor(pc: number): ChromaticDegree {
  return CHROMATIC_DEGREES[((pc % 12) + 12) % 12]!;
}

export function degreePrimary(pc: number, naming: NamingSystem): string {
  const degree = degreeFor(pc);
  return naming === 'nashville' ? degree.numeral : degree.solfege;
}

export function degreeHint(pc: number): string {
  return degreeFor(pc).letters;
}

export function formatDegree(pc: number, naming: NamingSystem): string {
  return `${degreePrimary(pc, naming)} (${degreeHint(pc)})`;
}

export function defaultPaletteForLength(length: number): ProgressionPalette {
  return length <= 2 ? 'random' : 'major';
}

export function palettesForLength(length: number): ProgressionPalette[] {
  return [...PALETTE_OPTIONS];
}

export function isPaletteOpen(length: number, palette: ProgressionPalette): boolean {
  return !(length <= 2 && palette === 'major');
}

export function usesChromaticChips(palette: ProgressionPalette, naming: NamingSystem): boolean {
  return naming === 'nashville' && palette !== 'major';
}

export function answerChips(palette: ProgressionPalette, naming: NamingSystem): number[] {
  return usesChromaticChips(palette, naming)
    ? CHROMATIC_DEGREES.map((item) => item.pc)
    : [...DIATONIC_PCS];
}

export function formatRoots(pcs: number[], naming: NamingSystem): string {
  return pcs.map((pc) => formatDegree(pc, naming)).join(' · ');
}

export type AccidentalMark = 'sharp' | 'flat';

const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11];

export function pcFromNumberInput(degree: number, accidental: AccidentalMark | null): number {
  const step = Math.max(1, Math.min(7, Math.round(degree)));
  const natural = NATURAL_PCS[step - 1]!;
  if (accidental === 'sharp') {
    return (natural + 1) % 12;
  }
  if (accidental === 'flat') {
    return (natural + 11) % 12;
  }
  return natural;
}

export function spellingFromInput(degree: number, accidental: AccidentalMark | null): string {
  if (accidental === 'sharp') {
    return `♯${stepOr(degree)}`;
  }
  if (accidental === 'flat') {
    return `♭${stepOr(degree)}`;
  }
  return String(stepOr(degree));
}

function stepOr(degree: number): number {
  return Math.max(1, Math.min(7, Math.round(degree)));
}

export function emptyGuess(length: number): (number | null)[] {
  return Array.from({ length }, () => null);
}

export function emptyMarks(length: number): (string | null)[] {
  return Array.from({ length }, () => null);
}

export function guessComplete(guess: (number | null)[]): guess is number[] {
  return guess.length > 0 && guess.every((pc) => pc != null);
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function chordsFromScale(pcs: number[], size: ChordSize): ChordTemplate[] {
  const out: ChordTemplate[] = [];
  const steps = size === 3 ? [0, 2, 4] : [0, 2, 4, 6];
  for (let i = 0; i < pcs.length; i += 1) {
    const root = pcs[i]!;
    out.push({
      rootPc: root,
      intervals: steps.map((step) => {
        const pc = pcs[(i + step) % pcs.length]!;
        return ((pc - root) + 12) % 12;
      }),
    });
  }
  return out;
}

function uniquePool(scales: number[][], size: ChordSize): ChordTemplate[] {
  const map = new Map<string, ChordTemplate>();
  for (const pcs of scales) {
    for (const chord of chordsFromScale(pcs, size)) {
      map.set(`${chord.rootPc}:${chord.intervals.join(',')}`, chord);
    }
  }
  return [...map.values()];
}

function isDiatonicRoot(pc: number): boolean {
  return DIATONIC_PCS.includes(pc);
}

function chordPool(
  palette: ProgressionPalette,
  size: ChordSize,
  naming: NamingSystem,
): ChordTemplate[] {
  let pool: ChordTemplate[];
  if (palette === 'major') {
    pool = uniquePool([C_IONIAN], size);
  } else if (palette === 'known') {
    const known = OTHER_SCALE_PCS.filter((pcs) => pcs !== C_IONIAN);
    const scale = known[Math.floor(Math.random() * known.length)]!;
    pool = uniquePool([scale], size);
  } else {
    pool = uniquePool(OTHER_SCALE_PCS, size);
  }
  if (naming === 'solfege') {
    const limited = pool.filter((item) => isDiatonicRoot(item.rootPc));
    return limited.length > 0 ? limited : uniquePool([C_IONIAN], size);
  }
  return pool;
}

function invertIntervals(intervals: number[], inversion: number): number[] {
  const notes = [...intervals];
  const turns = Math.max(0, inversion) % notes.length;
  for (let i = 0; i < turns; i += 1) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  return notes;
}

function voiceCandidates(
  template: ChordTemplate,
  inversion: number,
  octaves: number[],
): number[][] {
  const filled = filledOctaves(octaves);
  const lowMidi = 12 * (filled[0]! + 1);
  const highMidi = 12 * (filled[filled.length - 1]! + 2);
  const stacked = invertIntervals(template.intervals, inversion);
  const bassPc = (template.rootPc + stacked[0]!) % 12;
  const found: number[][] = [];
  for (let midi = lowMidi; midi <= highMidi; midi += 1) {
    if (((midi % 12) + 12) % 12 !== bassPc) {
      continue;
    }
    const voiced = stacked.map((step) => midi + (step - stacked[0]!));
    if (voiced.every((note) => note >= lowMidi && note <= highMidi)) {
      found.push(voiced);
    }
  }
  return found;
}

function pickVoicing(template: ChordTemplate, inversion: number, octaves: number[]): number[] {
  const preferred = voiceCandidates(template, inversion, octaves);
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)]!;
  }
  const rootPosition = voiceCandidates(template, 0, octaves);
  if (rootPosition.length > 0) {
    return rootPosition[Math.floor(Math.random() * rootPosition.length)]!;
  }
  const filled = filledOctaves(octaves);
  const rootMidi = 12 * (filled[0]! + 1) + template.rootPc;
  return template.intervals.map((step) => rootMidi + step);
}

export type VoicedChord = {
  rootPc: number;
  size: ChordSize;
  inversion: number;
  intervals: number[];
  midi: number[];
  hz: number[];
};

export function chordKey(chord: Pick<VoicedChord, 'rootPc' | 'size' | 'inversion'>): string {
  return `${chord.rootPc}:${chord.size}:${chord.inversion}`;
}

export function pickCMajorChord(options: {
  size: ChordSize;
  inversion: number;
  octaves: number[];
  exceptKey?: string;
}): VoicedChord {
  const pool = uniquePool([C_IONIAN], options.size);
  const inversion = Math.max(0, Math.min(options.size - 1, Math.round(options.inversion)));
  let choices = pool;
  if (options.exceptKey) {
    const filtered = pool.filter((item) => chordKey({
      rootPc: item.rootPc,
      size: options.size,
      inversion,
    }) !== options.exceptKey);
    if (filtered.length > 0) {
      choices = filtered;
    }
  }
  const template = choices[Math.floor(Math.random() * choices.length)]!;
  const midi = pickVoicing(template, inversion, options.octaves);
  return {
    rootPc: template.rootPc,
    size: options.size,
    inversion,
    intervals: template.intervals,
    midi,
    hz: midi.map(midiToHz),
  };
}

function templateKey(template: ChordTemplate): string {
  return `${template.rootPc}:${template.intervals.join(',')}`;
}

function pickTemplate(
  pool: ChordTemplate[],
  previousRoot: number | null,
  requireOutside?: Set<string>,
): ChordTemplate {
  let choices = previousRoot == null ? pool : pool.filter((item) => item.rootPc !== previousRoot);
  if (requireOutside && requireOutside.size > 0) {
    const outside = choices.filter((item) => requireOutside.has(templateKey(item)));
    if (outside.length > 0) {
      choices = outside;
    }
  }
  if (choices.length === 0) {
    choices = pool;
  }
  return choices[Math.floor(Math.random() * choices.length)]!;
}

const CADENCE_ROOTS: number[][] = [
  [7, 0],
  [5, 0],
  [0, 7],
  [5, 7],
  [2, 7],
  [7, 9],
  [2, 7, 0],
];

const ONE_FOUR_FIVE_ROOTS = [0, 5, 7];

function templateForRoot(pool: ChordTemplate[], rootPc: number): ChordTemplate {
  return pool.find((item) => item.rootPc === rootPc) ?? pool[0]!;
}

function voiceRootSequence(
  roots: number[],
  size: ChordSize,
  inversions: boolean,
  toneOctaves: number[],
): ProgressionChord[] {
  const pool = uniquePool([C_IONIAN], size);
  const canInvert = inversions && filledOctaves(toneOctaves).length >= 2;
  const maxInv = size === 3 ? 2 : 3;
  return roots.map((rootPc) => {
    const template = templateForRoot(pool, rootPc);
    const inversion = canInvert ? Math.floor(Math.random() * (maxInv + 1)) : 0;
    const midi = pickVoicing(template, inversion, toneOctaves);
    return {
      rootPc: template.rootPc,
      midi,
      hz: midi.map(midiToHz),
    };
  });
}

export function pickProgression(options: {
  length: number;
  palette: ProgressionPalette;
  size: ChordSize;
  inversions: boolean;
  toneOctaves: number[];
  naming: NamingSystem;
  pattern?: ProgressionPattern;
}): ProgressionRound {
  const pattern = options.pattern ?? 'free';
  if (pattern === 'cadence') {
    const roots = CADENCE_ROOTS[Math.floor(Math.random() * CADENCE_ROOTS.length)]!;
    return {
      chords: voiceRootSequence(
        roots,
        options.size,
        options.inversions,
        options.toneOctaves,
      ),
      palette: 'major',
      size: options.size,
    };
  }
  if (pattern === 'oneFourFive') {
    return {
      chords: voiceRootSequence(
        ONE_FOUR_FIVE_ROOTS,
        options.size,
        options.inversions,
        options.toneOctaves,
      ),
      palette: 'major',
      size: options.size,
    };
  }
  const length = Math.max(2, Math.min(8, Math.round(options.length)));
  const palette =
    length <= 2 && options.palette === 'major' ? 'random' : options.palette;
  const pool = chordPool(palette, options.size, options.naming);
  const ionian = new Set(uniquePool([C_IONIAN], options.size).map(templateKey));
  const outside = new Set(
    pool.filter((item) => !ionian.has(templateKey(item))).map(templateKey),
  );
  const forceOutsideAt =
    length === 2 && palette !== 'major' && outside.size > 0
      ? Math.floor(Math.random() * length)
      : -1;
  const canInvert = options.inversions && filledOctaves(options.toneOctaves).length >= 2;
  const maxInv = options.size === 3 ? 2 : 3;
  const chords: ProgressionChord[] = [];
  let previousRoot: number | null = null;
  for (let i = 0; i < length; i += 1) {
    const template = pickTemplate(
      pool,
      previousRoot,
      i === forceOutsideAt ? outside : undefined,
    );
    const inversion = canInvert ? Math.floor(Math.random() * (maxInv + 1)) : 0;
    const midi = pickVoicing(template, inversion, options.toneOctaves);
    chords.push({
      rootPc: template.rootPc,
      midi,
      hz: midi.map(midiToHz),
    });
    previousRoot = template.rootPc;
  }
  return {
    chords,
    palette,
    size: options.size,
  };
}

export function scoreProgression(guess: (number | null)[], round: ProgressionRound) {
  const total = round.chords.length;
  let correct = 0;
  for (let i = 0; i < total; i += 1) {
    if (guess[i] === round.chords[i]!.rootPc) {
      correct += 1;
    }
  }
  return { correct, total, all: correct === total };
}
