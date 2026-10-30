import { createElement, useEffect, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS, INTERSTITIAL_EVERY } from "./config";

// AdMob is a native module: it only exists in real (development/release) builds.
// In Expo Go we skip loading it so the game keeps working without ads.
let ads: any = null;
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    ads = require("react-native-google-mobile-ads");
  } catch {
    ads = null;
  }
}

let interstitial: any = null;
let rewarded: any = null;
if (ads) {
  try {
    const opts = { requestNonPersonalizedAdsOnly: true };
    interstitial = ads.InterstitialAd.createForAdRequest(AD_UNITS.interstitial ?? ads.TestIds.INTERSTITIAL, opts);
    rewarded = ads.RewardedAd.createForAdRequest(AD_UNITS.rewarded ?? ads.TestIds.REWARDED, opts);
  } catch {
    ads = null;
  }
}

export const nativeAdsAvailable = !!ads;

let initPromise: Promise<void> | null = null;
function init(): Promise<void> {
  if (!ads) return Promise.resolve();
  if (!initPromise) {
    const mobileAds = ads.default ?? ads.mobileAds;
    initPromise = mobileAds().initialize().then(() => undefined).catch(() => undefined);
  }
  return initPromise as Promise<void>;
}

let interstitialCounter = 0;

export function NativeBanner({ size = "BANNER" }: { size?: "BANNER" | "MEDIUM_RECTANGLE" }) {
  if (!ads) return null;
  return createElement(ads.BannerAd, {
    unitId: AD_UNITS.banner ?? ads.TestIds.BANNER,
    size: ads.BannerAdSize[size],
    requestOptions: { requestNonPersonalizedAdsOnly: true },
  });
}

export function useGameAds() {
  const [rewardedReady, setRewardedReady] = useState(false);
  const interstitialReady = useRef(false);

  useEffect(() => {
    if (!ads) return;
    let active = true;
    const subs: (() => void)[] = [
      interstitial.addAdEventListener(ads.AdEventType.LOADED, () => (interstitialReady.current = true)),
      interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
        interstitialReady.current = false;
        interstitial.load();
      }),
      interstitial.addAdEventListener(ads.AdEventType.ERROR, () => (interstitialReady.current = false)),
      rewarded.addAdEventListener(ads.RewardedAdEventType.LOADED, () => active && setRewardedReady(true)),
      rewarded.addAdEventListener(ads.AdEventType.CLOSED, () => {
        if (active) setRewardedReady(false);
        rewarded.load();
      }),
      rewarded.addAdEventListener(ads.AdEventType.ERROR, () => active && setRewardedReady(false)),
    ];
    interstitialReady.current = !!interstitial.loaded;
    setRewardedReady(!!rewarded.loaded);
    init().then(() => {
      if (!interstitial.loaded) interstitial.load();
      if (!rewarded.loaded) rewarded.load();
    });
    return () => {
      active = false;
      subs.forEach((u) => u());
    };
  }, []);

  // Frequency-capped full-screen ad between games.
  const maybeShowInterstitial = async () => {
    if (!ads) return;
    interstitialCounter += 1;
    if (interstitialCounter % INTERSTITIAL_EVERY !== 0 || !interstitialReady.current) return;
    interstitialReady.current = false;
    try {
      await interstitial.show();
    } catch {
      interstitial.load();
    }
  };

  // Reward is applied only after the ad closes AND the reward was earned.
  const showRewardedToContinue = (onEarned: () => void) =>
    new Promise<boolean>((resolve) => {
      if (!ads || !rewardedReady) return resolve(false);
      let earned = false;
      const u1 = rewarded.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => (earned = true));
      const u2 = rewarded.addAdEventListener(ads.AdEventType.CLOSED, () => {
        u1();
        u2();
        if (earned) onEarned();
        resolve(earned);
      });
      setRewardedReady(false);
      rewarded.show().catch(() => {
        u1();
        u2();
        rewarded.load();
        resolve(false);
      });
    });

  return { rewardedReady, maybeShowInterstitial, showRewardedToContinue };
}
