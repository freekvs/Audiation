import { setAudioModeAsync } from 'expo-audio';
import { useEffect, useState } from 'react';

import {
  loadNaming,
  NamingContext,
  saveNaming,
  type NamingSystem,
} from './src/naming';
import type { ScreenId } from './src/navigation';
import { CalibrateScreen } from './src/screens/CalibrateScreen';
import { HoldToneScreen } from './src/screens/HoldToneScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { IntervalScreen } from './src/screens/IntervalScreen';
import { MelodyScreen } from './src/screens/MelodyScreen';
import { PianoScreen } from './src/screens/PianoScreen';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const [naming, setNamingState] = useState<NamingSystem>('solfege');

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    void loadNaming().then(setNamingState);
  }, []);

  const setNaming = (next: NamingSystem) => {
    setNamingState(next);
    void saveNaming(next);
  };

  return (
    <NamingContext.Provider value={{ naming, setNaming }}>
      {screen === 'holdTone' ? (
        <HoldToneScreen onBack={() => setScreen('home')} />
      ) : screen === 'interval' ? (
        <IntervalScreen onBack={() => setScreen('home')} />
      ) : screen === 'melody' ? (
        <MelodyScreen onBack={() => setScreen('home')} />
      ) : screen === 'piano' ? (
        <PianoScreen onBack={() => setScreen('home')} />
      ) : screen === 'calibrate' ? (
        <CalibrateScreen onBack={() => setScreen('home')} />
      ) : (
        <HomeScreen onOpen={setScreen} />
      )}
    </NamingContext.Provider>
  );
}
