---
version: 1
slug: "src-app-svelte"
primary_target: "src/App.svelte"
related_targets: ["src/styles.css","src/Board.svelte"]
---

# Play surface
Mode: Operate. User explicitly requests a replacement world with the board as the main interface, minimal text, and a guide at decision points. Name approved: Nextmove. Code-led implementation; preserve chess, account saves, and practice.

## Direction contract
THESIS: Play is the entire front door. No welcome section, slogans, visible lesson catalog, or permanent suggestion list.
OWN-WORLD: A late-night handheld strategy game: graphite frame, warm stone squares, ivory pieces, jade move marks. DM Sans for short cues, condensed numerals only for chess notation. Slim controls and one compact coach beside the board.
STORY: Select a piece, read its legal destinations, make a move. A mistake pauses the game with a concrete consequence. Retry or play on. Hints reveal a board arrow; explanation is opt-in.
FIRST VIEWPORT: A 60px top bar, board sized from the available viewport height, opponent and player strips. A 260px coach dock at the board's side on desktop, directly underneath on phones. Three controls: hint, undo, game menu. Signature interaction: a hint draws a directional arrow from piece to target; choosing another idea changes that arrow.
FORM: Grounded directions: (1) park chess table, (2) tournament broadcast, (3) handheld strategy-game HUD, (4) chess puzzle folio, (5) boxing corner, (6) music practice score, (7) arcade cabinet. Candidate 3; seed 35fb3c02. Brief pins board-first composition. Split-flap declined: adds text but lends stable status placement. Labanotation declined: chess grid must stay literal, lends spatial teaching. Crouwel declined: type should recede, lends strict alignment. Other catalog surfaces do not improve chess clarity over the selected HUD. User approved Nextmove after the direction was stated.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance


## Board rehearsal extension
The user requested Impeccable overdrive, continued iteration without routine questions, real wins and losses, optional warnings, and full games. Preserve the approved visual world. The signature extension is a three-step board rehearsal: Before, the candidate move, and the engine reply. The live game stays separate. Replay controls replace the normal toolbar to preserve board size. Adjacent moves glide for 240ms, including the rook during castling; reduced motion uses an immediate update. Coaching timing and opponent strength are separate choices in More. No rating claims, confetti, or extra dashboard.
