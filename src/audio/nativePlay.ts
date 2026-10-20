import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { preparePlayback } from './playbackMode';

export function createReadyPlayer(loop = false, volume = 1, keepSession = false): AudioPlayer {
  const player = createAudioPlayer(null, {
    updateInterval: keepSession ? 1000 : 50,
    keepAudioSessionActive: keepSession,
  });
  player.loop = loop;
  player.volume = volume;
  return player;
}

export function safePause(player: AudioPlayer | null): void {
  if (!player) {
    return;
  }
  try {
    player.pause();
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
  try {
    await preparePlayback().catch(() => undefined);
    player.loop = options.loop;
    if (lastUri !== uri) {
      player.replace({ uri });
      await waitLoaded(player);
      if (!stillValid()) {
        return lastUri;
      }
    } else if (options.loop) {
      player.play();
      return uri;
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
  } catch {
    return lastUri;
  }
}
