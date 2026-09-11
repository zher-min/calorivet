"use client";

import { useMemo, useState } from "react";
import { calculateBSA, type BsaSpecies } from "./calculateBSA";

export default function BsaCalculator() {
  const [species, setSpecies] = useState<BsaSpecies>("dog");
  const [weight, setWeight] = useState("");

  const weightKg = Number(weight);
  const bsa = useMemo(() => {
    if (weight.trim() === "" || !Number.isFinite(weightKg) || weightKg <= 0) {
      return null;
    }

    return calculateBSA(weightKg, species);
  }, [weight, weightKg, species]);

  const showSmallPatientWarning = bsa !== null && weightKg < 10;
  const invalidWeight = weight.trim() !== "" && bsa === null;

  return <div className="bsa-calculator">
    <fieldset className="species-picker">
      <legend>Species</legend>
      <div className="segmented">
        {(["dog", "cat"] as BsaSpecies[]).map(item => <button
          key={item}
          type="button"
          aria-pressed={species === item}
          className={species === item ? "active" : ""}
          onClick={() => setSpecies(item)}
        >
          <span className="species-emoji" aria-hidden="true">{item === "dog" ? "🐕" : "🐈"}</span>
          {item === "dog" ? "Dog" : "Cat"}
        </button>)}
      </div>
    </fieldset>

    <label className="bsa-weight-field">
      <span>Weight</span>
      <span className="bsa-weight-input">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={weight}
          onChange={event => setWeight(event.target.validity.badInput ? "" : event.target.value)}
          aria-invalid={invalidWeight}
        />
        <span>kg</span>
      </span>
    </label>

    <div className="bsa-result" aria-live="polite" aria-atomic="true">
      <span>BSA</span>
      <strong>{bsa !== null ? bsa.toFixed(3) : "--"}</strong>
      <span>m<sup>2</sup></span>
    </div>

    {showSmallPatientWarning && <p className="bsa-warning">
      Small patients: BSA-based chemotherapy dosing may increase overdose/toxicity risk. Some antineoplastic protocols use mg/kg dosing instead. Follow the specific protocol.
    </p>}
  </div>;
}
