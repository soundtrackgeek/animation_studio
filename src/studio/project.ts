import type { StudioProject } from "./types";

export const PROJECT_SCHEMA_VERSION = "0.2.0" as const;
export const STORAGE_KEY = "graphite-forge:project:v0.2.0";
export const LEGACY_STORAGE_KEYS = ["graphite-forge:project:v0.1.0"] as const;

function isProjectShape(value: unknown): value is Omit<StudioProject, "schemaVersion"> & { schemaVersion: string } {
  if (!value || typeof value !== "object") return false;
  const project = value as Record<string, unknown>;
  return (
    (project.schemaVersion === "0.1.0" || project.schemaVersion === PROJECT_SCHEMA_VERSION)
    && typeof project.name === "string"
    && Array.isArray(project.bones)
    && Array.isArray(project.constraints)
    && Array.isArray(project.clips)
    && Boolean(project.sprite && typeof project.sprite === "object")
  );
}

export function migrateStudioProject(value: unknown): StudioProject {
  if (!isProjectShape(value)) throw new Error("Unsupported or damaged project version");
  const legacy = value as Omit<StudioProject, "schemaVersion"> & { schemaVersion: string };
  const boneById = new Map(legacy.bones.map((bone) => [bone.id, bone]));
  return {
    ...legacy,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    constraints: legacy.constraints.map((constraint) => {
      if (constraint.type !== "two-bone-ik") return constraint;
      const target = boneById.get(constraint.targetBoneId);
      const end = target?.parentId ? boneById.get(target.parentId) : undefined;
      return {
        ...constraint,
        targetOffsetX: constraint.targetOffsetX ?? (target && end ? target.x - end.x : 0),
        targetOffsetY: constraint.targetOffsetY ?? (target && end ? target.y - end.y : 0),
      };
    }),
  };
}

export function loadRecoveredProject(fallback: StudioProject): StudioProject {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return migrateStudioProject(JSON.parse(current));

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (!legacy) continue;
      const migrated = migrateStudioProject(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // Recovery data should never prevent the editor from opening.
  }
  return fallback;
}
