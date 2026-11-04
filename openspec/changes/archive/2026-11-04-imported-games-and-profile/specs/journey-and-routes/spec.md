## ADDED Requirements

### Requirement: Library and profile links
The app SHALL provide stable links for the owner profile, private library, private game replay, public profile, and published game replay. Private links SHALL resolve only against the current owner's data. Public links SHALL use a separate public identifier, never a Google account identifier. Links SHALL exclude private PGN text and style evidence.

#### Scenario: Private link on another device
- **WHEN** a private game link opens without the required local save or signed-in owner data
- **THEN** the app shows a missing-game or sign-in state and reveals no other account's record

#### Scenario: Replay navigation
- **WHEN** a player changes the selected half-move, reloads, or uses browser history
- **THEN** the selected legal replay position is restored and the current playable game remains saved separately

#### Scenario: Invalid replay link
- **WHEN** a link has a malformed identifier or a half-move outside the selected game's history
- **THEN** the app shows a clear error and preserves the saved playable game

#### Scenario: Existing lesson link
- **WHEN** a player opens an existing play, lesson, hint, or practice link
- **THEN** it retains its current meaning and validation rules
