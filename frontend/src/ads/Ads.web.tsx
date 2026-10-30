// Web preview: AdMob is native-only, so ads are disabled here.
export const nativeAdsAvailable = false;

export function NativeBanner(_: { size?: "BANNER" | "MEDIUM_RECTANGLE" }) {
  return null;
}

export function useGameAds() {
  return {
    rewardedReady: false,
    maybeShowInterstitial: async () => {},
    showRewardedToContinue: async (_onEarned: () => void) => false,
  };
}
