import { ArrowClockwise } from "@phosphor-icons/react/ArrowClockwise";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { SpinnerGap } from "@phosphor-icons/react/SpinnerGap";
import { X } from "@phosphor-icons/react/X";
import { useEffect } from "react";
import { UPDATE_INTERVAL_OPTIONS } from "../updater/preferences";
import { useAppUpdater } from "../updater/useAppUpdater";

interface UpdateCenterProps {
  settingsOpen: boolean;
  onCloseSettings: () => void;
}

function formatLastChecked(value: string | null): string {
  if (!value) return "Not checked yet";
  return `Checked ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function UpdateCenter({ settingsOpen, onCloseSettings }: UpdateCenterProps) {
  const updater = useAppUpdater();
  const { preferences, state } = updater;
  const isBusy = state.phase === "checking" || state.phase === "downloading" || state.phase === "installing";
  const showUpdateCard = state.notificationVisible && (
    state.phase === "available"
    || state.phase === "downloading"
    || state.phase === "installing"
    || state.phase === "error"
  );

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseSettings();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCloseSettings, settingsOpen]);

  return (
    <>
      {settingsOpen ? (
        <section className="update-settings" aria-label="Application settings">
          <div className="update-settings-header">
            <div>
              <span className="eyebrow">Application</span>
              <h2>Updates</h2>
            </div>
            <button type="button" className="icon-button" aria-label="Close settings" onClick={onCloseSettings}>
              <X />
            </button>
          </div>

          <div className="update-setting-row">
            <div>
              <strong>Check automatically</strong>
              <span>Check when Graphite Forge opens and on a schedule.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Check automatically"
              aria-checked={preferences.automaticChecks}
              className={`update-switch ${preferences.automaticChecks ? "on" : ""}`}
              onClick={() => updater.setAutomaticChecks(!preferences.automaticChecks)}
            >
              <span />
            </button>
          </div>

          <label className="update-interval">
            <span>Check interval</span>
            <select
              value={preferences.intervalMinutes}
              disabled={!preferences.automaticChecks}
              onChange={(event) => updater.setIntervalMinutes(Number(event.target.value))}
            >
              {UPDATE_INTERVAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  Every {minutes} {minutes === 60 ? "minutes" : "min"}
                </option>
              ))}
            </select>
          </label>

          <div className="update-version-card">
            <div>
              <span>Installed version</span>
              <strong>Graphite Forge {updater.currentVersion}</strong>
            </div>
            <CheckCircle weight="fill" />
          </div>

          <div className="update-check-status" aria-live="polite">
            <span>{state.statusMessage}</span>
            <small>{formatLastChecked(state.lastCheckedAt)}</small>
          </div>

          <button
            type="button"
            className="update-check-button"
            disabled={isBusy}
            onClick={() => void updater.checkNow()}
          >
            {state.phase === "checking" ? <SpinnerGap className="spin" /> : <ArrowClockwise />}
            {state.phase === "checking" ? "Checking…" : "Check for updates"}
          </button>
        </section>
      ) : null}

      {showUpdateCard ? (
        <aside className={`update-card ${state.phase}`} role="dialog" aria-modal="false" aria-labelledby="update-card-title">
          <div className="update-card-icon">
            {state.phase === "downloading" || state.phase === "installing"
              ? <SpinnerGap className="spin" />
              : <DownloadSimple weight="bold" />}
          </div>
          <div className="update-card-copy">
            <span className="eyebrow">Graphite Forge update</span>
            <h2 id="update-card-title">
              {state.phase === "available"
                ? `Version ${state.update?.version} is ready`
                : state.phase === "error"
                  ? "Update interrupted"
                  : state.phase === "installing"
                    ? "Installing update"
                    : "Downloading update"}
            </h2>
            <p>{state.phase === "available" ? state.update?.notes || state.statusMessage : state.statusMessage}</p>
          </div>
          {state.phase === "downloading" || state.phase === "installing" ? (
            <div
              className="update-progress"
              role="progressbar"
              aria-label="Update progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((state.progress ?? 0.18) * 100)}
            >
              <span style={{ width: `${Math.round((state.progress ?? 0.18) * 100)}%` }} />
            </div>
          ) : null}
          <div className="update-card-actions">
            {state.phase === "available" ? (
              <>
                <button type="button" className="secondary" onClick={updater.dismissNotification}>Later</button>
                <button type="button" className="primary" onClick={() => void updater.installUpdate()}>
                  Update & restart
                </button>
              </>
            ) : null}
            {state.phase === "error" ? (
              <>
                <button type="button" className="secondary" onClick={updater.dismissNotification}>Dismiss</button>
                <button type="button" className="primary" onClick={() => void updater.checkNow()}>Try again</button>
              </>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}
