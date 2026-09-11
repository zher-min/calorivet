"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_INTERVALS = 5;
export const MIN_INTERVAL_MS = 150;
export const AUTO_RESET_MS = 10_000;

export default function TapRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  const lastTapRef = useRef<number | null>(null);
  const intervalsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearResetTimer();

    lastTapRef.current = null;
    intervalsRef.current = [];

    setRate(null);
    setActive(false);
    setPressed(false);
  }, [clearResetTimer]);

  const scheduleReset = useCallback(() => {
    clearResetTimer();

    resetTimerRef.current = window.setTimeout(() => {
      reset();
    }, AUTO_RESET_MS);
  }, [clearResetTimer, reset]);

  const giveHapticFeedback = useCallback(() => {
    if (
      typeof navigator !== "undefined" &&
      "vibrate" in navigator
    ) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const previousTap = lastTapRef.current;

    // First tap starts the measurement.
    if (previousTap === null) {
      lastTapRef.current = now;
      setActive(true);

      scheduleReset();
      giveHapticFeedback();

      return;
    }

    const interval = now - previousTap;

    // Ignore accidental ultra-fast double taps.
    if (interval < MIN_INTERVAL_MS) {
      return;
    }

    lastTapRef.current = now;

    const intervals = [
      ...intervalsRef.current,
      interval,
    ].slice(-MAX_INTERVALS);

    intervalsRef.current = intervals;

    const meanInterval =
      intervals.reduce((sum, value) => sum + value, 0) /
      intervals.length;

    const calculatedRate = Math.round(
      60_000 / meanInterval
    );

    setRate(calculatedRate);
    setActive(true);

    scheduleReset();
    giveHapticFeedback();
  }, [scheduleReset, giveHapticFeedback]);

  useEffect(() => {
    return () => {
      clearResetTimer();
    };
  }, [clearResetTimer]);

  return (
    <div className="tap-rate">
      <div className="tap-rate__display" aria-live="polite" aria-atomic="true">
        <div className="tap-rate__value">
          {rate ?? "--"}
        </div>

        <div className="tap-rate__unit">
          /min
        </div>
      </div>

      <button
        type="button"
        className={`tap-rate__tap ${
          pressed ? "tap-rate__tap--pressed" : ""
        }`}
        onPointerDown={(event) => {
          event.preventDefault();
          setPressed(true);
          handleTap();
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label="Tap to calculate rate"
      >
        TAP
      </button>

      <button
        type="button"
        className="tap-rate__reset"
        onClick={reset}
        disabled={!active}
      >
        Reset
      </button>
    </div>
  );
}
