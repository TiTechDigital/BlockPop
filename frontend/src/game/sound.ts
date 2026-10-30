import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

const SOURCES = {
  place: require("../../assets/sounds/place.wav"),
  clear: require("../../assets/sounds/clear.wav"),
  combo: require("../../assets/sounds/combo.wav"),
  gameover: require("../../assets/sounds/gameover.wav"),
  win: require("../../assets/sounds/win.wav"),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function getPlayer(name: SoundName): AudioPlayer | undefined {
  try {
    if (!players[name]) players[name] = createAudioPlayer(SOURCES[name]);
    return players[name];
  } catch {
    return undefined;
  }
}

export function preloadSounds() {
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  (Object.keys(SOURCES) as SoundName[]).forEach(getPlayer);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const p = getPlayer(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {}
}
