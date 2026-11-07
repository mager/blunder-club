# Proposal

## Why
The hint dominates the board, and the user wants several good moves to consider.

## What Changes
- Make the hint arrow, endpoints, and Play action quieter while keeping them clear.
- Offer up to three legal moves close to the best engine result, preserving forced mates.
- Offer authored alternatives and verified checkmates when the lesson permits them.
- Selecting a choice changes the preview, explanation, and Play action; it never plays automatically.

## Capabilities
### New Capabilities
None.
### Modified Capabilities
- `board-presentation`: subtle readable hints.
- `play-and-coaching`: quality-filtered move options.
- `authored-lessons`: accepted alternatives in hints.

## Impact
Board.svelte, styles.css, App.svelte, a small hint-selection helper and tests. Existing hint settings, saved evidence, pieces, board palette, and routes remain. No new dependencies or curriculum.
