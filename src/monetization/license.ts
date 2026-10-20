import { Platform } from 'react-native';

const FILE_NAME = 'audiation-license-v1.txt';
const WEB_KEY = 'audiation.license';

export async function loadLicense(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(WEB_KEY) === '1';
    } catch {
      return false;
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) {
    return false;
  }
  return (await file.text()).trim() === '1';
}

export async function saveLicense(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(WEB_KEY, '1');
    } catch {
      // privé-modus
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) {
    file.create();
  }
  file.write('1');
}
