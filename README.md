# Nextmove

A board-first chess game for beginners who learn by playing. Make a move, see the consequence, and try again.

Live: https://blunder-school.vercel.app

## Play and learn

The board is the main interface. Board, guide, and controls fit the visible window without page scrolling. Rook gives one short cue at a time. Longer explanations and questions open in focused panels. Hints draw move arrows; explanations open on request. Practice, saved positions, settings, and the move sheet live in the game menu.

- Play White with no clock against Casual, Club, or Challenge. Casual uses a shallow position score; Club checks one reply across a bounded set of candidates; Challenge uses Stockfish’s strongest line. These are difficulty choices, not Elo ratings.
- Choose warnings before a move, a pause after a mistake, or a review after the game. Warnings show a concrete reply, a safer suggestion, and choices to play anyway or pause warnings. Winning positions are not interrupted for minor missed improvements. Step through Before / Your move / Their reply on the board; previews do not enter the move sheet or save. Review the largest evaluation changes, see the opponent's reply, retry the position, or continue a paused game.
- Play 25 authored lessons: the Italian Game, London setup, Queen’s Gambit, and 22 challenges covering forks, pinned defenders, loose pieces, check escapes, mates, castling, promotion, stalemate, and en passant. Multi-move lessons include scripted replies. Repeat any lesson without hints, or continue its final board against the computer.
- Open Journey from the header to explore six connected places. Each shows explored skills, saved positions to revisit, and independent solutions. Select any place to start a lesson or revisit your own positions. “Your second chance” brings back up to three distinct positions from your saved mistakes. Choose a move before seeing the answer, inspect a failed move’s reply, then retry. Sound alternatives pass; hints and retries are recorded separately from first-try solutions. Practice preserves the original game, including after a refresh. Finished games offer “Practice this” for the main turning point.
- Track recurring patterns with memorable names alongside their actual chess concepts.
- Jev chooses the next skill and teaching action from engine evidence. Authored explanations and Stockfish supply the chess content.

## Revisit a view

The address updates for games, lesson steps, hints, warnings, reviews, journey places, and panels. Bookmark it or use More → Copy link to this view. Links contain chess positions and moves, not account IDs or private progress records. Journey progress belongs to the viewer. Links use hash routes, so no hosting rewrite is required. Opening an old game link restores that board; continuing play makes it the current saved game.

## Development

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Svelte 5 + TypeScript + Vite. chess.js validates moves. Stockfish 19 Lite runs in a browser worker and keeps full analysis strength for teaching at every opponent level. Casual and Club run in a separate worker so their search cannot block board input. The build copies its pinned npm assets to `public/engine`.

## Optional Jev decisions

Copy `.env.example` to `.env.local` and set `TYPESAFE_API_KEY`. Keep this server-only; never use a `VITE_` prefix for this key. Without a key or when Jev fails, the local rule table still works.

`server/coach.mjs` validates the request and calls TypeSafe's System One API. `api/coach.mjs` exposes it as a Vercel function; the Vite plugin exposes it during local development. Jev receives mistake positions, engine lines, and skill counts. It does not receive a name or email. The model returns bounded choices; low-confidence choices fall back to local rules.

## Deployment

The Vercel project is `blunder-school`, connected to this repository. Set `TYPESAFE_API_KEY` as a sensitive production environment variable. Deploy with `vercel --prod` or push to the connected main branch. `vercel.json` configures the build and API function.

## Google login and cloud saves

Firebase project: `blunder-school-513120`. Firestore is in `us-central1` on its free tier. The web app is registered, Google sign-in is enabled, and owner-only rules are deployed. The production domain and local development hosts are authorized.

1. In Firebase Authentication, click **Get started**, enable **Google**, and select a support email.
2. Add `blunder-school.vercel.app`, `localhost`, and `127.0.0.1` under Authentication → Settings → Authorized domains.
3. Set the four `VITE_FIREBASE_*` web config fields shown in `.env.example` in Vercel and local development. These identify the public web app; they are not admin credentials.
4. Set `VITE_FIREBASE_AUTH_ENABLED=true`, then rebuild/deploy.

A Google account owns `/users/{uid}/progress/current`. The document contains the current board, saved lessons, practice topics, and counters; it does not contain email or display name. Guest lessons are imported only after a successful transaction. Account caches use separate browser keys; signing out returns to guest state. Cloud write failures retain a local copy. Revision checks stop silent overwrites from concurrent devices; sign out/in or retry sync combines lessons and chooses the newer board. Board timestamps change only when the board changes. Lesson deletion timestamps prevent an older device copy from restoring removed lessons. Practice evidence uses the latest attempt record per saved position when device copies merge. Counters merge with the maximum value to avoid counting the same imported history twice; they are not additive across simultaneous device sessions.

`firestore.rules` denies all other document paths. The eight rule cases in `tests/firestore-rules.json` were checked against the deployed rules through Firebase's Rules API. `tests/cloud.test.ts` checks migration, account isolation, offline import, and revision conflicts. After setup, sign in through Google and check for “Progress saved.” Then open the app on a second device with the same Google account to verify your lessons.

## Prototype limits

Guest progress uses localStorage, separately for each browser and origin. Google login and cloud saves are enabled on the live site. `VITE_FIREBASE_AUTH_ENABLED` controls this feature for other deployments. No account is required for guest play. Localhost progress does not automatically transfer to the live URL until imported through the same Google account.

Engine searches are short and can miss deeper tactics. The review identifies evaluation drops, not a definitive single cause of defeat. Only White is supported. Each opening teaches one practice line, not a complete repertoire. Authored challenges accept the stated move, listed safe alternatives, or any checkmate when mate is the goal. Other legal moves get a lesson retry, not an engine blunder label. Personal practice checks one decision at a time; passing a position is not proof of lasting mastery. A refresh reopens the linked practice position; completed attempt results remain saved, and Back to game returns to the original board. The current practice queue and unsubmitted attempt are not stored in the URL.

The API has a bounded request cache and warm-instance request limits. These are prototype controls, not a durable global spending cap. Before a broad public launch, add authenticated requests and a shared quota store.

## Source map

- `src/App.svelte`: game, coaching, report, and local progress state.
- `src/engine.ts`: worker lifecycle, UCI messages, and analysis queue.
- `src/chess.ts`: move helpers.
- `src/curriculum.ts`, `src/openings.ts`, `src/scenarios.ts`: typed, hardcoded lesson catalog.
- `src/study.ts`: lesson validation, resume state, and assisted/independent completion evidence.
- `src/LessonLibrary.svelte`: skill-filtered lessons and saved completion status.
- `src/fit-board.ts`: sizes the square board from the space left by its controls and guide.
- `src/learning.ts`: opening line and connected skill definitions.
- `src/journey.ts` and `src/SkillMap.svelte`: saved practice evidence and the connected journey.
- `src/routes.ts`: validated, bookmarkable chess and view state; exact hint moves survive refresh.
- `src/rules.ts`: ordered teaching decision table.
- `src/coaching.ts`: isolated rehearsal boards and warning thresholds.
- `src/practice.ts`: personal position queue, move assessment, practice records, and original-game preservation.
- `src/opponent.ts`, `src/opponent.worker.ts`: bounded practice opponents.
- `src/opponent-client.ts`: worker lifecycle, request IDs, and timeouts.
- `server/coach.mjs`: validated Jev choice boundary and fallback.
- `src/cloud.ts` and `src/progress.ts`: Google authentication, private progress sync, and migration.
- `firestore.rules`: account ownership and revision checks.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for engine source and licenses.

Authored lesson results record completions, solutions without help, and the latest completion time. Hints, threat checks, retries, and undo prevent independent credit for that attempt. An in-progress run retains this evidence across refresh. Completion counters use maximum values on merge, so simultaneous device runs are not additive. Old practice links remain playable after the catalog expansion.
