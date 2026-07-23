import type {
  AnimationClip,
  BoneNode,
  BoneTransform,
  DraftPose,
  Keyframe,
  StudioProject,
} from "./types";

export interface EvaluatedBonePose extends BoneTransform {
  worldRotation: number;
  translationX: number;
  translationY: number;
}

export type EvaluatedPose = Map<string, EvaluatedBonePose>;

export interface PoseEvaluationOptions {
  animate: boolean;
  applyIk: boolean;
  forceIk?: boolean;
}

const EPSILON = 0.000_001;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function rotate(x: number, y: number, degrees: number): { x: number; y: number } {
  const radians = degreesToRadians(degrees);
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine,
  };
}

function shortestRotation(from: number, to: number): number {
  return ((((to - from) + 180) % 360) + 360) % 360 - 180;
}

function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function interpolationAmount(keyframe: Keyframe, amount: number): number {
  if (keyframe.interpolation === "stepped") return 0;
  if (keyframe.interpolation === "bezier") return amount * amount * (3 - 2 * amount);
  return amount;
}

function keysForBone(clip: AnimationClip, boneId: string): Keyframe[] {
  const keys: Keyframe[] = [];
  for (const keyframe of clip.keyframes) {
    if (keyframe.boneId === boneId) keys.push(keyframe);
  }
  return keys.sort((left, right) => left.frame - right.frame);
}

export function sampleBoneTransform(
  project: StudioProject,
  bone: BoneNode,
  frame: number,
  draftPose: DraftPose = {},
): BoneTransform {
  const draft = draftPose[bone.id];
  if (draft) return draft;

  const clip = project.clips[0];
  const keys = clip ? keysForBone(clip, bone.id) : [];
  if (keys.length === 0) return { x: bone.x, y: bone.y, rotation: bone.rotation };

  const exact = keys.find((keyframe) => keyframe.frame === frame);
  if (exact) return { x: exact.x, y: exact.y, rotation: exact.rotation };
  if (frame <= keys[0].frame) return { x: keys[0].x, y: keys[0].y, rotation: keys[0].rotation };
  if (frame >= keys[keys.length - 1].frame) {
    const last = keys[keys.length - 1];
    return { x: last.x, y: last.y, rotation: last.rotation };
  }

  let left = keys[0];
  let right = keys[keys.length - 1];
  for (let index = 1; index < keys.length; index += 1) {
    if (keys[index].frame <= frame) continue;
    left = keys[index - 1];
    right = keys[index];
    break;
  }

  const frameRange = Math.max(1, right.frame - left.frame);
  const amount = interpolationAmount(left, (frame - left.frame) / frameRange);
  return {
    x: interpolate(left.x, right.x, amount),
    y: interpolate(left.y, right.y, amount),
    rotation: left.rotation + shortestRotation(left.rotation, right.rotation) * amount,
  };
}

function targetTrackTranslates(project: StudioProject, target: BoneNode, draftPose: DraftPose): boolean {
  const draft = draftPose[target.id];
  if (draft && (Math.abs(draft.x - target.x) > EPSILON || Math.abs(draft.y - target.y) > EPSILON)) {
    return true;
  }
  const clip = project.clips[0];
  return Boolean(clip?.keyframes.some((keyframe) => (
    keyframe.boneId === target.id
    && (Math.abs(keyframe.x - target.x) > EPSILON || Math.abs(keyframe.y - target.y) > EPSILON)
  )));
}

function solveTwoBoneIk(
  project: StudioProject,
  pose: EvaluatedPose,
  boneById: Map<string, BoneNode>,
  draftPose: DraftPose,
  forceIk: boolean,
): void {
  for (const constraint of project.constraints) {
    if (!constraint.enabled || constraint.type !== "two-bone-ik") continue;
    const target = boneById.get(constraint.targetBoneId);
    const targetPose = target ? pose.get(target.id) : undefined;
    const end = target?.parentId ? boneById.get(target.parentId) : undefined;
    const middle = end?.parentId ? boneById.get(end.parentId) : undefined;
    const start = middle?.parentId ? boneById.get(middle.parentId) : undefined;
    if (!target || !targetPose || !end || !middle || !start) continue;
    if (!forceIk && !targetTrackTranslates(project, target, draftPose)) continue;

    const startPose = pose.get(start.id);
    const middlePose = pose.get(middle.id);
    const endPose = pose.get(end.id);
    if (!startPose || !middlePose || !endPose) continue;

    const upperLength = Math.hypot(middle.x - start.x, middle.y - start.y);
    const lowerLength = Math.hypot(end.x - middle.x, end.y - middle.y);
    if (upperLength < EPSILON || lowerLength < EPSILON) continue;

    const footOffset = rotate(
      constraint.targetOffsetX ?? target.x - end.x,
      constraint.targetOffsetY ?? target.y - end.y,
      targetPose.worldRotation,
    );
    const desiredX = targetPose.x - footOffset.x;
    const desiredY = targetPose.y - footOffset.y;
    const targetX = desiredX - startPose.x;
    const targetY = desiredY - startPose.y;
    const rawDistance = Math.hypot(targetX, targetY);
    const minimumReach = Math.abs(upperLength - lowerLength) + EPSILON;
    const maximumReach = Math.max(minimumReach, upperLength + lowerLength - EPSILON);
    const distance = clamp(rawDistance, minimumReach, maximumReach);
    const baseAngle = Math.atan2(targetY, targetX);
    const cosine = clamp(
      (upperLength * upperLength + distance * distance - lowerLength * lowerLength)
        / (2 * upperLength * distance),
      -1,
      1,
    );
    const restCross = (
      (end.x - start.x) * (middle.y - start.y)
      - (end.y - start.y) * (middle.x - start.x)
    );
    const bendSign = Math.abs(restCross) > EPSILON
      ? Math.sign(restCross)
      : target.side === "far" ? -1 : 1;
    const upperAngle = baseAngle + Math.acos(cosine) * bendSign;
    const solvedMiddleX = startPose.x + Math.cos(upperAngle) * upperLength;
    const solvedMiddleY = startPose.y + Math.sin(upperAngle) * upperLength;
    const reachRatio = rawDistance > EPSILON ? distance / rawDistance : 0;
    const solvedEndX = startPose.x + targetX * reachRatio;
    const solvedEndY = startPose.y + targetY * reachRatio;
    const mix = clamp(constraint.mix, 0, 1);

    middlePose.x = interpolate(middlePose.x, solvedMiddleX, mix);
    middlePose.y = interpolate(middlePose.y, solvedMiddleY, mix);
    endPose.x = interpolate(endPose.x, solvedEndX, mix);
    endPose.y = interpolate(endPose.y, solvedEndY, mix);

    const restUpperAngle = Math.atan2(middle.y - start.y, middle.x - start.x);
    const restLowerAngle = Math.atan2(end.y - middle.y, end.x - middle.x);
    const solvedLowerAngle = Math.atan2(solvedEndY - solvedMiddleY, solvedEndX - solvedMiddleX);
    startPose.worldRotation = interpolate(
      startPose.worldRotation,
      radiansToDegrees(upperAngle - restUpperAngle),
      mix,
    );
    middlePose.worldRotation = interpolate(
      middlePose.worldRotation,
      radiansToDegrees(solvedLowerAngle - restLowerAngle),
      mix,
    );
  }
}

export function evaluateStudioPose(
  project: StudioProject,
  frame: number,
  draftPose: DraftPose = {},
  options: PoseEvaluationOptions = { animate: true, applyIk: true },
): EvaluatedPose {
  const boneById = new Map(project.bones.map((bone) => [bone.id, bone]));
  const pose: EvaluatedPose = new Map();
  const resolving = new Set<string>();

  const resolveBone = (bone: BoneNode): EvaluatedBonePose => {
    const existing = pose.get(bone.id);
    if (existing) return existing;
    if (resolving.has(bone.id)) throw new Error(`Bone hierarchy cycle detected at ${bone.name}`);
    resolving.add(bone.id);

    const sampled = options.animate
      ? sampleBoneTransform(project, bone, frame, draftPose)
      : draftPose[bone.id] ?? { x: bone.x, y: bone.y, rotation: bone.rotation };
    const translationX = sampled.x - bone.x;
    const translationY = sampled.y - bone.y;
    const parent = bone.parentId ? boneById.get(bone.parentId) : undefined;
    let evaluated: EvaluatedBonePose;

    if (!parent || bone.kind === "ik") {
      evaluated = {
        x: bone.x + translationX,
        y: bone.y + translationY,
        rotation: sampled.rotation,
        worldRotation: sampled.rotation - bone.rotation,
        translationX,
        translationY,
      };
    } else {
      const parentPose = resolveBone(parent);
      const restOffset = rotate(
        bone.x - parent.x,
        bone.y - parent.y,
        parentPose.worldRotation,
      );
      evaluated = {
        x: parentPose.x + restOffset.x + translationX,
        y: parentPose.y + restOffset.y + translationY,
        rotation: sampled.rotation,
        worldRotation: parentPose.worldRotation + sampled.rotation - bone.rotation,
        translationX,
        translationY,
      };
    }

    resolving.delete(bone.id);
    pose.set(bone.id, evaluated);
    return evaluated;
  };

  for (const bone of project.bones) resolveBone(bone);
  if (options.applyIk) {
    solveTwoBoneIk(project, pose, boneById, draftPose, options.forceIk === true);
  }
  return pose;
}
