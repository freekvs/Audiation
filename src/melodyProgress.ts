import { Platform } from 'react-native';

import { fmt, type Strings } from './i18n';
import { CORE_MELODY_MAX } from './melody';

export const UP_STREAK = 5;
export const DOWN_MISSES = 3;

export type ProgressStore = 'melody' | 'reverse';

const STORES: Record<ProgressStore, { storageKey: string; fileName: string }> = {
  melody: {
    storageKey: 'audiation.melodyProgress.v1',
    fileName: 'audiation-melody-progress-v1.json',
  },
  reverse: {
    storageKey: 'audiation.reverseProgress.v1',
    fileName: 'audiation-reverse-progress-v1.json',
  },
};

export type CountStats = {
  consecutiveCorrect: number;
  consecutiveMiss: number;
};

export type MelodyProgress = {
  day: string;
  todayCorrect: number;
  todayMiss: number;
  streak: number;
  at: Record<string, CountStats>;
};

export type MelodyAdvice = {
  kind: 'up' | 'down' | null;
  count: number;
  text: string;
};

export function emptyMelodyProgress(): MelodyProgress {
  return {
    day: todayKey(),
    todayCorrect: 0,
    todayMiss: 0,
    streak: 0,
    at: {},
  };
}

export function todayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function rollMelodyDay(progress: MelodyProgress, now = new Date()): MelodyProgress {
  const day = todayKey(now);
  if (progress.day === day) {
    return progress;
  }
  return {
    ...progress,
    day,
    todayCorrect: 0,
    todayMiss: 0,
  };
}

export function recordMelodyRound(
  progress: MelodyProgress,
  count: number,
  all: boolean,
  now = new Date(),
): MelodyProgress {
  const rolled = rollMelodyDay(progress, now);
  const key = String(count);
  const at = { ...(rolled.at[key] ?? { consecutiveCorrect: 0, consecutiveMiss: 0 }) };
  if (all) {
    at.consecutiveCorrect += 1;
    at.consecutiveMiss = 0;
  } else {
    at.consecutiveCorrect = 0;
    at.consecutiveMiss += 1;
  }
  return {
    ...rolled,
    streak: all ? rolled.streak + 1 : 0,
    todayCorrect: rolled.todayCorrect + (all ? 1 : 0),
    todayMiss: rolled.todayMiss + (all ? 0 : 1),
    at: { ...rolled.at, [key]: at },
  };
}

export function melodyAdvice(
  progress: MelodyProgress,
  currentCount: number,
  copy: Strings['melody'],
): MelodyAdvice {
  const rolled = rollMelodyDay(progress);
  const at = rolled.at[String(currentCount)] ?? {
    consecutiveCorrect: 0,
    consecutiveMiss: 0,
  };

  if (currentCount < CORE_MELODY_MAX && at.consecutiveCorrect >= UP_STREAK) {
    const nextCount = currentCount + 1;
    return {
      kind: 'up',
      count: nextCount,
      text: fmt(copy.adviceUp, {
        streak: at.consecutiveCorrect,
        count: currentCount,
        next: nextCount,
      }),
    };
  }

  if (currentCount > CORE_MELODY_MAX && at.consecutiveMiss >= DOWN_MISSES) {
    return {
      kind: 'down',
      count: CORE_MELODY_MAX,
      text: fmt(copy.adviceDownHard, { count: currentCount, core: CORE_MELODY_MAX }),
    };
  }

  if (currentCount > 2 && at.consecutiveMiss >= DOWN_MISSES) {
    const back = currentCount - 1;
    return {
      kind: 'down',
      count: back,
      text: fmt(copy.adviceDown, { back }),
    };
  }

  return { kind: null, count: currentCount, text: '' };
}

export function formatMelodyStats(progress: MelodyProgress, copy: Strings['melody']): string {
  const rolled = rollMelodyDay(progress);
  return fmt(copy.stats, {
    streak: rolled.streak,
    correct: rolled.todayCorrect,
    miss: rolled.todayMiss,
  });
}

function parseProgress(raw: string | null | undefined): MelodyProgress {
  if (!raw) {
    return emptyMelodyProgress();
  }
  try {
    const value = JSON.parse(raw) as Partial<MelodyProgress>;
    if (typeof value !== 'object' || value == null) {
      return emptyMelodyProgress();
    }
    const at: Record<string, CountStats> = {};
    if (value.at && typeof value.at === 'object') {
      for (const [key, stats] of Object.entries(value.at)) {
        if (!stats || typeof stats !== 'object') {
          continue;
        }
        at[key] = {
          consecutiveCorrect: Math.max(0, Number(stats.consecutiveCorrect) || 0),
          consecutiveMiss: Math.max(0, Number(stats.consecutiveMiss) || 0),
        };
      }
    }
    return rollMelodyDay({
      day: typeof value.day === 'string' ? value.day : todayKey(),
      todayCorrect: Math.max(0, Number(value.todayCorrect) || 0),
      todayMiss: Math.max(0, Number(value.todayMiss) || 0),
      streak: Math.max(0, Number(value.streak) || 0),
      at,
    });
  } catch {
    return emptyMelodyProgress();
  }
}

export async function loadMelodyProgress(
  store: ProgressStore = 'melody',
): Promise<MelodyProgress> {
  const { storageKey, fileName } = STORES[store];
  if (Platform.OS === 'web') {
    try {
      return parseProgress(globalThis.localStorage?.getItem(storageKey));
    } catch {
      return emptyMelodyProgress();
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, fileName);
  if (!file.exists) {
    return emptyMelodyProgress();
  }
  return parseProgress(await file.text());
}

export async function saveMelodyProgress(
  progress: MelodyProgress,
  store: ProgressStore = 'melody',
): Promise<void> {
  const { storageKey, fileName } = STORES[store];
  const raw = JSON.stringify(progress);
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(storageKey, raw);
    } catch {
      // privé-modus
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, fileName);
  if (!file.exists) {
    file.create();
  }
  file.write(raw);
}
