import { Bone } from "@phosphor-icons/react/Bone";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { Eye } from "@phosphor-icons/react/Eye";
import { FunnelSimple } from "@phosphor-icons/react/FunnelSimple";
import { ImageSquare } from "@phosphor-icons/react/ImageSquare";
import { LockSimple } from "@phosphor-icons/react/LockSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { Target } from "@phosphor-icons/react/Target";
import type { Dispatch } from "react";
import type { BoneNode, StudioAction, StudioState } from "../studio/types";

interface HierarchyPanelProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
}

function BoneRow({ bone, selected, onSelect, depth = 0 }: { bone: BoneNode; selected: boolean; onSelect: () => void; depth?: number }) {
  const colorClass = bone.side === "near" ? "near" : bone.side === "far" ? "far" : "center";
  return (
    <button type="button" className={`tree-row ${selected ? "selected" : ""}`} style={{ paddingLeft: 12 + depth * 14 }} onClick={onSelect}>
      <CaretRight className="tree-caret" size={11} />
      {bone.kind === "ik" ? <Target size={14} /> : <Bone size={14} />}
      <span className={`side-dot ${colorClass}`} />
      <span className="tree-label">{bone.name}</span>
      {bone.locked ? <LockSimple size={12} /> : null}
    </button>
  );
}

export function HierarchyPanel({ state, dispatch }: HierarchyPanelProps) {
  const project = state.project;
  const topBones = project.bones.filter((bone) => ["root", "spine", "arm-near", "arm-far", "thigh-near", "thigh-far"].includes(bone.id));

  return (
    <aside className="hierarchy-panel">
      <div className="hierarchy-search">
        <MagnifyingGlass size={14} />
        <input aria-label="Search hierarchy" placeholder="Search hierarchy" />
        <FunnelSimple size={14} />
      </div>

      <section className="tree-section artwork-section">
        <h2>Artwork</h2>
        <div className="tree-row static-row">
          <Eye size={14} />
          <ImageSquare size={14} />
          <span className="tree-label">{project.name.replace(/\s+/g, "")}_Side</span>
          <LockSimple size={12} />
        </div>
        {["Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"].map((part, index) => (
          <div className="tree-row static-row nested" key={part}>
            <CaretRight className="tree-caret" size={11} />
            <span className={`side-dot ${index % 2 === 0 ? "near" : "far"}`} />
            <span className="tree-label">{part}</span>
          </div>
        ))}
      </section>

      <section className="tree-section skeleton-section">
        <h2>Skeleton</h2>
        <div className="tree-row static-row root-row"><CaretDown size={11} /><Bone size={14} /><span className="tree-label">Root</span></div>
        {topBones.filter((bone) => bone.id !== "root").map((bone) => (
          <BoneRow
            key={bone.id}
            bone={bone}
            depth={1}
            selected={state.selectedBoneId === bone.id}
            onSelect={() => dispatch({ type: "select_bone", boneId: bone.id })}
          />
        ))}
        {project.bones.filter((bone) => !topBones.includes(bone) && !["pelvis", "chest", "neck", "head"].includes(bone.id)).map((bone) => (
          <BoneRow
            key={bone.id}
            bone={bone}
            depth={2}
            selected={state.selectedBoneId === bone.id}
            onSelect={() => dispatch({ type: "select_bone", boneId: bone.id })}
          />
        ))}
      </section>

      <section className="tree-section constraints-section">
        <h2>Constraints</h2>
        {project.constraints.map((constraint) => (
          <button
            type="button"
            key={constraint.id}
            className="tree-row constraint-row"
            onClick={() => dispatch({ type: "toggle_constraint", constraintId: constraint.id })}
          >
            <CaretRight className="tree-caret" size={11} />
            <Target size={13} />
            <span className="tree-label">{constraint.name}</span>
            <span className={`constraint-state ${constraint.enabled ? "enabled" : ""}`} />
          </button>
        ))}
      </section>
    </aside>
  );
}
