import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { GridFour } from "@phosphor-icons/react/GridFour";
import type { Dispatch } from "react";
import type { StudioAction, StudioState } from "../studio/types";

interface StatusBarProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
}

export function StatusBar({ state, dispatch }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="pixel-status"><GridFour /> Pixel snap <button type="button" className="status-toggle">ON</button></div>
      <span>{state.project.clips[0].fps} FPS</span>
      <label>Zoom
        <select value={state.zoom} onChange={(event) => dispatch({ type: "set_zoom", zoom: Number(event.target.value) })}>
          <option value={0.5}>50%</option>
          <option value={0.71}>71%</option>
          <option value={1}>100%</option>
          <option value={1.25}>125%</option>
        </select>
      </label>
      <span className="status-spacer" />
      <span className="autosave"><CheckCircle weight="fill" /> Autosaved locally</span>
    </footer>
  );
}
