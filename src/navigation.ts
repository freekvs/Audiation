export type ScreenId =
  | 'home'
  | 'holdTone'
  | 'findNote'
  | 'interval'
  | 'melody'
  | 'reverse'
  | 'holdChord'
  | 'harmony'
  | 'extension'
  | 'progression'
  | 'rhythm'
  | 'piano'
  | 'calibrate';

export type PracticeLevel = 'easy' | 'next' | 'open' | 'soon';

type OpenPractice = {
  kind: 'exercise';
  screen: Exclude<ScreenId, 'home' | 'piano' | 'calibrate'>;
  step: number;
  level: 'easy' | 'next' | 'open';
};

type SoonPractice = {
  kind: 'soon';
  id: string;
  step: number;
  level: 'soon';
};

export type PracticeItem = OpenPractice | SoonPractice;

export type ToolItem = {
  screen: 'piano' | 'calibrate';
};

export const PRACTICE_PATH: PracticeItem[] = [
  { kind: 'exercise', screen: 'holdTone', step: 1, level: 'easy' },
  { kind: 'exercise', screen: 'findNote', step: 2, level: 'open' },
  { kind: 'exercise', screen: 'interval', step: 3, level: 'open' },
  { kind: 'exercise', screen: 'melody', step: 4, level: 'open' },
  { kind: 'exercise', screen: 'reverse', step: 5, level: 'open' },
  { kind: 'exercise', screen: 'holdChord', step: 6, level: 'open' },
  { kind: 'exercise', screen: 'harmony', step: 7, level: 'open' },
  { kind: 'exercise', screen: 'extension', step: 8, level: 'open' },
  { kind: 'exercise', screen: 'progression', step: 9, level: 'open' },
  { kind: 'exercise', screen: 'rhythm', step: 10, level: 'next' },
];

export function isPracticeScreen(screen: ScreenId): boolean {
  return PRACTICE_PATH.some((item) => item.kind === 'exercise' && item.screen === screen);
}

export const TOOLS: ToolItem[] = [{ screen: 'piano' }, { screen: 'calibrate' }];
