import type { StudioProject } from "./types";
import { migrateStudioProject } from "./project";

interface ImportedImage {
  dataUrl: string;
  path?: string;
  fileName: string;
}
function isTauriRuntime(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function browserFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function download(contents: string, fileName: string, mime = "application/json"): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importImage(): Promise<ImportedImage | null> {
  if (isTauriRuntime()) {
    const [{ open }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Sprite artwork", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (!selected || Array.isArray(selected)) return null;
    const dataUrl = await invoke<string>("read_image_as_data_url", { path: selected });
    return { dataUrl, path: selected, fileName: selected.split(/[\\/]/).pop() ?? "sprite.png" };
  }

  const file = await browserFile("image/png,image/jpeg,image/webp");
  if (!file) return null;
  return { dataUrl: await readAsDataUrl(file), fileName: file.name };
}

export async function openProject(): Promise<StudioProject | null> {
  let contents: string;
  if (isTauriRuntime()) {
    const [{ open }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Graphite Forge project", extensions: ["gforge", "json"] }],
    });
    if (!selected || Array.isArray(selected)) return null;
    contents = await invoke<string>("read_text_file", { path: selected });
  } else {
    const file = await browserFile(".gforge,application/json");
    if (!file) return null;
    contents = await file.text();
  }

  return migrateStudioProject(JSON.parse(contents));
}

export async function saveProject(project: StudioProject): Promise<boolean> {
  const contents = JSON.stringify(project, null, 2);
  const suggestedName = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "sprite"}.gforge`;
  if (isTauriRuntime()) {
    const [{ save }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const path = await save({ defaultPath: suggestedName, filters: [{ name: "Graphite Forge project", extensions: ["gforge"] }] });
    if (!path) return false;
    await invoke("write_text_file", { path, contents });
    return true;
  }
  download(contents, suggestedName);
  return true;
}

export async function exportMetadata(project: StudioProject): Promise<boolean> {
  const clip = project.clips[0];
  const exportData = {
    format: "graphite-forge-animation",
    version: project.schemaVersion,
    character: project.name,
    facing: project.facing,
    source: { file: project.sprite.fileName, renderProfile: project.sprite.renderProfile },
    skeleton: project.bones,
    constraints: project.constraints,
    animations: project.clips,
    atlas: { frameWidth: 256, frameHeight: 256, columns: 8, padding: 2 },
  };
  const contents = JSON.stringify(exportData, null, 2);
  const suggestedName = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${clip.name.toLowerCase()}.json`;
  if (isTauriRuntime()) {
    const [{ save }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const path = await save({ defaultPath: suggestedName, filters: [{ name: "Animation metadata", extensions: ["json"] }] });
    if (!path) return false;
    await invoke("write_text_file", { path, contents });
    return true;
  }
  download(contents, suggestedName);
  return true;
}
