import type { KlankId } from './klank';

export const SAMPLE_RATE = 48000;

type Recipe = {
  attackS: number;
  releaseS: number;
  decay: number;
  duration: number;
  amplitude: number;
  cents: number[];
  partials: { ratio: number; gain: number }[];
  noiseS: number;
  noiseGain: number;
  fadeS: number;
};

const RECIPES: Record<Exclude<KlankId, 'sec'>, Recipe> = {
  combo: {
    attackS: 0.014,
    releaseS: 0.11,
    decay: 2.5,
    duration: 1.05,
    amplitude: 0.32,
    cents: [0, 3.5],
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.16 },
      { ratio: 3, gain: 0.07 },
    ],
    noiseS: 0,
    noiseGain: 0,
    fadeS: 0.04,
  },
  band: {
    attackS: 0.006,
    releaseS: 0.09,
    decay: 3.1,
    duration: 1.05,
    amplitude: 0.3,
    cents: [0],
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.42 },
      { ratio: 3, gain: 0.2 },
      { ratio: 4, gain: 0.09 },
    ],
    noiseS: 0.008,
    noiseGain: 0.1,
    fadeS: 0.03,
  },
  orchestra: {
    attackS: 0.048,
    releaseS: 0.24,
    decay: 1.35,
    duration: 1.22,
    amplitude: 0.26,
    cents: [-7, 0, 6],
    partials: [
      { ratio: 0.5, gain: 0.08 },
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.2 },
      { ratio: 3, gain: 0.1 },
      { ratio: 4, gain: 0.05 },
    ],
    noiseS: 0,
    noiseGain: 0,
    fadeS: 0.06,
  },
};

function renderVoice(t: number, hz: number, recipe: Recipe): number {
  let sum = 0;
  let weight = 0;
  for (const cent of recipe.cents) {
    const base = hz * Math.pow(2, cent / 1200);
    for (const partial of recipe.partials) {
      sum += partial.gain * Math.sin(2 * Math.PI * base * partial.ratio * t);
      weight += partial.gain;
    }
  }
  return weight > 0 ? sum / weight : 0;
}

function noise(t: number): number {
  return Math.sin(t * 7919.13) * Math.sin(t * 4591.7 + 0.7);
}

function envelope(i: number, count: number, recipe: Recipe): number {
  const attackN = Math.max(1, Math.floor(SAMPLE_RATE * recipe.attackS));
  const releaseN = Math.max(1, Math.floor(SAMPLE_RATE * recipe.releaseS));
  const t = i / SAMPLE_RATE;
  const attack = i < attackN ? 0.5 - 0.5 * Math.cos((Math.PI * i) / attackN) : 1;
  const remain = count - 1 - i;
  const release = remain < releaseN ? 0.5 - 0.5 * Math.cos((Math.PI * remain) / releaseN) : 1;
  return attack * Math.exp(-t * recipe.decay) * release;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    bytes[offset + i] = text.charCodeAt(i);
  }
}

export function writePcmWav(samples: Float32Array): Uint8Array {
  const dataSize = samples.length * 2;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(bytes, 8, 'WAVE');
  writeAscii(bytes, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, 'data');
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767);
    view.setInt16(44 + i * 2, sample, true);
  }
  return bytes;
}

function encodeSustainVoiced(hz: number, recipe: Recipe): Uint8Array {
  const count = Math.floor(SAMPLE_RATE * 0.62);
  const fadeN = Math.max(1, Math.floor(SAMPLE_RATE * recipe.fadeS));
  const samples = new Float32Array(count);
  const amp = recipe.amplitude * 0.85;
  for (let i = 0; i < count; i += 1) {
    samples[i] = renderVoice(i / SAMPLE_RATE, hz, recipe) * amp;
  }
  for (let i = 0; i < fadeN; i += 1) {
    const mix = i / fadeN;
    const tail = count - fadeN + i;
    samples[tail] = samples[tail]! * (1 - mix) + samples[i]! * mix;
  }
  return writePcmWav(samples);
}

export function encodeVoicedWav(
  freqs: number[],
  klank: Exclude<KlankId, 'sec'>,
  kind: 'tone' | 'sustain' | 'chord',
): Uint8Array {
  const recipe = RECIPES[klank];
  const clean = freqs.filter((hz) => hz > 0 && Number.isFinite(hz));
  if (kind === 'sustain') {
    return encodeSustainVoiced(clean[0] ?? 440, recipe);
  }
  const duration = kind === 'chord' ? Math.max(recipe.duration, 1.18) : recipe.duration;
  const count = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(count);
  const amp = clean.length === 0 ? 0 : recipe.amplitude / Math.sqrt(clean.length);
  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = envelope(i, count, recipe);
    let mix = 0;
    for (const hz of clean) {
      mix += renderVoice(t, hz, recipe);
    }
    if (recipe.noiseS > 0 && t < recipe.noiseS) {
      mix += noise(t) * recipe.noiseGain * (1 - t / recipe.noiseS) * Math.max(1, clean.length);
    }
    samples[i] = mix * env * amp;
  }
  samples[count - 1] = 0;
  return writePcmWav(samples);
}
