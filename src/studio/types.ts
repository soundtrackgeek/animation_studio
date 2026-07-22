export type WorkspaceMode = "prepare" | "rig" | "animate" | "export";
export type ToolId = "select" | "move" | "rotate" | "bone" | "mesh" | "weights" | "ik" | "pan" | "zoom";
export type BoneSide = "near" | "far" | "center";
export type RenderProfile = "illustrated" | "pixel";

export interface SpriteSource {
  dataUrl: string;
  originalPath?: string;
  fileName: string;
  removeBackground: boolean;
  renderProfile: RenderProfile;
}

export interface BoneNode {
  id: string;
  name: string;
  parentId: string | null;
  x: number;
  y: number;
  rotation: number;
  side: BoneSide;
  kind: "bone" | "ik";
  locked?: boolean;
}

export interface RigConstraint {
  id: string;
  name: string;
  targetBoneId: string;
  enabled: boolean;
  type: "two-bone-ik" | "pin" | "stretch";
  softness: number;
  mix: number;
}

export interface Keyframe {
  id: string;
  boneId: string;
  frame: number;
  x: number;
  y: number;
  rotation: number;
  interpolation: "linear" | "bezier" | "stepped";
}

export interface AnimationClip {
  id: string;
  name: string;
  fps: number;
  duration: number;
  loop: boolean;
  keyframes: Keyframe[];
}

export interface StudioProject {
  schemaVersion: "0.1.0";
  name: string;
  createdAt: string;
  updatedAt: string;
  facing: "left" | "right";
  sprite: SpriteSource;
  bones: BoneNode[];
  constraints: RigConstraint[];
  clips: AnimationClip[];
}

export interface StudioState {
  project: StudioProject;
  mode: WorkspaceMode;
  tool: ToolId;
  selectedBoneId: string;
  currentFrame: number;
  isPlaying: boolean;
  autoKey: boolean;
  zoom: number;
  stressTest: boolean;
  projectMenuOpen: boolean;
  notice: string | null;
}

export type StudioAction =
  | { type: "set_mode"; mode: WorkspaceMode }
  | { type: "set_tool"; tool: ToolId }
  | { type: "select_bone"; boneId: string }
  | { type: "move_bone"; boneId: string; x: number; y: number; recordKey?: boolean }
  | { type: "rotate_bone"; boneId: string; rotation: number; recordKey?: boolean }
  | { type: "set_frame"; frame: number }
  | { type: "set_playing"; playing: boolean }
  | { type: "toggle_auto_key" }
  | { type: "set_zoom"; zoom: number }
  | { type: "set_stress_test"; enabled: boolean }
  | { type: "set_project_menu"; open: boolean }
  | { type: "replace_project"; project: StudioProject; notice?: string }
  | { type: "replace_sprite"; sprite: SpriteSource; projectName: string }
  | { type: "set_render_profile"; profile: RenderProfile }
  | { type: "toggle_background_removal" }
  | { type: "toggle_constraint"; constraintId: string }
  | { type: "add_key"; boneId: string }
  | { type: "delete_key"; keyId: string }
  | { type: "set_notice"; notice: string | null };
