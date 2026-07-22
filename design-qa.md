# Graphite Forge v0.1.0 Design QA

## Evidence

- Source visual truth: `C:\_code\animation_studio\docs\design\graphite-forge-v0.1.0.png`
- Final implementation screenshot: `C:\_code\animation_studio\docs\design\implementation-v0.1.0-final.png`
- Full-view comparison: `C:\_code\animation_studio\docs\design\qa-comparison-final.png`
- Focused canvas and inspector comparison: `C:\_code\animation_studio\docs\design\qa-comparison-focus-canvas.png`
- Viewport: 1440 × 1024 CSS pixels at device scale factor 1.
- Source pixels: 1488 × 1058, normalized to 1440 × 1024 for comparison.
- Implementation pixels: 1440 × 1024.
- State: default Rig workspace, Left Foot IK selected, frame 18, Auto Key off.
- Capture method: installed Chromium headless renderer with a 5-second virtual-time budget after the in-app browser control transport became unavailable.
- Interaction verification: Chromium DevTools Protocol exercised Rig → Animate → Export → Rig, Auto Key, disabled v0.2 tools, and canvas presence against the running Vite app.
- Console verification: no runtime exceptions or error-level browser log entries were observed during the interaction path.

## Findings

No actionable P0, P1, or P2 findings remain.

The final implementation preserves the source design's professional four-region anatomy: semantic hierarchy, dominant dark canvas, contextual inspector, and bottom dopesheet. The selected bone remains synchronized across the hierarchy, viewport, inspector, and timeline. The approved graphite, cyan, amber, coral, and muted-text roles are consistently represented.

### Required fidelity surfaces

- Fonts and typography: Windows-native Segoe UI Variable/System UI is a close metric match to the mock's modern grotesk. Control text is explicitly sized from 9–14 px; numeric fields use Cascadia Mono fallbacks. Labels, inspector headings, tree rows, and timeline values remain legible at the target viewport.
- Spacing and layout rhythm: the 54 px tool rail, 274 px hierarchy, fluid viewport, 304 px inspector, 244 px dopesheet, 50 px command bar, and 34 px status bar reproduce the mock's proportions without persistent-control overflow.
- Colors and tokens: flat graphite surfaces, one-pixel blue-gray separators, electric cyan selection, warm amber far-side bones, coral warning, and green save state visually match the source. No unapproved decorative card or glow system was introduced.
- Image quality and asset fidelity: the implementation uses the supplied character artwork, removes its near-white background in the real canvas pipeline, preserves sharp illustrated rendering, and uses a real generated application mark plus the supplied pixel character for the recent-project thumbnail. No placeholder assets or CSS-drawn substitutes are present.
- Copy and content: all approved above-the-fold labels are preserved: Graphite Forge, Project, Prepare, Rig, Animate, Export, Rear forearm artwork missing, Left Foot IK, Transform, IK settings, Run range test, Foot IK, Dopesheet, Auto Key, Walk, Pixel snap, FPS, Zoom, and autosave state. Added copy is limited to functional project-menu and v0.1 scope states.

## Comparison history

### Pass 1 — blocked

- [P1] Character and rig were too small in the viewport because low-alpha remnants of the near-white source background prevented a tight crop.
- [P1] Normalized joint positions appeared outside the artwork for the same reason, weakening the core rigging interaction.
- [P2] The inspector ended in a large unused area and did not carry the source mock's recent-project anchor.

Fixes made:

- Tightened neutral-background removal and based the content bounds on meaningful alpha coverage.
- Increased the canvas fit target from 82% to 91% of the viewport height.
- Added the real pixel-art example as the compact recent-project strip.
- Disabled mesh and weight tools as explicit post-v0.1 affordances instead of presenting inert functionality.

### Pass 2 — passed

Post-fix evidence shows the character occupying the intended vertical canvas space, rig joints aligned to the visible anatomy, the selected foot IK landing on the ground line, and the inspector visually anchored through the bottom edge. No P0/P1/P2 mismatch remains.

## Intentional v0.1 deviations

- The source mock's ImageGen character is slightly broader than the original supplied PNG. v0.1 preserves the user's original pixels instead of distorting them to match the generated mock.
- Advanced pole-vector, maximum-stretch, preferred-angle, mesh, weight, graph, and rendered-sprite-sheet controls are omitted or disabled to maintain the agreed staged-release boundary.
- Chromium DevTools Protocol was used for interaction verification because the in-app browser connection became unavailable during QA. The final evidence is still browser-rendered at the target viewport.

## Follow-up polish

- [P3] Revisit the application mark at 16 px after the product name is finalized.
- [P3] Add optional panel resizing only when the workflow needs it; fixed proportions are more faithful for v0.1.

final result: passed
