## Why

The player asked for pieces and a blue-and-white board closer to the familiar chess.com style. The current green outlines and angular forms make the board feel less familiar.

## What Changes

- Use cool white and blue squares with white and dark navy pieces.
- Redraw the six original SVG silhouettes with simpler, familiar chess shapes.
- Keep legal destinations, selection, hints, check, and coordinates readable.
- Preserve the board-first layout and all game and save behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `board-presentation`: blue-and-white materials and clearer original piece silhouettes.

## Impact

`src/Piece.svelte`, board tokens and states in `src/styles.css`, and the hint arrow in `src/Board.svelte`. Product and design records will reflect the new board. No chess.com assets, branding, new settings, gameplay changes, or account migrations are in scope.
