import { createContext, useContext } from 'react';
import { Platform } from 'react-native';

export type NamingSystem = 'solfege' | 'nashville';

export const NAMING_OPTIONS: { id: NamingSystem; label: string; hint: string }[] = [
  { id: 'solfege', label: 'Do–Si', hint: 'Solfège' },
  { id: 'nashville', label: '1–7', hint: 'Nashville' },
];

type NamedTone = {
  name: string;
  solfege?: string;
  nashville?: string;
};

export function relativeLabel(note: NamedTone, naming: NamingSystem): string {
  if (naming === 'nashville') {
    return note.nashville || note.name;
  }
  return note.solfege || note.name;
}

export function namedTone(note: NamedTone, naming: NamingSystem): string {
  return `${relativeLabel(note, naming)} (${note.name})`;
}

type NamingContextValue = {
  naming: NamingSystem;
  setNaming: (next: NamingSystem) => void;
};

export const NamingContext = createContext<NamingContextValue>({
  naming: 'solfege',
  setNaming: () => undefined,
});

export function useNaming() {
  return useContext(NamingContext);
}

function parseNaming(value: string | null | undefined): NamingSystem {
  return value === 'nashville' ? 'nashville' : 'solfege';
}

export async function loadNaming(): Promise<NamingSystem> {
  if (Platform.OS === 'web') {
    try {
      return parseNaming(globalThis.localStorage?.getItem('audiation.naming'));
    } catch {
      return 'solfege';
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'audiation-naming-v1.txt');
  if (!file.exists) {
    return 'solfege';
  }
  return parseNaming((await file.text()).trim());
}

export async function saveNaming(naming: NamingSystem): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem('audiation.naming', naming);
    } catch {
      // privé-modus
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'audiation-naming-v1.txt');
  if (!file.exists) {
    file.create();
  }
  file.write(naming);
}
