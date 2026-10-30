import { Text, View } from "react-native";
import { makeStyles } from "@/src/theme";
import { NativeBanner, nativeAdsAvailable } from "@/src/ads/Ads";

// Real AdMob banners in native builds; dashed placeholders in Expo Go / web preview.
export function AdBanner() {
  const styles = useStyles();
  if (nativeAdsAvailable) {
    return (
      <View style={styles.nativeWrap} testID="ad-banner">
        <NativeBanner size="BANNER" />
      </View>
    );
  }
  return (
    <View style={styles.banner} testID="ad-banner-placeholder">
      <Text style={styles.label}>AD BANNER · 320×50</Text>
    </View>
  );
}

export function AdBox() {
  const styles = useStyles();
  if (nativeAdsAvailable) {
    return (
      <View style={styles.nativeWrap} testID="ad-gameover">
        <NativeBanner size="MEDIUM_RECTANGLE" />
      </View>
    );
  }
  return (
    <View style={styles.box} testID="ad-gameover-placeholder">
      <Text style={styles.label}>AD SPACE · 300×250</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  nativeWrap: { alignItems: "center", alignSelf: "stretch", minHeight: 50 },
  banner: {
    height: 50,
    width: 320,
    maxWidth: "100%",
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
}));
