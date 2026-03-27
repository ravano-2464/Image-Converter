"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
  theme: ThemeMode;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "image-converter-theme";
const THEME_ANIMATION_CLASS = "theme-animating";
const THEME_ANIMATION_DURATION_MS = 460;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(
  theme: ThemeMode,
  options?: {
    animate?: boolean;
  },
) {
  const root = document.documentElement;
  const shouldAnimate = options?.animate ?? false;

  if (shouldAnimate) {
    root.classList.add(THEME_ANIMATION_CLASS);
  } else {
    root.classList.remove(THEME_ANIMATION_CLASS);
  }

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : getSystemTheme();
  });
  const hasAppliedInitialThemeRef = useRef(false);
  const animationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const shouldAnimate = hasAppliedInitialThemeRef.current;

    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }

    applyTheme(theme, { animate: shouldAnimate });
    hasAppliedInitialThemeRef.current = true;

    if (shouldAnimate) {
      animationTimerRef.current = window.setTimeout(() => {
        document.documentElement.classList.remove(THEME_ANIMATION_CLASS);
        animationTimerRef.current = null;
      }, THEME_ANIMATION_DURATION_MS);
    }

    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [theme]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(THEME_ANIMATION_CLASS);
    };
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ setTheme, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeProvider.");
  }

  return context;
}
