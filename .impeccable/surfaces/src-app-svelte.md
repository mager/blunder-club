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


## Single-screen play (current layout)
The user rejected scrolling during play. The game now occupies 100dvh, with a 56px header (48px on narrow screens). ResizeObserver measures the guide and board controls, then uses the remaining width and height for the square board. On narrow screens the compact guide remains below the board; short landscape windows use two columns. Primary decisions remain visible together. The former duplicate sticky pause actions are removed. Longer hint explanations and coach questions open in focused dialogs. The end summary shows the main turning point; Full review opens the remaining points and practice action. No page overflow is clipped to conceal missing controls. Verified via resized Chromium viewports: 320×568, 390×844, 471×611, 844×390, 1440×900.

## Personal practice extension
Preserve the one-screen game and existing materials. Your second chance is a short detour through up to three saved mistakes, with the answer hidden until requested. Unsolved recurring positions come first. The same board takes a decision, shows the result, offers retry or the next position, then returns to the original game. The guide distinguishes independent solutions from assisted ones without ratings or mastery claims. Engine analysis accepts sound alternatives. Game progress remains the original position during practice. The URL reopens the active practice position after refresh, with a return to the saved original game. Session progress occupies the existing opponent strip; no dashboard, new card system, or extra permanent chrome.

## Useful warnings, visible hints, and journey links
Preserve the approved board-first world. The user reported repeated Rethink warnings, requested prominent hints, and asked for revisitable URLs. Warnings compare candidates from the same search when possible, ignore missed improvements within an already large advantage, and offer Show a move / Play anyway / Pause warnings. Hints and their Play move button sit in the guide. URLs retain legal board history, selected view, hint, pending candidate, and review position; they exclude account details and private learning records.

The user then removed Ask Rook and requested a world-like journey. A header map control opens six connected named places, with original chess concepts in the selected detail. Exploration and solved-position evidence come from existing saved data. All places stay open. The selected place has its own URL; starting personal practice preserves the current game. Graph lines and circular Lucide markers replace the hidden card map, using existing palette, focus, buttons, and dialog patterns. Phone layout has two columns and three rows; desktop has three columns and two rows. No new raster assets.

Short landscape windows put the selected detail beside the six-place map. Verified at 844×390 with no document or dialog overflow. Hint links store and validate the exact UCI move, so a refreshed analysis cannot silently replace the selected suggestion.
