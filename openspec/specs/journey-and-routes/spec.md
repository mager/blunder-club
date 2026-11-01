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
