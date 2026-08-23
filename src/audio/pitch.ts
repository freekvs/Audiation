export type PitchQuality = 'hit' | 'close' | 'miss' | 'silent' | 'unavailable';

export type ListenControls = {
  cancelled: boolean;
};

export type PitchListenResult = {
  hz: number | null;
  recordingUri: string | null;
};

export type PitchVerdict = {
  quality: PitchQuality;
  cents: number | null;
  sungHz: number | null;
};

const HIT_CENTS = 30;
const CLOSE_CENTS = 50;

export function exactCents(measuredHz: number, targetHz: number): number {
  return 1200 * Math.log2(measuredHz / targetHz);
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function hzToNoteLabel(hz: number): string {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const midi = Math.round(hzToMidi(hz));
  const name = names[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function pitchClassCents(sungHz: number, targetHz: number): number {
  const sung = hzToMidi(sungHz);
  const target = hzToMidi(targetHz);
  const raw = ((sung - target) % 12 + 12) % 12;
  const wrapped = raw > 6 ? raw - 12 : raw;
  return wrapped * 100;
}

export function matchSungPitch(sungHz: number | null, targetHz: number): PitchVerdict {
  if (sungHz == null || !Number.isFinite(sungHz) || sungHz < 28 || sungHz > 4200) {
    return { quality: 'silent', cents: null, sungHz };
  }

  const cents = pitchClassCents(sungHz, targetHz);
  const abs = Math.abs(cents);

  if (abs <= HIT_CENTS) {
    return { quality: 'hit', cents, sungHz };
  }
  if (abs <= CLOSE_CENTS) {
    return { quality: 'close', cents, sungHz };
  }
  return { quality: 'miss', cents, sungHz };
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export type PitchSearch = {
  minHz?: number;
  maxHz?: number;
};

export function searchBandForTarget(targetHz: number): PitchSearch {
  return {
    minHz: Math.max(28, targetHz / 2.05),
    maxHz: Math.min(8000, targetHz * 2.05),
  };
}

export function detectPitchHz(
  frame: Float32Array,
  sampleRate: number,
  search?: PitchSearch,
): number | null {
  let rms = 0;
  for (let i = 0; i < frame.length; i += 1) {
    rms += frame[i] * frame[i];
  }
  rms = Math.sqrt(rms / frame.length);
  if (rms < 0.004) {
    return null;
  }

  const minHz = search?.minHz ?? 80;
  const maxHz = search?.maxHz ?? 900;
  const minOffset = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxOffset = Math.min(
    Math.floor(sampleRate / minHz),
    Math.floor(frame.length / 2) - 1,
  );
  if (maxOffset <= minOffset) {
    return null;
  }

  let bestOffset = -1;
  let bestCorr = 0;
  let bestPrevCorr = 0;
  let bestNextCorr = 0;
  let lastCorr = 1;
  let found = false;

  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    const compareCount = frame.length - offset;
    let diff = 0;
    for (let i = 0; i < compareCount; i += 1) {
      diff += Math.abs(frame[i] - frame[i + offset]);
    }
    const corr = 1 - diff / compareCount;
    if (corr > 0.72 && corr > lastCorr) {
      found = true;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOffset = offset;
        bestPrevCorr = lastCorr;
        bestNextCorr = 0;
      }
    } else if (found) {
      if (offset === bestOffset + 1) {
        bestNextCorr = corr;
      }
      break;
    }
    lastCorr = corr;
  }

  if (bestOffset <= 0) {
    return null;
  }

  let lag = bestOffset;
  const denom = bestPrevCorr - 2 * bestCorr + bestNextCorr;
  if (bestNextCorr > 0 && Math.abs(denom) > 1e-9) {
    lag += (0.5 * (bestPrevCorr - bestNextCorr)) / denom;
  }

  return sampleRate / lag;
}

export function frameRms(frame: ArrayLike<number>): number {
  let rms = 0;
  for (let i = 0; i < frame.length; i += 1) {
    rms += frame[i] * frame[i];
  }
  return Math.sqrt(rms / frame.length);
}

function goertzelPower(samples: ArrayLike<number>, sampleRate: number, frequency: number): number {
  const n = samples.length;
  const k = Math.round((n * frequency) / sampleRate);
  const omega = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(omega);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i += 1) {
    s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const real = s1 - s2 * Math.cos(omega);
  const imag = s2 * Math.sin(omega);
  return real * real + imag * imag;
}

export function estimatePitchHz(
  samples: ArrayLike<number>,
  sampleRate: number,
  targetHz?: number,
): number | null {
  if (samples.length < 512) {
    return null;
  }
  if (frameRms(samples) < 0.004) {
    return null;
  }

  const centerMidi = targetHz != null ? hzToMidi(targetHz) : 60;
  const midiStart = targetHz != null ? Math.max(12, Math.round(centerMidi) - 14) : 36;
  const midiEnd = targetHz != null ? Math.min(108, Math.round(centerMidi) + 14) : 84;

  let bestHz = 0;
  let bestPower = 0;
  let secondPower = 0;
  for (let midi = midiStart; midi <= midiEnd; midi += 1) {
    const hz = 440 * Math.pow(2, (midi - 69) / 12);
    const power = goertzelPower(samples, sampleRate, hz);
    if (power > bestPower) {
      secondPower = bestPower;
      bestPower = power;
      bestHz = hz;
    } else if (power > secondPower) {
      secondPower = power;
    }
  }

  if (bestHz <= 0 || bestPower < secondPower * 1.15) {
    return detectPitchHz(
      samples instanceof Float32Array ? samples : Float32Array.from(samples as ArrayLike<number>),
      sampleRate,
      targetHz != null ? searchBandForTarget(targetHz) : undefined,
    );
  }
  return bestHz;
}
