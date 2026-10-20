import {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  MaxAdContentRating,
  MobileAds,
  TestIds,
} from 'react-native-google-mobile-ads';

import { invalidatePlayback, preparePlayback } from '../audio/playbackMode';
import { interstitialUnitId } from './ids';

const GAP_MS = 3 * 60 * 1000;
const WAIT_MS = 2500;

let prepareTask: Promise<void> | null = null;
let canRequest = false;
let ready: InterstitialAd | null = null;
let loading: InterstitialAd | null = null;
let lastShownAt = 0;

function unitId(): string {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return TestIds.INTERSTITIAL;
  }
  return interstitialUnitId();
}

function preload(): void {
  if (!canRequest || ready || loading) {
    return;
  }
  const ad = InterstitialAd.createForAdRequest(unitId(), {
    requestNonPersonalizedAdsOnly: true,
    contentUrl: 'https://audiation.app',
  });
  loading = ad;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    if (loading !== ad) {
      return;
    }
    loading = null;
    ready = ad;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    if (loading === ad) {
      loading = null;
    }
  });
  ad.load();
}

async function doPrepare(): Promise<void> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // A previous consent choice can still allow a request.
  }
  try {
    const info = await AdsConsent.getConsentInfo();
    canRequest = info.canRequestAds;
  } catch {
    canRequest = true;
  }
  if (!canRequest) {
    return;
  }
  await MobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
    publisherPrivacyPersonalizationState: 'disabled',
  });
  await MobileAds().initialize();
  preload();
}

export function prepareAds(): Promise<void> {
  if (!prepareTask) {
    prepareTask = doPrepare().catch(() => undefined);
  }
  return prepareTask;
}

function waitUntilReady(): Promise<void> {
  if (ready) {
    return Promise.resolve();
  }
  preload();
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (ready || Date.now() - started >= WAIT_MS) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
  });
}

export async function showInterstitial(): Promise<void> {
  await prepareAds();
  if (!canRequest) {
    return;
  }
  if (Date.now() - lastShownAt < GAP_MS) {
    return;
  }
  await waitUntilReady();
  const ad = ready;
  if (!ad) {
    return;
  }
  ready = null;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = (shown: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      if (shown) {
        lastShownAt = Date.now();
      }
      ad.removeAllListeners();
      void preparePlayback().catch(() => undefined);
      resolve();
      preload();
    };
    ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    invalidatePlayback();
    ad.show().catch(() => finish(false));
  });
}
