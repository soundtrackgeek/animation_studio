import { beforeEach, describe, expect, it } from "vitest";
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
    state = studioReducer(state, { type: "toggle_auto_key" });
    state = studioReducer(state, { type: "set_frame", frame: 22 });
    state = studioReducer(state, { type: "move_bone", boneId: "foot-ik-near", x: 0.64, y: 0.94, recordKey: state.autoKey });
    const key = state.project.clips[0].keyframes.find((item) => item.boneId === "foot-ik-near" && item.frame === 22);
    expect(key).toMatchObject({ x: 0.64, y: 0.94 });
  });

  it("switches between illustrated and pixel-safe rendering", () => {
    const state = createInitialState();
    const next = studioReducer(state, { type: "set_render_profile", profile: "pixel" });
    expect(next.project.sprite.renderProfile).toBe("pixel");
  });
});
