import { Platform } from 'react-native';

import { encodeSustainWav } from './encodeSustainWav';
import { nativeGlide } from './glideNative';
import { createReadyPlayer, safePause } from './nativePlay';
import { preparePlayback } from './playbackMode';
import { getWebAudioContext } from './webUnlock';

const AMP = 0.28;
const GLIDE = 0.03;
const FADE = 0.018;
const FILE_SECONDS = 2;
const RATE_MIN = 0.5;
const RATE_MAX = 2;

let osc: ReturnType<NonNullable<ReturnType<typeof getWebAudioContext>>['createOscillator']> | null =
  null;
let gain: ReturnType<NonNullable<ReturnType<typeof getWebAudioContext>>['createGain']> | null = null;

type Player = ReturnType<typeof createReadyPlayer>;

let player: Player | null = null;
let loadedUri: string | null = null;
let refHz = 0;
let pendingRef = 0;
let latestHz = 0;
let loadGen = 0;
let chain: Promise<void> = Promise.resolve();
const nativeUris = new Map<number, string>();

function clampHz(hz: number): number {
  return Math.max(27.5, Math.min(4186, hz));
}

function covers(hz: number, ref: number): boolean {
  if (ref <= 0) {
    return false;
  }
  const rate = hz / ref;
  return rate >= RATE_MIN && rate <= RATE_MAX;
}

function ensurePlayer(): Player {
  if (!player) {
    player = createReadyPlayer(true, 1, true);
    player.shouldCorrectPitch = false;
  }
  return player;
}

function applyRate(target: Player, rate: number) {
  target.shouldCorrectPitch = false;
  target.setPlaybackRate(Math.max(RATE_MIN, Math.min(RATE_MAX, rate)));
}

async function waitLoaded(target: Player): Promise<void> {
  if (target.isLoaded) {
    return;
  }
  await new Promise<void>((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (target.isLoaded || Date.now() - started > 2000) {
        clearInterval(timer);
        resolve();
      }
    }, 40);
  });
}

function webSlide(hz: number) {
  const ctx = getWebAudioContext();
  if (!ctx) {
    return;
  }
  void ctx.resume();
  const now = ctx.currentTime;
  if (!osc || !gain) {
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    gain.gain.setValueAtTime(0, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
  }
  osc.frequency.setTargetAtTime(hz, now, GLIDE);
  gain.gain.setTargetAtTime(AMP, now, FADE);
}

function webStop() {
  const ctx = getWebAudioContext();
  if (!gain || !ctx) {
    return;
  }
  gain.gain.setTargetAtTime(0, ctx.currentTime, FADE);
}

async function nativeUriFor(hz: number): Promise<string> {
  const key = Math.round(hz * 100);
  const cached = nativeUris.get(key);
  if (cached) {
    return cached;
  }
  const bytes = encodeSustainWav(hz, 'sec', FILE_SECONDS);
  let uri: string;
  if (Platform.OS === 'web') {
    uri = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' }));
  } else {
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, `audiation-rate-${key}.wav`);
    if (!file.exists) {
      file.create();
      file.write(bytes);
    }
    uri = file.uri;
  }
  nativeUris.set(key, uri);
  return uri;
}

async function loadAt(anchor: number, gen: number) {
  try {
    if (gen !== loadGen) {
      return;
    }
    const uri = await nativeUriFor(anchor);
    if (gen !== loadGen) {
      return;
    }
    await preparePlayback().catch(() => undefined);
    if (gen !== loadGen) {
      return;
    }
    const target = ensurePlayer();
    target.shouldCorrectPitch = false;
    target.loop = true;
    target.volume = 1;
    if (loadedUri !== uri) {
      target.replace({ uri });
      await waitLoaded(target);
      if (gen !== loadGen) {
        return;
      }
      loadedUri = uri;
    }
    if (gen !== loadGen) {
      return;
    }
    refHz = anchor;
    pendingRef = 0;
    if (!covers(latestHz, anchor)) {
      return;
    }
    applyRate(target, latestHz / anchor);
    target.loop = true;
    if (!target.playing) {
      target.play();
    }
  } catch {
    if (gen === loadGen) {
      pendingRef = 0;
    }
  }
}

export function slideHz(hz: number) {
  const freq = clampHz(hz);
  if (Platform.OS === 'web' && getWebAudioContext()) {
    webSlide(freq);
    return;
  }
  const glide = nativeGlide();
  if (glide?.setGlideHz) {
    glide.setGlideHz(freq);
    return;
  }
  latestHz = freq;
  const target = ensurePlayer();
  const ref = refHz || pendingRef;
  if (covers(freq, ref)) {
    if (refHz > 0 && target.isLoaded) {
      applyRate(target, freq / refHz);
      if (!target.playing) {
        target.play();
      }
    }
    return;
  }
  pendingRef = freq;
  const gen = (loadGen += 1);
  chain = chain.then(() => loadAt(freq, gen)).catch(() => undefined);
}

export function stopSlide() {
  const glide = nativeGlide();
  if (glide?.stopGlide) {
    glide.stopGlide();
    return;
  }
  loadGen += 1;
  refHz = 0;
  pendingRef = 0;
  latestHz = 0;
  if (Platform.OS === 'web') {
    webStop();
    return;
  }
  if (!player) {
    return;
  }
  player.volume = 0;
  safePause(player);
}
