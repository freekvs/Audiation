const TEST_PUBLISHER = '3940256099942544';
const ADMOB_ANDROID_APP_ID = 'ca-app-pub-4322902709993646~4784385324';
const ADMOB_IOS_APP_ID = 'ca-app-pub-4322902709993646~6354340063';

/** AdMob app ids live in the native manifest. Production builds refuse Google's test ids. */
module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || ADMOB_IOS_APP_ID;
  const interstitial = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-4322902709993646/2999610493';
  const iosInterstitial = process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || 'ca-app-pub-4322902709993646/6925185705';

  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const testId = (id) => !id || id.includes(TEST_PUBLISHER);
    if (testId(androidAppId) || testId(interstitial)) {
      throw new Error('Production build cannot use Google test AdMob ids.');
    }
    if (process.env.EAS_BUILD_PLATFORM === 'ios' && (testId(iosAppId) || testId(iosInterstitial))) {
      throw new Error('Production iOS build cannot use Google test AdMob ids.');
    }
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-google-mobile-ads',
        {
          androidAppId,
          iosAppId,
          delayAppMeasurementInit: true,
        },
      ],
      'expo-iap',
    ],
  };
};
