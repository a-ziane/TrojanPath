import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "trojanpath:theme";
const THEME_COLORS: Record<Theme, string> = { light: "#990000", dark: "#141111" };

/** Saved choice wins; otherwise follow the device setting. */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function current(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === "dark" || attr === "light" ? attr : resolveTheme(readStored(), prefersDark());
}

const listeners = new Set<() => void>();

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  listeners.forEach((l) => l());
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
  applyTheme(theme);
}

/** Follow device changes until the student picks a theme explicitly. */
export function watchSystemTheme() {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};
  const onChange = () => {
    if (readStored() === null) applyTheme(mq.matches ? "dark" : "light");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")];
}
