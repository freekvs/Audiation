import { setAudioModeAsync } from 'expo-audio';
import { useEffect, useState } from 'react';

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
import { isPracticeScreen, type ScreenId } from './src/navigation';
import { CalibrateScreen } from './src/screens/CalibrateScreen';
import { FindNoteScreen } from './src/screens/FindNoteScreen';
import { ExtensionScreen } from './src/screens/ExtensionScreen';
import { HarmonyScreen } from './src/screens/HarmonyScreen';
import { HoldChordScreen } from './src/screens/HoldChordScreen';
import { HoldToneScreen } from './src/screens/HoldToneScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { IntervalScreen } from './src/screens/IntervalScreen';
import { MelodyScreen } from './src/screens/MelodyScreen';
import { PianoScreen } from './src/screens/PianoScreen';
import { ProgressionScreen } from './src/screens/ProgressionScreen';
import { ReverseScreen } from './src/screens/ReverseScreen';
import { RhythmScreen } from './src/screens/RhythmScreen';

export default function App() {
  const [locale, setLocaleState] = useState<LocaleId>(guessLocale);
  const [naming, setNamingState] = useState<NamingSystem>('solfege');

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    void loadLocale().then(setLocaleState);
    void loadNaming().then(setNamingState);
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
          <ExercisePrefsGate>
            <AppRoutes />
          </ExercisePrefsGate>
        </ExercisePrefsProvider>
      </NamingContext.Provider>
    </LocaleContext.Provider>
  );
}

function AppRoutes() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const { markVisit, saveMineIfDirty } = useExercisePrefs();

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

  return screen === 'holdTone' ? (
    <HoldToneScreen onBack={goHome} />
  ) : screen === 'findNote' ? (
    <FindNoteScreen onBack={goHome} />
  ) : screen === 'interval' ? (
    <IntervalScreen onBack={goHome} />
  ) : screen === 'melody' ? (
    <MelodyScreen onBack={goHome} />
  ) : screen === 'reverse' ? (
    <ReverseScreen onBack={goHome} />
  ) : screen === 'holdChord' ? (
    <HoldChordScreen onBack={goHome} />
  ) : screen === 'harmony' ? (
    <HarmonyScreen onBack={goHome} />
  ) : screen === 'extension' ? (
    <ExtensionScreen onBack={goHome} />
  ) : screen === 'progression' ? (
    <ProgressionScreen onBack={goHome} />
  ) : screen === 'rhythm' ? (
    <RhythmScreen onBack={goHome} />
  ) : screen === 'piano' ? (
    <PianoScreen onBack={() => setScreen('home')} />
  ) : screen === 'calibrate' ? (
    <CalibrateScreen onBack={() => setScreen('home')} />
  ) : (
    <HomeScreen onOpen={setScreen} />
  );
}
