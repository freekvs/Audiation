import { Platform } from 'react-native';

/** Store product id. The €6.99 price is set in Play Console and App Store Connect, not in the app. */
export const REMOVE_ADS_SKU = 'remove_ads';

export const FALLBACK_PRICE = '€ 6,99';

const GOOGLE_TEST_PUBLISHER = '3940256099942544';

/** AdMob app Audiation, Android. Public id; it ships inside the app. */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-4322902709993646~4784385324';

/** AdMob app Audiation, iOS. */
export const ADMOB_IOS_APP_ID = 'ca-app-pub-4322902709993646~6354340063';

/** Interstitial shown before an exercise on Android. */
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-4322902709993646/2999610493';

/** Interstitial shown before an exercise on iOS. */
export const ADMOB_IOS_INTERSTITIAL_ID = 'ca-app-pub-4322902709993646/6925185705';

export function interstitialUnitId(): string {
  const ios = Platform.OS === 'ios';
  const fromEnv = ios
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID
    : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
  if (fromEnv && !fromEnv.includes(GOOGLE_TEST_PUBLISHER)) {
    return fromEnv;
  }
  return ios ? ADMOB_IOS_INTERSTITIAL_ID : ADMOB_INTERSTITIAL_ID;
}
