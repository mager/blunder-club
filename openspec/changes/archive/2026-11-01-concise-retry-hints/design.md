## Context
Hints already draw an arrow and provide Play. Authored hint text was not shown in the main cue, and Italian hints repeated a generic instruction.

## Goals / Non-Goals
Help a stuck learner in one action with little text. Do not add chat, timers, automatic moves, or unsolicited answer overlays.

## Decisions
Show a brief authored cue after a wrong lesson move. Show hint restores the original position, waits for analysis where needed, and reveals the arrow and Play action. A request ID prevents a late hint from affecting a replacement game. Keep Try again available for an unaided attempt. Existing helped/mistake tracking governs credit.

## Risks / Trade-offs
A cue reveals some information; a wrong attempt already prevents independent credit. Long explanations remain behind Why. Free-game review offers Show hint alongside its existing consequence flow.
