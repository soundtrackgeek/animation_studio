import { ArrowClockwise } from "@phosphor-icons/react/ArrowClockwise";
import { Check } from "@phosphor-icons/react/Check";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { Export } from "@phosphor-icons/react/Export";
import { ImageSquare } from "@phosphor-icons/react/ImageSquare";
import { Lightning } from "@phosphor-icons/react/Lightning";
import { LockSimple } from "@phosphor-icons/react/LockSimple";
import { Target } from "@phosphor-icons/react/Target";
import type { Dispatch } from "react";
import type { BoneNode, StudioAction, StudioState } from "../studio/types";

interface InspectorPanelProps {
  state: StudioState;
  selectedBone: BoneNode;
  dispatch: Dispatch<StudioAction>;
  onExport: () => void;
}

function RecentProject({ state }: Pick<InspectorPanelProps, "state">) {
  return (
    <section className="recent-projects">
      <h3>Recent project</h3>
      <div className="recent-project-row">
        <img src="/assets/ranger-pixel-side.png" alt="Pixel-art ranger side profile" />
        <div><strong>Ranger Pixel</strong><span>Pixel safe · 64 × 96</span></div>
      </div>
    </section>
  );
}

function NumberField({ value, suffix, onChange, step = 0.01 }: { value: number; suffix?: string; onChange: (value: number) => void; step?: number }) {
  return (
    <label className="number-field">
      <input type="number" value={Number.isFinite(value) ? value : 0} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      {suffix ? <span>{suffix}</span> : null}
    </label>
  );
}

function PrepareInspector({ state, dispatch }: Pick<InspectorPanelProps, "state" | "dispatch">) {
  return (
    <>
      <div className="inspector-title"><ImageSquare weight="duotone" /><div><strong>Artwork preflight</strong><span>{state.project.sprite.fileName}</span></div></div>
      <section className="inspector-section">
        <h3>Isolation</h3>
        <button className="toggle-row" type="button" onClick={() => dispatch({ type: "toggle_background_removal" })}>
          <span>Remove near-white background</span><span className={`switch ${state.project.sprite.removeBackground ? "on" : ""}`}><i /></span>
        </button>
        <div className="readiness-row"><Check weight="bold" /> Side profile detected</div>
        <div className="readiness-row"><Check weight="bold" /> Feet baseline found</div>
        <div className="readiness-row"><Check weight="bold" /> Artwork ready for rigging</div>
      </section>
      <section className="inspector-section">
        <h3>Deformation profile</h3>
        <div className="segmented two-up">
          <button type="button" className={state.project.sprite.renderProfile === "illustrated" ? "active" : ""} onClick={() => dispatch({ type: "set_render_profile", profile: "illustrated" })}>Illustrated</button>
          <button type="button" className={state.project.sprite.renderProfile === "pixel" ? "active" : ""} onClick={() => dispatch({ type: "set_render_profile", profile: "pixel" })}>Pixel safe</button>
        </div>
      </section>
      <button className="primary-action" type="button" onClick={() => dispatch({ type: "set_mode", mode: "rig" })}>Continue to rig</button>
    </>
  );
}

function ExportInspector({ state, onExport }: Pick<InspectorPanelProps, "state" | "onExport">) {
  const clip = state.project.clips[0];
  return (
    <>
      <div className="inspector-title"><Export weight="duotone" /><div><strong>Export package</strong><span>{state.project.name} · {clip.name}</span></div></div>
      <section className="inspector-section">
        <h3>Recipe</h3>
        <div className="export-recipe selected"><DownloadSimple /><div><strong>Sprite metadata</strong><span>Rig, constraints and animation keys</span></div><Check /></div>
        <div className="export-recipe disabled"><ImageSquare /><div><strong>Rendered sheet</strong><span>Planned for v0.2</span></div><LockSimple /></div>
      </section>
      <section className="inspector-section">
        <h3>Validation</h3>
        <div className="readiness-row"><Check weight="bold" /> {state.project.bones.length} bones bound</div>
        <div className="readiness-row"><Check weight="bold" /> {clip.keyframes.length} keys in range</div>
        <div className="readiness-row"><Check weight="bold" /> Artwork source linked</div>
      </section>
      <button className="primary-action" type="button" onClick={onExport}>Export JSON metadata</button>
    </>
  );
}

export function InspectorPanel({ state, selectedBone, dispatch, onExport }: InspectorPanelProps) {
  if (state.mode === "prepare") return <aside className="inspector-panel"><PrepareInspector state={state} dispatch={dispatch} /><RecentProject state={state} /></aside>;
  if (state.mode === "export") return <aside className="inspector-panel"><ExportInspector state={state} onExport={onExport} /><RecentProject state={state} /></aside>;

  const leftConstraint = state.project.constraints.find((constraint) => constraint.id === "foot-plant-left")!;
  const animateMode = state.mode === "animate";
  const currentKey = state.project.clips[0].keyframes.find(
    (keyframe) => keyframe.boneId === selectedBone.id && keyframe.frame === state.currentFrame,
  );
  return (
    <aside className="inspector-panel">
      <div className="inspector-title">
        {selectedBone.kind === "ik" ? <Target weight="duotone" /> : <Lightning weight="duotone" />}
        <div><strong>{selectedBone.name}</strong><span>{animateMode ? "Animation transform" : selectedBone.kind === "ik" ? "Type: IK Target" : "Type: Bone"}</span></div>
      </div>

      <section className="inspector-section">
        <h3>Transform</h3>
        <div className="xy-fields">
          <span>Position</span><small>X</small>
          <NumberField value={selectedBone.x * 100} onChange={(x) => dispatch({ type: "move_bone", boneId: selectedBone.id, x: x / 100, y: selectedBone.y })} />
          <small>Y</small>
          <NumberField value={selectedBone.y * 100} onChange={(y) => dispatch({ type: "move_bone", boneId: selectedBone.id, x: selectedBone.x, y: y / 100 })} />
        </div>
        <div className="property-row"><span>Rotation</span><NumberField value={selectedBone.rotation} suffix="°" step={1} onChange={(rotation) => dispatch({ type: "rotate_bone", boneId: selectedBone.id, rotation })} /></div>
        <div className="property-row"><span>Scale</span><NumberField value={1} step={0.01} onChange={() => undefined} /></div>
        <button className="secondary-action" type="button" onClick={() => dispatch({ type: "rotate_bone", boneId: selectedBone.id, rotation: 0 })}><ArrowClockwise /> Reset transform</button>
      </section>

      {animateMode ? (
        <section className="inspector-section">
          <h3>Keyframe</h3>
          <div className={`key-status ${currentKey ? "saved" : ""}`} aria-live="polite">
            <span /> {currentKey ? `Key saved at frame ${state.currentFrame}` : `No key at frame ${state.currentFrame}`}
          </div>
          <div className="property-row"><span>Frame</span><NumberField value={state.currentFrame} step={1} onChange={(frame) => dispatch({ type: "set_frame", frame })} /></div>
          <div className="property-row"><span>Interpolation</span><select defaultValue="bezier"><option>Bezier</option><option>Linear</option><option>Stepped</option></select></div>
          <button className="primary-action compact" type="button" onClick={() => dispatch({ type: "add_key", boneId: selectedBone.id })}>{currentKey ? "Update" : "Set"} key at frame {state.currentFrame}</button>
        </section>
      ) : (
        <>
          <section className="inspector-section">
            <h3>IK settings</h3>
            <div className="property-row"><span>Solver</span><select defaultValue="Two Bone IK"><option>Two Bone IK</option><option>Pin</option></select></div>
            <div className="property-row"><span>Bend direction</span><div className="segmented"><button type="button" className="active">Near</button><button type="button">Far</button></div></div>
            <div className="property-row"><span>Stretch</span><NumberField value={100} suffix="%" step={1} onChange={() => undefined} /></div>
            <div className="property-row"><span>Softness</span><NumberField value={leftConstraint.softness * 100} step={1} onChange={() => undefined} /></div>
            <div className="property-row"><span>Follow</span><NumberField value={leftConstraint.mix * 80} suffix="%" step={1} onChange={() => undefined} /></div>
            <button className={`primary-action ${state.stressTest ? "running" : ""}`} type="button" onClick={() => dispatch({ type: "set_stress_test", enabled: !state.stressTest })}>
              {state.stressTest ? "Stop range test" : "Run range test"}
            </button>
          </section>
          <section className="inspector-section">
            <h3>Foot IK</h3>
            <button className="toggle-row" type="button" onClick={() => dispatch({ type: "toggle_constraint", constraintId: leftConstraint.id })}>
              <span>Enable</span><span className={`switch ${leftConstraint.enabled ? "on" : ""}`}><i /></span>
            </button>
            <div className="property-row"><span>Pin</span><div className="segmented"><button type="button" className="active">Auto</button><button type="button">Pinned</button></div></div>
            <div className="property-row"><span>Toe tap</span><NumberField value={50} suffix="%" step={1} onChange={() => undefined} /></div>
            <div className="property-row"><span>Snap threshold</span><NumberField value={0.5} step={0.1} onChange={() => undefined} /></div>
          </section>
        </>
      )}
      <RecentProject state={state} />
    </aside>
  );
}
