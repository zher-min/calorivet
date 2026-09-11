"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCalculator } from "../../config/calculators";
import ReferenceList from "../../components/calculators/ReferenceList";
import { calorieReferences } from "./references";
const calculator = getCalculator("calorie");
import {
  activityFactors,
  calculateDailyEnergy,
  calculateFeedingAmount,
  calculateGuaranteedAnalysis,
  calculateLactationEnergy,
  estimateTargetWeightFromBcs,
  lactationWeekFactor,
  offspringEnergy,
  parseFiniteNumber,
  selectFoodEnergy,
  type GuaranteedAnalysisInput,
  type ManufacturerEnergyUnit,
  type Species,
} from "./calculations";

const emptyAnalysis: Record<keyof GuaranteedAnalysisInput, string> = {
  moisture: "",
  protein: "",
  fat: "",
  fibre: "",
  ash: "",
};

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("en-MY", { maximumFractionDigits: digits });

const formatRange = (minimum: number, maximum: number, unit: string) =>
  `${formatNumber(minimum)}–${formatNumber(maximum)} ${unit}`;

const isSingleValue = (minimum: number, maximum: number) => Math.abs(maximum - minimum) < 1e-9;
const formatEstimate = (minimum: number, maximum: number, unit: string) =>
  isSingleValue(minimum, maximum) ? `${formatNumber(minimum)} ${unit}` : formatRange(minimum, maximum, unit);
const formatMultiplier = (value: number) => value.toLocaleString("en-MY", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatFactor = (minimum: number, maximum: number) =>
  `${isSingleValue(minimum, maximum) ? formatMultiplier(minimum) : `${formatMultiplier(minimum)}–${formatMultiplier(maximum)}`} × RER`;

const clinicalDisclaimerText = "Estimated feeding amount only. Individual requirements may vary with body condition, activity level, health status, environment and treatment goals. Use as a starting guide and adjust according to clinical response and body-weight trends. Veterinary supervision is recommended.";


function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = "0.1",
  min,
  max,
  error,
  hint,
  primary = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  step?: string;
  min?: string;
  max?: string;
  error?: string;
  hint?: string;
  primary?: boolean;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <label className={`field${primary ? " primary-field" : ""}`} htmlFor={id}>
      <span>{label}</span>
      <span className={`input-wrap${error ? " invalid" : ""}`}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <b aria-hidden="true">{suffix}</b>
      </span>
      {hint && <small className="field-hint" id={`${id}-hint`}>{hint}</small>}
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </label>
  );
}

function TargetWeightField({
  currentWeight,
  value,
  onChange,
  error,
}: {
  currentWeight: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedBcs, setSelectedBcs] = useState<number | null>(null);
  const helperRef = useRef<HTMLDivElement>(null);
  const currentWeightValue = parseFiniteNumber(currentWeight);
  const validCurrentWeight = currentWeightValue !== null && currentWeightValue > 0;
  const estimatedTargetWeight = selectedBcs === null
    ? null
    : estimateTargetWeightFromBcs(currentWeight, selectedBcs);
  const roundedTargetWeight = estimatedTargetWeight === null
    ? null
    : Math.round(estimatedTargetWeight * 10) / 10;

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePress(event: PointerEvent) {
      if (!helperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openEstimator() {
    setSelectedBcs(null);
    setOpen(true);
  }

  function useEstimate() {
    if (roundedTargetWeight === null) return;
    onChange(roundedTargetWeight.toFixed(1));
    setOpen(false);
  }

  const describedBy = ["target-weight-hint", error ? "target-weight-error" : ""].filter(Boolean).join(" ");

  return (
    <div className="field target-weight-field" ref={helperRef}>
      <div className="target-weight-label-row">
        <label htmlFor="target-weight">Target / ideal body weight</label>
        <button type="button" className="bcs-trigger" aria-expanded={open} aria-controls="bcs-target-popover" onClick={openEstimator}>Estimate from BCS</button>
      </div>
      <span className={`input-wrap${error ? " invalid" : ""}`}>
        <input
          id="target-weight"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.1"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <b aria-hidden="true">kg</b>
      </span>
      <small className="field-hint" id="target-weight-hint">Used for the weight-loss energy calculation.</small>
      {error && <small className="field-error" id="target-weight-error">{error}</small>}

      {open && (
        <section className="bcs-popover" id="bcs-target-popover" role="dialog" aria-modal="false" aria-labelledby="bcs-popover-title">
          <div className="bcs-popover-heading">
            <h3 id="bcs-popover-title">Estimate target weight from BCS</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close BCS estimator">×</button>
          </div>

          <div className="bcs-current-weight">
            <span>Current BW</span>
            <strong>{validCurrentWeight ? `${formatNumber(currentWeightValue, 2)} kg` : "Enter current BW first"}</strong>
          </div>

          <fieldset className="bcs-options" disabled={!validCurrentWeight}>
            <legend>BCS</legend>
            <div>
              {[6, 7, 8, 9].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={selectedBcs === score ? "selected" : ""}
                  aria-pressed={selectedBcs === score}
                  aria-label={`BCS ${score} of 9, approximately ${(score - 5) * 10}% overweight`}
                  onClick={() => setSelectedBcs(score)}
                >
                  {score}<small>/9</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="bcs-estimate" aria-live="polite">
            <span>Estimated target BW</span>
            <strong>{roundedTargetWeight === null ? "—" : `${roundedTargetWeight.toFixed(1)} kg`}</strong>
          </div>

          <button type="button" className="bcs-use-button" disabled={roundedTargetWeight === null} onClick={useEstimate}>
            {roundedTargetWeight === null ? "Select BCS" : `Use ${roundedTargetWeight.toFixed(1)} kg`}
          </button>

          <div className="bcs-reference-note">
            <p>AAHA 2021: each BCS point &gt;5/9 corresponds to approximately 10% excess body weight. <a href="https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/screening-evaluation/" target="_blank" rel="noreferrer">Reference <span aria-hidden="true">↗</span></a></p>
            <span className="bcs-info" tabIndex={0} role="img" aria-label="BCS-derived target weight is an estimate. Reassess target weight and caloric intake according to clinical response. Interpret BCS alongside muscle condition where clinically relevant." data-tooltip="BCS-derived target weight is an estimate. Reassess target weight and caloric intake according to clinical response. Interpret BCS alongside muscle condition where clinically relevant.">i</span>
          </div>
        </section>
      )}
    </div>
  );
}

function SpeciesPicker({ value, onChange, prefix }: { value: Species; onChange: (value: Species) => void; prefix: string }) {
  return (
    <fieldset className="species-picker">
      <legend>Species</legend>
      <div className="segmented" id={`${prefix}-species`}>
        {(["Dog", "Cat"] as Species[]).map((item) => (
          <button key={item} type="button" aria-pressed={value === item} className={value === item ? "active" : ""} onClick={() => onChange(item)}>
            <span className="species-emoji" aria-hidden="true">{item === "Dog" ? "🐕" : "🐈"}</span>
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StepHeader({ id, number, title, copy }: { id: string; number: string; title: string; copy: string }) {
  return (
    <div className="step-header">
      <span>{number}</span>
      <div><h2 id={id}>{title}</h2><p>{copy}</p></div>
    </div>
  );
}

function EnergyResult({
  minimum,
  maximum,
  rer,
  factorMinimum,
  factorMaximum,
  calculation,
}: {
  minimum: number;
  maximum: number;
  rer: number;
  factorMinimum: number | null;
  factorMaximum: number | null;
  calculation: "factor" | "lactation";
}) {
  const hasRange = !isSingleValue(minimum, maximum);
  const basis = calculation === "factor" && factorMinimum !== null && factorMaximum !== null
    ? formatFactor(factorMinimum, factorMaximum)
    : "Species-specific lactation equation";

  return (
    <section className="energy-result" aria-live="polite" aria-label="Estimated daily energy requirement">
      <div className="energy-primary">
        <p>Estimated starting requirement</p>
        <strong>{formatEstimate(minimum, maximum, "kcal/day")}</strong>
        <span>{hasRange ? "Published factor range" : "Single starting estimate"}</span>
      </div>
      <aside className="energy-range" aria-label="Energy calculation basis">
        <span>Calculation basis</span>
        <strong>{basis}</strong>
      </aside>
      <div className="energy-meta"><span>RER {formatNumber(rer)} kcal/day</span></div>
      <small>Calculated energy requirements are starting estimates. Individual requirements may vary substantially; monitor body weight and body condition score and adjust intake accordingly.</small>
      <details className="energy-variability">
        <summary>About biological variability</summary>
        <p>Published guidance notes that individual maintenance energy requirements may vary by approximately ±30% in dogs and ±50% in cats. These values describe biological variability and are not intended to be displayed as routine feeding ranges.</p>
      </details>
    </section>
  );
}

function FeedingResult({ minimum, maximum, midpoint }: { minimum: number; maximum: number; midpoint: number }) {
  const hasRange = !isSingleValue(minimum, maximum);
  return (
    <section className={`feeding-result${hasRange ? "" : " single-value"}`} aria-live="polite" aria-label="Estimated feeding amount">
      <div className="feeding-primary">
        <span>Estimated amount to feed</span>
        <strong>{formatNumber(midpoint)} g/day</strong>
        <small>{hasRange ? "MER-based midpoint" : "Single starting amount"}</small>
      </div>
      {hasRange && (
        <aside className="feeding-range" aria-label="Estimated feeding range">
          <span>Estimated range</span>
          <strong>{formatRange(minimum, maximum, "g/day")}</strong>
        </aside>
      )}
    </section>
  );
}

function ClinicalDisclaimer() {
  return (
    <div className="clinical-disclaimer" role="note">
      <span aria-hidden="true">i</span>
      <p>{clinicalDisclaimerText}</p>
    </div>
  );
}

function FoodEnergyControls({
  idPrefix,
  manufacturerEnabled,
  onManufacturerEnabledChange,
  manufacturerValue,
  onManufacturerValueChange,
  manufacturerUnit,
  onManufacturerUnitChange,
  manufacturerError,
  analysisEnabled,
  onAnalysisEnabledChange,
  analysis,
  onAnalysisChange,
  onClearAnalysis,
  guaranteedAnalysis,
  selectedFoodEnergy,
  foodMessage,
}: {
  idPrefix: string;
  manufacturerEnabled: boolean;
  onManufacturerEnabledChange: (value: boolean) => void;
  manufacturerValue: string;
  onManufacturerValueChange: (value: string) => void;
  manufacturerUnit: ManufacturerEnergyUnit;
  onManufacturerUnitChange: (value: ManufacturerEnergyUnit) => void;
  manufacturerError?: string;
  analysisEnabled: boolean;
  onAnalysisEnabledChange: (value: boolean) => void;
  analysis: Record<keyof GuaranteedAnalysisInput, string>;
  onAnalysisChange: (field: keyof GuaranteedAnalysisInput, value: string) => void;
  onClearAnalysis: () => void;
  guaranteedAnalysis: ReturnType<typeof calculateGuaranteedAnalysis>;
  selectedFoodEnergy: ReturnType<typeof selectFoodEnergy>;
  foodMessage: string | null;
}) {
  return (
    <>
      <div className="source-options">
        <label className="source-option">
          <input type="checkbox" checked={manufacturerEnabled} onChange={(event) => onManufacturerEnabledChange(event.target.checked)} />
          <span><b>Caloric value provided by manufacturer</b><small>Accepts kcal/kg or kcal/100 g · preferred source</small></span>
        </label>
        {manufacturerEnabled && (
          <div className="conditional-panel manufacturer-panel">
            <NumberField
              id={`${idPrefix}-manufacturer-kcal`}
              label="Manufacturer caloric density"
              value={manufacturerValue}
              onChange={onManufacturerValueChange}
              suffix={manufacturerUnit}
              min="0.01"
              step="0.1"
              error={manufacturerError}
              hint={`Enter ${manufacturerUnit} from the product label or manufacturer.`}
            />
            <label className="field" htmlFor={`${idPrefix}-manufacturer-unit`}>
              <span>Energy unit</span>
              <select id={`${idPrefix}-manufacturer-unit`} value={manufacturerUnit} onChange={(event) => onManufacturerUnitChange(event.target.value as ManufacturerEnergyUnit)}>
                <option value="kcal/kg">kcal/kg</option>
                <option value="kcal/100g">kcal/100 g</option>
              </select>
            </label>
          </div>
        )}

        <label className="source-option">
          <input type="checkbox" checked={analysisEnabled} onChange={(event) => onAnalysisEnabledChange(event.target.checked)} />
          <span><b>Guaranteed Analysis available</b><small>Estimate energy from nutrients listed on the label</small></span>
        </label>
        {analysisEnabled && (
          <div className="conditional-panel analysis-panel">
            <div className="analysis-heading"><div><h3>Guaranteed Analysis</h3><p>All five values are required. No nutrient value is assumed.</p></div><button type="button" onClick={onClearAnalysis}>Clear</button></div>
            <div className="analysis-grid">
              <NumberField id={`${idPrefix}-ga-protein`} label="Crude protein" value={analysis.protein} onChange={(value) => onAnalysisChange("protein", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-fat`} label="Crude fat" value={analysis.fat} onChange={(value) => onAnalysisChange("fat", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-fibre`} label="Crude fibre" value={analysis.fibre} onChange={(value) => onAnalysisChange("fibre", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-moisture`} label="Moisture" value={analysis.moisture} onChange={(value) => onAnalysisChange("moisture", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-ash`} label="Ash" value={analysis.ash} onChange={(value) => onAnalysisChange("ash", value)} suffix="%" min="0" max="100" hint="If ash is not listed, obtain or enter a clinically justified estimate." />
            </div>

            {!guaranteedAnalysis.valid && (
              <div className="analysis-status" role="status">
                {guaranteedAnalysis.missing.length > 0 && <p><b>Required:</b> {guaranteedAnalysis.missing.join(", ")}</p>}
                {guaranteedAnalysis.errors.map((error) => <p key={error}>{error}</p>)}
              </div>
            )}

            {guaranteedAnalysis.valid && (
              <div className="analysis-results" aria-live="polite">
                <div className="analysis-energy"><span>Estimated food energy</span><strong>{formatNumber(guaranteedAnalysis.kcalKg)} kcal/kg</strong>{selectedFoodEnergy?.source === "manufacturer" && <small>Calculated for nutrition reference; manufacturer value remains active.</small>}</div>
                <div className="distribution" aria-label="Caloric distribution">
                  <div><span>Protein energy</span><b>{formatNumber(guaranteedAnalysis.proteinEnergy, 1)}%</b></div>
                  <div><span>Fat energy</span><b>{formatNumber(guaranteedAnalysis.fatEnergy, 1)}%</b></div>
                  <div><span>Carbohydrate energy</span><b>{formatNumber(guaranteedAnalysis.carbohydrateEnergy, 1)}%</b></div>
                  <div><span>Calculated carbohydrate</span><b>{formatNumber(guaranteedAnalysis.carbohydrate, 1)}%</b></div>
                </div>
                <details>
                  <summary>View dry-matter composition</summary>
                  <div className="dry-matter-list">
                    <span>Protein <b>{formatNumber(guaranteedAnalysis.dryMatter.protein, 1)}%</b></span>
                    <span>Fat <b>{formatNumber(guaranteedAnalysis.dryMatter.fat, 1)}%</b></span>
                    <span>Fibre <b>{formatNumber(guaranteedAnalysis.dryMatter.fibre, 1)}%</b></span>
                    <span>Ash <b>{formatNumber(guaranteedAnalysis.dryMatter.ash, 1)}%</b></span>
                    <span>Carbohydrate <b>{formatNumber(guaranteedAnalysis.dryMatter.carbohydrate, 1)}%</b></span>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFoodEnergy && (
        <div className="active-energy" aria-live="polite">
          <span>Food energy used for feeding estimate</span>
          <strong>{formatNumber(selectedFoodEnergy.kcalKg)} kcal/kg</strong>
          <small>{selectedFoodEnergy.source === "manufacturer" ? "Manufacturer-provided value" : "Estimated from Guaranteed Analysis"}</small>
        </div>
      )}
      {foodMessage && <div className="info-message" role="status">{foodMessage}</div>}
    </>
  );
}

export default function Home() {
  const [species, setSpecies] = useState<Species>("Dog");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [petName, setPetName] = useState("");
  const [condition, setCondition] = useState("Intact adult");
  const [lactating, setLactating] = useState(false);
  const [manufacturerEnabled, setManufacturerEnabled] = useState(false);
  const [manufacturerKcalKg, setManufacturerKcalKg] = useState("");
  const [manufacturerUnit, setManufacturerUnit] = useState<ManufacturerEnergyUnit>("kcal/kg");
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [analysis, setAnalysis] = useState(emptyAnalysis);
  const [offspring, setOffspring] = useState(5);
  const [week, setWeek] = useState(1);
  const [copyStatus, setCopyStatus] = useState("Copy summary");

  const weightLossSelected = !lactating && condition === "Weight loss";
  const dailyEnergy = useMemo(() => {
    const currentWeight = parseFiniteNumber(weight);
    if (currentWeight === null || currentWeight <= 0) return null;
    if (lactating) return calculateLactationEnergy(weight, species, offspring, week);
    return calculateDailyEnergy(weightLossSelected ? targetWeight : weight, species, condition);
  }, [condition, lactating, offspring, species, targetWeight, week, weight, weightLossSelected]);
  const guaranteedAnalysis = useMemo(() => calculateGuaranteedAnalysis(analysis), [analysis]);
  const selectedFoodEnergy = useMemo(() => selectFoodEnergy({
    manufacturerEnabled,
    manufacturerKcalKg,
    manufacturerUnit,
    guaranteedAnalysisEnabled: analysisEnabled,
    guaranteedAnalysis,
  }), [analysisEnabled, guaranteedAnalysis, manufacturerEnabled, manufacturerKcalKg, manufacturerUnit]);
  const feedingAmount = useMemo(() => calculateFeedingAmount(dailyEnergy, selectedFoodEnergy?.kcalKg ?? null), [dailyEnergy, selectedFoodEnergy]);

  const weightValue = parseFiniteNumber(weight);
  const weightError = weight !== "" && (weightValue === null || weightValue <= 0)
    ? "Enter a body weight greater than 0 kg."
    : undefined;
  const targetWeightValue = parseFiniteNumber(targetWeight);
  const targetWeightError = weightLossSelected && targetWeight !== "" && (targetWeightValue === null || targetWeightValue <= 0)
    ? "Enter a target weight greater than 0 kg."
    : undefined;
  const manufacturerValue = parseFiniteNumber(manufacturerKcalKg);
  const manufacturerError = manufacturerEnabled && manufacturerKcalKg !== "" && (manufacturerValue === null || manufacturerValue <= 0)
    ? "Enter a caloric density greater than 0 kcal/kg."
    : undefined;

  function changeSpecies(next: Species) {
    setSpecies(next);
    setCondition(Object.keys(activityFactors[next])[0]);
    setWeek(1);
  }

  function changeAnalysis(field: keyof GuaranteedAnalysisInput, value: string) {
    setAnalysis((current) => ({ ...current, [field]: value }));
  }

  const foodMessage = !manufacturerEnabled && !analysisEnabled
    ? "Enter the food’s caloric value or Guaranteed Analysis to estimate the feeding amount."
    : selectedFoodEnergy === null
      ? "Complete a valid food-energy source to estimate the feeding amount."
      : null;
  const hasMobileResult = Boolean(dailyEnergy && feedingAmount);
  const patientDescription = lactating
    ? `Lactating · ${offspring} offspring · week ${week}`
    : condition;
  const consultationSummary = dailyEnergy && feedingAmount && selectedFoodEnergy
    ? [
        "CaloriVet consultation summary",
        `Patient: ${petName.trim() || "Not provided"}`,
        `Species: ${species}`,
        `Current body weight: ${formatNumber(Number(weight), 2)} kg`,
        ...(weightLossSelected ? [`Target / ideal body weight: ${formatNumber(Number(targetWeight), 2)} kg`] : []),
        `Patient status: ${patientDescription}`,
        `RER: ${formatNumber(dailyEnergy.rer)} kcal/day`,
        `Estimated starting requirement: ${formatEstimate(dailyEnergy.minimum, dailyEnergy.maximum, "kcal/day")}`,
        `Calculation basis: ${dailyEnergy.calculation === "factor" && dailyEnergy.factorMinimum !== null && dailyEnergy.factorMaximum !== null ? formatFactor(dailyEnergy.factorMinimum, dailyEnergy.factorMaximum) : "Species-specific lactation equation"}`,
        `Food energy: ${formatNumber(selectedFoodEnergy.kcalKg)} kcal/kg (${selectedFoodEnergy.source === "manufacturer" ? "manufacturer provided" : "estimated from Guaranteed Analysis"})`,
        `Estimated feeding amount: ${formatEstimate(feedingAmount.minimum, feedingAmount.maximum, "g/day")}`,
        ...(!isSingleValue(feedingAmount.minimum, feedingAmount.maximum) ? [`Feeding midpoint: ${formatNumber(feedingAmount.midpoint)} g/day`] : []),
        "",
        clinicalDisclaimerText,
      ].join("\n")
    : "";

  function resetPatient() {
    setSpecies("Dog");
    setWeight("");
    setTargetWeight("");
    setPetName("");
    setCondition("Intact adult");
    setLactating(false);
    setManufacturerEnabled(false);
    setManufacturerKcalKg("");
    setManufacturerUnit("kcal/kg");
    setAnalysisEnabled(false);
    setAnalysis(emptyAnalysis);
    setOffspring(5);
    setWeek(1);
    setCopyStatus("Copy summary");
  }

  async function copyConsultationSummary() {
    if (!consultationSummary) return;
    try {
      await navigator.clipboard.writeText(consultationSummary);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy summary"), 1800);
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <main className={hasMobileResult ? "has-mobile-result" : undefined}>
      <a className="skip-link" href="#calculator">Skip to calculator</a>

      <section className="intro" id="top" aria-labelledby="page-title">
        <h1 id="page-title">{calculator.brand}</h1>
        <p>{calculator.name}</p>
        <p className="calculator-species">Dogs &amp; Cats</p>
        <details className="calculator-purpose">
          <summary>What is this calculator for?</summary>
          <div className="purpose-card">
            <p>Estimates daily calorie needs and a starting feeding amount in g/day for dogs and cats using manufacturer food energy or Guaranteed Analysis.</p>
            <p><b>Patient energy method:</b> Using AAHA 2021 as the primary clinical framework, with FEDIAF 2025, Merck and WSAVA as supporting references, RER (resting energy requirement) = 70 × body weight (kg)<sup>0.75</sup>. Routine MER estimates apply the selected species and life-stage factor or published factor range directly. Lactating patients use the existing species-specific equation with litter size and lactation week.</p>
            <p><b>Biological variability:</b> Published guidance notes that maintenance needs may vary by approximately ±30% in dogs and ±50% in cats. This variability is for monitoring and adjustment—not an extra range applied to the calculator result.</p>
            <p><b>Guaranteed Analysis method:</b> Food energy is estimated with the AAFCO Modified Atwater formula: ME (kcal/kg) = 10 × [(3.5 × protein) + (8.5 × fat) + (3.5 × NFE)]. NFE is calculated carbohydrate.</p>
            <ReferenceList references={calorieReferences} />
          </div>
        </details>
      </section>

      <div className="workflow" id="calculator">
          <section className="workflow-card patient-card" aria-labelledby="patient-heading">
            <div className="patient-heading-row">
              <StepHeader id="patient-heading" number="01" title="Patient information" copy="Start with body weight and species, then choose the applicable life-stage details." />
              <button className="reset-button" type="button" onClick={resetPatient}>Start new patient</button>
            </div>
            <div className="patient-grid">
              <NumberField id="body-weight" label="Current body weight" value={weight} onChange={setWeight} suffix="kg" min="0.01" step="0.01" error={weightError} primary />
              <SpeciesPicker value={species} onChange={changeSpecies} prefix="patient" />
              <label className="field pet-name-field" htmlFor="pet-name">
                <span>Pet name <small>(optional)</small></span>
                <input id="pet-name" className="text-input" type="text" value={petName} maxLength={60} autoComplete="off" placeholder="e.g. Milo" onChange={(event) => setPetName(event.target.value)} />
              </label>
              <label className="source-option lactation-option">
                <input type="checkbox" checked={lactating} onChange={(event) => setLactating(event.target.checked)} />
                <span><b>Lactating patient</b><small>Add litter size and lactation week to use the lactation energy calculation</small></span>
              </label>
              {lactating ? (
                <div className="lactation-fields">
                  <label className="field" htmlFor="offspring"><span>Number of offspring</span><select id="offspring" value={offspring} onChange={(event) => setOffspring(Number(event.target.value))}>{offspringEnergy[species].map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
                  <label className="field" htmlFor="lactation-week"><span>Lactation week</span><select id="lactation-week" value={week} onChange={(event) => setWeek(Number(event.target.value))}>{lactationWeekFactor[species].map((_, index) => <option key={index + 1} value={index + 1}>Week {index + 1}</option>)}</select></label>
                </div>
              ) : (
                <>
                  <label className="field condition-field" htmlFor="condition">
                    <span>Condition / life stage</span>
                    <select id="condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
                      {Object.keys(activityFactors[species]).map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  {weightLossSelected && <TargetWeightField currentWeight={weight} value={targetWeight} onChange={setTargetWeight} error={targetWeightError} />}
                </>
              )}
            </div>
            {dailyEnergy ? (
              <EnergyResult {...dailyEnergy} />
            ) : (
              <div className="pending-result" aria-live="polite"><span>Estimated daily energy requirement</span><p>{weightLossSelected && weightValue !== null && weightValue > 0 ? "Enter a valid target / ideal body weight to calculate kcal/day." : "Enter a valid current body weight to calculate kcal/day."}</p></div>
            )}
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card" aria-labelledby="food-heading">
            <StepHeader id="food-heading" number="02" title="Food energy information" copy="Use a manufacturer value when available, or estimate energy from Guaranteed Analysis." />
            <FoodEnergyControls
              idPrefix="standard"
              manufacturerEnabled={manufacturerEnabled}
              onManufacturerEnabledChange={setManufacturerEnabled}
              manufacturerValue={manufacturerKcalKg}
              onManufacturerValueChange={setManufacturerKcalKg}
              manufacturerUnit={manufacturerUnit}
              onManufacturerUnitChange={setManufacturerUnit}
              manufacturerError={manufacturerError}
              analysisEnabled={analysisEnabled}
              onAnalysisEnabledChange={setAnalysisEnabled}
              analysis={analysis}
              onAnalysisChange={changeAnalysis}
              onClearAnalysis={() => setAnalysis(emptyAnalysis)}
              guaranteedAnalysis={guaranteedAnalysis}
              selectedFoodEnergy={selectedFoodEnergy}
              foodMessage={foodMessage}
            />
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card feeding-card" aria-labelledby="feeding-heading">
            <StepHeader id="feeding-heading" number="03" title="Estimated feeding amount" copy="Calculated only when valid patient and food-energy information are available." />
            {feedingAmount ? (
              <>
                <FeedingResult {...feedingAmount} />
                <ClinicalDisclaimer />
                <div className="consultation-actions">
                  <div><b>Consultation summary</b><small>Includes patient details, energy, food density and feeding estimate.</small></div>
                  <button type="button" onClick={copyConsultationSummary}>{copyStatus}</button>
                  <button type="button" onClick={() => window.print()}>Print</button>
                </div>
              </>
            ) : (
              <div className="pending-result final-pending" aria-live="polite">
                <span>Estimated amount to feed</span>
                <p>{dailyEnergy ? (foodMessage ?? "Correct the invalid food-energy entry to continue.") : "Enter a valid body weight and food-energy information to calculate g/day."}</p>
              </div>
            )}
          </section>
      </div>

      {dailyEnergy && feedingAmount && (
        <aside className="mobile-result-bar" aria-label="Current calculation result" aria-live="polite">
          <div><span>Energy</span><strong>{formatEstimate(dailyEnergy.minimum, dailyEnergy.maximum, "kcal/day")}</strong></div>
          <div><span>Feed midpoint</span><strong>{formatNumber(feedingAmount.midpoint)} g/day</strong></div>
        </aside>
      )}

      {dailyEnergy && feedingAmount && selectedFoodEnergy && (
        <section className="print-summary">
          <h1>CaloriVet consultation summary</h1>
          <dl>
            <div><dt>Patient</dt><dd>{petName.trim() || "Not provided"}</dd></div>
            <div><dt>Species</dt><dd>{species}</dd></div>
            <div><dt>Current body weight</dt><dd>{formatNumber(Number(weight), 2)} kg</dd></div>
            {weightLossSelected && <div><dt>Target / ideal body weight</dt><dd>{formatNumber(Number(targetWeight), 2)} kg</dd></div>}
            <div><dt>Patient status</dt><dd>{patientDescription}</dd></div>
            <div><dt>RER</dt><dd>{formatNumber(dailyEnergy.rer)} kcal/day</dd></div>
            <div><dt>Starting requirement</dt><dd>{formatEstimate(dailyEnergy.minimum, dailyEnergy.maximum, "kcal/day")}</dd></div>
            <div><dt>Calculation basis</dt><dd>{dailyEnergy.calculation === "factor" && dailyEnergy.factorMinimum !== null && dailyEnergy.factorMaximum !== null ? formatFactor(dailyEnergy.factorMinimum, dailyEnergy.factorMaximum) : "Species-specific lactation equation"}</dd></div>
            <div><dt>Food energy</dt><dd>{formatNumber(selectedFoodEnergy.kcalKg)} kcal/kg</dd></div>
            <div><dt>Feeding amount</dt><dd>{formatEstimate(feedingAmount.minimum, feedingAmount.maximum, "g/day")}</dd></div>
            {!isSingleValue(feedingAmount.minimum, feedingAmount.maximum) && <div><dt>Feeding midpoint</dt><dd>{formatNumber(feedingAmount.midpoint)} g/day</dd></div>}
          </dl>
          <p>{clinicalDisclaimerText}</p>
        </section>
      )}

      <footer>
        <p>CaloriVet · Veterinary nutrition estimates for dogs and cats</p>

      </footer>
    </main>
  );
}
