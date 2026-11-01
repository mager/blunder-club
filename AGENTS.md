# Nextmove agent guide

## Start here

This repository is Nextmove, the chess learning game. Its folder and GitHub name are still `blunder-club`. Do not work in the unrelated `magerblog` repository.

1. Read `HANDOFF.md` for the last verified state and remaining work.
2. Read `PRODUCT.md`, `DESIGN.md`, and the relevant `openspec/specs/*/spec.md`.
3. Check `git status --short` and the current branch. Preserve changes from the user or another session.
4. Run `npm run openspec -- list` to find an active change before creating one.

Use simple, direct English. End user-facing final responses with a brief **Next Steps** section. Keep the user informed during long work. Complete authorized work without repeated permission requests.

## Product boundaries

- Nextmove teaches through play, a concrete consequence, and another attempt.
- Keep the board central. Board, guide, and main controls fit one viewport. Secondary dialogs may scroll.
- Keep on-board text short. Hints and their Play action must be easy to find.
- Do not restore Ask Rook or add a chat panel, dashboard, streak pressure, fake Elo, or mastery claims.
- Preserve Svelte 5 + TypeScript. The user rejected React.
- All lessons and meaningful game views need stable, validated URLs.
- Keep authored lessons in typed data. Do not add a database-backed curriculum without a new request.
- Use the current board and piece palette in DESIGN.md. Avoid copying third-party piece assets without a suitable license.

## Commands

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev                 # localhost:5173 by default
npm test
npm run build
npm run spec:check
npm run openspec -- list
npm run openspec -- list --specs
```

OpenSpec 1.16.0 is pinned as a development dependency. Use `npm run openspec -- <arguments>` in place of a bare `openspec` command in generated skills. No global install is required. The npm commands disable OpenSpec telemetry for those invocations.

## OpenSpec workflow

- Baseline specs describe shipped behavior. Proposals and delta specs belong in `openspec/changes/<name>/`.
- For a new feature, use the project-local OpenSpec skills in `.agents/skills/`. Select the workflow that matches the request; an explicit planning-only request stays planning-only.
- A change has a proposal, design, delta specs, and testable tasks. Keep tasks accurate as work proceeds.
- Use `npm run openspec -- status --change <name>` to resume it.
- Validate with `npm run spec:check`. When implementation and checks are complete, archive through the CLI so deltas update baseline specs.
- Do not invent unfinished changes or mark untested work complete to make the handoff look finished.
- Small fixes may use a short change. Record behavior changes in the matching baseline when the change is archived.

## Source map

- `src/App.svelte`: game and teaching state, panels, navigation, save calls.
- `src/Board.svelte`, `src/Piece.svelte`, `src/styles.css`, `src/fit-board.ts`: board, original SVG pieces, styles, viewport sizing.
- `src/engine.ts`, `src/opponent*.ts`: Stockfish analysis and separate opponent workers.
- `src/coaching.ts`, `src/rules.ts`: warnings, isolated previews, and inspectable teaching rules.
- `src/curriculum.ts`, `src/openings.ts`, `src/scenarios.ts`, `src/lesson-types.ts`: authored lessons.
- `src/study.ts`, `src/practice.ts`: authored runs and practice from personal mistakes.
- `src/progress.ts`, `src/cloud.ts`: save validation, migration, account isolation, and cloud sync.
- `src/routes.ts`: legal game/view URLs. Do not put private learning data in URLs.
- `src/SkillMap.svelte`, `src/journey.ts`, `src/LessonLibrary.svelte`: journey and catalog.
- `server/coach.mjs`, `api/coach.mjs`: optional Jev boundary and local fallback.

## Correctness and review

- chess.js is the authority for legal moves. Engine scores use the side-to-move perspective.
- Never warn against the suggested best move. Preserve meaningful mate warnings without trapping the learner in repeated Rethink prompts.
- Authored lesson moves and replies must be legal. Check the actual tactical claim, not only the notation. Accept safe alternatives where defined and any checkmate when mate is the goal.
- Hints, threat checks, wrong attempts, and undo prevent independent credit for that run. Reload must preserve this evidence.
- Personal practice must preserve the original game. Avoid double-counting completion after reload or cloud import.
- Run tests for changed behavior and `npm run build`. Use Impeccable for UI changes when available; preserve the current visual world except where the user requests a change.
- Test affected play states at desktop, 320×568, and short landscape sizes. Check keyboard input, hint, check, promotion, and completion when affected. Do not hide overflow to conceal missing controls.
- Browser testing must use a separate local test origin or an agent-owned guest session. Do not overwrite the user's real game.

## Credentials and release

- Never print or commit `.env.local`, API keys, credentials, or account data. `.env.example` lists the needed names.
- `TYPESAFE_API_KEY` is server-only. Never give it a `VITE_` prefix.
- Firebase project: `blunder-school-513120`; Google sign-in only. Keep owner-only Firestore rules and account/guest isolation.
- Repository: https://github.com/mager/blunder-club. Production: https://blunder-school.vercel.app/. Vercel project: `blunder-school`.
- Commits, pushes, and deployments are distinct actions. Report which succeeded. Do not assume that a local commit is live.
- Push authorized completed work to the remote. Verify the deployed version when publishing an app change. New branches use `codex/` unless the user requests another name.

## End each session

Update `HANDOFF.md` with the actual state, tests, commit/release references, active OpenSpec change, and specific remaining tasks. Keep credentials and private progress out. Update product/design docs when their behavior changes. Check the final diff and report any uncommitted or unpushed work. Leave a short prompt the user can paste into the next session.
