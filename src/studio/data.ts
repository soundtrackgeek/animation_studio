import type { AnimationClip, BoneNode, RigConstraint, StudioProject } from "./types";

export const DEFAULT_BONES: BoneNode[] = [
  { id: "root", name: "Root", parentId: null, x: 0.48, y: 0.51, rotation: 0, side: "center", kind: "bone" },
  { id: "pelvis", name: "Pelvis", parentId: "root", x: 0.5, y: 0.48, rotation: 0, side: "center", kind: "bone" },
  { id: "spine", name: "Spine", parentId: "pelvis", x: 0.49, y: 0.37, rotation: -2, side: "center", kind: "bone" },
  { id: "chest", name: "Chest", parentId: "spine", x: 0.48, y: 0.27, rotation: -2, side: "center", kind: "bone" },
  { id: "neck", name: "Neck", parentId: "chest", x: 0.5, y: 0.16, rotation: 0, side: "center", kind: "bone" },
  { id: "head", name: "Head", parentId: "neck", x: 0.48, y: 0.09, rotation: 0, side: "center", kind: "bone" },

  { id: "arm-near", name: "Left Arm", parentId: "chest", x: 0.42, y: 0.28, rotation: 1, side: "near", kind: "bone" },
  { id: "forearm-near", name: "Left Forearm", parentId: "arm-near", x: 0.4, y: 0.43, rotation: 4, side: "near", kind: "bone" },
  { id: "hand-near", name: "Left Hand", parentId: "forearm-near", x: 0.43, y: 0.55, rotation: 0, side: "near", kind: "bone" },
  { id: "arm-far", name: "Right Arm", parentId: "chest", x: 0.55, y: 0.29, rotation: -4, side: "far", kind: "bone" },
  { id: "forearm-far", name: "Right Forearm", parentId: "arm-far", x: 0.57, y: 0.42, rotation: -2, side: "far", kind: "bone" },
  { id: "hand-far", name: "Right Hand", parentId: "forearm-far", x: 0.55, y: 0.53, rotation: 0, side: "far", kind: "bone" },

  { id: "thigh-near", name: "Left Thigh", parentId: "pelvis", x: 0.52, y: 0.65, rotation: 0, side: "near", kind: "bone" },
  { id: "shin-near", name: "Left Shin", parentId: "thigh-near", x: 0.54, y: 0.81, rotation: 0, side: "near", kind: "bone" },
  { id: "ankle-near", name: "Left Ankle", parentId: "shin-near", x: 0.56, y: 0.92, rotation: 0, side: "near", kind: "bone" },
  { id: "foot-ik-near", name: "Left Foot IK", parentId: "ankle-near", x: 0.66, y: 0.95, rotation: 0, side: "near", kind: "ik" },
  { id: "toe-near", name: "Left Toe", parentId: "foot-ik-near", x: 0.72, y: 0.95, rotation: 0, side: "near", kind: "bone" },
  { id: "thigh-far", name: "Right Thigh", parentId: "pelvis", x: 0.45, y: 0.65, rotation: 0, side: "far", kind: "bone" },
  { id: "shin-far", name: "Right Shin", parentId: "thigh-far", x: 0.47, y: 0.82, rotation: 0, side: "far", kind: "bone" },
  { id: "ankle-far", name: "Right Ankle", parentId: "shin-far", x: 0.47, y: 0.93, rotation: 0, side: "far", kind: "bone" },
  { id: "foot-ik-far", name: "Right Foot IK", parentId: "ankle-far", x: 0.56, y: 0.96, rotation: 0, side: "far", kind: "ik" },
];

export const DEFAULT_CONSTRAINTS: RigConstraint[] = [
  { id: "arm-parent", name: "Arm_Parent_Offset", targetBoneId: "arm-near", enabled: true, type: "stretch", softness: 0, mix: 0.8 },
  { id: "foot-plant-left", name: "Foot_Plant_L", targetBoneId: "foot-ik-near", enabled: true, type: "two-bone-ik", softness: 0.05, mix: 1 },
  { id: "foot-plant-right", name: "Foot_Plant_R", targetBoneId: "foot-ik-far", enabled: true, type: "two-bone-ik", softness: 0.05, mix: 1 },
  { id: "spine-stretch", name: "Spine_Stretch", targetBoneId: "spine", enabled: true, type: "stretch", softness: 0.08, mix: 0.65 },
  { id: "neck-aim", name: "Neck_Aim", targetBoneId: "neck", enabled: false, type: "pin", softness: 0.12, mix: 0.4 },
];

const WALK_KEYS: AnimationClip["keyframes"] = [
  ["thigh-near", 0, -18], ["thigh-near", 15, 23], ["thigh-near", 30, -18], ["thigh-near", 45, 23], ["thigh-near", 60, -18],
  ["shin-near", 0, 9], ["shin-near", 12, 34], ["shin-near", 30, 9], ["shin-near", 42, 34], ["shin-near", 60, 9],
  ["foot-ik-near", 0, 0], ["foot-ik-near", 18, -8], ["foot-ik-near", 30, 0], ["foot-ik-near", 48, -8], ["foot-ik-near", 60, 0],
  ["toe-near", 0, 0], ["toe-near", 18, 12], ["toe-near", 30, 0], ["toe-near", 48, 12], ["toe-near", 60, 0],
].map(([boneId, frame, rotation], index) => {
  const bone = DEFAULT_BONES.find((item) => item.id === boneId)!;
  return {
    id: `seed-key-${index}`,
    boneId: boneId as string,
    frame: frame as number,
    x: bone.x,
    y: bone.y,
    rotation: rotation as number,
    interpolation: "bezier" as const,
  };
});

export function createDefaultProject(now = new Date()): StudioProject {
  const timestamp = now.toISOString();
  return {
    schemaVersion: "0.1.0",
    name: "Stellar Merc",
    createdAt: timestamp,
    updatedAt: timestamp,
    facing: "right",
    sprite: {
      dataUrl: "/assets/stellar-merc-side.png",
      fileName: "stellar-merc-side.png",
      removeBackground: true,
      renderProfile: "illustrated",
    },
    bones: DEFAULT_BONES.map((bone) => ({ ...bone })),
    constraints: DEFAULT_CONSTRAINTS.map((constraint) => ({ ...constraint })),
    clips: [
      {
        id: "walk",
        name: "Walk",
        fps: 60,
        duration: 60,
        loop: true,
        keyframes: WALK_KEYS.map((keyframe) => ({ ...keyframe })),
      },
    ],
  };
}

export const TIMELINE_BONE_IDS = ["thigh-near", "shin-near", "foot-ik-near", "toe-near"];
