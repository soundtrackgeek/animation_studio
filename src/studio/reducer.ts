import { createDefaultProject } from "./data";
import { evaluateStudioPose, sampleBoneTransform } from "./pose";
import { loadRecoveredProject } from "./project";
import type {
  BoneNode,
  BoneTransform,
  Keyframe,
  StudioAction,
  StudioProject,
  StudioState,
} from "./types";

export { STORAGE_KEY } from "./project";

export function createInitialState(): StudioState {
  const project = loadRecoveredProject(createDefaultProject());
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
    draftPose: {},
  };
}

function updatedProject(project: StudioProject, patch: Partial<StudioProject>): StudioProject {
  return { ...project, ...patch, updatedAt: new Date().toISOString() };
}

function withoutDraft(state: StudioState, boneId: string): StudioState["draftPose"] {
  const { [boneId]: _, ...remaining } = state.draftPose;
  return remaining;
}

function recordKeyframe(
  state: StudioState,
  bone: BoneNode,
  transform: BoneTransform,
): StudioProject {
  const clip = state.project.clips[0];
  const currentKey = clip.keyframes.find(
    (keyframe) => keyframe.boneId === bone.id && keyframe.frame === state.currentFrame,
  );
  const nextKey: Keyframe = {
    id: currentKey?.id ?? `key-${bone.id}-${state.currentFrame}-${Date.now()}`,
    boneId: bone.id,
    frame: state.currentFrame,
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation,
    interpolation: currentKey?.interpolation ?? "bezier",
  };
  const keyframes = currentKey
    ? clip.keyframes.map((keyframe) => (keyframe.id === currentKey.id ? nextKey : keyframe))
    : [...clip.keyframes, nextKey];
  return updatedProject(state.project, {
    clips: state.project.clips.map((item) => (item.id === clip.id ? { ...item, keyframes } : item)),
  });
}

function changeRestBone(
  state: StudioState,
  boneId: string,
  change: (bone: BoneNode) => BoneNode,
): StudioState {
  return {
    ...state,
    project: updatedProject(state.project, {
      bones: state.project.bones.map((bone) => (bone.id === boneId ? change(bone) : bone)),
    }),
  };
}

function animationTransform(state: StudioState, bone: BoneNode): BoneTransform {
  return state.draftPose[bone.id]
    ?? sampleBoneTransform(state.project, bone, state.currentFrame);
}

function previewOrRecord(
  state: StudioState,
  bone: BoneNode,
  transform: BoneTransform,
): StudioState {
  if (!state.autoKey) {
    return {
      ...state,
      draftPose: { ...state.draftPose, [bone.id]: transform },
      notice: `Pose preview · ${bone.name} · set a key to save`,
    };
  }
  return {
    ...state,
    project: recordKeyframe(state, bone, transform),
    draftPose: withoutDraft(state, bone.id),
    notice: `Auto Key saved · ${bone.name} · frame ${state.currentFrame}`,
  };
}

function moveAnimatedBone(
  state: StudioState,
  bone: BoneNode,
  x: number,
  y: number,
): StudioState {
  const pose = evaluateStudioPose(state.project, state.currentFrame, state.draftPose, {
    animate: true,
    applyIk: true,
  });
  const evaluated = pose.get(bone.id);
  if (!evaluated) return state;
  const current = animationTransform(state, bone);
  return previewOrRecord(state, bone, {
    ...current,
    x: current.x + x - evaluated.x,
    y: current.y + y - evaluated.y,
  });
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "set_mode":
      return {
        ...state,
        mode: action.mode,
        autoKey: action.mode === "animate" ? state.autoKey : false,
        stressTest: action.mode === "rig" ? state.stressTest : false,
        isPlaying: action.mode === "animate" ? state.isPlaying : false,
        draftPose: {},
      };
    case "set_tool":
      return { ...state, tool: action.tool };
    case "select_bone":
      return { ...state, selectedBoneId: action.boneId };
    case "move_bone": {
      const bone = state.project.bones.find((item) => item.id === action.boneId);
      if (!bone) return state;
      if (state.mode === "animate") {
        return moveAnimatedBone(state, bone, action.x, action.y);
      }
      return changeRestBone(
        state,
        action.boneId,
        (current) => ({ ...current, x: action.x, y: action.y }),
      );
    }
    case "rotate_bone": {
      const bone = state.project.bones.find((item) => item.id === action.boneId);
      if (!bone) return state;
      if (state.mode === "animate") {
        return previewOrRecord(state, bone, {
          ...animationTransform(state, bone),
          rotation: action.rotation,
        });
      }
      return changeRestBone(
        state,
        action.boneId,
        (current) => ({ ...current, rotation: action.rotation }),
      );
    }
    case "set_frame":
      return {
        ...state,
        currentFrame: Math.max(0, Math.min(state.project.clips[0].duration, action.frame)),
        draftPose: {},
      };
    case "advance_frame": {
      const clip = state.project.clips[0];
      if (state.currentFrame < clip.duration) {
        return { ...state, currentFrame: state.currentFrame + 1, draftPose: {} };
      }
      return clip.loop
        ? { ...state, currentFrame: 0, draftPose: {} }
        : { ...state, currentFrame: clip.duration, isPlaying: false, draftPose: {} };
    }
    case "set_playing":
      return {
        ...state,
        isPlaying: action.playing,
        currentFrame: action.playing && state.currentFrame >= state.project.clips[0].duration
          ? 0
          : state.currentFrame,
        draftPose: {},
      };
    case "toggle_loop":
      return {
        ...state,
        project: updatedProject(state.project, {
          clips: state.project.clips.map((clip, index) => (
            index === 0 ? { ...clip, loop: !clip.loop } : clip
          )),
        }),
      };
    case "toggle_auto_key":
      return state.mode === "animate"
        ? { ...state, autoKey: !state.autoKey }
        : { ...state, autoKey: false };
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
        selectedBoneId: action.project.bones.some((bone) => bone.id === "foot-ik-near")
          ? "foot-ik-near"
          : action.project.bones[0]?.id ?? "",
        currentFrame: 0,
        isPlaying: false,
        draftPose: {},
        projectMenuOpen: false,
        notice: action.notice ?? "Project opened",
      };
    case "replace_sprite":
      return {
        ...state,
        project: updatedProject(state.project, { name: action.projectName, sprite: action.sprite }),
        mode: "prepare",
        isPlaying: false,
        draftPose: {},
        projectMenuOpen: false,
        notice: "Artwork imported. Review the isolation before rigging.",
      };
    case "set_render_profile":
      return {
        ...state,
        project: updatedProject(state.project, {
          sprite: { ...state.project.sprite, renderProfile: action.profile },
        }),
      };
    case "toggle_background_removal":
      return {
        ...state,
        project: updatedProject(state.project, {
          sprite: {
            ...state.project.sprite,
            removeBackground: !state.project.sprite.removeBackground,
          },
        }),
      };
    case "toggle_constraint":
      return {
        ...state,
        project: updatedProject(state.project, {
          constraints: state.project.constraints.map((constraint) =>
            constraint.id === action.constraintId
              ? { ...constraint, enabled: !constraint.enabled }
              : constraint,
          ),
        }),
      };
    case "add_key": {
      const bone = state.project.bones.find((item) => item.id === action.boneId);
      if (!bone) return state;
      const transform = animationTransform(state, bone);
      return {
        ...state,
        project: recordKeyframe(state, bone, transform),
        draftPose: withoutDraft(state, bone.id),
        notice: `Keyed ${bone.name} at frame ${state.currentFrame}`,
      };
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
    case "set_key_interpolation":
      return {
        ...state,
        project: updatedProject(state.project, {
          clips: state.project.clips.map((clip) => ({
            ...clip,
            keyframes: clip.keyframes.map((keyframe) => (
              keyframe.id === action.keyId
                ? { ...keyframe, interpolation: action.interpolation }
                : keyframe
            )),
          })),
        }),
      };
    case "set_notice":
      return { ...state, notice: action.notice };
    default:
      return state;
  }
}
