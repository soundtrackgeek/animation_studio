# Changelog

All notable changes to Graphite Forge are documented here.

## [0.2.1] - 2026-07-23

### Fixed

- Built the static preview output before testing it so the Windows Installer workflow also passes on a clean GitHub runner.

## [0.2.0] - 2026-07-23

### Added

- Added a current-user Windows NSIS installer with Start menu and uninstall integration.
- Embedded the Microsoft WebView2 bootstrapper for more dependable first-time installation.
- Added a GitHub Actions workflow that verifies the frontend and Rust code, packages every push, creates a SHA-256 checksum, and publishes both as a downloadable artifact.

### Changed

- Made `npm run tauri:build` create the installable Windows setup executable; the unpackaged build remains available through `npm run tauri:build:binary`.
- Blocked installer downgrades so older builds cannot replace newer installed versions.

## [0.1.3] - 2026-07-22

### Fixed

- Prevented Auto Key from remaining visibly enabled after leaving the Animate workspace.
- Disabled and relabeled Auto Key in Rig and other non-animation workspaces, where transforms intentionally edit the rest pose.

## [0.1.2] - 2026-07-22

### Changed

- Added explicit Auto Key confirmation in the inspector and transient status notice.
- Raised and enlarged the active timeline key above the playhead so a newly created key cannot appear hidden.

### Verified

- Reproduced both numeric-field and pointer-drag Auto Key creation against the native Tauri WebView and confirmed the keys in rendered DOM and persisted project data.

## [0.1.1] - 2026-07-22

### Fixed

- Made Auto Key derive from the reducer's current Animate state so dragging a target reliably records the active frame.
- Prioritized the selected IK target during overlapping viewport hit tests.
- Removed the incorrect hard-coded rear-forearm warning from the canvas and validation panels.

## [0.1.0] - 2026-07-22

### Added

- Initial Tauri 2, Rust, React, TypeScript, and Vite application foundation.
- Graphite Forge four-panel studio interface based on the selected design direction.
- Side-view sprite canvas with direct joint manipulation, IK targets, and near/far bone visualization.
- Prepare, Rig, Animate, and Export workspace states.
- Walk clip dopesheet with key markers, playback, frame stepping, Auto Key, and range testing.
- Native `.gforge` project open/save and JSON metadata export, with browser-preview fallbacks.
- Reducer, native serialization, static-build worker, and visual fidelity verification coverage.
- Deliberately disabled post-v0.1 mesh, weight, and rendered sprite-sheet affordances.
