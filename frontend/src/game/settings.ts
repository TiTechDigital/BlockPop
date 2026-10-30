import { useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { setSoundEnabled } from "./sound";

const SOUND_KEY = "bb_sound";
const HAPTICS_KEY = "bb_haptics";

export function useSettings() {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, h] = await Promise.all([storage.getItem(SOUND_KEY, true as boolean), storage.getItem(HAPTICS_KEY, true as boolean)]);
      setSound(s !== false);
      setHaptics(h !== false);
      setSoundEnabled(s !== false);
    })();
  }, []);

  const toggleSound = (v: boolean) => {
    setSound(v);
    setSoundEnabled(v);
    storage.setItem(SOUND_KEY, v);
  };
  const toggleHaptics = (v: boolean) => {
    setHaptics(v);
    storage.setItem(HAPTICS_KEY, v);
  };

  return { sound, haptics, toggleSound, toggleHaptics };
}
