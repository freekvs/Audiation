const SAMPLE_RATE = 48000;
const DURATION = 1.18;
const ATTACK_S = 0.018;
const RELEASE_S = 0.16;
const DECAY = 1.9;

export function encodeChordWav(notesHz: number[]): Uint8Array {
  const freqs = notesHz.filter((hz) => hz > 0 && Number.isFinite(hz));
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

  const omegas = freqs.map((hz) => 2 * Math.PI * hz);
  const amplitude = omegas.length === 0 ? 0 : 0.42 / omegas.length;
  const attackN = Math.max(1, Math.floor(SAMPLE_RATE * ATTACK_S));
  const releaseN = Math.max(1, Math.floor(SAMPLE_RATE * RELEASE_S));

  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = i < attackN ? 0.5 - 0.5 * Math.cos((Math.PI * i) / attackN) : 1;
    const remain = count - 1 - i;
    const release =
      remain < releaseN ? 0.5 - 0.5 * Math.cos((Math.PI * remain) / releaseN) : 1;
    const decay = Math.exp(-t * DECAY);
    const envelope = attack * decay * release;
    let mix = 0;
    for (const omega of omegas) {
      mix += Math.sin(omega * t);
    }
    const sample = Math.round(Math.max(-1, Math.min(1, mix * envelope * amplitude)) * 32767);
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
