import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkForAppUpdate,
  CURRENT_APP_VERSION,
  installPendingUpdate,
  type AvailableUpdate,
} from "./native";
import {
  loadUpdatePreferences,
  saveUpdatePreferences,
  type UpdatePreferences,
} from "./preferences";

export type UpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "current"
  | "unsupported"
  | "error";

export interface AppUpdaterState {
  phase: UpdatePhase;
  update: AvailableUpdate | null;
  progress: number | null;
  statusMessage: string;
  notificationVisible: boolean;
  lastCheckedAt: string | null;
}

export interface AppUpdaterController {
  currentVersion: string;
  preferences: UpdatePreferences;
  state: AppUpdaterState;
  checkNow: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissNotification: () => void;
  setAutomaticChecks: (enabled: boolean) => void;
  setIntervalMinutes: (minutes: number) => void;
}

const INITIAL_STATE: AppUpdaterState = {
  phase: "idle",
  update: null,
  progress: null,
  statusMessage: "Updates have not been checked yet.",
  notificationVisible: false,
  lastCheckedAt: null,
};

let startupCheckClaimed = false;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The update operation failed.";
}

export function useAppUpdater(): AppUpdaterController {
  const [preferences, setPreferences] = useState(loadUpdatePreferences);
  const [state, setState] = useState<AppUpdaterState>(INITIAL_STATE);
  const checkingRef = useRef(false);
  const installingRef = useRef(false);
  const availableUpdateRef = useRef<AvailableUpdate | null>(null);
  const dismissedVersionRef = useRef<string | null>(null);

  const updatePreferences = useCallback((change: (current: UpdatePreferences) => UpdatePreferences) => {
    setPreferences((current) => {
      const next = change(current);
      saveUpdatePreferences(next);
      return next;
    });
  }, []);

  const runCheck = useCallback(async (source: "automatic" | "manual") => {
    if (checkingRef.current || installingRef.current) return;
    if (source === "automatic" && availableUpdateRef.current) return;

    checkingRef.current = true;
    setState((current) => ({
      ...current,
      phase: "checking",
      statusMessage: "Checking for updates…",
      notificationVisible: source === "manual" ? current.notificationVisible : false,
    }));

    try {
      const result = await checkForAppUpdate();
      const checkedAt = new Date().toISOString();
      if (!result.supported) {
        availableUpdateRef.current = null;
        setState({
          phase: "unsupported",
          update: null,
          progress: null,
          statusMessage: "Update checks are available in the installed desktop app.",
          notificationVisible: false,
          lastCheckedAt: checkedAt,
        });
        return;
      }

      if (!result.update) {
        availableUpdateRef.current = null;
        setState({
          phase: source === "manual" ? "current" : "idle",
          update: null,
          progress: null,
          statusMessage: `Graphite Forge ${CURRENT_APP_VERSION} is up to date.`,
          notificationVisible: false,
          lastCheckedAt: checkedAt,
        });
        return;
      }

      availableUpdateRef.current = result.update;
      const wasDismissed = source === "automatic" && dismissedVersionRef.current === result.update.version;
      setState({
        phase: wasDismissed ? "idle" : "available",
        update: result.update,
        progress: null,
        statusMessage: wasDismissed
          ? `Graphite Forge ${result.update.version} is available.`
          : `Graphite Forge ${result.update.version} is ready to install.`,
        notificationVisible: !wasDismissed,
        lastCheckedAt: checkedAt,
      });
    } catch (error) {
      const message = errorMessage(error);
      setState((current) => ({
        ...current,
        phase: source === "manual" ? "error" : "idle",
        statusMessage: `Update check failed: ${message}`,
        notificationVisible: source === "manual",
      }));
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const checkNow = useCallback(async () => {
    dismissedVersionRef.current = null;
    await runCheck("manual");
  }, [runCheck]);

  const installUpdate = useCallback(async () => {
    const update = availableUpdateRef.current;
    if (!update || installingRef.current) return;
    installingRef.current = true;
    let downloaded = 0;
    let contentLength: number | undefined;

    setState((current) => ({
      ...current,
      phase: "downloading",
      progress: 0,
      statusMessage: `Downloading Graphite Forge ${update.version}…`,
      notificationVisible: true,
    }));

    try {
      await installPendingUpdate((event) => {
        if (event.event === "started") {
          contentLength = event.contentLength;
          downloaded = 0;
          setState((current) => ({ ...current, progress: 0 }));
          return;
        }
        if (event.event === "progress") {
          downloaded += event.chunkLength;
          const progress = contentLength ? Math.min(1, downloaded / contentLength) : null;
          setState((current) => ({ ...current, progress }));
          return;
        }
        setState((current) => ({
          ...current,
          phase: "installing",
          progress: 1,
          statusMessage: "Installing update and restarting…",
        }));
      });

      setState((current) => ({
        ...current,
        phase: "current",
        progress: 1,
        statusMessage: "Update installed. The desktop app will restart automatically.",
        notificationVisible: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        phase: "error",
        progress: null,
        statusMessage: `Update failed: ${errorMessage(error)}`,
        notificationVisible: true,
      }));
    } finally {
      installingRef.current = false;
    }
  }, []);

  const dismissNotification = useCallback(() => {
    dismissedVersionRef.current = availableUpdateRef.current?.version ?? null;
    setState((current) => ({ ...current, notificationVisible: false }));
  }, []);

  const setAutomaticChecks = useCallback((enabled: boolean) => {
    updatePreferences((current) => ({ ...current, automaticChecks: enabled }));
  }, [updatePreferences]);

  const setIntervalMinutes = useCallback((minutes: number) => {
    updatePreferences((current) => ({ ...current, intervalMinutes: minutes }));
  }, [updatePreferences]);

  useEffect(() => {
    if (!preferences.automaticChecks) return;
    if (!startupCheckClaimed) {
      startupCheckClaimed = true;
      void runCheck("automatic");
    }
    const handle = window.setInterval(
      () => void runCheck("automatic"),
      preferences.intervalMinutes * 60_000,
    );
    return () => window.clearInterval(handle);
  }, [preferences.automaticChecks, preferences.intervalMinutes, runCheck]);

  return {
    currentVersion: CURRENT_APP_VERSION,
    preferences,
    state,
    checkNow,
    installUpdate,
    dismissNotification,
    setAutomaticChecks,
    setIntervalMinutes,
  };
}
