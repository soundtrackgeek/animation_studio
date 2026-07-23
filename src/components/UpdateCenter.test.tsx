import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UPDATE_PREFERENCES_KEY } from "../updater/preferences";
import { UpdateCenter } from "./UpdateCenter";

describe("UpdateCenter", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(UPDATE_PREFERENCES_KEY, JSON.stringify({
      automaticChecks: false,
      intervalMinutes: 5,
    }));
    window.history.replaceState({}, "", "/?mock-update=0.3.1");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("checks on startup and schedules the default five-minute interval", async () => {
    localStorage.removeItem(UPDATE_PREFERENCES_KEY);
    const intervalSpy = vi.spyOn(window, "setInterval");

    render(<UpdateCenter settingsOpen={false} onCloseSettings={() => undefined} />);

    expect(await screen.findByText("Version 0.3.1 is ready")).toBeTruthy();
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 300_000);
  });

  it("checks for an update and begins the in-app install flow", async () => {
    render(<UpdateCenter settingsOpen onCloseSettings={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("Version 0.3.1 is ready")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Update & restart" }));
    expect(await screen.findByRole("progressbar", { name: "Update progress" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Update & restart" })).toBeNull();
  });

  it("saves the selected automatic check interval", async () => {
    render(<UpdateCenter settingsOpen onCloseSettings={() => undefined} />);

    fireEvent.click(screen.getByRole("switch", { name: "Check automatically" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Check interval" }), {
      target: { value: "30" },
    });

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(UPDATE_PREFERENCES_KEY) ?? "{}")).toEqual({
        automaticChecks: true,
        intervalMinutes: 30,
      });
    });
  });
});
