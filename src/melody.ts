import type { ExerciseNote } from './exerciseNotes';

export const MELODY_COUNTS = [2, 3, 4, 5, 6, 7, 8] as const;
export const DEFAULT_MELODY_COUNT = 2;
export const DEFAULT_REVERSE_COUNT = 3;
export const CORE_MELODY_MAX = 4;

export type MelodyPhrase = {
  notes: ExerciseNote[];
  ranks: number[];
};

export function phraseKey(phrase: MelodyPhrase): string {
  return phrase.notes.map((note) => note.id).join('-');
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i]!;
    next[i] = next[j]!;
    next[j] = current;
  }
  return next;
}

export function pickPhrase(
  scale: ExerciseNote[],
  count: number,
  exceptKey?: string,
): MelodyPhrase {
  const n = Math.max(2, Math.min(count, scale.length));
  let phrase = makePhrase(scale, n);
  for (let i = 0; i < 16 && exceptKey && phraseKey(phrase) === exceptKey; i += 1) {
    phrase = makePhrase(scale, n);
  }
  return phrase;
}

function makePhrase(scale: ExerciseNote[], n: number): MelodyPhrase {
  const pool = shuffle(scale).slice(0, n);
  const notes = shuffle(pool);
  const byHeight = [...pool].sort((a, b) => a.hz - b.hz);
  const ranks = notes.map((note) => byHeight.findIndex((item) => item.id === note.id));
  return { notes, ranks };
}

export function emptyGuess(count: number): (number | null)[] {
  return Array.from({ length: count }, () => null);
}

export function placeRank(
  guess: (number | null)[],
  col: number,
  row: number,
): (number | null)[] {
  const next = [...guess];
  if (next[col] === row) {
    next[col] = null;
    return next;
  }
  const taken = next.findIndex((value, index) => index !== col && value === row);
  if (taken >= 0) {
    next[taken] = next[col] ?? null;
  }
  next[col] = row;
  return next;
}

export function guessComplete(guess: (number | null)[]): guess is number[] {
  return guess.every((value) => value != null);
}

export function reverseRanks(ranks: number[]): number[] {
  return ranks.slice().reverse();
}

export function ranksEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function isRankPalindrome(ranks: number[]): boolean {
  return ranksEqual(ranks, reverseRanks(ranks));
}

export function pickReversePhrase(
  scale: ExerciseNote[],
  count: number,
  exceptKey?: string,
): MelodyPhrase {
  let phrase = pickPhrase(scale, count, exceptKey);
  for (let i = 0; i < 24 && isRankPalindrome(phrase.ranks); i += 1) {
    phrase = pickPhrase(scale, count, phraseKey(phrase));
  }
  return phrase;
}

export function reversedPhrase(phrase: MelodyPhrase): MelodyPhrase {
  return {
    notes: [...phrase.notes].reverse(),
    ranks: reverseRanks(phrase.ranks),
  };
}

export function scoreContour(
  guess: number[],
  ranks: number[],
): { correct: number; all: boolean } {
  let correct = 0;
  for (let i = 0; i < ranks.length; i += 1) {
    if (guess[i] === ranks[i]) {
      correct += 1;
    }
  }
  return { correct, all: correct === ranks.length };
}
