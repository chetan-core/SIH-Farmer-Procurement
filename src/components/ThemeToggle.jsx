import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "krishisetu-theme";

function getSystemTheme() {
  if (
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
  ) {
    return "dark";
  }

  return "light";
}

function getInitialTheme() {
  const savedTheme =
    localStorage.getItem(THEME_KEY);

  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    return savedTheme;
  }

  return getSystemTheme();
}

function applyTheme(theme) {
  document.documentElement.setAttribute(
    "data-theme",
    theme
  );

  document.documentElement.style.colorScheme =
    theme;
}

function ThemeToggle() {
  const [theme, setTheme] =
    useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);

    localStorage.setItem(
      THEME_KEY,
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light"
        ? "dark"
        : "light"
    );
  };

  const isDark =
    theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {isDark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}

      <span>
        {isDark
          ? "Light"
          : "Dark"}
      </span>
    </button>
  );
}

export default ThemeToggle;