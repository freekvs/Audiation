export type PianoKey = {
  id: string;
  name: string;
  solfege?: string;
  nashville?: string;
  color: 'white' | 'black';
  afterWhiteIndex?: number;
  hz: number;
};

export type PianoOctave = {
  octave: number;
  label: string;
  whiteKeys: PianoKey[];
  blackKeys: PianoKey[];
};

const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const IDS = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];
const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11, 12];
const WHITE_SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
const WHITE_NASHVILLE = ['1', '2', '3', '4', '5', '6', '7', '1'];
const BLACK_NASHVILLE = ['♯1', '♯2', '♯4', '♯5', '♯6'];
const BLACK_STEPS = [
  { step: 1, afterWhiteIndex: 0 },
  { step: 3, afterWhiteIndex: 1 },
  { step: 6, afterWhiteIndex: 3 },
  { step: 8, afterWhiteIndex: 4 },
  { step: 10, afterWhiteIndex: 5 },
];

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function toneId(midi: number): string {
  return `${IDS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function letterName(midi: number, withOctave: boolean): string {
  const letter = LETTERS[((midi % 12) + 12) % 12];
  return withOctave ? `${letter}${Math.floor(midi / 12) - 1}` : letter;
}

export const PIANO_OCTAVES: PianoOctave[] = [1, 2, 3, 4, 5, 6, 7, 8].map((octave) => {
  const cMidi = 12 * (octave + 1);
  return {
    octave,
    label: `C${octave}`,
    whiteKeys: WHITE_STEPS.map((step, index) => {
      const midi = cMidi + step;
      return {
        id: toneId(midi),
        name: letterName(midi, index === 0 || index === WHITE_STEPS.length - 1),
        solfege: WHITE_SOLFEGE[index],
        nashville: WHITE_NASHVILLE[index],
        color: 'white' as const,
        hz: midiToHz(midi),
      };
    }),
    blackKeys: BLACK_STEPS.map((item, blackIndex) => {
      const midi = cMidi + item.step;
      return {
        id: toneId(midi),
        name: letterName(midi, false),
        nashville: BLACK_NASHVILLE[blackIndex],
        color: 'black' as const,
        afterWhiteIndex: item.afterWhiteIndex,
        hz: midiToHz(midi),
      };
    }),
  };
});

export const DEFAULT_PIANO_OCTAVE = PIANO_OCTAVES.find((item) => item.octave === 4)!;

export const A4_NOTE = DEFAULT_PIANO_OCTAVE.whiteKeys.find((note) => note.id === 'a4')!;
