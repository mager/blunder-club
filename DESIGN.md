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
  question-input:
    textColor: "{colors.paper}"
    padding: "12px 0"
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

The headline and body tokens describe the desktop coach. The headline becomes 32px on large screens, 26px at the intermediate breakpoint, and 20px on phones and in short landscape windows. Phone headings use a 1.15 line height. Phone and short-landscape coach body text is 13px with a 1.4 line height. Dialog titles use the title token. The wordmark is 25px and weight 700, then 22px or 20px on phones. Labels range from 11–13px. Question inputs stay at 16px. Use small type for supporting state, not long teaching text.

**The Plain Cue Rule.** Keep coaching in sentence case and plain type. Reserve condensed type for chess notation.

## Layout

The play shell uses the full dynamic viewport height (100dvh). The header and play stage share a centered container of at most 1600px. The header is 56px high, with 36px horizontal padding, reduced to 24px at widths of 1050px or less. The stage fills the space below it. On desktop, the board and a 260px coach dock use two columns with a 32px gap. Stage padding is 8px above, 24px at each side, and at least 12px below, including the safe-area inset.

The board fits the space that remains after the player strips, toolbar or replay controls, guide, gaps, and padding. ResizeObserver measures the stage, board column, and guide; window and visual-viewport resize events also update the size. The square uses the smaller available width or height, capped at 720px with an 80px lower bound. Its size can change when the guide content changes. Player strips sit directly above and below it, with a 32px minimum height on desktop. The toolbar follows without an extra margin.

At widths of 760px or less, the header is 48px high. The stage stacks the board and guide within 560px, with 14px side padding, a 10px gap, and at least 8px bottom clearance including the safe-area inset. The guide fills the column up to 480px, with 4px side padding. Player strips have a 26px minimum height. The board uses the remaining height after the guide, so the guide and main decisions stay visible together. The page has a 320px minimum width.

Short landscape windows use two columns when width is at least 640px and height is at most 540px. This stage is at most 1100px wide, with a 240px guide, a 24px gap, 20px side padding, 4px top padding, and at least 8px bottom clearance. Compact guide text and 26px player strips leave space for the board.

**The One Screen Rule.** Keep the board, guide, and main controls visible without page scrolling. Resize the board to fit the available space; do not clip page overflow to hide controls. Pause actions appear once in the guide, with no duplicate sticky action row.

Dialogs are at most 460px wide, or 700px for practice and saved positions, with 14px minimum side clearance. Their headers stay visible while content scrolls. The learning map changes to two columns on phones.

## Elevation & Depth

Tonal layers and thin borders carry most depth. The coach sits directly on the page rather than in a card. Shadows ground the board, dialogs, and notification only. The exact shadow values live in the sidecar. Dialogs use a dark backdrop; there is no grain overlay.

Buttons change background and text color over 150ms. A hint arrow draws over 320ms. Busy status breathes over 1s; the analysis line moves over 1.2s. Reduced-motion mode removes animations and transitions. Motion communicates state, not atmosphere.

## Shapes

The board has nearly square corners. Controls have a small curve; dialogs have a larger curve. Circular guide marks, status dots, legal-move dots, and capture rings carry distinct meanings. Progress uses short horizontal bars. Keep the board and functional surfaces aligned, with no decorative rotation.

## Components

### Buttons
Primary actions use jade with dark text. Primary and secondary buttons have a 44px minimum height; secondary actions use a thin line border and raised hover fill. Text actions remain muted until hover. Disabled buttons use 0.4 opacity. Focus uses a 2px jade outline with a 4px offset. Icon controls are 42px square.

### Coach and move choices
A small circular guide mark introduces one short cue and a brief explanation. Mistake review changes the guide mark and heading to warm warning. Retry and continue actions stay together. Longer move explanations open in a focused dialog through Why? or Why this move? Hints reveal an arrow and optional move choices; the selected choice has a deep-jade fill and a visible border. Play and Why? share a compact action row. Opening progress uses six bars. On phones, guide spacing is reduced: 4px below the identity row and heading, then 6px before actions. Primary actions retain their 44px minimum height; move choices use a 40px minimum height.

### Question input
Ask Rook and What’s the threat? open the coach dialog. The optional question form stays in that dialog and uses an unfilled field with a bottom border, an adjacent send button, and an accessible label. Preserve the global focus outline and readable placeholder.

### Header, toolbar, and modes
The header contains the wordmark, session selector, and account access. Account text collapses to an accessible icon on phones. The board toolbar has three labeled controls. During a warning or review, Before, the candidate move, and Their reply replace the normal toolbar alongside More. These replay controls have a 44px minimum height; the Preview label is hidden on phones and in short landscape windows. Coaching modes use a dark segmented control with a raised, jade-text active segment and an `aria-pressed` state. Practice selection, saved positions, account, and move history open in dialogs. Personal practice runs on the main board.

### Chessboard
The board is a square eight-column grid. SVG pieces occupy 81% of each square and have contrasting outlines and a small shadow. Rank and file labels sit inside the outer squares. Selection has a filled square and inset outline; legal destinations use dots; captures use rings. Last move, hint, and check have separate fills. A dark SVG arrow points from the hinted piece to its destination.

Each square has an accessible piece-and-square label. Arrow keys move focus; Enter selects a piece or destination; Escape clears selection. The focused square uses a dark inset outline. Retain disabled and pressed semantics while play pauses.

### Game summary
The guide shows one main turning point. A paused game offers Keep playing. A completed game with a turning point makes Practice this the primary action; a game without one offers Play again. Full review opens all turning points and Practice my mistakes in a dialog when saved positions are available. Selecting a turning point closes the dialog and starts its board review.

### Personal practice
Your second chance uses the existing board and decision coach. The opponent strip shows the session name and position count, such as 1 / 3. A session contains up to three distinct saved positions. Unsolved positions come first; recurrence and recency help order them. The answer stays hidden until the player requests a hint or explanation. Saved rows show the mistake name and practice result; What happened? keeps the original move and answer inside a closed disclosure.

The player makes a legal move on the board. The engine checks the move and accepts sound alternatives to its first choice. During this check, the board pauses and the status says Checking your move. An incorrect move with an engine reply opens the existing Before / candidate move / Their reply controls. The guide offers Try again and, when a reply is available, See the reply. Retry restores the same position without clearing the attempt or help history.

An accepted first attempt without a hint or coach help shows You found it. A solution after help or another attempt shows Now you see it. Both show the accepted move, a primary Next position action, and a secondary Why? action. The last position changes the primary action to Finish practice. Completion shows the number solved and the number solved without help, followed by one primary Back to game action. Use these results as practice evidence, with no rating or mastery claim.

Back to game replaces Undo during the session; More also provides a return action, including during reply review. Return and refresh restore the original game, while saved attempt and solution evidence remains. Refresh does not resume the temporary practice board. Personal practice uses the existing colors, type, buttons, replay controls, and responsive board sizing; it adds no tokens or permanent panels. Keep the board, guide, and decisions within one viewport in answer, retry, and completion states.

### Dialogs and saved rows
Move explanations, coach questions, and full game review use the same dialog surface as secondary tasks. Dialogs use the surface color, a thin line border, a sticky header, and a close control. Practice choices and saved positions use separated rows rather than elevated cards. Promotion uses the same dialog material with four piece buttons. Notifications use the raised color and a dismiss action.

## Do's and Don'ts

### Do:
- **Do** keep the board, pieces, destinations, and hint arrow clear at phone size.
- **Do** use jade for actions and current state, with labels or shapes for meaning.
- **Do** keep the coach concise and put longer move explanations and questions in dialogs.
- **Do** fit the board, guide, and main controls in one window without page scrolling.
- **Do** preserve keyboard focus, accessible labels, and reduced-motion support.

### Don't:
- **Don't** restore the old olive, acid-yellow, grain, or tilted-mark identity.
- **Don't** add a welcome hero, slogans, or a permanent lesson dashboard to play.
- **Don't** use condensed type for headings or teaching prose.
- **Don't** rely on color alone to explain legal moves, check, or selection.
