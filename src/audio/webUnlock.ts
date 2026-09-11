import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

type WebAudio = {
  volume: number;
  muted: boolean;
  loop: boolean;
  currentTime: number;
  playsInline: boolean;
  preload: string;
  play: () => Promise<void>;
  pause: () => void;
};

type WebAudioContext = {
  resume: () => Promise<unknown>;
};

const listeners = new Set<() => void>();

let ready = Platform.OS !== 'web';
let silent: WebAudio | null = null;
let audioCtx: WebAudioContext | null = null;
let armed = false;

export function isAudioReady(): boolean {
  return ready;
}

export function subscribeAudioReady(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useAudioReady(): boolean {
  const [value, setValue] = useState(ready);
  useEffect(() => subscribeAudioReady(() => setValue(isAudioReady())), []);
  return value;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function makeSilentUri(): string {
  return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
}

export function markWebMedia(_media: WebAudio): void {
  // Speelers worden na de eerste tik gemaakt; ontgrendelen gaat via één stil element.
}

function getAudioContext(): WebAudioContext | null {
  if (audioCtx) {
    return audioCtx;
  }
  const g = globalThis as {
    AudioContext?: new () => WebAudioContext;
    webkitAudioContext?: new () => WebAudioContext;
  };
  const AC = g.AudioContext ?? g.webkitAudioContext;
  if (!AC) {
    return null;
  }
  audioCtx = new AC();
  return audioCtx;
}

export async function unlockAudio(): Promise<void> {
  if (Platform.OS !== 'web') {
    if (!ready) {
      ready = true;
      emit();
    }
    return;
  }

  try {
    if (!silent) {
      silent = new Audio(makeSilentUri()) as unknown as WebAudio;
      silent.volume = 0.01;
      silent.loop = false;
      silent.playsInline = true;
      silent.preload = 'auto';
    }
    silent.currentTime = 0;
    await silent.play();
    silent.pause();
    await getAudioContext()?.resume();
    if (!ready) {
      ready = true;
      emit();
    }
  } catch {
    // Nog geen gebruikersgebaar, of de browser blokkeert audio.
  }
}

export function armWebAudioUnlock(): void {
  if (Platform.OS !== 'web' || armed) {
    return;
  }
  armed = true;
  const unlock = () => {
    void unlockAudio();
  };
  const opts: AddEventListenerOptions = { capture: true };
  globalThis.addEventListener('pointerdown', unlock, opts);
  globalThis.addEventListener('keydown', unlock, opts);
  globalThis.addEventListener('touchstart', unlock, opts);
}
