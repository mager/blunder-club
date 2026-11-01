## Context

Nextmove already has a single-screen board with an adjacent guide. The user requests a focused visual change. Keep the graphite shell, jade actions, fonts, board sizing, and teaching flow.

## Goals / Non-Goals

Goals: familiar chess silhouettes, clear side recognition, a blue-and-white board, and readable teaching states on phones and desktop.

Non-goals: copying third-party piece artwork, adding a theme picker, changing game logic, or replacing the full interface.

## Decisions

- Author the six piece shapes in the existing SVG component. Use rounded joins, consistent bases, clear crowns, and a recognisable knight profile.
- Use cool white and blue for squares, white and navy for pieces, and dark board ink for outlines and coordinates.
- Use warm move highlights and a navy hint arrow. Keep check coral and retain outlines, dots, rings, and text labels so state is not color-only.
- Keep the 48-unit SVG viewBox and existing motion/keyboard code. No save or URL migration is needed.

## Risks / Trade-offs

- White pieces need a strong dark outline on light squares. Dark pieces need enough separation from blue squares.
- Small pieces must remain distinct. Verify all six types, both sides, promotion, and a hint at phone size.

## Validation

Run the existing tests, build, and strict OpenSpec validation. Inspect desktop and 320×568 screenshots, plus short landscape. Check keyboard movement, hint, legal destinations, check, and promotion. Use an isolated local test origin. Finish with Impeccable review, design documentation, and live deployment verification.
