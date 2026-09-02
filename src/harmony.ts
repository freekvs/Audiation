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

export type HarmonyQuality = 'major' | 'minor' | 'dim' | 'aug';
export type HarmonyFind = 'third' | 'fifth';
export type HarmonyInversion = 0 | 1 | 2;

export const QUALITY_OPTIONS: { id: HarmonyQuality }[] = [
  { id: 'major' },
  { id: 'minor' },
  { id: 'dim' },
  { id: 'aug' },
];

export type HarmonyRound = {
  quality: HarmonyQuality;
  find: HarmonyFind;
  inversion: HarmonyInversion;
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

function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

function thirdSteps(quality: HarmonyQuality): number {
  return quality === 'minor' || quality === 'dim' ? 3 : 4;
}

function fifthSteps(quality: HarmonyQuality): number {
  return quality === 'dim' ? 6 : quality === 'aug' ? 8 : 7;
}

function closeVoicing(
  rootMidi: number,
  quality: HarmonyQuality,
  inversion: HarmonyInversion,
): number[] {
  const root = rootMidi;
  const third = rootMidi + thirdSteps(quality);
  const fifth = rootMidi + fifthSteps(quality);
  if (inversion === 1) {
    return [third, fifth, root + 12];
  }
  if (inversion === 2) {
    return [fifth, root + 12, third + 12];
  }
  return [root, third, fifth];
}

export function intervalHintFor(quality: HarmonyQuality, find: HarmonyFind, t: Strings): string {
  if (find === 'third') {
    return quality === 'minor' || quality === 'dim' ? t.harmony.minorThird : t.harmony.majorThird;
  }
  if (quality === 'dim') {
    return t.harmony.dimFifth;
  }
  if (quality === 'aug') {
    return t.harmony.augFifth;
  }
  return t.harmony.perfectFifth;
}

export function inversionLabelFor(inversion: HarmonyInversion, t: Strings): string {
  if (inversion === 1) {
    return t.harmony.inv1;
  }
  if (inversion === 2) {
    return t.harmony.inv2;
  }
  return t.harmony.root;
}

export function qualityLabelFor(quality: HarmonyQuality, t: Strings): string {
  return t.harmony[quality];
}

export function taskLabelFor(quality: HarmonyQuality, inversion: HarmonyInversion, t: Strings): string {
  return `${qualityLabelFor(quality, t)} · ${inversionLabelFor(inversion, t)}`;
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

export function pickHarmonyRound(options: {
  qualities: HarmonyQuality[];
  finds: HarmonyFind[];
  givenCount: 1 | 2;
  inversions: boolean;
  toneOctaves: number[];
  sliderOctaves: number[];
}): HarmonyRound | null {
  const span = sliderSpanFor(options.sliderOctaves);
  const tones = tonesInsideSlider(options.toneOctaves, options.sliderOctaves);
  const qualities = options.qualities.length > 0 ? options.qualities : (['major'] as HarmonyQuality[]);
  const finds = options.finds.length > 0 ? options.finds : (['third'] as HarmonyFind[]);
  const inversionPool: HarmonyInversion[] =
    options.inversions && filledOctaves(options.sliderOctaves).length >= 2 ? [0, 1, 2] : [0];

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const quality = qualities[Math.floor(Math.random() * qualities.length)]!;
    const find = finds[Math.floor(Math.random() * finds.length)]!;
    const inversion = inversionPool[Math.floor(Math.random() * inversionPool.length)]!;
    const rootMidi = pickRootMidi(tones);
    const voicing = closeVoicing(rootMidi, quality, inversion);
    const wantedPc =
      find === 'third'
        ? pitchClass(rootMidi + thirdSteps(quality))
        : pitchClass(rootMidi + fifthSteps(quality));
    const targetMidi = voicing.find((midi) => pitchClass(midi) === wantedPc);
    if (targetMidi == null) {
      continue;
    }
    const others = voicing.filter((midi) => pitchClass(midi) !== wantedPc);
    const givenMidi = options.givenCount === 1 ? [voicing[0]!] : others;
    const givenHz = givenMidi.map(midiToHz);
    const targetHz = midiToHz(targetMidi);
    if (targetHz < span.lowHz * 0.995 || targetHz > span.highHz * 1.005) {
      continue;
    }
    const targetCents = centsFromHz(span.lowHz, targetHz);
    return {
      quality,
      find,
      inversion,
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
  return null;
}

export function harmonyNoteLabel(hz: number): string {
  return hzToNoteLabel(hz);
}

export function givenSummary(round: HarmonyRound, t: Strings): string {
  const notes =
    round.givenHz.length === 1
      ? harmonyNoteLabel(round.givenHz[0]!)
      : round.givenHz.map(harmonyNoteLabel).join(' + ');
  return fmt(t.harmony.givenLine, { notes });
}

export { hzFromCents };
