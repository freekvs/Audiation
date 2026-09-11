import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export function createReadyPlayer(loop = false, volume = 1): AudioPlayer {
  const player = createAudioPlayer(null, { updateInterval: 50 });
  player.loop = loop;
  player.volume = volume;
  return player;
}

export function safePause(player: AudioPlayer | null): void {
  if (!player) {
    return;
  }
  try {
    const result = player.pause();
    if (result && typeof result === 'object' && 'catch' in result) {
      void (result as Promise<unknown>).catch(() => undefined);
    }
  } catch {
    // Op Android is de native speler soms al vrijgegeven.
  }
}

async function waitLoaded(player: AudioPlayer): Promise<void> {
  if (player.isLoaded) {
    return;
  }
  await new Promise<void>((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (player.isLoaded || Date.now() - started > 2000) {
        clearInterval(timer);
        resolve();
      }
    }, 40);
  });
}

export async function playUri(
  player: AudioPlayer,
  uri: string,
  lastUri: string | null,
  stillValid: () => boolean,
  options: { loop: boolean },
): Promise<string | null> {
  player.loop = options.loop;
  if (lastUri !== uri) {
    player.replace({ uri });
    await waitLoaded(player);
    if (!stillValid()) {
      return lastUri;
    }
  }
  try {
    await player.seekTo(0);
  } catch {
    // sommige webspelers hebben nog geen duur
  }
  if (!stillValid()) {
    return lastUri;
  }
  player.play();
  return uri;
}
