import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme";
import { cx } from "./ui";

/** Switches between light and dark mode; the choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cx(
        "tp-theme-toggle inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-[6px] text-[13px] font-semibold text-ink transition-colors hover:border-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cardinal",
        className,
      )}
    >
      {dark ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
