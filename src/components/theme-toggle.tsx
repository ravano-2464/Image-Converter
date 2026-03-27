"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/components/theme-provider";

function subscribe() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeMode();
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return (
      <Button
        className="min-w-[9.25rem] justify-center"
        disabled
        type="button"
        variant="outline"
      >
        <SunMedium />
        Memuat tema
      </Button>
    );
  }

  const isDarkMode = theme === "dark";

  return (
    <Button
      className="min-w-[9.25rem] justify-center"
      onClick={toggleTheme}
      type="button"
      variant="outline"
    >
      {isDarkMode ? <SunMedium /> : <MoonStar />}
      {isDarkMode ? "Mode Terang" : "Mode Gelap"}
    </Button>
  );
}
