## ADDED Requirements

### Requirement: Organize tracks into categories
The system SHALL initially distribute tracks across category windows corresponding to the selected folders and subfolders.

#### Scenario: Tracks organized by folder structure
- **WHEN** user loads tracks from multiple folders
- **THEN** system organizes tracks into categories based on their source folder structure

### Requirement: Create custom containers
The system SHALL allow users to create custom "containers" (playlist segments) with custom names such as "1 hour", "2 hours", "break".

#### Scenario: Custom container created
- **WHEN** user creates a custom container
- **THEN** system adds the new container to the list of available containers

### Requirement: Display category statistics
The system SHALL display for each category/container: total duration, number of tracks, and number of repetitions (duplicates).

#### Scenario: Category statistics displayed
- **WHEN** tracks are organized into categories
- **THEN** system displays total duration, number of tracks, and number of repetitions for each category
