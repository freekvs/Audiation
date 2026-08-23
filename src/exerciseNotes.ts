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
