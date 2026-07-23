import { describe, expect, it } from "vitest";
import { createDefaultProject } from "./data";
import { evaluateStudioPose, sampleBoneTransform } from "./pose";
import type { Keyframe } from "./types";

function key(
  boneId: string,
  frame: number,
  rotation: number,
  interpolation: Keyframe["interpolation"] = "linear",
): Keyframe {
  const project = createDefaultProject();
  const bone = project.bones.find((item) => item.id === boneId)!;
  return {
    id: `${boneId}-${frame}`,
    boneId,
    frame,
    x: bone.x,
    y: bone.y,
    rotation,
    interpolation,
  };
}

describe("pose evaluation", () => {
  it("interpolates rotation along the shortest path", () => {
    const project = createDefaultProject();
    project.clips[0].keyframes = [
      key("arm-near", 0, 170),
      key("arm-near", 10, -170),
    ];
    const bone = project.bones.find((item) => item.id === "arm-near")!;

    expect(sampleBoneTransform(project, bone, 5).rotation).toBeCloseTo(180);
  });

  it("holds stepped keys until the following frame", () => {
    const project = createDefaultProject();
    project.clips[0].keyframes = [
      key("arm-near", 0, 10, "stepped"),
      key("arm-near", 10, 80),
    ];
    const bone = project.bones.find((item) => item.id === "arm-near")!;

    expect(sampleBoneTransform(project, bone, 9).rotation).toBe(10);
    expect(sampleBoneTransform(project, bone, 10).rotation).toBe(80);
  });

  it("propagates a parent rotation through its descendants", () => {
    const project = createDefaultProject();
    project.constraints = [];
    project.clips[0].keyframes = [
      key("arm-near", 0, 0),
      key("arm-near", 10, 90),
    ];
    const restForearm = project.bones.find((bone) => bone.id === "forearm-near")!;
    const pose = evaluateStudioPose(project, 10, {}, { animate: true, applyIk: false });
    const arm = pose.get("arm-near")!;
    const forearm = pose.get("forearm-near")!;

    expect(forearm.x).not.toBeCloseTo(restForearm.x);
    expect(Math.hypot(forearm.x - arm.x, forearm.y - arm.y)).toBeCloseTo(
      Math.hypot(restForearm.x - 0.42, restForearm.y - 0.28),
    );
  });

  it("solves the configured two-bone leg toward a moved foot control", () => {
    const project = createDefaultProject();
    project.bones = project.bones.map((bone) => (
      bone.id === "foot-ik-near" ? { ...bone, x: bone.x - 0.08, y: bone.y - 0.07 } : bone
    ));
    const start = project.bones.find((bone) => bone.id === "thigh-near")!;
    const middle = project.bones.find((bone) => bone.id === "shin-near")!;
    const end = project.bones.find((bone) => bone.id === "ankle-near")!;
    const upperLength = Math.hypot(middle.x - start.x, middle.y - start.y);
    const lowerLength = Math.hypot(end.x - middle.x, end.y - middle.y);
    const pose = evaluateStudioPose(project, 0, {}, {
      animate: false,
      applyIk: true,
      forceIk: true,
    });
    const solvedStart = pose.get(start.id)!;
    const solvedMiddle = pose.get(middle.id)!;
    const solvedEnd = pose.get(end.id)!;

    expect(Math.hypot(
      solvedMiddle.x - solvedStart.x,
      solvedMiddle.y - solvedStart.y,
    )).toBeCloseTo(upperLength, 5);
    expect(Math.hypot(
      solvedEnd.x - solvedMiddle.x,
      solvedEnd.y - solvedMiddle.y,
    )).toBeCloseTo(lowerLength, 5);
    expect(solvedEnd.y).toBeLessThan(end.y);
  });
});
