import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultProject } from "./data";
import {
  loadRecoveredProject,
  migrateStudioProject,
  PROJECT_SCHEMA_VERSION,
  STORAGE_KEY,
} from "./project";

describe("project schema", () => {
  beforeEach(() => localStorage.clear());

  it("migrates v0.1 projects and derives stable IK target offsets", () => {
    const legacy = {
      ...createDefaultProject(),
      schemaVersion: "0.1.0",
      constraints: createDefaultProject().constraints.map((constraint) => {
        const { targetOffsetX: _, targetOffsetY: __, ...rest } = constraint;
        return rest;
      }),
    };

    const migrated = migrateStudioProject(legacy);
    const footConstraint = migrated.constraints.find((constraint) => constraint.id === "foot-plant-left")!;

    expect(migrated.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
    expect(footConstraint.targetOffsetX).toBeCloseTo(0.1);
    expect(footConstraint.targetOffsetY).toBeCloseTo(0.03);
  });

  it("moves legacy recovery data to the current storage key", () => {
    const legacy = { ...createDefaultProject(), schemaVersion: "0.1.0" };
    localStorage.setItem("graphite-forge:project:v0.1.0", JSON.stringify(legacy));

    expect(loadRecoveredProject(createDefaultProject()).schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
  });
});
