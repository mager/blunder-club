---
version: 1
slug: "src-game-library-view-svelte"
primary_target: "src/GameLibraryView.svelte"
related_targets: ["src/GameReplay.svelte", "src/ProfileGallery.svelte", "src/MiniBoard.svelte", "src/library.css", "src/Root.svelte"]
---

# Game library, replay, and profile surfaces

Mode: Operate. Extend the existing Nextmove design. Preserve the blue and cool-white board, original white and navy SVG pieces, graphite frame, jade actions, DM Sans, and Barlow Condensed notation. The new views use existing materials and controls. No new tokens, raster assets, or visual identity are needed.

## Direction contract

THESIS: Let a player save and revisit a game, keep favorites, and choose exactly what to share. Keep the playable game safe when the player opens a library or replay.

OWN-WORLD: The existing late-night strategy game extends to quiet pages with thin row separators. Final-position boards give each saved game a concrete visual reference. Private facts and public favorites have separate places.

STORY: Paste one PGN, check the moves, choose the played side, and save. Open the finish or replay from the start. Mark favorites and inspect private style facts. Choose a public name and up to eight favorites, inspect the exact preview, then publish. Visitors can open the gallery and replay without an account. The owner can unpublish.

FIRST VIEWPORT: The header keeps My games, Profile, and Back to game. Library and profile pages start with a plain heading and game rows. The owner sees Paste a game and save status, then favorites, private style notes, and sharing controls. These secondary pages may scroll. Replay keeps the board, player strips, controls, and guide within one viewport.

FORM: Use the established board and row system. Avoid a new card grid, dashboard, rating display, or chat area. Final-position previews are 128px wide on larger screens and 88px on small phones. Names and titles wrap. Primary actions remain jade; secondary actions remain plain and compact.

FINISH: Check desktop, phone, and short landscape views. Keep accessible names for icon-only links, visible keyboard focus, legal replay positions, and reduced-motion support. Preserve the original game through navigation and reload.

## Private library and import

My games lists saved imports. Profile lists favorites. Each row shows the final position, title, players, result, and selected side. Open finish opens the last move; Replay opens the start. The favorite control uses text, a star, and a pressed state. Title and side edits use a dialog. Removal names the game and explains the effect on private evidence and any public copy.

Paste a game opens a focused dialog. The PGN field states the one-game and size limits. Check game validates the main line before showing the final board and requiring a side. Duplicate games have a clear notice and count once. Errors stay in the dialog. Close and Escape return focus to the prior control.

Style notes show the sample size, checking moves, captures, first moves, and castling facts for the selected side, with links to source games. The disclosure is open in My games and closed initially in Profile. It states that the notes are private move facts, not a strength rating. Eligible patterns can link to an existing lesson. Imports give no lesson credit.

## Public sharing and gallery

The owner chooses a public name and up to eight favorite games. Preview public profile opens the exact selected gallery in a wide dialog. The dialog states which names, titles, results, sides, and moves become public. Publish profile or Update public profile remains a separate action. New favorites and title changes require another preview and update. Removing a featured game removes its public copy when sync succeeds.

Published owners have Copy public link, View public profile, and Unpublish profile controls. Unpublish removes the public page while retaining private games. Visitors see the chosen public name and selected game rows, with Open finish and Replay. They do not see private style notes, owner editing controls, or Google identity. A missing profile or game has a short message and a return link.

## Replay and responsive behavior

Private and public replay use the same board, move controls, and compact guide. The board is read-only. Player strips show the players, result, and current half-move count. The guide shows the title, current move, check or terminal state, played side, Flip board, and Back to games. The selected move is part of the validated URL and survives refresh.

Desktop places the guide beside the board. Phones place it below. Short landscape retains two columns. The replay column and control row have a 280px minimum width, so the move selector has room even when the board is smaller. The square board and its player strips remain centered within that column. First, previous, next, and last buttons and the move selector retain a 44px minimum height. The focused toolbar accepts Left, Right, Home, and End.

The header hides Back to game text below 761px and wordmark text below 371px. The links keep the accessible names Back to game and Nextmove home. Board previews have named Open finish controls; the inner miniature board is decorative. Title and player text wrap. Gallery pages and owner pages may scroll, as can secondary dialogs. Replay must fit without clipping controls or hiding overflow.

## Evidence and limits

Read PRODUCT.md, DESIGN.md, the existing play brief, and all five new UI source files. Visually inspected the current desktop, mobile, and landscape profile and replay captures, plus mobile-import.png and mobile-owner.png, in `.impeccable/review/`. The captures show the existing palette and pieces, clear game rows, the scrollable owner page, the import dialog, and a complete replay viewport. The current landscape capture shows the full selected move within the wider control row.

The parent implementation session reports passing checks at 1440×900, 320×568, and 844×390, plus keyboard replay, reload, and reduced motion. These checks were not repeated during documentation. Source confirms accessible header names and the 280px replay control width. Static captures do not prove live cloud behavior or keyboard operation. Long titles, expanded style notes, and eight-game galleries were not visually inspected in this documentation pass.

The original play brief retains historical stone/ivory palette wording, a 60px header, and a coach-question reference. Its later sections and current DESIGN.md supersede that history. This extension does not rewrite it. Existing design tokens and `.impeccable/design.json` remain unchanged.

## Social profile extension — November 14, 2026

THESIS: A player presents a small collection of meaningful games, with one game leading the page. The profile is a personal collection rather than a dashboard.

OWN-WORLD: Preserve graphite, jade, DM Sans, original white/navy pieces, and blue/cool-white boards. Use a chess piece as a chosen avatar, a larger board for the spotlight, and the existing thin-rule rows for the collection. No raster assets.

STORY: Save a Nextmove game or import one, choose favorites, add a public name and optional bio/story, inspect the exact page, and publish. A visitor opens a finish, steps through its moves, and copies its link.

FIRST VIEWPORT: A piece avatar sits beside the name and bio, with Copy profile link nearby. Below, a two-column spotlight pairs a large final board with the title, story, result, and replay actions. The remaining collection follows as rows. Phones stack the spotlight. Owner sharing controls precede the private favorite list.

FORM: Extend the established library surface with a spotlight composition; user delegated design judgment with “use your judgement, be creative.” seed: none (pinned). Profile editor is Operate; public gallery is Experience.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.


Verified this extension with the full 25-test browser suite at the three required sizes. Reviewed social-desktop.png, social-mobile.png, social-landscape.png, social-mobile-long.png, social-mobile-editor.png, and the three save-dialog captures. Public profile and editor content remains readable without horizontal overflow; game and replay controls fit their viewports. The independent review found no actionable defect. This extension uses only original SVG/code assets, with no new raster provenance to record.
