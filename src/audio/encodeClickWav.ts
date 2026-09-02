const SAMPLE_RATE = 48000;
const DURATION = 0.14;
const AMPLITUDE = 0.78;

export function encodeClickWav(frequency: number): Uint8Array {
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

  const omega = 2 * Math.PI * frequency;
  const click = 2 * Math.PI * Math.max(frequency * 2, 1200);
  const attackN = Math.max(1, Math.floor(SAMPLE_RATE * 0.003));

  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = i < attackN ? i / attackN : 1;
    const decay = Math.exp(-t * 18);
    const value =
      (Math.sin(omega * t) + 0.55 * Math.sin(click * t)) * AMPLITUDE * attack * decay;
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
