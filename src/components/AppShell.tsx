import type { Dispatch } from "react";
import type { BoneNode, StudioAction, StudioState } from "../studio/types";
import { HierarchyPanel } from "./HierarchyPanel";
import { InspectorPanel } from "./InspectorPanel";
import { StatusBar } from "./StatusBar";
import { StudioCanvas } from "./StudioCanvas";
import { Timeline } from "./Timeline";
import { ToolRail } from "./ToolRail";
import { TopBar } from "./TopBar";

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
  return (
    <main className="studio-shell">
      <TopBar
        state={state}
        dispatch={dispatch}
        onImport={onImport}
        onOpen={onOpen}
        onSave={onSave}
        onExport={onExport}
      />
      <div className="studio-body">
        <ToolRail selected={state.tool} onSelect={(tool) => dispatch({ type: "set_tool", tool })} />
        <HierarchyPanel state={state} dispatch={dispatch} />
        <StudioCanvas state={state} dispatch={dispatch} />
        <InspectorPanel state={state} selectedBone={selectedBone} dispatch={dispatch} onExport={onExport} />
        <Timeline state={state} dispatch={dispatch} />
      </div>
      <StatusBar state={state} dispatch={dispatch} />
      {state.notice ? <div className="notice" role="status">{state.notice}</div> : null}
    </main>
  );
}
