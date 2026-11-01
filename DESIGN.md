---
name: Nextmove
description: A quiet chess game with a concise decision coach.
colors:
  ink: "#151918"
  surface: "#1e2421"
  raised: "#2b332e"
  paper: "#f0f0e9"
  muted: "#aab5ad"
  faint: "#aab5ad"
  line: "#354139"
  acid: "#b8e3b0"
  acid-dark: "#324c38"
  warning: "#e9b28c"
  board-light: "#e7e5d7"
  board-dark: "#819284"
  action-ink: "#1d3223"
  action-hover: "#d0f2c9"
  action-hover-ink: "#15261a"
  piece-light: "#fffdf0"
  piece-dark: "#26342b"
  piece-light-outline: "#354a3b"
  piece-dark-outline: "#eef0dc"
  hint-arrow: "#234a32"
  check: "#d27b67"
  board-focus: "#203728"
typography:
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.16
    letterSpacing: "-0.7px"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    letterSpacing: "-0.5px"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  notation:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "28px"
    fontWeight: 700
rounded:
  board: "3px"
  segment: "4px"
  control: "5px"
  switch: "7px"
  notification: "8px"
  dialog: "12px"
spacing:
  compact: "8px"
  control: "12px"
  inset: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.action-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.action-hover-ink}"
  button-secondary:
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-text:
    textColor: "{colors.muted}"
    padding: "8px 0"
  mode-switch:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.switch}"
    padding: "4px"
  move-choice:
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
  move-choice-selected:
    backgroundColor: "{colors.acid-dark}"
    textColor: "{colors.acid}"
  coach-dock:
    textColor: "{colors.paper}"
    width: "260px"
  chessboard:
    backgroundColor: "{colors.board-dark}"
    rounded: "{rounded.board}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paper}"
    rounded: "{rounded.dialog}"
---

# Design System: Nextmove

## Overview

**Creative North Star: "The late-night strategy game"**

Nextmove uses a quiet, late-night strategy-game frame. Charcoal surfaces surround warm stone squares, ivory pieces, and jade move marks. The board carries the action; short, plain coaching appears when a decision needs support.

The interface uses code, SVG pieces, and line icons. It has no raster texture or decorative image layer. Type, color, and motion help the player read the next move.

**Key Characteristics:**
- A large, clear board within a quiet charcoal frame.
- Jade actions and warm warning states.
- DM Sans cues with condensed chess notation.
- Small control groups and explanations that open on request.

## Colors

### Primary
Jade (`acid` in CSS) marks primary actions, turn status, focus, and current progress. Deep jade (`acid-dark`) supports selected move options. The legacy variable names remain; their old yellow values do not.

### Secondary
Warm warning identifies a mistake or a move under review. Check uses its own coral board state. Pair these colors with text, position, or shape.

### Neutral
Charcoal ink is the page. Surface and raised provide quiet panel and hover layers. Paper is primary text; muted and faint currently share the same readable value. Line separates controls and rows. Warm stone and gray-green form the board. Light and dark pieces each have a contrasting outline.

**The State Rule.** Use color to reinforce a visible state, not as its only signal.

## Typography

DM Sans carries the wordmark, headings, controls, and coaching. Barlow Condensed carries selected chess notation only: replies, move choices, turning points, and saved positions. The move sheet uses DM Sans with tabular numbers.

The headline and body tokens describe the desktop coach. The headline becomes 32px on large screens, 26px at the intermediate breakpoint, and 20px on phones and in short landscape windows. Phone headings use a 1.15 line height. Phone and short-landscape coach body text is 13px with a 1.4 line height. Dialog titles use the title token. The wordmark is 25px and weight 700, then 22px or 20px on phones. Labels range from 11–13px. Use small type for supporting state, not long teaching text.

**The Plain Cue Rule.** Keep coaching in sentence case and plain type. Reserve condensed type for chess notation.

## Layout

The play shell uses the full dynamic viewport height (100dvh). The header and play stage share a centered container of at most 1600px. The header is 56px high, with 36px horizontal padding, reduced to 24px at widths of 1050px or less. The stage fills the space below it. On desktop, the board and a 260px coach dock use two columns with a 32px gap. Stage padding is 8px above, 24px at each side, and at least 12px below, including the safe-area inset.

The board fits the space that remains after the player strips, toolbar or replay controls, guide, gaps, and padding. ResizeObserver measures the stage, board column, and guide; window and visual-viewport resize events also update the size. The square uses the smaller available width or height, capped at 720px with an 80px lower bound. Its size can change when the guide content changes. Player strips sit directly above and below it, with a 32px minimum height on desktop. The toolbar follows without an extra margin.

At widths of 760px or less, the header is 48px high. The stage stacks the board and guide within 560px, with 14px side padding, a 10px gap, and at least 8px bottom clearance including the safe-area inset. The guide fills the column up to 480px, with 4px side padding. Player strips have a 26px minimum height. The board uses the remaining height after the guide, so the guide and main decisions stay visible together. The page has a 320px minimum width.

Short landscape windows use two columns when width is at least 640px and height is at most 540px. This stage is at most 1100px wide, with a 240px guide, a 24px gap, 20px side padding, 4px top padding, and at least 8px bottom clearance. Compact guide text and 26px player strips leave space for the board.

**The One Screen Rule.** Keep the board, guide, and main controls visible without page scrolling. Resize the board to fit the available space; do not clip page overflow to hide controls. Pause actions appear once in the guide, with no duplicate sticky action row.

Dialogs are at most 460px wide, or 700px for practice and saved positions, with 14px minimum side clearance. Their headers stay visible while content scrolls. The journey dialog is at most 900px wide and 740px high, with 14px side clearance and 16px top and bottom clearance. Its connected map uses three columns and two rows. At widths of 600px or less, it uses two columns and three rows, with the selected detail below. At widths of at least 601px and heights of at most 520px, the map and a 250px detail column sit side by side. The summary spans both columns. At widths of 600px or less and heights of 620px or less, the journey height is `calc(100dvh - 16px)`. Header top padding and body bottom padding reduce to 8px; the detail gap is 8px. Keep all six places, the selected detail, and its lesson action visible together.

The lesson picker uses the existing wide secondary dialog. Its skill selector and lesson count wrap onto separate lines when needed. The selector fills the available width and keeps a 44px minimum height. Openings and Challenges use separate row groups with a 24px gap; the page itself does not become a lesson catalog.

## Elevation & Depth

Tonal layers and thin borders carry most depth. The coach sits directly on the page rather than in a card. Shadows ground the board, dialogs, and notification only. The exact shadow values live in the sidecar. Dialogs use a dark backdrop; there is no grain overlay.

Buttons change background and text color over 150ms. A hint arrow draws over 320ms. Journey markers change background and border color over 180ms. Busy status breathes over 1s; the analysis line moves over 1.2s. Reduced-motion mode removes animations and transitions. Motion communicates state, not atmosphere.

## Shapes

The board has nearly square corners. Controls have a small curve; dialogs have a larger curve. Circular guide marks, status dots, legal-move dots, and capture rings carry distinct meanings. Progress uses short horizontal bars. Keep the board and functional surfaces aligned, with no decorative rotation.

## Components

### Buttons
Primary actions use jade with dark text. Primary and secondary buttons have a 44px minimum height; secondary actions use a thin line border and raised hover fill. Text actions remain muted until hover. Disabled buttons use 0.4 opacity. Focus uses a 2px jade outline with a 4px offset. Icon controls are 42px square.

### Coach and move choices
A small circular guide mark introduces one short cue and a brief explanation. Show hint is the primary action when the board is ready and no hint is open. A hint reveals a board arrow and, outside authored lessons, selectable move choices. The selected choice has a deep-jade fill and a visible border. Play followed by the move notation is the primary action; Why? opens its explanation in a focused dialog. Lesson progress uses one bar per authored player move. On phones, guide spacing is reduced: 4px below the identity row and heading, then 6px before actions. Primary actions retain their 44px minimum height; move choices use a 40px minimum height.

Warnings use a warm guide mark and heading. The cue names the candidate move, the opponent’s concrete reply, and a better move to compare. Show a move returns to the original position and reveals a hint. Play anyway commits the candidate. Pause warnings returns to play and changes coaching to review after the game. Compare candidates from the same engine search when available; do not warn against the engine’s own first recommendation. Missed gains within an already large advantage do not create repeated warnings. After-move review retains Try again, See the reply, Play on, and Why? as appropriate.

Ask Rook and its question form are removed. What’s the threat? opens a concise threat check in the same explanation dialog used by Why?. Keep this direct help beside the board.

### Header, toolbar, and modes
The header contains the wordmark, session selector, Journey control, and account access. Journey keeps an accessible map icon when its text is hidden on narrow screens. Account text collapses to an accessible icon on phones. The board toolbar has three labeled controls. During a warning or review, Before, the candidate move, and Their reply replace the normal toolbar alongside More. These replay controls have a 44px minimum height; the Preview label is hidden on phones and in short landscape windows. Before a mistake, After a mistake, and After the game use a dark segmented control with a raised, jade-text active segment and an `aria-pressed` state. Practice selection, saved positions, account, and move history open in dialogs. Personal practice runs on the main board.

### Chessboard
The board is a square eight-column grid. SVG pieces occupy 81% of each square and have contrasting outlines and a small shadow. Rank and file labels sit inside the outer squares. Selection has a filled square and inset outline; legal destinations use dots; captures use rings. Last move, hint, and check have separate fills. A dark SVG arrow points from the hinted piece to its destination.

Each square has an accessible piece-and-square label. Arrow keys move focus; Enter selects a piece or destination; Escape clears selection. The focused square uses a dark inset outline. Retain disabled and pressed semantics while play pauses.

### Game summary
The guide shows one main turning point. A paused game offers Keep playing. A completed game with a turning point makes Practice this the primary action; a game without one offers Play again. Full review opens all turning points and Practice my mistakes in a dialog when saved positions are available. Selecting a turning point closes the dialog and starts its board review.

### Personal practice
Your second chance uses the existing board and decision coach. The opponent strip shows the session name and position count, such as 1 / 3. A session contains up to three distinct saved positions. Unsolved positions come first; recurrence and recency help order them. The answer stays hidden until the player requests a hint or explanation. Saved rows show the mistake name and practice result; What happened? keeps the original move and answer inside a closed disclosure.

The player makes a legal move on the board. The engine checks the move and accepts sound alternatives to its first choice. During this check, the board pauses and the status says Checking your move. An incorrect move with an engine reply opens the existing Before / candidate move / Their reply controls. The guide offers Try again and, when a reply is available, See the reply. Retry restores the same position without clearing the attempt or help history.

An accepted first attempt without a hint or coach help shows You found it. A solution after help or another attempt shows Now you see it. Both show the accepted move, a primary Next position action, and a secondary Why? action. The last position changes the primary action to Finish practice. Completion shows the number solved and the number solved without help, followed by one primary Back to game action. Use these results as practice evidence, with no rating or mastery claim.

Back to game replaces Undo during the session; More also provides a return action, including during reply review. Back to game restores the original game while saved attempt and solution evidence remains. Refresh reopens the active URL position as a practice session; it does not resume the previous temporary queue. Back to game still returns to the saved original game. Personal practice uses the existing colors, type, buttons, replay controls, and responsive board sizing; it adds no tokens or permanent panels. Keep the board, guide, and decisions within one viewport in answer, retry, and completion states.

### Authored lessons
The same board supports 25 authored lessons: three openings and 22 challenges. Practice opens a compact picker; Explore lessons in the journey opens it with the selected skill. A native select filters by the lesson skill or any step skill. Rows show the lesson title, number of player moves, level, and saved completion state. Titles use 16px medium type; details use 12px muted type. Thin separators and 14px vertical padding keep rows compact. An arrow marks a lesson that has no independent completion; a jade check accompanies Solved without help. Solved with help remains explicit text.

Starting a lesson opens a new board. The picker states this and tells the player to bookmark the current game to return. The opponent strip shows Opening lesson or Practice challenge and the current step count. The coach gives one short task at a time. Each accepted move can trigger an authored opponent reply; multi-move tactics continue to the required follow-up. Optional hints draw the existing arrow and reveal Play with the move notation and Why?. A legal move outside the accepted lesson choices shows Try again and Show hint. Stalemate has its own explanation. Retry restores the step while retaining help and mistake evidence.

Completion uses You found it for a recorded run without help or mistakes, and Now you see it for assisted runs. Saved results distinguish completions from independent completions. Next lesson is primary and first selects an unsolved lesson with the same main skill, then the next lesson in the full sequence. Try without hints repeats the lesson. Play from here appears only when the board is not terminal. These are records of completed practice, with no mastery claim. All states use the existing board, coach, buttons, progress bars, and palette.

### Dialogs and saved rows
Move explanations, threat checks, and full game review use the same dialog surface as secondary tasks. Dialogs use the surface color, a thin line border, a sticky header, and a close control. Practice choices and saved positions use separated rows rather than elevated cards. Promotion uses the same dialog material with four piece buttons. Notifications use the raised color and a dismiss action.

### Connected journey
The Journey control opens six connected places in the existing dialog material: Center square, Knight outpost, King’s keep, The lookout, Safe ground, and Fork road. `SkillMap.svelte` supplies the map and selected detail; `journey.ts` derives evidence from saved positions, practiced skills, and authored lesson results. Circular line icons replace the old skill cards. Neutral dashed paths show connections; solid jade paths touch the selected place. Selection uses a deep-jade marker with a jade border and an `aria-pressed` state. A small check marks independent saved-position or lesson evidence. The check uses ink on jade. All places remain available.

The summary shows places explored and challenges solved without help. It combines distinct independent saved positions with distinct independent authored lessons. A place is explored through saved practice evidence, the practiced skill list, or a completed matching lesson; selecting a marker alone does not count. Each detail shows the chess concept, one short cue, completed lessons out of the matching curriculum, and lessons solved without help. Lessons can match more than one skill through their steps. Unsolved saved positions produce the to-revisit label. Counts measure distinct lessons or positions, not repeated attempts. These are records of practice, not mastery or a rating.

Explore lessons is the primary action for each selected place. Revisit my positions is a secondary text action when matching saved positions exist. Personal practice returns to the original game. The action group uses a 6px gap. This map uses the existing color, type, focus, button, and dialog system; it adds no permanent panel to play.

### Revisitable views
`routes.ts` and `App.svelte` keep the current board and view in a hash URL. Routes cover free play, all three openings, all 22 challenges, and saved positions. Each authored lesson has a stable ID: openings use `#/learn/<id>` and challenges use `#/practice/<id>`. The selected skill remains in the URL for both the journey and lesson picker. Parameters retain legal move history, open panels, selected journey place, reports, review move and replay stage, pending candidates, and explanations. Hints include the exact legal UCI move, so refreshed analysis does not silently change the selected arrow or Play action. Copy link in More copies the current view. Browser navigation and refresh reopen these views; URLs exclude account identifiers and private learning records. Invalid links show a brief notice and keep the saved game available.

## Do's and Don'ts

### Do:
- **Do** keep the board, pieces, destinations, and hint arrow clear at phone size.
- **Do** use jade for actions and current state, with labels or shapes for meaning.
- **Do** keep the coach concise and put longer move explanations and threat checks in dialogs.
- **Do** fit the board, guide, and main controls in one window without page scrolling.
- **Do** preserve keyboard focus, accessible labels, and reduced-motion support.

### Don't:
- **Don't** restore the old olive, acid-yellow, grain, or tilted-mark identity.
- **Don't** add a welcome hero, slogans, or a permanent lesson dashboard to play.
- **Don't** use condensed type for headings or teaching prose.
- **Don't** rely on color alone to explain legal moves, check, or selection.
