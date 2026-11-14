# Game library

Paste one standard-chess PGN at a time. The input limit is 128 KiB and 1,000 half-moves. Numeric annotations and comments are not our analysis. Variations are omitted. Review the game and choose your side before saving.

The library holds up to 100 active games, with a 40 KiB limit per normalized record. It uses the IndexedDB database `nextmove-library-v1`, store `records`, with keys `guest:<gameId>` or `account:<uid>:<gameId>`. It does not change the existing active-game save. Deleted records remain as tombstones. Storage errors retain the pasted input; no game is silently evicted.

Identity uses the starting position, legal main line, player names, date, and result. Changes to comments, spacing, side, or title do not create a second game. Identical games with no distinguishing source metadata count once. Use Restore game to deliberately restore a removed game.

Style notes show the selected side's actual move counts and source games. They are not engine grades or fixed style labels. Checks include checkmate. Castling comparisons require standard starts and ten player moves. After at least three eligible games, a two-thirds threshold can suggest a castling lesson, then an e4 or d4 opening lesson. These rules choose practice options; they do not measure strength. Imported games give no lesson credit.

## Account and public data

Private games use `/users/<uid>/games/<gameId>` with revisions and retained tombstones. Failed transfers keep the guest record until the account write commits. Conflicts retain the local edit and offer an account/local choice; remote deletions require an explicit restore.

Public profiles use `/profiles/<random-public-id>`. Their ownership mapping and settings remain private. A public snapshot contains the chosen public name and up to eight games: title, player names, side, result, starting position, and moves. No Google identity, rating, comments, arbitrary headers, or style evidence is copied. Public writes require a fresh preview and an explicit Publish/Update action. Unpublish removes the public snapshot while retaining private games. Public removals that fail remain clearly pending.

## Personal profiles and Nextmove games

The optional public `details` map stores a bio, original piece avatar (`n`, `r`, or `q`), a spotlight public game ID or null, and a map of selected public game IDs to stories. Text is trimmed, excludes control characters, and is at most 160 Unicode code points. Old version-1 snapshots without details stay readable. Rules allow only these fields and selected game IDs. Removing a featured game prunes its story and clears its spotlight in the same transaction.

Normal Nextmove games can enter the private library through Save game. A snapshot uses the true starting position and legal history, selected opponent label, and an unknown date for stable duplicate identity. Repeated saves retain existing title and favorite edits. Removed snapshots need explicit restore through the library flow. Saving does not publish, replace the playable game, or give lesson credit.

## Tests

Run `npm test` for parser, storage, style, routes, and projection tests. Run `npm run test:rules` for real Firestore rules and cloud transaction tests. The latter requires Firebase CLI 14.26+ and Java 21 on PATH; it starts a local emulator with the demo project `demo-nextmove`. On Homebrew, use `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" npm run test:rules`. No production credentials or account data are needed.

The browser suite uses a separate origin at port 5176 and local Auth/Firestore emulators at 9098/8088. The development-only `VITE_FIREBASE_EMULATORS=true` flag connects to these services; production builds cannot enable emulator connections. Use dummy Firebase config values and project ID `demo-nextmove`. Do not point this suite at the production project.

Start the services in separate terminals:

```sh
firebase emulators:start --only firestore,auth --project demo-nextmove
```

```sh
VITE_FIREBASE_AUTH_ENABLED=true VITE_FIREBASE_API_KEY=demo-key VITE_FIREBASE_AUTH_DOMAIN=demo-nextmove.firebaseapp.com VITE_FIREBASE_PROJECT_ID=demo-nextmove VITE_FIREBASE_APP_ID=demo-app VITE_FIREBASE_EMULATORS=true npm run dev -- --port 5176
```

Then run `npx playwright test`. The default browser is installed Chrome. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed Chromium executable if needed. Tests use fresh browser contexts and synthetic accounts on the demo emulator. Set `CAPTURE_UI=1` to save the viewport evidence under `.impeccable/review/`. Run the rules command separately while the other emulator process is stopped.
