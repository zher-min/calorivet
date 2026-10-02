"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateMeasuredRate, calculateTargetRate, MAX_INTERVALS, MIN_INTERVAL_MS, summarizeIntervals } from "./calculations";

type Mode = "measure" | "target";
type FactorChoice = "20" | "60" | "10" | "15" | "custom";

const FACTOR_LABELS: Record<FactorChoice, string> = {
  "20": "20 drops/mL — macrodrip",
  "60": "60 drops/mL — microdrip",
  "10": "10 drops/mL",
  "15": "15 drops/mL",
  custom: "Custom drops/mL",
};

const formatRate = (value: number) => value >= 10 ? Math.round(value).toString() : value.toFixed(1);
const formatSeconds = (value: number) => value >= 10 ? value.toFixed(1) : value.toFixed(2);

export default function TapDripRate() {
  const [mode, setMode] = useState<Mode>("measure");
  const [factorChoice, setFactorChoice] = useState<FactorChoice | null>(null);
  const [customFactor, setCustomFactor] = useState("");
  const [intervals, setIntervals] = useState<number[]>([]);
  const [dropCount, setDropCount] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [tapFlash, setTapFlash] = useState(false);
  const [tapMessage, setTapMessage] = useState("Ready to measure");
  const [targetRate, setTargetRate] = useState("");
  const lastTapRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const dropFactor = factorChoice === "custom" ? Number(customFactor) : factorChoice ? Number(factorChoice) : Number.NaN;
  const validDropFactor = Number.isFinite(dropFactor) && dropFactor > 0;
  const summary = useMemo(() => summarizeIntervals(intervals), [intervals]);
  const measurement = useMemo(() => calculateMeasuredRate(intervals, dropFactor), [intervals, dropFactor]);
  const target = useMemo(() => calculateTargetRate(Number(targetRate), dropFactor), [targetRate, dropFactor]);

  const flash = useCallback(() => {
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    setTapFlash(false);
    window.requestAnimationFrame(() => setTapFlash(true));
    flashTimerRef.current = window.setTimeout(() => setTapFlash(false), 130);
  }, []);

  const giveHapticFeedback = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  }, []);

  const handleTap = useCallback(() => {
    if (!validDropFactor) {
      setTapMessage("Select a drop factor");
      return;
    }
    const now = performance.now();
    const previousTap = lastTapRef.current;
    if (previousTap !== null && now - previousTap < MIN_INTERVAL_MS) {
      setTapMessage("Rapid tap ignored");
      return;
    }
    lastTapRef.current = now;
    setDropCount(count => count + 1);
    flash();
    giveHapticFeedback();
    if (previousTap === null) {
      setTapMessage("Keep tapping with each drop");
      return;
    }
    setIntervals(values => [...values, now - previousTap].slice(-MAX_INTERVALS));
    setTapMessage("Drop recorded");
  }, [flash, giveHapticFeedback, validDropFactor]);

  const reset = useCallback(() => {
    lastTapRef.current = null;
    setIntervals([]);
    setDropCount(0);
    setPressed(false);
    setTapFlash(false);
    setTapMessage("Ready to measure");
  }, []);

  useEffect(() => () => {
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
  }, []);

  const measurementState = !factorChoice
    ? "Select a drop factor"
    : !validDropFactor
      ? "Enter a valid drop factor"
    : !summary || summary.stability === "measuring"
      ? dropCount === 0 ? "Ready" : "Measuring…"
      : summary.stability === "stable" ? "Stable" : "Settling";

  return <div className="drip-rate">
    <nav className="drip-rate__modes segmented" aria-label="Tap drip rate mode">
      <button type="button" className={mode === "measure" ? "active" : ""} aria-pressed={mode === "measure"} onClick={() => setMode("measure")}>Tap to Measure</button>
      <button type="button" className={mode === "target" ? "active" : ""} aria-pressed={mode === "target"} onClick={() => setMode("target")}>Set Target</button>
    </nav>

    <section className="drip-rate__factor" aria-labelledby="drop-factor-title">
      <div className="drip-rate__section-heading"><h2 id="drop-factor-title">Giving-set drop factor</h2><span>Check the actual giving set</span></div>
      <div className="drip-rate__primary-factors">
        <button type="button" aria-pressed={factorChoice === "20"} onClick={() => setFactorChoice("20")}><strong>20 drops/mL</strong><span>Macrodrip</span></button>
        <button type="button" aria-pressed={factorChoice === "60"} onClick={() => setFactorChoice("60")}><strong>60 drops/mL</strong><span>Microdrip</span></button>
      </div>
      <div className="drip-rate__secondary-factors" aria-label="Other drop factors">
        <button type="button" aria-pressed={factorChoice === "10"} onClick={() => setFactorChoice("10")}>10 drops/mL</button>
        <button type="button" aria-pressed={factorChoice === "15"} onClick={() => setFactorChoice("15")}>15 drops/mL</button>
        <button type="button" aria-pressed={factorChoice === "custom"} onClick={() => setFactorChoice("custom")}>Custom</button>
      </div>
      {factorChoice === "custom" && <label className="drip-rate__custom-factor"><span>Custom drop factor</span><span><input type="number" inputMode="decimal" min="0.1" step="any" value={customFactor} onChange={event => setCustomFactor(event.target.value)} aria-invalid={customFactor !== "" && !validDropFactor} /><b>drops/mL</b></span></label>}
      <p className="drip-rate__selected-factor"><span>Selected</span><strong>{!factorChoice ? "Select the actual giving-set factor" : factorChoice === "custom" && validDropFactor ? `${dropFactor} drops/mL — custom` : FACTOR_LABELS[factorChoice]}</strong></p>
    </section>

    {mode === "measure" ? <section className="drip-rate__measure" aria-label="Tap measurement">
      <div className="drip-rate__display" aria-live="polite" aria-atomic="true">
        <div className="drip-rate__display-label">Estimated rate</div>
        <div className="drip-rate__value">{measurement ? formatRate(measurement.mlPerHour) : "--"}</div>
        <div className="drip-rate__unit">mL/hr</div>
        <div className={`drip-rate__stability drip-rate__stability--${measurementState.toLowerCase().replace(/[^a-z]+/g, "-")}`}><span aria-hidden="true" />{measurementState}</div>
      </div>
      <dl className="drip-rate__metrics">
        <div><dt>Drops/min</dt><dd>{measurement ? Math.round(measurement.dropsPerMinute) : "--"}</dd></div>
        <div><dt>Seconds/drop</dt><dd>{measurement ? formatSeconds(measurement.intervalSeconds) : "--"}</dd></div>
        <div><dt>Drops recorded</dt><dd>{dropCount}</dd></div>
      </dl>
      <button type="button" className={`drip-rate__tap${pressed ? " drip-rate__tap--pressed" : ""}${tapFlash ? " drip-rate__tap--flash" : ""}`}
        onPointerDown={event => { event.preventDefault(); setPressed(true); handleTap(); }} onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
        onKeyDown={event => { if (!event.repeat && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); handleTap(); } }}
        onContextMenu={event => event.preventDefault()} aria-label="Record one observed IV fluid drop" disabled={!validDropFactor}>
        <strong>TAP</strong><span>{tapMessage}</span>
      </button>
      <button type="button" className="drip-rate__reset" onClick={reset} disabled={dropCount === 0}>Reset measurement</button>
    </section> : <section className="drip-rate__target" aria-label="Target drip rate">
      <label className="drip-rate__target-field"><span>Desired fluid rate</span><span><input type="number" inputMode="decimal" min="0" step="any" value={targetRate} onChange={event => setTargetRate(event.target.value)} /><b>mL/hr</b></span></label>
      <div className="drip-rate__target-result" aria-live="polite">{target ? <>
        <div><span>Set the drip to approximately</span><strong>{Math.round(target.dropsPerMinute)} drops/min</strong></div>
        <div><span>Timing guide</span><strong>1 drop every {formatSeconds(target.secondsPerDrop)} sec</strong></div>
      </> : <p>Enter a desired rate to calculate the target drip frequency.</p>}</div>
    </section>}

    <p className="drip-rate__safety">Estimate based on observed drip frequency. Verify the giving-set drop factor and reassess the actual fluid delivery regularly. This tool does not replace an infusion pump.</p>
  </div>;
}
