import type { KlankId } from './klank';
import { encodeVoicedWav } from './encodeVoice';

const SAMPLE_RATE = 48000;
const DURATION = 1.15;
const ATTACK_S = 0.02;
const RELEASE_S = 0.14;
const AMPLITUDE = 0.22;
const DECAY = 2.4;

export function encodeDualToneWav(aHz: number, bHz: number, klank: KlankId = 'sec'): Uint8Array {
  if (klank !== 'sec') {
    return encodeVoicedWav([aHz, bHz], klank, 'chord');
  }
  const count = Math.floor(SAMPLE_RATE * DURATION);
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

  const omegaA = 2 * Math.PI * aHz;
  const omegaB = 2 * Math.PI * bHz;
  const attackN = Math.max(1, Math.floor(SAMPLE_RATE * ATTACK_S));
  const releaseN = Math.max(1, Math.floor(SAMPLE_RATE * RELEASE_S));

  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack =
      i < attackN ? 0.5 - 0.5 * Math.cos((Math.PI * i) / attackN) : 1;
    const remain = count - 1 - i;
    const release =
      remain < releaseN ? 0.5 - 0.5 * Math.cos((Math.PI * remain) / releaseN) : 1;
    const decay = Math.exp(-t * DECAY);
    const envelope = attack * decay * release;
    const value =
      (Math.sin(omegaA * t) + Math.sin(omegaB * t)) * envelope * AMPLITUDE;
    const sample = Math.round(Math.max(-1, Math.min(1, value)) * 32767);
    view.setInt16(44 + i * 2, sample, true);
  }

  view.setInt16(44 + (count - 1) * 2, 0, true);
  return bytes;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    bytes[offset + i] = text.charCodeAt(i);
  }
}
