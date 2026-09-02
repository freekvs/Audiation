import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type KlankId = 'sec' | 'combo' | 'band' | 'orchestra';
export type KlankChip = KlankId | 'random';

export const KLANK_CHIPS: KlankChip[] = ['sec', 'combo', 'band', 'orchestra', 'random'];

const VARIANTS: KlankId[] = ['combo', 'band', 'orchestra'];
const STORAGE_KEY = 'audiation.klank.v1';
const FILE_NAME = 'audiation-klank-v1.json';
const DEFAULT_CHIP: KlankChip = 'sec';

let chip: KlankChip = DEFAULT_CHIP;
let roundKlank: KlankId = 'sec';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function parseChip(raw: unknown): KlankChip {
  if (raw === 'sec' || raw === 'combo' || raw === 'band' || raw === 'orchestra' || raw === 'random') {
    return raw;
  }
  return DEFAULT_CHIP;
}

function readSync(): KlankChip | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CHIP;
    }
    const data = JSON.parse(raw) as { chip?: unknown };
    return parseChip(data.chip);
  } catch {
    return DEFAULT_CHIP;
  }
}

chip = readSync() ?? DEFAULT_CHIP;

async function persist(next: KlankChip): Promise<void> {
  const raw = JSON.stringify({ chip: next });
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, raw);
    } catch {
      // privé-modus
    }
    return;
  }
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) {
    file.create();
  }
  file.write(raw);
}

function pickRandom(): KlankId {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)]!;
}

function soundingFromChip(value: KlankChip): KlankId {
  if (value === 'random') {
    return pickRandom();
  }
  return value;
}

export function getKlankChip(): KlankChip {
  return chip;
}

export function isKlankSec(): boolean {
  return chip === 'sec';
}

export function beginSoundingRound(): KlankId {
  roundKlank = soundingFromChip(chip);
  return roundKlank;
}

export function getSoundingKlank(override?: KlankId): KlankId {
  if (override) {
    return override;
  }
  if (chip === 'random') {
    return roundKlank;
  }
  return chip;
}

export async function setKlankChip(next: KlankChip): Promise<void> {
  chip = next;
  roundKlank = next === 'random' ? roundKlank : soundingFromChip(next);
  emit();
  await persist(next);
}

export function resetKlankToSec() {
  void setKlankChip('sec');
}

export async function loadKlankPref(): Promise<KlankChip> {
  try {
    if (Platform.OS === 'web') {
      chip = readSync() ?? DEFAULT_CHIP;
      emit();
      return chip;
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, FILE_NAME);
    if (!file.exists) {
      return chip;
    }
    const data = JSON.parse((await file.text()).trim() || '{}') as { chip?: unknown };
    chip = parseChip(data.chip);
    emit();
    return chip;
  } catch {
    return chip;
  }
}

export function useKlank() {
  const [value, setValue] = useState<KlankChip>(chip);

  useEffect(() => {
    const onChange = () => setValue(chip);
    listeners.add(onChange);
    void loadKlankPref();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return {
    chip: value,
    isSec: value === 'sec',
    setChip: (next: KlankChip) => {
      void setKlankChip(next);
    },
  };
}
