# Graphite Forge

Graphite Forge is a focused desktop studio for fitting a side-view 2D sprite to a small humanoid rig, posing it, and authoring a first animation clip. Version 0.1.0 is deliberately narrow so the workflow can be shaped in stages.

![Graphite Forge v0.1.0](docs/design/implementation-v0.1.0-final.png)

## What v0.1.0 includes

- One side-view humanoid project using the supplied Stellar Merc artwork
- Hierarchy selection and direct joint dragging on the canvas
- Near- and far-side bones plus hand and foot IK targets
- Prepare, Rig, Animate, and Export workspaces
- One Walk clip with key markers, frame stepping, playback, Auto Key, and a range test
- Native `.gforge` project open/save and JSON metadata export through Tauri
- Browser fallbacks for previewing the interface without the desktop shell

Mesh generation, weight painting, AI auto-rigging, curve editing, physics, multiple characters, skins, and rendered sprite-sheet export are intentionally outside this release.

## Run it

Requirements:

- Node.js 22 LTS or newer
- Current stable Rust toolchain
- Tauri 2 system prerequisites; on Windows this includes Microsoft Edge WebView2 and the Microsoft C++ build tools

Install dependencies:

```powershell
npm install
```

Run the desktop application:

```powershell
npm run tauri:dev
```

For a fast browser preview:

```powershell
npm run dev
```

Then open `http://127.0.0.1:1420`.

## Controls

| Input | Action |
| --- | --- |
| `Q` | Select tool |
| `W` | Move tool |
| `E` | Rotate tool |
| `B` | Bone tool |
| `K` | Keyframe tool |
| Drag a joint | Reposition the selected rig joint; Auto Key records the active animation frame |
| `Space` | Play or pause the active clip |
| Left / Right arrow | Step one frame |
| `Ctrl+S` | Save the project |

### Add an animation key

1. Open **Animate** and select a timeline track.
2. Click the track lane at the frame you want to edit.
3. Turn **Auto Key** on.
4. Drag the selected joint or IK target in the viewport.
5. Confirm the green **Key saved** state in the inspector and the enlarged amber key marker on the active frame. A short Auto Key confirmation also appears after the edit.

Auto Key is available only in **Animate**. Moving joints in **Rig** edits the rest pose and does not create animation keys; leaving Animate automatically turns Auto Key off.

## Project data

- `.gforge` stores the editable Graphite Forge project as versioned JSON.
- JSON export writes engine-friendly rig, pose, and clip metadata.
- Rendered sprite-sheet export is visible as a future option but disabled in v0.1.0.

## Verify and build

```powershell
npm run check
npm run test:sites
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
npm run tauri:build
```

`npm run tauri:build` creates the native executable without packaging an installer. The selected design, implementation evidence, and QA report live under [`docs/design`](docs/design) and [`design-qa.md`](design-qa.md).

## Next stage

The next release is intentionally undecided. Candidate workflows include richer rig setup, real mesh/weight editing, or rendered sprite-sheet export; the choice should follow hands-on feedback from v0.1.0.
