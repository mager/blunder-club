# Authored lessons

## Purpose
Hardcoded teaching lines that share the main board and keep completion evidence.

## Requirements

### Requirement: Typed stable catalog
The app SHALL store authored lessons in typed data with stable IDs, legal starting positions, legal player moves, and legal scripted replies.

#### Scenario: Current catalog
- **WHEN** the player opens the catalog
- **THEN** three openings and 22 challenges are available

#### Scenario: Multi-move tactic
- **WHEN** the player makes the first accepted move of a fork lesson
- **THEN** the scripted reply occurs and the next task asks for the follow-up capture

### Requirement: Lesson-specific acceptance
An authored step SHALL accept its stated move, listed alternatives, or any legal checkmate when mate is the goal. Other legal choices SHALL receive a lesson retry rather than an engine blunder claim.

#### Scenario: Different legal move
- **WHEN** the player makes a legal move outside the lesson choices
- **THEN** the guide offers retry and a hint

#### Scenario: Stalemate trap
- **WHEN** the player promotes to a queen in the rook-underpromotion challenge
- **THEN** the guide explains stalemate and allows a retry

### Requirement: Visible help
A lesson SHALL offer a visible hint that marks the move on the board and exposes a Play action with the full move, including promotion.

#### Scenario: Rook promotion hint
- **WHEN** the player requests and plays the underpromotion hint
- **THEN** the pawn becomes a rook

### Requirement: Honest completion evidence
The app SHALL distinguish assisted and independent completions. Help, wrong attempts, and undo SHALL prevent independent credit for that run, and reload SHALL retain run evidence.

#### Scenario: Assisted result
- **WHEN** a player uses a hint and finishes the lesson
- **THEN** completion increases but independent completion does not

#### Scenario: Reload completed run
- **WHEN** a recorded completed lesson reloads
- **THEN** the app does not add another completion

### Requirement: Finished lesson choices
A completed lesson SHALL offer the next lesson and a repeat without hints. It SHALL offer continued play only for a nonterminal board.

#### Scenario: Continue an opening
- **WHEN** the player completes the London setup and selects Play from here
- **THEN** the same position continues against the selected computer opponent

#### Scenario: Finish mate
- **WHEN** a lesson ends in checkmate
- **THEN** normal board moves and Play from here are unavailable
