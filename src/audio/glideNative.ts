import ExpoAudio from 'expo-audio/build/AudioModule';
import { Platform } from 'react-native';

type NativeGlide = {
  setGlideHz?: (hz: number) => boolean;
  stopGlide?: () => void;
  playClickHz?: (hz: number) => void;
  stopClickHz?: () => void;
};

let cached: NativeGlide | null | undefined;

export function nativeGlide(): NativeGlide | null {
  if (cached !== undefined) {
    return cached;
  }
  if (Platform.OS === 'web') {
    cached = null;
    return null;
  }
  const mod = ExpoAudio as unknown as NativeGlide;
  cached = typeof mod.playClickHz === 'function' ? mod : null;
  return cached;
}
