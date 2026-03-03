import type { AppMode, ThemePreference, UiTheme } from "../types/ui";

export const THEME_PREFERENCE_STORAGE_KEY = "ziwei:web:theme:preference-v1";

const UI_THEMES: readonly UiTheme[] = ["ziwei", "bazi", "qimen", "liuyao"];
const THEME_PREFERENCES: readonly ThemePreference[] = ["auto", ...UI_THEMES];

function isUiTheme(value: string): value is UiTheme {
  return (UI_THEMES as readonly string[]).includes(value);
}

function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function defaultThemeByAppMode(mode: AppMode): UiTheme {
  if (mode === "bazi") return "bazi";
  if (mode === "qimen") return "qimen";
  if (mode === "liuyao") return "liuyao";
  return "ziwei";
}

export function resolveTheme(preference: ThemePreference, appMode: AppMode): UiTheme {
  if (preference === "auto") return defaultThemeByAppMode(appMode);
  return preference;
}

export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  if (!raw) return "auto";
  return isThemePreference(raw) ? raw : "auto";
}

export function parseUiTheme(raw: string | null | undefined): UiTheme | null {
  if (!raw) return null;
  return isUiTheme(raw) ? raw : null;
}
