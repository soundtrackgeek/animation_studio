import type { BoneNode } from "./types";

export interface RigDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function distanceToBone(bone: BoneNode, rect: RigDrawRect, x: number, y: number): number {
  return Math.hypot(rect.x + bone.x * rect.width - x, rect.y + bone.y * rect.height - y);
}

export function findBoneAtPoint(
  bones: BoneNode[],
  selectedBoneId: string,
  rect: RigDrawRect,
  x: number,
  y: number,
): string | null {
  const selectedBone = bones.find((bone) => bone.id === selectedBoneId);
  const selectedRadius = selectedBone?.kind === "ik" ? 24 : 18;
  if (selectedBone && distanceToBone(selectedBone, rect, x, y) <= selectedRadius) return selectedBone.id;

  let closest: { id: string; distance: number } | null = null;
  for (const bone of bones) {
    const distance = distanceToBone(bone, rect, x, y);
    if (distance <= 18 && (!closest || distance < closest.distance)) closest = { id: bone.id, distance };
  }
  return closest?.id ?? null;
}
