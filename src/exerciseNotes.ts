import { PIANO_OCTAVES } from './notes';

export type ExerciseNote = {
  id: string;
  name: string;
  solfege: string;
  nashville: string;
  hz: number;
};

export type ExerciseOctave = {
  octave: number;
  label: string;
  notes: ExerciseNote[];
};

export const EXERCISE_OCTAVES: ExerciseOctave[] = PIANO_OCTAVES.map((item) => ({
  octave: item.octave,
  label: item.label,
  notes: item.whiteKeys.map((note) => ({
    id: note.id,
    name: note.name,
    solfege: note.solfege ?? '',
    nashville: note.nashville ?? '',
    hz: note.hz,
  })),
}));

export const DEFAULT_EXERCISE_OCTAVE = EXERCISE_OCTAVES.find((item) => item.octave === 4)!;

export function exerciseOctave(octave: number): ExerciseOctave {
  return EXERCISE_OCTAVES.find((item) => item.octave === octave) ?? DEFAULT_EXERCISE_OCTAVE;
}

export function notesFromOctaves(octaves: number[]): ExerciseNote[] {
  const selected = octaves.length > 0 ? octaves : [4];
  const notes: ExerciseNote[] = [];
  const seen = new Set<string>();
  for (const octave of selected) {
    for (const note of exerciseOctave(octave).notes) {
      if (seen.has(note.id)) {
        continue;
      }
      seen.add(note.id);
      notes.push(note);
    }
  }
  return notes.length > 0 ? notes : DEFAULT_EXERCISE_OCTAVE.notes;
}
