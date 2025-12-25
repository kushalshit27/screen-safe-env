# Change Log

All notable changes to the "screen-safe-env" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [1.0.1] - 2025-12-25

### Changed

- Updated README with demonstration GIF and additional usage instructions.

## [1.0.0] - 2025-12-03

### Added

- **Core Masking Engine**: Visually mask environment variable values in `.env` files using VS Code's Decoration API
- **Multiple Mask Modes**:
  - `solid`: Replace values with fixed-length `*****`
  - `lengthPreserving`: Replace each character with `*`, preserving length
  - `partial`: Show first and last 2 characters, mask the middle
- **Status Bar Integration**: Shows current masking state with toggle on click
- **Commands**:
  - `Screen Safe Env: Toggle Hide/Show` - Toggle masking on/off
  - `Screen Safe Env: Temporarily Reveal Values` - Reveal values for configurable duration
  - `Screen Safe Env: Force Rescan Current File` - Manually refresh decorations
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl+Shift+E`: Toggle masking (in `.env` files)
  - `Cmd/Ctrl+Shift+R`: Temporarily reveal values (in `.env` files)
- **Configuration Options**:
  - `screenSafeEnv.enable`: Enable/disable masking
  - `screenSafeEnv.maskMode`: Choose mask style
  - `screenSafeEnv.include`: Glob patterns for files to process
  - `screenSafeEnv.excludeKeys`: Keys to keep visible (e.g., PORT, DEBUG)
  - `screenSafeEnv.hoverReveal`: Allow revealing on hover
  - `screenSafeEnv.revealHoldMs`: Duration for temporary reveal
- **Hover Reveal**: Optional feature to peek at masked values on hover
- **Hot-Reload Settings**: Configuration changes apply immediately without restart
- **Workspace Trust**: Extension disabled in untrusted workspaces for security

### Security

- No telemetry or data collection
- No network requests
- No file modifications - purely visual masking
- Respects VS Code Workspace Trust
