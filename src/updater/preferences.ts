export const UPDATE_PREFERENCES_KEY = "graphite-forge:update-preferences:v1";
export const UPDATE_INTERVAL_OPTIONS = [5, 15, 30, 60] as const;

export interface UpdatePreferences {
  automaticChecks: boolean;
  intervalMinutes: number;
}

export const DEFAULT_UPDATE_PREFERENCES: UpdatePreferences = {
  automaticChecks: true,
  intervalMinutes: 5,
};

function isAllowedInterval(value: unknown): value is number {
  return typeof value === "number" && UPDATE_INTERVAL_OPTIONS.includes(value as (typeof UPDATE_INTERVAL_OPTIONS)[number]);
}

export function loadUpdatePreferences(): UpdatePreferences {
  try {
    const stored = localStorage.getItem(UPDATE_PREFERENCES_KEY);
    if (!stored) return DEFAULT_UPDATE_PREFERENCES;
    const parsed = JSON.parse(stored) as Partial<UpdatePreferences>;
    return {
      automaticChecks: typeof parsed.automaticChecks === "boolean"
        ? parsed.automaticChecks
        : DEFAULT_UPDATE_PREFERENCES.automaticChecks,
      intervalMinutes: isAllowedInterval(parsed.intervalMinutes)
        ? parsed.intervalMinutes
        : DEFAULT_UPDATE_PREFERENCES.intervalMinutes,
    };
  } catch {
    return DEFAULT_UPDATE_PREFERENCES;
  }
}

export function saveUpdatePreferences(preferences: UpdatePreferences): void {
  try {
    localStorage.setItem(UPDATE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Update preferences should never prevent the editor from running.
  }
}
