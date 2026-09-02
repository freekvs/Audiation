import { hzToNoteLabel } from './audio/pitch';
import {
  centsFromHz,
  filledOctaves,
  hzFromCents,
  quantizeSliderCents,
  sliderSpanFor,
  tonesInsideSlider,
} from './findNote';
import { fmt, type Strings } from './i18n';

export type ExtensionQuality = 'major' | 'minor' | 'dominant';
export type ExtensionFind = 'ninth' | 'eleventh' | 'thirteenth';
export type ExtensionGiven = 'triad' | 'seventh' | 'shell';

export const QUALITY_OPTIONS: { id: ExtensionQuality }[] = [
  { id: 'major' },
  { id: 'minor' },
  { id: 'dominant' },
];

export const FIND_OPTIONS: { id: ExtensionFind; numeral: '9' | '11' | '13' }[] = [
  { id: 'ninth', numeral: '9' },
  { id: 'eleventh', numeral: '11' },
  { id: 'thirteenth', numeral: '13' },
];

export const GIVEN_OPTIONS: { id: ExtensionGiven }[] = [
  { id: 'triad' },
  { id: 'seventh' },
  { id: 'shell' },
];

export type ExtensionRound = {
  quality: ExtensionQuality;
  find: ExtensionFind;
  given: ExtensionGiven;
  givenHz: number[];
  targetHz: number;
  targetCents: number;
  startCents: number;
  lowHz: number;
  spanCents: number;
  lowLabel: string;
  highLabel: string;
};

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

function thirdSteps(quality: ExtensionQuality): number {
  return quality === 'minor' ? 3 : 4;
}

function seventhSteps(quality: ExtensionQuality): number {
  return quality === 'major' ? 11 : 10;
}

function extensionSteps(find: ExtensionFind): number {
  if (find === 'ninth') {
    return 14;
  }
  if (find === 'eleventh') {
    return 17;
  }
  return 21;
}

export function findNumeral(find: ExtensionFind): '9' | '11' | '13' {
  if (find === 'ninth') {
    return '9';
  }
  if (find === 'eleventh') {
    return '11';
  }
  return '13';
}

function givenVoicing(
  rootMidi: number,
  quality: ExtensionQuality,
  given: ExtensionGiven,
): number[] {
  const third = rootMidi + thirdSteps(quality);
  const fifth = rootMidi + 7;
  const seventh = rootMidi + seventhSteps(quality);
  if (given === 'shell') {
    return [third, seventh];
  }
  if (given === 'triad') {
    return [rootMidi, third, fifth];
  }
  return [rootMidi, third, fifth, seventh];
}

export function qualitiesForGiven(
  qualities: ExtensionQuality[],
  given: ExtensionGiven,
): ExtensionQuality[] {
  const allowed =
    given === 'triad' ? qualities.filter((item) => item !== 'dominant') : qualities;
  return allowed.length > 0 ? allowed : (['major'] as ExtensionQuality[]);
}

export function intervalHintFor(find: ExtensionFind, t: Strings): string {
  return t.extension[find];
}

export function qualityLabelFor(quality: ExtensionQuality, t: Strings): string {
  return t.extension[quality];
}

export function givenLabelFor(given: ExtensionGiven, t: Strings): string {
  return t.extension[given];
}

export function taskLabelFor(
  quality: ExtensionQuality,
  given: ExtensionGiven,
  t: Strings,
): string {
  return `${qualityLabelFor(quality, t)} · ${givenLabelFor(given, t)}`;
}

function pickRootMidi(toneOctaves: number[]): number {
  const octaves = toneOctaves.length > 0 ? toneOctaves : [4];
  const octave = octaves[Math.floor(Math.random() * octaves.length)]!;
  return 12 * (octave + 1) + Math.floor(Math.random() * 12);
}

function startCentsFor(targetCents: number, spanCents: number): number {
  const options = [
    targetCents - (300 + Math.random() * 600),
    targetCents + (300 + Math.random() * 600),
  ].filter((cents) => cents >= 0 && cents <= spanCents);
  if (options.length > 0) {
    return quantizeSliderCents(options[Math.floor(Math.random() * options.length)]!, spanCents);
  }
  return quantizeSliderCents(Math.max(0, Math.min(spanCents, targetCents + 400)), spanCents);
}

function placeExtension(
  rootMidi: number,
  givenMidi: number[],
  find: ExtensionFind,
  lowMidi: number,
  highMidi: number,
): number | null {
  const minAbove = Math.max(...givenMidi) + 1;
  const steps = extensionSteps(find);
  for (let k = 0; k < 4; k += 1) {
    const midi = rootMidi + steps + 12 * k;
    if (midi >= minAbove && midi >= lowMidi - 0.05 && midi <= highMidi + 0.05) {
      return midi;
    }
  }
  return null;
}

export function pickExtensionRound(options: {
  qualities: ExtensionQuality[];
  finds: ExtensionFind[];
  given: ExtensionGiven;
  toneOctaves: number[];
  sliderOctaves: number[];
}): ExtensionRound | null {
  const span = sliderSpanFor(options.sliderOctaves);
  const tones = tonesInsideSlider(options.toneOctaves, options.sliderOctaves);
  const given = options.given;
  const qualities = qualitiesForGiven(options.qualities, given);
  let finds = options.finds.length > 0 ? options.finds : (['ninth'] as ExtensionFind[]);
  if (filledOctaves(options.sliderOctaves).length < 2) {
    const without13 = finds.filter((item) => item !== 'thirteenth');
    if (without13.length > 0) {
      finds = without13;
    }
  }
  const lowMidi = hzToMidi(span.lowHz);
  const highMidi = hzToMidi(span.highHz);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const quality = qualities[Math.floor(Math.random() * qualities.length)]!;
    const find = finds[Math.floor(Math.random() * finds.length)]!;
    const rootMidi = pickRootMidi(tones);
    for (let drop = 0; drop < 3; drop += 1) {
      const root = rootMidi - 12 * drop;
      if (root < 24) {
        continue;
      }
      const givenMidi = givenVoicing(root, quality, given);
      const targetMidi = placeExtension(root, givenMidi, find, lowMidi, highMidi);
      if (targetMidi == null) {
        continue;
      }
      const givenHz = givenMidi.map(midiToHz);
      const targetHz = midiToHz(targetMidi);
      if (targetHz < span.lowHz * 0.995 || targetHz > span.highHz * 1.005) {
        continue;
      }
      const targetCents = centsFromHz(span.lowHz, targetHz);
      return {
        quality,
        find,
        given,
        givenHz,
        targetHz,
        targetCents,
        startCents: startCentsFor(targetCents, span.spanCents),
        lowHz: span.lowHz,
        spanCents: span.spanCents,
        lowLabel: span.lowLabel,
        highLabel: span.highLabel,
      };
    }
  }
  return null;
}

export function extensionNoteLabel(hz: number): string {
  return hzToNoteLabel(hz);
}

export function givenSummary(round: ExtensionRound, t: Strings): string {
  const notes = round.givenHz.map(extensionNoteLabel).join(' + ');
  return fmt(t.extension.givenLine, { notes });
}

export { hzFromCents };
