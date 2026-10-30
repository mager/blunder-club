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

The headline and body tokens describe the desktop coach. The headline becomes 32px on large screens, 26px at the intermediate breakpoint, 23px on phones, and 22px on narrow phones. Phone coach body text is 13px with a 1.55 line height. Dialog titles use the title token. The wordmark is 25px and weight 700, then 22px or 20px on phones. Labels range from 11–13px. Question inputs stay at 16px. Use small type for supporting state, not long teaching text.

**The Plain Cue Rule.** Keep coaching in sentence case and plain type. Reserve condensed type for chess notation.

## Layout

The header is centered within 1600px, with a 72px height and 36px horizontal padding. The desktop stage pairs the board with a 260px coach dock and a 56px gap. Board size is the minimum of 720px, viewport height minus 260px, and viewport width minus 400px. Player strips sit directly above and below it; Hint, Undo, and More sit beneath.

At widths of at least 1550px, the dock is 280px and the gap is 72px. At 1050px or less, the dock is 230px, the gap is 32px, and the board uses the minimum of 650px, viewport height minus 260px, and viewport width minus 332px.

At 760px or less, the stage stacks within 560px with 14px side padding and a 20px gap. The header is 60px. The board fills its column; the coach follows within 480px. At 380px or less, stage padding is 8px and the gap is 14px. The page has a 320px minimum width.

When both width and height are at most 760px, paused-game actions become sticky above the board. They replace the opponent strip while paused and keep retry, reply, or review actions within reach. They are hidden outside this condition.

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
A small circular guide mark introduces one short cue and a brief explanation. Mistake review changes the guide mark and heading to warm warning. Retry and continue actions stay together. Longer explanations open through native disclosures. Hints reveal an arrow and optional move choices; the selected choice has a deep-jade fill and a visible border. Opening progress uses six bars.

### Question input
The optional question form uses an unfilled field with a bottom border, an adjacent send button, and an accessible label. Preserve the global focus outline and readable placeholder.

### Header, toolbar, and modes
The header contains the wordmark, session selector, and account access. Account text collapses to an accessible icon on phones. The board toolbar has three labeled controls. Coaching modes use a dark segmented control with a raised, jade-text active segment and an `aria-pressed` state. Practice, saved positions, account, and move history open in dialogs.

### Chessboard
The board is a square eight-column grid. SVG pieces occupy 81% of each square and have contrasting outlines and a small shadow. Rank and file labels sit inside the outer squares. Selection has a filled square and inset outline; legal destinations use dots; captures use rings. Last move, hint, and check have separate fills. A dark SVG arrow points from the hinted piece to its destination.

Each square has an accessible piece-and-square label. Arrow keys move focus; Enter selects a piece or destination; Escape clears selection. The focused square uses a dark inset outline. Retain disabled and pressed semantics while play pauses.

### Dialogs and saved rows
Dialogs use the surface color, a thin line border, a sticky header, and a close control. Practice choices and saved positions use separated rows rather than elevated cards. Promotion uses the same dialog material with four piece buttons. Notifications use the raised color and a dismiss action.

## Do's and Don'ts

### Do:
- **Do** keep the board, pieces, destinations, and hint arrow clear at phone size.
- **Do** use jade for actions and current state, with labels or shapes for meaning.
- **Do** keep the coach concise and put longer explanations in a disclosure.
- **Do** preserve keyboard focus, accessible labels, and reduced-motion support.

### Don't:
- **Don't** restore the old olive, acid-yellow, grain, or tilted-mark identity.
- **Don't** add a welcome hero, slogans, or a permanent lesson dashboard to play.
- **Don't** use condensed type for headings or teaching prose.
- **Don't** rely on color alone to explain legal moves, check, or selection.
