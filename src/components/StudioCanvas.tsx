import { CornersOut } from "@phosphor-icons/react/CornersOut";
import { GridFour } from "@phosphor-icons/react/GridFour";
import { MagnifyingGlassMinus } from "@phosphor-icons/react/MagnifyingGlassMinus";
import { MagnifyingGlassPlus } from "@phosphor-icons/react/MagnifyingGlassPlus";
import { Warning } from "@phosphor-icons/react/Warning";
import type { Dispatch, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoneNode, StudioAction, StudioState } from "../studio/types";

interface StudioCanvasProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
}

interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PreparedSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const NEAR = "#29c5d8";
const FAR = "#dc8734";
const CENTER = "#d8e2e8";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function prepareSprite(src: string, removeBackground: boolean): Promise<PreparedSprite> {
  const image = await loadImage(src);
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const context = source.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);

  if (!removeBackground) return { canvas: source, width: source.width, height: source.height };

  const pixels = context.getImageData(0, 0, source.width, source.height);
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const offset = (y * source.width + x) * 4;
      const red = pixels.data[offset];
      const green = pixels.data[offset + 1];
      const blue = pixels.data[offset + 2];
      const minimum = Math.min(red, green, blue);
      const maximum = Math.max(red, green, blue);
      const neutralBackground = maximum - minimum < 22;
      if (minimum > 225 && neutralBackground) {
        pixels.data[offset + 3] = minimum > 245 ? 0 : Math.round(((245 - minimum) / 20) * 255);
      }
      if (pixels.data[offset + 3] > 96) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  context.putImageData(pixels, 0, 0);
  if (minX >= maxX || minY >= maxY) return { canvas: source, width: source.width, height: source.height };

  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(source.width - 1, maxX + padding);
  maxY = Math.min(source.height - 1, maxY + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed.getContext("2d")!.drawImage(source, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return { canvas: trimmed, width: trimmed.width, height: trimmed.height };
}

function boneColor(bone: BoneNode): string {
  return bone.side === "near" ? NEAR : bone.side === "far" ? FAR : CENTER;
}

export function StudioCanvas({ state, dispatch }: StudioCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<PreparedSprite | null>(null);
  const drawRectRef = useRef<DrawRect>({ x: 0, y: 0, width: 1, height: 1 });
  const draggingBoneRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    prepareSprite(state.project.sprite.dataUrl, state.project.sprite.removeBackground)
      .then((sprite) => {
        if (active) spriteRef.current = sprite;
      })
      .catch(() => {
        if (active) spriteRef.current = null;
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [state.project.sprite.dataUrl, state.project.sprite.removeBackground]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const bounds = host.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    const context = canvas.getContext("2d")!;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const sprite = spriteRef.current;
    if (!sprite) return;
    const zoomFactor = state.zoom / 0.71;
    const targetHeight = Math.min(bounds.height * 0.91, 800) * zoomFactor;
    const targetWidth = targetHeight * (sprite.width / sprite.height);
    const drawRect: DrawRect = {
      x: bounds.width * 0.48 - targetWidth / 2,
      y: Math.max(26, (bounds.height - targetHeight) * 0.48),
      width: targetWidth,
      height: targetHeight,
    };
    drawRectRef.current = drawRect;

    context.imageSmoothingEnabled = state.project.sprite.renderProfile !== "pixel";
    context.imageSmoothingQuality = "high";
    context.globalAlpha = state.mode === "prepare" ? 1 : 0.96;
    context.drawImage(sprite.canvas, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
    context.globalAlpha = 1;

    const groundY = drawRect.y + drawRect.height * 0.95;
    context.save();
    context.strokeStyle = "rgba(181, 199, 209, 0.52)";
    context.setLineDash([8, 8]);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(Math.max(24, drawRect.x - 90), groundY);
    context.lineTo(Math.min(bounds.width - 24, drawRect.x + drawRect.width + 160), groundY);
    context.stroke();
    context.restore();

    if (state.mode === "prepare") return;
    const elapsed = state.stressTest ? performance.now() / 520 : 0;
    const positions = new Map<string, { x: number; y: number }>();
    for (const bone of state.project.bones) {
      const stress = state.stressTest && ["forearm-near", "shin-near", "foot-ik-near"].includes(bone.id) ? Math.sin(elapsed) * 0.035 : 0;
      positions.set(bone.id, {
        x: drawRect.x + (bone.x + stress) * drawRect.width,
        y: drawRect.y + bone.y * drawRect.height,
      });
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    for (const bone of state.project.bones) {
      const point = positions.get(bone.id)!;
      const parent = bone.parentId ? positions.get(bone.parentId) : undefined;
      const color = boneColor(bone);
      if (parent) {
        context.strokeStyle = "rgba(7, 12, 15, 0.88)";
        context.lineWidth = bone.kind === "ik" ? 7 : 8;
        context.beginPath();
        context.moveTo(parent.x, parent.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        context.strokeStyle = color;
        context.lineWidth = bone.kind === "ik" ? 2.2 : 3;
        context.beginPath();
        context.moveTo(parent.x, parent.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      }
      const selected = bone.id === state.selectedBoneId;
      context.fillStyle = "rgba(12, 19, 23, 0.94)";
      context.strokeStyle = color;
      context.lineWidth = selected ? 3 : 2;
      context.beginPath();
      context.arc(point.x, point.y, bone.kind === "ik" ? (selected ? 12 : 9) : (selected ? 7 : 5), 0, Math.PI * 2);
      context.fill();
      context.stroke();
      if (selected) {
        context.strokeStyle = `${color}66`;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(point.x, point.y, bone.kind === "ik" ? 22 : 14, 0, Math.PI * 2);
        context.stroke();
      }
    }

  }, [state.mode, state.project.bones, state.project.sprite.renderProfile, state.selectedBoneId, state.stressTest, state.zoom]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (hostRef.current) observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [draw, loading]);

  useEffect(() => {
    if (!state.stressTest) return;
    let animationFrame = 0;
    const tick = () => {
      draw();
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [draw, state.stressTest]);

  const findBone = (x: number, y: number): string | null => {
    const rect = drawRectRef.current;
    let closest: { id: string; distance: number } | null = null;
    for (const bone of state.project.bones) {
      const boneX = rect.x + bone.x * rect.width;
      const boneY = rect.y + bone.y * rect.height;
      const distance = Math.hypot(boneX - x, boneY - y);
      if (distance < 18 && (!closest || distance < closest.distance)) closest = { id: bone.id, distance };
    }
    return closest?.id ?? null;
  };

  const eventPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (state.mode === "prepare" || state.mode === "export") return;
    const point = eventPoint(event);
    const boneId = findBone(point.x, point.y);
    if (!boneId) return;
    draggingBoneRef.current = boneId;
    dispatch({ type: "select_bone", boneId });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const boneId = draggingBoneRef.current;
    if (!boneId) return;
    const point = eventPoint(event);
    const rect = drawRectRef.current;
    const x = Math.max(0, Math.min(1, (point.x - rect.x) / rect.width));
    const y = Math.max(0, Math.min(1, (point.y - rect.y) / rect.height));
    dispatch({ type: "move_bone", boneId, x, y, recordKey: state.mode === "animate" && state.autoKey });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    draggingBoneRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section className={`viewport-panel ${state.project.sprite.renderProfile === "pixel" ? "pixel-mode" : ""}`} ref={hostRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Interactive character rig viewport"
      />
      {loading ? <div className="canvas-loading">Preparing artwork…</div> : null}
      <div className="viewport-warning"><Warning weight="fill" /> Rear forearm artwork missing</div>
      <div className="viewport-controls">
        <button type="button" aria-label="Toggle grid"><GridFour /></button>
        <button type="button" aria-label="Frame all"><CornersOut /></button>
        <button type="button" aria-label="Zoom out" onClick={() => dispatch({ type: "set_zoom", zoom: state.zoom - 0.08 })}><MagnifyingGlassMinus /></button>
        <button type="button" aria-label="Zoom in" onClick={() => dispatch({ type: "set_zoom", zoom: state.zoom + 0.08 })}><MagnifyingGlassPlus /></button>
      </div>
    </section>
  );
}
