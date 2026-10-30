# Helper snippet (reference) used inside browser_automation scripts for dragging Block Pop pieces
# drop(i, r, c): reads tray from localStorage bb_game_state (classic) or uses piece dims passed, and drags
# pointer so that piece top-left lands at board cell (r, c):
#   ax = boardX + c*cell + pw/2 ; ay = boardY + r*cell + ph + 1.3*cell
