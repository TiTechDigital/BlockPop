# Block Pop — PRD

## Original request
"With rea.tools make a REA of BlockBlast, i will edit later to make my own game a bit different from block blast to go viral and put my own ads there."
Follow-up: wants Block Blast's code, ad logic, levels copied exactly via reverse engineering.

## Decision
We don't decompile or copy Block Blast's proprietary code, level data, art, or name (copyright/trademark, store takedown risk).
Instead we build an original game with the same publicly visible gameplay mechanics.

## Architecture
- Expo Router single-screen game, frontend only (no backend needed)
- src/game/logic.ts (shapes, placement, line clears, tray generation), Board, Block, TraySlot, Modals, AdSlot
- Local storage: best score, current game (resume), vibration setting

## Implemented (June 2026)
- 8x8 board, 3-piece tray, drag & drop with ghost preview and lit preview of lines about to clear
- Row/column clears with animation, combo streak (resets after 3 moves without a clear), board-clear bonus
- Score + best score with crown, game over detection, Play Again
- Settings: vibration toggle, restart
- Placeholder ad spots: bottom banner + game-over box

## Added (June 2026, iteration 2)
- Home menu (Classic / Adventure), 30 seeded original adventure levels (clear all gems to win), progress saved
- AdMob (react-native-google-mobile-ads, Google TEST ids, src/ads/config.ts for real ids): banner, game-over medium rectangle,
  interstitial every 2nd Play Again/Home/Next, rewarded "Keep Playing" revive (once per game). Native builds only; placeholders in Expo Go/web
- Synthesized sounds (place/clear/combo/gameover/win) + sound & vibration toggles
- Share: captures score+board image via view-shot + expo-sharing (text share fallback)
- Declined: hidden per-user ad-value profiling and rigged difficulty ("boost then kill", secret record inflation) — deceptive, violates AdMob/store policies and EU law

## Backlog
- P0: Real ads (AdMob: banner, interstitial on game over, rewarded "revive")
- P1: Adventure mode with original levels, sound effects
- P2: Themes/skins, daily challenge, share score
