## Why
A stuck learner needs a useful hint without a wall of text. Existing Italian hints were generic and wrong-attempt screens gave Try again priority.

## What Changes
- Show a short, position-specific cue after an off-lesson move.
- Make Show hint the primary recovery action in authored and personal practice.
- Restore the position before displaying the hint arrow and Play action.
- Show the authored hint when it is requested; keep full reasoning behind Why.

## Capabilities
### New Capabilities
None.
### Modified Capabilities
- `authored-lessons`: concise hints and direct recovery after a wrong move.

## Impact
App.svelte, Italian hint copy in openings.ts, and product/design documentation. No move acceptance or save schema changes.
