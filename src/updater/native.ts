import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import packageJson from "../../package.json";

export interface AvailableUpdate {
  currentVersion: string;
  version: string;
  date?: string;
  notes?: string;
}

export type UpdateCheckResult =
  | { supported: false; update: null }
  | { supported: true; update: AvailableUpdate | null };

export type UpdateProgressEvent =
  | { event: "started"; contentLength?: number }
  | { event: "progress"; chunkLength: number }
  | { event: "finished" };

export const CURRENT_APP_VERSION = packageJson.version;

let pendingUpdate: Update | "development-mock" | null = null;

function isTauriRuntime(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function developmentMockVersion(): string | null {
  if (!import.meta.env.DEV) return null;
  return new URLSearchParams(window.location.search).get("mock-update");
}

async function closePendingUpdate(): Promise<void> {
  if (pendingUpdate && pendingUpdate !== "development-mock") {
    await pendingUpdate.close().catch(() => undefined);
  }
  pendingUpdate = null;
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const mockVersion = developmentMockVersion();
  if (!isTauriRuntime()) {
    if (!mockVersion) return { supported: false, update: null };
    pendingUpdate = "development-mock";
    return {
      supported: true,
      update: {
        currentVersion: CURRENT_APP_VERSION,
        version: mockVersion,
        date: new Date().toISOString(),
        notes: "A polished update prompt preview for Graphite Forge.",
      },
    };
  }

  await closePendingUpdate();
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check({ timeout: 30_000 });
  if (!update) return { supported: true, update: null };
  pendingUpdate = update;
  return {
    supported: true,
    update: {
      currentVersion: update.currentVersion,
      version: update.version,
      date: update.date,
      notes: update.body,
    },
  };
}

function mapDownloadEvent(event: DownloadEvent): UpdateProgressEvent {
  switch (event.event) {
    case "Started":
      return { event: "started", contentLength: event.data.contentLength };
    case "Progress":
      return { event: "progress", chunkLength: event.data.chunkLength };
    case "Finished":
      return { event: "finished" };
  }
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function installPendingUpdate(
  onProgress: (event: UpdateProgressEvent) => void,
): Promise<void> {
  if (!pendingUpdate) throw new Error("There is no update ready to install.");

  if (pendingUpdate === "development-mock") {
    onProgress({ event: "started", contentLength: 100 });
    await pause(80);
    onProgress({ event: "progress", chunkLength: 45 });
    await pause(80);
    onProgress({ event: "progress", chunkLength: 55 });
    onProgress({ event: "finished" });
    await pause(120);
    return;
  }

  const update = pendingUpdate;
  await update.downloadAndInstall((event) => onProgress(mapDownloadEvent(event)));
  await update.close().catch(() => undefined);
  pendingUpdate = null;
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
