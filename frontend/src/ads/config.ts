// Paste your real AdMob ad unit IDs here before publishing.
// While a value is null, Google's official TEST ads are shown (safe for development).
// Also replace the test App IDs in app.json ("react-native-google-mobile-ads" plugin).
export const AD_UNITS: { banner: string | null; interstitial: string | null; rewarded: string | null } = {
  banner: null,
  interstitial: null,
  rewarded: null,
};

// Show a full-screen ad on every Nth "Play Again / Home / Next level" tap.
export const INTERSTITIAL_EVERY = 2;
