"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { ToastContentProps, ToastOptions } from "react-toastify";
import { toast } from "react-toastify";

type AppToastTone = "error" | "info" | "success" | "warning";

const DEFAULT_TOAST_DURATION_MS = 5000;
const COUNTDOWN_STEP_MS = 50;

type AppToastPayload = {
  description?: string;
  meta?: string;
  options?: ToastOptions;
  title: string;
};

const defaultMetaByTone: Record<AppToastTone, string> = {
  error: "Error",
  info: "Info",
  success: "Sukses",
  warning: "Perhatian",
};

const defaultDescriptionByTone: Record<AppToastTone, string> = {
  error: "Ada sesuatu yang perlu dicek lagi sebelum proses dilanjutkan.",
  info: "Informasi terbaru dari proses yang sedang kamu jalankan.",
  success: "Aksi berhasil diproses tanpa kendala.",
  warning: "Ada detail kecil yang sebaiknya kamu perhatikan.",
};

const iconByTone = {
  error: XCircle,
  info: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const;

type AppToastContentProps = AppToastPayload &
  Partial<ToastContentProps> & {
    tone: AppToastTone;
  };

function resolveDurationMs(autoClose: ToastOptions["autoClose"] | undefined) {
  if (autoClose === false) {
    return null;
  }

  if (typeof autoClose === "number" && autoClose > 0) {
    return autoClose;
  }

  return DEFAULT_TOAST_DURATION_MS;
}

function formatRemainingTime(milliseconds: number) {
  return `${(Math.max(milliseconds, 0) / 1000).toFixed(1)}s`;
}

function AppToastContent({
  closeToast,
  description,
  isPaused,
  meta,
  title,
  toastProps,
  tone,
}: AppToastContentProps) {
  const Icon = iconByTone[tone];
  const durationMs = resolveDurationMs(toastProps?.autoClose);
  const [remainingMs, setRemainingMs] = useState(() => durationMs ?? 0);
  const hasClosedRef = useRef(false);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (durationMs === null || isPaused || hasClosedRef.current) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const previousTick = lastTickRef.current ?? now;
      const elapsed = now - previousTick;

      lastTickRef.current = now;
      setRemainingMs((currentTime) => Math.max(currentTime - elapsed, 0));
    }, COUNTDOWN_STEP_MS);

    return () => {
      lastTickRef.current = null;
      window.clearInterval(intervalId);
    };
  }, [durationMs, isPaused]);

  useEffect(() => {
    if (durationMs === null || remainingMs > 0 || hasClosedRef.current) {
      return;
    }

    hasClosedRef.current = true;
    closeToast?.("timeout");
  }, [closeToast, durationMs, remainingMs]);

  const progressScale = durationMs ? remainingMs / durationMs : 0;
  const remainingLabel = formatRemainingTime(remainingMs);

  return (
    <div className="app-toast">
      <div className="app-toast__icon-wrap">
        <span className="app-toast__icon" data-toast-tone={tone}>
          <Icon className="size-5" />
        </span>
      </div>

      <div className="app-toast__content">
        <div className="app-toast__header">
          <p className="app-toast__meta">{meta ?? defaultMetaByTone[tone]}</p>
          <button
            aria-label="Tutup notifikasi"
            className="app-toast__close"
            onClick={() => closeToast?.()}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="app-toast__title">{title}</p>
        <p className="app-toast__description">
          {description ?? defaultDescriptionByTone[tone]}
        </p>

        {durationMs !== null ? (
          <div
            aria-label={`Toast akan menutup dalam ${remainingLabel}`}
            className="app-toast__timeline"
          >
            <div
              className="app-toast__timeline-fill"
              style={{
                transform: `scaleX(${progressScale})`,
              }}
            />
            <div className="app-toast__timeline-content">
              <span className="app-toast__timeline-copy">Tutup otomatis</span>
              <span className="app-toast__timeline-time">{remainingLabel}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function showAppToast(tone: AppToastTone, payload: AppToastPayload) {
  const { options, ...content } = payload;
  const toastByTone = {
    error: toast.error,
    info: toast.info,
    success: toast.success,
    warning: toast.warning,
  } as const;

  return toastByTone[tone](
    (toastProps) => (
      <AppToastContent {...content} {...toastProps} tone={tone} />
    ),
    {
      autoClose: DEFAULT_TOAST_DURATION_MS,
      ...options,
      customProgressBar: true,
    },
  );
}

export const appToast = {
  error: (payload: AppToastPayload) => showAppToast("error", payload),
  info: (payload: AppToastPayload) => showAppToast("info", payload),
  success: (payload: AppToastPayload) => showAppToast("success", payload),
  warning: (payload: AppToastPayload) => showAppToast("warning", payload),
};
