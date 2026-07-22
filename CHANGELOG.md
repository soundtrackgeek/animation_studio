# Changelog

All notable changes to Graphite Forge are documented here.

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
