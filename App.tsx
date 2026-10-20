import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { Text } from 'react-native';

import { preparePlayback } from './src/audio/playbackMode';
import { loadTapLatency } from './src/audio/tapLatency';
import { armWebAudioUnlock } from './src/audio/webUnlock';

import {
  guessLocale,
  loadLocale,
  LocaleContext,
  saveLocale,
  type LocaleId,
} from './src/i18n';
import {
  loadNaming,
  NamingContext,
  saveNaming,
  type NamingSystem,
} from './src/naming';
import { ExercisePrefsGate, ExercisePrefsProvider, useExercisePrefs } from './src/exercisePrefs';
import { MonetizationProvider, useMonetization } from './src/monetization/Monetization';
import { isPracticeScreen, type ScreenId } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { AppScreen } from './src/ui/AppScreen';

type BackScreen = ComponentType<{ onBack: () => void }>;

type BoundaryProps = { onBack: () => void; children: ReactNode };
type BoundaryState = { error: string | null };

class ScreenBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.error) {
      return (
        <AppScreen onBack={this.props.onBack}>
          <Text style={{ color: '#F4F1EA', fontSize: 20, fontWeight: '700' }}>{this.state.error}</Text>
        </AppScreen>
      );
    }
    return this.props.children;
  }
}

const HoldToneScreen = lazy(() =>
  import('./src/screens/HoldToneScreen').then((m) => ({ default: m.HoldToneScreen })),
);
const FindNoteScreen = lazy(() =>
  import('./src/screens/FindNoteScreen').then((m) => ({ default: m.FindNoteScreen })),
);
const IntervalScreen = lazy(() =>
  import('./src/screens/IntervalScreen').then((m) => ({ default: m.IntervalScreen })),
);
const MelodyScreen = lazy(() =>
  import('./src/screens/MelodyScreen').then((m) => ({ default: m.MelodyScreen })),
);
const ReverseScreen = lazy(() =>
  import('./src/screens/ReverseScreen').then((m) => ({ default: m.ReverseScreen })),
);
const HoldChordScreen = lazy(() =>
  import('./src/screens/HoldChordScreen').then((m) => ({ default: m.HoldChordScreen })),
);
const HarmonyScreen = lazy(() =>
  import('./src/screens/HarmonyScreen').then((m) => ({ default: m.HarmonyScreen })),
);
const ExtensionScreen = lazy(() =>
  import('./src/screens/ExtensionScreen').then((m) => ({ default: m.ExtensionScreen })),
);
const ProgressionScreen = lazy(() =>
  import('./src/screens/ProgressionScreen').then((m) => ({ default: m.ProgressionScreen })),
);
const RhythmScreen = lazy(() =>
  import('./src/screens/RhythmScreen').then((m) => ({ default: m.RhythmScreen })),
);
const TempoScreen = lazy(() =>
  import('./src/screens/TempoScreen').then((m) => ({ default: m.TempoScreen })),
);
const SameToneScreen = lazy(() =>
  import('./src/screens/SameToneScreen').then((m) => ({ default: m.SameToneScreen })),
);
const PianoScreen = lazy(() =>
  import('./src/screens/PianoScreen').then((m) => ({ default: m.PianoScreen })),
);
const CalibrateScreen = lazy(() =>
  import('./src/screens/CalibrateScreen').then((m) => ({ default: m.CalibrateScreen })),
);

const SCREENS: Record<Exclude<ScreenId, 'home'>, LazyExoticComponent<BackScreen>> = {
  holdTone: HoldToneScreen,
  findNote: FindNoteScreen,
  interval: IntervalScreen,
  melody: MelodyScreen,
  reverse: ReverseScreen,
  holdChord: HoldChordScreen,
  harmony: HarmonyScreen,
  extension: ExtensionScreen,
  progression: ProgressionScreen,
  rhythm: RhythmScreen,
  tempo: TempoScreen,
  sameTone: SameToneScreen,
  piano: PianoScreen,
  calibrate: CalibrateScreen,
};

export default function App() {
  const [locale, setLocaleState] = useState<LocaleId>(guessLocale);
  const [naming, setNamingState] = useState<NamingSystem>('solfege');

  useEffect(() => {
    armWebAudioUnlock();
    void preparePlayback().catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadLocale().then(setLocaleState);
    void loadNaming().then(setNamingState);
    void loadTapLatency();
  }, []);

  const setLocale = (next: LocaleId) => {
    setLocaleState(next);
    void saveLocale(next);
  };

  const setNaming = (next: NamingSystem) => {
    setNamingState(next);
    void saveNaming(next);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NamingContext.Provider value={{ naming, setNaming }}>
        <ExercisePrefsProvider>
          <MonetizationProvider>
            <ExercisePrefsGate>
              <AppRoutes />
            </ExercisePrefsGate>
          </MonetizationProvider>
        </ExercisePrefsProvider>
      </NamingContext.Provider>
    </LocaleContext.Provider>
  );
}

function AppRoutes() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const { markVisit, saveMineIfDirty } = useExercisePrefs();
  const { openWithAd } = useMonetization();

  useEffect(() => {
    if (isPracticeScreen(screen)) {
      markVisit();
    }
  }, [screen, markVisit]);

  const goHome = () => {
    if (isPracticeScreen(screen)) {
      saveMineIfDirty();
    }
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen onOpen={(next) => openWithAd(next, setScreen)} />;
  }

  const Screen = SCREENS[screen];
  return (
    <Suspense fallback={<Text style={{ color: '#F4F1EA', padding: 24, fontSize: 18 }}>Audiation</Text>}>
      <ScreenBoundary onBack={goHome}>
        <Screen onBack={goHome} />
      </ScreenBoundary>
    </Suspense>
  );
}
