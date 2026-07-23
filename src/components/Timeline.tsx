import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { Copy } from "@phosphor-icons/react/Copy";
import { GearSix } from "@phosphor-icons/react/GearSix";
import { Key } from "@phosphor-icons/react/Key";
import { Pause } from "@phosphor-icons/react/Pause";
import { Play } from "@phosphor-icons/react/Play";
import { Plus } from "@phosphor-icons/react/Plus";
import { Repeat } from "@phosphor-icons/react/Repeat";
import { SkipBack } from "@phosphor-icons/react/SkipBack";
import { SkipForward } from "@phosphor-icons/react/SkipForward";
import { Trash } from "@phosphor-icons/react/Trash";
import type { Dispatch } from "react";
import { TIMELINE_BONE_IDS } from "../studio/data";
import type { Keyframe, StudioAction, StudioState } from "../studio/types";

interface TimelineProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
}

function TimelineKey({ keyframe, duration, active, onClick }: { keyframe: Keyframe; duration: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`timeline-key ${active ? "active" : ""}`}
      style={{ left: `${(keyframe.frame / duration) * 100}%` }}
      onClick={onClick}
      aria-label={`Key at frame ${keyframe.frame}`}
    />
  );
}

export function Timeline({ state, dispatch }: TimelineProps) {
  const clip = state.project.clips[0];
  const autoKeyAvailable = state.mode === "animate";
  const rows = TIMELINE_BONE_IDS.map((id) => state.project.bones.find((bone) => bone.id === id)!).filter(Boolean);
  const frameMarks = Array.from({ length: 13 }, (_, index) => index * 5);

  return (
    <section className={`timeline-panel ${state.mode === "prepare" ? "muted" : ""}`}>
      <header className="timeline-header">
        <strong>Dopesheet</strong>
        <button
          type="button"
          className={`auto-key ${state.autoKey ? "on" : ""}`}
          disabled={!autoKeyAvailable}
          title={autoKeyAvailable ? "Automatically key transform edits" : "Switch to Animate to use Auto Key"}
          onClick={() => dispatch({ type: "toggle_auto_key" })}
        >
          <span /> Auto Key <small>{state.autoKey ? "ON" : autoKeyAvailable ? "OFF" : "ANIMATE ONLY"}</small>
        </button>
        <GearSix size={14} />
      </header>
      <div className="timeline-grid">
        <div className="track-header"><span>Track</span></div>
        <div className="ruler">
          {frameMarks.map((frame) => <span key={frame} style={{ left: `${(frame / clip.duration) * 100}%` }}>{frame}</span>)}
          <div className="playhead" style={{ left: `${(state.currentFrame / clip.duration) * 100}%` }}><b>{state.currentFrame}</b></div>
        </div>
        {rows.map((bone) => (
          <div className="timeline-row" key={bone.id}>
            <button type="button" className={state.selectedBoneId === bone.id ? "track-name selected" : "track-name"} onClick={() => dispatch({ type: "select_bone", boneId: bone.id })}>
              <span className="track-dot" />{bone.name}<Key size={12} />
            </button>
            <div className="key-lane" onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              dispatch({ type: "set_frame", frame: Math.round(((event.clientX - rect.left) / rect.width) * clip.duration) });
            }}>
              {clip.keyframes.filter((keyframe) => keyframe.boneId === bone.id).map((keyframe) => (
                <TimelineKey
                  key={keyframe.id}
                  keyframe={keyframe}
                  duration={clip.duration}
                  active={state.currentFrame === keyframe.frame}
                  onClick={() => {
                    dispatch({ type: "select_bone", boneId: bone.id });
                    dispatch({ type: "set_frame", frame: keyframe.frame });
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="timeline-footer">
        <button className="clip-select" type="button">{clip.name}<CaretDown /></button>
        <button type="button" aria-label="Add clip"><Plus /></button>
        <button type="button" aria-label="Duplicate clip"><Copy /></button>
        <button type="button" aria-label="Delete clip"><Trash /></button>
        <div className="playback-controls">
          <button type="button" aria-label="First frame" onClick={() => dispatch({ type: "set_frame", frame: 0 })}><SkipBack /></button>
          <button type="button" aria-label="Previous frame" onClick={() => dispatch({ type: "set_frame", frame: state.currentFrame - 1 })}><CaretLeft /></button>
          <button type="button" aria-label={state.isPlaying ? "Pause animation" : "Play animation"} className="play" onClick={() => dispatch({ type: "set_playing", playing: !state.isPlaying })}>{state.isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}</button>
          <button type="button" aria-label="Next frame" onClick={() => dispatch({ type: "set_frame", frame: state.currentFrame + 1 })}><CaretRight /></button>
          <button type="button" aria-label="Last frame" onClick={() => dispatch({ type: "set_frame", frame: clip.duration })}><SkipForward /></button>
          <button
            type="button"
            aria-label={clip.loop ? "Disable loop" : "Enable loop"}
            className={clip.loop ? "loop active" : "loop"}
            onClick={() => dispatch({ type: "toggle_loop" })}
          >
            <Repeat />
          </button>
        </div>
        <div className="timeline-meta"><span>{state.currentFrame} / {clip.duration}</span><span>{clip.fps} FPS</span></div>
      </footer>
    </section>
  );
}
