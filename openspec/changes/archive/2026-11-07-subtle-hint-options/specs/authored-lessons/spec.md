## ADDED Requirements

### Requirement: Lesson hint alternatives
Lesson hints SHALL offer up to three accepted moves when alternatives exist. These SHALL come from the authored expected move, declared alternatives, or verified legal checkmates for a mate goal. Other engine moves SHALL NOT replace the lesson goal. Preview, Play, explanation, and reload SHALL use the chosen accepted move and preserve assisted evidence.

#### Scenario: Safe alternative
- **WHEN** a lesson allows several safe rook moves and the player selects an alternative hint
- **THEN** the arrow and Play use that move and completion is recorded as assisted

#### Scenario: Specific opening step
- **WHEN** an authored opening step accepts one move
- **THEN** its hint offers that move without invented alternatives
