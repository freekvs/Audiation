export type ScreenId = 'home' | 'holdTone' | 'interval' | 'melody' | 'reverse' | 'piano' | 'calibrate';

export type PracticeLevel = 'easy' | 'next' | 'open' | 'soon';

type OpenPractice = {
  kind: 'exercise';
  screen: Exclude<ScreenId, 'home' | 'piano' | 'calibrate'>;
  step: number;
  title: string;
  body: string;
  level: 'easy' | 'next' | 'open';
  levelLabel: string;
};

type SoonPractice = {
  kind: 'soon';
  id: string;
  step: number;
  title: string;
  body: string;
  level: 'soon';
  levelLabel: string;
};

export type PracticeItem = OpenPractice | SoonPractice;

export type ToolItem = {
  screen: 'piano' | 'calibrate';
  title: string;
  body: string;
};

export const PRACTICE_PATH: PracticeItem[] = [
  {
    kind: 'exercise',
    screen: 'holdTone',
    step: 1,
    title: 'Toon vasthouden',
    body: 'Eén toon uit C-majeur. Stilte. Houd hem innerlijk vast.',
    level: 'easy',
    levelLabel: 'Makkelijk',
  },
  {
    kind: 'exercise',
    screen: 'interval',
    step: 2,
    title: 'Interval vasthouden',
    body: 'Twee tonen. Houd de afstand vast. Daarna: andere octaven, later andere toonsoorten.',
    level: 'open',
    levelLabel: 'Open',
  },
  {
    kind: 'exercise',
    screen: 'melody',
    step: 3,
    title: 'Melodie',
    body: 'De lijn van 2 tot 4 tonen in C-majeur. Tik de hoogtes. Geen namen, geen notenbalk.',
    level: 'open',
    levelLabel: 'Open',
  },
  {
    kind: 'exercise',
    screen: 'reverse',
    step: 4,
    title: 'Omkeren',
    body: 'Je hoort 3 tonen. Tik de lijn achterstevoren. Begint met de laatste toon.',
    level: 'next',
    levelLabel: 'Volgende stap',
  },
  {
    kind: 'soon',
    id: 'rhythm',
    step: 5,
    title: 'Ritme',
    body: 'Tijd tussen tonen. Komt als de omkering vastzit.',
    level: 'soon',
    levelLabel: 'Straks',
  },
  {
    kind: 'soon',
    id: 'harmony',
    step: 6,
    title: 'Harmonie',
    body: 'Tonentegelijk: drieklanken. Na mineur en meer toonsoorten.',
    level: 'soon',
    levelLabel: 'Straks',
  },
];

export const TOOLS: ToolItem[] = [
  {
    screen: 'piano',
    title: 'Piano',
    body: 'Klankbron. C-majeur octaaf, C1 tot C8.',
  },
  {
    screen: 'calibrate',
    title: 'IJking',
    body: 'Alleen A440. Controleer of microfoon en app dezelfde La horen.',
  },
];
