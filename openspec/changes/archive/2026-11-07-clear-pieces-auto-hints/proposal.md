# Proposal

## Why
The user finds the pieces unclear, especially the king, and wants hints to appear automatically with an off setting.

## What Changes
- Redraw the six original SVG pieces with classic silhouettes and a taller, broader king with a large cross.
- Show a hint on each ready player turn by default. Add a saved Automatic hints switch in Coach settings.
- Keep manual hints, honest assistance evidence, and explicit attempts without hints.

## Capabilities
### New Capabilities
None.
### Modified Capabilities
- `board-presentation`: prominent king and clearer piece hierarchy.
- `play-and-coaching`: automatic hints and saved opt-out.
- `authored-lessons`: automatic help evidence and recall override.

## Impact
Piece.svelte, App.svelte, progress normalization, browser tests, product/design documentation. No new dependencies, assets, services, curriculum, or layout changes.
