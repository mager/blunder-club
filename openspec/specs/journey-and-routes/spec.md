# Journey and routes

## Purpose
Connected learning evidence with stable public board and view links.

## Requirements

### Requirement: Open learning graph
The journey SHALL show six connected places for center, development, king safety, threats, piece safety, and tactics. All places SHALL remain available.

#### Scenario: No history
- **WHEN** a new player opens Journey
- **THEN** the app shows no invented achievements or mastery claims

### Requirement: Evidence counts
The journey SHALL count distinct solved lessons and positions, separate assisted from independent evidence, and allow a lesson to contribute to each skill it teaches.

#### Scenario: Repeat attempts
- **WHEN** a player repeats a previously solved lesson
- **THEN** the number of distinct solved lessons does not increase

### Requirement: Lesson discovery
A journey place SHALL open lessons filtered by that skill and SHALL offer personal position practice when matching saved positions exist.

#### Scenario: Select tactics
- **WHEN** the player opens Explore lessons from Fork road
- **THEN** the picker shows matching authored lessons

### Requirement: Stable validated links
The app SHALL encode legal board history and selected views in hash URLs, including lessons, hints, journey selection, and review state. It SHALL exclude account identifiers and private learning records.

#### Scenario: Exact hint
- **WHEN** a player reloads a URL with a legal selected hint
- **THEN** the same move remains selected

#### Scenario: Invalid link
- **WHEN** a URL contains illegal moves
- **THEN** the app shows a notice and keeps the saved game available

#### Scenario: Legacy practice game
- **WHEN** an old practice URL contains legal play beyond the authored line
- **THEN** the app opens that continued position as a playable custom game

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
