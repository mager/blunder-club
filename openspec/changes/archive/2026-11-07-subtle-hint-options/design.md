# Design

## Direction
Use a thin navy arrow with a smaller head, low-opacity warm endpoints, compact outlined move choices, and a secondary Play control. Keep one selected arrow; simultaneous arrows obscure pieces. Keep 44px controls and readable contrast. The existing palette and original pieces remain.

## Move selection
Add a pure hints.ts helper. Engine choices must be legal, unique, and within 60 centipawns of the best available line, capped at three. A forced winning mate only permits other forced winning mates. A forced loss only offers lines that delay mate at least as long as the best available line. Do not add a losing mate to a non-mating best line. Reject immediate draws when the best line retains a clear advantage. Labels say Moves to consider, not guaranteed best or only move.

Authored hints use the expected move, declared alternatives, and other legal mates only when mate is the goal. Cap at three. Do not add engine moves that fail the lesson goal. Alternate selections must drive their own arrow, SAN including promotion, Play action, and accurate explanation. Preserve a selected legal lesson move on reload if it is accepted by the step.

Reuse default-on preference and help evidence. Switching a choice is help; selecting it does not play. Preserve manual hide, disabled settings, recall, and warning/review behavior. Keep existing legal linked hints restorable even if a later engine search changes its score.

## Validation
Unit-test quality boundaries, losing/winning mate cases, invalid/duplicate moves, authored alternatives, and mate goals. Browser-test multiple choices, keyboard preview, no move on selection, exact reload, alternative lesson completion, single forced lesson, small layouts, and existing hint settings. Run build, tests, strict specs, visual inspection and review. Commit/push, publish, verify production, archive and update handoff.
