import { beforeEach, describe, expect, it } from "vitest";
import { findBoneAtPoint } from "./hitTest";
import { createInitialState, studioReducer } from "./reducer";

describe("studio reducer", () => {
  beforeEach(() => localStorage.clear());

  it("moves a selected bone without changing the rest pose siblings", () => {
    const state = createInitialState();
    const next = studioReducer(state, { type: "move_bone", boneId: "foot-ik-near", x: 0.61, y: 0.91 });
    expect(next.project.bones.find((bone) => bone.id === "foot-ik-near")).toMatchObject({ x: 0.61, y: 0.91 });
    expect(next.project.bones.find((bone) => bone.id === "foot-ik-far")).toMatchObject({ x: 0.56, y: 0.96 });
  });

  it("records a key when a transform is edited with auto key enabled", () => {
    let state = createInitialState();
    state = studioReducer(state, { type: "set_mode", mode: "animate" });
    state = studioReducer(state, { type: "select_bone", boneId: "foot-ik-near" });
    state = studioReducer(state, { type: "set_frame", frame: 25 });
    state = studioReducer(state, { type: "toggle_auto_key" });
    state = studioReducer(state, { type: "move_bone", boneId: "foot-ik-near", x: 0.64, y: 0.94 });
    const key = state.project.clips[0].keyframes.find((item) => item.boneId === "foot-ik-near" && item.frame === 25);
    expect(key).toMatchObject({ x: 0.64, y: 0.94 });
    expect(state.notice).toBe("Auto Key saved · Left Foot IK · frame 25");
  });

  it("keeps an already-selected IK target draggable when its hit area overlaps a nearby bone", () => {
    const state = createInitialState();
    const hit = findBoneAtPoint(state.project.bones, "foot-ik-near", { x: 0, y: 0, width: 300, height: 600 }, 207, 570);
    expect(hit).toBe("foot-ik-near");
  });

  it("never leaves Auto Key enabled outside the Animate workspace", () => {
    let state = createInitialState();
    state = studioReducer(state, { type: "set_mode", mode: "animate" });
    state = studioReducer(state, { type: "toggle_auto_key" });
    expect(state.autoKey).toBe(true);

    state = studioReducer(state, { type: "set_mode", mode: "rig" });
    expect(state.autoKey).toBe(false);

    state = studioReducer(state, { type: "toggle_auto_key" });
    expect(state.autoKey).toBe(false);
  });

  it("switches between illustrated and pixel-safe rendering", () => {
    const state = createInitialState();
    const next = studioReducer(state, { type: "set_render_profile", profile: "pixel" });
    expect(next.project.sprite.renderProfile).toBe("pixel");
  });
});
