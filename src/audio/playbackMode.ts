import { setAudioModeAsync } from 'expo-audio';

let ticket = 0;
let readyTicket = -1;
let pending: Promise<void> | null = null;
let pendingTicket = -1;

/** A reclame kan de iPhone-geluidsroute daarna stil laten. */
export function invalidatePlayback(): void {
  ticket += 1;
  pending = null;
}

/** iOS stays silent until the session is playback. Repeated calls stay on the same route. */
export function preparePlayback(): Promise<void> {
  if (readyTicket === ticket) {
    return Promise.resolve();
  }
  if (pending && pendingTicket === ticket) {
    return pending;
  }
  const mine = ticket;
  pendingTicket = mine;
  pending = setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
    interruptionMode: 'doNotMix',
  })
    .then(() => {
      if (ticket === mine) {
        readyTicket = mine;
      }
    })
    .catch((error: unknown) => {
      if (pendingTicket === mine) {
        pending = null;
      }
      throw error;
    });
  return pending;
}
