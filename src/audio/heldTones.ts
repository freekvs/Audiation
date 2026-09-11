import { getSoundingKlank } from './klank';
import { createReadyPlayer, playUri, safePause } from './nativePlay';
import { getSustainUri } from './toneUri';

type Slot = 'givenA' | 'givenB' | 'givenC' | 'givenD' | 'slide';

type HeldPlayer = {
  player: ReturnType<typeof createReadyPlayer> | null;
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
    state.player = createReadyPlayer(true, slot === 'slide' ? 1 : 0.5);
  }
  return state.player;
}

export function stopHeld(slot?: Slot) {
  const names: Slot[] = slot ? [slot] : ALL_SLOTS;
  for (const name of names) {
    slots[name].seq += 1;
    const player = slots[name].player;
    if (player) {
      player.loop = false;
    }
    safePause(player);
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
  state.lastUri = await playUri(player, uri, state.lastUri, () => seq === state.seq, { loop: true });
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
