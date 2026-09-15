import { create } from "zustand";

const THEME_STORAGE_KEY = "meomeo_theme";

export function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme() {
  if (typeof window === "undefined") return "system";
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // localStorage might be unavailable
  }
  return "system";
}

export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");
  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  root.setAttribute("data-theme", isDark ? "dark" : "light");
}

const initialTheme = getStoredTheme();
applyThemeToDocument(initialTheme);

// Listen to system theme changes if set to system
if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === "system") {
      applyThemeToDocument("system");
      useThemeStore.setState({ resolvedTheme: getSystemTheme() });
    }
  });
}

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,
  resolvedTheme: initialTheme === "system" ? getSystemTheme() : initialTheme,

  setTheme: (newTheme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore storage error
    }
    applyThemeToDocument(newTheme);
    set({
      theme: newTheme,
      resolvedTheme: newTheme === "system" ? getSystemTheme() : newTheme,
    });
  },

  toggleTheme: () => {
    const currentResolved = get().resolvedTheme;
    const nextTheme = currentResolved === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));

export { THEME_STORAGE_KEY };
