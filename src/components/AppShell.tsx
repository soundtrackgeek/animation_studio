import { useCallback, useMemo, useState, type Dispatch } from "react";
import { evaluateStudioPose } from "../studio/pose";
import type { BoneNode, StudioAction, StudioState } from "../studio/types";
import { HierarchyPanel } from "./HierarchyPanel";
import { InspectorPanel } from "./InspectorPanel";
import { StatusBar } from "./StatusBar";
import { StudioCanvas } from "./StudioCanvas";
import { Timeline } from "./Timeline";
import { ToolRail } from "./ToolRail";
import { TopBar } from "./TopBar";
import { UpdateCenter } from "./UpdateCenter";

interface AppShellProps {
  state: StudioState;
  selectedBone: BoneNode;
  dispatch: Dispatch<StudioAction>;
  onImport: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
}
export function AppShell({ state, selectedBone, dispatch, onImport, onOpen, onSave, onExport }: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const animateMode = state.mode === "animate";
  const rigMode = state.mode === "rig";
  const evaluatedPose = useMemo(
    () => evaluateStudioPose(state.project, state.currentFrame, state.draftPose, {
      animate: animateMode,
      applyIk: animateMode || rigMode,
      forceIk: rigMode,
    }),
    [animateMode, rigMode, state.currentFrame, state.draftPose, state.project],
  );
  const restPose = useMemo(
    () => evaluateStudioPose(state.project, 0, {}, { animate: false, applyIk: false }),
    [state.project],
  );
  const selectedPose = evaluatedPose.get(selectedBone.id);

  return (
    <main className="studio-shell">
      <TopBar
        state={state}
        dispatch={dispatch}
        onImport={onImport}
        onOpen={onOpen}
        onSave={onSave}
        onExport={onExport}
        settingsOpen={settingsOpen}
        onSettings={() => setSettingsOpen((open) => !open)}
      />
      <div className="studio-body">
        <ToolRail selected={state.tool} onSelect={(tool) => dispatch({ type: "set_tool", tool })} />
        <HierarchyPanel state={state} dispatch={dispatch} />
        <StudioCanvas state={state} pose={evaluatedPose} restPose={restPose} dispatch={dispatch} />
        <InspectorPanel
          state={state}
          selectedBone={selectedBone}
          selectedPose={selectedPose}
          dispatch={dispatch}
          onExport={onExport}
        />
        <Timeline state={state} dispatch={dispatch} />
      </div>
      <StatusBar state={state} dispatch={dispatch} />
      <UpdateCenter settingsOpen={settingsOpen} onCloseSettings={closeSettings} />
      {state.notice ? <div className="notice" role="status">{state.notice}</div> : null}
    </main>
  );
}
