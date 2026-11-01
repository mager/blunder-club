# Personal practice

## Purpose
Practice of saved mistakes without replacing the original game.

## Requirements

### Requirement: Position queue
Personal practice SHALL select up to three distinct playable saved positions, with unsolved and older practice evidence preferred.

#### Scenario: Repeated board
- **WHEN** multiple saved mistakes have the same chess position
- **THEN** the practice queue includes that position once

### Requirement: Sound alternatives
Personal practice SHALL check moves against engine evidence and accept sound alternatives while preserving a forced mate when one is available.

#### Scenario: Alternative solution
- **WHEN** the chosen move is sound under the practice threshold
- **THEN** the app accepts it even if it differs from the first engine move

### Requirement: Practice evidence
Personal practice SHALL record attempts, assisted solutions, and first-attempt solutions without help separately.

#### Scenario: Retry then solve
- **WHEN** the player fails once before solving
- **THEN** the result is assisted

### Requirement: Original game preservation
Personal practice SHALL keep the original board and authored-run state available during the detour and after reload.

#### Scenario: Return to game
- **WHEN** the player completes or exits personal practice
- **THEN** the original game is restored with the new practice evidence retained
