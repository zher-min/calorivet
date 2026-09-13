"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemePreference = Theme | "auto";

const THEME_STORAGE_KEY = "vetslate:theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    meta.content = theme === "dark" ? "#0f1c28" : "#f4f0e7";
  });
}

function deviceTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );
  const [preference, setPreference] = useState<ThemePreference>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.themePreference !== "auto" ? theme : "auto"
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (preference !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followDevice = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", followDevice);
    return () => media.removeEventListener("change", followDevice);
  }, [preference]);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <div className="theme-control">
      <button
      type="button"
      className="theme-toggle"
      data-theme={theme}
      suppressHydrationWarning
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={() => {
        applyTheme(nextTheme);
        try { window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch { /* Theme still applies for this visit. */ }
        document.documentElement.dataset.themePreference = nextTheme;
        setPreference(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-icon theme-toggle-sun">☀</span>
        <span className="theme-toggle-icon theme-toggle-moon">☾</span>
        <span className="theme-toggle-thumb" />
      </span>
      </button>
      <button
        type="button"
        className="theme-auto"
        aria-pressed={preference === "auto"}
        onClick={() => {
          const currentDeviceTheme = deviceTheme();
          try { window.localStorage.removeItem(THEME_STORAGE_KEY); } catch { /* Auto still applies for this visit. */ }
          document.documentElement.dataset.themePreference = "auto";
          setPreference("auto");
          setTheme(currentDeviceTheme);
          applyTheme(currentDeviceTheme);
        }}
      >
        Auto
      </button>
    </div>
  );
}
