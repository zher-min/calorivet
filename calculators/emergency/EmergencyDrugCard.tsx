"use client";

import { useId, useMemo, useState } from "react";
import { calculateDextroseDilution, calculateEmergencyDose, calculateLipidInfusion, formatEmergencyNumber, formatRange } from "./calculations";
import type { ConcentrationDefinition, DoseOption, EmergencySpecies, EmergencyTreatment } from "./types";

const displayDoseUnit = (unit: string) => unit.replaceAll("mcg", "µg");
const positiveNumber = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

function InfoTooltip({ treatment }: { treatment: EmergencyTreatment }) {
  return <details className="em-info">
    <summary aria-label={`About ${treatment.drugName}`}>ⓘ</summary>
    <div><p><strong>Use:</strong> {treatment.tooltip.use}</p><p><strong>Action:</strong> {treatment.tooltip.action}</p>
      <p><strong>Major caution:</strong> {treatment.tooltip.caution}</p><p><strong>Practical note:</strong> {treatment.tooltip.practical}</p>
      {treatment.reference && <p className="em-reference">{treatment.reference}{treatment.referenceYear ? ` · ${treatment.referenceYear}` : ""}</p>}
    </div>
  </details>;
}

function DoseBlock({ option, weightKg, concentration, concentrationDefinition }: { option: DoseOption; weightKg: number | null; concentration: number | null; concentrationDefinition?: ConcentrationDefinition }) {
  const result = weightKg === null ? null : calculateEmergencyDose(weightKg, option, concentration, concentrationDefinition?.unit);
  const directVolume = option.doseUnit === "mL/kg";
  const perMinute = option.doseUnit === "mL/kg/min";
  const energy = option.doseUnit === "J/kg";
  const infusion = option.doseUnit.endsWith("/hr");
  const amountLabel = infusion ? "Dose rate" : energy ? "Energy" : directVolume ? "Volume" : "Calculated dose";
  const amountUnit = result?.amountUnit ?? (perMinute ? "mL/min" : energy ? "J" : option.doseUnit.split("/")[0].replace("mcg", "µg"));
  const volumeText = result?.volumeMinMl !== null && result?.volumeMinMl !== undefined && result?.volumeMaxMl !== null && result?.volumeMaxMl !== undefined
    ? formatRange(result.volumeMinMl, result.volumeMaxMl, "volume") : "--";
  const micro = result?.volumeMinMl !== null && result?.volumeMinMl !== undefined && result.volumeMinMl < 0.1;
  const lipid = option.durationMinutes && weightKg !== null ? calculateLipidInfusion(weightKg, option.doseMin, option.durationMinutes) : null;
  return <div className="em-dose-block">
    <div className="em-dose-heading"><strong>{option.label}</strong><span>{option.route}</span></div>
    <p className="em-locked-dose">{option.doseMin}{option.doseMax !== undefined ? `–${option.doseMax}` : ""} {displayDoseUnit(option.doseUnit)}</p>
    <dl className="em-calculation-lines">
      <div><dt>{amountLabel}</dt><dd>{result ? formatRange(result.amountMin, result.amountMax) : "--"} {amountUnit}</dd></div>
      {perMinute && <><div><dt>Infusion rate</dt><dd>{result ? formatRange(result.amountMin, result.amountMax, "volume") : "--"} mL/min</dd></div>
        <div><dt>Hourly rate</dt><dd>{result?.volumePerHourMin !== null && result?.volumePerHourMin !== undefined && result?.volumePerHourMax !== null && result?.volumePerHourMax !== undefined ? formatRange(result.volumePerHourMin, result.volumePerHourMax, "volume") : "--"} mL/hr</dd></div></>}
    </dl>
    {!directVolume && !perMinute && !energy && <div className="em-give"><span>{infusion ? "RATE" : "GIVE"}</span><strong>{volumeText} {infusion ? "mL/hr" : "mL"}</strong></div>}
    {directVolume && <div className="em-give"><span>GIVE</span><strong>{result ? formatRange(result.amountMin, result.amountMax, "volume") : "--"} mL</strong></div>}
    {energy && <div className="em-give"><span>{option.label.toUpperCase()}</span><strong>{result ? formatRange(result.amountMin, result.amountMax) : "--"} J</strong></div>}
    {lipid && <div className="em-lipid-total"><span>Infusion volume over {option.durationMinutes?.[0]}–{option.durationMinutes?.[1]} min</span><strong>{formatRange(lipid.totalMinMl, lipid.totalMaxMl, "volume")} mL</strong></div>}
    {option.administration && <p className="em-admin-note">{option.administration}</p>}
    {micro && <p className={`em-volume-warning${result && result.volumeMinMl !== null && result.volumeMinMl < 0.05 ? " em-volume-warning-strong" : ""}`}>Very small calculated volume — verify concentration and consider appropriate dilution before administration.</p>}
  </div>;
}

export default function EmergencyDrugCard({ treatment, species, weightKg, concentrationDefinition, concentrationValue, onConcentrationChange, onResetConcentration }: {
  treatment: EmergencyTreatment;
  species: EmergencySpecies;
  weightKg: number | null;
  concentrationDefinition?: ConcentrationDefinition;
  concentrationValue?: string;
  onConcentrationChange?: (value: string) => void;
  onResetConcentration?: () => void;
}) {
  const concentrationId = useId();
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [alreadyGiven, setAlreadyGiven] = useState("");
  const [dilutionTarget, setDilutionTarget] = useState<number | null>(null);
  const options = useMemo(() => treatment.doseOptions.filter(option => !option.species || option.species.includes(species)), [treatment, species]);
  const selectedOption = options.find(option => option.id === selectedOptionId) ?? options[0];
  const shownOptions = treatment.displayAllOptions ? options : selectedOption ? [selectedOption] : [];
  const concentration = concentrationValue === undefined ? null : positiveNumber(concentrationValue);
  const concentrationInvalid = concentrationValue !== undefined && concentrationValue !== "" && concentration === null;
  const selectedResult = selectedOption && weightKg !== null ? calculateEmergencyDose(weightKg, selectedOption, concentration, concentrationDefinition?.unit) : null;
  const dilutionMin = dilutionTarget && concentration && selectedResult?.volumeMinMl != null ? calculateDextroseDilution(selectedResult.volumeMinMl, concentration, dilutionTarget) : null;
  const dilutionMax = dilutionTarget && concentration && selectedResult?.volumeMaxMl != null ? calculateDextroseDilution(selectedResult.volumeMaxMl, concentration, dilutionTarget) : null;
  const already = positiveNumber(alreadyGiven) ?? 0;
  const remaining = treatment.cumulativeMaxMgKg !== undefined ? Math.max(0, treatment.cumulativeMaxMgKg - already) : null;

  return <article className={`em-drug-card${treatment.dominant ? " em-drug-card-dominant" : ""}`}>
    <header className="em-drug-header"><div><span>{treatment.indication}</span><h3>{treatment.drugName} <InfoTooltip treatment={treatment} /></h3></div></header>
    {!treatment.displayAllOptions && options.length > 1 && <fieldset className="em-route-selector"><legend>Route</legend><div>{options.map(option => <button key={option.id} type="button" aria-pressed={selectedOption?.id === option.id} onClick={() => setSelectedOptionId(option.id)}>{option.label}</button>)}</div></fieldset>}
    {concentrationDefinition && <div className="em-concentration">
      <label htmlFor={concentrationId}>Clinic stock concentration <span aria-hidden="true">✎</span></label>
      <div><input id={concentrationId} type="number" inputMode="decimal" min="0" step="any" value={concentrationValue ?? ""} onChange={event => onConcentrationChange?.(event.target.value)} aria-invalid={concentrationInvalid} />
        <span>{concentrationDefinition.unit}</span></div>
      {concentrationInvalid && <small>Enter a concentration greater than 0.</small>}
      <button type="button" onClick={onResetConcentration}>Reset to reference concentration</button>
    </div>}
    {treatment.fixedFormulation && <p className="em-fixed-formulation">Formulation: <strong>{treatment.fixedFormulation}</strong></p>}
    <div className="em-dose-list">{shownOptions.map(option => <DoseBlock key={option.id} option={option} weightKg={weightKg} concentration={concentration} concentrationDefinition={concentrationDefinition} />)}</div>
    {treatment.cumulativeMaxMgKg !== undefined && <div className="em-cumulative">
      <label>Already given <span><input type="number" inputMode="decimal" min="0" step="any" value={alreadyGiven} onChange={event => setAlreadyGiven(event.target.value)} /> mg/kg</span></label>
      <div><span>Current cumulative dose</span><strong>{formatEmergencyNumber(already)} mg/kg</strong></div>
      <div><span>Remaining before {treatment.cumulativeMaxMgKg} mg/kg</span><strong>{formatEmergencyNumber(remaining ?? 0)} mg/kg</strong></div>
    </div>}
    {treatment.concentrationKey === "dextrose" && selectedResult?.volumeMinMl != null && <div className="em-dilution">
      <span>Optional dilution</span><div>{[25, 12.5].map(target => <button type="button" key={target} aria-pressed={dilutionTarget === target} onClick={() => setDilutionTarget(current => current === target ? null : target)}>{concentration ?? concentrationDefinition?.referenceValue ?? 50}% → {target}%</button>)}</div>
      {dilutionTarget && (dilutionMin && dilutionMax ? <dl><div><dt>Add diluent</dt><dd>{formatRange(dilutionMin.diluentVolumeMl, dilutionMax.diluentVolumeMl, "volume")} mL</dd></div><div><dt>Final diluted volume</dt><dd>{formatRange(dilutionMin.finalVolumeMl, dilutionMax.finalVolumeMl, "volume")} mL</dd></div></dl> : <p>Stock concentration must be greater than the selected final concentration.</p>)}
    </div>}
    {treatment.note && <p className="em-note">{treatment.note}</p>}
    {treatment.warnings?.map((warning, index) => <p className={`em-warning em-warning-${warning.level}`} key={index}><strong>{warning.level.toUpperCase()}</strong>{warning.text}</p>)}
  </article>;
}
