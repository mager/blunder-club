## Context
New game was inside More. Lessons had no direct restart control.

## Goals / Non-Goals
Expose reset beside the board while preserving the single-screen game. Do not add a second toolbar, change chess rules, or clear accumulated learning evidence.

## Decisions
Use the opponent strip for a short, underlined text button. Open the existing new-session dialog. In lessons, offer the current lesson first, then a full-board game. Keep playing and Escape close the dialog without resetting. Reuse start(), which invalidates pending analysis and preserves study results and saved positions.

## Risks / Trade-offs
A reset replaces active moves. The dialog names that consequence before the player confirms. Personal practice retains its Back to game action and preserved game.
