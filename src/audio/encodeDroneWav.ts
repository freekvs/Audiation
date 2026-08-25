const SAMPLE_RATE = 48000;
const DURATION = 6;
const FADE_S = 0.05;

type Chord = {
  tonicHz: number;
  fifthHz: number;
  lowHz: number;
};

function voice(t: number, hz: number, gain: number): number {
  const sharp = hz * Math.pow(2, 4 / 1200);
  const flat = hz * Math.pow(2, -4 / 1200);
  return (
    gain *
    (0.58 * Math.sin(2 * Math.PI * hz * t) +
      0.2 * Math.sin(2 * Math.PI * sharp * t) +
      0.16 * Math.sin(2 * Math.PI * flat * t) +
      0.12 * Math.sin(2 * Math.PI * hz * 2 * t) +
      0.05 * Math.sin(2 * Math.PI * hz * 3 * t))
  );
}

export function encodeDroneWav({ tonicHz, fifthHz, lowHz }: Chord): Uint8Array {
  const count = Math.floor(SAMPLE_RATE * DURATION);
  const fadeN = Math.max(1, Math.floor(SAMPLE_RATE * FADE_S));
  const samples = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] =
      voice(t, lowHz, 0.34) + voice(t, tonicHz, 0.26) + voice(t, fifthHz, 0.22);
  }

  for (let i = 0; i < fadeN; i += 1) {
    const mix = i / fadeN;
    const tail = count - fadeN + i;
    samples[tail] = samples[tail]! * (1 - mix) + samples[i]! * mix;
  }

  let peak = 0;
  for (let i = 0; i < count; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]!));
  }
  const scale = peak > 0.92 ? 0.92 / peak : 1;

  const dataSize = count * 2;
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

  for (let i = 0; i < count; i += 1) {
    const sample = Math.round(Math.max(-1, Math.min(1, samples[i]! * scale)) * 32767);
    view.setInt16(44 + i * 2, sample, true);
  }

  return bytes;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    bytes[offset + i] = text.charCodeAt(i);
  }
}
