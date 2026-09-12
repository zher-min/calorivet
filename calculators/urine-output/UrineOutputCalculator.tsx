"use client";

import { useMemo, useState } from "react";
import { calculateUrineOutput } from "./calculateUrineOutput";

type FieldProps = {
  label: string;
  unit: string;
  value: string;
  min: number;
  error: string | null;
  onChange: (value: string) => void;
};

function NumericField({ label, unit, value, min, error, onChange }: FieldProps) {
  return <label className="uo-field">
    <span>{label}</span>
    <span className="uo-input-shell">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step="any"
        value={value}
        onChange={event => onChange(event.target.validity.badInput ? "" : event.target.value)}
        aria-invalid={Boolean(error)}
      />
      <span>{unit}</span>
    </span>
    {error && <small className="uo-field-error">{error}</small>}
  </label>;
}

export default function UrineOutputCalculator() {
  const [weight, setWeight] = useState("");
  const [volume, setVolume] = useState("");
  const [time, setTime] = useState("");

  const weightNumber = Number(weight);
  const volumeNumber = Number(volume);
  const timeNumber = Number(time);
  const weightError = weight !== "" && (!Number.isFinite(weightNumber) || weightNumber <= 0) ? "Enter a weight above 0 kg." : null;
  const volumeError = volume !== "" && (!Number.isFinite(volumeNumber) || volumeNumber < 0) ? "Urine volume cannot be negative." : null;
  const timeError = time !== "" && (!Number.isFinite(timeNumber) || timeNumber <= 0) ? "Enter a collection time above 0 hr." : null;
  const result = useMemo(() => {
    if (!weight.trim() || !volume.trim() || !time.trim()) return null;
    return calculateUrineOutput(weightNumber, volumeNumber, timeNumber);
  }, [weight, volume, time, weightNumber, volumeNumber, timeNumber]);

  const reset = () => { setWeight(""); setVolume(""); setTime(""); };

  return <div className="uo-calculator">
    <section className="uo-input-card" aria-label="Urine output inputs">
      <NumericField label="Body Weight" unit="kg" value={weight} min={0} error={weightError} onChange={setWeight} />
      <NumericField label="Urine Volume" unit="mL" value={volume} min={0} error={volumeError} onChange={setVolume} />
      <NumericField label="Collection Time" unit="hr" value={time} min={0} error={timeError} onChange={setTime} />
      <button type="button" className="uo-reset" onClick={reset} disabled={!weight && !volume && !time}>Reset</button>
    </section>

    <p className="uo-disclaimer">Clinical support tool only. Interpret urine output together with hydration status, renal function, urinary obstruction, fluid therapy, medications, and the overall clinical picture.</p>

    <aside className={`uo-result ${result ? `uo-result--${result.severity}` : "uo-result--neutral"}`} aria-live="polite" aria-atomic="true">
      <div className="uo-result-value">{result ? result.value.toFixed(2) : "--"}</div>
      <div className="uo-result-unit">mL/kg/hr</div>
      {result ? <>
        <div className="uo-status"><span aria-hidden="true" />{result.label}</div>
        <div className="uo-reference">Normal: 1–2 mL/kg/hr</div>
      </> : <div className="uo-neutral-message">Enter weight, urine volume and time</div>}
    </aside>
  </div>;
}
