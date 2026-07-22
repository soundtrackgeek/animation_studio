import { Anchor } from "@phosphor-icons/react/Anchor";
import { ArrowsOutCardinal } from "@phosphor-icons/react/ArrowsOutCardinal";
import { ArrowClockwise } from "@phosphor-icons/react/ArrowClockwise";
import { Bone } from "@phosphor-icons/react/Bone";
import { BoundingBox } from "@phosphor-icons/react/BoundingBox";
import { Cursor } from "@phosphor-icons/react/Cursor";
import { Hand } from "@phosphor-icons/react/Hand";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { PaintBrush } from "@phosphor-icons/react/PaintBrush";
import { Polygon } from "@phosphor-icons/react/Polygon";
import type { Icon } from "@phosphor-icons/react/lib";
import type { ToolId } from "../studio/types";

interface ToolRailProps {
  selected: ToolId;
  onSelect: (tool: ToolId) => void;
}

const TOOLS: Array<{ id: ToolId; label: string; key: string; icon: Icon; future?: boolean }> = [
  { id: "select", label: "Select", key: "Q", icon: Cursor },
  { id: "move", label: "Move", key: "W", icon: ArrowsOutCardinal },
  { id: "rotate", label: "Rotate", key: "E", icon: ArrowClockwise },
  { id: "bone", label: "Create bone", key: "B", icon: Bone },
  { id: "mesh", label: "Edit mesh · planned for v0.2", key: "M", icon: Polygon, future: true },
  { id: "weights", label: "Paint weights · planned for v0.2", key: "G", icon: PaintBrush, future: true },
  { id: "ik", label: "IK constraint", key: "K", icon: Anchor },
  { id: "pan", label: "Pan", key: "H", icon: Hand },
  { id: "zoom", label: "Zoom", key: "Z", icon: MagnifyingGlass },
];

export function ToolRail({ selected, onSelect }: ToolRailProps) {
  return (
    <aside className="tool-rail" aria-label="Canvas tools">
      {TOOLS.map(({ id, label, key, icon: ToolIcon, future }, index) => (
        <button
          type="button"
          key={id}
          className={`${selected === id ? "active" : ""} ${index === 3 || index === 7 ? "group-start" : ""}`}
          onClick={() => onSelect(id)}
          aria-label={`${label} (${key})`}
          title={`${label} (${key})`}
          disabled={future}
        >
          {id === "mesh" ? <BoundingBox weight="regular" /> : <ToolIcon weight={selected === id ? "fill" : "regular"} />}
        </button>
      ))}
    </aside>
  );
}
