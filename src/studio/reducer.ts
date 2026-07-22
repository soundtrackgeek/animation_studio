import { createDefaultProject } from "./data";
import type { BoneNode, Keyframe, StudioAction, StudioProject, StudioState } from "./types";

export const STORAGE_KEY = "graphite-forge:project:v0.1.0";

export function createInitialState(): StudioState {
  let project = createDefaultProject();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StudioProject;
      if (parsed.schemaVersion === "0.1.0") project = parsed;
    }
  } catch {
    // A damaged recovery entry should never prevent the editor from opening.
  }

  return {
    project,
    mode: "rig",
    tool: "select",
    selectedBoneId: "foot-ik-near",
    currentFrame: 18,
    isPlaying: false,
    autoKey: false,
    zoom: 0.71,
    stressTest: false,
    projectMenuOpen: false,
    notice: null,
  };
}
function updatedProject(project: StudioProject, patch: Partial<StudioProject>): StudioProject {
  return { ...project, ...patch, updatedAt: new Date().toISOString() };
}

function recordKeyframe(state: StudioState, bone: BoneNode): StudioProject {
  const clip = state.project.clips[0];
  const currentKey = clip.keyframes.find(
    (keyframe) => keyframe.boneId === bone.id && keyframe.frame === state.currentFrame,
  );
  const nextKey: Keyframe = {
    id: currentKey?.id ?? `key-${bone.id}-${state.currentFrame}-${Date.now()}`,
    boneId: bone.id,
    frame: state.currentFrame,
    x: bone.x,
    y: bone.y,
    rotation: bone.rotation,
    interpolation: currentKey?.interpolation ?? "bezier",
  };
  const keyframes = currentKey
    ? clip.keyframes.map((keyframe) => (keyframe.id === currentKey.id ? nextKey : keyframe))
    : [...clip.keyframes, nextKey];
  return updatedProject(state.project, {
    clips: state.project.clips.map((item) => (item.id === clip.id ? { ...item, keyframes } : item)),
  });
}

function changeBone(
  state: StudioState,
  boneId: string,
  change: (bone: BoneNode) => BoneNode,
  shouldRecord: boolean,
): StudioState {
  const bones = state.project.bones.map((bone) => (bone.id === boneId ? change(bone) : bone));
  const project = updatedProject(state.project, { bones });
  if (!shouldRecord) return { ...state, project };
  const changedBone = bones.find((bone) => bone.id === boneId)!;
  return { ...state, project: recordKeyframe({ ...state, project }, changedBone) };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "set_mode":
      return { ...state, mode: action.mode, stressTest: action.mode === "rig" ? state.stressTest : false };
    case "set_tool":
      return { ...state, tool: action.tool };
    case "select_bone":
      return { ...state, selectedBoneId: action.boneId };
    case "move_bone":
      return changeBone(
        state,
        action.boneId,
        (bone) => ({ ...bone, x: action.x, y: action.y }),
        Boolean(action.recordKey),
      );
    case "rotate_bone":
      return changeBone(
        state,
        action.boneId,
        (bone) => ({ ...bone, rotation: action.rotation }),
        Boolean(action.recordKey),
      );
    case "set_frame":
      return { ...state, currentFrame: Math.max(0, Math.min(state.project.clips[0].duration, action.frame)) };
    case "set_playing":
      return { ...state, isPlaying: action.playing };
    case "toggle_auto_key":
      return { ...state, autoKey: !state.autoKey };
    case "set_zoom":
      return { ...state, zoom: Math.max(0.35, Math.min(1.4, action.zoom)) };
    case "set_stress_test":
      return { ...state, stressTest: action.enabled };
    case "set_project_menu":
      return { ...state, projectMenuOpen: action.open };
    case "replace_project":
      return {
        ...state,
        project: action.project,
        selectedBoneId: action.project.bones.some((bone) => bone.id === "foot-ik-near") ? "foot-ik-near" : action.project.bones[0]?.id ?? "",
        currentFrame: 0,
        projectMenuOpen: false,
        notice: action.notice ?? "Project opened",
      };
    case "replace_sprite":
      return {
        ...state,
        project: updatedProject(state.project, { name: action.projectName, sprite: action.sprite }),
        mode: "prepare",
        projectMenuOpen: false,
        notice: "Artwork imported. Review the isolation before rigging.",
      };
    case "set_render_profile":
      return {
        ...state,
        project: updatedProject(state.project, { sprite: { ...state.project.sprite, renderProfile: action.profile } }),
      };
    case "toggle_background_removal":
      return {
        ...state,
        project: updatedProject(state.project, {
          sprite: { ...state.project.sprite, removeBackground: !state.project.sprite.removeBackground },
        }),
      };
    case "toggle_constraint":
      return {
        ...state,
        project: updatedProject(state.project, {
          constraints: state.project.constraints.map((constraint) =>
            constraint.id === action.constraintId ? { ...constraint, enabled: !constraint.enabled } : constraint,
          ),
        }),
      };
    case "add_key": {
      const bone = state.project.bones.find((item) => item.id === action.boneId);
      return bone ? { ...state, project: recordKeyframe(state, bone), notice: `Keyed ${bone.name} at frame ${state.currentFrame}` } : state;
    }
    case "delete_key":
      return {
        ...state,
        project: updatedProject(state.project, {
          clips: state.project.clips.map((clip) => ({
            ...clip,
            keyframes: clip.keyframes.filter((keyframe) => keyframe.id !== action.keyId),
          })),
        }),
      };
    case "set_notice":
      return { ...state, notice: action.notice };
    default:
      return state;
  }
}
