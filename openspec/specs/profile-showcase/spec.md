# profile-showcase Specification

## Purpose
Give players a place to keep favorite games and share a chosen set of games without exposing their private learning records.

## Requirements

### Requirement: Owner profile
The app SHALL provide an owner profile with private favorites and private style notes. Guests SHALL be able to keep favorites on their device. Public sharing SHALL require sign-in and a chosen public display name; the app SHALL NOT automatically use Google identity data as public profile content.

#### Scenario: First visit
- **WHEN** a player opens their profile with no games
- **THEN** the profile offers Paste a game and explains where guest games are saved
- **AND** no invented games, stats, or achievements appear

#### Scenario: Favorite a game
- **WHEN** a player marks a saved game as a favorite
- **THEN** it appears on the owner profile and remains private

### Requirement: Explicit showcase publication
The owner SHALL be able to preview and publish up to eight selected favorite games with a public name and titles. The preview SHALL show all fields visitors will see. Publication SHALL expose only these fields and the selected games' validated replay data, player names, selected side, and result. Private notes, ratings, arbitrary PGN headers, and comments SHALL be excluded.

#### Scenario: Publish a favorite
- **WHEN** a signed-in player reviews the preview and selects Publish profile
- **THEN** the app saves a public snapshot and offers its stable link only after the write succeeds
- **AND** the public data contains no account UID, email, private style notes, or learning history

#### Scenario: Edit after publication
- **WHEN** the owner changes a title or adds a favorite after publishing
- **THEN** the live profile retains its last published version until the owner selects Update public profile

### Requirement: Public replay
Anyone with a published profile link SHALL be able to see its featured games and replay one without signing in. Public replay SHALL provide a stable selected-move link and SHALL NOT import games, change private progress, or trigger an opponent move.

#### Scenario: Visitor opens the finish
- **WHEN** a signed-out visitor opens a published game's final-move link
- **THEN** the board displays the correct final position and offers previous-move navigation
- **AND** any guest game already on the device remains unchanged

#### Scenario: Removed or invalid content
- **WHEN** a public profile or game is absent, unpublished, or invalid
- **THEN** the app shows an unavailable state without exposing a private record or replacing the visitor's game

### Requirement: Remove public access
The owner SHALL be able to unpublish the profile or remove a featured game. Removing or unfavoriting a published game SHALL also remove its public copy upon a successful write. A failed or offline removal SHALL remain visibly pending and SHALL NOT claim that public access has stopped. Another user SHALL NOT be able to change the profile.

#### Scenario: Successful unpublish
- **WHEN** the owner successfully unpublishes the profile
- **THEN** fresh anonymous reads of the profile and its games are denied or return no content
- **AND** the owner's private games remain available

#### Scenario: Failed removal
- **WHEN** a public removal fails because the device is offline
- **THEN** the owner sees that the public copy remains available and can retry
- **AND** a stale device cannot silently republish a removed game through ordinary library sync
