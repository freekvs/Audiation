import type { KlankId } from './klank';
import { encodeVoicedWav } from './encodeVoice';

const SAMPLE_RATE = 48000;
const AMPLITUDE = 0.3;

export function encodeSustainWav(frequency: number, klank: KlankId = 'sec'): Uint8Array {
  if (klank !== 'sec') {
    return encodeVoicedWav([frequency], klank, 'sustain');
  }
  const cycles = Math.max(8, Math.round(frequency * 0.28));
  const count = Math.max(64, Math.round((cycles * SAMPLE_RATE) / frequency));
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
    const value = Math.sin((2 * Math.PI * cycles * i) / count) * AMPLITUDE;
    const sample = Math.round(Math.max(-1, Math.min(1, value)) * 32767);
    view.setInt16(44 + i * 2, sample, true);
  }

  return bytes;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    bytes[offset + i] = text.charCodeAt(i);
  }
}
