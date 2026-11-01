# Nextmove session handoff

Updated 2026-11-01. Work in `/Users/mager/Code/blunder-club`, not `magerblog`.

## Current state

- Repository: https://github.com/mager/blunder-club, branch `main`.
- Live app: https://blunder-school.vercel.app/.
- Previous shipped curriculum commit: `750de04` (after `34eed54`). This session adds the blue board, reset controls, and OpenSpec.
- Blue board/reset/OpenSpec commit `5cfc1d0` is pushed and deployed. A final concise-hints follow-up is being verified; record its final release below before closing.
- Svelte 5 + TypeScript + Vite; chess.js validates moves, Stockfish 19 Lite supplies local analysis, Firebase Google login saves private progress. Jev is optional and server-only.
- 25 authored lessons: 3 openings and 22 challenges. Typed lesson data includes scripted replies and accepted alternatives. Authored practice, personal mistake practice, journey progress, and validated view URLs are implemented.
- Original SVG Staunton pieces now use white and navy on a blue/cool-white board. The graphite shell and jade controls remain.
- New game is visible above a normal board. Authored lessons show Start over. Both open a confirmation panel. Keep playing preserves the current board; confirmed resets preserve learning results and saved positions.
- Wrong lesson attempts now offer a short specific cue and primary Show hint. The answer restores the board, shows an arrow, and offers Play; detailed reasoning stays behind Why. Six Italian hints are position-specific. Personal practice also offers Show hint after failure.
- AGENTS.md, PRODUCT.md, DESIGN.md, and the design sidecar are current. README links this handoff and the specs.

## OpenSpec

OpenSpec 1.16.0 is pinned locally. Six Codex skills are in `.agents/skills/`. No global CLI is needed.

```sh
npm ci
npm run openspec -- list
npm run openspec -- list --specs
npm run spec:check
```

Seven baseline capabilities cover play/coaching, authored lessons, personal practice, progress sync, journey/routes, coach decisions, and board presentation. This session records `blue-white-chessboard`, `visible-game-restart`, and `concise-retry-hints`; completed changes are archived through the CLI. Check the list command for the actual active state before starting new work.

Use a proposal, design, delta specs, and tasks for feature work. Keep observable requirements current when archiving. Project scripts disable OpenSpec telemetry.

## Verification

- `npm test`: 105 tests pass across 10 files.
- `npm run build`: zero Svelte errors or warnings.
- Strict OpenSpec validation passes.
- Browser checks used a separate local origin at port 5175, not the user's live game. Verified desktop 1440×900, phone 320×568, and landscape 844×390.
- Verified all six piece types, keyboard selection, legal-move dots, hints, check, and promotion. Rook underpromotion solved the lesson. Phone and landscape document bounds match the viewport.
- Verified cancel preserved `e4,e5`; New game cleared played moves; Italian Start over restored step 1. Reset calls the existing start function, which invalidates pending engine work and retains learning results.
- Impeccable review caught faint move dots; these now use opaque board ink. Design records match the current palette.
- Hint recovery checks: Italian a3 → Show hint → Play e4 reached step 2; personal practice h3 in the loose-queen position → Show hint displayed Nxd5 after analysis. The UI prevents a stale hint request from affecting a replacement game.
- Earlier curriculum release passed 48 Stockfish position audits with zero flags. This session did not change lesson tactics.
- Two low-severity development dependency audit findings remain in the existing Svelte plugin/deepmerge chain; no fix was available in the checked dependency tree.

## Limits and possible later work

These are options for a later request, not authorization to begin them:

- White-only play and one authored line per opening. Add Black-side lessons or varied replies if requested.
- Engine searches are bounded. A review shows evaluation changes, not proof of the single cause of a loss.
- Authored challenges accept their stated moves, listed alternatives, or any mate when mate is the goal. Legal off-lesson moves get a retry, not a blunder claim.
- Personal practice tests one decision. It does not prove lasting mastery. Spaced revisit scheduling could build on existing evidence.
- Progress counters merge with maximum values and are not additive across simultaneous devices.
- The optional Jev endpoint has warm-instance limits, not a durable global spending cap. Add authenticated requests and shared quotas before a broad public launch.
- Keep secrets in ignored environment files. Do not print them or place server keys in VITE-prefixed variables.

## Resume prompt

“Open `/Users/mager/Code/blunder-club`. Read AGENTS.md and HANDOFF.md, check Git status and OpenSpec changes, and continue Nextmove from the saved state. Keep the board first, the text short, and the main game within one screen.”
