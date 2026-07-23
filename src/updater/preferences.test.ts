import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_UPDATE_PREFERENCES,
  loadUpdatePreferences,
  saveUpdatePreferences,
  UPDATE_PREFERENCES_KEY,
} from "./preferences";

describe("update preferences", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to checking every five minutes", () => {
    expect(loadUpdatePreferences()).toEqual(DEFAULT_UPDATE_PREFERENCES);
  });

  it("persists automatic checks and a supported interval", () => {
    saveUpdatePreferences({ automaticChecks: false, intervalMinutes: 30 });

    expect(loadUpdatePreferences()).toEqual({
      automaticChecks: false,
      intervalMinutes: 30,
    });
  });

  it("repairs malformed and unsupported stored values", () => {
    localStorage.setItem(UPDATE_PREFERENCES_KEY, JSON.stringify({
      automaticChecks: "yes",
      intervalMinutes: 2,
    }));

    expect(loadUpdatePreferences()).toEqual(DEFAULT_UPDATE_PREFERENCES);
  });

  it("recovers from invalid JSON", () => {
    localStorage.setItem(UPDATE_PREFERENCES_KEY, "{not-json");

    expect(loadUpdatePreferences()).toEqual(DEFAULT_UPDATE_PREFERENCES);
  });
});
