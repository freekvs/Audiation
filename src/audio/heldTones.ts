import { createAudioPlayer } from 'expo-audio';

import { getSoundingKlank } from './klank';
import { getSustainUri } from './toneUri';

type Slot = 'givenA' | 'givenB' | 'givenC' | 'givenD' | 'slide';

type HeldPlayer = {
  player: ReturnType<typeof createAudioPlayer> | null;
  lastUri: string | null;
  seq: number;
};

const GIVEN_SLOTS: Slot[] = ['givenA', 'givenB', 'givenC', 'givenD'];
const ALL_SLOTS: Slot[] = [...GIVEN_SLOTS, 'slide'];

const slots: Record<Slot, HeldPlayer> = {
  givenA: { player: null, lastUri: null, seq: 0 },
  givenB: { player: null, lastUri: null, seq: 0 },
  givenC: { player: null, lastUri: null, seq: 0 },
  givenD: { player: null, lastUri: null, seq: 0 },
  slide: { player: null, lastUri: null, seq: 0 },
};

function getPlayer(slot: Slot) {
  const state = slots[slot];
  if (!state.player) {
    state.player = createAudioPlayer(null);
    state.player.loop = true;
    state.player.volume = slot === 'slide' ? 1 : 0.5;
  }
  return state.player;
}

function safePause(slot: Slot) {
  const player = slots[slot].player;
  if (!player) {
    return;
  }
  try {
    player.loop = false;
    void Promise.resolve(player.pause()).catch(() => undefined);
  } catch {
    // native speler al vrijgegeven
  }
}

export function stopHeld(slot?: Slot) {
  const names: Slot[] = slot ? [slot] : ALL_SLOTS;
  for (const name of names) {
    slots[name].seq += 1;
    safePause(name);
  }
}

export async function playHeld(slot: Slot, hz: number): Promise<void> {
  const state = slots[slot];
  const seq = (state.seq += 1);
  const uri = await getSustainUri(hz, getSoundingKlank());
  if (seq !== state.seq) {
    return;
  }

  const player = getPlayer(slot);
  player.loop = true;
  safePause(slot);

  if (state.lastUri !== uri) {
    player.replace({ uri });
    state.lastUri = uri;
    safePause(slot);
  }

  await player.seekTo(0);
  if (seq !== state.seq) {
    return;
  }
  player.loop = true;
  player.play();
}

export async function playGiven(notesHz: number[]): Promise<void> {
  for (const name of GIVEN_SLOTS) {
    stopHeld(name);
  }
  for (let i = 0; i < GIVEN_SLOTS.length; i += 1) {
    const hz = notesHz[i];
    if (hz != null) {
      await playHeld(GIVEN_SLOTS[i]!, hz);
    }
  }
}
