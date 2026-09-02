import { exactCents, hzToNoteLabel } from './audio/pitch';
import {
  EXERCISE_OCTAVES,
  type ExerciseNote,
} from './exerciseNotes';
import { intervalNameFromCents, pitchDirection, type IntervalCopy } from './i18n';

const MIN_OFFSET_CENTS = 300;
const MAX_OFFSET_CENTS = 900;
const MIN_CLEAR_CENTS = 200;

export type FindNoteRound = {
  target: ExerciseNote;
  lowHz: number;
  highHz: number;
  targetCents: number;
  startCents: number;
  spanCents: number;
  lowLabel: string;
  highLabel: string;
};

export type SliderSpan = {
  lowHz: number;
  highHz: number;
  spanCents: number;
  lowLabel: string;
  highLabel: string;
};

export function hzFromCents(lowHz: number, cents: number): number {
  return lowHz * Math.pow(2, cents / 1200);
}

export function centsFromHz(lowHz: number, hz: number): number {
  return 1200 * Math.log2(hz / lowHz);
}

export function quantizeSliderCents(cents: number, spanCents: number): number {
  const stepped = Math.round(cents / 5) * 5;
  return Math.max(0, Math.min(spanCents, stepped));
}

export function filledOctaves(octaves: number[]): number[] {
  if (octaves.length === 0) {
    return [4];
  }
  const min = Math.min(...octaves);
  const max = Math.max(...octaves);
  const filled: number[] = [];
  for (let octave = min; octave <= max; octave += 1) {
    filled.push(octave);
  }
  return filled;
}

export function sliderSpanFor(octaves: number[]): SliderSpan {
  const filled = filledOctaves(octaves);
  const min = filled[0]!;
  const max = filled[filled.length - 1]!;
  const lowPack = EXERCISE_OCTAVES.find((item) => item.octave === min) ?? EXERCISE_OCTAVES[3]!;
  const lowHz = lowPack.notes[0]!.hz;
  const highHz = lowHz * Math.pow(2, filled.length);
  return {
    lowHz,
    highHz,
    spanCents: 1200 * filled.length,
    lowLabel: `C${min}`,
    highLabel: `C${max + 1}`,
  };
}

export function toggleToneOctave(selected: number[], octave: number): number[] {
  if (selected.includes(octave)) {
    if (selected.length <= 1) {
      return selected;
    }
    return selected.filter((item) => item !== octave).sort((a, b) => a - b);
  }
  return [...selected, octave].sort((a, b) => a - b);
}

export function toggleSliderOctave(selected: number[], octave: number): number[] {
  const filled = filledOctaves(selected);
  const min = filled[0]!;
  const max = filled[filled.length - 1]!;
  if (octave < min || octave > max) {
    return filledOctaves([Math.min(min, octave), Math.max(max, octave)]);
  }
  if (min === max) {
    return filled;
  }
  if (octave === min) {
    return filledOctaves([min + 1, max]);
  }
  if (octave === max) {
    return filledOctaves([min, max - 1]);
  }
  return filled;
}

export function tonesInsideSlider(toneOctaves: number[], sliderOctaves: number[]): number[] {
  const slider = filledOctaves(sliderOctaves);
  const min = slider[0]!;
  const max = slider[slider.length - 1]!;
  const inside = toneOctaves.filter((octave) => octave >= min && octave <= max);
  return inside.length > 0 ? inside : [min];
}

function targetPool(toneOctaves: number[], exceptId?: string): ExerciseNote[] {
  const notes: ExerciseNote[] = [];
  for (const octave of toneOctaves) {
    const pack = EXERCISE_OCTAVES.find((item) => item.octave === octave);
    if (!pack) {
      continue;
    }
    notes.push(...pack.notes.slice(0, 7));
  }
  const unique = notes.filter(
    (note, index) => notes.findIndex((item) => item.id === note.id) === index,
  );
  const pool = exceptId ? unique.filter((item) => item.id !== exceptId) : unique;
  return pool.length > 0 ? pool : unique;
}

function pickStartCents(targetCents: number, spanCents: number): number {
  const below = targetCents - (MIN_OFFSET_CENTS + Math.random() * (MAX_OFFSET_CENTS - MIN_OFFSET_CENTS));
  const above = targetCents + (MIN_OFFSET_CENTS + Math.random() * (MAX_OFFSET_CENTS - MIN_OFFSET_CENTS));
  const options = [below, above].filter((cents) => cents >= 0 && cents <= spanCents);
  if (options.length > 0) {
    return quantizeSliderCents(options[Math.floor(Math.random() * options.length)]!, spanCents);
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const cents = Math.random() * spanCents;
    if (Math.abs(cents - targetCents) >= MIN_CLEAR_CENTS) {
      return quantizeSliderCents(cents, spanCents);
    }
  }
  return quantizeSliderCents(Math.max(0, Math.min(spanCents, targetCents + MIN_OFFSET_CENTS)), spanCents);
}

export function pickFindNoteRound(
  toneOctaves: number[],
  sliderOctaves: number[],
  exceptId?: string,
): FindNoteRound {
  const span = sliderSpanFor(sliderOctaves);
  const tones = tonesInsideSlider(toneOctaves, sliderOctaves);
  const pool = targetPool(tones, exceptId);
  const target = pool[Math.floor(Math.random() * pool.length)]!;
  const targetCents = centsFromHz(span.lowHz, target.hz);
  return {
    target,
    lowHz: span.lowHz,
    highHz: span.highHz,
    targetCents,
    startCents: pickStartCents(targetCents, span.spanCents),
    spanCents: span.spanCents,
    lowLabel: span.lowLabel,
    highLabel: span.highLabel,
  };
}

export function describeFindNoteMiss(
  chosenHz: number,
  targetHz: number,
  copy: IntervalCopy,
): {
  cents: number;
  direction: 'higher' | 'lower' | 'on';
  interval: string;
  chosenLabel: string;
  quality: 'hit' | 'close' | 'miss';
} {
  const cents = exactCents(chosenHz, targetHz);
  const abs = Math.abs(cents);
  const quality = abs <= 25 ? 'hit' : abs <= 50 ? 'close' : 'miss';
  return {
    cents,
    direction: pitchDirection(cents),
    interval: intervalNameFromCents(cents, copy),
    chosenLabel: hzToNoteLabel(chosenHz),
    quality,
  };
}

export function octaveLabelList(octaves: number[]): string {
  return [...octaves]
    .sort((a, b) => a - b)
    .map((octave) => {
      const pack = EXERCISE_OCTAVES.find((item) => item.octave === octave);
      return pack?.label ?? `C${octave}`;
    })
    .join(', ');
}
