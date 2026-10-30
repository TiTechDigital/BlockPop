import { Text, View } from "react-native";
import { makeStyles } from "@/src/theme";

// Placeholder ad spaces. Replace the inner content with your ad SDK component later.
export function AdBanner() {
  const styles = useStyles();
  return (
    <View style={styles.banner} testID="ad-banner-placeholder">
      <Text style={styles.label}>AD BANNER · 320×50</Text>
    </View>
  );
}

export function AdBox() {
  const styles = useStyles();
  return (
    <View style={styles.box} testID="ad-gameover-placeholder">
      <Text style={styles.label}>AD SPACE · 300×250</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
    aspectRatio: 300 / 250,
    maxHeight: 220,
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
