"use client";

import "react-toastify/dist/ReactToastify.css";

import { ToastContainer, cssTransition } from "react-toastify";
import { useThemeMode } from "@/components/theme-provider";

const toastTransition = cssTransition({
  appendPosition: false,
  collapseDuration: 240,
  enter: "app-toast-motion-enter",
  exit: "app-toast-motion-exit",
});

export function ToastProvider() {
  const { theme } = useThemeMode();

  return (
    <ToastContainer
      autoClose={5000}
      closeButton={false}
      closeOnClick={false}
      draggable={false}
      hideProgressBar
      icon={false}
      newestOnTop
      pauseOnHover
      position="top-right"
      theme={theme === "dark" ? "dark" : "light"}
      toastClassName={() => "app-toast-shell"}
      transition={toastTransition}
    />
  );
}
