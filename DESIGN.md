---
name: Blunder School
description: Bad moves. Better chess.
colors:
  acid: "#d6f369"
  acid-dark: "#33401c"
  ink: "#191b17"
  surface: "#22251e"
  raised: "#2c3026"
  paper: "#eceee3"
  muted: "#a5ae98"
  faint: "#7f8873"
  line: "#3b4033"
  warning: "#f0b881"
  board-light: "#d4d6bd"
  board-dark: "#798569"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    lineHeight: 0.89
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "47px"
    fontWeight: 700
    lineHeight: 0.95
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
rounded:
  square: "0px"
components:
  button-primary:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
  button-secondary:
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "10px 12px"
  coach-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
---

# Design System: Blunder School

## Overview

**Creative North Star: "The gritty chess club"**

Dark olive surfaces, acid yellow accents, rough print texture, and condensed type give the app its approved character. The chess pieces remain clear. The coach uses calm, readable explanations beside the board.

**Key Characteristics:**
- Dark olive and warm paper.
- Square controls with clear borders.
- Bold condensed headings and plain teaching text.
- Slightly tilted identity marks and restrained grain.

## Colors

### Primary
- **Acid:** main actions, selected navigation, hints, and progress.
- **Dark acid:** quiet accent backgrounds behind icons and progress marks.

### Secondary
- **Warm warning:** mistake labels and the move being reviewed.

### Neutral
- **Ink, surface, raised:** the page and two levels of panel contrast.
- **Paper, muted, faint:** primary text, supporting text, and small metadata. Keep teaching instructions out of the faint role.
- **Line:** borders and separators.
- **Board light and board dark:** the olive playing surface. Piece outlines preserve separation on both square colors.

## Typography

Barlow Condensed carries the identity, large headings, move notation, and lesson numbers. DM Sans carries controls and explanations. Use uppercase for short display statements; keep teaching text in sentence case.

The compact play heading uses the display token, reducing to 39px on phones and 35px on narrow phones. Review headings use the headline token. Teaching text uses 12–13px with generous line height in the current layout. Phone text inputs use 16px to avoid focus zoom. Small metadata sizes are local details, not a reusable type scale.

## Layout

The centered shell has a maximum width of 1216px. Horizontal padding reduces from 48px to 30px, 20px, then 14px. The desktop play surface pairs a board column up to 560px with a coach column of at least 320px and a 36px gap. At 1000px the columns use equal available space with a 24px gap. At 760px they stack, with the coach below the board.

The header is compact: 78px on desktop and 72px on phones. A sticky phone coach strip links the board and teaching panel. Keep control groups near the board and use panel borders to separate distinct tasks. Practice and saved-lesson surfaces reuse the same shell and typography.

## Elevation & Depth

Tonal surfaces and thin borders carry most of the depth. A soft shadow grounds the board; the sticky phone strip has a smaller shadow. The promotion dialog uses a dark backdrop. A low-opacity grain layer adds the print character without blocking input. Avoid turning every panel into a floating card.

## Shapes

Boards, controls, inputs, and panels have square corners. Circles identify legal destinations, capture rings, and progress steps. The small brand and coach marks use slight rotations; functional panels stay aligned.

## Components

### Buttons
Primary buttons use acid with dark text, a minimum height of 45px, and a clear hover change. Secondary buttons use a thin border and tonal hover fill. Text actions remain quiet until hover. Disabled controls reduce opacity. Keyboard focus uses a visible acid outline; the board uses an inset dark outline.

### Coach panel
A bordered olive panel contains a compact identity header, a teaching body, optional questions, and a small source label. Move options use a large notation block beside a plain description. Selected options gain an acid notation block. Review states use warm warning accents and explicit retry or continue actions.

### Inputs
Questions use a dark, square field with a thin border and an adjacent send control. Focus changes the border to acid. Retain a programmatic label and a visible focus state.

### Navigation and mode controls
Navigation uses text with small icons on desktop and an acid underline for the active view. Icons disappear on phones to preserve space. Coaching modes use a bordered segmented control. Guided openings have an explicit label and a separate free-play action.

### Chessboard
The board is an eight-column square grid with outlined pieces. Labels stay at its outside edges. Selection, last move, hint, check, legal destination, and capture states have separate treatments. Use destination dots and capture rings alongside color. Arrow keys move within the board; Enter selects; Escape clears selection.

### Progress and learning map
Opening steps use numbered circles with a filled active state and completed check marks. The learning map uses bordered rectangular nodes and visible connections on desktop. On phones, nodes form a two-column list with the related skills stated in text.

### Account controls

The header shows device-save status for guests. When Firebase Authentication is enabled, a bordered Google sign-in control replaces this status; signed-in players see their name, save status, and sign-out action. At widths below 1000px, account controls use a separate row. Save failures remain visible and retain the local copy.

## Do's and Don'ts

### Do:
- **Do** preserve the olive, acid, and warm-paper palette.
- **Do** keep pieces and legal destinations clear at phone size.
- **Do** use bold type for short headings and plain type for teaching.
- **Do** retain keyboard focus, text labels, and reduced-motion support.

### Don't:
- **Don't** replace the approved rough club character with a generic glossy dashboard.
- **Don't** use decorative rotation on the board or teaching panels.
- **Don't** use color alone to explain a move or control state.
- **Don't** turn incidental small metadata sizes into a global text standard.
