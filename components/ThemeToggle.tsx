"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "Light" : "Dark";
  return (
    <button type="button" onClick={toggle} aria-label={`${next} theme`} className="btn btn--ghost btn--tag">
      {next}
    </button>
  );
}
