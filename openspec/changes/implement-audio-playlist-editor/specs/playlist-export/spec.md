## ADDED Requirements

### Requirement: Export final playlist
The system SHALL allow exporting the final playlist in formats compatible with most media players, including M3U8 (primary), optionally XSPF, and JSON (for backup/import).

#### Scenario: Playlist exported in M3U8 format
- **WHEN** user exports playlist in M3U8 format
- **THEN** system generates a valid M3U8 file with proper UTF-8 encoding

#### Scenario: Playlist exported in JSON format
- **WHEN** user exports playlist in JSON format
- **THEN** system generates a JSON file with full internal structure

### Requirement: Handle relative and absolute paths
When exporting to M3U8, the system SHALL allow the user to choose between absolute and relative paths, automatically computing a common prefix for relative paths.

#### Scenario: Relative paths used
- **WHEN** user chooses relative paths for M3U8 export
- **THEN** system computes common prefix and trims paths accordingly

### Requirement: Integrity checks
The system SHALL perform integrity checks before export and warn the user if the playlist includes tracks whose source files are missing.

#### Scenario: Missing files detected
- **WHEN** playlist contains tracks with missing source files
- **THEN** system warns user before export
