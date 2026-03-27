"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type CustomScrollShellProps = {
  children: ReactNode;
  className?: string;
  page?: boolean;
  viewportClassName?: string;
};

const MIN_THUMB_SIZE = 48;
const TRACK_HIDE_DELAY_MS = 900;
const SCROLL_OVERFLOW_THRESHOLD_PX = 2;

type ScrollMetrics = {
  canScrollY: boolean;
  thumbHeight: number;
  thumbOffset: number;
};

const defaultMetrics: ScrollMetrics = {
  canScrollY: false,
  thumbHeight: MIN_THUMB_SIZE,
  thumbOffset: 0,
};

function isSameMetrics(current: ScrollMetrics, next: ScrollMetrics) {
  return (
    current.canScrollY === next.canScrollY &&
    Math.abs(current.thumbHeight - next.thumbHeight) < 0.5 &&
    Math.abs(current.thumbOffset - next.thumbOffset) < 0.5
  );
}

export function CustomScrollShell({
  children,
  className,
  page = false,
  viewportClassName,
}: CustomScrollShellProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    startPointerY: 0,
    startScrollTop: 0,
  });
  const metricsRef = useRef<ScrollMetrics>(defaultMetrics);
  const [metrics, setMetrics] = useState<ScrollMetrics>(defaultMetrics);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleTrackHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsActive(false);
    }, TRACK_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  function updateMetrics() {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return;
    }

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    const trackHeight = track.clientHeight;

    if (maxScrollTop <= SCROLL_OVERFLOW_THRESHOLD_PX || trackHeight <= 0) {
      const nextMetrics = {
        canScrollY: false,
        thumbHeight: MIN_THUMB_SIZE,
        thumbOffset: 0,
      };

      metricsRef.current = nextMetrics;
      setMetrics((currentMetrics) =>
        isSameMetrics(currentMetrics, nextMetrics)
          ? currentMetrics
          : nextMetrics,
      );
      return;
    }

    const nextThumbHeight = Math.max(
      MIN_THUMB_SIZE,
      (viewport.clientHeight / viewport.scrollHeight) * trackHeight,
    );
    const maxThumbOffset = Math.max(trackHeight - nextThumbHeight, 0);
    const nextThumbOffset =
      maxThumbOffset === 0
        ? 0
        : (viewport.scrollTop / maxScrollTop) * maxThumbOffset;

    const nextMetrics = {
      canScrollY: true,
      thumbHeight: nextThumbHeight,
      thumbOffset: nextThumbOffset,
    };

    metricsRef.current = nextMetrics;
    setMetrics((currentMetrics) =>
      isSameMetrics(currentMetrics, nextMetrics) ? currentMetrics : nextMetrics,
    );
  }

  function showTrack() {
    if (!metricsRef.current.canScrollY) {
      return;
    }

    clearHideTimer();
    setIsActive(true);

    if (!isDragging) {
      scheduleTrackHide();
    }
  }

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });
    const mutationObserver = new MutationObserver(() => {
      updateMetrics();
    });

    resizeObserver.observe(viewport);
    mutationObserver.observe(viewport, {
      childList: true,
      subtree: true,
    });

    const handleWindowResize = () => {
      updateMetrics();
    };
    const frameId = window.requestAnimationFrame(() => {
      updateMetrics();
    });

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      clearHideTimer();
    };
  }, [clearHideTimer]);

  useEffect(() => {
    if (!isDragging && isActive) {
      scheduleTrackHide();
    }

    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer, isActive, isDragging, scheduleTrackHide]);

  function handleViewportScroll() {
    updateMetrics();
    showTrack();
  }

  function handleThumbPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!metrics.canScrollY) {
      return;
    }

    event.preventDefault();

    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return;
    }

    dragStateRef.current = {
      startPointerY: event.clientY,
      startScrollTop: viewport.scrollTop,
    };

    clearHideTimer();
    setIsActive(true);
    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentViewport = viewportRef.current;
      const currentTrack = trackRef.current;
      const currentMetrics = metricsRef.current;

      if (!currentViewport || !currentTrack || !currentMetrics.canScrollY) {
        return;
      }

      const maxScrollTop =
        currentViewport.scrollHeight - currentViewport.clientHeight;
      const maxThumbOffset = Math.max(
        currentTrack.clientHeight - currentMetrics.thumbHeight,
        0,
      );

      if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
        return;
      }

      const pointerDeltaY =
        moveEvent.clientY - dragStateRef.current.startPointerY;
      const scrollDelta = (pointerDeltaY / maxThumbOffset) * maxScrollTop;

      currentViewport.scrollTop =
        dragStateRef.current.startScrollTop + scrollDelta;
    };

    const stopDragging = () => {
      setIsDragging(false);
      updateMetrics();
      scheduleTrackHide();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  }

  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track || !metrics.canScrollY) {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const clickOffset = event.clientY - trackRect.top;
    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    const maxThumbOffset = Math.max(
      track.clientHeight - metrics.thumbHeight,
      0,
    );
    const centeredThumbOffset = Math.min(
      Math.max(clickOffset - metrics.thumbHeight / 2, 0),
      maxThumbOffset,
    );

    viewport.scrollTo({
      top:
        maxThumbOffset === 0
          ? 0
          : (centeredThumbOffset / maxThumbOffset) * maxScrollTop,
      behavior: "smooth",
    });

    showTrack();
  }

  return (
    <div
      className={cn(
        "custom-scroll-shell",
        page && "custom-scroll-shell--page",
        metrics.canScrollY && "has-axis-y is-scrollable-y",
        isActive && "is-active",
        isDragging && "is-dragging",
        className,
      )}
      onPointerEnter={() => {
        if (metrics.canScrollY) {
          clearHideTimer();
          setIsActive(true);
        }
      }}
      onPointerLeave={() => {
        if (!isDragging) {
          scheduleTrackHide();
        }
      }}
    >
      <div
        className={cn(
          "custom-scroll-target",
          page && "page-scroll-area",
          viewportClassName,
        )}
        onScroll={handleViewportScroll}
        ref={viewportRef}
      >
        {children}
      </div>

      <div
        className="custom-scroll-track custom-scroll-track--y"
        aria-hidden={!metrics.canScrollY}
        onPointerDown={handleTrackPointerDown}
        ref={trackRef}
      >
        <div
          className="custom-scroll-thumb"
          onPointerDown={handleThumbPointerDown}
          style={{
            height: `${metrics.thumbHeight}px`,
            transform: `translateY(${metrics.thumbOffset}px)`,
          }}
        />
      </div>
    </div>
  );
}
