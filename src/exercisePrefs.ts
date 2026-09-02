import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { saveDronePref } from './audio/drone';
import { resetKlankToSec } from './audio/klank';
import type { ExtensionFind, ExtensionGiven, ExtensionQuality } from './extension';
import type { HarmonyFind, HarmonyQuality } from './harmony';
import type { HoldInversionMode, HoldSizeMode } from './holdChord';
import type { OctaveWay } from './intervals';
import type { ChordSize, ProgressionPalette, ProgressionPattern } from './progression';
import type { Meter, VoiceCount } from './rhythm';

export type ExercisePrefs = {
  holdTone: { octave: number; singEnabled: boolean };
  findNote: { hearCue: boolean; toneOctaves: number[]; sliderOctaves: number[] };
  interval: {
    octave: number;
    span: number;
    way: OctaveWay;
    showAnchor: boolean;
    singEnabled: boolean;
    pianoEnabled: boolean;
  };
  melody: { octave: number; count: number };
  reverse: { octave: number; count: number };
  holdChord: { octave: number; sizeMode: HoldSizeMode; inversionMode: HoldInversionMode };
  harmony: {
    qualities: HarmonyQuality[];
    finds: HarmonyFind[];
    givenCount: 1 | 2;
    inversions: boolean;
    toneOctaves: number[];
    sliderOctaves: number[];
  };
  extension: {
    qualities: ExtensionQuality[];
    finds: ExtensionFind[];
    given: ExtensionGiven;
    toneOctaves: number[];
    sliderOctaves: number[];
  };
  progression: {
    length: number;
    palette: ProgressionPalette;
    size: ChordSize;
    inversions: boolean;
    hearTonic: boolean;
    pattern: ProgressionPattern;
    toneOctaves: number[];
  };
  rhythm: {
    mode: 'preset' | 'compose';
    meter: Meter;
    bars: number;
    sounds: VoiceCount;
    patternId: string;
  };
};

export const SIMPLE_PRESET: ExercisePrefs = {
  holdTone: { octave: 4, singEnabled: false },
  findNote: { hearCue: true, toneOctaves: [4], sliderOctaves: [4] },
  interval: {
    octave: 4,
    span: 1,
    way: 'up',
    showAnchor: false,
    singEnabled: false,
    pianoEnabled: false,
  },
  melody: { octave: 4, count: 2 },
  reverse: { octave: 4, count: 2 },
  holdChord: { octave: 4, sizeMode: 'triad', inversionMode: 'root' },
  harmony: {
    qualities: ['major'],
    finds: ['third'],
    givenCount: 1,
    inversions: false,
    toneOctaves: [4],
    sliderOctaves: [4],
  },
  extension: {
    qualities: ['major'],
    finds: ['ninth'],
    given: 'triad',
    toneOctaves: [4],
    sliderOctaves: [4, 5],
  },
  progression: {
    length: 2,
    palette: 'major',
    size: 3,
    inversions: false,
    hearTonic: true,
    pattern: 'cadence',
    toneOctaves: [4],
  },
  rhythm: { mode: 'preset', meter: 4, bars: 1, sounds: 1, patternId: '4q' },
};

const STORAGE_KEY = 'audiation.prefs.v1';
const FILE_NAME = 'audiation-prefs-v1.json';

type StoredBundle = {
  prefs: ExercisePrefs;
  mine: ExercisePrefs | null;
};

function clonePrefs(prefs: ExercisePrefs): ExercisePrefs {
  return JSON.parse(JSON.stringify(prefs)) as ExercisePrefs;
}

function asNumberArray(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number')) {
    return [...fallback];
  }
  return value.length > 0 ? value.slice() : [...fallback];
}

function mergeSimple(raw: unknown): ExercisePrefs {
  const base = clonePrefs(SIMPLE_PRESET);
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const data = raw as Record<string, Record<string, unknown>>;
  const holdTone = data.holdTone ?? {};
  const findNote = data.findNote ?? {};
  const interval = data.interval ?? {};
  const melody = data.melody ?? {};
  const reverse = data.reverse ?? {};
  const holdChord = data.holdChord ?? {};
  const harmony = data.harmony ?? {};
  const extension = data.extension ?? {};
  const progression = data.progression ?? {};
  const rhythm = data.rhythm ?? {};

  return {
    holdTone: {
      octave: typeof holdTone.octave === 'number' ? holdTone.octave : base.holdTone.octave,
      singEnabled: typeof holdTone.singEnabled === 'boolean' ? holdTone.singEnabled : base.holdTone.singEnabled,
    },
    findNote: {
      hearCue: typeof findNote.hearCue === 'boolean' ? findNote.hearCue : base.findNote.hearCue,
      toneOctaves: asNumberArray(findNote.toneOctaves, base.findNote.toneOctaves),
      sliderOctaves: asNumberArray(findNote.sliderOctaves, base.findNote.sliderOctaves),
    },
    interval: {
      octave: typeof interval.octave === 'number' ? interval.octave : base.interval.octave,
      span: typeof interval.span === 'number' ? interval.span : base.interval.span,
      way: interval.way === 'down' ? 'down' : 'up',
      showAnchor: typeof interval.showAnchor === 'boolean' ? interval.showAnchor : base.interval.showAnchor,
      singEnabled: typeof interval.singEnabled === 'boolean' ? interval.singEnabled : base.interval.singEnabled,
      pianoEnabled: typeof interval.pianoEnabled === 'boolean' ? interval.pianoEnabled : base.interval.pianoEnabled,
    },
    melody: {
      octave: typeof melody.octave === 'number' ? melody.octave : base.melody.octave,
      count: typeof melody.count === 'number' ? melody.count : base.melody.count,
    },
    reverse: {
      octave: typeof reverse.octave === 'number' ? reverse.octave : base.reverse.octave,
      count: typeof reverse.count === 'number' ? reverse.count : base.reverse.count,
    },
    holdChord: {
      octave: typeof holdChord.octave === 'number' ? holdChord.octave : base.holdChord.octave,
      sizeMode:
        holdChord.sizeMode === 'seventh' || holdChord.sizeMode === 'mix' ? holdChord.sizeMode : 'triad',
      inversionMode:
        holdChord.inversionMode === 'inv1' ||
        holdChord.inversionMode === 'inv2' ||
        holdChord.inversionMode === 'mix'
          ? holdChord.inversionMode
          : 'root',
    },
    harmony: {
      qualities: Array.isArray(harmony.qualities) && harmony.qualities.length > 0
        ? (harmony.qualities as HarmonyQuality[])
        : base.harmony.qualities,
      finds: Array.isArray(harmony.finds) && harmony.finds.length > 0
        ? (harmony.finds as HarmonyFind[])
        : base.harmony.finds,
      givenCount: harmony.givenCount === 2 ? 2 : 1,
      inversions: harmony.inversions === true,
      toneOctaves: asNumberArray(harmony.toneOctaves, base.harmony.toneOctaves),
      sliderOctaves: asNumberArray(harmony.sliderOctaves, base.harmony.sliderOctaves),
    },
    extension: {
      qualities: Array.isArray(extension.qualities) && extension.qualities.length > 0
        ? (extension.qualities as ExtensionQuality[])
        : base.extension.qualities,
      finds: Array.isArray(extension.finds) && extension.finds.length > 0
        ? (extension.finds as ExtensionFind[])
        : base.extension.finds,
      given:
        extension.given === 'seventh' || extension.given === 'shell' ? extension.given : 'triad',
      toneOctaves: asNumberArray(extension.toneOctaves, base.extension.toneOctaves),
      sliderOctaves: asNumberArray(extension.sliderOctaves, base.extension.sliderOctaves),
    },
    progression: {
      length: typeof progression.length === 'number' ? progression.length : base.progression.length,
      palette:
        progression.palette === 'known' || progression.palette === 'random'
          ? progression.palette
          : 'major',
      size: progression.size === 4 ? 4 : 3,
      inversions: progression.inversions === true,
      hearTonic: typeof progression.hearTonic === 'boolean' ? progression.hearTonic : base.progression.hearTonic,
      pattern:
        progression.pattern === 'cadence' ||
        progression.pattern === 'oneFourFive' ||
        progression.pattern === 'free'
          ? progression.pattern
          : base.progression.pattern,
      toneOctaves: asNumberArray(progression.toneOctaves, base.progression.toneOctaves),
    },
    rhythm: {
      mode: rhythm.mode === 'compose' ? 'compose' : 'preset',
      meter: rhythm.meter === 3 ? 3 : 4,
      bars: typeof rhythm.bars === 'number' ? rhythm.bars : base.rhythm.bars,
      sounds: rhythm.sounds === 2 || rhythm.sounds === 3 ? rhythm.sounds : 1,
      patternId: typeof rhythm.patternId === 'string' ? rhythm.patternId : base.rhythm.patternId,
    },
  };
}

export function prefsAreSimple(prefs: ExercisePrefs): boolean {
  return JSON.stringify(prefs) === JSON.stringify(SIMPLE_PRESET);
}

export function prefsEqual(a: ExercisePrefs, b: ExercisePrefs): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseStored(raw: unknown): StoredBundle {
  if (raw && typeof raw === 'object' && 'prefs' in raw) {
    const data = raw as { prefs?: unknown; mine?: unknown };
    return {
      prefs: mergeSimple(data.prefs),
      mine: data.mine ? mergeSimple(data.mine) : null,
    };
  }
  return { prefs: mergeSimple(raw), mine: null };
}

async function loadStored(): Promise<StoredBundle> {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      return raw ? parseStored(JSON.parse(raw)) : { prefs: clonePrefs(SIMPLE_PRESET), mine: null };
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, FILE_NAME);
    if (!file.exists) {
      return { prefs: clonePrefs(SIMPLE_PRESET), mine: null };
    }
    return parseStored(JSON.parse((await file.text()).trim() || '{}'));
  } catch {
    return { prefs: clonePrefs(SIMPLE_PRESET), mine: null };
  }
}

async function saveStored(bundle: StoredBundle): Promise<void> {
  const raw = JSON.stringify(bundle);
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

type PrefsContextValue = {
  prefs: ExercisePrefs;
  loaded: boolean;
  isSimple: boolean;
  hasMine: boolean;
  mineIsCurrent: boolean;
  applySimple: () => void;
  saveMine: () => void;
  applyMine: () => void;
  markVisit: () => void;
  saveMineIfDirty: () => void;
  update: <K extends keyof ExercisePrefs>(key: K, patch: Partial<ExercisePrefs[K]>) => void;
};

const ExercisePrefsContext = createContext<PrefsContextValue>({
  prefs: SIMPLE_PRESET,
  loaded: false,
  isSimple: true,
  hasMine: false,
  mineIsCurrent: false,
  applySimple: () => undefined,
  saveMine: () => undefined,
  applyMine: () => undefined,
  markVisit: () => undefined,
  saveMineIfDirty: () => undefined,
  update: () => undefined,
});

export function useExercisePrefs(): PrefsContextValue {
  return useContext(ExercisePrefsContext);
}

function readStoredSync(): StoredBundle | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? parseStored(JSON.parse(raw)) : { prefs: clonePrefs(SIMPLE_PRESET), mine: null };
  } catch {
    return { prefs: clonePrefs(SIMPLE_PRESET), mine: null };
  }
}

export function ExercisePrefsProvider({ children }: { children: ReactNode }) {
  const synced = readStoredSync();
  const [prefs, setPrefs] = useState<ExercisePrefs>(() => synced?.prefs ?? clonePrefs(SIMPLE_PRESET));
  const [mine, setMine] = useState<ExercisePrefs | null>(() => synced?.mine ?? null);
  const [loaded, setLoaded] = useState(synced != null);
  const prefsRef = useRef(prefs);
  const mineRef = useRef(mine);
  const visitStartRef = useRef<string | null>(null);
  prefsRef.current = prefs;
  mineRef.current = mine;

  useEffect(() => {
    if (loaded) {
      return;
    }
    void loadStored().then((next) => {
      setPrefs(next.prefs);
      setMine(next.mine);
      setLoaded(true);
    });
  }, [loaded]);

  const persist = useCallback((nextPrefs: ExercisePrefs, nextMine: ExercisePrefs | null) => {
    void saveStored({ prefs: nextPrefs, mine: nextMine });
  }, []);

  const applySimple = useCallback(() => {
    const next = clonePrefs(SIMPLE_PRESET);
    setPrefs(next);
    persist(next, mineRef.current);
    void saveDronePref(false);
    resetKlankToSec();
  }, [persist]);

  const saveMine = useCallback(() => {
    const next = clonePrefs(prefsRef.current);
    setMine(next);
    persist(prefsRef.current, next);
  }, [persist]);

  const applyMine = useCallback(() => {
    const stored = mineRef.current;
    if (!stored) {
      return;
    }
    const next = clonePrefs(stored);
    setPrefs(next);
    persist(next, stored);
  }, [persist]);

  const markVisit = useCallback(() => {
    visitStartRef.current = JSON.stringify(prefsRef.current);
  }, []);

  const saveMineIfDirty = useCallback(() => {
    const start = visitStartRef.current;
    const now = JSON.stringify(prefsRef.current);
    if (start == null || now === start) {
      return;
    }
    const next = clonePrefs(prefsRef.current);
    setMine(next);
    persist(prefsRef.current, next);
  }, [persist]);

  const update = useCallback(<K extends keyof ExercisePrefs>(key: K, patch: Partial<ExercisePrefs[K]>) => {
    setPrefs((current) => {
      const nextSlice = { ...current[key], ...patch };
      if (JSON.stringify(nextSlice) === JSON.stringify(current[key])) {
        return current;
      }
      const next = {
        ...current,
        [key]: nextSlice,
      };
      persist(next, mineRef.current);
      return next;
    });
  }, [persist]);

  const value = useMemo(
    () => ({
      prefs,
      loaded,
      isSimple: prefsAreSimple(prefs),
      hasMine: mine != null,
      mineIsCurrent: mine != null && prefsEqual(prefs, mine),
      applySimple,
      saveMine,
      applyMine,
      markVisit,
      saveMineIfDirty,
      update,
    }),
    [prefs, mine, loaded, applySimple, saveMine, applyMine, markVisit, saveMineIfDirty, update],
  );

  return createElement(ExercisePrefsContext.Provider, { value }, children);
}

export function ExercisePrefsGate({ children }: { children: ReactNode }) {
  const { loaded } = useExercisePrefs();
  if (!loaded) {
    return null;
  }
  return children;
}
