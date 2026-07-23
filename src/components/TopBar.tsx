import { ArrowClockwise as Redo } from "@phosphor-icons/react/ArrowClockwise";
import { ArrowCounterClockwise as Undo } from "@phosphor-icons/react/ArrowCounterClockwise";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CloudCheck } from "@phosphor-icons/react/CloudCheck";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { FileArrowUp } from "@phosphor-icons/react/FileArrowUp";
import { FilePlus } from "@phosphor-icons/react/FilePlus";
import { FloppyDisk } from "@phosphor-icons/react/FloppyDisk";
import { FolderOpen } from "@phosphor-icons/react/FolderOpen";
import { GearSix } from "@phosphor-icons/react/GearSix";
import { List } from "@phosphor-icons/react/List";
import { Question } from "@phosphor-icons/react/Question";
import type { Dispatch } from "react";
import type { StudioAction, StudioState, WorkspaceMode } from "../studio/types";

interface TopBarProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onImport: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  settingsOpen: boolean;
  onSettings: () => void;
}

const MODES: Array<{ id: WorkspaceMode; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "rig", label: "Rig" },
  { id: "animate", label: "Animate" },
  { id: "export", label: "Export" },
];

export function TopBar({
  state,
  dispatch,
  onImport,
  onOpen,
  onSave,
  onExport,
  settingsOpen,
  onSettings,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand-lockup">
        <img src="/assets/graphite-forge-mark.png" alt="" className="brand-mark" />
        <span>Graphite Forge</span>
      </div>

      <div className="project-switcher-wrap">
        <button
          className="project-switcher"
          type="button"
          aria-expanded={state.projectMenuOpen}
          onClick={() => dispatch({ type: "set_project_menu", open: !state.projectMenuOpen })}
        >
          <span className="project-prefix">Project:</span>
          <span>{state.project.name}</span>
          <CaretDown size={13} weight="bold" />
        </button>
        {state.projectMenuOpen ? (
          <div className="project-menu">
            <button type="button" onClick={onImport}><FilePlus /> Import artwork</button>
            <button type="button" onClick={onOpen}><FolderOpen /> Open project</button>
            <button type="button" onClick={onSave}><FloppyDisk /> Save project</button>
            <button type="button" onClick={onExport}><FileArrowUp /> Export metadata</button>
          </div>
        ) : null}
      </div>

      <nav className="workflow-tabs" aria-label="Studio workflow">
        {MODES.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={state.mode === mode.id ? "active" : ""}
            onClick={() => dispatch({ type: "set_mode", mode: mode.id })}
          >
            {mode.label}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <CloudCheck size={17} aria-label="Saved locally" />
        <button type="button" aria-label="Undo" disabled><Undo /></button>
        <button type="button" aria-label="Redo" disabled><Redo /></button>
        <button type="button" aria-label="Export" onClick={onExport}><DownloadSimple /></button>
        <button type="button" aria-label="Help"><Question /></button>
        <button
          type="button"
          className={settingsOpen ? "active" : ""}
          aria-label="Settings"
          aria-expanded={settingsOpen}
          onClick={onSettings}
        >
          <GearSix />
        </button>
        <button type="button" aria-label="Main menu"><List /></button>
      </div>
    </header>
  );
}
